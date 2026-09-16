create table if not exists foundation_records (
  collection text not null,
  id text not null,
  scope_kind text not null check (scope_kind in ('user','space')),
  scope_id text not null,
  value jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (collection, id)
);

create index if not exists foundation_records_scope_idx on foundation_records(scope_kind, scope_id);

create sequence if not exists change_journal_cursor;
create table if not exists change_journal (
  cursor bigint primary key default nextval('change_journal_cursor'),
  space_id text not null references spaces(id) on delete cascade,
  type text not null,
  entity_id text not null,
  revision integer not null check (revision > 0),
  created_at timestamptz not null default now()
);
create index if not exists change_journal_space_cursor_idx on change_journal(space_id, cursor);

create or replace function wego_has_space_access(target_space text) returns boolean language sql stable as $$
  select exists(select 1 from space_members m where m.space_id = target_space and m.user_id = current_setting('wego.user_id', true))
$$;

alter table foundation_records enable row level security;
alter table change_journal enable row level security;
drop policy if exists foundation_records_access on foundation_records;
create policy foundation_records_access on foundation_records using (
  (scope_kind = 'user' and scope_id = current_setting('wego.user_id', true)) or
  (scope_kind = 'space' and wego_has_space_access(scope_id) and
    (position(':' in collection) = 0 or split_part(collection, ':', 2) = scope_id))
) with check (
  (scope_kind = 'user' and scope_id = current_setting('wego.user_id', true)) or
  (scope_kind = 'space' and wego_has_space_access(scope_id) and
    (position(':' in collection) = 0 or split_part(collection, ':', 2) = scope_id))
);
drop policy if exists change_journal_access on change_journal;
create policy change_journal_access on change_journal using (wego_has_space_access(space_id));

-- The deployment provisions this role outside migrations. Apply the grants when
-- it already exists; local SQL integration tests create the same role first.
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'wego_app') then
    grant select, insert, update, delete on foundation_records, change_journal to wego_app;
    grant usage, select on sequence change_journal_cursor to wego_app;
    grant select on space_members to wego_app;
  end if;
end
$$;
