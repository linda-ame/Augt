-- Saved scripture quotes for personalized children (guest: no DB row).
create table if not exists public.child_quotes (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children(id) on delete cascade,
  quote_text text not null,
  -- Full liturgical reference as shown with the reading, e.g. "Mt 28, 16-20"
  source_reference text not null,
  -- Optional AI-refined verse span within that reading, e.g. "Mt 28, 18-19"
  source_precise text,
  source_label text,
  reading_role text,
  reading_date date,
  created_at timestamptz not null default now()
);

create index if not exists child_quotes_child_created_idx
  on public.child_quotes (child_id, created_at desc);

alter table public.child_quotes enable row level security;

create policy child_quotes_select on public.child_quotes
  for select using (
    exists (
      select 1 from public.children c
      where c.id = child_id and public.is_family_owner(c.family_id)
    )
  );

create policy child_quotes_insert on public.child_quotes
  for insert with check (
    exists (
      select 1 from public.children c
      where c.id = child_id and public.is_family_owner(c.family_id)
    )
  );

create policy child_quotes_delete on public.child_quotes
  for delete using (
    exists (
      select 1 from public.children c
      where c.id = child_id and public.is_family_owner(c.family_id)
    )
  );
