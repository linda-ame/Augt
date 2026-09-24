# Ģimene — Augt publiskā / standarta specifikācija

Izmantot AI dienas ģenerēšanai **ģimenes kopīgajam brīdim** (guest un reģistrētiem).
**Pakļaujas:** `ai/catholic-principles.md` + `ai/system-rules.md` (skolas/brīvlaika konteksts, liturģija, valodas robežas).
Liturģiskie lasījumi: mieramtuvu.lv / esošais Scripture adapteris.

**Nav** vecuma josla un **nav** pieaugušo solo diena. Šis ir viens saturs, ko ģimene **lasa un runā kopā** (dažāda vecuma bērni + vecāki vienā istabā).

## Identitāte

| Lauks | Vērtība |
|--------|---------|
| ID | `family` |
| Auditorija | Ģimene ar jauktiem vecumiem (apt. 7+ līdz pusaudžiem + vecāki) |
| Publiski | jā (guest, bez profila) |
| Dienas ilgums | ~8–12 min runājot kopā |
| Audio / TTS | **nē** — teksts lasāms balsī; UI nerāda klausīšanās režīmu |

## Mērķis

Palīdzēt ģimenei **kopā** sastapties ar šodienas Evaņģēliju: īsi lūgties → lasīt → saprast vienkārši → pārrunāt → vienu mazu soli kopā → vakarā atskatīties bez grēksūdzes → lūgties kopā.

**Plūsma:** Lūdzam → Lasām → Saprotam → Runājam → Mēģinām → Vakarā atskatāmies → Lūdzam

## Centrs: Evaņģēlijs

- Dienas tēmu **nosaka tikai šodienas Evaņģēlijs**.
- Evaņģēlijs **nekad** netiek aizstāts ar citu lasījumu.
- Teksts: **lasāms balsī** (vecāks vai vecāks bērns). Ja ļoti garš — drīkst īsa “lasīšanai balsī” versija + UI opcija “pilnais teksts”, bet skaidrojums balstās uz to pašu dienas Evaņģēliju.
- Valoda skaidrojumā un jautājumos: **jaunākais istabā saprot**; vecākie un vecāki var iet dziļāk ar papildjautājumu (skat. zemāk).

## UX kartējums (ģimenes diena)

Galvenā plūsma (obligāti):

1. **Rīts** — ģimenes rīta lūgšana (lasa viens, visi saka kopā / Āmen)  
2. **Evaņģēlijs** — teksts balsī + skaidrojums + pārdomu jautājumi + 1 kopīgs pielietojums  
3. **Vakars** (~3–5 min) — ievads → 4 ģimenes sarunas jautājumi → vakara lūgšana → Tēvs mūsu (UI); **bez** grēksūdzes

Neobligāti (otrā rinda / “Lasījumi”):

4. **1. lasījums, Psalms, Alleluja** (+ īss skaidrojums / saikne ar Evaņģēliju, ja dabiska)  
5. **2. lasījums** — tikai ja liturģijā ir

**Nav:** spēle, quiz, examen kā individuāla sirdsapziņas izmeklēšana / grēksūdze, audio klausīšanās.

## Bloku prasības

### Rīta lūgšana (`morning_prayer`)
- **50–90 vārdi** kopā  
- **“Mēs”** forma (mēs / mūsu ģimene), ne “es” kā solo bērnam  
- Katoļu, silta; **lūgšanas nodoms saskan ar dienas Evaņģēlija vēsti**, bet teksts ir saprotams **pirms** Evaņģēlijs ir lasīts (ne tikai “svētī mūsu dienu”, un ne stāsts par ainu, ko vēl neviens nav dzirdējis)
- Struktūra (kā system-rules, bet ģimenes tonī): `opening` → `body` → `offering` → `closing`
- **Uzruna Dievam** (“Kungs”, “Jēzu”): lūgums un pateicība, **bez jautājumiem** (arī ne Dievam; tekstā nav “?”)
- **NEDRĪKST:** jautājumi (arī retoriski) par lasījumu; “ko Jēzus teica”; citāti; personu vārdi no Evaņģēlija; “kā šodien dzirdēsim”
- **Aizlūgums — jaunais formāts (`body`):** pateicība → “Lūdzam par sevi, mūsu ģimeni un draugiem” (skola tikai ja `SKOLAS KONTEKSTS` atļauj) → “Dāvā mums …” / “Dod mums …” — **viena** žēlastība no Evaņģēlija vēsts → **atvērts** “Jo īpaši šodien mēs vēlamies lūgt par…” (**apstājies pie “par…”**; neizdomā cilvēku/situāciju — ģimene ieliek kopēju nodomu vai katrs savu). Neprasa, lai ģimene jau zinātu lasījumu.  
- Darba dienas nianses vecākiem: drīkst maigi (darbs, ceļš, rūpes mājās), bez “produktīvas dienas” lekcijas  
- Negenerē Tēvreizi u.c. fiksētos tekstus (UI)

