import type { AgeBandId } from "@/lib/age-bands";

/** Hard constraints for public age-band generation (overrides one-size system-rules lengths). */
export function ageBandGenerationGuide(bandId: AgeBandId): string {
  const sharedMorning = `
RĪTA LŪGŠANA — ARĪ PAR CITIEM (ne tikai “svētī manu dienu”):
- morning_prayer joprojām īsa un saistīta ar dienas Evaņģēlija domu.
- Katrā rītā iekļauj **vismaz vienu** īsu aizlūgumu / lūgumu par citiem — rotē, NE katru rītu visu sarakstu.
- Iespējamie virzieni: ģimene; draugi; cilvēki, kurus šodien satikšu; kāds, kam šodien grūti; miera / labestības lūgums citiem.
- Skolasbiedri / skolotāji / skola — **TIKAI** ja SKOLAS KONTEKSTS atļauj (nav vasaras brīvlaiks jūnijs–augusts un nav sestdiena/svētdiena). Brīvlaikā un brīvdienās šos virzienus NELIETOT.
- LABI: 1–2 teikumi body vai closing daļā (“Kungs, svētī manu ģimeni…” / “palīdzi tiem, kurus šodien satikšu…”).
- NEDRĪKST: katru rītu mehāniski visi punkti; gara “lūgšanu lista”; aizlūgums bez īstas uzrunas Dievam; skolas situācijas brīvlaikā/brīvdienās.

SKAIDROJUMS (“Ko tas nozīmē?” / gospel.explanation) — EVAŅĢĒLIJS PIRMS MORĀLES:
- NESĀC ar iepriekš izvēlētu tēmu (draudzība, pacietība, mīlestība…). Vispirms nosaki ŠĪ fragmenta galveno vēsti.
- Skaidro: ko Jēzus māca/dara; ko atklāj par Jēzu un Dievu; attiecības ar Dievu; uz ko aicina; ticības aspekti TIKAI ja tekstā būtiski.
- Pēc tam (ja dabiski) — ikdienas saikne. NEDRĪKST upurēt garīgo vēsti seklai “esi labs” pamācībai.
- Vienkāršo VALODU, ne Evaņģēlija dziļumu.
- main_idea = 1 teikums = galvenā Evaņģēlija doma (ne tikuma sauklis).
- reflection_question / real_life_application — no vēsts; NEDRĪKST būvēt ap profilu.
- Lūgšanās saglabā Evaņģēlija ticības domu, ne tikai “palīdzi būt labam”.`;

  const sharedEvening = `
DIENAS APŅEMŠANĀS vs VAKARS:
- Praktiskais ierosinājums ir gospel.real_life_application (+ spēle) — ŠODIENAI (vai atlikušajai dienai), ne “rītdienas plāns”.
- real_life_application jābūt **vieglam un reāli izpildāmam** 1–5 minūtēs vai vienā īsa izvēlē:
  LABI: īss labs vārds; viena reize nolikt telefonu un palīdzēt ģimenei; 10–15 min bez ekrāna pirms miega; neiesaistīties aprunāšanā; atvainoties.
  SLIKTI / NEDRĪKST: “pirmo pusstundu rīt veltīt palīdzībai”; “visu dienu bez telefona”; “vienmēr būšu…”; lieli laika bloki skolas rītā; **klasesbiedru / skolas uzdevumi vasarā vai sestdienā–svētdienā**.
  Ja tēma saistās ar ekrāniem/tīkliem — labāk “izvēlies šodien vienu reizi palīdzēt / būt klātesošam NEVISēdēt ekrānā”, nevis milzīgs “bez ekrāna” maratons.
- evening_prayer.resolution NAV “Rīt es izdarīšu X”. Tā ir ĪSA LŪGŠANA pēc spēka/palīdzības (“Jēzu, palīdzi man…”).
- Vakara jautājumi = atskats un sirds, ne jauns uzdevumu saraksts.

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
  Beidzas ar Āmen.
- NEDRĪKST: closing, kas ir tikai “labu nakti” vienā teikumā; closing, kas atkārto examen; closing bez īstas lūgšanas uzrunas.`;

  switch (bandId) {
    case "age_7_9":
      return `VECUMA GRUPA 7–9 — OBLIGĀTI ŠAURĀK UN ĪSĀK NEKĀ VECĀKAJĀM GRUPĀM:
- Rīta lūgšana: 40–70 vārdi. Vienkārša valoda (ne “mazuļu” žargons). Īss aizlūgums par ģimeni / draugiem / kādu, ko šodien satikšu (1 virziens, ne viss saraksts; skola tikai ja SKOLAS KONTEKSTS atļauj).
${sharedMorning}
- Evaņģēlija skaidrojums (explanation): 80–120 vārdi. Kas notiek → ko Jēzus / Dievs māca (vienkārši) → (ja der) ko tas nozīmē manā ikdienā. BEZ smagas teoloģijas; BEZ skaidrojuma, kas ir tikai “esi labs”.
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
- Rīta lūgšana: 50–90 vārdi. Īss aizlūgums par citiem (ģimene / draugi / skola* — 1 virziens, rotē; *skola tikai ja SKOLAS KONTEKSTS atļauj).
${sharedMorning}
- Evaņģēlija skaidrojums: 120–180 vārdi. Kas notiek / ko Jēzus dara / ko māca par Dievu un ticību / kāpēc svarīgi / (ja dabiski) ko nozīmē attiecībās un rīcībā. Nē: tikai tikumu lekcija.
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
- Rīta lūgšana: 60–100 vārdi; personiska. Īss aizlūgums par ģimeni/draugiem/kādu no ikdienas (1 virziens).
${sharedMorning}
- Evaņģēlija skaidrojums: 150–250 vārdi. Vispirms: ko teksts saka par Kristu, Dievu, ticību (atgriešanos/piedošanu — ja tekstā). Tad: “Ko tas saka par manu dzīvi?” (draugi, spiediens, ģimene…) — ja dabiski. Nē: tikai “esi labs pusaudzis”.
- real_life_application / izaicinājums = šodienas apņemšanās no evaņģēlija mācības (konkrēta).
- Piemēri no: draugi, vienaudžu spiediens, ģimene, digitālā vide; skola — TIKAI skolas dienā un ja dabiski no lasījuma. Brīvlaikā/brīvdienās — bez klases/skolotājiem.
- Spēle: bieži scenario_choice / choose_the_best_response (apzināta izvēle).
- reflection_question: personiskāks, par rīcību (ne ticības apšaubīšana).
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
- Rīta lūgšana: 70–110 vārdi. Īss aizlūgums par citiem (ģimene, draugi, kāds, kam grūti — 1 virziens, rotē).
${sharedMorning}
- Evaņģēlija skaidrojums: 180–280 vārdi. Iekļauj “kāpēc” (katoļu izpratne par Dievu/Kristu/ticību), ne tikai “ko darīt” un ne tikai tikumu katalogs.
- real_life_application = šodienas praktiskā izvēle/izaicinājums, kas izriet no evaņģēlija mācības.
- Piemēri: atbildība, brīvība kā spēja izvēlēties labo, attiecības/cieņa (bez seksualizēšanas), digitālā vide, ģimene — TIKAI ja no lasījuma; pēc ticības kodola.
- Spēle: discernment / dziļāks scenario; var arī quiz, ja der tekstam.
- Vakara examen_questions: TIEŠI 6 jautājumi (kā 13–15, bet nobriedušākā valodā), OBLIGĀTI ietverot jautājumu par atvainošanos / kādu sāpināšanu.
- resolution: lūgums pēc gudrības un spēka, ne “rīt es izdarīšu X”.
- closing: **īsta vakara lūgšana** nobriedušā valodā — sevi un ģimeni Dieva aizsardzībā, naktsmiers, veselība, sargāšana no ļauna/nelaimēm/slimībām + Āmen; bez bērnišķīgas valodas, bet silti.
- Vakara lūgšanas teksts (bez jautājumiem): 100–150 vārdi; closing nedrīkst būt formāls “labu nakti” teikums.
- NEDRĪKST: vienāds garums ar 7–9/10–12; “bērnu” piemēri; relativizēt ticību / “kam ticēt”.
${sharedEvening}`;
  }
}
