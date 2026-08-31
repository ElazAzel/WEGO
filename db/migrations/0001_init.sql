create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  telegram_user_id bigint not null unique,
  display_name text not null,
  tone text not null default 'coral',
  created_at timestamptz not null default now()
);

create table if not exists spaces (
  id uuid primary key default gen_random_uuid(),
  name varchar(24) not null,
  type text not null check (type in ('pair', 'friends', 'family')),
  stage text not null default 'egg' check (stage in ('egg', 'baby', 'adult')),
  style text not null default 'a' check (style in ('a', 'b')),
  room text not null default 'warm' check (room in ('warm', 'morning')),
  character text not null default 'Cozy Dreamer',
  timezone text not null default 'Asia/Almaty',
  created_at timestamptz not null default now()
);

create table if not exists space_members (
  space_id uuid not null references spaces(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (space_id, user_id)
);

create table if not exists invitations (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references spaces(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz
);

create table if not exists daily_checkins (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references spaces(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  local_date date not null,
  mood text not null,
  energy text not null,
  want text not null,
  note_ciphertext text,
  note_iv text,
  note_auth_tag text,
  note_key_version integer,
  guess_mood text,
  revealed_at timestamptz,
  client_mutation_id text not null,
  created_at timestamptz not null default now(),
  unique (space_id, user_id, local_date),
  unique (space_id, user_id, client_mutation_id)
);

create table if not exists story_entries (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references spaces(id) on delete cascade,
  source_type text not null,
  source_id text not null,
  title text not null,
  body text not null,
  tone text not null,
  local_date date not null,
  created_at timestamptz not null default now(),
  unique (space_id, source_type, source_id)
);

create index if not exists daily_checkins_space_date_idx on daily_checkins(space_id, local_date);
create index if not exists story_entries_space_date_idx on story_entries(space_id, local_date desc);
