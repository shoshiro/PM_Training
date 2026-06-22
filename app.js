// --- State ---
const STATE_KEY = "pm_trainer_state";
const API_KEY_KEY = "pm_trainer_api_key";

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

function getApiKey() {
  return localStorage.getItem(API_KEY_KEY);
}

function setApiKey(key) {
  localStorage.setItem(API_KEY_KEY, key);
}

let state = loadState();
let sessionDrills = [];
let currentDrillIndex = 0;
let timerInterval = null;
let timeLeft = 600;
let sessionResults = [];
let isFreeMode = false;
let feedbackVisible = false;

// --- Claude API ---
async function callClaude(systemPrompt, userMessage) {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("No API key set");

  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true"
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }]
    })
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error?.message || `API error ${resp.status}`);
  }

  const data = await resp.json();
  return data.content[0].text;
}

function buildFeedbackPrompt(drill, userResponse) {
  const drillType = drill.drillType;
  const typeLabel = TYPE_LABELS[drillType] || drillType;

  let context = "";
  if (drill.scenario) context += `Scenario: ${drill.scenario}\n`;
  if (drill.context) context += `Context: ${drill.context}\n`;
  if (drill.original) context += `Original (bad) statement to fix: "${drill.original}"\n`;
  context += `Exercise prompt: ${drill.prompt}\n`;

  let frameworkRef = "";
  if (drillType === "bluf_rewrite") {
    frameworkRef = "BLUF (Bottom Line Up Front): Lead with the conclusion/ask, then supporting logic, urgency, and next steps.";
  } else if (drillType === "pyramid_structure") {
    frameworkRef = "Pyramid Principle: Answer first, then 2-3 grouped supporting arguments, each backed by evidence.";
  } else if (drillType === "scqa_framing") {
    frameworkRef = "SCQA: Situation (stable state) → Complication (what changed) → Question (key question) → Answer (recommendation).";
  } else if (drillType === "antipattern_fix") {
    frameworkRef = "Common anti-patterns: hedging language, burying the lead, passive voice, over-qualifying, vague asks, unnecessary apologies, solution-jumping.";
  } else if (drillType === "one_breath") {
    frameworkRef = "One-Breath Rule: Deliver the core message in ~15 seconds / 2 sentences. If you can't, simplify.";
  } else if (drillType === "stakeholder_sim") {
    frameworkRef = "Stakeholder management: Balance empathy with clarity. Acknowledge concerns, own gaps, provide specific next steps. Don't take sides or make empty promises.";
  }

  return {
    system: `You are a senior PM communication coach. You give concise, actionable feedback on PM articulation exercises.

Your feedback MUST follow this exact JSON structure — no markdown, no extra text, just valid JSON:
{
  "score": <number 1-10>,
  "good": "<what the user did well — be specific, quote their words>",
  "improve": "<what needs work — be specific about which words/patterns to change and why>",
  "rewrite": "<your improved version of their response that demonstrates the feedback>"
}

Framework reference for this drill: ${frameworkRef}

Scoring guide:
1-3: Misses the framework entirely, contains multiple anti-patterns
4-5: Partially applies the framework, has notable weaknesses
6-7: Solid application with room for improvement
8-9: Strong execution with minor polish needed
10: Exceptional — clear, structured, authoritative

Be tough but encouraging. Focus on PM-specific communication patterns, not grammar. Always explain WHY something should change, tied back to organizational effectiveness and influence.`,

    user: `Drill type: ${typeLabel}
${context}
User's response:
"${userResponse}"

Analyze this response and return your feedback as JSON.`
  };
}

async function getFeedback(drill, userResponse) {
  const { system, user } = buildFeedbackPrompt(drill, userResponse);
  const raw = await callClaude(system, user);

  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Invalid feedback format");
  return JSON.parse(jsonMatch[0]);
}

