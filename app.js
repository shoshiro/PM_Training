// --- State ---
const STATE_KEY = "pm_trainer_state";

function loadState() {
  const raw = localStorage.getItem(STATE_KEY);
  return raw ? JSON.parse(raw) : {
    streak: 0,
    lastSessionDate: null,
    totalSessions: 0,
    totalDrills: 0,
    drillsPerType: {},
    history: []
  };
}

function saveState(s) {
  localStorage.setItem(STATE_KEY, JSON.stringify(s));
}

let state = loadState();
let sessionDrills = [];
let currentDrillIndex = 0;
let timerInterval = null;
let timeLeft = 600;
let sessionResults = [];
let isFreeMode = false;

// --- Navigation ---
document.querySelectorAll(".nav-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    showScreen(btn.dataset.screen);
    document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
  });
});

function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

// --- Home Screen ---
function renderHome() {
  const streak = document.getElementById("streak-display");
  streak.textContent = state.streak > 0 ? `${state.streak}-day streak` : "";

  const today = new Date().toDateString();
  const status = document.getElementById("today-status");
  if (state.lastSessionDate === today) {
    status.textContent = "Today's session complete";
    document.getElementById("start-btn").textContent = "Train Again";
  } else {
    status.textContent = "";
    document.getElementById("start-btn").textContent = "Start Today's Session";
  }

  const grid = document.getElementById("stats-grid");
  grid.innerHTML = `
    <div class="stat-item"><div class="stat-val">${state.totalSessions}</div><div class="stat-label">Sessions</div></div>
    <div class="stat-item"><div class="stat-val">${state.totalDrills}</div><div class="stat-label">Drills</div></div>
    <div class="stat-item"><div class="stat-val">${state.streak}</div><div class="stat-label">Day Streak</div></div>
  `;

  renderFrameworks();
}

function renderFrameworks() {
  const list = document.getElementById("framework-list");
  list.innerHTML = FRAMEWORKS.map(fw => `
    <div class="framework-card">
      <h3>${fw.name}</h3>
      <div class="fw-subtitle">${fw.subtitle}</div>
      <p>${fw.desc}</p>
      <ul class="fw-steps">
        ${fw.steps.map(s => `<li><strong>${s.label}:</strong> ${s.text}</li>`).join("")}
      </ul>
      <div class="fw-example">${fw.example}</div>
    </div>
  `).join("");
}

// --- Session Generation ---
function generateSession() {
  const drills = [];
  const types = [
    { type: "quiz", weight: 2 },
    { type: "antipattern_fix", weight: 2 },
    { type: "bluf_rewrite", weight: 1.5 },
    { type: "pyramid_structure", weight: 1 },
    { type: "scqa_framing", weight: 1 },
    { type: "one_breath", weight: 1.5 },
    { type: "stakeholder_sim", weight: 1 }
  ];

  // Pick ~8 drills with weighted random selection across types
  const pool = [];
  types.forEach(t => {
    const items = DRILL_SCENARIOS[t.type];
    if (items) {
      items.forEach((item, idx) => {
        pool.push({ ...item, drillType: t.type, weight: t.weight, idx });
      });
    }
  });

  // Shuffle weighted
  const shuffled = pool
    .map(p => ({ ...p, sort: Math.random() * p.weight }))
    .sort((a, b) => b.sort - a.sort);

  // Pick up to 8, no more than 2 per type
  const typeCounts = {};
  for (const item of shuffled) {
    if (drills.length >= 8) break;
    const tc = typeCounts[item.drillType] || 0;
    if (tc >= 2) continue;
    typeCounts[item.drillType] = tc + 1;
    drills.push(item);
  }

  // Shuffle final order
  for (let i = drills.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [drills[i], drills[j]] = [drills[j], drills[i]];
  }

  return drills;
}

const TYPE_LABELS = {
  quiz: "Quick Quiz",
  antipattern_fix: "Fix the Anti-Pattern",
  bluf_rewrite: "BLUF Drill",
  pyramid_structure: "Pyramid Principle",
  scqa_framing: "SCQA Framing",
  one_breath: "One-Breath Challenge",
  stakeholder_sim: "Stakeholder Simulation"
};

// --- Session Flow ---
document.getElementById("start-btn").addEventListener("click", () => startSession(false));
document.getElementById("practice-btn").addEventListener("click", () => startSession(true));