### Evaņģēlija skaidrojums (“Ko dzirdam?”)
- **100–160 vārdi**  
- Iekšēji A + B (ko teksts māca; kā aicina tuvoties Dievam) — output **viens plūstošs teksts**, bez etiķetēm „Līmenis A/B”  
- Tonis: **stāsta balsī ģimenei**; īsi teikumi; ikdienas vārdi; grūtu jēdzienu vietā — vienkāršojums  
- Piemēri no **kopīgas** ikdienas (mājas, brāļi/māsas, ēdiens, ekrāni, pacietība vienam pret otru) — skola tikai skolas dienā  
- **NEDRĪKST:** tikai “esiet labi”; pusaudžu-only vai mazuļu-only leksika; stereotipi par “mammām/tētiem”  
- `main_idea`: 1 teikums, ko visi var atkārtot  
- `gospel.prayer` (ja JSON to ietver): īsa **kopīga** lūgšana pēc Evaņģēlija (30–50 vārdi), “mēs”

### Runājam — pārdomu jautājumi (Evaņģēlijs)
Ne quiz. Saruna istabā. **Tieši 3 jautājumi** šādā kārtībā (katru dienu **pārfrāzē**; tēmas stabilas).

**UI rāda divās daļās** (ne četri atsevišķi jautājumi):

| Daļa | Jautājumi | Mērķis |
|------|-----------|--------|
| **Ko dzirdējām?** | 1. | Atskats uz Evaņģēlija ainu |
| **Ko tas mums?** | 2. + 3. | Ģimenes refleksija / dziļāk |

1. **Vienkāršais (jaunākajiem)** — ko dzirdējām / ko Jēzus darīja / kas notika (konkrēti no šīs dienas teksta)  
2. **Kopīgais** — ko tas nozīmē **mums kā ģimenei šodien** (mājas, viens otram; silts un praktisks, ne lekcija)  
3. **Dziļākais (vecākie / vecāki)** — viens jautājums, kas ļauj iet tālāk (izvēle, uzticēšanās Dievam, piedošana mājās…), **bez** vienas “pareizās” atbildes un bez ticības apšaubīšanas  

Vismaz 2. vai 3. jautājumā jābūt **konkrētam tēlam no šodienas Evaņģēlija** (persona, vārds, žests), ne tikumam kā etiķetei.

Lauku ieteikums JSON (vai līdzvērtīgi):
- `discussion_questions`: masīvs ar 3 stringiem secībā easy → together → deeper  
- `reflection_question`: īss kopsavilkums no 2. (fallback; UI to nerāda, ja ir `discussion_questions`)

### Mēģinām šodien (`real_life_application`)
- **2–5 teikumi**  
- **Viens** kopīgs, reāli izpildāms solis **šodien** (1–5 min vai viena īsa izvēle), ko ģimene var izdarīt **kopā** vai viens pret otru  
- LABI: labs vārds mājās; palīdzēt bez vaicāšanas; viena reize nolikt telefona / TV un būt kopā; atvainoties ģimenē; pateikties  
- SLIKTI: “visu dienu bez…”, “rīt no rīta pusstundu…”, skolas/klases uzdevumi brīvlaikā/brīvdienās, individuāls “katram bērnam savs projekts”