function renderFeedback(feedback) {
  const area = document.getElementById("feedback-area");
  area.style.display = "block";
  area.innerHTML = `
    <div class="fb-score" style="color: ${feedback.score >= 7 ? 'var(--green)' : feedback.score >= 4 ? 'var(--orange)' : 'var(--accent2)'}">
      Score: ${feedback.score}/10
    </div>
    <div class="fb-good">
      <h4>What you did well</h4>
      <p>${escapeHtml(feedback.good)}</p>
    </div>
    <div class="fb-improve">
      <h4>What to improve</h4>
      <p>${escapeHtml(feedback.improve)}</p>
    </div>
    <div class="fb-rewrite">
      <h4>Stronger version</h4>
      <div class="rewrite-text">${escapeHtml(feedback.rewrite)}</div>
    </div>
  `;
  feedbackVisible = true;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function showFeedbackLoading() {
  const area = document.getElementById("feedback-area");
  area.style.display = "block";
  area.innerHTML = `<div class="loading-feedback"><span class="spinner"></span>Analyzing your response...</div>`;
}

function showFeedbackError(msg) {
  const area = document.getElementById("feedback-area");
  area.style.display = "block";
  area.innerHTML = `<div class="loading-feedback" style="color: var(--accent2);">${escapeHtml(msg)}</div>`;
}

function hideFeedback() {
  const area = document.getElementById("feedback-area");
  area.style.display = "none";
  area.innerHTML = "";
  feedbackVisible = false;
}

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

// --- Setup Screen ---
document.getElementById("save-key-btn").addEventListener("click", () => {
  const key = document.getElementById("api-key-input").value.trim();
  if (!key) return;
  setApiKey(key);
  showScreen("home-screen");
  document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
  document.querySelector('.nav-btn[data-screen="home-screen"]').classList.add("active");
  renderHome();
});

document.getElementById("change-key-btn").addEventListener("click", () => {
  document.getElementById("api-key-input").value = getApiKey() || "";
  showScreen("setup-screen");
});

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

  const pool = [];
  types.forEach(t => {
    const items = DRILL_SCENARIOS[t.type];
    if (items) {
      items.forEach((item, idx) => {
        pool.push({ ...item, drillType: t.type, weight: t.weight, idx });
      });
    }
  });

  const shuffled = pool
    .map(p => ({ ...p, sort: Math.random() * p.weight }))
    .sort((a, b) => b.sort - a.sort);

  const typeCounts = {};
  for (const item of shuffled) {
    if (drills.length >= 8) break;
    const tc = typeCounts[item.drillType] || 0;
    if (tc >= 2) continue;
    typeCounts[item.drillType] = tc + 1;
    drills.push(item);
  }

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
  hideFeedback();
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
  hideFeedback();

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
    <button class="btn-feedback" onclick="submitForFeedback()">Get Feedback</button>
    <button class="btn-next" onclick="saveAndNext()">Next</button>
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
    <button class="btn-feedback" onclick="submitForFeedback()">Get Feedback</button>
    <button class="btn-next" onclick="saveAndNext()">Next</button>
  `;
}

// --- Drill Actions ---
window.nextDrill = function () {
  currentDrillIndex++;
  renderDrill();
};

window.skipDrill = function () {
  sessionResults.push({ type: sessionDrills[currentDrillIndex]?.drillType, skipped: true });
  currentDrillIndex++;
  renderDrill();
};

window.saveAndNext = function () {
  const response = document.getElementById("drill-response")?.value || "";
  sessionResults.push({
    type: sessionDrills[currentDrillIndex]?.drillType,
    response,
    completed: response.trim().length > 0
  });
  currentDrillIndex++;
  renderDrill();
};

window.submitForFeedback = async function () {
  const response = document.getElementById("drill-response")?.value?.trim();
  if (!response) {
    showFeedbackError("Write something first, then get feedback.");
    return;
  }

  if (!getApiKey()) {
    showFeedbackError("No API key set. Go to settings to add one.");
    return;
  }

  const drill = sessionDrills[currentDrillIndex];
  showFeedbackLoading();

  // Disable the feedback button while loading
  const fbBtn = document.querySelector(".btn-feedback");
  if (fbBtn) {
    fbBtn.disabled = true;
    fbBtn.textContent = "Analyzing...";
  }

  try {
    const feedback = await getFeedback(drill, response);
    renderFeedback(feedback);
    sessionResults.push({
      type: drill.drillType,
      response,
      completed: true,
      score: feedback.score,
      feedback
    });
  } catch (err) {
    showFeedbackError(`Feedback failed: ${err.message}`);
  } finally {
    if (fbBtn) {
      fbBtn.disabled = false;
      fbBtn.textContent = "Get Feedback";
    }
  }
};

// --- Session End ---
function endSession() {
  clearInterval(timerInterval);
  hideFeedback();

  const today = new Date().toDateString();
  const completed = sessionResults.filter(r => r.completed || r.correct !== undefined).length;
  const quizCorrect = sessionResults.filter(r => r.correct === true).length;
  const quizTotal = sessionResults.filter(r => r.correct !== undefined).length;
  const skipped = sessionResults.filter(r => r.skipped).length;
  const scores = sessionResults.filter(r => r.score).map(r => r.score);
  const avgScore = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : null;

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

  const summary = document.getElementById("review-summary");
  summary.innerHTML = `
    <div class="review-stat"><span>Drills completed</span><span>${completed}</span></div>
    <div class="review-stat"><span>Skipped</span><span>${skipped}</span></div>
    ${quizTotal > 0 ? `<div class="review-stat"><span>Quiz accuracy</span><span>${quizCorrect}/${quizTotal}</span></div>` : ""}
    ${avgScore ? `<div class="review-stat"><span>Avg feedback score</span><span>${avgScore}/10</span></div>` : ""}
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
if (getApiKey()) {
  showScreen("home-screen");
  renderHome();
} else {
  showScreen("setup-screen");
}
