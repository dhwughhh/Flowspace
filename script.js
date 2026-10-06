/* ==========================================================================
   SYLLABUS DATA MODEL WITH WEIGHTAGES
   ========================================================================== */
const data = {
  physics: {
    "Units & Measurements": { weight: 1, subtopics: ["SI units", "Dimensions", "Errors", "Significant figures"], pyq: ["Dimensional analysis", "Error propagation"] },
    "Kinematics": { weight: 2, subtopics: ["1D motion", "2D motion", "Graphs", "Projectile motion", "Relative velocity"], pyq: ["Projectile range", "Graph problems"] },
    "Laws of Motion": { weight: 2, subtopics: ["Newton laws", "Friction", "FBD", "Inclined plane", "Pseudo force"], pyq: ["Block systems", "Pulley systems"] },
    "Work, Energy & Power": { weight: 1, subtopics: ["Work-energy theorem", "Conservation of energy", "Power"], pyq: ["Spring-mass", "Collision energy"] },
    "Rotational Motion": { weight: 2, subtopics: ["Torque", "Angular momentum", "Moment of inertia", "Rolling motion"], pyq: ["Rolling cylinder", "Angular impulse"] },
    "Gravitation": { weight: 1, subtopics: ["Newton law", "Field", "Potential", "Satellite motion"], pyq: ["Orbit energy", "Escape velocity"] },
    "Thermodynamics": { weight: 2, subtopics: ["First law", "Second law", "Entropy", "Processes"], pyq: ["PV graphs", "Carnot engine"] },
    "Oscillations & Waves": { weight: 2, subtopics: ["SHM", "Pendulum", "Wave equation", "Superposition"], pyq: ["Time period", "Wave speed"] },
    "Electrostatics": { weight: 2, subtopics: ["Coulomb law", "Field", "Gauss law", "Capacitance"], pyq: ["Field symmetry", "Capacitor energy"] },
    "Current Electricity": { weight: 2, subtopics: ["Ohm law", "Kirchhoff", "Wheatstone bridge", "Cells"], pyq: ["Bridge circuits", "EMF problems"] },
    "Magnetism": { weight: 1, subtopics: ["Biot-Savart", "Ampere law", "Lorentz force"], pyq: ["Force on wire", "Moving charge"] },
    "EMI & AC": { weight: 2, subtopics: ["Faraday law", "Lenz law", "AC circuits", "Transformer"], pyq: ["Induced EMF", "Resonance"] },
    "Ray Optics": { weight: 2, subtopics: ["Reflection", "Refraction", "Lens", "Mirror"], pyq: ["Lens system", "TIR"] },
    "Wave Optics": { weight: 1, subtopics: ["Interference", "Diffraction", "Polarisation"], pyq: ["YDSE", "Fringe width"] },
    "Modern Physics": { weight: 3, subtopics: ["Photoelectric effect", "Bohr model", "Nuclear physics"], pyq: ["de Broglie", "Binding energy"] },
    "Semiconductors": { weight: 1, subtopics: ["Diode", "Transistor", "Logic gates"], pyq: ["Rectifier", "Truth tables"] }
  },
  chemistry: {
    "Some Basic Concepts in Chemistry": { weight: 2, subtopics: ["Laws of chemical combination", "Mole concept", "Stoichiometry", "Concentration terms"], pyq: ["Numerical problems", "Limiting reagent"] },
    "Atomic Structure": { weight: 1, subtopics: ["Bohr model", "Quantum numbers", "Electronic configuration", "Atomic spectra"], pyq: ["Spectral lines", "Energy calculations"] },
    "States of Matter": { weight: 1, subtopics: ["Gaseous and liquid states", "Gas laws", "Kinetic theory"], pyq: ["PV=nRT applications", "RMS velocity"] },
    "Chemical Thermodynamics": { weight: 1, subtopics: ["First & second law", "Enthalpy", "Entropy", "Gibbs free energy"], pyq: ["Hess law", "Spontaneity"] },
    "Equilibrium": { weight: 2, subtopics: ["Chemical equilibrium", "Ionic equilibrium", "Acids, bases", "Buffers"], pyq: ["pH calculations", "Solubility product"] },
    "Redox Reactions": { weight: 1, subtopics: ["Oxidation number", "Balancing redox equations"], pyq: ["Disproportionation", "Equivalent weight"] },
    "Solid State": { weight: 1, subtopics: ["Crystal lattices", "Unit cells", "Packing efficiency"], pyq: ["Density calculation", "Voids"] },
    "Solutions": { weight: 1, subtopics: ["Raoult’s law", "Vapour pressure", "Colligative properties"], pyq: ["Van't Hoff factor", "Boiling point elevation"] },
    "Electrochemistry": { weight: 1, subtopics: ["Conductance", "Electrochemical cells", "Nernst equation"], pyq: ["EMF problems", "Kohlrausch law"] },
    "Chemical Kinetics": { weight: 1, subtopics: ["Rate of reaction", "Order", "Arrhenius equation"], pyq: ["Half-life", "Activation energy"] },
    "Purification & Characterisation": { weight: 1, subtopics: ["Crystallisation", "Distillation", "Chromatography", "Detection of elements"], pyq: ["Kjeldahl method", "Carius method"] },
    "Some Basic Principles (GOC)": { weight: 2, subtopics: ["GOC", "Electronic effects", "Reaction intermediates", "Reaction types"], pyq: ["Stability of intermediates", "Acidity/Basicity order"] },
    "Hydrocarbons": { weight: 2, subtopics: ["Alkanes", "Alkenes", "Alkynes", "Aromatic hydrocarbons"], pyq: ["Markovnikov rule", "Friedel-Crafts reaction"] },
    "Haloalkanes & Haloarenes": { weight: 1, subtopics: ["Preparation", "Properties", "SN1 & SN2 mechanisms"], pyq: ["Stereochemistry", "Nucleophilic substitution"] },
    "Alcohols, Phenols & Ethers": { weight: 1, subtopics: ["Reactions", "Acidity of phenols", "Ethers preparation"], pyq: ["Reimer-Tiemann", "Esterification"] },
    "Aldehydes, Ketones & Acids": { weight: 2, subtopics: ["Aldehydes", "Ketones", "Carboxylic acids"], pyq: ["Aldol condensation", "Cannizzaro reaction"] },
    "Amines & Nitrogen Compounds": { weight: 1, subtopics: ["Basicity of amines", "Diazonium salts"], pyq: ["Hinsberg test", "Sandmeyer reaction"] },
    "Biomolecules": { weight: 1, subtopics: ["Carbohydrates", "Proteins", "Amino acids", "Nucleic acids"], pyq: ["Glucose structure", "Peptide linkage"] },
    "Practical Chemistry": { weight: 1, subtopics: ["Qualitative analysis", "Basic laboratory principles"], pyq: ["Detection of functional groups", "Salt analysis"] },
    "Classification & Periodicity": { weight: 1, subtopics: ["Modern periodic law", "Periodic trends"], pyq: ["Ionisation energy", "Electron gain enthalpy"] },
    "Chemical Bonding & Structure": { weight: 2, subtopics: ["Ionic & covalent bonding", "VSEPR", "Hybridisation", "MOT"], pyq: ["Shape prediction", "Bond order"] },
    "p-Block Elements": { weight: 2, subtopics: ["Groups 13–18 elements", "Properties and trends"], pyq: ["Oxidation states", "Anomalous behavior"] },
    "d- & f-Block Elements": { weight: 1, subtopics: ["Transition elements", "Lanthanoids", "Actinoids"], pyq: ["Color compounds", "Magnetic moment"] },
    "Coordination Compounds": { weight: 2, subtopics: ["Werner’s theory", "Ligands", "Isomerism", "Crystal field theory"], pyq: ["IUPAC naming", "CFT splitting"] }
  },
  math: {
    "Sets, Relations & Functions": { weight: 1, subtopics: ["Sets and representation", "Relations and types", "Functions and composition"], pyq: ["Domain and range", "Equivalence relations"] },
    "Complex Numbers & Quadratics": { weight: 2, subtopics: ["Argand diagram", "Algebra of complex numbers", "Quadratic equations", "Nature of roots"], pyq: ["Modulus argument", "Sum and product of roots"] },
    "Matrices & Determinants": { weight: 2, subtopics: ["Algebra of matrices", "Determinants order 2 & 3", "Adjoint and inverse", "Linear equations"], pyq: ["Matrix inversion", "System consistency"] },
    "Permutations & Combinations": { weight: 1, subtopics: ["Fundamental principle of counting", "P(n,r) and C(n,r)", "Applications"], pyq: ["Selection and arrangement", "Geometrical problems"] },
    "Binomial Theorem": { weight: 1, subtopics: ["Binomial theorem expansion", "General and middle terms", "Properties of coefficients"], pyq: ["Coefficient finding", "Remainder problems"] },
    "Sequence & Series": { weight: 2, subtopics: ["AP, GP, HP", "Arithmetic-geometric series", "Sum to n terms"], pyq: ["Special series sum", "Relation between means"] },
    "Limits, Continuity & Differentiability": { weight: 2, subtopics: ["Limits evaluation", "Continuity", "Differentiability rules"], pyq: ["L'Hopital rule", "Differentiability points"] },
    "Integral Calculus": { weight: 3, subtopics: ["Indefinite integrals", "Definite integrals", "Area under curves"], pyq: ["Properties of definite integrals", "Bounded region area"] },
    "Differential Equations": { weight: 1, subtopics: ["Formation", "Variable separable", "Linear differential equations"], pyq: ["Integrating factor", "Particular solution"] },
    "Coordinate Geometry (Lines & Circles)": { weight: 2, subtopics: ["Straight lines", "Family of lines", "Circles and tangents"], pyq: ["Orthogonality", "Chord of contact"] },
    "Conic Sections": { weight: 2, subtopics: ["Parabola", "Ellipse", "Hyperbola"], pyq: ["Tangents and normals", "Eccentricity"] },
    "Three Dimensional Geometry": { weight: 2, subtopics: ["Direction cosines/ratios", "Line in space", "Plane equations"], pyq: ["Shortest distance", "Angle between lines/planes"] },
    "Vector Algebra": { weight: 2, subtopics: ["Scalar and vector products", "Triple products"], pyq: ["Projection", "Coplanarity"] },
    "Probability": { weight: 2, subtopics: ["Conditional probability", "Bayes' theorem", "Probability distribution"], pyq: ["Independent events", "Binomial distribution"] },
    "Trigonometry": { weight: 1, subtopics: ["Trigonometric identities", "Trigonometric equations", "Inverse trigonometric functions"], pyq: ["Principal values", "General solutions"] }
  }
};

