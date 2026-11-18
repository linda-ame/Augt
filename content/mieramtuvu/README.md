# Mieram tuvu monthly EPUB (backup)

Offline backup if the website scrape fails. **Default production stays on the online site.**

## Files

Save each month as `YYYY-MM.epub` (example: `2026-09.epub`). Local only — `*.epub` is gitignored.

## Manual switch (when online is broken)

1. Put the month file in this folder as `YYYY-MM.epub`.
2. Import liturgy into Supabase:

```bash
npm run import:epub -- content/mieramtuvu/2026-09.epub
```

3. Generate age-band lessons:

```bash
npm run generate:age-bands
```

Optional: set `MIERAMTUVU_SOURCE=epub` in `.env.local` so any *fetch* also reads from the EPUB instead of the website. Import alone is enough for cron if `daily_readings` already has the day.

## Production upload (optional)

```bash
curl -X POST -H "Authorization: Bearer $CRON_SECRET" \
  -F "file=@Mieram-tuvu-oktobris.epub" \
  "https://augt.vercel.app/api/admin/import-epub"
```
