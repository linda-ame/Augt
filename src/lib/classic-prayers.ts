export type ClassicPrayer = {
  id: string;
  title: string;
  text: string;
};

/** Standard Latvian Catholic forms (static; not AI-generated). */
export const CLASSIC_PRAYERS: ClassicPrayer[] = [
  {
    id: "our_father",
    title: "Tēvs mūsu",
    text: `Tēvs mūsu, kas esi debesīs, svētīts lai top Tavs Vārds, lai atnāk Tava valstība, Tavs prāts lai notiek kā debesīs, tā arī virs zemes.

Mūsu dienišķo maizi dod mums šodien un piedod mums mūsu parādus, kā arī mēs piedodam saviem parādniekiem, un neieved mūs kārdināšanā, bet atpestī mūs no ļauna. Amen.`,
  },
  {
    id: "hail_mary",
    title: "Esi sveicināta",
    text: `Esi sveicināta, Marija, žēlastības pilnā, Kungs ir ar tevi; tu esi svētīta starp sievietēm, un svētīts ir tavas miesas auglis Jēzus.

Svētā Marija, Dieva Māte, lūdz par mums, grēciniekiem, tagad un mūsu nāves stundā. Amen.`,
  },
  {
    id: "glory_be",
    title: "Gods lai ir",
    text: `Gods lai ir Tēvam un Dēlam, un Svētajam Garam, kā tas no iesākuma ir bijis, tā tagad un vienmēr, un mūžīgi mūžam. Amen.`,
  },
  {
    id: "creed",
    title: "Es ticu",
    text: `Es ticu uz Dievu, visvareno Tēvu, debesu un zemes Radītāju, un uz Jēzu Kristu, Viņa vienpiedzimušo Dēlu, mūsu Kungu, kas ir ieņemts no Svētā Gara, piedzimis no Jaunavas Marijas, cietis zem Poncija Pilāta, krustā sists, nomiris un apbedīts, nokāpis ellē, trešajā dienā augšāmcēlies no miroņiem, uzkāpis debesīs, sēž pie Dieva, visvarenā Tēva, labās rokas, no kurienes Viņš atnāks tiesāt dzīvos un mirušos.

Es ticu uz Svēto Garu, svēto, katolisko Baznīcu, svēto sadraudzību, grēku piedošanu, miesas augšāmcelšanos un mūžīgo dzīvošanu. Amen.`,
  },
  {
    id: "sub_tuum",
    title: "Tavā patvērumā",
    text: `Tavā patvērumā steidzamies, svētā Dieva Dzemdētāja, nenicini mūsu lūgšanas mūsu vajadzībās, bet izglāb mūs vienmēr no visām briesmām, tu godināmā un svētā Jaunava, mūsu valdniece, mūsu vidutāja, mūsu aizbildinātāja! Samierini mūs ar savu Dēlu, novēli mūs savam Dēlam, stādi mūs savam Dēlam priekšā.

V. Lūdz par mums, svētā Dieva Dzemdētāja.
R. Lai mēs Kristus solījumu cienīgi topam.

Lūgsimies!
Dievs, mēs Tevi lūdzam: liec, lai mūsu, Tavu kalpu, dvēsele un miesa vienmēr būtu vesela un ar slavējamās Vissvētākās Jaunavas Marijas aizbildniecību mēs tiktu atbrīvoti no laicīgā ļaunuma un priecātos mūžīgā dzīvē. Caur Jēzu Kristu, mūsu Kungu. Amen.`,
  },
];
