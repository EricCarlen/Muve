// ============================================================
// STATE
// ============================================================
let currentCategory = "";  // key into WORKOUTS
let workoutTimer;
let isPaused = true;
let currentStep = 0;
let elapsed = 0;
let steps = [];             // the active category's steps, used by the timer engine
 
// ============================================================
// WORKOUT DATA — single source of truth.
// Every category is described the same way: a title, an optional
// subtitle, an optional "next" category to chain into, and a flat
// list of steps: { cat, name, duration (seconds), tip? }.
// "Rest" steps are counted down in Timed mode and simply skipped
// in List mode, so every workout works properly in both modes.
//
// NOTE: a few exercises (Morning Flow, Mobility/Strength Side,
// Lower Body) weren't timed in the original app. Durations below
// are reasonable starting estimates — tweak the numbers freely.
// ============================================================
const WORKOUTS = {
 
    morning: {
        title: "Morning Mobility & Sweat",
        subtitle: "Flow: x5 each side or x10 per move",
        steps: [
            { cat: "FLOW", name: "Wrist Circles", duration: 30, tip: "Slow circles; feel the stretch in the forearm." },
            { cat: "FLOW", name: "Neck Circles", duration: 30 },
            { cat: "FLOW", name: "Toe Flex & Splay", duration: 30 },
            { cat: "FLOW", name: "Standing Hip Circles to Forward Fold", duration: 30 },
            { cat: "FLOW", name: "Squat to Overhead Reach", duration: 30 },
            { cat: "FLOW", name: "90/90 Hip Flow to Lunge with Twist", duration: 30 },
            { cat: "FLOW", name: "Greatest Stretch Lunge to Hamstring Stretch with Arm Sweep", duration: 30 },
            { cat: "FLOW", name: "Hindu Push Ups", duration: 30 },
            { cat: "FLOW", name: "Cossack Squat to Side Reach", duration: 30 },
            { cat: "FLOW", name: "Dynamic Frog Pose to Thoracic Bridge", duration: 30 },
            { cat: "FLOW", name: "Standing Side Bend to Back Bend", duration: 30 },
            { cat: "BALANCE", name: "Rest", duration: 15 },
            { cat: "BALANCE", name: "One Leg Arm Circles (L)", duration: 60 },
            { cat: "BALANCE", name: "One Leg Arm Circles (R)", duration: 60 },
            { cat: "BALANCE", name: "One Leg Toes Clock Reaches (L)", duration: 60 },
            { cat: "BALANCE", name: "One Leg Toes Clock Reaches (R)", duration: 60 },
            { cat: "SWEATY", name: "Rest", duration: 15, tip: "Get the heart rate going" },
            { cat: "SWEATY", name: "Toe Touches (30s) | Bicycle (30s)", duration: 60 },
            { cat: "SWEATY", name: "Push Ups", duration: 60 },
            { cat: "SWEATY", name: "Horse Stance with Side Bends", duration: 60 },
            { cat: "SWEATY", name: "Plank", duration: 60 },
            { cat: "SWEATY", name: "Pistol Squat (30s/side)", duration: 60 },
            { cat: "SWEATY", name: "Crawl", duration: 60 }
        ]
    },
 
    "upper body": {
        title: "Upper Body Strength",
        subtitle: "Tense your core and crush those weights",
        steps: [
            // WARM UP
            { cat: "WARM UP", name: "Quadruped Step-through x 20", duration: 60, tip: "Keep it smooth" },
            { cat: "WARM UP", name: "Rest", duration: 10 },
            { cat: "WARM UP", name: "Karaoke Drill – small to big spins", duration: 60, tip: "Comfortable range" },
            { cat: "WARM UP", name: "Rest", duration: 15 },
            { cat: "WARM UP", name: "Skater Squat x 10/leg", duration: 60, tip: "Comfortable range" },
            { cat: "WARM UP", name: "Rest", duration: 15 },
            { cat: "WARM UP", name: "Hindu Pushup x 10", duration: 60, tip: "Comfortable range" },
            { cat: "WARM UP", name: "Rest", duration: 20 },
            { cat: "WARM UP", name: "Windmills x 20", duration: 60, tip: "Comfortable range" },
            { cat: "WARM UP", name: "Rest", duration: 20 },
            { cat: "WARM UP", name: "Turkish Get Up x 3/side", duration: 90, tip: "Comfortable range" },
            { cat: "WARM UP", name: "Rest", duration: 120 },
 
            // BLOCK A x2
            ...buildRounds([
                { name: "Pull-up to Knee Raise x 5", duration: 60, tip: "Slow elbow-to-knee, pause briefly at contact" },
                { name: "Rest", duration: 15 },
                { name: "Push-up to Dumbbell Row x 5/side", duration: 60, tip: "Keep hips square, don't rotate through the row" },
                { name: "Rest", duration: 15 },
                { name: "Hammer Curl to Arnold Press x 5", duration: 60, tip: "Smooth transition, control the rotation at the top" },
                { name: "Rest", duration: 15 },
                { name: "Floor Bridge with Chest Fly x 10", duration: 60, tip: "Squeeze glutes at the top, control the fly" },
                { name: "Rest", duration: 15 },
                { name: "Y Raise – 40s on 20s off", duration: 40, tip: "Thumbs up, lead with the elbows" },
                { name: "Rest", duration: 120 }
            ], "BLOCK A", 2),
 
            // BLOCK B x2
            ...buildRounds([
                { name: "Hand Release Push-up to Downward Dog – 40s", duration: 40, tip: "Full chest to floor, press back with control" },
                { name: "Rest", duration: 20 },
                { name: "Overhead Dumbbell Press to Lateral & Front Raises – 40s", duration: 40, tip: "Ribs down, avoid arching the lower back" },
                { name: "Rest", duration: 20 },
                { name: "Single-leg Dumbbell Row – 40s", duration: 40, tip: "Brace core, minimal hip sway" },
                { name: "Rest", duration: 20 },
                { name: "Bicep Curl x 5", duration: 40, tip: "No swinging, squeeze at the top" },
                { name: "Rest", duration: 120 }
            ], "BLOCK B", 2),
 
            // COOL DOWN
            { cat: "COOL DOWN", name: "Child's Pose with side stretch", duration: 30 },
            { cat: "COOL DOWN", name: "Rest", duration: 5 },
            { cat: "COOL DOWN", name: "Child's Pose with side stretch", duration: 30 },
            { cat: "COOL DOWN", name: "Rest", duration: 5 },
            { cat: "COOL DOWN", name: "Seated Forward Fold", duration: 45 },
            { cat: "COOL DOWN", name: "Rest", duration: 15 },
            { cat: "COOL DOWN", name: "Chest Opener Stretch", duration: 30 },
            { cat: "COOL DOWN", name: "Rest", duration: 5 },
            { cat: "COOL DOWN", name: "Chest Opener Stretch", duration: 30 },
            { cat: "COOL DOWN", name: "Rest", duration: 15 },
            { cat: "COOL DOWN", name: "Supine Figure Four Stretch", duration: 30 },
            { cat: "COOL DOWN", name: "Rest", duration: 10 },
            { cat: "COOL DOWN", name: "Supine Figure Four Stretch", duration: 30 }
        ]
    },
 
    "lower body": {
        title: "Lower Body",
        subtitle: "Strength is a skill",
        next: "core control",
        steps: [
            { cat: "WARM UP", name: "World's Greatest Stretch", duration: 45 },
            { cat: "WARM UP", name: "Inchworm Walk", duration: 45 },
            { cat: "WARM UP", name: "M-Drill / Leg Swings", duration: 45 },
            { cat: "WARM UP", name: "Reach and Roll", duration: 45 },
            { cat: "WARM UP", name: "Slender Lateral Drop", duration: 45 },
 
            ...buildRounds([
                { name: "Goblet Sumo Squats (Heavy)", duration: 45, tip: "Squat & Power Superset — heavy, controlled reps" },
                { name: "Monster Walks", duration: 45 },
                { name: "Rest", duration: 20 },
                { name: "Dumbbell Romanian Deadlift", duration: 45, tip: "Posterior Chain Superset — hinge at the hips, flat back" },
                { name: "Nordic Leans", duration: 45 },
                { name: "Single-leg Deadlift", duration: 45 },
                { name: "Rest", duration: 20 },
                { name: "Reverse Nordics", duration: 45, tip: "Nordic & Glute Focus — control the descent" },
                { name: "Weighted Single Leg Glute Bridges", duration: 45 },
                { name: "Rest", duration: 45 }
            ], "MAIN", 3),
 
            { cat: "COOL DOWN", name: "Kneeling Hamstring Stretch", duration: 45 },
            { cat: "COOL DOWN", name: "Hip Flexor Stretch", duration: 45 },
            { cat: "COOL DOWN", name: "Seated Butterfly Stretch", duration: 45 },
            { cat: "COOL DOWN", name: "Pigeon Pose", duration: 45 },
            { cat: "COOL DOWN", name: "Child's Pose", duration: 45 }
        ]
    },
 
    "core rotation": {
        title: "Core Rotation",
        subtitle: "15 min",
        steps: [
            { cat: "WARM UP", name: "Torso Twists", duration: 60 },
            { cat: "WARM UP", name: "Rest", duration: 15 },
            { cat: "WARM UP", name: "Cat-Cow", duration: 60 },
            { cat: "WARM UP", name: "Rest", duration: 15 },
            { cat: "WARM UP", name: "Standing Side Bends", duration: 60 },
            { cat: "WARM UP", name: "Rest", duration: 15 },
            { cat: "MAIN WORK", name: "Twisting Planks → Side Plank", duration: 150, tip: "Slow transitions, 2 second hold in side plank, focus on rib-to-pelvis control." },
            { cat: "MAIN WORK", name: "Rest", duration: 15 },
            { cat: "MAIN WORK", name: "Russian Twists", duration: 150, tip: "Lean back until core engages; keep chest proud. Exhale with each twist." },
            { cat: "MAIN WORK", name: "Rest", duration: 15 },
            { cat: "MAIN WORK", name: "Starfish Crunch", duration: 150, tip: "Long reach, no momentum, think diagonal compression." },
            { cat: "MAIN WORK", name: "Rest", duration: 15 },
            { cat: "MAIN WORK", name: "Side Plank with Hip Dips (L)", duration: 75, tip: "Small range, constant tension." },
            { cat: "MAIN WORK", name: "Rest", duration: 5 },
            { cat: "MAIN WORK", name: "Side Plank with Hip Dips (R)", duration: 75, tip: "Small range, constant tension." },
            { cat: "MAIN WORK", name: "Rest", duration: 15 },
            { cat: "COOL DOWN", name: "Supine Twists", duration: 120 }
        ]
    },
 
    "core control": {
        title: "Core Control",
        subtitle: "15 min",
        steps: [
            { cat: "WARM UP", name: "Dynamic Plank → Downward Dog", duration: 120, tip: "Keep it smooth" },
            { cat: "WARM UP", name: "Rest", duration: 5 },
            { cat: "WARM UP", name: "Cat-Cow", duration: 60, tip: "Comfortable range" },
            { cat: "WARM UP", name: "Rest", duration: 15 },
            { cat: "MAIN WORK", name: "Bicycle Crunches", duration: 120, tip: "Slow elbow-to-knee, pause briefly at contact" },
            { cat: "MAIN WORK", name: "Rest", duration: 15 },
            { cat: "MAIN WORK", name: "Twisting Bear Crawl", duration: 120, tip: "Knees low, spine quiet, hips steady, ribs rotate" },
            { cat: "MAIN WORK", name: "Rest", duration: 15 },
            { cat: "MAIN WORK", name: "Twisting V-Ups", duration: 120, tip: "Alternate sides each rep, control the lowering phase" },
            { cat: "MAIN WORK", name: "Rest", duration: 15 },
            { cat: "MAIN WORK", name: "Plank Shoulder Taps + Knee Twists", duration: 120, tip: "Reduce speed if hips sway" },
            { cat: "MAIN WORK", name: "Rest", duration: 15 },
            { cat: "MAIN WORK", name: "Twisting Hollow Body Hold", duration: 40, tip: "Small, deliberate rotations only" },
            { cat: "MAIN WORK", name: "Rest", duration: 20 },
            { cat: "MAIN WORK", name: "Twisting Hollow Body Hold", duration: 40, tip: "Small, deliberate rotations only" },
            { cat: "MAIN WORK", name: "Rest", duration: 20 },
            { cat: "COOL DOWN", name: "Child's Pose with side stretch", duration: 60 },
            { cat: "COOL DOWN", name: "Rest", duration: 5 },
            { cat: "COOL DOWN", name: "Child's Pose with side stretch", duration: 60 }
        ]
    },
 
    "mobility side": {
        title: "Mobility",
        subtitle: "Quality full ROM | 2–3 sets",
        steps: [
            { cat: "A", name: "Crawl", duration: 60 },
            { cat: "A", name: "Duck Walk", duration: 60 },
            { cat: "B", name: "Horse Stance", duration: 60 },
            { cat: "B", name: "Bridge Push Up x 5", duration: 30 },
            { cat: "C", name: "Shoulder Rolls x 10", duration: 30 },
            { cat: "C", name: "ATG Split Squat x 10 ea", duration: 30 }
        ]
    },
 
    "strength side": {
        title: "Strength",
        subtitle: "Strength is a skill | 2–3 sets",
        steps: [
            { cat: "A", name: "Push Ups x 5-10", duration: 40 },
            { cat: "A", name: "Broad Jumps x 5", duration: 30 },
            { cat: "B", name: "Pull Ups x 5-10", duration: 40 },
            { cat: "B", name: "Split Squat x 5-8", duration: 40 },
            { cat: "C", name: "Cossack Squat x 3-4/side", duration: 40 },
            { cat: "C", name: "Good Mornings x 8", duration: 40 }
        ]
    },
 
    evening: {
        title: "Evening Calm",
        subtitle: "Long, easy breaths",
        steps: [
            { cat: "WIND DOWN", name: "Ankle Rolls", duration: 30 },
            { cat: "WIND DOWN", name: "Wrist Rotations", duration: 30 },
            { cat: "WIND DOWN", name: "Hands Open and Close", duration: 30 },
            { cat: "WIND DOWN", name: "Shoulder Shrugs", duration: 30 },
            { cat: "WIND DOWN", name: "Neck Rolls", duration: 30 },
            { cat: "WIND DOWN", name: "Forward Fold Sway", duration: 30 },
            { cat: "WIND DOWN", name: "Windshield Wipers", duration: 30 },
            { cat: "WIND DOWN", name: "Legs Up Wall", duration: 60 },
            { cat: "WIND DOWN", name: "Happy Baby", duration: 45 },
            { cat: "WIND DOWN", name: "Supine Twist", duration: 45 },
            { cat: "WIND DOWN", name: "Child's Pose", duration: 45 }
        ]
    }
};
 
