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

/**
 * Loads data from localStorage into application state on startup.
 */
function loadData() {
    try {
        const savedData = localStorage.getItem('flowspace_data');
        if (savedData) {
            appState = JSON.parse(savedData);
            // Fallback validation to ensure arrays exist
            if (!Array.isArray(appState.sessions)) appState.sessions = [];
            if (!Array.isArray(appState.notes)) appState.notes = [];
        }
    } catch (e) {
        console.error("Failed to load data from localStorage:", e);
    }
}

/**
 * Saves current application state to localStorage.
 * Call this every time appState is mutated!
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
 * safely preventing month/day tracking mismatches.
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
    // Extract unique dates and sort them chronologically
    const uniqueDates = [...new Set(appState.sessions.map(s => s.date))].sort();
    if (uniqueDates.length === 0) return 0;

    const todayStr = getTodayString();
    
    // Generate yesterday's YYYY-MM-DD string
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // If there is no entry for today AND no entry for yesterday, the streak is dead
    if (!uniqueDates.includes(todayStr) && !uniqueDates.includes(yesterdayStr)) {
        return 0;
    }

    let streak = 0;
    // Walk backward starting from today (if studied today) or yesterday
    let checkDate = uniqueDates.includes(todayStr) ? new Date(todayStr) : new Date(yesterdayStr);

    while (true) {
        const checkDateStr = checkDate.toISOString().split('T')[0];
        if (uniqueDates.includes(checkDateStr)) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1); // Step 1 day backward
        } else {
            break; // Gap found, streak ends
        }
    }

    return streak;
}

/**
 * Computes analytics and pushes calculations to UI elements.
 */
function updateDashboardUI() {
    const todayStr = getTodayString();

    // Fix 5: Filter sessions ONLY belonging to today's strict YYYY-MM-DD string
    const todayMins = appState.sessions
        .filter(session => session.date === todayStr)
        .reduce((total, session) => total + session.duration, 0);

    // Calculate overall total time
    const totalMins = appState.sessions.reduce((total, session) => total + session.duration, 0);
    
    // Compute the correct streak
    const currentStreak = calculateCurrentStreak();

    // DOM Element Binding (Adjust IDs if they differ in your HTML)
    const todayElem = document.getElementById('today-stats');
    const totalElem = document.getElementById('total-stats');
    const streakElem = document.getElementById('streak-count');

    if (todayElem) todayElem.textContent = `Today: ${todayMins} mins`;
    if (totalElem) totalElem.textContent = `Total Focus Time: ${totalMins} mins`;
    if (streakElem) streakElem.textContent = `${currentStreak} Days`;
}


// ==========================================
// 3. DYNAMIC CALENDAR RENDERING (Fix 4)
// ==========================================

/**
 * Dynamically builds a calendar grid matching the actual days of the current month.
 */
function renderDynamicCalendar() {
    const calendarGrid = document.getElementById('calendar-grid');
    if (!calendarGrid) return;
    
    calendarGrid.innerHTML = ''; // Safely clear out previous month grid

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed (0 = Jan, 11 = Dec)

    // Using Day '0' of next month automatically drops back to the last day of this month
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = document.createElement('div');
        dayElement.classList.add('calendar-day');
        dayElement.textContent = day;

        // Determine if this day map contains recorded study durations
        const targetDateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const hasStudied = appState.sessions.some(s => s.date === targetDateStr);
        
        if (hasStudied) {
            dayElement.classList.add('active-study-day'); // Highlight styling
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
    const notesContainer = document.getElementById('notes-list');
    if (!notesContainer) return;

    notesContainer.innerHTML = ''; // Safe wipe of layout structural wrapping

    appState.notes.forEach((noteText, index) => {
        const noteCard = document.createElement('div');
        noteCard.classList.add('note-item');

        const textWrapper = document.createElement('p');
        // Fix 6: textContent neutralizes XSS vectors by string-encoding elements
        textWrapper.textContent = noteText; 

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = '×';
        deleteBtn.className = 'delete-note-btn';
        deleteBtn.onclick = () => removeNote(index);

        noteCard.appendChild(textWrapper);
        noteCard.appendChild(deleteBtn);
        notesContainer.appendChild(noteCard);
    });
}

function addNote(text) {
    if (!text.trim()) return;
    appState.notes.push(text);
    saveData();
    renderNotes();
}

function removeNote(index) {
    appState.notes.splice(index, 1);
    saveData();
    renderNotes();
}


// ==========================================
// 5. MEMORY-EFFICIENT AUDIO WEB API (Fix 7)
// ==========================================

// Global variable stores single context reference lazily allocated upon user click
let globalAudioContext = null;

/**
 * Plays a click notification sound reusing a single running AudioContext.
 */
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
        oscillator.frequency.setValueAtTime(587.33, globalAudioContext.currentTime); // D5 note pitch
        gainNode.gain.setValueAtTime(0.08, globalAudioContext.currentTime);
        
        oscillator.start();
        gainNode.gain.exponentialRampToValueAtTime(0.00001, globalAudioContext.currentTime + 0.08);
        oscillator.stop(globalAudioContext.currentTime + 0.08);
    } catch (err) {
        console.warn("AudioContext playback blocked or unsupported by browser:", err);
    }
}


// ==========================================
// 6. TIMER LOGIC INTEGRATION SAMPLE
// ==========================================

/**
 * Call this core function whenever a pomodoro or focus session finishes!
 * @param {number} minutesDuration - Duration of session to record.
 */
function logCompletedSession(minutesDuration) {
    const todayStr = getTodayString();
    
    appState.sessions.push({
        date: todayStr,
        duration: minutesDuration
    });

    saveData();             // Write updates to disk
    updateDashboardUI();    // Refresh calculations
    renderDynamicCalendar(); // Check off calendar element
}


// ==========================================
// 7. BOOTSTRAP INITIALIZATION
// ==========================================

window.addEventListener('DOMContentLoaded', () => {
    // 1. Hydrate state
    loadData();

    // 2. Render updates to interface
    updateDashboardUI();
    renderDynamicCalendar();
    renderNotes();

    // Setup event hooks for explicit user controls (example boilerplate hooks)
    const noteInputBtn = document.getElementById('add-note-submit');
    const noteTextField = document.getElementById('note-input-text');
    if (noteInputBtn && noteTextField) {
        noteInputBtn.addEventListener('click', () => {
            playClickSound();
            addNote(noteTextField.value);
            noteTextField.value = '';
        });
    }
});