function startSession(free) {
  isFreeMode = free;
  sessionDrills = generateSession();
  currentDrillIndex = 0;
  sessionResults = [];
  timeLeft = 600;
  showScreen("session-screen");
  startTimer();
  renderDrill();
}

function startTimer() {
  clearInterval(timerInterval);
  updateTimerDisplay();
  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimerDisplay();
    if (timeLeft <= 0 && !isFreeMode) {
      clearInterval(timerInterval);
      endSession();
    }
  }, 1000);
}

function updateTimerDisplay() {
  const m = Math.floor(Math.max(0, timeLeft) / 60);
  const s = Math.max(0, timeLeft) % 60;
  document.getElementById("timer").textContent = `${m}:${s.toString().padStart(2, "0")}`;
  const pct = ((600 - timeLeft) / 600) * 100;
  document.getElementById("progress-fill").style.width = `${Math.min(100, pct)}%`;
}

function renderDrill() {
  if (currentDrillIndex >= sessionDrills.length) {
    endSession();
    return;
  }

  const drill = sessionDrills[currentDrillIndex];
  const area = document.getElementById("drill-area");
  const actions = document.getElementById("drill-actions");
  const counter = document.getElementById("drill-counter");
  counter.textContent = `Drill ${currentDrillIndex + 1} of ${sessionDrills.length}`;

  if (drill.drillType === "quiz") {
    renderQuiz(drill, area, actions);
  } else if (drill.drillType === "antipattern_fix") {
    renderAntipatternFix(drill, area, actions);
  } else {
    renderWritingDrill(drill, area, actions);
  }
}

function renderQuiz(drill, area, actions) {
  let answered = false;
  area.innerHTML = `
    <h3>Framework Knowledge</h3>
    <div class="drill-type">${TYPE_LABELS.quiz}</div>
    <div class="prompt-text">${drill.question}</div>
    <ul class="options-list" id="quiz-options">
      ${drill.options.map((o, i) => `<li data-idx="${i}">${o}</li>`).join("")}
    </ul>
    <div id="quiz-explanation" class="explanation" style="display:none"></div>
  `;

  area.querySelectorAll(".options-list li").forEach(li => {
    li.addEventListener("click", () => {
      if (answered) return;
      answered = true;
      const idx = parseInt(li.dataset.idx);
      const isCorrect = idx === drill.correct;
      li.classList.add(isCorrect ? "correct" : "wrong");
      if (!isCorrect) {
        area.querySelector(`li[data-idx="${drill.correct}"]`).classList.add("correct");
      }
      document.getElementById("quiz-explanation").style.display = "block";
      document.getElementById("quiz-explanation").textContent = drill.explanation;
      sessionResults.push({ type: "quiz", correct: isCorrect });
    });
  });

  actions.innerHTML = `
    <button class="btn-skip" onclick="skipDrill()">Skip</button>
    <button class="btn-next" onclick="nextDrill()">Next</button>
  `;
}

function renderAntipatternFix(drill, area, actions) {
  let hintShown = false;
  area.innerHTML = `
    <h3>Fix the Anti-Pattern</h3>
    <div class="drill-type">${TYPE_LABELS.antipattern_fix}</div>
    <div class="bad-example">"${drill.original}"</div>
    <div class="prompt-text">${drill.prompt}</div>
    <textarea id="drill-response" placeholder="Write your improved version here..."></textarea>
    <button class="hint-btn" id="hint-toggle">Show Hint</button>
    <div id="hint-area" class="hint-text" style="display:none">${drill.hint}</div>
  `;

  document.getElementById("hint-toggle").addEventListener("click", () => {
    hintShown = !hintShown;
    document.getElementById("hint-area").style.display = hintShown ? "block" : "none";
    document.getElementById("hint-toggle").textContent = hintShown ? "Hide Hint" : "Show Hint";
  });

  actions.innerHTML = `
    <button class="btn-skip" onclick="skipDrill()">Skip</button>
    <button class="btn-reveal" onclick="revealExample()">See Example</button>
    <button class="btn-next" onclick="saveDrillAndNext()">Next</button>
  `;
}