// Helper used above: repeats a block of steps N times, labeling each
// round distinctly (e.g. "MAIN · ROUND 1") so headers render per round
// instead of silently merging rounds together under one heading.
function buildRounds(block, label, rounds) {
    const out = [];
    for (let r = 1; r <= rounds; r++) {
        const cat = `${label} · ROUND ${r}`;
        block.forEach(step => out.push({ ...step, cat }));
        // Drop the trailing rest after the very last round
        if (r === rounds && out[out.length - 1].name === "Rest") out.pop();
    }
    return out;
}
 
// ============================================================
// GREETING & FOOTER CALENDAR
// ============================================================
function setGreeting() {
    const hour = new Date().getHours();
    const greetingElement = document.getElementById("greeting");
    let message = "";
 
    if (hour >= 3 && hour < 11) message = "Good Morning! Take a moment to breathe";
    else if (hour >= 11 && hour < 14) message = "Goodonya, reset your breathe";
    else if (hour >= 14 && hour < 18) message = "Marvelous Afternoon, finish work with a breathe";
    else message = "Relax and breathe";
 
    if (greetingElement) greetingElement.innerText = message;
}
 
function updateFooterCalendar() {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
 
    const diffInMilliseconds = now - startOfYear;
    const oneDayInMilliseconds = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diffInMilliseconds / oneDayInMilliseconds) + 1;
 
    const dayOfWeek = startOfYear.getDay() || 7;
    const startOfFirstWeek = new Date(startOfYear);
    startOfFirstWeek.setDate(startOfYear.getDate() - (dayOfWeek - 1));
 
    const weekOfYear = Math.ceil((((now - startOfFirstWeek) / oneDayInMilliseconds) + 1) / 7);
 
    const dayEl = document.getElementById("day-of-year");
    const weekEl = document.getElementById("week-of-year");
 
    if (dayEl) dayEl.innerText = dayOfYear;
    if (weekEl) weekEl.innerText = weekOfYear;
}
 
