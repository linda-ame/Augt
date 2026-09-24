-- Allow public "family" daily content in age_band_lessons (and push optional band)

alter table public.age_band_lessons
  drop constraint if exists age_band_lessons_age_band_check;

alter table public.age_band_lessons
  add constraint age_band_lessons_age_band_check
  check (
    age_band in (
      'age_7_9',
      'age_10_12',
      'age_13_15',
      'age_16_19',
      'family'
    )
  );

alter table public.push_subscriptions
  drop constraint if exists push_subscriptions_age_band_check;

alter table public.push_subscriptions
  add constraint push_subscriptions_age_band_check
  check (
    age_band is null
    or age_band in (
      'age_7_9',
      'age_10_12',
      'age_13_15',
      'age_16_19',
      'family'
    )
  );
