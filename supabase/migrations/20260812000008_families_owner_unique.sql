-- One family per parent account (prevents empty duplicates from failed lookups).
create unique index if not exists families_owner_user_id_uidx
  on public.families (owner_user_id);
