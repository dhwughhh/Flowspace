// ==========================================
// FLOWSPACE: TIMER, LOGS, CALENDAR & INSIGHTS
// ==========================================
let appState = { sessions: [], notes: [] };
let currentSubject = "Physics";
let timerInterval = null;
let startTime = 0;
let pausedTimeAcc = 0;
let isTimerPaused = false;
let selectedDateStr = "";

function loadData() {
  try {
    const savedData = localStorage.getItem("flowspace_data");
    if (savedData) {
      appState = JSON.parse(savedData);
      if (!Array.isArray(appState.sessions)) appState.sessions = [];
      if (!Array.isArray(appState.notes)) appState.notes = [];
    }
  } catch (e) {
    console.error("Could not load FlowSpace data:", e);
  }
}

function saveData() {
  try {
    localStorage.setItem("flowspace_data", JSON.stringify(appState));
  } catch (e) {
    console.error("Could not save FlowSpace data:", e);
  }
}

function formatDateLocal(dateObj) {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getTodayString() {
  return formatDateLocal(new Date());
}

function calculateCurrentStreak() {
  const uniqueDates = [...new Set(appState.sessions.map(s => s.date))].sort();
  if (!uniqueDates.length) return 0;

  const dates = new Set(uniqueDates);
  const today = new Date();
  const todayStr = formatDateLocal(today);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  let check = dates.has(todayStr) ? today : yesterday;
  if (!dates.has(formatDateLocal(check))) return 0;

  let streak = 0;
  while (dates.has(formatDateLocal(check))) {
    streak++;
    check = new Date(check);
    check.setDate(check.getDate() - 1);
  }
  return streak;
}

function updateDashboardUI() {
  const todayStr = getTodayString();
  const todayMins = appState.sessions
    .filter(s => s.date === todayStr)
    .reduce((total, s) => total + s.duration, 0);

  const totalMins = appState.sessions.reduce((total, s) => total + s.duration, 0);
  const totalSessions = appState.sessions.length;
  const average = totalSessions ? Math.round(totalMins / totalSessions) : 0;

  const set = (id, value) => {
    const node = document.getElementById(id);
    if (node) node.textContent = value;
  };

  set("streak-days", calculateCurrentStreak());
  set("yesterday-hours", todayMins);
  set("stat-sessions-count", totalSessions);
  set("stat-total-minutes", `${totalMins} mins`);
  set("stat-avg-session", `${average} mins`);

  renderAnalyticsChart();
}

function renderAnalyticsChart() {
  const chart = document.getElementById("analytics-chart");
  if (!chart) return;

  chart.innerHTML = "";

  const days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = formatDateLocal(date);
    const minutes = appState.sessions
      .filter(s => s.date === dateStr)
      .reduce((total, s) => total + s.duration, 0);
    days.push({ date, minutes });
  }

  const maxMinutes = Math.max(1, ...days.map(day => day.minutes));

  days.forEach(day => {
    const bar = document.createElement("div");
    bar.className = "chart-bar";
    bar.style.height = `${Math.max(4, (day.minutes / maxMinutes) * 65)}px`;
    bar.title = `${day.date.toLocaleDateString()}: ${day.minutes} minutes`;
    chart.appendChild(bar);
  });
}

function renderDynamicCalendar() {
  const calendarGrid = document.getElementById("calendar-days");
  if (!calendarGrid) return;

  calendarGrid.innerHTML = "";

  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  for (let day = 1; day <= daysInMonth; day++) {
    const element = document.createElement("div");
    element.className = "day";
    element.textContent = day;
    element.style.cursor = "pointer";

    const target = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    if (appState.sessions.some(s => s.date === target)) {
      element.classList.add("cell-active");
    }

    if (selectedDateStr === target) {
      element.style.outline = "2px solid #4c0519";
    }

    element.onclick = () => {
      selectedDateStr = selectedDateStr === target ? "" : target;
      renderDynamicCalendar();
      renderNotes();
    };

    calendarGrid.appendChild(element);
  }
}