function renderWritingDrill(drill, area, actions) {
  let hintShown = false;
  const typeLabel = TYPE_LABELS[drill.drillType] || drill.drillType;
  area.innerHTML = `
    <h3>${typeLabel}</h3>
    <div class="drill-type">${typeLabel}</div>
    ${drill.scenario ? `<div class="scenario">${drill.scenario}</div>` : ""}
    ${drill.context ? `<div class="scenario">${drill.context}</div>` : ""}
    <div class="prompt-text">${drill.prompt}</div>
    <textarea id="drill-response" placeholder="Write your response here..."></textarea>
    <button class="hint-btn" id="hint-toggle">Show Hint</button>
    <div id="hint-area" class="hint-text" style="display:none">${drill.hint}</div>
  `;

  document.getElementById("hint-toggle").addEventListener("click", () => {
    hintShown = !hintShown;
    document.getElementById("hint-area").style.display = hintShown ? "block" : "none";
    document.getElementById("hint-toggle").textContent = hintShown ? "Hide Hint" : "Show Hint";
  });

  actions.innerHTML = `
    <button class="btn-skip" onclick="skipDrill()">Skip</button>
    <button class="btn-next" onclick="saveDrillAndNext()">Next</button>
  `;
}

// --- Drill Navigation ---
window.nextDrill = function () {
  currentDrillIndex++;
  renderDrill();
};

window.skipDrill = function () {
  sessionResults.push({ type: sessionDrills[currentDrillIndex]?.drillType, skipped: true });
  currentDrillIndex++;
  renderDrill();
};

window.saveDrillAndNext = function () {
  const response = document.getElementById("drill-response")?.value || "";
  sessionResults.push({
    type: sessionDrills[currentDrillIndex]?.drillType,
    response,
    completed: response.trim().length > 0
  });
  currentDrillIndex++;
  renderDrill();
};

window.revealExample = function () {
  const drill = sessionDrills[currentDrillIndex];
  const area = document.getElementById("drill-area");
  const existing = area.querySelector(".good-example");
  if (existing) {
    existing.remove();
    return;
  }
  // Find matching antipattern example
  for (const ap of ANTI_PATTERNS) {
    for (const ex of ap.examples) {
      if (ex.bad && drill.original && ex.bad.substring(0, 30) === drill.original.substring(0, 30)) {
        const div = document.createElement("div");
        div.className = "good-example";
        div.innerHTML = `<strong>Strong version:</strong> "${ex.good}"<br><br><em>${ex.why}</em>`;
        area.appendChild(div);
        return;
      }
    }
  }
  // Generic hint if no match
  const div = document.createElement("div");
  div.className = "good-example";
  div.textContent = "Try removing hedging words, using active voice, and leading with your main point.";
  area.appendChild(div);
};

// --- Session End ---
function endSession() {
  clearInterval(timerInterval);

  const today = new Date().toDateString();
  const completed = sessionResults.filter(r => r.completed || r.correct !== undefined).length;
  const quizCorrect = sessionResults.filter(r => r.correct === true).length;
  const quizTotal = sessionResults.filter(r => r.correct !== undefined).length;
  const skipped = sessionResults.filter(r => r.skipped).length;

  // Update state
  if (!isFreeMode) {
    if (state.lastSessionDate !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      if (state.lastSessionDate === yesterday.toDateString()) {
        state.streak++;
      } else {
        state.streak = 1;
      }
    }
    state.lastSessionDate = today;
    state.totalSessions++;
  }
  state.totalDrills += completed;
  sessionResults.forEach(r => {
    if (r.type) {
      state.drillsPerType[r.type] = (state.drillsPerType[r.type] || 0) + 1;
    }
  });
  saveState(state);

  // Render review
  const summary = document.getElementById("review-summary");
  summary.innerHTML = `
    <div class="review-stat"><span>Drills completed</span><span>${completed}</span></div>
    <div class="review-stat"><span>Skipped</span><span>${skipped}</span></div>
    ${quizTotal > 0 ? `<div class="review-stat"><span>Quiz accuracy</span><span>${quizCorrect}/${quizTotal}</span></div>` : ""}
    <div class="review-stat"><span>Time used</span><span>${formatTime(600 - timeLeft)}</span></div>
    <div class="review-stat"><span>Streak</span><span>${state.streak} days</span></div>
  `;

  showScreen("review-screen");
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

document.getElementById("back-home-btn").addEventListener("click", () => {
  showScreen("home-screen");
  document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
  document.querySelector('.nav-btn[data-screen="home-screen"]').classList.add("active");
  renderHome();
});

// --- Init ---
renderHome();
