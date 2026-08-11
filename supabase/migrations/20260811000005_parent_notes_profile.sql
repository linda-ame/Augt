-- Parent free-text notes + profile draft/approval (replaces goal checklist UX)

alter table public.children
  add column if not exists parent_notes jsonb not null default '{
    "emphasize": "",
    "challenges": "",
    "boundaries": "",
    "other": ""
  }'::jsonb;

alter table public.children
  add column if not exists notes_version integer not null default 0;

alter table public.children
  add column if not exists profile_draft text;

alter table public.children
  add column if not exists profile_status text not null default 'none';

alter table public.children
  drop constraint if exists children_profile_status_check;

alter table public.children
  add constraint children_profile_status_check
  check (profile_status in ('none', 'draft', 'approved'));

alter table public.children
  add column if not exists profile_approved_at timestamptz;

-- Existing AI profiles remain valid for daily generation
update public.children
set profile_status = 'approved',
    profile_approved_at = coalesce(profile_approved_at, updated_at, now())
where generated_profile is not null
  and btrim(generated_profile) <> ''
  and profile_status = 'none';
