# Augt

**Dieva Vārds. Ticība. Dzīve. Katru dienu.**

Latviešu ģimenes tīmekļa lietotne: ikdienas Svētie Raksti no [Mieram tuvu](https://mieramtuvu.lv/lasit/) publiskās sadaļas „Svēto Rakstu lasījumi”, personalizēts skaidrojums, spēle, pārdomas un lūgšana katram bērnam.

## Stack

- Next.js (App Router) + TypeScript + Tailwind
- Supabase (Auth vecākiem, Postgres, RLS)
- GitHub Actions (ikdienas ģenerēšana ~00:10 Europe/Riga)
- OpenAI-compatible AI API (piem. GitHub Models)

## Ātrā uzstādīšana

1. Izveido Supabase projektu.
2. Izpildi SQL no [`supabase/migrations/20260810000000_init.sql`](supabase/migrations/20260810000000_init.sql).
3. Kopē [`.env.example`](.env.example) uz `.env.local` un aizpildi atslēgas.
4. `npm install && npm run dev`
5. Deploy uz Vercel; pievieno tās pašas env mainīgās.
6. GitHub repo Secrets: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `AI_BASE_URL`, `AI_API_KEY`, `AI_MODEL`, `KID_SESSION_SECRET`.

## Lietotāju plūsma

- **Vecāks** reģistrējas ar e-pastu, izveido ģimeni, saņem **ģimenes kodu**, pievieno bērnus ar **personīgo kodu** un mācību mērķiem.
- **Kad bērns tiek izveidots** (jebkurā diennakts laikā): tiek ģenerēts AI profils, ielādēti šodienas lasījumi no Mieram tuvu un uzreiz ģenerēts šodienas bērna saturs.
- **Katru nakti ~00:10** (Latvijas laiks, neilgi pēc Mieram tuvu jauno lasījumu) GitHub Action ielādē lasījumus un ģenerē saturu visiem aktīvajiem bērniem / vecuma grupām, kuriem šodienas nodarbība vēl nav.
- **Bērns** ievada ģimenes kodu → izvēlas savu vārdu → ievada personīgo kodu.
- **Vecāks** var pārslēgties uz katra bērna skatu.
- Pieejamas tikai **šodiena un līdz 7 dienām atpakaļ** (nav nākotnes).

## AI konfigurācija

- Pastāvīgie noteikumi: [`ai/system-rules.md`](ai/system-rules.md)
- Mērķu bibliotēka: [`ai/teaching-goals.json`](ai/teaching-goals.json)
- Spēļu katalogs: [`ai/game-library.json`](ai/game-library.json)

## Rokas ģenerēšana

```bash
npm run generate:daily
```

vai

```bash
curl -X POST -H "Authorization: Bearer $CRON_SECRET" "$NEXT_PUBLIC_APP_URL/api/cron/generate-daily"
```

## Specifikācijas

Oriģinālie Word dokumenti atrodas repo saknē (MVP, Goals_and_rules, Personalized Faith Learning Architecture).
