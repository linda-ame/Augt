/** Parent-facing themes / qualities per age band (not the full AI prompt lists). */

export type ThemeCategory = {
  title: string;
  items: string[];
};

export type AgeBandThemes = {
  id: string;
  label: string;
  note?: string;
  categories: ThemeCategory[];
};

export const AGE_BAND_THEMES: AgeBandThemes[] = [
  {
    id: "age_7_9",
    label: "7–9 gadi",
    note: "Īpašības un tēmas parādās tikai tad, ja tās dabiski izriet no šodienas Evaņģēlija — ne kā obligāta programma.",
    categories: [
      {
        title: "Ticība",
        items: [
          "Iepazīt Jēzu",
          "Lūgšana",
          "Uzticēties Dievam",
          "Pateicība",
          "Dieva klātbūtne ikdienā",
        ],
      },
      {
        title: "Raksturs",
        items: [
          "Labestība",
          "Godīgums",
          "Drosme darīt labo",
          "Pacietība",
          "Palīdzēt citiem",
        ],
      },
      {
        title: "Emocijas",
        items: [
          "Savaldīt dusmas",
          "Tikt galā ar bailēm",
          "Piedošana",
          "Priecāties par citiem",
        ],
      },
      {
        title: "Attiecības un ikdiena",
        items: [
          "Būt labam draugam",
          "Cienīt ģimeni",
          "Dalīties",
          "Klausīties",
          "Palīdzēt mājās",
        ],
      },
    ],
  },
  {
    id: "age_10_12",
    label: "10–12 gadi",
    note: "Dziļākas pārdomas un praktiski soļi; joprojām tikai no dienas Evaņģēlija.",
    categories: [
      {
        title: "Ticība",
        items: [
          "Personīga lūgšana",
          "Labāk saprast Svētos Rakstus",
          "Uzticēties Dievam",
          "Pamanīt Dieva klātbūtni",
          "Izprast Baznīcas dzīvi",
        ],
      },
      {
        title: "Raksturs",
        items: [
          "Pacietība",
          "Atbildība",
          "Drosme darīt pareizi",
          "Godīgums",
          "Pašdisciplīna",
          "Pazemība",
        ],
      },
      {
        title: "Emocijas",
        items: [
          "Savaldīt dusmas",
          "Vilšanās",
          "Bailes",
          "Skaudība",
          "Pieņemt savas kļūdas",
        ],
      },
      {
        title: "Attiecības un vienaudži",
        items: [
          "Labi draugi",
          "Piedošana",
          "Iekļaut citus",
          "Runāt cieņpilni",
          "Vienaudžu spiediens",
          "Aizstāvēt to, kuram dara pāri",
        ],
      },
      {
        title: "Ikdiena",
        items: [
          "Palīdzēt ģimenei",
          "Centība mācībās",
          "Pienākumi",
          "Atbildīga tehnoloģiju lietošana",
          "Labi lēmumi",
        ],
      },
    ],
  },
  {
    id: "age_13_15",
    label: "13–15 gadi",
    note: "Vairāk saiknes ar pusaudža ikdienu — tomēr tikai tad, ja Evaņģēlijs to atļauj.",
    categories: [
      {
        title: "Ticība",
        items: [
          "Personīgas attiecības ar Jēzu",
          "Patstāvīgi lūgt",
          "Dzīvot ticību arī tad, kad citi domā citādi",
          "Sirdsapziņa",
          "Uzticēties Dievam grūtībās",
        ],
      },
      {
        title: "Raksturs un lēmumi",
        items: [
          "Gudri lēmumi",
          "Pašdisciplīna",
          "Drosme",
          "Godīgums",
          "Spēja atzīt kļūdas",
          "Līdzjūtība",
        ],
      },
      {
        title: "Emocijas",
        items: [
          "Dusmas",
          "Vilšanās",
          "Bailes",
          "Atraidījums",
          "Pieņemt sevi",
          "Runāt par grūtībām",
        ],
      },
      {
        title: "Draugi un vienaudži",
        items: [
          "Veselīgas draudzības",
          "Vienaudžu spiediens",
          "Nepiekrist grupai, kad tas ir nepareizi",
          "Pretoties apsmiešanai",
          "Konfliktu risināšana",
          "Piedošana",
        ],
      },
      {
        title: "Attiecības (cieņpilni)",
        items: [
          "Cieņa un robežas",
          "Godīga komunikācija",
          "Pieņemt atraidījumu",
          "Kristīgs skatījums uz mīlestību un šķīstību",
        ],
      },
      {
        title: "Digitālā vide un ikdiena",
        items: [
          "Atbildīga telefona lietošana",
          "Sociālie tīkli bez salīdzināšanās verdzības",
          "Laika pārvaldīšana",
          "Attiecības ar ģimeni",
          "Atbildība un centība",
        ],
      },
    ],
  },
  {
    id: "age_16_19",
    label: "16–19 gadi",
    note: "Nobriedušākas tēmas; brīvība = spēja izvēlēties labo, nevis “kam ticēt”.",
    categories: [
      {
        title: "Ticība",
        items: [
          "Trīsvienīgais Dievs — Tēvs, Dēls, Svētais Gars",
          "Dzīvot saskaņā ar Evaņģēliju",
          "Sirdsapziņa un patiesība",
          "Žēlsirdība, nožēla, piedošana",
          "Meklēt patiesību, nezaudējot ticības pamatu",
        ],
      },
      {
        title: "Brīvība un raksturs",
        items: [
          "Izvēlēties labo",
          "Atbildība par sekām",
          "Pašdisciplīna",
          "Pretoties atkarībām un spiedienam",
          "Cieņa pret sevi un citiem",
        ],
      },
      {
        title: "Attiecības un šķīstība",
        items: [
          "Mīlestība, kas palīdz tuvoties Dievam",
          "Robežas un cieņa",
          "Šķīstība kā spēja mīlēt patiesi",
          "Laulības un uzticības izpratne (kad lasījums to atver)",
        ],
      },
      {
        title: "Dzīves situācijas",
        items: [
          "Draudzība un lojalitāte",
          "Ģimene un patstāvība",
          "Digitālā vide un tēls",
          "Alkohols un vielas — atbildība, ne tikai “aizliegums”",
          "Nauda, statuss, karjera — kas ir labs ilgtermiņā",
        ],
      },
    ],
  },
];
