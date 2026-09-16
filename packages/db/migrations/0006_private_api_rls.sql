-- WEGO is accessed through the private Fastify API, not directly from Supabase Data API clients.
-- Keep the public schema deny-by-default and let the API use its private database connection.
alter table users enable row level security;
alter table spaces enable row level security;
alter table space_members enable row level security;
alter table invitations enable row level security;
alter table daily_checkins enable row level security;
alter table story_entries enable row level security;
alter table activity_catalog enable row level security;
alter table planned_activities enable row level security;
alter table daily_questions enable row level security;
alter table question_answers enable row level security;
alter table who_votes enable row level security;
alter table analytics_events enable row level security;
alter table spark_wallets enable row level security;
alter table spark_ledger enable row level security;
alter table catalog_items enable row level security;
alter table purchases enable row level security;
alter table entitlements enable row level security;
alter table world_snapshots enable row level security;
alter table world_memories enable row level security;
alter table daily_earn_totals enable row level security;
alter table reward_action_guards enable row level security;
alter table sessions enable row level security;
alter table world_commands enable row level security;
alter table shared_plans enable row level security;
alter table pair_game_sessions enable row level security;

revoke all on table
  users,
  spaces,
  space_members,
  invitations,
  daily_checkins,
  story_entries,
  activity_catalog,
  planned_activities,
  daily_questions,
  question_answers,
  who_votes,
  analytics_events,
  spark_wallets,
  spark_ledger,
  catalog_items,
  purchases,
  entitlements,
  world_snapshots,
  world_memories,
  daily_earn_totals,
  reward_action_guards,
  sessions,
  world_commands,
  shared_plans,
  pair_game_sessions
from anon, authenticated;

create or replace function public.wego_has_space_access(target_space text)
returns boolean
language sql
stable
set search_path = pg_catalog, public
as $$
  select exists(
    select 1
    from public.space_members m
    where m.space_id = target_space
      and m.user_id = (select current_setting('wego.user_id', true))
  )
$$;

drop policy if exists foundation_records_access on foundation_records;
create policy foundation_records_access on foundation_records
using (
  (scope_kind = 'user' and scope_id = (select current_setting('wego.user_id', true)))
  or
  (scope_kind = 'space'
    and public.wego_has_space_access(scope_id)
    and (position(':' in collection) = 0 or split_part(collection, ':', 2) = scope_id)
  )
)
with check (
  (scope_kind = 'user' and scope_id = (select current_setting('wego.user_id', true)))
  or
  (scope_kind = 'space'
    and public.wego_has_space_access(scope_id)
    and (position(':' in collection) = 0 or split_part(collection, ':', 2) = scope_id)
  )
);
