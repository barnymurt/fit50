-- Fix infinite recursion in 0011.
--
-- The 0011 policies did `id in (select buddy_user_id from profiles where id
-- = auth.uid())` while being a policy ON profiles. Every read of profiles
-- re-evaluated the policy, which re-read profiles, etc. → 500 errors on
-- every profiles query (and every other query that joins profiles).
--
-- Wrap the lookup in a SECURITY DEFINER function so the policy's subquery
-- bypasses RLS. The function itself is locked down: it only accepts the
-- current auth.uid() and returns paired ids, nothing else.

-- ----------------------------------------------------------------------------
-- Helper: returns the profile ids the current user is paired with.
-- Bypasses RLS (security definer) to avoid recursion. Stable + grants
-- to authenticated only.
-- ----------------------------------------------------------------------------

create or replace function public.get_buddy_pair_ids()
returns table (target_id uuid)
language sql
security definer
set search_path = public
stable
as $$
  with me as (
    select buddy_user_id, purchased_by_user_id
    from public.profiles
    where id = auth.uid()
  )
  select buddy_user_id from me where buddy_user_id is not null
  union
  select purchased_by_user_id from me where purchased_by_user_id is not null
$$;

-- Only authenticated users can call it. anon has no business with paired ids.
revoke all on function public.get_buddy_pair_ids() from public;
grant execute on function public.get_buddy_pair_ids() to authenticated;

-- ----------------------------------------------------------------------------
-- profiles: a user can read a paired buddy's profile.
-- ----------------------------------------------------------------------------

drop policy if exists "buddy pairs can read each other's profiles" on public.profiles;

create policy "buddy pairs can read each other's profiles"
  on public.profiles for select
  using (id in (select target_id from public.get_buddy_pair_ids()));

-- ----------------------------------------------------------------------------
-- tracker_progress: same — paired buddies can read each other's progress.
-- ----------------------------------------------------------------------------

drop policy if exists "buddy pairs can read each other's tracker progress" on public.tracker_progress;

create policy "buddy pairs can read each other's tracker progress"
  on public.tracker_progress for select
  using (user_id in (select target_id from public.get_buddy_pair_ids()));
