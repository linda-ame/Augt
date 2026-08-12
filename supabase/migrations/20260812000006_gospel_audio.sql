-- Gospel listen-along audio (pre-generated TTS per age band)
alter table public.age_band_lessons
  add column if not exists gospel_audio_url text;

-- Public bucket for daily lesson audio (service role uploads; public read)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'lesson-audio',
  'lesson-audio',
  true,
  15728640,
  array['audio/wav', 'audio/mpeg', 'audio/mp4']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public read lesson audio" on storage.objects;
create policy "Public read lesson audio"
  on storage.objects for select
  using (bucket_id = 'lesson-audio');
