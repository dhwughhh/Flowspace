/**
 * FlowSpace - Core Application Script
 * Architecture, State Management, and Security Refactor
 */

// ==========================================
// 1. STATE & PERSISTENCE MANAGEMENT (Fix 1, 3)
// ==========================================

// Centralized application state
let appState = {
    sessions: [], // Array of objects: { date: "YYYY-MM-DD", duration: Number (mins) }
    notes: []     // Array of strings
};

// Application state variables for tracking current session
let currentSubject = "Physics";
let timerInterval = null;
let totalSecondsElapsed = 0;
let isTimerPaused = false;

/**
 * Loads data from localStorage into application state on startup.
 */
function loadData() {
    try {
        const savedData = localStorage.getItem('flowspace_data');
        if (savedData) {
            appState = JSON.parse(savedData);
            if (!Array.isArray(appState.sessions)) appState.sessions = [];
            if (!Array.isArray(appState.notes)) appState.notes = [];
        }
    } catch (e) {
        console.error("Failed to load data from localStorage:", e);
    }
}

/**
 * Saves current application state to localStorage.
 */
function saveData() {
    try {
        localStorage.setItem('flowspace_data', JSON.stringify(appState));
    } catch (e) {
        console.error("Failed to save data to localStorage:", e);
    }
}

/**
 * Helper to get the complete current date as a localized string (YYYY-MM-DD)
 */
function getTodayString() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}


// ==========================================
// 2. STREAK & STATS LOGIC (Fix 2, 5)
// ==========================================

/**
 * Calculates a true consecutive day streak backward from today/yesterday.
 */
function calculateCurrentStreak() {
    const uniqueDates = [...new Set(appState.sessions.map(s => s.date))].sort();
    if (uniqueDates.length === 0) return 0;

    const todayStr = getTodayString();
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (!uniqueDates.includes(todayStr) && !uniqueDates.includes(yesterdayStr)) {
        return 0;
    }

    let streak = 0;
    let checkDate = uniqueDates.includes(todayStr) ? new Date(todayStr) : new Date(yesterdayStr);

    while (true) {
        const checkDateStr = checkDate.toISOString().split('T')[0];
        if (uniqueDates.includes(checkDateStr)) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
        } else {
            break;
        }
    }

    return streak;
}

/**
 * Computes analytics and updates UI matching index.html IDs perfectly.
 */
function updateDashboardUI() {
    const todayStr = getTodayString();

    // Fix 5: Filter sessions ONLY belonging to today's strict YYYY-MM-DD string
    const todayMins = appState.sessions
        .filter(session => session.date === todayStr)
        .reduce((total, session) => total + session.duration, 0);

    // Calculate overall total metrics
    const totalMins = appState.sessions.reduce((total, session) => total + session.duration, 0);
    const totalSessionsCount = appState.sessions.length;
    const currentStreak = calculateCurrentStreak();

    // DOM Element Bindings derived explicitly from your HTML definitions
    const streakDaysElem = document.getElementById('streak-days');
    const yesterdayHoursElem = document.getElementById('yesterday-hours'); // Your "Today" text placeholder
    const statSessionsElem = document.getElementById('stat-sessions-count');
    const statTotalMinsElem = document.getElementById('stat-total-minutes');

    if (streakDaysElem) streakDaysElem.textContent = currentStreak;
    if (yesterdayHoursElem) yesterdayHoursElem.textContent = todayMins;
    if (statSessionsElem) statSessionsElem.textContent = totalSessionsCount;
    if (statTotalMinsElem) statTotalMinsElem.textContent = `${totalMins} mins`;
}


// ==========================================
// 3. DYNAMIC CALENDAR RENDERING (Fix 4)
// ==========================================

/**
 * Dynamically builds a calendar grid matching the actual days of the current month.
 */
function renderDynamicCalendar() {
    const calendarGrid = document.getElementById('calendar-days'); // Matches your HTML ID
    if (!calendarGrid) return;
    
    calendarGrid.innerHTML = ''; 

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = document.createElement('div');
        dayElement.classList.add('calendar-day');
        dayElement.textContent = day;

        const targetDateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const hasStudied = appState.sessions.some(s => s.date === targetDateStr);
        
        if (hasStudied) {
            dayElement.classList.add('active'); // Applies your structural styling highlights
        }

        calendarGrid.appendChild(dayElement);
    }
}


// ==========================================
// 4. SECURE NOTES ENGINE (Fix 6)
// ==========================================

/**
 * Safe render engine utilizing node text fields to strip malicious markup.
 */
function renderNotes() {
    const notesContainer = document.getElementById('historical-notes-display'); // Matches your HTML ID
    if (!notesContainer) return;

    if (appState.notes.length === 0) {
        notesContainer.innerHTML = `<p style="font-size:0.85rem; opacity:0.6; font-style:italic;">No session notes recorded today yet.</p>`;
        return;
    }

    notesContainer.innerHTML = ''; 

    appState.notes.forEach((noteText, index) => {
        const noteCard = document.createElement('div');
        noteCard.style.display = 'flex';
        noteCard.style.justify = 'space-between';
        noteCard.style.alignItems = 'center';
        noteCard.style.marginBottom = '8px';
        noteCard.style.background = 'rgba(255, 255, 255, 0.05)';
        noteCard.style.padding = '6px 10px';
        noteCard.style.borderRadius = '8px';

        const textWrapper = document.createElement('span');
        textWrapper.style.fontSize = '0.9rem';
        // Fix 6: textContent handles injection protection seamlessly
        textWrapper.textContent = noteText; 

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = '×';
        deleteBtn.style.background = 'none';
        deleteBtn.style.border = 'none';
        deleteBtn.style.color = '#ff8fa3';
        deleteBtn.style.cursor = 'pointer';
        deleteBtn.style.fontSize = '1.2rem';
        deleteBtn.onclick = () => removeNote(index);

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
            playClickSound();
            appState.notes.push(cleanText);
            saveData();
            renderNotes();
        }
        scratchpad.value = '';
    }
}