/* State Variables */
let currentTab = 'physics';

function key(type, subject, chapter, item) {
  return `${type}__${subject}__${chapter}__${item}`;
}

function isDone(k) {
  return localStorage.getItem(k) === "1";
}

function checkRevisionStatus(chapterKey) {
  if (!isDone(chapterKey)) return false;
  const savedTime = localStorage.getItem(`${chapterKey}__timestamp`);
  if (!savedTime) return false;
  const cooldownPeriod = 7 * 24 * 60 * 60 * 1000; 
  return (Date.now() - parseInt(savedTime, 10)) >= cooldownPeriod;
}

/* Drawer & Rendering Functions */
function toggleDrawer(open) {
  const drawer = document.getElementById('syllabusDrawer');
  const overlay = document.getElementById('drawerOverlay');
  if (open) {
    drawer.classList.add('active');
    overlay.classList.add('active');
    renderSubject(currentTab);
  } else {
    drawer.classList.remove('active');
    overlay.classList.remove('active');
  }
}

function switchTab(subject) {
  currentTab = subject;
  document.querySelectorAll('.drawer-tabs .tab-btn').forEach(btn => btn.classList.remove('active'));
  document.getElementById(`tab-${subject}`).classList.add('active');
  renderSubject(subject);
}

function renderSubject(subject) {
  const container = document.getElementById('drawerContent');
  if (!data[subject]) return;

  let html = '';
  Object.entries(data[subject]).forEach(([chapter, info], i) => {
    const chapterKey = key("chapter", subject, chapter, "done");
    const cardId = `chap_${subject}_${i}`;
    const isCompleted = checkRevisionStatus(chapterKey);

    html += `
      <div class="chapter-card ${isCompleted ? 'is-completed' : ''}" id="${cardId}">
        <div class="chapter-header-row" onclick="toggleChapterAcc('${cardId}')">
          <div class="chapter-title-group" onclick="event.stopPropagation();">
            <input type="checkbox" id="check_${cardId}" onchange="handleChapterToggle(this, '${chapterKey}', '${cardId}')" ${isDone(chapterKey) ? "checked" : ""}>
            <label for="check_${cardId}">${chapter}</label>
            <span class="weight-badge">${info.weight} Qs</span>
          </div>
          <div>
            <span class="revision-stamp">Revise</span>
            <span style="font-size: 12px; color: var(--text-muted);">▼</span>
          </div>
        </div>
        <div class="chapter-body">
          <div class="section-label">Subtopics</div>
          ${info.subtopics.map((st, subIdx) => {
            const subKey = key("sub", subject, chapter, st);
            return `
              <div class="task-item">
                <input type="checkbox" id="sub_${cardId}_${subIdx}" onchange="localStorage.setItem('${subKey}', this.checked ? '1' : '0')" ${isDone(subKey) ? "checked" : ""}>
                <label for="sub_${cardId}_${subIdx}">${st}</label>
              </div>
            `;
          }).join("")}
          <div class="section-label">PYQ Patterns</div>
          <ul class="pyq-list">
            ${info.pyq.map(p => `<li>${p}</li>`).join("")}
          </ul>
        </div>
      </div>
    `;
  });
  container.innerHTML = html;
}