window.addEventListener('DOMContentLoaded', () => {
    setGreeting();
    updateFooterCalendar();
});
 
// ============================================================
// WORKOUT ENGINE — one entry point for every category, in either mode
// ============================================================
function formatDuration(totalSeconds) {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return mins > 0 ? `${mins}m ${secs < 10 ? '0' + secs : secs}s` : `${secs}s`;
}
 
function resetTimerState() {
    clearInterval(workoutTimer);
    currentStep = 0;
    elapsed = 0;
    isPaused = true;
 
    const playBtn = document.getElementById("play-pause-btn");
    if (playBtn) playBtn.innerHTML = "&#9658;";
 
    const progressBar = document.getElementById("progress");
    if (progressBar) progressBar.style.width = "0%";
}
 
// The single entry point every category button calls.
function filterWorkouts(category, btn) {
    const key = category.toLowerCase();
    const workout = WORKOUTS[key];
    if (!workout) return;
 
    currentCategory = key;
    window.scrollTo(0, 0);
 
    document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
    if (btn) btn.classList.add("active");
 
    const overlay = document.getElementById("workout-overlay");
    overlay.classList.add("active");
    overlay.style.display = "flex";
 
    document.getElementById("overlay-title").innerText = workout.title;
    renderCurrentMode();
}
 
