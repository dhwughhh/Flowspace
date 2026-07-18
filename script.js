let appState = { sessions: [], notes: [] };
let currentSubject = "Physics";
let timerInterval = null;
let totalSecondsElapsed = 0;
let isTimerPaused = false;

function loadData() {
    try {
        const savedData = localStorage.getItem('flowspace_data');
        if (savedData) {
            appState = JSON.parse(savedData);
            if (!Array.isArray(appState.sessions)) appState.sessions = [];
            if (!Array.isArray(appState.notes)) appState.notes = [];
        }
    } catch (e) { console.error(e); }
}

function saveData() {
    try { localStorage.setItem('flowspace_data', JSON.stringify(appState)); } catch (e) { console.error(e); }
}

function getTodayString() {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
}

function calculateCurrentStreak() {
    const uniqueDates = [...new Set(appState.sessions.map(s => s.date))].sort();
    if (uniqueDates.length === 0) return 0;
    const todayStr = getTodayString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    if (!uniqueDates.includes(todayStr) && !uniqueDates.includes(yesterdayStr)) return 0;
    let streak = 0;
    let checkDate = uniqueDates.includes(todayStr) ? new Date(todayStr) : new Date(yesterdayStr);
    while (true) {
        const checkDateStr = checkDate.toISOString().split('T')[0];
        if (uniqueDates.includes(checkDateStr)) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
        } else { break; }
    }
    return streak;
}

function updateDashboardUI() {
    const todayStr = getTodayString();
    const todayMins = appState.sessions.filter(s => s.date === todayStr).reduce((t, s) => t + s.duration, 0);
    const totalMins = appState.sessions.reduce((t, s) => t + s.duration, 0);
    const streakDaysElem = document.getElementById('streak-days');
    const yesterdayHoursElem = document.getElementById('yesterday-hours'); 
    const statSessionsElem = document.getElementById('stat-sessions-count');
    const statTotalMinsElem = document.getElementById('stat-total-minutes');
    if (streakDaysElem) streakDaysElem.textContent = calculateCurrentStreak();
    if (yesterdayHoursElem) yesterdayHoursElem.textContent = todayMins;
    if (statSessionsElem) statSessionsElem.textContent = appState.sessions.length;
    if (statTotalMinsElem) statTotalMinsElem.textContent = `${totalMins} mins`;
}

function renderDynamicCalendar() {
    const calendarGrid = document.getElementById('calendar-days'); 
    if (!calendarGrid) return;
    calendarGrid.innerHTML = ''; 
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = document.createElement('div');
        dayElement.classList.add('calendar-day');
        dayElement.textContent = day;
        const targetDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        if (appState.sessions.some(s => s.date === targetDateStr)) dayElement.classList.add('active'); 
        calendarGrid.appendChild(dayElement);
    }
}

function renderNotes() {
    const notesContainer = document.getElementById('historical-notes-display'); 
    if (!notesContainer) return;
    if (appState.notes.length === 0) {
        notesContainer.innerHTML = `<p style="font-size:0.85rem; opacity:0.6; font-style:italic;">No session notes recorded today yet.</p>`;
        return;
    }
    notesContainer.innerHTML = ''; 
    appState.notes.forEach((noteText, index) => {
        const noteCard = document.createElement('div');
        noteCard.style = 'display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; background:rgba(255,255,255,0.05); padding:6px 10px; border-radius:8px;';
        const textWrapper = document.createElement('span');
        textWrapper.style.fontSize = '0.9rem';
        textWrapper.textContent = noteText; 
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = '×';
        deleteBtn.style = 'background:none; border:none; color:#ff8fa3; cursor:pointer; font-size:1.2rem;';
        deleteBtn.onclick = () => { appState.notes.splice(index, 1); saveData(); renderNotes(); };
        noteCard.appendChild(textWrapper);
        noteCard.appendChild(deleteBtn);
        notesContainer.appendChild(noteCard);
    });
}

function handleBulletPoints(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        const scratchpad = document.getElementById('scratchpad');
        if (!scratchpad) return;
        let cleanText = scratchpad.value.replace(/^[•\s\-\*]+/g, '').trim();
        if (cleanText) {
            appState.notes.push(cleanText);
            saveData();
            renderNotes();
        }
        scratchpad.value = '';
    }
}

function selectSubject(subjectName) {
    currentSubject = subjectName;
    const buttons = document.querySelectorAll('.subject-pill');
    buttons.forEach(btn => {
        if (btn.textContent.trim().toLowerCase() === subjectName.toLowerCase() || (btn.textContent.trim() === 'Skills' && subjectName === 'Skill Building')) {
            btn.classList.add('active');
        } else { btn.classList.remove('active'); }
    });
}

function startFocus() {
    const sessionInput = document.getElementById('session-name');
    const topicTitle = document.getElementById('current-topic');
    const subjectTag = document.getElementById('current-subject');
    if (topicTitle) topicTitle.textContent = sessionInput.value.trim() || "Deep Revision";
    if (subjectTag) subjectTag.textContent = currentSubject;
    document.getElementById('home-screen').classList.replace('active', 'hidden');
    document.getElementById('timer-screen').classList.replace('hidden', 'active');
    totalSecondsElapsed = 0;
    isTimerPaused = false;
    updateTimerDisplay();
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        if (!isTimerPaused) {
            totalSecondsElapsed++;
            updateTimerDisplay();
            const hrHand = document.getElementById('hour-hand');
            const minHand = document.getElementById('minute-hand');
            const secHand = document.getElementById('second-hand');
            if (secHand) secHand.style.transform = `translateX(-50%) rotate(${(totalSecondsElapsed * 6) % 360}deg)`;
            if (minHand) minHand.style.transform = `translateX(-50%) rotate(${((totalSecondsElapsed / 60) * 6) % 360}deg)`;
            if (hrHand) hrHand.style.transform = `translateX(-50%) rotate(${((totalSecondsElapsed / 3600) * 30) % 360}deg)`;
        }
    }, 1000);
}

function updateTimerDisplay() {
    const display = document.getElementById('time-display');
    if (!display) return;
    display.textContent = `${String(Math.floor(totalSecondsElapsed / 60)).padStart(2, '0')}:${String(totalSecondsElapsed % 60).padStart(2, '0')}`;
}

function toggleTimer() {
    isTimerPaused = !isTimerPaused;
    const pauseBtn = document.getElementById('pause-btn');
    if (pauseBtn) pauseBtn.textContent = isTimerPaused ? "Resume" : "Pause";
}

function quitSession() {
    if (timerInterval) clearInterval(timerInterval);
    const finalMinutes = Math.floor(totalSecondsElapsed / 60);
    if (finalMinutes > 0) {
        appState.sessions.push({ date: getTodayString(), duration: finalMinutes });
        saveData();
    }
    document.getElementById('timer-screen').classList.replace('active', 'hidden');
    document.getElementById('home-screen').classList.replace('hidden', 'active');
    const sessionInput = document.getElementById('session-name');
    if (sessionInput) sessionInput.value = '';
    updateDashboardUI();
    renderDynamicCalendar();
    renderNotes();
}

function openModal(modalId) {
    const targetModal = document.getElementById(modalId);
    if (targetModal) targetModal.classList.remove('hidden');
}

function closeModal(modalId) {
    const targetModal = document.getElementById(modalId);
    if (targetModal) targetModal.classList.add('hidden');
}

window.addEventListener('DOMContentLoaded', () => {
    loadData();
    updateDashboardUI();
    renderDynamicCalendar();
    renderNotes();
});