### Pārējie lasījumi (`parts`)
- Papildu, ne galvenā pieredze; arī **lasāmi balsī**, ja ģimene izvēlas  
- Katram (1. lasījums, psalms, alleluja, 2. ja ir):
  - `summary`: **40–80 vārdi** — kas teikts + ko tas māca ģimenei vienkārši  
  - `connection_to_gospel`: **1–3 teikumi**, tikai ja saikne dabiska; citādi īsa / izlaista  
- Psalms: drīkst “šodienas psalma doma” 1 teikumā + īsa pārdoma, ko var pateikt kopā  
- Alleluja: īsi, kā tilts uz Evaņģēliju  
- **NEDRĪKST:** tikpat garš kā Evaņģēlija skaidrojums; eseja

### Vakars — precīzs plāns (~3–5 min)

**Kas tas ir:** **ģimenes vakara aplītis** — īsa saruna + kopīga lūgšana pirms miega.  
**Kas tas nav:** grēksūdze, individuāla sirdsapziņas izmeklēšana, “nosauc savus grēkus”, kaunināšana.

**Kur notiek:** pie galda / pirms gulētiešanas; viens lasa jautājumus un lūgšanu balsī, visi atbild / saka Āmen.

#### Secība UI (stingri šajā kārtībā)

| Solis | Kas notiek | Kas ģenerē AI | Kas dara ģimene |
|-------|------------|---------------|-----------------|
| 1 | Īss ievads | **Katru dienu jauns** 1 teikums (aplītis, ne examen) | Vecāks nolasa |
| 2 | Vakara aplītis — 4 jautājumi | **Fiksēti** (AI neģenerē) | Katrs, kas grib, atbild par savu dienu |
| 3 | Vakara lūgšana | **Katru dienu jauna** | Viens lasa balsī; visi Āmen |
| 4 | Tēvs mūsu | — (UI fiksēts) | Lūdzas kopā |

**Kopā vakarā:** ievads + 4 jautājumi + lūgšana (~70–120 vārdi bez jautājumiem) + Tēvs mūsu.  
**Nav** spēles, quiz, audio, atsevišķa “examen” sadaļa ar vainas sarakstu.

#### 1. Ievads (katru dienu jauns, īss)

- **1 teikums**, silti aicina uz **vakara aplīti** (ne “izmeklēt sirdsapziņu”).  
- Drīkst maigi atsaukies uz dienu / Evaņģēlija tēlu **vienā** vārdā — vai būt neitrāls (“Satīsimies īsi aplītī…”).  
- JSON: ja tehniski vajag `examen_intro` — **aizpilda ar šo ievadu**.

#### 2. Četri sarunas jautājumi (dienas atskats) — **fiksēti**

Lauks: `family_reflection_questions` (vai esošais `examen_questions` **tikai kā tehnisks konteiners**).

**Formāts:** ģimenes **vakara aplītis** — jautājumus nolasa balsī, **katrs** (kas grib) īsi atbild par **savu** dienu. Ģimeniskais = klausāmies vienam otru, ne obligāti “runājam tikai par ģimeni kā vienību”.

**Jautājumi NEMAINĀS no dienas uz dienu** (tieši šie teksti UI / saturā; AI **neģenerē** un **nepārfrāzē**):

1. **Par ko tu šodien pateicies Dievam?**  
2. **Kas šodien bija labs? Kas bija grūts?**  
3. **Ja vēlies — kur tu šodien varēji būt labāks?** *(neobligāti)*  
4. **Par ko īpašu tu šovakar gribi palūgties?**  

Piezīmes:
- 4. jautājums = lūgšanas nodoms / “ko uzticu Dievam” — **viens** jautājums, ne divi.  
- Atbildes **nav jāraksta** appē.  
- **NEDRĪKST:** spiest atbildēt uz 3.; grēku uzskaitījums; kaunināšana.  
- Evaņģēlija “Runājam” jautājumi ir **dienas** daļā; vakarā aplītis **neatkārto** Evaņģēlija stundu.

**Kas vakarā mainās katru dienu:** īss ievads (1) + vakara lūgšana (3). Jautājumu bloks = stabils rituāls.

#### 3. Vakara lūgšana (pēc aplīša; **katru dienu jauna**)

Teksts **bez** jautājumiem: **70–120 vārdi**, valoda “mēs / mūsu”. Saikne ar dienas Evaņģēliju — viegla, ne lekcija.

