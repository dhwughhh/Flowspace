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

// Appropriate study streak logic: Counts consecutive days up to today
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

// Renders structural grid items matching your CSS rules exactly
function renderDynamicCalendar() {
    const calendarGrid = document.getElementById('calendar-days'); 
    if (!calendarGrid) return;
    calendarGrid.innerHTML = ''; 
    
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    
    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = document.createElement('div');
        dayElement.classList.add('day'); // Matches CSS structure perfectly now
        dayElement.textContent = day;
        
        const targetDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        // Highlight active calendar blocks
        if (appState.sessions.some(s => s.date === targetDateStr)) {
            dayElement.classList.add('cell-active');
        }
        calendarGrid.appendChild(dayElement);
    }
}

// Renders detailed permanent session logs inside the calendar view
function renderNotes() {
    const notesContainer = document.getElementById('historical-notes-display'); 
    if (!notesContainer) return;
    
    if (appState.sessions.length === 0) {
        notesContainer.innerHTML = `<p style="font-size:0.85rem; opacity:0.6; font-style:italic;">No logged history yet.</p>`;
        return;
    }
    
    notesContainer.innerHTML = ''; 
    // Show details of every single completed focus slot chronologically
    appState.sessions.slice().reverse().forEach((session, index) => {
        const actualIndex = appState.sessions.length - 1 - index;
        const logCard = document.createElement('div');
        logCard.className = 'historical-note-item';
        logCard.style.position = 'relative';
        
        const metaSpan = document.createElement('span');
        metaSpan.className = 'historical-note-meta';
        metaSpan.textContent = `${session.date} • ${session.subject} (${session.duration} mins)`;
        
        const detailsSpan = document.createElement('span');
        detailsSpan.style.fontSize = '0.85rem';
        detailsSpan.textContent = session.topic ? `Goal: ${session.topic}` : "General Study Focus";
        
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = '×';
        deleteBtn.style = 'position:absolute; right:5px; top:5px; background:none; border:none; color:#ff8fa3; cursor:pointer; font-size:1.1rem;';
        deleteBtn.onclick = () => { 
            appState.sessions.splice(actualIndex, 1); 
            saveData(); 
            updateDashboardUI();
            renderDynamicCalendar();
            renderNotes(); 
        };
        
        logCard.appendChild(metaSpan);
        logCard.appendChild(detailsSpan);
        logCard.appendChild(deleteBtn);
        notesContainer.appendChild(logCard);
    });
}

function handleBulletPoints(event) {
    if (event.key === 'Enter') {
        const scratchpad = document.getElementById('scratchpad');
        if (!scratchpad) return;
        // Keep scratchpad operational inside session panel
    }
}

function selectSubject(subjectName) {
    currentSubject = subjectName;
    const buttons = document.querySelectorAll('.subject-pill');
    buttons.forEach(btn => {
        let text = btn.textContent.trim();
        if (text === 'Skills') text = 'Skill Building';
        if (text.toLowerCase() === subjectName.toLowerCase()) {
            btn.classList.add('active');
        } else { 
            btn.classList.remove('active'); 
        }
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
    const sessionInput = document.getElementById('session-name');
    
    // Log explicit session tracking details straight to structural storage
    appState.sessions.push({ 
        date: getTodayString(), 
        duration: finalMinutes || 1, // Logs minimum 1 minute for quick tests
        subject: currentSubject,
        topic: sessionInput ? sessionInput.value.trim() : ""
    });
    saveData();
    
    document.getElementById('timer-screen').classList.replace('active', 'hidden');
    document.getElementById('home-screen').classList.replace('hidden', 'active');
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