// Combines a workout's built-in steps with any custom exercises the
// signed-in user has added for this category, so both List and Timed
// mode automatically include them — same single-source-of-truth pattern
// as everything else.
function getMergedSteps(workout) {
    const custom = (window.customExercisesByCategory && window.customExercisesByCategory[currentCategory]) || [];
    const customSteps = custom.map(c => ({
        cat: "MY EXERCISES",
        name: c.name,
        duration: c.duration || 40,
        tip: c.tip,
        id: c.id,
        custom: true
    }));
    return [...workout.steps, ...customSteps];
}
 
// Re-renders the currently open workout using whichever mode the
// List/Timed toggle is set to. Called on open and whenever the toggle
// changes, and again whenever sign-in state or custom exercises change.
function renderCurrentMode() {
    const workout = WORKOUTS[currentCategory];
    if (!workout) return;
 
    const isTimed = document.getElementById("mode-toggle").checked;
    const timerCont = document.querySelector(".timer-container");
    const controls = document.querySelector(".workout-controls");
    const merged = getMergedSteps(workout);
 
    if (isTimed) {
        timerCont.style.display = "flex";
        controls.style.display = "flex";
        steps = merged;
        resetTimerState();
        renderTimedSteps();
    } else {
        timerCont.style.display = "none";
        controls.style.display = "none";
        clearInterval(workoutTimer);
        renderListSteps(workout, merged);
    }
}
 
