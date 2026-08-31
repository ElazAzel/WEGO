-- Living room state is stored separately from daily check-ins so scene actions
-- can be replayed safely and legacy worlds can be normalized on read.
create table if not exists world_snapshots (
  space_id uuid primary key references spaces(id) on delete cascade,
  version integer not null default 1,
  environment jsonb not null default '{"lamp":"on","curtains":"open","table":"empty","plants":"healthy","window":"quiet"}'::jsonb,
  equipped_room_items jsonb not null default '{"sofa":null,"rug":null,"lamp":null,"table":null,"shelf":null,"plants":null,"wall":null}'::jsonb,
  equipped_wego_items jsonb not null default '{"outfit":"everyday","accessory":null,"emotion":null}'::jsonb,
  unlocked_item_ids jsonb not null default '["everyday"]'::jsonb,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists world_actions (
  space_id uuid not null references spaces(id) on delete cascade,
  action_id text not null,
  actor_user_id uuid not null references users(id) on delete cascade,
  action_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  primary key (space_id, action_id)
);

create index if not exists world_actions_space_created_idx on world_actions(space_id, created_at desc);
