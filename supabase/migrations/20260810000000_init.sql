-- Augt initial schema
create extension if not exists "pgcrypto";

create table public.families (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  family_code text not null unique,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.children (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  display_name text not null,
  age integer not null check (age >= 3 and age <= 20),
  personal_code_hash text not null,
  selected_goal_ids text[] not null default '{}',
  generated_profile text,
  profile_version integer not null default 0,
  goals_version integer not null default 1,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index children_family_id_idx on public.children(family_id);

create table public.daily_readings (
  id uuid primary key default gen_random_uuid(),
  reading_date date not null unique,
  liturgical_day text,
  source_url text not null,
  readings jsonb not null default '[]'::jsonb,
  source_text text not null,
  retrieved_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table public.daily_lessons (
  id uuid primary key default gen_random_uuid(),
  reading_date date not null,
  child_id uuid not null references public.children(id) on delete cascade,
  reading_id uuid references public.daily_readings(id) on delete set null,
  content_json jsonb,
  generation_status text not null default 'pending'
    check (generation_status in ('pending', 'success', 'failed')),
  ai_provider text,
  ai_model text,
  error_message text,
  generated_at timestamptz,
  created_at timestamptz not null default now(),
  unique (reading_date, child_id)
);

create index daily_lessons_child_date_idx on public.daily_lessons(child_id, reading_date desc);

create table public.generation_runs (
  id uuid primary key default gen_random_uuid(),
  run_date date not null,
  trigger text not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'running',
  details jsonb not null default '{}'::jsonb
);

-- Helpers
create or replace function public.is_family_owner(fid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.families f
    where f.id = fid and f.owner_user_id = auth.uid()
  );
$$;

create or replace function public.touch_children_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger children_updated_at
before update on public.children
for each row execute function public.touch_children_updated_at();

alter table public.families enable row level security;
alter table public.children enable row level security;
alter table public.daily_readings enable row level security;
alter table public.daily_lessons enable row level security;
alter table public.generation_runs enable row level security;

-- Families: owner only
create policy families_select on public.families
  for select using (owner_user_id = auth.uid());
create policy families_insert on public.families
  for insert with check (owner_user_id = auth.uid());
create policy families_update on public.families
  for update using (owner_user_id = auth.uid());
create policy families_delete on public.families
  for delete using (owner_user_id = auth.uid());

-- Children: family owner only (kid access goes through server + service role / kid session)
create policy children_select on public.children
  for select using (public.is_family_owner(family_id));
create policy children_insert on public.children
  for insert with check (public.is_family_owner(family_id));
create policy children_update on public.children
  for update using (public.is_family_owner(family_id));
create policy children_delete on public.children
  for delete using (public.is_family_owner(family_id));

-- Readings: authenticated parents can read (shared liturgical content)
create policy readings_select on public.daily_readings
  for select to authenticated using (true);

-- Lessons: only if parent owns the child
create policy lessons_select on public.daily_lessons
  for select using (
    exists (
      select 1 from public.children c
      where c.id = child_id and public.is_family_owner(c.family_id)
    )
  );

-- Generation runs: no client access by default (service role only)