function refreshWorkoutView() {
    if (currentCategory) renderCurrentMode();
}
 
function renderListSteps(workout, mergedSteps) {
    const content = document.getElementById("overlay-content");
    const signedIn = window.isSignedIn && window.isSignedIn();
 
    let html = `<div class="set-counter">${workout.subtitle || ""}</div>`;
    html += `<div class="add-exercise-row">
                <button class="link-btn small" onclick="openAddExerciseForm('${currentCategory}')">+ Add My Exercise</button>
             </div>`;
    html += `<div class="workout-list">`;
    let lastCat = "";
 
    mergedSteps.forEach(step => {
        if (step.name === "Rest") return; // checklist mode doesn't need rest timing
 
        if (step.cat !== lastCat) {
            html += `<h3 class="workout-section-title">${step.cat}</h3>`;
            lastCat = step.cat;
        }
 
        const tipHtml = step.tip ? `<div class="tech-note"><strong>Tip:</strong> ${step.tip}</div>` : "";
        const deleteHtml = step.custom
            ? `<button class="delete-btn" onclick="deleteCustomExercise('${step.id}')" title="Remove">&times;</button>`
            : "";
        const slug = slugify(step.name);
        const logHtml = signedIn ? `
            <div class="log-row">
                <input type="number" min="0" placeholder="Sets" class="log-input" id="sets-${slug}">
                <input type="number" min="0" placeholder="Reps" class="log-input" id="reps-${slug}">
                <input type="number" min="0" placeholder="Wt" class="log-input" id="weight-${slug}">
                <button class="log-btn" onclick="saveLog('${escapeForAttr(step.name)}')">Log</button>
            </div>` : "";
 
        html += `<div class="exercise-item list">
                    <div class="exercise-info-wrapper">
                        <span class="step-name">${step.name}${deleteHtml}</span>
                        ${tipHtml}
                        ${logHtml}
                    </div>
                    <span class="step-time">${formatDuration(step.duration)}</span>
                 </div>`;
    });
 
    html += `</div>`;
    html += nextWorkoutButton(workout);
    content.innerHTML = html;
}
 
