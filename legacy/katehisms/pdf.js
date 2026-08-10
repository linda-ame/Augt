// =========================
let fontPromise = null;
// STATE
// =========================
window.state = window.state || {
  firstConfession: false,
  saveDuration: 0,
  answers: {},
  notes: {},
  customSins: []
};

window.pdfData = null;
window.fontReady = false;

// =========================
// LOAD PDF STRUCTURE
// =========================
const pdfDataPromise = fetch("../data/greksudze.json")
  .then(r => r.json())
  .then(data => {
    window.pdfData = data;
    console.log("✔ greksudze.json ielādēts (PDF)");
  })
  .catch(err => console.error("❌ PDF JSON error", err));

// =========================
// FONT LOADER
// =========================
async function loadFontOnce() {
  if (fontPromise) return fontPromise;

  fontPromise = (async () => {
    const url =
      "https://raw.githubusercontent.com/googlefonts/noto-fonts/main/hinted/ttf/NotoSans/NotoSans-Regular.ttf";

    const italicUrl =
      "https://raw.githubusercontent.com/googlefonts/noto-fonts/main/hinted/ttf/NotoSans/NotoSans-Italic.ttf";

    // -------------------------
    // REGULAR FONT
    // -------------------------
    const res = await fetch(url);
    const buffer = await res.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }

    const base64 = btoa(binary);

    window.pdfFontBase64 = base64;
    window.pdfFontName = "NotoSans";

    // -------------------------
    // ITALIC FONT
    // -------------------------
    const italicRes = await fetch(italicUrl);
    const italicBuffer = await italicRes.arrayBuffer();
    const italicBytes = new Uint8Array(italicBuffer);

    let italicBinary = "";
    for (let i = 0; i < italicBytes.length; i++) {
      italicBinary += String.fromCharCode(italicBytes[i]);
    }

    const italicBase64 = btoa(italicBinary);

    // 🔥 FIX: SAVE GLOBALLY
    window.pdfFontItalicBase64 = italicBase64;

    console.log("✔ fonti gatavi (regular + italic)");
  })();

  return fontPromise;
}

// =========================
// MAIN PDF FUNCTION
// =========================
async function generatePDFData() {

  await loadFontOnce();

  if (window.pdfDataPromise) {
    await pdfDataPromise;
  }

  const pdfData = window.pdfData;
  const uiData = window.appData;
  const state = window.state;

  if (!pdfData?.content?.steps) {
    alert("PDF struktūra nav ielādēta");
    return;
  }

  if (!uiData?.content?.commandments) {
    alert("UI dati nav ielādēti");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // -------------------------
  // REGISTER FONTS
  // -------------------------
  doc.addFileToVFS("NotoSans.ttf", window.pdfFontBase64);
  doc.addFont("NotoSans.ttf", "NotoSans", "normal");

  doc.addFileToVFS("NotoSans-Italic.ttf", window.pdfFontItalicBase64);
  doc.addFont("NotoSans-Italic.ttf", "NotoSans", "italic");

  doc.setFont("NotoSans");

  // =========================
  let y = 16;
  const left = 20;
  const indent = 28;

  function checkPage(space = 10) {
    if (y + space > 280) {
      doc.addPage();
      y = 22;
      doc.setFont("NotoSans");
      doc.setFontSize(11);
    }
  }

  // =========================
  // HEADER
  // =========================
  doc.setFontSize(15);
  doc.text("Špikeris grēksūdzei", left, y);
  doc.text("Špikeris grēksūdzei", left + 0.2, y);
  y += 8;

  // =========================
  function renderStep(step) {
    if (!step) return;

    checkPage(8);
    doc.setFontSize(11);

    (step.text || []).forEach(t => {
      checkPage(10);
      doc.text(t || "", left, y);
      doc.text(t || "", left + 0.1, y);
      y += 5;
    });
    y += 1;
  }

  function renderStepAfter(step) {
    if (!step) return;

    checkPage(8);
    doc.setFontSize(11);

    (step.text || []).forEach(t => {
      checkPage(10);
      doc.text(t || "", left, y);
      y += 5;
    });

  }

  const steps = pdfData.content.steps;

  // =========================
  // STEPS
  // =========================
  renderStep(steps[0]);
  renderStep(steps[1]);

  const step3 = steps.find(s => s.type === "conditional");

  if (step3) {
    const key = state.firstConfession
      ? "first_confession"
      : "not_first_confession";

    (step3.cases?.[key] || []).forEach(t => {
      checkPage(10);
      doc.text(t || "", left, y);
      doc.text(t || "", left + 0.1, y);
      y += 4;
    });

    y += 2;
  }

  const step4 = steps.find(s => s.type === "dynamic_sins");

  if (step4) {
    doc.text(step4.intro || "", left, y);
    doc.text(step4.intro || "", left + 0.1, y);
    y += 6;

    const commandments = uiData.content.commandments;

    commandments.forEach(cmd => {
      cmd.questions.forEach(q => {

        if (!state.answers[q.id]) return;

        const qText = doc.splitTextToSize("• " + q.text, 165);
const qHeight = qText.length * 5;

const note = state.notes?.[q.id];
const n = note?.trim()
  ? doc.splitTextToSize(note, 150)
  : [];

const nHeight = n.length * 5;

// 🔥 vienmēr skaiti abus kopā
const totalHeight = qHeight + nHeight + 5;

checkPage(totalHeight);

// render
doc.text(qText, left + 8, y);
y += qHeight;

if (n.length) {
  doc.setFont("NotoSans", "italic");
  doc.text(n, left + 16, y);
  y += nHeight;
  doc.setFont("NotoSans", "normal");
}

y += 1;
      });
    });
  }

  // =========================
  // CUSTOM SINS
  // =========================
  (window.state.customSins || []).forEach(sin => {
    if (!sin.text?.trim()) return;

    const text = doc.splitTextToSize("• " + sin.text, 165);
    doc.text(text, left + 8, y);
    y += text.length * 5 + 2;
  });

  // =========================
  // STEP 5–7
  // =========================
  renderStep(steps[4]);

  doc.setFont("NotoSans", "italic");
  renderStepAfter(steps[5]);

  y += 2;

  doc.setFont("NotoSans", "normal");
  renderStep(steps[6]);

    y += 2;
  doc.setFontSize(13);
  doc.text("Pēc grēksūdzes", left, y);
  doc.text("Pēc grēksūdzes", left + 0.2, y);
  y += 6;

  // =========================
  // STEP 8–10
  // =========================
  renderStepAfter(steps[7]);

  const step8Height = 3 * 5; // vai tavs lineHeight
    checkPage(step8Height);

  renderStepAfter(steps[8]);
  renderStepAfter(steps[9]);

  doc.save("sirdsapzinas-izmeklesana.pdf");
}

window.generatePDFData = generatePDFData;