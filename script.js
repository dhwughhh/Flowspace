let appState = { sessions: [], notes: [] };
let currentSubject = "Physics";
let timerInterval = null;
let startTime = 0;          
let pausedTimeAcc = 0;      
let isTimerPaused = false;
let selectedDateStr = "";

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
        dayElement.classList.add('day'); 
        dayElement.textContent = day;
        dayElement.style.cursor = "pointer";
        
        const targetDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        if (appState.sessions.some(s => s.date === targetDateStr)) {
            dayElement.classList.add('cell-active');
        }
        
        if (selectedDateStr === targetDateStr) {
            dayElement.style.outline = "2px solid #4c0519";
        }
        
        dayElement.onclick = () => {
            if (selectedDateStr === targetDateStr) {
                selectedDateStr = ""; 
            } else {
                selectedDateStr = targetDateStr;
            }
            renderDynamicCalendar();
            renderNotes();
        };
        
        calendarGrid.appendChild(dayElement);
    }
}

function renderNotes() {
    const notesContainer = document.getElementById('historical-notes-display'); 
    if (!notesContainer) return;
    
    let filteredSessions = appState.sessions;
    if (selectedDateStr) {
        filteredSessions = appState.sessions.filter(s => s.date === selectedDateStr);
    }
    
    if (filteredSessions.length === 0) {
        notesContainer.innerHTML = `<p style="font-size:0.85rem; opacity:0.6; font-style:italic;">${selectedDateStr ? "No sessions logged on this date." : "No logged history yet."}</p>`;
        return;
    }
    
    notesContainer.innerHTML = ''; 
    
    filteredSessions.slice().reverse().forEach((session) => {
        const actualIndex = appState.sessions.findIndex(s => s === session);
        const logCard = document.createElement('div');
        logCard.className = 'historical-note-item';
        logCard.style.position = 'relative';
        logCard.style.marginBottom = '12px';
        
        const metaSpan = document.createElement('span');
        metaSpan.className = 'historical-note-meta';
        metaSpan.textContent = `${session.date} • ${session.subject} (${session.duration} mins)`;
        
        const detailsSpan = document.createElement('span');
        detailsSpan.style.fontSize = '0.85rem';
        detailsSpan.style.display = 'block';
        detailsSpan.textContent = session.topic ? `Goal: ${session.topic}` : "General Study Focus";
        
        if (session.bullets && session.bullets.length > 0) {
            const bulletContainer = document.createElement('div');
            bulletContainer.style.marginTop = '6px';
            bulletContainer.style.paddingLeft = '10px';
            bulletContainer.style.borderLeft = '1px solid rgba(76, 5, 25, 0.15)';
            
            session.bullets.forEach(b => {
                const bText = document.createElement('p');
                bText.style.fontSize = '0.8rem';
                bText.style.opacity = '0.8';
                bText.textContent = `• ${b}`;
                bulletContainer.appendChild(bText);
            });
            detailsSpan.appendChild(bulletContainer);
        }
        
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = '×';
        deleteBtn.style = 'position:absolute; right:5px; top:5px; background:none; border:none; color:#ff8fa3; cursor:pointer; font-size:1.1rem;';
        deleteBtn.onclick = (e) => { 
            e.stopPropagation();
            if(actualIndex !== -1) appState.sessions.splice(actualIndex, 1); 
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
        event.preventDefault();
        const scratchpad = document.getElementById('scratchpad');
        const listContainer = document.getElementById('active-bullet-list');
        if (!scratchpad || !listContainer) return;
        
        let cleanText = scratchpad.value.trim();
        if (cleanText) {
            appState.notes.push(cleanText); 
            
            const noteRow = document.createElement('p');
            noteRow.style.marginBottom = '4px';
            noteRow.textContent = `• ${cleanText}`;
            listContainer.appendChild(noteRow);
            listContainer.scrollTop = listContainer.scrollHeight; 
            
            scratchpad.value = ''; 
        }
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

    const sessionInput = document.getElementById('session-name');
    if (sessionInput) sessionInput.value = '';
}

function getElapsedSeconds() {
    if (isTimerPaused) return pausedTimeAcc;
    return pausedTimeAcc + Math.floor((Date.now() - startTime) / 1000);
}

function startFocus() {
    const sessionInput = document.getElementById('session-name');
    const topicTitle = document.getElementById('current-topic');
    const subjectTag = document.getElementById('current-subject');
    const listContainer = document.getElementById('active-bullet-list');
    
    if (topicTitle) topicTitle.textContent = sessionInput.value.trim() || "Deep Revision";
    if (subjectTag) subjectTag.textContent = currentSubject;
    if (listContainer) listContainer.innerHTML = ''; 
    
    appState.notes = []; 
    
    document.getElementById('home-screen').classList.replace('active', 'hidden');
    document.getElementById('timer-screen').classList.replace('hidden', 'active');
    
    // Add page state so phone back-button/swipe works naturally
    history.pushState({ screen: 'timer' }, '');

    startTime = Date.now();
    pausedTimeAcc = 0;
    isTimerPaused = false;
    updateTimerDisplay();
    
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        if (!isTimerPaused) {
            updateTimerDisplay();
        }
    }, 500); 
}

function updateTimerDisplay() {
    const elapsed = getElapsedSeconds();
    const display = document.getElementById('time-display');
    if (display) {
        display.textContent = `${String(Math.floor(elapsed / 60)).padStart(2, '0')}:${String(elapsed % 60).padStart(2, '0')}`;
    }

    const hrHand = document.getElementById('hour-hand');
    const minHand = document.getElementById('minute-hand');
    const secHand = document.getElementById('second-hand');
    if (secHand) secHand.style.transform = `translateX(-50%) rotate(${(elapsed * 6) % 360}deg)`;
    if (minHand) minHand.style.transform = `translateX(-50%) rotate(${((elapsed / 60) * 6) % 360}deg)`;
    if (hrHand) hrHand.style.transform = `translateX(-50%) rotate(${((elapsed / 3600) * 30) % 360}deg)`;
}

function toggleTimer() {
    const pauseBtn = document.getElementById('pause-btn');
    if (!isTimerPaused) {
        pausedTimeAcc += Math.floor((Date.now() - startTime) / 1000);
        isTimerPaused = true;
        if (pauseBtn) pauseBtn.textContent = "Resume";
    } else {
        startTime = Date.now();
        isTimerPaused = false;
        if (pauseBtn) pauseBtn.textContent = "Pause";
    }
}

function quitSession() {
    if (timerInterval) clearInterval(timerInterval);
    const finalMinutes = Math.floor(getElapsedSeconds() / 60);
    const sessionInput = document.getElementById('session-name');
    const scratchpad = document.getElementById('scratchpad');
    
    if (scratchpad) {
        let finalNoteText = scratchpad.value.trim();
        if (finalNoteText) appState.notes.push(finalNoteText);
        scratchpad.value = '';
    }
    
    appState.sessions.push({ 
        date: getTodayString(), 
        duration: finalMinutes || 1, 
        subject: currentSubject,
        topic: sessionInput ? sessionInput.value.trim() : "",
        bullets: [...appState.notes] 
    });
    
    appState.notes = []; 
    saveData();
    
    document.getElementById('timer-screen').classList.replace('active', 'hidden');
    document.getElementById('home-screen').classList.replace('hidden', 'active');
    
    if (sessionInput) sessionInput.value = '';
    
    updateDashboardUI();
    renderDynamicCalendar();
    renderNotes();
}

// Handle Browser Back Button / Gesture Swipes
window.addEventListener('popstate', (e) => {
    const timerScreen = document.getElementById('timer-screen');
    if (timerScreen && timerScreen.classList.contains('active')) {
        quitSession();
    }
});

function openModal(modalId) {
    const targetModal = document.getElementById(modalId);
    if (targetModal) targetModal.classList.remove('hidden');
    selectedDateStr = ""; 
    renderDynamicCalendar();
    renderNotes();
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
