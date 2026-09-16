create table if not exists users (
  id text primary key,
  telegram_id bigint not null unique,
  display_name text not null check (char_length(display_name) between 1 and 64),
  tone text not null default 'coral',
  region_tier text not null default 'global',
  language_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists spaces (
  id text primary key,
  name text not null check (char_length(name) between 1 and 24),
  type text not null check (type in ('pair', 'friends', 'family')),
  style text not null default 'a',
  stage text not null default 'egg',
  character_name text not null default 'Cozy Dreamer',
  room text not null default 'warm',
  timezone text not null default 'UTC',
  days_alive integer not null default 1 check (days_alive > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists space_members (
  space_id text not null references spaces(id) on delete cascade,
  user_id text not null references users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (space_id, user_id)
);

create index if not exists space_members_user_idx on space_members(user_id);

create table if not exists invitations (
  id text primary key,
  space_id text not null references spaces(id) on delete cascade,
  created_by text not null references users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  accepted_by text references users(id) on delete set null,
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists daily_checkins (
  id text primary key,
  space_id text not null references spaces(id) on delete cascade,
  local_date date not null,
  user_id text not null references users(id) on delete cascade,
  mood text not null,
  energy text not null,
  want text not null,
  note_ciphertext text,
  note_iv text,
  note_auth_tag text,
  guess text,
  revealed_at timestamptz,
  client_mutation_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (space_id, local_date, user_id),
  unique (user_id, client_mutation_id)
);

create table if not exists story_entries (
  id text primary key,
  space_id text not null references spaces(id) on delete cascade,
  source_type text not null,
  source_id text not null,
  local_date date not null,
  type text not null,
  title text not null,
  body text not null,
  tone text not null,
  created_by text references users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (space_id, source_type, source_id)
);

create table if not exists activity_catalog (
  id text primary key,
  title text not null,
  description text not null,
  tags text[] not null default '{}',
  is_active boolean not null default true
);

create table if not exists planned_activities (
  space_id text not null references spaces(id) on delete cascade,
  activity_id text not null references activity_catalog(id),
  created_by text not null references users(id),
  client_mutation_id text not null,
  created_at timestamptz not null default now(),
  primary key (space_id, activity_id),
  unique (created_by, client_mutation_id)
);

create table if not exists daily_questions (
  id text primary key,
  prompt text not null,
  options jsonb not null,
  is_active boolean not null default true
);

create table if not exists question_answers (
  space_id text not null references spaces(id) on delete cascade,
  local_date date not null,
  question_id text not null references daily_questions(id),
  user_id text not null references users(id) on delete cascade,
  answer text not null,
  created_at timestamptz not null default now(),
  primary key (space_id, local_date, question_id, user_id)
);

create table if not exists who_votes (
  space_id text not null references spaces(id) on delete cascade,
  local_date date not null,
  prompt_id text not null,
  user_id text not null references users(id) on delete cascade,
  vote text not null,
  created_at timestamptz not null default now(),
  primary key (space_id, local_date, prompt_id, user_id)
);

create table if not exists analytics_events (
  id text primary key,
  user_id text references users(id) on delete set null,
  space_id text references spaces(id) on delete set null,
  name text not null,
  properties jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
