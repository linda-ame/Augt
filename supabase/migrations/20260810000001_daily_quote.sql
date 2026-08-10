-- Add daily quote from Mieram tuvu (short line under the date)
alter table public.daily_readings
  add column if not exists daily_quote text;
