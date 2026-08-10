import type {
  ConfessionAppData,
  ConfessionPdfData,
  ConfessionState,
} from "@/lib/confession-types";

async function loadFontBase64(url: string): Promise<string> {
  const res = await fetch(url);
  const buffer = await res.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}

let fontPromise: Promise<{ regular: string; italic: string }> | null = null;

function loadFonts() {
  if (!fontPromise) {
    fontPromise = (async () => {
      const regular = await loadFontBase64(
        "https://raw.githubusercontent.com/googlefonts/noto-fonts/main/hinted/ttf/NotoSans/NotoSans-Regular.ttf",
      );
      const italic = await loadFontBase64(
        "https://raw.githubusercontent.com/googlefonts/noto-fonts/main/hinted/ttf/NotoSans/NotoSans-Italic.ttf",
      );
      return { regular, italic };
    })();
  }
  return fontPromise;
}

export async function generateConfessionPdf(opts: {
  appData: ConfessionAppData;
  pdfData: ConfessionPdfData;
  state: ConfessionState;
}) {
  const { jsPDF } = await import("jspdf");
  const fonts = await loadFonts();
  const { appData, pdfData, state } = opts;

  const doc = new jsPDF();
  doc.addFileToVFS("NotoSans.ttf", fonts.regular);
  doc.addFont("NotoSans.ttf", "NotoSans", "normal");
  doc.addFileToVFS("NotoSans-Italic.ttf", fonts.italic);
  doc.addFont("NotoSans-Italic.ttf", "NotoSans", "italic");
  doc.setFont("NotoSans");

  let y = 16;
  const left = 20;

  function checkPage(space = 10) {
    if (y + space > 280) {
      doc.addPage();
      y = 22;
      doc.setFont("NotoSans");
      doc.setFontSize(11);
    }
  }

  function renderStep(step: { text?: string[] } | undefined) {
    if (!step) return;
    checkPage(8);
    doc.setFontSize(11);
    (step.text || []).forEach((t) => {
      checkPage(10);
      doc.text(t || "", left, y);
      doc.text(t || "", left + 0.1, y);
      y += 5;
    });
    y += 1;
  }

  function renderStepAfter(step: { text?: string[] } | undefined) {
    if (!step) return;
    checkPage(8);
    doc.setFontSize(11);
    (step.text || []).forEach((t) => {
      checkPage(10);
      doc.text(t || "", left, y);
      y += 5;
    });
  }

  const steps = pdfData.content.steps;

  doc.setFontSize(15);
  doc.text("Špikeris grēksūdzei", left, y);
  doc.text("Špikeris grēksūdzei", left + 0.2, y);
  y += 8;

  renderStep(steps[0] as { text?: string[] });
  renderStep(steps[1] as { text?: string[] });

  const step3 = steps.find((s) => s.type === "conditional");
  if (step3 && step3.type === "conditional") {
    const key = state.firstConfession
      ? "first_confession"
      : "not_first_confession";
    (step3.cases?.[key] || []).forEach((t) => {
      checkPage(10);
      doc.text(t || "", left, y);
      doc.text(t || "", left + 0.1, y);
      y += 4;
    });
    y += 2;
  }

  const step4 = steps.find((s) => s.type === "dynamic_sins");
  if (step4 && step4.type === "dynamic_sins") {
    doc.text(step4.intro || "", left, y);
    doc.text(step4.intro || "", left + 0.1, y);
    y += 6;

    appData.content.commandments.forEach((cmd) => {
      cmd.questions.forEach((q) => {
        if (!state.answers[q.id]) return;

        const qText = doc.splitTextToSize("• " + q.text, 165);
        const qHeight = qText.length * 5;
        const note = state.notes?.[q.id];
        const n = note?.trim() ? doc.splitTextToSize(note, 150) : [];
        const nHeight = n.length * 5;
        checkPage(qHeight + nHeight + 5);

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

  (state.customSins || []).forEach((sin) => {
    if (!sin.text?.trim()) return;
    const text = doc.splitTextToSize("• " + sin.text, 165);
    checkPage(text.length * 5 + 2);
    doc.text(text, left + 8, y);
    y += text.length * 5 + 2;
  });

  renderStep(steps[4] as { text?: string[] });
  doc.setFont("NotoSans", "italic");
  renderStepAfter(steps[5] as { text?: string[] });
  y += 2;
  doc.setFont("NotoSans", "normal");
  renderStep(steps[6] as { text?: string[] });

  y += 2;
  doc.setFontSize(13);
  doc.text("Pēc grēksūdzes", left, y);
  doc.text("Pēc grēksūdzes", left + 0.2, y);
  y += 6;

  renderStepAfter(steps[7] as { text?: string[] });
  checkPage(15);
  renderStepAfter(steps[8] as { text?: string[] });
  renderStepAfter(steps[9] as { text?: string[] });

  doc.save("sirdsapzinas-izmeklesana.pdf");
}
