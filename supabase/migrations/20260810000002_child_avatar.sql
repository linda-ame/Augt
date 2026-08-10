-- Child profile avatar + notification preference
alter table public.children
  add column if not exists avatar_emoji text,
  add column if not exists avatar_url text,
  add column if not exists notifications_enabled boolean not null default false;

-- Public avatars bucket (service role uploads; public read)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'child-avatars',
  'child-avatars',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Public read for avatar images
drop policy if exists "Public read child avatars" on storage.objects;
create policy "Public read child avatars"
  on storage.objects for select
  using (bucket_id = 'child-avatars');
