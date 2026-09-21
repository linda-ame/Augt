-- Parental gate PIN: required to return from child preview to parent dashboard.
alter table public.families
  add column if not exists parent_gate_pin_hash text;