function toggleChapterAcc(cardId) {
  document.getElementById(cardId).classList.toggle('is-open');
}

function handleChapterToggle(checkbox, chapterKey, cardId) {
  const state = checkbox.checked ? "1" : "0";
  localStorage.setItem(chapterKey, state);
  if (state === "1") {
    localStorage.setItem(`${chapterKey}__timestamp`, Date.now().toString());
  } else {
    localStorage.removeItem(`${chapterKey}__timestamp`);
  }

  const card = document.getElementById(cardId);
  if (card) {
    if (checkRevisionStatus(chapterKey)) {
      card.classList.add('is-completed');
    } else {
      card.classList.remove('is-completed');
    }
  }
  updateProgress();
}

/* Progress Calculations */
function updateProgress() {
  const subjects = [
    { key: 'physics', elementClass: '.physics-progress' },
    { key: 'chemistry', elementClass: '.chemistry-progress' },
    { key: 'math', elementClass: '.math-progress' }
  ];

  subjects.forEach(sub => {
    let totalWeight = 0;
    let completedWeight = 0;

    if (data[sub.key]) {
      Object.entries(data[sub.key]).forEach(([chapName, info]) => {
        const w = info.weight || 1;
        totalWeight += w;
        if (isDone(key("chapter", sub.key, chapName, "done"))) {
          completedWeight += w;
        }
      });
    }

    const pct = totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100) : 0;
    const row = document.querySelector(sub.elementClass);
    if (row) {
      row.querySelector('.progress-bar-fill').style.width = `${pct}%`;
      row.querySelector('.progress-percentage').textContent = `${pct}%`;
    }
  });
}

