create table if not exists spark_wallets (
  user_id text primary key references users(id) on delete cascade,
  balance integer not null default 0 check (balance >= 0),
  lifetime_earned integer not null default 0,
  lifetime_spent integer not null default 0,
  daily_earned integer not null default 0,
  daily_earned_date date not null
);

create table if not exists spark_ledger (
  id text primary key,
  user_id text not null references users(id) on delete cascade,
  delta integer not null check (delta <> 0),
  balance_after integer not null check (balance_after >= 0),
  reason text not null,
  idempotency_key text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, idempotency_key)
);

create table if not exists catalog_items (
  id text primary key,
  title text not null,
  description text not null,
  kind text not null,
  spark_price integer check (spark_price is null or spark_price > 0),
  stars_price integer check (stars_price is null or stars_price > 0),
  entitlement_scope text not null,
  is_active boolean not null default true
);

create table if not exists purchases (
  id text primary key,
  user_id text not null references users(id) on delete cascade,
  space_id text references spaces(id) on delete cascade,
  item_id text not null references catalog_items(id),
  currency text not null,
  amount integer not null check (amount > 0),
  status text not null,
  telegram_payment_charge_id text unique,
  telegram_provider_charge_id text,
  created_at timestamptz not null default now()
);

create table if not exists entitlements (
  id text primary key,
  user_id text not null references users(id) on delete cascade,
  space_id text references spaces(id) on delete cascade,
  item_id text not null references catalog_items(id),
  source text not null,
  purchase_id text references purchases(id),
  granted_at timestamptz not null default now(),
  unique (user_id, space_id, item_id)
);

create table if not exists world_snapshots (
  space_id text primary key references spaces(id) on delete cascade,
  version integer not null default 1,
  snapshot jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists world_memories (
  id text primary key,
  space_id text not null references spaces(id) on delete cascade,
  created_by text not null references users(id),
  kind text not null,
  title text not null,
  body text not null,
  created_at timestamptz not null default now()
);

