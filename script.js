/* ==========================================================================
   1. UTILITIES & APP STATE PRESERVATION ENGINE
   ========================================================================== */
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
}

const appState = {
  notes: JSON.parse(localStorage.getItem('flowspace_notes')) || [],
  sessions: JSON.parse(localStorage.getItem('flowspace_sessions')) || [],
  streak: parseInt(localStorage.getItem('flowspace_streak')) || 0,
  lastSessionDate: localStorage.getItem('flowspace_last_date') || null,
  timerSeconds: 25 * 60,
  initialSeconds: 25 * 60,
  timerInterval: null,
  isRunning: false
};

let sessionVoiceNotes = []; // Staging array for voice notes mid-session

function saveState() {
  localStorage.setItem('flowspace_notes', JSON.stringify(appState.notes));
  localStorage.setItem('flowspace_sessions', JSON.stringify(appState.sessions));
  localStorage.setItem('flowspace_streak', appState.streak.toString());
  if (appState.lastSessionDate) {
    localStorage.setItem('flowspace_last_date', appState.lastSessionDate);
  }
}

// Legacy key signature preservation
function key(type, subject, chapter, item) {
  return `${type}__${subject}__${chapter}__${item}`;
}

function isDone(k) {
  return localStorage.getItem(k) === "1";
}

/* ==========================================================================
   2. TIMER & SESSION LOGIC
   ========================================================================== */
function toggleTimer() {
  const btn = document.getElementById('start-btn');
  if (appState.isRunning) {
    clearInterval(appState.timerInterval);
    appState.isRunning = false;
    btn.textContent = 'Resume';
  } else {
    appState.isRunning = true;
    btn.textContent = 'Pause';
    appState.timerInterval = setInterval(() => {
      if (appState.timerSeconds > 0) {
        appState.timerSeconds--;
        updateTimerDisplay();
      } else {
        clearInterval(appState.timerInterval);
        completeSession();
      }
    }, 1000);
  }
}

