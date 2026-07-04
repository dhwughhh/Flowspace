let selectedSubject = 'Physics';
let timerInterval = null;
let secondsElapsed = 0;
let isTimerRunning = false;
let studyHistory = []; 

const homeQuotes = [
  "\"Quiet the mind, the rest will follow.\"",
  "\"What is meant for you will require your focus.\"",
  "\"Softly, step by step, you create your future.\"",
  "\"Mastering the art of consistency.\""
];

const timerQuotes = [
  "\"Brick by brick, you're building an empire.\"",
  "\"The energy you put out returns to you.\"",
  "\"Quiet execution beats loud talking.\"",
  "\"Deep flow activated. Remain present.\""
];

function playAudioTone(frequency, type, duration) {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gainNode.gain.setValueAtTime(0.02, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + duration);
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
  } catch(e) {}
}

window.selectSubject = function(subject) {
  playAudioTone(600, 'sine', 0.08);
  document.querySelectorAll('.subject-pill').forEach(btn => btn.classList.remove('active'));
  if (window.event && window.event.currentTarget) {
    window.event.currentTarget.classList.add('active');
  }
  selectedSubject = subject;
}

window.startFocus = function() {
  playAudioTone(440, 'triangle', 0.3);
  const sessionName = document.getElementById('session-name').value || "Deep Focus";
  
  document.getElementById('timer-quote').innerText = timerQuotes[Math.floor(Math.random() * timerQuotes.length)];
  document.getElementById('current-topic').innerText = sessionName;
  document.getElementById('current-subject').innerText = selectedSubject;
  
  document.getElementById('scratchpad').value = '• ';

  document.getElementById('home-screen').classList.remove('active');
  setTimeout(() => document.getElementById('home-screen').classList.add('hidden'), 400);
  
  const timerScreen = document.getElementById('timer-screen');
  timerScreen.classList.remove('hidden');
  setTimeout(() => timerScreen.classList.add('active'), 50);
  
  const bgLayer = document.getElementById('bg-pattern-layer');
  if(bgLayer) {
    bgLayer.classList.remove('bg-layer-floral');
    bgLayer.classList.add('bg-layer-lined');
  }
  
  resetTimerMachine();
  toggleTimer(); 
}

window.toggleTimer = function() {
  const pauseBtn = document.getElementById('pause-btn');
  if (isTimerRunning) {
    clearInterval(timerInterval);
    pauseBtn.innerText = "Resume Flow";
    isTimerRunning = false;
    playAudioTone(300, 'sine', 0.2);
  } else {
    isTimerRunning = true;
    pauseBtn.innerText = "Pause";
    playAudioTone(520, 'sine', 0.12);
    timerInterval = setInterval(() => {
      secondsElapsed++;
      updateTimerDisplay();
      updateAnalogClockHands();
    }, 1000);
  }
}

function updateTimerDisplay() {
  const mins = Math.floor(secondsElapsed / 60).toString().padStart(2, '0');
  const secs = (secondsElapsed % 60).toString().padStart(2, '0');
  document.getElementById('time-display').innerText = `${mins}:${secs}`;
}

function updateAnalogClockHands() {
  const secHand = document.getElementById('second-hand');
  const minHand = document.getElementById('minute-hand');
  const hrHand = document.getElementById('hour-hand');

  const secDegrees = (secondsElapsed % 60) * 6; 
  const minDegrees = (secondsElapsed / 60) * 6;
  const hrDegrees = (secondsElapsed / 3600) * 30;

  if(secHand) secHand.style.transform = `rotate(${secDegrees}deg)`;
  if(minHand) minHand.style.transform = `rotate(${minDegrees}deg)`;
  if(hrHand) hrHand.style.transform = `rotate(${hrDegrees}deg)`;
}

function resetTimerMachine() {
  clearInterval(timerInterval);
  secondsElapsed = 0;
  isTimerRunning = false;
  updateTimerDisplay();
  updateAnalogClockHands();
}

