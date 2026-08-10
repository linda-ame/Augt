// =========================
// GLOBAL STATE
// =========================
window.state = window.state || {
  firstConfession: false,
  saveDuration: 0,
  answers: {},
  notes: {},
  customSins: [],
  step: "intro",
  updatedAt: Date.now()
};

// =========================
// STORAGE HELPERS
// =========================
function saveState() {
  window.state.updatedAt = Date.now();

  localStorage.setItem("confessionApp", JSON.stringify({
    state: window.state
  }));
}

function loadStateFromStorage() {
  const raw = localStorage.getItem("confessionApp");
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function isExpired(saved) {
  const hours = parseInt(saved.state.saveDuration || 0);
  if (!hours) return true;

  const diff = Date.now() - saved.state.updatedAt;
  return diff > hours * 60 * 60 * 1000;
}

// =========================
// SCREEN MANAGER (🔥 FIX GALVENAIS BUG)
// =========================
function showScreen(screenId) {
  const screens = ["screen-intro", "screen-prayer", "screen-questions"];

  screens.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
  });

  const target = document.getElementById(screenId);
  if (target) target.style.display = "block";

  window.scrollTo(0, 0);
}

// =========================
// INIT
// =========================
document.addEventListener("DOMContentLoaded", async () => {
  await loadJSON();

  const saved = loadStateFromStorage();

  if (saved && !isExpired(saved)) {
    window.state = saved.state;

    renderIntro();
    bindUI();

    showResumeModal();
    return;
  }

  renderIntro();
  bindUI();
  goToIntro();
});

// =========================
// LOAD JSON
// =========================
async function loadJSON() {
  const res = await fetch("../data/sirdsapzinas-izmeklesana.json");

  if (!res.ok) {
    console.error("JSON load failed");
    return;
  }

  window.appData = await res.json();
}

// =========================
// INTRO
// =========================
function renderIntro() {

  if (!window.appData?.content?.intro) {
    setTimeout(renderIntro, 100);
    return;
  }

  const intro = window.appData.content.intro;

  document.getElementById("intro-title").innerText = intro.title;

  const box = document.getElementById("intro-text");
  box.innerHTML = "";

  intro.text.forEach(t => {
    const p = document.createElement("p");
    p.innerText = t;
    box.appendChild(p);
  });
}

// =========================
// UI BINDINGS
// =========================
function bindUI() {

  document.getElementById("btnStart").addEventListener("click", () => {

    window.state.firstConfession =
      document.getElementById("firstConfession").checked;

    window.state.saveDuration =
      document.getElementById("saveDuration").value;

    goToPrayer();
  });

  document.getElementById("btnToQuestions")
    .addEventListener("click", goToQuestions);

  document.getElementById("btnGeneratePDF")
    .addEventListener("click", generatePDFData);

  document.getElementById("btnAddCustom")
  .addEventListener("click", () => addCustomSin());

  document.getElementById("btnClear")
    .addEventListener("click", () => {
      document.getElementById("clearModal").classList.remove("hidden");
    });

  document.getElementById("clearCancel")
    .addEventListener("click", () => {
      document.getElementById("clearModal").classList.add("hidden");
    });

  document.getElementById("clearContent")
    .addEventListener("click", () => {
      resetOnlyContent();
      document.getElementById("clearModal").classList.add("hidden");
    });

  document.getElementById("clearAll")
    .addEventListener("click", () => {
      resetAll();
      document.getElementById("clearModal").classList.add("hidden");
    });

  // RESUME
  document.getElementById("resumeContinue")?.addEventListener("click", () => {
    document.getElementById("resumeModal").classList.add("hidden");
    routeToStep();
  });

  document.getElementById("resumeRestart")?.addEventListener("click", () => {
    localStorage.removeItem("confessionApp");

    window.state = {
      firstConfession: false,
      saveDuration: 0,
      answers: {},
      notes: {},
      customSins: [],
      step: "intro",
      updatedAt: Date.now()
    };

    document.getElementById("resumeModal").classList.add("hidden");

    goToIntro();
  });
}

// =========================
// RESUME MODAL
// =========================
function showResumeModal() {
  document.getElementById("resumeModal").classList.remove("hidden");
}

function routeToStep() {
  const step = window.state.step;

  if (step === "questions") goToQuestions();
  else if (step === "prayer") goToPrayer();
  else goToIntro();
}

// =========================
// RESET (SOFT)
// =========================
function resetOnlyContent() {
  window.state.answers = {};
  window.state.notes = {};
  window.state.customSins = [];

  saveState();
  renderQuestions();
}

// =========================
// RESET (HARD)
// =========================
function resetAll() {
  window.state = {
    firstConfession: false,
    saveDuration: 0,
    answers: {},
    notes: {},
    customSins: [],
    step: "intro",
    updatedAt: Date.now()
  };

  localStorage.removeItem("confessionApp");

  document.getElementById("firstConfession").checked = false;
  document.getElementById("saveDuration").value = "0";

  goToIntro();
}

