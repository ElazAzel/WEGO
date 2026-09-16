create table if not exists sessions (
  token_hash text primary key,
  user_id text not null references users(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create index if not exists sessions_user_idx on sessions(user_id);
create index if not exists sessions_expiry_idx on sessions(expires_at);

create table if not exists world_commands (
  space_id text not null references spaces(id) on delete cascade,
  command_id text not null,
  actor_id text not null references users(id) on delete cascade,
  expected_revision integer not null check (expected_revision >= 0),
  resulting_revision integer not null check (resulting_revision > 0),
  action jsonb not null,
  result jsonb not null,
  created_at timestamptz not null default now(),
  primary key (space_id, command_id),
  unique (space_id, resulting_revision)
);

create table if not exists shared_plans (
  id text primary key,
  space_id text not null references spaces(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  planned_for date not null,
  created_by text not null references users(id),
  completed_by text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists shared_plans_space_date_idx on shared_plans(space_id, planned_for);

create table if not exists pair_game_sessions (
  id text primary key,
  space_id text not null references spaces(id) on delete cascade,
  game_type text not null,
  status text not null,
  created_by text not null references users(id),
  answers jsonb not null default '{}'::jsonb,
  result jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists pair_games_space_status_idx on pair_game_sessions(space_id, status);
