import type { AgeBandId } from "@/lib/age-bands";
import { FIXED_FAMILY_EVENING_QUESTIONS } from "@/lib/family-content";

/** Hard constraints for public age-band generation (overrides one-size system-rules lengths). */
export function ageBandGenerationGuide(bandId: AgeBandId): string {
  const sharedMorning = `
RĪTA LŪGŠANA — PIRMS EVAŅĢĒLIJA (JAUNAIS FORMĀTS):
- morning_prayer tiek lasīta **pirms** Evaņģēlija. Tai jābūt saprotamai, ja lasījums vēl nav lasīts.
- Forma: uzruna Dievam — lūgums, pateicība, uzticēšana. **NULLE jautājumu:** neviena “?” rīta lūgšanā, arī ne Dievam. Jautājumi pieder pēc Evaņģēlija.
- \`body\` **tieši šādā kārtībā** (īsi, ne saraksts):
  1) **Pateicība** par nakti un jauno dienu.
  2) **Ikdienas aplis:** “Lūdzu par sevi, ģimeni un draugiem” (ģimenei: “Lūdzam…”, “mēs”). Skola / skolotāji / klasesbiedri — **TIKAI** ja SKOLAS KONTEKSTS atļauj, vienā īsā teikumā. Brīvlaikā un brīvdienās skolu NELIETOT.
  3) **Evaņģēlija virziens:** “Dāvā mums …” / “Dod mums …” — viena žēlastība no šodienas Evaņģēlija vēsts (miers, drosme, piedošana, uzticēšanās…). **Bez** ainas, citāta, personu vārda. NEDRĪKST katru dienu tā pati žēlastība.
  4) **Atvērtais slots:** beidz ar “Jo īpaši šodien vēlos lūgt par…” (ģimenei: “Jo īpaši šodien mēs vēlamies lūgt par…”). **Apstājies pie “par…”** — NEDRĪKST aizpildīt ar izdomātu cilvēku, situāciju vai “kādu, kurš…”. Bērns / ģimene paši ieliek.
- NEDRĪKST: gara “lūgšanu lista”; aizlūgums bez īstas uzrunas Dievam; skolas situācijas brīvlaikā/brīvdienās; katru rītu tas pats “Paldies par jauno dienu” + “palīdzi būt labam”; viltus-konkrēts “jo īpaši par klasesbiedru, kuram…”.

SKAIDROJUMS (“Ko tas nozīmē?” / gospel.explanation) — DIVI LĪMEŅI (TIKAI iekšēji):
- Iekšēji **A:** ko ŠIS fragments konkrēti māca (no teksta). Iekšēji **B:** kā tas aicina **tuvoties Dievam** un ļaut Viņam pārveidot dzīvi (Dievam katrs ir svarīgs; ja tekstā — arī rūpe par tuvāko ceļu ar Dievu).
- Virsjautājums: *Ko šis Evaņģēlijs māca par manu ceļu ar Dievu?* NESĀC ar gatavu tēmu (draudzība / konflikts / “atgriešanās” kā etiķete).
- Vispirms atklāj Kristu/Dievu; tad konkrētās tēmas **tikai no teksta**; ikdiena = **auglis**. NEDRĪKST tikai “esi labs” / konfliktu menedžments; NEDRĪKST uzspiest vienu un to pašu etiķeti katrai dienai.
- **NEDRĪKST** outputā rakstīt „Līmenis A”, „Līmenis B”, „A:”, „B:” u.tml. — skaidrojums ir **viens plūstošs teksts** bez šīm etiķetēm.
- VALODA VISĀM GRUPĀM: īsi, skaidri teikumi; viena galvenā doma teikumā. Vārdu izvēle — pēc vecuma (mazākiem: ikdienas vārdi; vecākiem: drīkst precīzākus / neikdieniskākus). Vienkāršo izteiksmi, ne Evaņģēlija dziļumu.
- PAREIZRAKSTĪBA: rūpīgi āčēģīķļņšūž visā saturā un spēlēs; word_scramble — scrambled un answer = tā pati burta kopa (ī≠i).
- main_idea = 1 teikums = A + B saturs (ne tikuma sauklis, ne tikai konfliktu padoms); arī bez „Līmenis A/B” vārdiem.
- reflection_question / real_life_application — no A+B; NEDRĪKST būvēt ap profilu.
- Lūgšanās saglabā Evaņģēlija ticības domu, ne tikai “palīdzi būt labam”.`;

  const sharedEvening = `
DIENAS APŅEMŠANĀS vs VAKARS:
- Praktiskais ierosinājums ir gospel.real_life_application (+ spēle) — ŠODIENAI (vai atlikušajai dienai), ne “rītdienas plāns”.
- real_life_application jābūt **vieglam un reāli izpildāmam** 1–5 minūtēs vai vienā īsa izvēlē, un **katru dienu citā formā** (ŠODIENAS VARIĀCIJA): teikums, ko pateikt; neredzama palīdzība; apstāšanās pirms reakcijas; īss kluss lūgums; pateicība vienam cilvēkam; noklausīties; atteikties no viena maza komforta. NEDRĪKST katru dienu “esi laipns / palīdzi kādam”.
  LABI: īss labs vārds; viena reize nolikt telefonu un palīdzēt ģimenei; 10–15 min bez ekrāna pirms miega; neiesaistīties aprunāšanā; atvainoties — **bet tikai ja tā ir šodienas forma un tā izriet no Evaņģēlija**.
  SLIKTI / NEDRĪKST: “pirmo pusstundu rīt veltīt palīdzībai”; “visu dienu bez telefona”; “vienmēr būšu…”; lieli laika bloki skolas rītā; **klasesbiedru / skolas uzdevumi vasarā vai sestdienā–svētdienā**; tas pats “šodien palīdzi kādam” katru dienu.
  Ja tēma saistās ar ekrāniem/tīkliem — labāk “izvēlies šodien vienu reizi palīdzēt / būt klātesošam NEVISēdēt ekrānā”, nevis milzīgs “bez ekrāna” maratons.
- evening_prayer.resolution NAV “Rīt es izdarīšu X”. Tā ir ĪSA LŪGŠANA pēc spēka/palīdzības (“Jēzu, palīdzi man…”) ar šodienas Evaņģēlija tēlu, ne vispārīgu “būt labākam”.
- Vakara jautājumi = atskats un sirds, ne jauns uzdevumu saraksts. Zemāk grupās dotie jautājumi ir **tēmas un secība, ne gatavi teikumi** — katru dienu pārfrāzē, un vismaz viens piemin šodienas Evaņģēlija ainu.

VAKARĀ OBLIGĀTA ĪSTA LŪGŠANA (ne tikai atskats):
- examen_* = dienas atskats (jautājumi).
- resolution = īss lūgums pēc spēka (1–2 teikumi).
- closing = **GALVENĀ vakara lūgšana** — silta, runāta Dievam (“Tu” / “Kungs” / “Jēzu”), ne atskats un ne jauns uzdevums.
  OBLIGĀTI iekļauj (vecumam atbilstošā valodā, var apvienot teikumos):
  1) sargā mani;
  2) sargā manu ģimeni;
  3) dod mierīgu miegu / naktsmieru;
  4) dod veselību man un tiem, kurus mīlu;
  5) sargā no ļauna, nelaimēm un slimībām.
  Beidzas ar Āmen. VISI pieci elementi paliek; **kārtība un tas, kurš teikums ir garākais, mainās** pēc ŠODIENAS VARIĀCIJAS. NEDRĪKST katru vakaru tas pats “Sargā mani un manu ģimeni. Dod mierīgu miegu.”
- NEDRĪKST: closing, kas ir tikai “labu nakti” vienā teikumā; closing, kas atkārto examen; closing bez īstas lūgšanas uzrunas; izlaist kādu no pieciem elementiem.`;

  if (bandId === "family") {
    const fixedQ = FIXED_FAMILY_EVENING_QUESTIONS.map((q) => `«${q}»`).join(
      "; ",
    );
    return `REŽĪMS: ĢIMENE — KOPĪGS DIENAS BRĪDIS (jaukti vecumi, lasa un runā BALSĪ)
- NAV individuāla bērna stunda; NAV pieaugušo solo; NAV spēle; NAV audio/TTS skripts; NAV grēksūdze.
- Valoda: “mēs / mūsu” lūgšanās; skaidrojums saprotams ~7–9 gadu bērnam; īsi teikumi.
- Rīta lūgšana: 50–90 vārdi; ģimenes tonis (“mēs”). Formāts: pateicība → lūdzam par sevi, ģimeni, draugiem (skola tikai ja SKOLAS KONTEKSTS atļauj) → “Dāvā mums …” no Evaņģēlija → “Jo īpaši šodien mēs vēlamies lūgt par…” (neaizpildīts).
${sharedMorning}
- Evaņģēlija skaidrojums: 100–160 vārdi; plūstošs A+B bez etiķetēm; stāsta balsī ģimenei.
- main_idea: 1 teikums, ko visi var atkārtot.
- real_life_application: 2–5 teikumi = VIENS kopīgs, šodien izpildāms solis ģimenei (ne skolas uzdevumi brīvlaikā/brīvdienās).
- discussion_questions: TIEŠI 3 stringi secībā (UI rāda 2 daļās: «Ko dzirdējām?» = 1.; «Ko tas mums?» = 2.–3.):
  1) vienkāršais (jaunākajiem) — kas notika / ko Jēzus darīja (no šīs dienas teksta);
  2) kopīgais — ko tas nozīmē MUMS kā ģimenei ŠODIEN (mājas, viens otram); silts, praktisks, ne lekcija;
  3) dziļākais — vecākie/vecāki, bez “pareizās” atbildes.
  Vismaz 2. vai 3. ar konkrētu Evaņģēlija tēlu.
- reflection_question: īss kopsavilkums no 2. jautājuma (fallback; UI galvenokārt rāda discussion_questions).
- gospel.activity: **NEIEKĻAUJ** (nav spēles).
- gospel.prayer: īsa kopīga lūgšana 30–50 vārdi, “mēs”.
- parts: summary 40–80 vārdi; connection 1–3 teikumi ja dabiski.
- Vakars = **vakara aplītis**:
  - examen_intro: 1 teikums, aicina uz aplīti (ne “izmeklēsim sirdsapziņu”).
  - examen_questions: ievieto TIEŠI šos četrus fiksētos tekstus (nepārfrāzē): ${fixedQ}
  - thanksgiving / mercy / resolution / closing: **katru dienu JAUNI**; “mēs”; mercy = maiga kopīga piedošana, ne grēksaraksts; resolution = lūgums pēc spēka; closing ar 5 elementiem (sargā mūs/ģimeni, miegs, veselība, no ļauna… + Āmen).
  - Vakara lūgšanas teksts bez jautājumiem: 70–120 vārdi.
- NEDRĪKST: spēle; quiz; individuāls examen; kaunināšana; atsevišķas versijas katram bērna vecumam.
${sharedEvening}`;
  }

  switch (bandId) {
    case "age_7_9":
      return `VECUMA GRUPA 7–9 — OBLIGĀTI ŠAURĀK UN ĪSĀK NEKĀ VECĀKAJĀM GRUPĀM:
- VALODA: ļoti vienkārši, īsi teikumi; ikdienas vārdi; grūtus jēdzienus pārfrāzē. NEDRĪKST: gari “pieaugušo” teikumi, abstrakti termini bez skaidrojuma.
- Rīta lūgšana: 40–70 vārdi. Vienkārša valoda (ne “mazuļu” žargons). Formāts: pateicība → lūdzu par sevi, ģimeni, draugiem (skola tikai ja SKOLAS KONTEKSTS atļauj) → “Dāvā/dod mums …” no Evaņģēlija → “Jo īpaši šodien vēlos lūgt par…” (neaizpildīts).
${sharedMorning}
- Evaņģēlija skaidrojums (explanation): 80–120 vārdi. Kas notiek → ko Jēzus / Dievs māca (vienkārši) → (ja der) ko tas nozīmē manā ikdienā. BEZ smagas teoloģijas; BEZ skaidrojuma, kas ir tikai “esi labs”. Īsi teikumi.
- main_idea: 1 īss teikums ar evaņģēlija/ticības domu. real_life_application: 2–4 īsi teikumi = **mazs, šodien izpildāms** ierosinājums no tās pašas mācības (ne pusstundas projekti; brīvlaikā/brīvdienās — bez skolas/klasesbiedriem).
- reflection_question: viens vienkāršs jautājums.
- Spēle: vienkārša (multiple_choice / true_false u.tml.), bez smagām “scenāriju” dilemmām.
- parts.*.summary: ļoti īsi (1–3 teikumi katram).
- Vakara examen_questions: TIEŠI 4 jautājumi šādā secībā (pārfrāzē silti, bez kaunināšanas):
  1) Par ko es šodien pateicos Dievam?
  2) Kur man šodien izdevās kaut kas labs?
  3) Kur es šodien varēju rīkoties labāk?
  4) Vai ir kāds, kuram man vajadzētu atvainoties / lūgt piedošanu?
- resolution: īss lūgums (“Jēzu, palīdzi man…”), ne “rīt es izdarīšu…”.
- closing: **īsta vakara lūgšana** 4–7 vienkārši teikumi — sargā mani un ģimeni, dod labu miegu, veselību, sargā no ļauna/nelaimēm/slimībām + Āmen.
- Vakara lūgšanas teksts (thanksgiving+mercy+resolution+closing, bez jautājumiem): 70–110 vārdi; closing ir lielākā daļa no īstās lūgšanas.
- NEDRĪKST: garš “pusaudžu” skaidrojums, telefons/sociālie tīkli kā galvenais piemērs, abstract “egoisms” lekcija.
${sharedEvening}`;
    case "age_10_12":
      return `VECUMA GRUPA 10–12 — VIDĒJS DZIĻUMS (garāks un nopietnāks nekā 7–9, vienkāršāks nekā 13+):
- VALODA: skaidri īsi–vidēji teikumi; galvenokārt ikdienas vārdi; atsevišķi ticības termini OK, ja konteksts skaidrs. NEDRĪKST: smaga “grāmatu” valoda kā 16+.
- Rīta lūgšana: 50–90 vārdi. Formāts: pateicība → lūdzu par sevi, ģimeni, draugiem (skola tikai ja SKOLAS KONTEKSTS atļauj) → “Dāvā/dod mums …” no Evaņģēlija → “Jo īpaši šodien vēlos lūgt par…” (neaizpildīts).
${sharedMorning}
- Evaņģēlija skaidrojums: 120–180 vārdi. Kas notiek / ko Jēzus dara / ko māca par Dievu un ticību / kāpēc svarīgi / (ja dabiski) ko nozīmē attiecībās un rīcībā. Nē: tikai tikumu lekcija. Teikumi skaidri, ne sapinušies.
- real_life_application = šodienas praktiskā apņemšanās no evaņģēlija mācības (brīvlaikā/brīvdienās — bez skolas situācijām).
- Piemēri: ģimene, draugi, godīgums, vienaudžu spiediens (vieglā formā); skola — tikai skolas dienā — **pēc** ticības kodola, ne tā vietā.
- Spēle: var būt quiz VAI viegls scenario_choice.
- parts: īsi–vidēji (ne esejas).
- Vakara examen_questions: TIEŠI 5 jautājumi:
  1) Par ko es šodien pateicos Dievam?
  2) Kas man šodien izdevās?
  3) Kur es varēju rīkoties labāk?
  4) Vai ir kāds, kuram man vajadzētu atvainoties / lūgt piedošanu?
  5) Par ko es šovakar gribu lūgt Dievam?
- resolution: lūgums pēc spēka/palīdzības, ne rītdienas “to-do”.
- closing: **īsta vakara lūgšana** — sargā mani un ģimeni, naktsmiers, veselība, aizsardzība no ļauna/nelaimēm/slimībām + Āmen (pilnāka nekā 7–9, joprojām skaidra).
- Vakara lūgšanas teksts (bez jautājumiem): 80–130 vārdi; closing nedrīkst būt tukšs “labu nakti”.
- NEDRĪKST: tikpat īss kā 7–9; tikpat “smags” kā 16–19 (attiecības/šķīstība u.c. tikai ja lasījums ļoti skaidri ved).
${sharedEvening}`;
    case "age_13_15":
      return `VECUMA GRUPA 13–15 — DZIĻĀK, PUSAUDŽA IKDIENA:
- VALODA: skaidri, lasāmi teikumi (drīkst garāki nekā 7–12); drīkst neikdieniskākus / precīzākus vārdus, ja palīdz. NEDRĪKST: mazuļu leksika.
- Rīta lūgšana: 60–100 vārdi; personiska. Formāts: pateicība → lūdzu par sevi, ģimeni, draugiem (skola tikai ja SKOLAS KONTEKSTS atļauj) → “Dāvā/dod mums …” no Evaņģēlija → “Jo īpaši šodien vēlos lūgt par…” (neaizpildīts).
${sharedMorning}
- Evaņģēlija skaidrojums: 150–250 vārdi. Vispirms: ko teksts saka par Kristu, Dievu, ticību (atgriešanos/piedošanu — ja tekstā). Tad: “Ko tas saka par manu dzīvi?” (draugi, spiediens, ģimene…) — ja dabiski. Nē: tikai “esi labs pusaudzis”.
- real_life_application / izaicinājums = šodienas apņemšanās no evaņģēlija mācības (konkrēta).
- Piemēri no: draugi, vienaudžu spiediens, ģimene, digitālā vide; skola — TIKAI skolas dienā un ja dabiski no lasījuma. Brīvlaikā/brīvdienās — bez klases/skolotājiem.
- Spēle: bieži scenario_choice / choose_the_best_response (apzināta izvēle).
- reflection_question: personiskāks, par rīcību (ne ticības apšaubīšana).
- parts (1. lasījums, psalms, 2. lasījums ja ir) — **garāki un pārdomīgāki nekā 7–12**, bet īsāki par Evaņģēlija skaidrojumu:
  - summary: 60–100 vārdi. Īss konteksts → ko teksts saka → ko tas māca / ko pārdomāt (ne tikai 1 atreferējuma teikums).
  - connection_to_gospel: 40–70 vārdi (2–4 teikumi). Konkrēta saikne ar **šīs dienas** Evaņģēlija galveno vēsti, ne vispārīga “labestība”.
  - Alleluja: drīkst palikt īsa (1–3 teikumi + īsa saikne).
  - NEDRĪKST: tikpat īss kā 7–9 (viens teikums + viens teikums); NEDRĪKST pārsniegt Evaņģēlija skaidrojuma garumu.
- Vakara examen_questions: TIEŠI 6 jautājumi:
  1) Par ko es šodien pateicos Dievam?
  2) Kur šodien izvēlējos labo?
  3) Kur es rīkojos pretēji tam, ko zinu par pareizu?
  4) Vai kādu šodien sāpināju ar vārdiem vai rīcību? (atvainošanās)
  5) Ko vēlos uzticēt Dievam?
  6) Kur vēlos rīt augt? (pārdoma, ne uzdevums)
- resolution: “Jēzu, dod man spēku…” — lūgums, ne plāns.
- closing: **īsta vakara lūgšana** personiskā tonī — aizsardzība sev un ģimenei, miers miegā, veselība, sargāšana no ļauna/nelaimēm/slimībām + Āmen; var īsi pieminēt draugus, ja dabiski.
- Vakara lūgšanas teksts (bez jautājumiem): 90–140 vārdi; atskats ≠ lūgšana — closing ir īstā lūgšana.
- NEDRĪKST: “mazuļa” valoda; tikpat īss teksts kā 7–9; vienādi piemēri ar 10–12 (“rotaļlieta / dalīties ar ēdienu” kā galvenais).
${sharedEvening}`;
    case "age_16_19":
      return `VECUMA GRUPA 16–19 — NOBRIEDUŠĀKAIS DZIĻUMS:
- VALODA: nobriedusi; drīkst precīzus / neikdieniskākus ticības un ētikas terminus; teikumi skaidri (ne “sapinušies”). NEDRĪKST: bērnu leksika.
- Rīta lūgšana: 70–110 vārdi. Formāts: pateicība → lūdzu par sevi, ģimeni, draugiem (skola tikai ja SKOLAS KONTEKSTS atļauj) → “Dāvā/dod mums …” no Evaņģēlija → “Jo īpaši šodien vēlos lūgt par…” (neaizpildīts).
${sharedMorning}
- Evaņģēlija skaidrojums: 180–280 vārdi. Iekļauj “kāpēc” (katoļu izpratne par Dievu/Kristu/ticību), ne tikai “ko darīt” un ne tikai tikumu katalogs.
- real_life_application = šodienas praktiskā izvēle/izaicinājums, kas izriet no evaņģēlija mācības.
- Piemēri: atbildība, brīvība kā spēja izvēlēties labo, attiecības/cieņa (bez seksualizēšanas), digitālā vide, ģimene — TIKAI ja no lasījuma; pēc ticības kodola.
- Spēle: discernment / dziļāks scenario; var arī quiz, ja der tekstam.
- parts (1. lasījums, psalms, 2. lasījums ja ir) — **nobriedušāks apskats** nekā 13–15; joprojām īsāks par Evaņģēliju:
  - summary: 80–120 vārdi. Konteksts → saturs → nozīme / pārdoma (kāpēc tas svarīgi ticībā un dzīvē), ne tikai atreferējums.
  - connection_to_gospel: 50–80 vārdi. Skaitāma, konkrēta saikne ar Evaņģēlija vēsti (var pieskarties “kāpēc” katoļu izpratnē, ja dabiski).
  - Alleluja: īsa (1–3 teikumi + īsa saikne).
  - NEDRĪKST: 1–2 teikumu “mini” apskats kā jaunākajām grupām; NEDRĪKST eseja, kas aizēno Evaņģēliju.
- Vakara examen_questions: TIEŠI 6 jautājumi (kā 13–15, bet nobriedušākā valodā), OBLIGĀTI ietverot jautājumu par atvainošanos / kādu sāpināšanu.
- resolution: lūgums pēc gudrības un spēka, ne “rīt es izdarīšu X”.
- closing: **īsta vakara lūgšana** nobriedušā valodā — sevi un ģimeni Dieva aizsardzībā, naktsmiers, veselība, sargāšana no ļauna/nelaimēm/slimībām + Āmen; bez bērnišķīgas valodas, bet silti.
- Vakara lūgšanas teksts (bez jautājumiem): 100–150 vārdi; closing nedrīkst būt formāls “labu nakti” teikums.
- NEDRĪKST: vienāds garums ar 7–9/10–12; “bērnu” piemēri; relativizēt ticību / “kam ticēt”.
${sharedEvening}`;
  }
}