// =========================
// NAVIGATION
// =========================
function goToPrayer() {

  window.state.step = "prayer";
  saveState();

  if (!window.appData?.content?.preparation_prayer) return;

  showScreen("screen-prayer");

  const block = window.appData.content.preparation_prayer;

  document.getElementById("prayer-title").innerText = block.title;

  const box = document.getElementById("prayer-text");
  box.innerHTML = "";

  block.text.forEach(t => {
    const p = document.createElement("p");
    p.innerText = t;
    box.appendChild(p);
  });

  box.appendChild(document.createElement("hr"));

  const prayer = block.prayer;

  const title = document.createElement("h3");
  title.innerText = prayer.title;
  box.appendChild(title);

  prayer.text.forEach(t => {
    const p = document.createElement("p");
    p.innerText = t;
    box.appendChild(p);
  });
}

function goToQuestions() {

  window.state.step = "questions";
  saveState();

  showScreen("screen-questions");

  renderQuestions();
}

function goToIntro() {

  window.state.step = "intro";
  saveState();

  showScreen("screen-intro");
}

function show(id, visible) {
  document.getElementById(id).style.display = visible ? "block" : "none";
}

function renderClosingPrayer() {

  if (!window.appData?.content?.after_examination_prayer) return;

  const block =
    window.appData.content.after_examination_prayer;

  // TITLE
  document.getElementById(
    "closing-prayer-title"
  ).innerText = block.title;

  // TEXT CONTAINER
  const box = document.getElementById(
    "closing-prayer-text"
  );

  box.innerHTML = "";

  // PARAGRAPHS
  block.text.forEach(t => {

    const p = document.createElement("p");
    p.innerText = t;

    box.appendChild(p);
  });
}
// =========================
// QUESTIONS
// =========================
function renderQuestions() {

  if (!window.appData?.content?.commandments) return;

  const container = document.getElementById("questions-container");
  container.innerHTML = "";

  window.appData.content.commandments.forEach(cmd => {

    const section = document.createElement("div");
    section.className = "commandment";

    const h = document.createElement("h3");
    h.innerText = cmd.title;
    section.appendChild(h);

    cmd.questions.forEach(q => {

      const row = document.createElement("div");
      row.className = "question-row";

      const top = document.createElement("div");
      top.className = "question-top";

      const cb = document.createElement("input");
cb.type = "checkbox";

// 🔥 RESTORE STATE
cb.checked = !!window.state.answers[q.id];

      const label = document.createElement("span");
      label.innerText = " " + q.text;

      top.appendChild(cb);
      top.appendChild(label);

      const commentWrap = document.createElement("div");
      commentWrap.style.display = "none";

      const commentBox = document.createElement("textarea");
      commentBox.placeholder = "Komentārs...";

      // RESTORE NOTES (ja ir saglabāts)
if (window.state.notes[q.id]) {
  commentBox.value = window.state.notes[q.id];
  commentWrap.style.display = "flex";
}

      const closeBtn = document.createElement("button");
      closeBtn.innerText = "✕";
      closeBtn.type = "button";

      commentWrap.appendChild(commentBox);
      commentWrap.appendChild(closeBtn);

      cb.addEventListener("change", (e) => {
        const checked = e.target.checked;

        window.state.answers[q.id] = checked;

        commentWrap.style.display = checked ? "flex" : "none";

        if (!checked) {
          commentBox.value = "";
          delete window.state.notes[q.id];
        }

        saveState();
      });

      commentBox.addEventListener("input", (e) => {
        window.state.notes[q.id] = e.target.value;
        saveState();
      });

      closeBtn.addEventListener("click", () => {
        commentBox.value = "";
        commentWrap.style.display = "none";
        delete window.state.notes[q.id];
        saveState();
      });

      row.appendChild(top);
      row.appendChild(commentWrap);
      section.appendChild(row);
    });

    container.appendChild(section);
  });

  // RESTORE CUSTOM SINS
window.state.customSins.forEach(sin => {
  addCustomSin(sin);
});

renderClosingPrayer();

}

// =========================
// CUSTOM SIN
// =========================
function addCustomSin(existing = null) {

  const container = document.getElementById("questions-container");

  // EXISTING VAI NEW
  const sinData = existing || {
    id: "custom_" + Date.now(),
    text: ""
  };

  // JAUNU PIEVIENO STATE
  if (!existing) {
    window.state.customSins.push(sinData);
    saveState();
  }

  const wrapper = document.createElement("div");
  wrapper.className = "question-row custom-sin";
  wrapper.dataset.id = sinData.id;

  const top = document.createElement("div");
  top.className = "question-top";

  const label = document.createElement("div");
  label.innerText = "Cits grēks:";
  label.style.fontWeight = "bold";

  const closeBtn = document.createElement("button");
  closeBtn.innerText = "✕";
  closeBtn.type = "button";

  const textarea = document.createElement("textarea");
  textarea.placeholder = "Apraksti grēku...";

  // RESTORE
  textarea.value = sinData.text || "";

  // LIVE SAVE
  textarea.addEventListener("input", (e) => {
    sinData.text = e.target.value;
    saveState();
  });

  // DELETE
  closeBtn.addEventListener("click", () => {

    wrapper.remove();

    window.state.customSins =
      window.state.customSins.filter(s => s.id !== sinData.id);

    saveState();
  });

  top.appendChild(label);
  top.appendChild(closeBtn);

  wrapper.appendChild(top);
  wrapper.appendChild(textarea);

  container.appendChild(wrapper);
}