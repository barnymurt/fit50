-- Allow paired buddies to read each other's profile + tracker progress.
--
-- The "buddy pair" feature has two views that need cross-account reads:
--   - MyMotivator (buddy view) — shows the buyer's display_name, day,
--     streak, and 9-cell habit grid. Reads profiles + tracker_progress
--     for the user identified by purchased_by_user_id.
--   - BuddyCard (buyer view) — shows the buddy's display_name and day.
--     Reads profiles + tracker_progress for the user identified by
--     buddy_user_id.
--
-- Both are gated on profiles.buddy_user_id / profiles.purchased_by_user_id
-- being set, which only happens through the Stripe webhook + activation
-- flow. The pair is always exactly two users — no leakage to third
-- parties.
--
-- IMPORTANT: We deliberately do NOT extend read access to food_log,
-- water_log, macro_profile, weight, etc. The motivation card's contract
-- is "9 cells, no drill-down" — buddies see the line, not the data.

-- ----------------------------------------------------------------------------
-- profiles: a user can read a paired buddy's profile.
-- ----------------------------------------------------------------------------

drop policy if exists "buddy pairs can read each other's profiles" on public.profiles;

create policy "buddy pairs can read each other's profiles"
  on public.profiles for select
  using (
    -- I bought a buddy → I can read their profile
    id in (
      select buddy_user_id from public.profiles where id = auth.uid()
    )
    -- Someone bought me → they can read my profile (and I can read theirs)
    or id in (
      select purchased_by_user_id from public.profiles where id = auth.uid()
    )
  );

-- ----------------------------------------------------------------------------
-- tracker_progress: same pair rule, so the buddy can see the 9-cell grid.
-- ----------------------------------------------------------------------------

drop policy if exists "buddy pairs can read each other's tracker progress" on public.tracker_progress;

create policy "buddy pairs can read each other's tracker progress"
  on public.tracker_progress for select
  using (
    user_id in (
      select buddy_user_id from public.profiles where id = auth.uid()
    )
    or user_id in (
      select purchased_by_user_id from public.profiles where id = auth.uid()
    )
  );