function renderNotes() {
  const container = document.getElementById("historical-notes-display");
  if (!container) return;

  let sessions = appState.sessions;
  if (selectedDateStr) {
    sessions = sessions.filter(s => s.date === selectedDateStr);
  }

  if (!sessions.length) {
    container.innerHTML = "";
    const message = document.createElement("p");
    message.style.cssText = "font-size:.85rem;opacity:.6;font-style:italic;";
    message.textContent = selectedDateStr
      ? `No sessions logged for ${selectedDateStr}.`
      : "No logged history yet.";
    container.appendChild(message);
    return;
  }

  container.innerHTML = "";

  sessions.slice().reverse().forEach(session => {
    const index = appState.sessions.indexOf(session);
    const card = document.createElement("div");
    card.className = "historical-note-item";
    card.style.position = "relative";

    const meta = document.createElement("span");
    meta.className = "historical-note-meta";
    meta.textContent = `${session.date} • ${session.subject} (${session.duration} mins)`;

    const details = document.createElement("span");
    details.style.cssText = "font-size:.85rem;display:block;";
    details.textContent = session.topic ? `Goal: ${session.topic}` : "General Focus Session";

    if (session.bullets && session.bullets.length) {
      const bullets = document.createElement("div");
      bullets.style.cssText = "margin-top:6px;padding-left:10px;border-left:2px solid rgba(76,5,25,.15);";

      session.bullets.forEach(text => {
        const line = document.createElement("p");
        line.style.cssText = "font-size:.8rem;opacity:.85;white-space:pre-wrap;";
        line.textContent = `• ${text}`;
        bullets.appendChild(line);
      });

      details.appendChild(bullets);
    }

    const remove = document.createElement("button");
    remove.textContent = "×";
    remove.setAttribute("aria-label", "Delete session");
    remove.style.cssText = "position:absolute;right:5px;top:2px;background:none;border:none;color:#f43f5e;cursor:pointer;font-size:1.2rem;font-weight:700;";
    remove.onclick = event => {
      event.stopPropagation();
      if (index !== -1) appState.sessions.splice(index, 1);
      saveData();
      updateDashboardUI();
      renderDynamicCalendar();
      renderNotes();
    };

    card.append(meta, details, remove);
    container.appendChild(card);
  });
}

function handleBulletPoints(event) {
  if (event.key !== "Enter") return;
  event.preventDefault();

  const scratchpad = document.getElementById("scratchpad");
  const list = document.getElementById("active-bullet-list");
  if (!scratchpad || !list) return;

  const text = scratchpad.value.trim();
  if (!text) return;

  appState.notes.push(text);

  const line = document.createElement("p");
  line.style.marginBottom = "4px";
  line.textContent = `• ${text}`;
  list.appendChild(line);
  list.scrollTop = list.scrollHeight;
  scratchpad.value = "";
}

function selectSubject(subjectName) {
  currentSubject = subjectName;

  document.querySelectorAll(".subject-pill").forEach(button => {
    let value = button.textContent.trim();
    if (value === "Skills") value = "Skill Building";
    button.classList.toggle(
      "active",
      value.toLowerCase() === subjectName.toLowerCase()
    );
  });
}

function getElapsedSeconds() {
  if (isTimerPaused) return pausedTimeAcc;
  return pausedTimeAcc + Math.floor((Date.now() - startTime) / 1000);
}

function startFocus() {
  const input = document.getElementById("session-name");
  const topic = document.getElementById("current-topic");
  const subject = document.getElementById("current-subject");
  const bulletList = document.getElementById("active-bullet-list");

  if (topic) topic.textContent = input.value.trim() || "Deep Revision";
  if (subject) subject.textContent = currentSubject;
  if (bulletList) bulletList.innerHTML = "";

  appState.notes = [];

  document.getElementById("home-screen").classList.replace("active", "hidden");
  document.getElementById("timer-screen").classList.replace("hidden", "active");

  startTime = Date.now();
  pausedTimeAcc = 0;
  isTimerPaused = false;

  const pauseButton = document.getElementById("pause-btn");
  if (pauseButton) pauseButton.textContent = "Pause";

  updateTimerDisplay();

  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (!isTimerPaused) updateTimerDisplay();
  }, 500);

  resetExplainForNewSession();
}