window.quitSession = function() {
  playAudioTone(350, 'sine', 0.4);
  clearInterval(timerInterval);
  
  const currentNotes = document.getElementById('scratchpad').value.trim();
  const minutesStudied = Math.round(secondsElapsed / 60) || 1; 

  if (secondsElapsed >= 1) {
    studyHistory.push({
      subject: selectedSubject,
      topic: document.getElementById('current-topic').innerText,
      minutes: minutesStudied,
      date: new Date().getDate(),
      notes: currentNotes !== '•' ? currentNotes : ''
    });
  }

  document.getElementById('home-quote').innerText = homeQuotes[Math.floor(Math.random() * homeQuotes.length)];
  
  document.getElementById('timer-screen').classList.remove('active');
  setTimeout(() => document.getElementById('timer-screen').classList.add('hidden'), 400);
  
  const homeScreen = document.getElementById('home-screen');
  homeScreen.classList.remove('hidden');
  setTimeout(() => homeScreen.classList.add('active'), 50);
  
  const bgLayer = document.getElementById('bg-pattern-layer');
  if(bgLayer) {
    bgLayer.classList.remove('bg-layer-lined');
    bgLayer.classList.add('bg-layer-floral');
  }

  recalculateDashboards();
  openModal('calendar-modal');
}

function recalculateDashboards() {
  let totalMin = 0;
  let subjectMinutes = { 'Physics': 0, 'Chemistry': 0, 'Mathematics': 0, 'Skill Building': 0 };
  let studiedDays = [];
  const notesContainer = document.getElementById('historical-notes-display');
  
  if(notesContainer) notesContainer.innerHTML = '';

  studyHistory.forEach(item => {
    totalMin += item.minutes;
    if(subjectMinutes[item.subject] !== undefined) {
      subjectMinutes[item.subject] += item.minutes;
    }
    if(!studiedDays.includes(item.date)) studiedDays.push(item.date);

    if (item.notes && notesContainer) {
      const formattedNotes = item.notes.replace(/\n/g, '<br>');
      notesContainer.innerHTML += `
        <div class="historical-note-item">
          <span class="historical-note-meta">${item.subject} — ${item.topic} (${item.minutes}m)</span>
          <p style="opacity: 0.85; margin-top: 2px;">${formattedNotes}</p>
        </div>
      `;
    }
  });

  if (notesContainer && notesContainer.innerHTML === '') {
    notesContainer.innerHTML = `<p style="font-size:0.85rem; opacity:0.6; font-style:italic;">No session notes recorded today yet.</p>`;
  }

  const yesterdayHours = document.getElementById('yesterday-hours');
  const statSessionsCount = document.getElementById('stat-sessions-count');
  const statTotalMinutes = document.getElementById('stat-total-minutes');
  const streakDays = document.getElementById('streak-days');

  if(yesterdayHours) yesterdayHours.innerText = totalMin;
  if(statSessionsCount) statSessionsCount.innerText = studyHistory.length;
  if(statTotalMinutes) statTotalMinutes.innerText = totalMin;
  if(streakDays) streakDays.innerText = studiedDays.length;

  const chartBox = document.getElementById('analytics-chart');
  if(chartBox) {
    chartBox.innerHTML = '';
    for (const [sub, min] of Object.entries(subjectMinutes)) {
      const height = Math.min(min * 6, 65) || 4;
      chartBox.innerHTML += `<div class="bar" style="height: ${height}px;">${sub[0]}</div>`;
    }
  }

  const calendarBox = document.getElementById('calendar-days');
  if(calendarBox) {
    calendarBox.innerHTML = '';
    for(let i = 1; i <= 14; i++) {
      const isActive = studiedDays.includes(i) ? 'cell-active' : '';
      calendarBox.innerHTML += `<div class="day ${isActive}">${i}</div>`;
    }
  }
}

window.openModal = function(id) { 
  playAudioTone(700, 'sine', 0.05);
  recalculateDashboards();
  const targetModal = document.getElementById(id);
  if(targetModal) targetModal.classList.remove('hidden'); 
}

window.closeModal = function(id) { 
  playAudioTone(400, 'sine', 0.05);
  const targetModal = document.getElementById(id);
  if(targetModal) targetModal.classList.add('hidden'); 
}

window.handleBulletPoints = function(e) {
  const textarea = e.target;
  if (textarea.value === '') {
    textarea.value = '• ';
  }
  if (e.key === 'Enter') {
    e.preventDefault();
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    textarea.value = text.substring(0, start) + '\n• ' + text.substring(end);
    textarea.selectionStart = textarea.selectionEnd = start + 3;
  }
}