| Daļa | Garums | Saturs |
|------|--------|--------|
| `thanksgiving` | 1–2 teikumi | Pateicība Dievam par šo dienu / par ģimeni |
| `mercy` | 1–2 teikumi | Maiga **kopīga** piedošanas lūgšana (“piedod mums, kad šodien…”); **ne** grēksaraksts un ne individuāla atzīšanās |
| `resolution` | 1–2 teikumi | Īss **lūgums pēc spēka** (“Jēzu, palīdzi mums…”), ne “rīt mēs izdarīsim X” saraksts |
| `closing` | galvenā daļa | Īsta noslēguma lūgšana — skat. zemāk |

`closing` **obligāti** ietver (kārtība un ritms **mainās** no dienas uz dienu):
1. sargā **mūs** / mūsu ģimeni  
2. mierīgs miegs / naktsmiers  
3. veselība  
4. sargā no ļauna, nelaimēm, slimībām  
5. Āmen  

**NEDRĪKST:** `closing` = viens “labu nakti”; vakars = tikai jautājumi bez lūgšanas; `mercy` kā grēksūdze.

#### 4. Tēvs mūsu

- UI rāda klasisko tekstu (ne AI).  
- Ģimene lūdzas kopā pēc vakara lūgšanas.

#### Ko vakarā apzināti **neiekļaujam**

- Grēksūdze / sirdsapziņas izmeklēšana / “examen” kā individuāls rituāls  
- Atsevišķs “vai man kādam jāatvainojas” kā **pienākums** (3. jautājums ir **neobligāts** un maigs)  
- Jauns Evaņģēlija skaidrojums vai jauni “Runājam” jautājumi  
- Audio / klausīšanās  
- Spēle

## Skolas / darba / brīvdienu konteksts

Tas pats, kas `ai/system-rules.md` (**Skolas / brīvlaika konteksts**), plus:

| Konteksts | Ko drīkst piemēros / aizlūgumos / pielietojumā |
|-----------|-----------------------------------------------|
| Skolas diena | skola, skolotāji, klasesbiedri — ja dabiski; ne katru dienu tikai skola |
| Sestdiena / svētdiena | ģimene, mājas, draugi, svētdienas miers / Mise (ja dabiski), bez klases |
| Vasaras brīvlaiks (VI–VIII) | brīvlaika ikdiena, ģimene, draugi, ceļojumi/mājas — **bez** skolas |
| Darba diena (vecāku nianses) | darbs, ceļš mājās, nogurums — maigi; NEDRĪKST produktivitātes lekcija |

Ģimenes saturā prioritāte vienmēr: **kas notiek mājās starp mums**, ne “kā uzvesties klasē”.

## Valoda un tonis

- **Runājama balsī**; īsi, skaidri teikumi  
- Saprotams **~7–9 gadu** bērnam; vecākie nejūtas “mazuļu stundā”, jo 3. jautājums un pielietojums dod dziļumu  
- “Mēs / mūsu”; silti; bez moralizēšanas un biedēšanas  
- Katoļu ticības kodols pirms tikumu saukļiem  

## AI aizliegumi

- Audio / “klausies” / TTS skripti šim režīmam  
- Spēles, quiz, individuāls examen / grēksūdze  
- Atsevišķas versijas katram bērna vecumam vienā dienā (viena pakete visiem)  
- Pretrunas katoļu mācībai; provocēt šaubas  
- Kaunināt bērnu otru priekšā; “vecāku lekcija” tonis Evaņģēlija vietā  
- Mākslīga tēma, kas neizriet no šodienas Evaņģēlija  
- Skolas situācijas brīvlaikā / sestdienā–svētdienā  

## Guest / bez profila

- Nav ģimenes konta prasības  
- Progresu var glabāt lokāli (`guest` + `family` + `date`)  
- Jauns datums → iepriekšējās dienas progresu ignorē  

## Gala princips

> Viena ģimene, viens Evaņģēlijs, viena īsa saruna. Palīdzēt **kopā** dzirdēt Jēzu, pateikt, ko dzirdējām, un izdarīt **vienu** mazu soli mīlestībā mājās — nevis individuālu stundu un nevis grēksūdzi.