/* Pomodoro Timer Logic */
let timerInterval = null;
let timeLeft = 25 * 60;
let isRunning = false;
let currentMode = 'focus';

const modes = {
  focus: 25 * 60,
  short: 5 * 60,
  long: 15 * 60
};

function setTimerMode(mode, event) {
  currentMode = mode;
  timeLeft = modes[mode];
  pauseTimer();
  updateTimerDisplay();
  
  if (event) {
    document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
  }
}

function updateTimerDisplay() {
  const m = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const s = (timeLeft % 60).toString().padStart(2, '0');
  document.getElementById('timerDisplay').textContent = `${m}:${s}`;
}

function toggleTimer() {
  if (isRunning) {
    pauseTimer();
  } else {
    startTimer();
  }
}

function startTimer() {
  isRunning = true;
  document.getElementById('startBtn').textContent = 'Pause Flow';
  timerInterval = setInterval(() => {
    if (timeLeft > 0) {
      timeLeft--;
      updateTimerDisplay();
    } else {
      pauseTimer();
      alert('Flow Session Completed! Take a quick break.');
    }
  }, 1000);
}

function pauseTimer() {
  isRunning = false;
  clearInterval(timerInterval);
  document.getElementById('startBtn').textContent = 'Start Flow';
}

function resetTimer() {
  pauseTimer();
  timeLeft = modes[currentMode];
  updateTimerDisplay();
}

/* Task Manager Logic */
let tasks = JSON.parse(localStorage.getItem('focus_flow_tasks') || '[]');

function saveTasks() {
  localStorage.setItem('focus_flow_tasks', JSON.stringify(tasks));
  renderTasks();
}

function addTask() {
  const input = document.getElementById('newTaskInput');
  if (!input.value.trim()) return;
  tasks.push({ text: input.value.trim(), done: false });
  input.value = '';
  saveTasks();
}

function toggleTask(index) {
  tasks[index].done = !tasks[index].done;
  saveTasks();
}

function renderTasks() {
  const list = document.getElementById('taskList');
  list.innerHTML = '';
  tasks.forEach((t, i) => {
    list.innerHTML += `
      <li class="task-item-row ${t.done ? 'done' : ''}">
        <input type="checkbox" ${t.done ? 'checked' : ''} onchange="toggleTask(${i})">
        <span>${t.text}</span>
      </li>
    `;
  });
  document.getElementById('taskCount').textContent = `${tasks.filter(t => t.done).length}/${tasks.length} done`;
}

/* Initialize App */
document.addEventListener('DOMContentLoaded', () => {
  updateProgress();
  renderTasks();
});
