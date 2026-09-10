-- 0029_workout_log_grouping.sql
--
-- One user has up to three rows per day in workout_log — one for
-- bodyweight, one for kettlebell, one for resistance band. The
-- existing PK is (user_id, date_key, line); grouping is new and
-- distinct.
--
-- Existing rows may have multiple (user_id, date_key, line='A'),
-- (line='B'), (line='C'), (line='D') entries from the same day
-- (one per worked line). We merge them into a single
-- (user_id, date_key, grouping='bodyweight') row that keeps the
-- most recently-touched `line` and the union of all the sets.
--
-- workout_log has NO `id` column — the PK is the (user_id,
-- date_key, line) composite. The merge uses ctid to identify
-- surviving rows for the DELETE step; the UPDATE targets only
-- the kept row (rn=1 per pair).

ALTER TABLE workout_log
  ADD COLUMN IF NOT EXISTS grouping text NOT NULL DEFAULT 'bodyweight';

-- CTE: pick one row per (user_id, date_key) (rn=1, the most
-- recently touched), then OR-fold the remaining rows' sets into
-- it via the jsonb || operator (which merges top-level keys, with
-- later operands overriding earlier ones — for our use case the
-- keys are exercise names and exercise names don't overlap across
-- the user's A/B/C/D lines within a day).
WITH RECURSIVE ordered AS (
  SELECT
    w.user_id, w.date_key, w.line, w.sets, w.updated_at,
    ROW_NUMBER() OVER (
      PARTITION BY w.user_id, w.date_key
      ORDER BY w.updated_at DESC
    ) AS rn
  FROM workout_log w
  WHERE w.grouping = 'bodyweight'
    AND (w.user_id, w.date_key) IN (
      SELECT user_id, date_key FROM workout_log
      WHERE grouping = 'bodyweight'
      GROUP BY user_id, date_key HAVING COUNT(*) > 1
    )
),
merged AS (
  -- Anchor: most-recently-touched row per pair. Keep its line —
  -- it represents "what the user was last working on".
  SELECT user_id, date_key, line, rn, sets
  FROM ordered WHERE rn = 1
  UNION ALL
  -- Recursive: fold the next row's sets into the accumulator.
  -- The anchor's line propagates through every step so all sets
  -- land in the kept row regardless of which line they came from.
  SELECT m.user_id, m.date_key, m.line, o.rn, m.sets || o.sets
  FROM merged m
  JOIN ordered o
    ON o.user_id = m.user_id AND o.date_key = m.date_key
   AND o.rn = m.rn + 1
),
finalised AS (
  -- The recursion emits one row per step per pair; the deepest
  -- step (highest rn) has the fully-merged sets.
  SELECT DISTINCT ON (user_id, date_key) user_id, date_key, line, sets
  FROM merged
  ORDER BY user_id, date_key, rn DESC
),
ranked AS (
  -- Re-rank all bodyweight rows by (user_id, date_key, updated_at
  -- DESC) so we can target the kept row with the UPDATE. user_id
  -- and date_key are projected (not just in PARTITION BY) so the
  -- UPDATE below can join on them.
  SELECT
    user_id,
    date_key,
    ctid,
    ROW_NUMBER() OVER (PARTITION BY user_id, date_key ORDER BY updated_at DESC, ctid) AS rn
  FROM workout_log
  WHERE grouping = 'bodyweight'
)
-- Update only the kept row (rn=1) with the finalised merged
-- sets. The other rows in the pair are about to be deleted below.
UPDATE workout_log dst
SET sets = f.sets,
    line = f.line,
    updated_at = NOW()
FROM finalised f
JOIN ranked r
  ON r.user_id = f.user_id AND r.date_key = f.date_key AND r.rn = 1
WHERE dst.ctid = r.ctid;

-- Delete the now-redundant bodyweight rows (keep only the rn=1
-- row per (user_id, date_key)). The kept row has the merged sets.
DELETE FROM workout_log dst
USING ranked
WHERE dst.ctid = ranked.ctid
  AND ranked.rn > 1
  AND dst.grouping = 'bodyweight';

DROP INDEX IF EXISTS workout_log_user_id_date_key_line_key;
CREATE UNIQUE INDEX IF NOT EXISTS workout_log_user_day_grouping_idx
  ON workout_log (user_id, date_key, grouping);

comment on column public.workout_log.grouping is
  'Which equipment grouping this row tracks: bodyweight / kettlebell
   / band. One row per (user_id, date_key, grouping).';