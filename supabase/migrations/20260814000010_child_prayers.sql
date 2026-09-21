-- Child-authored personal prayers (guest: no DB row).
create table if not exists public.child_prayers (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children(id) on delete cascade,
  title text not null,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists child_prayers_child_created_idx
  on public.child_prayers (child_id, created_at desc);

alter table public.child_prayers enable row level security;

create policy child_prayers_select on public.child_prayers
  for select using (
    exists (
      select 1 from public.children c
      where c.id = child_id and public.is_family_owner(c.family_id)
    )
  );

create policy child_prayers_insert on public.child_prayers
  for insert with check (
    exists (
      select 1 from public.children c
      where c.id = child_id and public.is_family_owner(c.family_id)
    )
  );

create policy child_prayers_update on public.child_prayers
  for update using (
    exists (
      select 1 from public.children c
      where c.id = child_id and public.is_family_owner(c.family_id)
    )
  );

create policy child_prayers_delete on public.child_prayers
  for delete using (
    exists (
      select 1 from public.children c
      where c.id = child_id and public.is_family_owner(c.family_id)
    )
  );
