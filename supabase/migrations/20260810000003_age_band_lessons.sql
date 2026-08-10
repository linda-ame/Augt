-- Public / guest age-band daily lessons (no child profile)
create table public.age_band_lessons (
  id uuid primary key default gen_random_uuid(),
  reading_date date not null,
  age_band text not null
    check (age_band in ('age_7_9', 'age_10_12', 'age_13_15', 'age_16_19')),
  reading_id uuid references public.daily_readings(id) on delete set null,
  content_json jsonb,
  generation_status text not null default 'pending'
    check (generation_status in ('pending', 'success', 'failed')),
  ai_provider text,
  ai_model text,
  error_message text,
  generated_at timestamptz,
  created_at timestamptz not null default now(),
  unique (reading_date, age_band)
);

create index age_band_lessons_date_idx
  on public.age_band_lessons(reading_date desc, age_band);

alter table public.age_band_lessons enable row level security;

-- Public read of successful lessons (guest app); writes via service role only
create policy age_band_lessons_select_success on public.age_band_lessons
  for select using (generation_status = 'success');
