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
-- date_key, line) composite. We use ctid to identify surviving
-- rows. The merge uses a TEMP TABLE so the kept-row set is
-- available to both the UPDATE (writing merged sets) and the
-- DELETE (removing duplicates) which are separate statements.

ALTER TABLE workout_log
  ADD COLUMN IF NOT EXISTS grouping text NOT NULL DEFAULT 'bodyweight';

-- Recursive CTE: pick one row per (user_id, date_key) (rn=1, the
-- most recently touched), then OR-fold the remaining rows' sets
-- into it via the jsonb || operator (top-level key merge — our
-- keys are exercise names which don't overlap across lines).
-- Each (user_id, date_key, line) tuple has the kept row carry
-- forward its line value throughout the recursion so all sets
-- from the day's different lines land in the kept row.
CREATE TEMP TABLE _workout_kept_bodyweight AS
WITH RECURSIVE ordered AS (
  SELECT
    w.user_id, w.date_key, w.line, w.sets, w.updated_at, w.ctid,
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
  -- Anchor: most-recently-touched row per pair. Keep its line and
  -- ctid — it represents "what the user was last working on".
  SELECT user_id, date_key, ctid, line, rn, sets
  FROM ordered WHERE rn = 1
  UNION ALL
  -- Recursive: fold the next row's sets into the accumulator.
  -- The anchor's line + ctid propagate through every step so all
  -- sets land in the kept row regardless of which line they came
  -- from.
  SELECT m.user_id, m.date_key, m.ctid, m.line, o.rn, m.sets || o.sets
  FROM merged m
  JOIN ordered o
    ON o.user_id = m.user_id AND o.date_key = m.date_key
   AND o.rn = m.rn + 1
)
SELECT DISTINCT ON (user_id, date_key) user_id, date_key, ctid, line, sets
FROM merged
ORDER BY user_id, date_key, rn DESC;

-- Step 1: update the kept row with the merged sets + the kept
-- line. The update matches by ctid (workout_log has no id).
UPDATE workout_log dst
SET sets = k.sets,
    line = k.line,
    updated_at = NOW()
FROM _workout_kept_bodyweight k
WHERE dst.ctid = k.ctid;

-- Step 2: delete the now-redundant bodyweight rows. Keep only the
-- row identified in _workout_kept_bodyweight; everything else with
-- grouping='bodyweight' for the same (user_id, date_key) is a
-- duplicate.
DELETE FROM workout_log dst
WHERE dst.grouping = 'bodyweight'
  AND NOT EXISTS (
    SELECT 1 FROM _workout_kept_bodyweight k
    WHERE k.user_id = dst.user_id
      AND k.date_key = dst.date_key
      AND k.ctid = dst.ctid
  );

DROP TABLE _workout_kept_bodyweight;

DROP INDEX IF EXISTS workout_log_user_id_date_key_line_key;
CREATE UNIQUE INDEX IF NOT EXISTS workout_log_user_day_grouping_idx
  ON workout_log (user_id, date_key, grouping);

comment on column public.workout_log.grouping is
  'Which equipment grouping this row tracks: bodyweight / kettlebell
   / band. One row per (user_id, date_key, grouping).';