function slugify(name) {
    return name.replace(/[^a-z0-9]/gi, "").toLowerCase();
}
 
function escapeForAttr(str) {
    return str.replace(/'/g, "\\'");
}
 
// ============================================================
// CUSTOM EXERCISES & SET/REP LOGGING (UI side — Firebase calls live in auth.js)
// ============================================================
function openAddExerciseForm(category) {
    if (!window.isSignedIn || !window.isSignedIn()) {
        alert("Sign in with Google first, then you can add your own exercises here.");
        return;
    }
    const name = prompt("Exercise name:");
    if (!name) return;
    const duration = prompt("Duration in seconds (used for Timed mode, e.g. 45):", "45");
    const tip = prompt("Optional form tip (leave blank if none):", "") || "";
    window.addCustomExercise(category, name, duration, tip);
}
 
function saveLog(exerciseName) {
    const slug = slugify(exerciseName);
    const sets = document.getElementById(`sets-${slug}`).value;
    const reps = document.getElementById(`reps-${slug}`).value;
    const weight = document.getElementById(`weight-${slug}`).value;
 
    if (!sets && !reps) {
        alert("Enter at least sets or reps before logging.");
        return;
    }
 
    window.logSetEntry(currentCategory, exerciseName, sets, reps, weight);
 
    const btn = event && event.target;
    if (btn) {
        const original = btn.innerText;
        btn.innerText = "Saved!";
        setTimeout(() => { btn.innerText = original; }, 1200);
    }
}
 
// ============================================================
// LOGIN / SIGN UP FORM
// ============================================================
let authMode = "signin"; // "signin" | "signup"
 
function openAuthForm() {
    authMode = "signin";
    updateAuthFormLabels();
    document.getElementById("auth-email").value = "";
    document.getElementById("auth-password").value = "";
    document.getElementById("auth-error").innerText = "";
    document.getElementById("auth-overlay").classList.add("active");
}
 
function closeAuthForm() {
    document.getElementById("auth-overlay").classList.remove("active");
}
 
function toggleAuthMode() {
    authMode = authMode === "signin" ? "signup" : "signin";
    updateAuthFormLabels();
}
 
function updateAuthFormLabels() {
    const isSignUp = authMode === "signup";
    document.getElementById("auth-title").innerText = isSignUp ? "Create Account" : "Sign In";
    document.getElementById("auth-submit").innerText = isSignUp ? "Sign Up" : "Sign In";
    document.getElementById("auth-toggle-mode").innerText = isSignUp
        ? "Already have an account? Sign In"
        : "Need an account? Sign Up";
    document.getElementById("auth-error").innerText = "";
}
 
async function submitAuthForm() {
    const email = document.getElementById("auth-email").value.trim();
    const password = document.getElementById("auth-password").value;
    const errorEl = document.getElementById("auth-error");
    errorEl.innerText = "";
 
    if (!email || !password) {
        errorEl.innerText = "Enter both an email and a password.";
        return;
    }
 
    const submitBtn = document.getElementById("auth-submit");
    submitBtn.disabled = true;
    submitBtn.innerText = "Please wait…";
 
    const result = authMode === "signup"
        ? await window.signUpWithEmail(email, password)
        : await window.signInWithEmail(email, password);
 
    submitBtn.disabled = false;
    updateAuthFormLabels();
 
    if (result.ok) {
        closeAuthForm();
    } else {
        errorEl.innerText = result.message;
    }
}
 
async function handleForgotPassword() {
    const email = document.getElementById("auth-email").value.trim();
    const errorEl = document.getElementById("auth-error");
    if (!email) {
        errorEl.innerText = "Enter your email above first, then click \"Forgot password?\".";
        return;
    }
    const result = await window.resetPassword(email);
    errorEl.innerText = result.ok
        ? "Password reset email sent — check your inbox."
        : result.message;
}
 
 
function toggleProfileMenu() {
    document.getElementById("profile-btn").classList.toggle("open");
}
 
async function openHistory() {
    if (!window.isSignedIn || !window.isSignedIn()) {
        alert("Sign in to see your logged sets & reps.");
        return;
    }
    document.getElementById("profile-btn").classList.remove("open");
 
    currentCategory = "";
    document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
 
    const overlay = document.getElementById("workout-overlay");
    overlay.classList.add("active");
    overlay.style.display = "flex";
    document.querySelector(".timer-container").style.display = "none";
    document.querySelector(".workout-controls").style.display = "none";
    document.getElementById("overlay-title").innerText = "My Log History";
    document.getElementById("overlay-content").innerHTML = `<p style="padding:40px 0; color:#888;">Loading…</p>`;
 
    const logs = await window.getRecentLogs();
    let html = `<div class="workout-list">`;
    if (!logs.length) {
        html += `<p style="padding:20px 0; color:#888;">No logs yet — hit "Log" next to an exercise in List mode to start tracking.</p>`;
    } else {
        logs.forEach(l => {
            html += `<div class="exercise-item list">
                        <div class="exercise-info-wrapper">
                            <span class="step-name">${l.exerciseName}</span>
                            <div class="tech-note">${l.date} · ${l.category}</div>
                        </div>
                        <span class="step-time">${l.sets || 0} × ${l.reps || 0}${l.weight ? ' @ ' + l.weight : ''}</span>
                     </div>`;
        });
    }
    html += `</div>`;
    document.getElementById("overlay-content").innerHTML = html;
}
 
function renderTimedSteps() {
    const content = document.getElementById("overlay-content");
    const workout = WORKOUTS[currentCategory];
    let html = `<div class="set-counter">${workout.subtitle || ""}</div><div class="workout-list">`;
    let lastCat = "";
 
    steps.forEach((step, index) => {
        if (step.name === "Rest" && index < currentStep) return;
 
        if (step.cat !== lastCat) {
            html += `<h3 class="workout-section-title">${step.cat}</h3>`;
            lastCat = step.cat;
        }
 
        let status = index === currentStep ? "active" : (index < currentStep ? "completed" : "");
        if (step.name === "Rest") status += " rest";
 
        const techNote = (step.tip && index === currentStep)
            ? `<div class="tech-note"><strong>Tip:</strong> ${step.tip}</div>`
            : "";
 
        html += `<div class="exercise-item ${status}">
                    <div class="exercise-info-wrapper">
                        <span class="step-name">${step.name}</span>
                        ${techNote}
                    </div>
                    <span class="step-time">${formatDuration(step.duration)}</span>
                 </div>`;
    });
 
    html += `</div>`;
    content.innerHTML = html;
 
    const tipElement = document.getElementById("active-tip");
    if (tipElement && steps[currentStep]) {
        if (steps[currentStep].name === "Rest") {
            tipElement.innerText = steps[currentStep].tip || "Recover & prep for next move";
        } else {
            tipElement.innerText = steps[currentStep].tip || "Keep your form tight!";
        }
    }
}
 
function nextWorkoutButton(workout) {
    if (!workout.next || !WORKOUTS[workout.next]) return "";
    return `<div class="workout-link-container">
                <button class="link-btn" onclick="filterWorkouts('${workout.next}')">
                    Next: ${WORKOUTS[workout.next].title} <span>&#8594;</span>
                </button>
            </div>`;
}
 
function closeWorkout() {
    const overlay = document.getElementById("workout-overlay");
    overlay.classList.remove("active");
    overlay.style.display = "none";
 
    const profileChip = document.getElementById("profile-btn");
    if (profileChip) profileChip.classList.remove("open");
 
    resetTimerState();
    document.querySelector(".timer-container").style.display = "none";
    document.querySelector(".workout-controls").style.display = "none";
    document.getElementById("overlay-content").innerHTML = "";
    document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
 
    currentCategory = "";
    // Note: the List/Timed toggle is left as-is on purpose, so your
    // preferred mode carries over to the next workout you open.
}
 
// ============================================================
// TIMER CONTROLS
// ============================================================
function togglePlayPause() {
    const btn = document.getElementById("play-pause-btn");
    if (isPaused) {
        isPaused = false;
        btn.innerHTML = "&#10074;&#10074;";
        startTicker();
    } else {
        isPaused = true;
        btn.innerHTML = "&#9658;";
        clearInterval(workoutTimer);
    }
}
 
function startTicker() {
    clearInterval(workoutTimer);
    workoutTimer = setInterval(() => {
        elapsed++;
 
        const totalTime = steps.reduce((acc, s) => acc + s.duration, 0);
        const progressBar = document.getElementById("progress");
        if (progressBar) progressBar.style.width = (elapsed / totalTime) * 100 + "%";
 
        const countdownEl = document.getElementById("timer-countdown");
        if (countdownEl) {
            const timeAtEndOfCurrentStep = steps.slice(0, currentStep + 1).reduce((acc, s) => acc + s.duration, 0);
            const secondsLeftInStep = timeAtEndOfCurrentStep - elapsed;
            const m = Math.floor(secondsLeftInStep / 60);
            const s = secondsLeftInStep % 60;
            countdownEl.innerText = `${m}:${s < 10 ? '0' + s : s}`;
        }
 
        const timePassedForSteps = steps.slice(0, currentStep + 1).reduce((acc, s) => acc + s.duration, 0);
        if (elapsed >= timePassedForSteps) goToNextStep();
    }, 1000);
}
 
function skipStep() {
    elapsed = steps.slice(0, currentStep + 1).reduce((acc, s) => acc + s.duration, 0);
    goToNextStep();
}
 
function goToNextStep() {
    currentStep++;
    if (currentStep >= steps.length) {
        clearInterval(workoutTimer);
        const workout = WORKOUTS[currentCategory];
        document.getElementById("overlay-content").innerHTML = `
            <div style="text-align:center; padding: 50px;">
                <h2>Workout Complete!</h2>
                <div class="workout-link-container" style="border-top:none; padding-top:0;">
                    <button class="filter-btn" onclick="closeWorkout()">Finish</button>
                    ${workout && workout.next ? `<button class="link-btn" onclick="filterWorkouts('${workout.next}')">Next: ${WORKOUTS[workout.next].title} <span>&#8594;</span></button>` : ""}
                </div>
            </div>`;
    } else {
        renderTimedSteps();
    }
}
 