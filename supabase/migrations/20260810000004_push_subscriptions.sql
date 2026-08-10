-- Anonymous / guest Web Push subscriptions (no account required)
create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  age_band text
    check (
      age_band is null
      or age_band in ('age_7_9', 'age_10_12', 'age_13_15', 'age_16_19')
    ),
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index push_subscriptions_age_band_idx
  on public.push_subscriptions(age_band);

create or replace function public.touch_push_subscriptions_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger push_subscriptions_updated_at
before update on public.push_subscriptions
for each row execute function public.touch_push_subscriptions_updated_at();

alter table public.push_subscriptions enable row level security;
-- No client policies: reads/writes via service role only
