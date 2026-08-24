-- 0021_food_log_update_policy.sql
--
-- The food_log table was set up in 0003 with SELECT / INSERT /
-- DELETE policies but no UPDATE policy. That meant the meal-slot
-- dropdown in "Logged today" silently failed at the RLS layer and
-- the change never persisted. Add the missing UPDATE policy.

drop policy if exists "Users can update their own food log entries" on public.food_log;
create policy "Users can update their own food log entries"
  on public.food_log
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);