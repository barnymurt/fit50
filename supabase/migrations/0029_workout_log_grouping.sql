-- 0029_workout_log_grouping.sql
--
-- One user has up to three rows per day in workout_log — one for
-- bodyweight, one for kettlebell, one for resistance band. The old
-- unique constraint (user_id, date_key, line) allowed multiple
-- rows per (user_id, date_key) since line was just "A"/"B"/"C"/"D"
-- with no grouping distinction. We add grouping, merge the existing
-- duplicates, then add a per-grouping unique index.
--
-- Run order:
--   1. Add grouping column (nullable default 'bodyweight').
--   2. Recursive CTE merge — for each (user_id, date_key) pair with
--      multiple bodyweight rows, keep the most-recently-updated row's
--      id and accumulate all `sets` blobs into it via jsonb ||.
--   3. Delete the now-redundant bodyweight rows.
--   4. Drop the old unique constraint, add the new per-grouping one.
--
-- After this migration runs, the client UPSERTs with onConflict
-- 'user_id,date_key,grouping' (was 'user_id,date_key,line'). See
-- src/hooks/useTrackerState.ts or wherever the workout_log upsert
-- lives.

ALTER TABLE workout_log
  ADD COLUMN IF NOT EXISTS grouping text NOT NULL DEFAULT 'bodyweight';

-- Recursive CTE: anchor on the most-recent row per pair, then OR-fold
-- the remaining rows' sets into it. The anchor's id propagates
-- through every recursive step so the UPDATE below targets the
-- single surviving row per pair.
WITH RECURSIVE ordered AS (
  SELECT
    w.id, w.user_id, w.date_key, w.sets, w.line, w.updated_at,
    ROW_NUMBER() OVER (
      PARTITION BY w.user_id, w.date_key
      ORDER BY w.updated_at DESC, w.id
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
  SELECT user_id, date_key, id, rn, sets, line FROM ordered WHERE rn = 1
  UNION ALL
  SELECT m.user_id, m.date_key, m.id, o.rn, m.sets || o.sets, o.line
  FROM merged m
  JOIN ordered o
    ON o.user_id = m.user_id AND o.date_key = m.date_key AND o.rn = m.rn + 1
),
finalised AS (
  SELECT DISTINCT ON (user_id, date_key) user_id, date_key, id, sets, line
  FROM merged
  ORDER BY user_id, date_key, rn DESC
)
UPDATE workout_log dst
SET sets = f.sets,
    line = f.line,
    updated_at = NOW()
FROM finalised f
WHERE dst.id = f.id;

-- Delete the now-redundant bodyweight rows. Keep the row with the
-- smallest id (typically the most-recent, since UUIDv4 isn't strictly
-- time-ordered but our migration order is consistent).
DELETE FROM workout_log w
USING (
  SELECT user_id, date_key, MIN(id::text)::uuid AS keep_id, COUNT(*) AS n
  FROM workout_log
  WHERE grouping = 'bodyweight'
  GROUP BY user_id, date_key
  HAVING COUNT(*) > 1
) m
WHERE w.user_id = m.user_id
  AND w.date_key = m.date_key
  AND w.id != m.keep_id;

-- Safe to add the per-grouping unique index now that bodyweight rows
-- have been merged.
DROP INDEX IF EXISTS workout_log_user_id_date_key_line_key;
CREATE UNIQUE INDEX IF NOT EXISTS workout_log_user_day_grouping_idx
  ON workout_log (user_id, date_key, grouping);

comment on column public.workout_log.grouping is
  'Which equipment grouping this row tracks: bodyweight / kettlebell
   / band. One row per (user_id, date_key, grouping).';