alter table purchases add column if not exists recipient_user_id text references users(id) on delete set null;

create table if not exists daily_earn_totals (
  user_id text not null references users(id) on delete cascade,
  local_date date not null,
  total integer not null default 0 check (total >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, local_date)
);

create table if not exists reward_action_guards (
  user_id text not null references users(id) on delete cascade,
  local_date date not null,
  action_type text not null,
  action_key text not null,
  rewarded_at timestamptz not null default now(),
  primary key (user_id, local_date, action_type, action_key)
);

create index if not exists reward_action_guards_cooldown_idx on reward_action_guards (user_id, local_date, action_type, rewarded_at);