function updateTimerDisplay() {
  const mins = Math.floor(appState.timerSeconds / 60);
  const secs = appState.timerSeconds % 60;
  document.getElementById('timer-display').textContent = 
    `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function addQuickNote() {
  const input = document.getElementById('quick-note-input');
  if (input.value.trim()) {
    appState.notes.push(input.value.trim());
    renderBulletNotes();
    input.value = '';
    saveState();
  }
}

function renderBulletNotes() {
  const container = document.getElementById('active-bullet-list');
  container.innerHTML = appState.notes.map(n => `<div class="bullet-item">• ${escapeHtml(n)}</div>`).join('');
  container.scrollTop = container.scrollHeight;
}

function quitSession() {
  if (sessionVoiceNotes.length > 0) {
    openReviewModal();
  } else {
    finalizeSessionExit(true);
  }
}

function completeSession() {
  updateStreak();
  quitSession();
}

function updateStreak() {
  const today = new Date().toDateString();
  if (appState.lastSessionDate !== today) {
    appState.streak++;
    appState.lastSessionDate = today;
    document.getElementById('streak-count').textContent = appState.streak;
    saveState();
  }
}

function recordSessionHistory(elapsedSeconds) {
  if (elapsedSeconds < 30) return; // Ignore accidental micro-sessions
  const sessionRecord = {
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    durationMinutes: Math.round(elapsedSeconds / 60)
  };
  appState.sessions.push(sessionRecord);
  saveState();
}

/* ==========================================================================
   3. DYNAMIC VOICE ORB MODAL ENGINE (WEB SPEECH + AUDIO ANALYZER)
   ========================================================================== */
let recognition = null;
let audioContext = null;
let analyser = null;
let micStream = null;
let isRecording = false;
let currentTranscript = '';

function initSpeech() {
  window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!window.SpeechRecognition) {
    alert("Speech recognition is not supported on this browser. Try Google Chrome!");
    return;
  }

  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;

  recognition.onresult = (event) => {
    let finalTranscript = '';
    let interimTranscript = '';
    for (let i = 0; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript + ' ';
      } else {
        interimTranscript += event.results[i][0].transcript;
      }
    }
    currentTranscript = finalTranscript;
    const box = document.getElementById('voice-transcript-box');
    box.innerHTML = `<strong>${escapeHtml(finalTranscript)}</strong> <i style="opacity:0.65">${escapeHtml(interimTranscript)}</i>`;
    if (finalTranscript || interimTranscript) {
      document.getElementById('voice-actions').classList.remove('hidden');
    }
  };
}

async function startAudioVisualization() {
  try {
    micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(micStream);
    source.connect(analyser);
    analyser.fftSize = 64;
    animateOrb();
  } catch (err) {
    console.log("Audio visualizer falling back to ambient mode.");
  }
}

function animateOrb() {
  if (!isRecording) return;
  const orb = document.getElementById('voice-orb');
  if (analyser && orb) {
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(dataArray);
    let avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
    let scale = 1 + (avg / 128) * 0.35;
    orb.style.transform = `scale(${scale})`;
    orb.style.boxShadow = `0 0 ${20 + avg * 0.5}px rgba(244, 63, 94, 0.6)`;
  }
  requestAnimationFrame(animateOrb);
}

function toggleMic() {
  if (!recognition) initSpeech();
  const micBtn = document.getElementById('mic-btn');
  
  if (!isRecording) {
    try {
      recognition.start();
      startAudioVisualization();
      isRecording = true;
      micBtn.textContent = '⏹️ Stop Recording';
      micBtn.classList.add('recording');
    } catch(e) {
      console.log("Speech recognition already running.");
    }
  } else {
    stopMic();
  }
}

function stopMic() {
  if (recognition) recognition.stop();
  if (micStream) micStream.getTracks().forEach(t => t.stop());
  isRecording = false;
  const micBtn = document.getElementById('mic-btn');
  if (micBtn) {
    micBtn.textContent = '🎤 Start Recording';
    micBtn.classList.remove('recording');
  }
  const orb = document.getElementById('voice-orb');
  if (orb) orb.style.transform = 'scale(1)';
}

function openVoiceModal() {
  document.getElementById('voice-modal-overlay').classList.remove('hidden');
}

function closeVoiceModal(save = false) {
  stopMic();
  document.getElementById('voice-modal-overlay').classList.add('hidden');
}

function minimizeVoiceModal() {
  document.getElementById('voice-modal-overlay').classList.add('hidden');
  document.getElementById('voice-floating-pill').classList.remove('hidden');
}

function restoreVoiceModal() {
  document.getElementById('voice-floating-pill').classList.add('hidden');
  document.getElementById('voice-modal-overlay').classList.remove('hidden');
}

function stageVoiceNote() {
  if (currentTranscript.trim()) {
    sessionVoiceNotes.push(`🗣️ ${currentTranscript.trim()}`);
  }
  discardVoice();
  closeVoiceModal();
}

function discardVoice() {
  currentTranscript = '';
  document.getElementById('voice-transcript-box').innerHTML = 
    '<span class="transcript-placeholder">Click the microphone button and explain out loud...</span>';
  document.getElementById('voice-actions').classList.add('hidden');
}

/* Review Modal */
function openReviewModal() {
  const list = document.getElementById('voice-review-list');
  list.innerHTML = sessionVoiceNotes.map((note, i) => `
    <div style="margin-bottom:10px; display:flex; align-items:center; gap:10px;">
      <input type="checkbox" id="vn_${i}" checked>
      <label for="vn_${i}" style="font-size:13px; color:var(--text-dark);">${escapeHtml(note)}</label>
    </div>
  `).join('');
  document.getElementById('review-modal-overlay').classList.remove('hidden');
}

function finalizeSessionExit(keepSelected) {
  if (keepSelected && sessionVoiceNotes.length > 0) {
    sessionVoiceNotes.forEach((note, i) => {
      const cb = document.getElementById(`vn_${i}`);
      if (!cb || cb.checked) {
        appState.notes.push(note);
      }
    });
    renderBulletNotes();
    saveState();
  }
  sessionVoiceNotes = [];
  document.getElementById('review-modal-overlay').classList.add('hidden');
  
  // Calculate duration and save history
  const elapsed = appState.initialSeconds - appState.timerSeconds;
  recordSessionHistory(elapsed);

  // Reset Timer
  clearInterval(appState.timerInterval);
  appState.timerSeconds = 25 * 60;
  appState.isRunning = false;
  updateTimerDisplay();
  document.getElementById('start-btn').textContent = 'Start Flow';
}

/* ==========================================================================
   4. SYLLABUS TRACKER & WEIGHTED CALCULATOR ENGINE
   ========================================================================== */
const syllabusData = {
  physics: {
    "Units and Measurements": { weight: 1.0, subtopics: ["SI Units", "Least count & Significant figures", "Dimensions & Errors"], pyq: ["Dimensional analysis", "Error propagation"] },
    "Kinematics": { weight: 1.0, subtopics: ["1D & 2D Motion", "Graphs & Projectile motion", "Relative velocity"], pyq: ["Projectile range", "Graph problems"] },
    "Laws of Motion": { weight: 2.0, subtopics: ["Newton's laws & Momentum", "Friction & Pulley systems", "Circular motion dynamics"], pyq: ["Block systems", "Friction threshold"] },
    "Work, Energy and Power": { weight: 2.0, subtopics: ["Work-energy theorem", "Spring potential energy", "Collisions 1D/2D"], pyq: ["Spring-mass", "Collision energy"] },
    "Rotational Motion": { weight: 2.0, subtopics: ["Torque & Angular momentum", "Moment of inertia", "Rolling motion"], pyq: ["Rolling cylinder", "Angular impulse"] },
    "Gravitation": { weight: 1.0, subtopics: ["Kepler's laws", "Potential & Field", "Escape & Orbital velocity"], pyq: ["Orbit energy", "Variation of g"] },
    "Properties of Solids and Liquids": { weight: 1.0, subtopics: ["Elasticity & Modulus", "Pascal & Bernoulli laws", "Surface tension & Viscosity"], pyq: ["Capillary rise", "Terminal velocity"] },
    "Thermodynamics and KTG": { weight: 1.5, subtopics: ["Laws of thermodynamics", "Isothermal/Adiabatic processes", "Degrees of freedom & RMS speed"], pyq: ["PV graphs", "Heat engines"] },
    "Oscillations and Waves": { weight: 1.0, subtopics: ["SHM equations", "Pendulum & Spring SHM", "Wave superposition & Doppler"], pyq: ["Time period", "Standing waves"] },
    "Electrostatics": { weight: 2.5, subtopics: ["Coulomb's law & Field", "Gauss's law", "Capacitance & Dielectrics"], pyq: ["Capacitor combinations", "Field symmetry"] },
    "Current Electricity": { weight: 2.0, subtopics: ["Ohm's law & Drift velocity", "Kirchhoff's laws", "Wheatstone & Metre bridge"], pyq: ["Bridge circuits", "EMF & internal resistance"] },
    "Magnetic Effects of Current": { weight: 2.0, subtopics: ["Biot-Savart & Ampere law", "Lorentz force & Cyclotron", "Galvanometer conversion"], pyq: ["Force on wire", "Torque on loop"] },
    "EMI and AC": { weight: 2.0, subtopics: ["Faraday & Lenz laws", "Inductance (Self/Mutual)", "LCR Resonance & Transformers"], pyq: ["Induced EMF", "Resonance frequency"] },
    "Electromagnetic Waves": { weight: 1.0, subtopics: ["Displacement current", "EM Spectrum & Properties"], pyq: ["Poynting vector", "Wave equations"] },
    "Optics (Ray + Wave)": { weight: 2.5, subtopics: ["Mirrors & Lenses", "Prisms & Optical instruments", "YDSE & Diffraction"], pyq: ["Lens maker formula", "Fringe width"] },
    "Modern Physics": { weight: 2.0, subtopics: ["Photoelectric effect", "Bohr model & Hydrogen spectrum", "Nuclei & Binding energy"], pyq: ["de Broglie wavelength", "Mass defect"] },
    "Electronic Devices": { weight: 1.0, subtopics: ["P-N junction diode", "Rectifier & Zener diode", "Logic gates"], pyq: ["Truth tables", "Zener voltage regulator"] },
    "Experimental Skills": { weight: 1.0, subtopics: ["Vernier calipers & Screw gauge", "Metre bridge & Resonance tube"], pyq: ["Least count errors", "Resistance graphs"] }
  },
  chemistry: {
    "Mole Concept & Stoichiometry": { weight: 1.5, subtopics: ["Concentration terms", "Stoichiometry & Limiting reagent"], pyq: ["Molarity/Molality", "Empirical formula"] },
    "Atomic Structure": { weight: 1.0, subtopics: ["Bohr model", "Quantum numbers & Orbitals"], pyq: ["Spectral lines", "de Broglie"] },
    "States of Matter": { weight: 1.0, subtopics: ["Gas laws & Ideal gas equation", "Kinetic theory of gases"], pyq: ["Real gas deviations"] },
    "Chemical Thermodynamics": { weight: 1.0, subtopics: ["First & Second Law", "Enthalpy, Entropy & Gibbs energy"], pyq: ["Hess law", "Spontaneity"] },
    "Equilibrium": { weight: 1.0, subtopics: ["Chemical equilibrium & Le Chatelier", "Ionic equilibrium, pH & Buffers"], pyq: ["Solubility product", "pH calculations"] },
    "Redox Reactions": { weight: 1.0, subtopics: ["Oxidation numbers", "Balancing redox equations"], pyq: ["Titrations"] },
    "Solutions": { weight: 1.0, subtopics: ["Raoult's law", "Colligative properties & van't Hoff factor"], pyq: ["Vapour pressure", "Osmotic pressure"] },
    "Electrochemistry": { weight: 1.0, subtopics: ["Conductance & Kohlrausch law", "Nernst equation & EMF"], pyq: ["Cell potential", "Faraday laws"] },
    "Chemical Kinetics": { weight: 1.0, subtopics: ["Rate laws & Order of reaction", "Arrhenius equation & Half-life"], pyq: ["First order kinetics"] },
    "Periodicity & Classification": { weight: 1.0, subtopics: ["Periodic trends", "Ionisation enthalpy & Radii"], pyq: ["Electronegativity trends"] },
    "Chemical Bonding": { weight: 2.0, subtopics: ["VSEPR & Hybridisation", "Molecular Orbital Theory (MOT)"], pyq: ["Bond order", "Shape prediction"] },
    "p-Block Elements": { weight: 2.0, subtopics: ["Groups 13 to 18 properties", "Oxides & Oxoacids"], pyq: ["Inert pair effect", "Trends"] },
    "d & f Block Elements": { weight: 1.0, subtopics: ["Transition metals & Color", "Lanthanoid contraction"], pyq: ["KMnO4 & K2Cr2O7"] },
    "Coordination Compounds": { weight: 1.5, subtopics: ["IUPAC naming & Isomerism", "Crystal Field Theory (CFT)"], pyq: ["Hybridisation & Magnetic moment"] },
    "Purification & GOC": { weight: 1.5, subtopics: ["Inductive, Resonance & Hyperconjugation", "Carbocations & Reaction types"], pyq: ["Stability order", "Isomerism"] },
    "Hydrocarbons": { weight: 1.5, subtopics: ["Alkanes, Alkenes, Alkynes", "Aromaticity & Electrophilic Substitution"], pyq: ["Markovnikov addition", "Ozonolysis"] },
    "Organic Halogens": { weight: 1.0, subtopics: ["SN1 & SN2 mechanisms", "Aryl halides"], pyq: ["Nucleophilic substitution"] },
    "Oxygen Compounds (Aldehydes/Ketones/Acids)": { weight: 2.0, subtopics: ["Reimer-Tiemann, Aldol & Cannizzaro", "Acidity of phenols & Carboxylic acids"], pyq: ["Named reactions", "Distinction tests"] },
    "Nitrogen Compounds (Amines)": { weight: 1.0, subtopics: ["Basicity of amines", "Diazonium salts"], pyq: ["Hofmann bromamide"] },
    "Biomolecules": { weight: 1.0, subtopics: ["Carbohydrates structure", "Proteins & Nucleic acids"], pyq: ["Reducing sugars", "Peptide bond"] },
    "Practical Chemistry": { weight: 1.0, subtopics: ["Qualitative organic analysis", "Cation/Anion salt analysis"], pyq: ["Functional group tests"] }
  },
  math: {
    "Sets, Relations and Functions": { weight: 1.0, subtopics: ["Types of relations", "Domain, Range & Composite functions"], pyq: ["Equivalence relations", "One-one onto"] },
    "Complex Numbers & Quadratics": { weight: 1.5, subtopics: ["Argand plane & Modulus/Argument", "Quadratic roots & Nature"], pyq: ["Cube roots of unity", "Location of roots"] },
    "Matrices and Determinants": { weight: 2.5, subtopics: ["Matrix algebra & Inverse", "System of linear equations (Cramer's rule)"], pyq: ["Consistency of equations", "Adjoint properties"] },
    "Permutations and Combinations": { weight: 1.0, subtopics: ["Fundamental counting principle", "P(n,r) & C(n,r) applications"], pyq: ["Circular permutations", "Group division"] },
    "Binomial Theorem": { weight: 1.0, subtopics: ["General & Middle terms", "Binomial coefficients"], pyq: ["Remainder problems", "Term independent of x"] },
    "Sequence and Series": { weight: 1.5, subtopics: ["AP, GP & AGP", "AM-GM Inequality"], pyq: ["Sum of n terms", "Means insertion"] },
    "Limit, Continuity & Differentiability": { weight: 2.5, subtopics: ["L'Hospital rule & Standard limits", "Continuity & Differentiability tests"], pyq: ["Indeterminate forms", "Differentiability points"] },
    "Integral Calculus": { weight: 3.5, subtopics: ["Definite integrals & Properties", "Area under curves"], pyq: ["Property based definite integration", "Bounded area"] },
    "Differential Equations": { weight: 1.0, subtopics: ["Separation of variables", "Homogeneous & Linear DE"], pyq: ["Integrating factor"] },
    "Coordinate Geometry (Circles & Conics)": { weight: 3.5, subtopics: ["Straight lines & Circles", "Parabola, Ellipse & Hyperbola"], pyq: ["Tangents & Normals", "Locus problems"] },
    "Three-Dimensional Geometry": { weight: 2.0, subtopics: ["Direction cosines & Ratios", "Line & Shortest distance"], pyq: ["Distance between skew lines"] },
    "Vector Algebra": { weight: 1.5, subtopics: ["Dot & Cross products", "Scalar triple product"], pyq: ["Projection vectors", "Vector equations"] },
    "Probability and Statistics": { weight: 2.5, subtopics: ["Variance & Standard deviation", "Bayes Theorem & Conditional probability"], pyq: ["Mean deviation", "Probability distributions"] },
    "Trigonometry": { weight: 1.0, subtopics: ["Trigonometric identities & Equations", "Inverse trig properties"], pyq: ["Inverse trig equations"] }
  }
};

/* Weighted Calculation Engine */
function calculateSubjectProgress(subjectKey) {
  const subjectData = syllabusData[subjectKey];
  if (!subjectData) return 0;

  let totalWeight = 0;
  let earnedWeight = 0;

  Object.entries(subjectData).forEach(([chapterName, info]) => {
    const chapterWeight = info.weight || 1.0;
    totalWeight += chapterWeight;

    const chapterDoneKey = key("chapter", subjectKey, chapterName, "done");
    if (isDone(chapterDoneKey)) {
      earnedWeight += chapterWeight;
    } else {
      let subCount = info.subtopics.length;
      let completedSubs = 0;
      info.subtopics.forEach(st => {
        if (isDone(key("sub", subjectKey, chapterName, st))) completedSubs++;
      });
      if (subCount > 0) {
        earnedWeight += chapterWeight * (completedSubs / subCount);
      }
    }
  });

  return Math.round((earnedWeight / totalWeight) * 100);
}

function updateProgressBars() {
  const subjects = [
    { key: 'physics', class: '.physics-progress' },
    { key: 'chemistry', class: '.chemistry-progress' },
    { key: 'math', class: '.math-progress' }
  ];

  subjects.forEach(s => {
    const pct = calculateSubjectProgress(s.key);
    const row = document.querySelector(s.class);
    if (row) {
      row.querySelector('.progress-bar-fill').style.width = `${pct}%`;
      row.querySelector('.progress-percentage').textContent = `${pct}%`;
    }
  });
}

function openSubject(subjectName) {
  let subjKey = subjectName.toLowerCase().trim();
  if (subjKey === "mathematics") subjKey = "math";
  if (!syllabusData[subjKey]) return;

  document.getElementById("tracker-home").classList.add("hidden");
  const pageContainer = document.getElementById("tracker-page");
  pageContainer.classList.remove("hidden");

  let html = `<h2 style="font-family:'Playfair Display'; color:var(--primary-burgundy); font-size:26px; margin-bottom:20px;">${escapeHtml(subjectName)}</h2>`;

  Object.entries(syllabusData[subjKey]).forEach(([chapter, info], i) => {
    const chapterDoneKey = key("chapter", subjKey, chapter, "done");
    const id = `${subjKey}_c_${i}`;

    html += `
      <div class="chapter-card" id="card_${id}">
        <div class="chapter-header" onclick="toggleChapter('${id}')">
          <div style="display:flex; align-items:center; gap:12px;" onclick="event.stopPropagation()">
            <input type="checkbox" id="check_${id}" data-key="${escapeHtml(chapterDoneKey)}" onchange="handleChapterCheck(this)" ${isDone(chapterDoneKey) ? "checked" : ""}>
            <label for="check_${id}" style="font-weight:600; font-size:15px; color:var(--text-dark); cursor:pointer;">${escapeHtml(chapter)}</label>
          </div>
          <span style="font-size:12px; color:var(--accent-rose); font-weight:700;">★ ${info.weight} Qs</span>
        </div>
        <div class="chapter-body">
          <p style="padding:12px 20px 4px; font-size:11px; font-weight:700; text-transform:uppercase; color:var(--text-muted);">Subtopics</p>
          ${info.subtopics.map((st, sIdx) => {
            const subtopicKey = key("sub", subjKey, chapter, st);
            return `
              <div class="task-item">
                <input type="checkbox" id="sub_${id}_${sIdx}" data-key="${escapeHtml(subtopicKey)}" onchange="handleSubtopicCheck(this)" ${isDone(subtopicKey) ? "checked" : ""}>
                <label for="sub_${id}_${sIdx}">${escapeHtml(st)}</label>
              </div>
            `;
          }).join('')}
          <p style="padding:12px 20px 4px; font-size:11px; font-weight:700; text-transform:uppercase; color:var(--text-muted);">PYQ Patterns</p>
          <ul style="padding:0 20px 16px 36px; font-size:13px; color:var(--text-muted);">
            ${info.pyq.map(p => `<li>${escapeHtml(p)}</li>`).join('')}
          </ul>
        </div>
      </div>
    `;
  });

  html += `<button onclick="showTrackerHome()" class="back-btn">← Back to Dashboard</button>`;
  pageContainer.innerHTML = html;
}

function handleChapterCheck(cb) {
  const keyName = cb.dataset.key;
  localStorage.setItem(keyName, cb.checked ? "1" : "0");
  updateProgressBars();
}

function handleSubtopicCheck(cb) {
  const keyName = cb.dataset.key;
  localStorage.setItem(keyName, cb.checked ? "1" : "0");
  updateProgressBars();
}

function toggleChapter(id) {
  const card = document.getElementById(`card_${id}`);
  if (card) card.classList.toggle('is-open');
}

function showTrackerHome() {
  document.getElementById("tracker-page").classList.add("hidden");
  document.getElementById("tracker-home").classList.remove("hidden");
  updateProgressBars();
}

function toggleTrackerDrawer() {
  const drawer = document.getElementById('syllabus-drawer');
  const backdrop = document.getElementById('drawer-backdrop');
  drawer.classList.toggle('open');
  backdrop.classList.toggle('hidden');
  updateProgressBars();
}

function closeTrackerDrawer() {
  document.getElementById('syllabus-drawer').classList.remove('open');
  document.getElementById('drawer-backdrop').classList.add('hidden');
}

/* Modal Renderers */
function renderLogModal() {
  const logBox = document.getElementById('session-log-content');
  if (appState.sessions.length === 0) {
    logBox.innerHTML = '<p style="color:var(--text-muted); text-align:center;">No completed study sessions yet.</p>';
    return;
  }
  logBox.innerHTML = appState.sessions.slice().reverse().map(s => `
    <div style="background:rgba(255,255,255,0.6); padding:10px 14px; border-radius:10px; margin-bottom:8px; border-left:3px solid var(--primary-burgundy);">
      <strong>${s.date} at ${s.time}</strong> — <span>${s.durationMinutes} min session</span>
    </div>
  `).join('');
}

function renderInsightsModal() {
  const totalMins = appState.sessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
  document.getElementById('total-hours').textContent = (totalMins / 60).toFixed(1);
  document.getElementById('total-sessions').textContent = appState.sessions.length;
}

function openModal(id) {
  if (id === 'log-modal') renderLogModal();
  if (id === 'insights-modal') renderInsightsModal();
  document.getElementById(id).classList.remove('hidden');
}

function closeModal(id) {
  document.getElementById(id).classList.add('hidden');
}

document.addEventListener("DOMContentLoaded", () => {
  renderBulletNotes();
  updateProgressBars();
  document.getElementById('streak-count').textContent = appState.streak;
});