function updateTimerDisplay() {
  const seconds = getElapsedSeconds();
  const display = document.getElementById("time-display");

  if (display) {
    display.textContent =
      `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  }

  const hour = document.getElementById("hour-hand");
  const minute = document.getElementById("minute-hand");
  const second = document.getElementById("second-hand");

  if (second) second.style.transform = `translateX(-50%) rotate(${(seconds * 6) % 360}deg)`;
  if (minute) minute.style.transform = `translateX(-50%) rotate(${((seconds / 60) * 6) % 360}deg)`;
  if (hour) hour.style.transform = `translateX(-50%) rotate(${((seconds / 3600) * 30) % 360}deg)`;
}

function toggleTimer() {
  const button = document.getElementById("pause-btn");

  if (!isTimerPaused) {
    pausedTimeAcc += Math.floor((Date.now() - startTime) / 1000);
    isTimerPaused = true;
    if (button) button.textContent = "Resume";
  } else {
    startTime = Date.now();
    isTimerPaused = false;
    if (button) button.textContent = "Pause";
  }
}

function finishSession(saveVoiceNotes) {
  stopExplainCapture();

  const totalMinutes = Math.floor(getElapsedSeconds() / 60);
  const input = document.getElementById("session-name");
  const scratchpad = document.getElementById("scratchpad");
  const voiceText = document.getElementById("explain-transcript")?.value.trim() || "";

  if (scratchpad && scratchpad.value.trim()) {
    appState.notes.push(scratchpad.value.trim());
    scratchpad.value = "";
  }

  if (saveVoiceNotes && voiceText) {
    voiceText.split(/\n+/).map(line => line.replace(/^•\s*/, "").trim())
      .filter(Boolean).forEach(line => appState.notes.push(line));
  }

  appState.sessions.push({
    date: getTodayString(),
    duration: totalMinutes || 1,
    subject: currentSubject,
    topic: input ? input.value.trim() : "",
    bullets: [...appState.notes]
  });

  appState.notes = [];
  saveData();

  if (timerInterval) clearInterval(timerInterval);
  timerInterval = null;

  document.getElementById("timer-screen").classList.replace("active", "hidden");
  document.getElementById("home-screen").classList.replace("hidden", "active");

  if (input) input.value = "";

  updateDashboardUI();
  renderDynamicCalendar();
  renderNotes();
  clearExplainDraft();
}

function quitSession(fromReview = false) {
  if (!fromReview && shouldReviewVoiceNotes()) {
    showEndReview();
    return;
  }

  finishSession(fromReview === true ? reviewShouldSave : false);
  closeExplainCompletely();
  resetReviewUI();
}

window.addEventListener("popstate", () => {
  if (document.getElementById("timer-screen")?.classList.contains("active")) {
    quitSession();
  }
});

function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove("hidden");
  selectedDateStr = "";
  renderDynamicCalendar();
  renderNotes();
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add("hidden");
}

// ==========================================
// EXPLAIN YOURSELF: VOICE, DRAFT & REVIEW
// ==========================================
const EXPLAIN_DRAFT_KEY = "flowspace_explain_draft_v1";

let voiceRecognition = null;
let micStream = null;
let audioContext = null;
let analyser = null;
let micAnimationFrame = 0;
let isCapturing = false;
let explainUsedThisSession = false;
let reviewOpen = false;
let reviewShouldSave = false;
let pausedForReview = false;

const explainEl = id => document.getElementById(id);

function saveExplainDraft() {
  const transcript = explainEl("explain-transcript");
  if (!transcript) return;

  try {
    if (transcript.value.trim()) {
      localStorage.setItem(EXPLAIN_DRAFT_KEY, transcript.value);
    } else {
      localStorage.removeItem(EXPLAIN_DRAFT_KEY);
    }
  } catch (error) {
    setExplainStatus("Browser storage is unavailable. Keep this panel open until you save your notes.");
  }
}

function loadExplainDraft() {
  try {
    return localStorage.getItem(EXPLAIN_DRAFT_KEY) || "";
  } catch (_) {
    return "";
  }
}

function clearExplainDraft() {
  try {
    localStorage.removeItem(EXPLAIN_DRAFT_KEY);
  } catch (_) {}

  const transcript = explainEl("explain-transcript");
  if (transcript) transcript.value = "";
}

function setExplainStatus(message) {
  const status = explainEl("explain-status");
  if (status) status.textContent = message;
}

function setOrbEnergy(energy) {
  const orb = explainEl("explain-orb");
  if (!orb) return;
  orb.style.setProperty("--voice-scale", (1 + Math.min(0.38, Math.max(0, energy))).toFixed(3));
}

function animateMicrophone() {
  if (!analyser) return;

  const buffer = new Uint8Array(analyser.frequencyBinCount);

  function tick() {
    if (!isCapturing || !analyser) return;

    analyser.getByteTimeDomainData(buffer);

    let sumSquares = 0;
    for (let i = 0; i < buffer.length; i++) {
      const value = (buffer[i] - 128) / 128;
      sumSquares += value * value;
    }

    const rms = Math.sqrt(sumSquares / Math.max(1, buffer.length));
    setOrbEnergy(Math.min(0.38, rms * 1.9));
    micAnimationFrame = requestAnimationFrame(tick);
  }

  micAnimationFrame = requestAnimationFrame(tick);
}

function startSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) return false;

  const transcript = explainEl("explain-transcript");
  if (!transcript) return false;

  try {
    voiceRecognition = new SpeechRecognition();
    voiceRecognition.continuous = true;
    voiceRecognition.interimResults = true;
    voiceRecognition.lang = "en-IN";

    const baseText = transcript.value.trim();
    let confirmedText = "";
    let interimText = "";

    voiceRecognition.onresult = event => {
      confirmedText = "";
      interimText = "";

      for (let i = 0; i < event.results.length; i++) {
        const phrase = (event.results[i][0]?.transcript || "").trim();
        if (!phrase) continue;

        if (event.results[i].isFinal) {
          confirmedText += (confirmedText ? " " : "") + phrase;
        } else {
          interimText += (interimText ? " " : "") + phrase;
        }
      }

      transcript.value = [baseText, confirmedText, interimText].filter(Boolean).join(" ").trim();
      saveExplainDraft();
    };

    voiceRecognition.onerror = event => {
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        setExplainStatus("Microphone permission was denied. You can still type your explanation.");
      } else if (event.error !== "no-speech" && event.error !== "aborted") {
        setExplainStatus(`Speech-to-text paused (${event.error}). Your draft is preserved.`);
      }
    };

    voiceRecognition.onend = () => {
      if (isCapturing && voiceRecognition) {
        try { voiceRecognition.start(); } catch (_) {}
      }
    };

    voiceRecognition.start();
    return true;
  } catch (_) {
    voiceRecognition = null;
    return false;
  }
}

async function startExplainCapture() {
  if (isCapturing) return;

  explainUsedThisSession = true;
  isCapturing = true;

  const orb = explainEl("explain-orb");
  const startButton = explainEl("explain-start-button");
  const stopButton = explainEl("explain-stop-button");

  if (orb) orb.classList.add("is-listening");
  if (startButton) startButton.disabled = true;
  if (stopButton) stopButton.disabled = false;

  let micReady = false;

  if (navigator.mediaDevices?.getUserMedia) {
    try {
      micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;

      if (AudioContextClass) {
        audioContext = new AudioContextClass();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;

        const source = audioContext.createMediaStreamSource(micStream);
        source.connect(analyser);
        animateMicrophone();
        micReady = true;
      }
    } catch (_) {
      setExplainStatus("Microphone permission was not granted. You can still type notes or try voice capture again.");
    }
  } else {
    setExplainStatus("This browser does not provide microphone access here. You can still type your explanation.");
  }

  const speechReady = startSpeechRecognition();

  if (speechReady && micReady) {
    setExplainStatus("Listening. The orb reacts to microphone sound, and your draft is saved locally as you speak.");
  } else if (speechReady) {
    setExplainStatus("Speech-to-text is listening. The microphone animation may be unavailable in this browser.");
  } else if (micReady) {
    setExplainStatus("The sound visualiser is active, but speech-to-text is not supported here. You can type notes below.");
  } else {
    isCapturing = false;
    if (orb) orb.classList.remove("is-listening");
    if (startButton) startButton.disabled = false;
    if (stopButton) stopButton.disabled = true;
    if (!explainEl("explain-status")?.textContent.includes("permission")) {
      setExplainStatus("Voice capture is unavailable in this browser. You can still type and save notes.");
    }
  }
}

function stopExplainCapture() {
  isCapturing = false;

  if (voiceRecognition) {
    const current = voiceRecognition;
    voiceRecognition = null;
    try {
      current.onend = null;
      current.stop();
    } catch (_) {}
  }

  if (micAnimationFrame) cancelAnimationFrame(micAnimationFrame);
  micAnimationFrame = 0;
  analyser = null;

  if (micStream) {
    micStream.getTracks().forEach(track => track.stop());
    micStream = null;
  }

  if (audioContext) {
    try { audioContext.close(); } catch (_) {}
    audioContext = null;
  }

  const orb = explainEl("explain-orb");
  const startButton = explainEl("explain-start-button");
  const stopButton = explainEl("explain-stop-button");

  if (orb) orb.classList.remove("is-listening");
  setOrbEnergy(0);
  if (startButton) startButton.disabled = false;
  if (stopButton) stopButton.disabled = true;

  saveExplainDraft();

  setExplainStatus(
    explainEl("explain-transcript")?.value.trim()
      ? "Voice capture stopped. Your draft is saved locally and can be edited."
      : "Voice capture stopped. The study timer is unaffected."
  );
}

function openExplainModal() {
  const modal = explainEl("explain-modal");
  const transcript = explainEl("explain-transcript");
  const timerScreen = explainEl("timer-screen");

  if (!modal) return;

  if (transcript && document.activeElement !== transcript && !transcript.value) {
    transcript.value = loadExplainDraft();
  }

  if (timerScreen?.classList.contains("active")) {
    explainUsedThisSession = true;
  }

  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  explainEl("explain-floating-pill")?.classList.remove("is-visible");

  if (!isCapturing && transcript?.value.trim()) {
    setExplainStatus("Your draft is saved locally. Edit it or start voice notes.");
  }

  toggleTrackerDrawer(false);
}

function minimizeExplain() {
  const modal = explainEl("explain-modal");
  if (modal) {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
  }

  if (isCapturing || explainEl("explain-transcript")?.value.trim()) {
    explainEl("explain-floating-pill")?.classList.add("is-visible");
  }
}

function restoreExplainModal() {
  openExplainModal();
}

function handleExplainBackdrop(event) {
  if (event.target === explainEl("explain-modal") && !reviewOpen) {
    minimizeExplain();
  }
}

function formatRevisionNotes(text) {
  const cleaned = (text || "")
    .replace(/\b(um+|uh+|erm|you know)\b/gi, "")
    .replace(/[ \t]+/g, " ")
    .trim();

  if (!cleaned) return "";

  const pieces = cleaned
    .split(/\n+|(?<=[.!?])\s+/)
    .map(line => line.replace(/^•\s*/, "").trim())
    .filter(Boolean);

  const unique = [];
  for (const piece of pieces) {
    const comparable = piece.toLowerCase().replace(/[.!?]+$/, "");
    if (!comparable) continue;
    const previous = unique[unique.length - 1];
    if (previous && previous.toLowerCase().replace(/[.!?]+$/, "") === comparable) continue;
    unique.push(piece);
  }

  return unique.map(piece => `• ${piece}`).join("\n");
}

function pauseTimerForReview() {
  pausedForReview = false;
  const button = explainEl("pause-btn");

  if (button && button.textContent.trim().toLowerCase() === "pause") {
    toggleTimer();
    pausedForReview = true;
  }
}

function shouldReviewVoiceNotes() {
  return explainUsedThisSession &&
    !!(explainEl("explain-transcript")?.value.trim() || loadExplainDraft().trim() || isCapturing);
}

function showEndReview() {
  stopExplainCapture();
  pauseTimerForReview();

  const transcript = explainEl("explain-transcript");
  if (transcript) {
    transcript.value = formatRevisionNotes(transcript.value || loadExplainDraft());
    saveExplainDraft();
  }

  reviewOpen = true;
  reviewShouldSave = true;

  const modal = explainEl("explain-modal");
  modal.classList.add("is-open", "is-review");
  modal.setAttribute("aria-hidden", "false");

  explainEl("explain-floating-pill")?.classList.remove("is-visible");

  const title = explainEl("explain-title");
  if (title) title.textContent = "Review your revision notes";

  setExplainStatus("The timer is paused while you review. Edit these organised notes, then save or discard before ending.");
}

function resetReviewUI() {
  reviewOpen = false;
  reviewShouldSave = false;
  explainEl("explain-modal")?.classList.remove("is-review");

  const title = explainEl("explain-title");
  if (title) title.textContent = "Explain Yourself";
}

function saveNotesAndEndSession() {
  finishSession(true);
  closeExplainCompletely();
  resetReviewUI();
}

function discardNotesAndEndSession() {
  finishSession(false);
  closeExplainCompletely();
  resetReviewUI();
}

function continueSessionFromReview() {
  resetReviewUI();
  minimizeExplain();

  if (pausedForReview) toggleTimer();
  pausedForReview = false;

  setExplainStatus("Session resumed. Your draft remains saved.");
}

function closeExplainCompletely() {
  stopExplainCapture();

  const modal = explainEl("explain-modal");
  if (modal) {
    modal.classList.remove("is-open", "is-review");
    modal.setAttribute("aria-hidden", "true");
  }

  explainEl("explain-floating-pill")?.classList.remove("is-visible");
  explainUsedThisSession = false;
  pausedForReview = false;
}

function resetExplainForNewSession() {
  resetReviewUI();
  reviewOpen = false;
  reviewShouldSave = false;
  explainUsedThisSession = false;
  pausedForReview = false;
}

// Autosave edits, even if the user minimizes the modal.
document.getElementById("explain-transcript")?.addEventListener("input", () => {
  explainUsedThisSession = true;
  saveExplainDraft();
});

document.addEventListener("keydown", event => {
  if (event.key !== "Escape") return;

  const drawer = document.getElementById("tracker-drawer");
  const modal = explainEl("explain-modal");

  if (drawer?.classList.contains("is-open")) {
    toggleTrackerDrawer(false);
  } else if (modal?.classList.contains("is-open") && !reviewOpen) {
    minimizeExplain();
  }
});

// ==========================================
// SYLLABUS TRACKER DATA & LOCAL SAVE
// ==========================================
// These are the original checklist labels. Historical question estimates
// are indicative only and are not guarantees of JEE Main 2027 weightage.

const weightage = {
  physics: {
    "Units & Measurements": { label: "1 Q · medium", priority: "Medium" },
    "Kinematics": { label: "1 Q · medium", priority: "Medium" },
    "Laws of Motion": { label: "2 Q · 8 marks", priority: "High" },
    "Work, Energy & Power": { label: "2 Q · 8 marks", priority: "High" },
    "Rotational Motion": { label: "2 Q · 8 marks", priority: "High" },
    "Gravitation": { label: "1 Q · medium", priority: "Medium" },
    "Thermodynamics": { label: "1–2 Q combined with KTG · 4–8 marks", priority: "High" },
    "Oscillations & Waves": { label: "1 Q · medium", priority: "Medium" },
    "Electrostatics": { label: "2–3 Q · 8–12 marks", priority: "High" },
    "Current Electricity": { label: "2 Q · 8 marks", priority: "High" },
    "Magnetism": { label: "2 Q · 8 marks", priority: "High" },
    "EMI & AC": { label: "2 Q · 8 marks", priority: "High" },
    "Ray Optics": { label: "Part of 2–3 Q combined Optics", priority: "High" },
    "Wave Optics": { label: "Part of 2–3 Q combined Optics", priority: "High" },
    "Modern Physics": { label: "2 Q · 8 marks (Dual Nature + Atoms/Nuclei)", priority: "High" },
    "Semiconductors": { label: "1 Q · medium", priority: "Medium" }
  },
  chemistry: {
    "Some Basic Concepts": { label: "1–2 Q", priority: "High" },
    "Chemical Bonding": { label: "2 Q", priority: "High" },
    "Thermodynamics": { label: "1 Q", priority: "High" },
    "Electrochemistry": { label: "1 Q", priority: "High" },
    "Solutions": { label: "1 Q", priority: "High" },
    "p-Block Elements": { label: "2 Q", priority: "High" },
    "Coordination Compounds": { label: "1–2 Q", priority: "High" },
    "Carbonyl Compounds": { label: "2 Q (aldehydes, ketones, carboxylic acids)", priority: "High" }
  },
  math: {
    "Integration": { label: "3–4 Q · 13–16% (Integral Calculus)", priority: "Do or Die" },
    "Coordinate Geometry": { label: "3–4 Q · 13–16% (circles + conics)", priority: "Do or Die" },
    "Limits": { label: "2–3 Q combined · 10–13% (L/C/D)", priority: "Do or Die" },
    "Differentiation": { label: "Part of 2–3 Q combined · 10–13% (L/C/D)", priority: "Do or Die" },
    "Matrices": { label: "2–3 Q · 10–13% (Matrices + Determinants)", priority: "Do or Die" },
    "Probability": { label: "2–3 Q · 8–12% (Probability + Statistics)", priority: "Do or Die" },
    "3D Geometry": { label: "2 Q · 8%", priority: "High" },
    "Vector Algebra": { label: "1–2 Q · 6–8%", priority: "High" },
    "Complex Numbers": { label: "1–2 Q · 5–7% (with Quadratics)", priority: "High" },
    "Quadratic Equations": { label: "Part of 1–2 Q · 5–7% (with Complex Numbers)", priority: "High" },
    "Sequences & Series": { label: "1–2 Q · 5–7%", priority: "High" },
    "Binomial Theorem": { label: "1 Q · 4%", priority: "Medium" },
    "Differential Equations": { label: "1 Q · 4%", priority: "Medium" },
    "Sets & Functions": { label: "1 Q · 3–4%", priority: "Medium" },
    "Trigonometry": { label: "1 Q · 3–4%", priority: "Medium" }
  }
};

const data = {
  physics: {
    "Units & Measurements": { subtopics: ["SI units", "Dimensions", "Errors", "Significant figures"], pyq: ["Dimensional analysis", "Error propagation"] },
    "Kinematics": { subtopics: ["1D motion", "2D motion", "Graphs", "Projectile motion", "Relative velocity"], pyq: ["Projectile range", "Graph problems"] },
    "Laws of Motion": { subtopics: ["Newton laws", "Friction", "FBD", "Inclined plane", "Pseudo force"], pyq: ["Block systems", "Pulley systems"] },
    "Work, Energy & Power": { subtopics: ["Work-energy theorem", "Conservation of energy", "Power"], pyq: ["Spring-mass", "Collision energy"] },
    "Rotational Motion": { subtopics: ["Torque", "Angular momentum", "Moment of inertia", "Rolling motion"], pyq: ["Rolling cylinder", "Angular impulse"] },
    "Gravitation": { subtopics: ["Newton law", "Field", "Potential", "Satellite motion"], pyq: ["Orbit energy", "Escape velocity"] },
    "Thermodynamics": { subtopics: ["First law", "Second law", "Entropy", "Processes"], pyq: ["PV graphs", "Carnot engine"] },
    "Oscillations & Waves": { subtopics: ["SHM", "Pendulum", "Wave equation", "Superposition"], pyq: ["Time period", "Wave speed"] },
    "Electrostatics": { subtopics: ["Coulomb law", "Field", "Gauss law", "Capacitance"], pyq: ["Field symmetry", "Capacitor energy"] },
    "Current Electricity": { subtopics: ["Ohm law", "Kirchhoff", "Wheatstone bridge", "Cells"], pyq: ["Bridge circuits", "EMF problems"] },
    "Magnetism": { subtopics: ["Biot-Savart", "Ampere law", "Lorentz force"], pyq: ["Force on wire", "Moving charge"] },
    "EMI & AC": { subtopics: ["Faraday law", "Lenz law", "AC circuits", "Transformer"], pyq: ["Induced EMF", "Resonance"] },
    "Ray Optics": { subtopics: ["Reflection", "Refraction", "Lens", "Mirror"], pyq: ["Lens system", "TIR"] },
    "Wave Optics": { subtopics: ["Interference", "Diffraction", "Polarisation"], pyq: ["YDSE", "Fringe width"] },
    "Modern Physics": { subtopics: ["Photoelectric effect", "Bohr model", "Nuclear physics"], pyq: ["de Broglie", "Binding energy"] },
    "Semiconductors": { subtopics: ["Diode", "Transistor", "Logic gates"], pyq: ["Rectifier", "Truth tables"] }
  },
  chemistry: {
    "Some Basic Concepts": { subtopics: ["Mole concept", "Stoichiometry", "Limiting reagent"], pyq: ["Numerical problems"] },
    "Atomic Structure": { subtopics: ["Bohr model", "Quantum numbers", "Orbitals"], pyq: ["Spectral lines"] },
    "Chemical Bonding": { subtopics: ["VSEPR", "Hybridisation", "MOT"], pyq: ["Shape prediction"] },
    "States of Matter": { subtopics: ["Gas laws", "Liquids"], pyq: ["PV=nRT"] },
    "Thermodynamics": { subtopics: ["Enthalpy", "Entropy"], pyq: ["Hess law"] },
    "Equilibrium": { subtopics: ["Chemical", "Ionic"], pyq: ["pH calculations"] },
    "Redox Reactions": { subtopics: ["Oxidation number", "Balancing"], pyq: ["Disproportionation"] },
    "Electrochemistry": { subtopics: ["Cells", "Nernst equation"], pyq: ["EMF problems"] },
    "Chemical Kinetics": { subtopics: ["Rate law", "Order"], pyq: ["Half-life"] },
    "Periodic Table": { subtopics: ["Trends", "Properties"], pyq: ["Ionisation energy"] },
    "p-Block Elements": { subtopics: ["Groups 13–18"], pyq: ["Oxidation states"] },
    "d & f Block Elements": { subtopics: ["Transition metals"], pyq: ["Color compounds"] },
    "Coordination Compounds": { subtopics: ["Ligands", "Isomerism"], pyq: ["IUPAC naming"] },
    "Hydrocarbons": { subtopics: ["Alkanes", "Alkenes", "Alkynes", "Aromatic"], pyq: ["Markovnikov rule"] },
    "Haloalkanes": { subtopics: ["SN1 SN2"], pyq: ["Mechanism"] },
    "Alcohols Phenols Ethers": { subtopics: ["Reactions", "Acidity"], pyq: ["Order of acidity"] },
    "Carbonyl Compounds": { subtopics: ["Aldehydes", "Ketones"], pyq: ["Aldol"] },
    "Amines": { subtopics: ["Basicity", "Diazonium"], pyq: ["Reactions"] },
    "Biomolecules": { subtopics: ["Carbs", "Proteins", "DNA"], pyq: ["Structure questions"] },
    "Polymers": { subtopics: ["Types"], pyq: ["Classification"] },
    "Chemistry in Everyday Life": { subtopics: ["Drugs", "Chemicals"], pyq: ["Applications"] }
  },
  math: {
    "Sets & Functions": { subtopics: ["Relations", "Functions"], pyq: ["Domain range"] },
    "Quadratic Equations": { subtopics: ["Roots", "Nature"], pyq: ["Parameter roots"] },
    "Complex Numbers": { subtopics: ["Argand", "Polar"], pyq: ["Modulus argument"] },
    "Matrices": { subtopics: ["Inverse", "Rank"], pyq: ["System solving"] },
    "Sequences & Series": { subtopics: ["AP", "GP"], pyq: ["Sum formulas"] },
    "Binomial Theorem": { subtopics: ["Expansion"], pyq: ["Middle term"] },
    "Limits": { subtopics: ["Continuity", "Limits"], pyq: ["L’Hospital"] },
    "Differentiation": { subtopics: ["Derivatives"], pyq: ["Max-min"] },
    "Integration": { subtopics: ["Indefinite", "Definite"], pyq: ["Area under curve"] },
    "Differential Equations": { subtopics: ["Formation", "Solution"], pyq: ["Separation"] },
    "Coordinate Geometry": { subtopics: ["Line", "Circle", "Conics"], pyq: ["Tangents"] },
    "3D Geometry": { subtopics: ["Line", "Plane"], pyq: ["Distance"] },
    "Vector Algebra": { subtopics: ["Dot", "Cross"], pyq: ["Projection"] },
    "Probability": { subtopics: ["Basic", "Bayes"], pyq: ["Conditional"] },
    "Trigonometry": { subtopics: ["Identities", "Equations"], pyq: ["Transformations"] }
  }
};

function trackerKey(type, subject, chapter, item) {
  return `${type}__${subject}__${chapter}__${item}`;
}

function trackerIsDone(k) {
  return localStorage.getItem(k) === "1";
}

function checkRevisionStatus(chapterKey) {
  if (!trackerIsDone(chapterKey)) return false;
  const savedTime = localStorage.getItem(`${chapterKey}__timestamp`);
  if (!savedTime) return false;
  return Date.now() - parseInt(savedTime, 10) >= 7 * 24 * 60 * 60 * 1000;
}

function handleToggle(checkbox, k) {
  localStorage.setItem(k, checkbox.checked ? "1" : "0");

  if (checkbox.checked) {
    localStorage.setItem(`${k}__timestamp`, Date.now().toString());
  } else {
    localStorage.removeItem(`${k}__timestamp`);
  }

  const card = checkbox.closest(".chapter-card");
  if (card) card.classList.toggle("is-completed", checkRevisionStatus(k));

  updateProgress();
}

function showHome() {
  document.getElementById("home").style.display = "flex";
  const page = document.getElementById("page");
  page.style.display = "none";
  page.innerHTML = "";
  page.className = "";
  updateProgress();
}

function openSubject(inputSubject) {
  let subject = inputSubject ? inputSubject.toLowerCase().trim() : "";
  if (subject === "mathematics") subject = "math";
  if (!data[subject]) return;

  document.getElementById("home").style.display = "none";

  const page = document.getElementById("page");
  page.style.display = "block";
  page.className = `theme-${subject}`;

  const title = subject === "math" ? "Mathematics" : inputSubject;
  let html = `<h2 class="subject-title">${title}</h2>`;

  Object.entries(data[subject]).forEach(([chapter, info], index) => {
    const chapterKey = trackerKey("chapter", subject, chapter, "done");
    const cardId = `${subject}_var_${index}`;
    const completed = checkRevisionStatus(chapterKey) ? "is-completed" : "";
    const estimate = weightage[subject]?.[chapter];

    const estimateChip = estimate
      ? `<span class="chapter-weightage priority-${estimate.priority.toLowerCase().replace(/[^a-z]+/g, "-")}" title="Historical estimate, not a guarantee">${estimate.label}</span>`
      : "";

    html += `
      <div class="chapter-card ${completed}" id="card_${cardId}">
        <div class="chapter-header" onclick="toggleChapter('${cardId}', event)">
          <div style="display:flex;align-items:center;gap:10px;flex:1;" onclick="event.stopPropagation();">
            <input type="checkbox" id="check_${cardId}"
              onchange="handleToggle(this, '${chapterKey}')"
              ${trackerIsDone(chapterKey) ? "checked" : ""}>
            <label for="check_${cardId}">${chapter}</label>
          </div>

          <div class="chapter-header-meta">
            ${estimateChip}
            <span class="revision-stamp">Revise</span>
            <button class="toggle-arrow" type="button" aria-label="Expand chapter" style="background:none;border:0;cursor:pointer;pointer-events:none;">▼</button>
          </div>
        </div>

        <div class="chapter-body">
          <h4>Subtopics</h4>
          ${info.subtopics.map((subtopic, subIndex) => {
            const subKey = trackerKey("sub", subject, chapter, subtopic);
            const subId = `sub_${cardId}_${subIndex}`;
            return `
              <div class="task-item">
                <input type="checkbox" id="${subId}"
                  onchange="localStorage.setItem('${subKey}', this.checked ? '1' : '0')"
                  ${trackerIsDone(subKey) ? "checked" : ""}>
                <label for="${subId}">${subtopic}</label>
              </div>`;
          }).join("")}

          <h4>PYQ Patterns</h4>
          <ul class="pyq-list">${info.pyq.map(item => `<li>${item}</li>`).join("")}</ul>
        </div>
      </div>`;
  });

  html += `
    <button onclick="showHome()" class="back-btn">← Back to Dashboard</button>
    <div class="dashboard-footer">— <span class="founder-name">Dhwani <span class="footer-heart">♥</span></span></div>`;

  page.innerHTML = html;
}

function toggleChapter(id) {
  const card = document.getElementById(`card_${id}`);
  if (!card) return;

  const opened = card.classList.toggle("is-open");
  const arrow = card.querySelector(".toggle-arrow");
  if (arrow) arrow.style.transform = opened ? "rotate(180deg)" : "rotate(0deg)";
}

function updateProgress() {
  const subjects = [
    { key: "physics", selector: ".physics-progress" },
    { key: "chemistry", selector: ".chemistry-progress" },
    { key: "math", selector: ".math-progress" }
  ];

  subjects.forEach(({ key: subject, selector }) => {
    const chapters = Object.keys(data[subject] || {});
    const total = chapters.length;
    const completed = chapters.filter(chapter =>
      trackerIsDone(trackerKey("chapter", subject, chapter, "done"))
    ).length;
    const percent = total ? Math.round(completed / total * 100) : 0;

    const row = document.querySelector(selector);
    if (!row) return;

    const fill = row.querySelector(".progress-bar-fill");
    const text = row.querySelector(".progress-percentage");
    if (fill) fill.style.width = `${percent}%`;
    if (text) text.textContent = `${percent}%`;
  });
}

function toggleTrackerDrawer(forceOpen) {
  const drawer = document.getElementById("tracker-drawer");
  const backdrop = document.getElementById("tracker-backdrop");
  const button = document.querySelector(".tracker-menu-trigger");
  if (!drawer || !backdrop) return;

  const opening = typeof forceOpen === "boolean"
    ? forceOpen
    : !drawer.classList.contains("is-open");

  if (opening) {
    closeModal("calendar-modal");
    closeModal("analytics-modal");

    if (explainEl("explain-modal")?.classList.contains("is-open")) {
      minimizeExplain();
    }

    drawer.classList.add("is-open");
    backdrop.classList.add("is-open");
    drawer.setAttribute("aria-hidden", "false");
    backdrop.setAttribute("aria-hidden", "false");
  } else {
    drawer.classList.remove("is-open");
    backdrop.classList.remove("is-open");
    drawer.setAttribute("aria-hidden", "true");
    backdrop.setAttribute("aria-hidden", "true");
  }

  if (button) button.setAttribute("aria-expanded", opening ? "true" : "false");
}

window.addEventListener("DOMContentLoaded", () => {
  loadData();
  updateDashboardUI();
  renderDynamicCalendar();
  renderNotes();
  updateProgress();

  const transcript = explainEl("explain-transcript");
  if (transcript && !transcript.value) transcript.value = loadExplainDraft();
});