function removeNote(index) {
    appState.notes.splice(index, 1);
    saveData();
    renderNotes();
}


// ==========================================
// 5. MEMORY-EFFICIENT AUDIO WEB API (Fix 7)
// ==========================================

let globalAudioContext = null;

function playClickSound() {
    try {
        if (!globalAudioContext) {
            globalAudioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (globalAudioContext.state === 'suspended') {
            globalAudioContext.resume();
        }

        const oscillator = globalAudioContext.createOscillator();
        const gainNode = globalAudioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(globalAudioContext.destination);
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(587.33, globalAudioContext.currentTime); 
        gainNode.gain.setValueAtTime(0.08, globalAudioContext.currentTime);
        
        oscillator.start();
        gainNode.gain.exponentialRampToValueAtTime(0.00001, globalAudioContext.currentTime + 0.08);
        oscillator.stop(globalAudioContext.currentTime + 0.08);
    } catch (err) {
        console.warn("Audio Context playback unsupported:", err);
    }
}


// ==========================================
// 6. TIMER ENGINE AND APP FLOW LOGIC
// ==========================================

function selectSubject(subjectName) {
    playClickSound();
    currentSubject = subjectName;
    
    const buttons = document.querySelectorAll('.subject-pill');
    buttons.forEach(btn => {
        if (btn.textContent.trim().toLowerCase() === subjectName.toLowerCase() || 
            (btn.textContent.trim() === 'Skills' && subjectName === 'Skill Building')) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

function startFocus() {
    playClickSound();
    const sessionInput = document.getElementById('session-name');
    const topicTitle = document.getElementById('current-topic');
    const subjectTag = document.getElementById('current-subject');

    if (topicTitle) topicTitle.textContent = sessionInput.value.trim() || "Deep Revision";
    if (subjectTag) subjectTag.textContent = currentSubject;

    // Switch Screen Layouts
    document.getElementById('home-screen').classList.remove('active');
    document.getElementById('home-screen').classList.add('hidden');
    document.getElementById('timer-screen').classList.remove('hidden');
    document.getElementById('timer-screen').classList.add('active');

    // Run Clock Engine upward forward incrementing seconds
    totalSecondsElapsed = 0;
    isTimerPaused = false;
    updateTimerDisplay();
    
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        if (!isTimerPaused) {
            totalSecondsElapsed++;
            updateTimerDisplay();
            updateAnalogClockHands();
        }
    }, 1000);
}

function updateTimerDisplay() {
    const display = document.getElementById('time-display');
    if (!display) return;
    
    const mins = Math.floor(totalSecondsElapsed / 60);
    const secs = totalSecondsElapsed % 60;
    display.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function updateAnalogClockHands() {
    const hrHand = document.getElementById('hour-hand');
    const minHand = document.getElementById('minute-hand');
    const secHand = document.getElementById('second-hand');

    const totalMinutes = totalSecondsElapsed / 60;
    const totalHours = totalMinutes / 60;

    // Custom visual rotation metrics tracking active duration paths
    if (secHand) secHand.style.transform = `translateX(-50%) rotate(${(totalSecondsElapsed * 6) % 360}deg)`;
    if (minHand) minHand.style.transform = `translateX(-50%) rotate(${(totalMinutes * 6) % 360}deg)`;
    if (hrHand) hrHand.style.transform = `translateX(-50%) rotate(${(totalHours * 30) % 360}deg)`;
}

function toggleTimer() {
    playClickSound();
    isTimerPaused = !isTimerPaused;
    const pauseBtn = document.getElementById('pause-btn');
    if (pauseBtn) {
        pauseBtn.textContent = isTimerPaused ? "Resume" : "Pause";
    }
}

function quitSession() {
    playClickSound();
    if (timerInterval) clearInterval(timerInterval);

    // Save calculation data if user was focused for at least 1 minute
    const finalMinutes = Math.floor(totalSecondsElapsed / 60);
    if (finalMinutes > 0) {
        appState.sessions.push({
            date: getTodayString(),
            duration: finalMinutes
        });
        saveData();
    }

    // Reset components back to home view
    document.getElementById('timer-screen').classList.remove('active');
    document.getElementById('timer-screen').classList.add('hidden');
    document.getElementById('home-screen').classList.remove('hidden');
    document.getElementById('home-screen').classList.add('active');

    const sessionInput = document.getElementById('session-name');
    if (sessionInput) sessionInput.value = '';

    updateDashboardUI();
    renderDynamicCalendar();
    renderNotes();
}


// ==========================================
// 7. MODAL LAYOUT HANDLERS
// ==========================================

function openModal(modalId) {
    playClickSound();
    const targetModal = document.getElementById(modalId);
    if (targetModal) targetModal.classList.remove('hidden');
}

function closeModal(modalId) {
    const targetModal = document.getElementById(modalId);
    if (targetModal) targetModal.classList.add('hidden');
}


// ==========================================
// 8. BOOTSTRAP INITIALIZATION
// ==========================================

window.addEventListener('DOMContentLoaded', () => {
    loadData();
    updateDashboardUI();
    renderDynamicCalendar();
    renderNotes();
});
