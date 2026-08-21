// ============================================================
// STATE
// ============================================================
let currentCategory = "";  // key into WORKOUTS, "" if a custom workout is open instead
let currentCustomWorkoutId = null; // id of the open custom workout, null if a built-in category is open
let workoutTimer;
let isPaused = true;
let currentStep = 0;
let elapsed = 0;
let steps = [];             // the active category's steps, used by the timer engine

let builderState = null;    // the workout currently being created/edited in the builder
let dragFromIndex = null;   // index of the builder row currently being dragged
let activeTagFilter = "all"; // which tag is currently filtering the My Workouts grid

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

    core: {
        title: "Core",
        subtitle: "Combined rotation & control — bodyweight",
        steps: [
            { cat: "WARM UP", name: "Dynamic Plank → Downward Dog", duration: 60, tip: "Keep it smooth" },
            { cat: "WARM UP", name: "Cat-Cow", duration: 60 },
            { cat: "WARM UP", name: "Torso Twists", duration: 60 },
            { cat: "WARM UP", name: "Standing Side Bends", duration: 60 },
            { cat: "MAIN WORK", name: "Twisting Planks → Side Plank", duration: 150, tip: "Slow transitions, 2 second hold in side plank, focus on rib-to-pelvis control." },
            { cat: "MAIN WORK", name: "Rest", duration: 15 },
            { cat: "MAIN WORK", name: "Russian Twists", duration: 150, tip: "Lean back until core engages; keep chest proud. Exhale with each twist." },
            { cat: "MAIN WORK", name: "Rest", duration: 15 },
            { cat: "MAIN WORK", name: "Bicycle Crunches", duration: 120, tip: "Slow elbow-to-knee, pause briefly at contact" },
            { cat: "MAIN WORK", name: "Rest", duration: 15 },
            { cat: "MAIN WORK", name: "Twisting Bear Crawl", duration: 120, tip: "Knees low, spine quiet, hips steady, ribs rotate" },
            { cat: "MAIN WORK", name: "Rest", duration: 15 },
            { cat: "MAIN WORK", name: "Twisting V-Ups", duration: 120, tip: "Alternate sides each rep, control the lowering phase" },
            { cat: "MAIN WORK", name: "Rest", duration: 15 },
            { cat: "MAIN WORK", name: "Side Plank with Hip Dips (L)", duration: 75, tip: "Small range, constant tension." },
            { cat: "MAIN WORK", name: "Rest", duration: 5 },
            { cat: "MAIN WORK", name: "Side Plank with Hip Dips (R)", duration: 75, tip: "Small range, constant tension." },
            { cat: "MAIN WORK", name: "Rest", duration: 15 },
            { cat: "MAIN WORK", name: "Plank Shoulder Taps + Knee Twists", duration: 120, tip: "Reduce speed if hips sway" },
            { cat: "MAIN WORK", name: "Rest", duration: 15 },
            { cat: "MAIN WORK", name: "Twisting Hollow Body Hold", duration: 40, tip: "Small, deliberate rotations only" },
            { cat: "MAIN WORK", name: "Rest", duration: 20 },
            { cat: "COOL DOWN", name: "Supine Twists", duration: 90 },
            { cat: "COOL DOWN", name: "Child's Pose with side stretch", duration: 60 }
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

// List mode shows reps instead of time where an exercise naturally has a
// rep count (e.g. "x 10", "x5-8", "x3-4/side") — most exercise names
// already carry that in the text, so we pull it out automatically rather
// than re-typing it for every exercise. Anything without a rep count
// (planks, holds, cardio bursts, stretches) has no natural "reps" value,
// so List mode falls back to showing its duration for those instead.
const REPS_PATTERN = /x\s?\d+(?:\s?[-–]\s?\d+)?(?:\s?\/\s?\w+)?/i;

function extractReps(name) {
    const match = name.match(REPS_PATTERN);
    return match ? match[0].replace(/\s+/g, "") : null;
}

Object.values(WORKOUTS).forEach(workout => {
    workout.steps.forEach(step => {
        if (step.name === "Rest" || step.reps) return;
        const found = extractReps(step.name);
        if (found) step.reps = found;
    });
});

// ============================================================
// PASTE-LIST PARSER
// Turns a block of pasted text — one exercise per line, in whatever
// format someone already had it written — into individual exercise
// objects the builder can work with. Recognises an explicit rep count
// ("x10", "x5-8", "x3/side") or a time ("45s", "1m 30s", "2 min") if
// either is present in the line; otherwise defaults to a 40s timed
// entry that's still fully editable afterward.
// ============================================================
const TIME_PATTERN = /(\d+)\s*m(?:in(?:ute)?s?)?\s*(\d+)?\s*s?(?:ec(?:ond)?s?)?\b|(\d+)\s*s(?:ec(?:ond)?s?)?\b/i;
const LIST_MARKER_PATTERN = /^\s*(?:\d+[.)]|[-*•])\s*/;

function parseExerciseLines(text) {
    return text.split("\n")
        .map(line => line.trim())
        .filter(Boolean)
        .map(parseSingleExerciseLine);
}

function parseSingleExerciseLine(line) {
    const clean = line.replace(LIST_MARKER_PATTERN, "").trim();

    const repsMatch = clean.match(REPS_PATTERN);
    if (repsMatch) {
        const reps = repsMatch[0].replace(/\s+/g, "");
        const name = clean.replace(repsMatch[0], "").replace(/[-–,]\s*$/, "").trim();
        return { id: generateStepId(), cat: "EXERCISES", name: name || clean, mode: "reps", reps, duration: 40, tip: "", restOverride: null };
    }

    const timeMatch = clean.match(TIME_PATTERN);
    if (timeMatch) {
        const seconds = timeMatch[1]
            ? parseInt(timeMatch[1], 10) * 60 + (timeMatch[2] ? parseInt(timeMatch[2], 10) : 0)
            : parseInt(timeMatch[3], 10);
        const name = clean.replace(timeMatch[0], "").replace(/[-–,]\s*$/, "").trim();
        return { id: generateStepId(), cat: "EXERCISES", name: name || clean, mode: "time", reps: "", duration: seconds, tip: "", restOverride: null };
    }

    // No recognisable count in the line — default to a 40s timed entry;
    // easy to switch to Reps and fix up afterward if that's wrong.
    return { id: generateStepId(), cat: "EXERCISES", name: clean, mode: "time", reps: "", duration: 40, tip: "", restOverride: null };
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
    if (!WORKOUTS[key]) return;

    currentCategory = key;
    currentCustomWorkoutId = null;
    openWorkoutCommon(btn);
}

// Entry point for opening a user-created workout from the My Workouts grid.
function openCustomWorkout(id, btn) {
    const exists = (window.customWorkouts || []).some(w => w.id === id);
    if (!exists) return;

    currentCategory = "";
    currentCustomWorkoutId = id;
    openWorkoutCommon(btn);
}

function openWorkoutCommon(btn) {
    window.scrollTo(0, 0);

    document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
    if (btn) btn.classList.add("active");

    const overlay = document.getElementById("workout-overlay");
    overlay.classList.add("active");
    overlay.style.display = "flex";

    const workout = getActiveWorkout();
    document.getElementById("overlay-title").innerText = workout ? workout.title : "Workout";
    renderCurrentMode();
}

// Returns the workout currently open, whether it's one of the built-in
// WORKOUTS entries or a workout the signed-in user created themselves.
// Everything downstream (rendering, the timer engine, etc.) only ever
// talks to this shape, so it doesn't need to know which kind it's dealing with.
function getActiveWorkout() {
    if (currentCustomWorkoutId) {
        const w = (window.customWorkouts || []).find(cw => cw.id === currentCustomWorkoutId);
        if (!w) return null;
        return {
            title: w.title,
            subtitle: w.subtitle || "",
            steps: w.steps || [],
            tags: w.tags || [],
            defaultRest: w.defaultRest != null ? w.defaultRest : 15,
            isCustom: true,
            id: w.id
        };
    }
    return WORKOUTS[currentCategory] || null;
}

// Combines a workout's steps with any extras the signed-in user has added:
// for a built-in category, that's their saved "+ Add My Exercise" entries;
// a custom workout's own steps already ARE the user's content, so nothing
// further to merge in.
function getMergedSteps(workout) {
    if (workout.isCustom) return workout.steps;

    const custom = (window.customExercisesByCategory && window.customExercisesByCategory[currentCategory]) || [];
    const customSteps = custom.map(c => ({
        cat: "MY EXERCISES",
        name: c.name,
        duration: c.duration || 40,
        tip: c.tip,
        reps: c.reps || "",
        id: c.id,
        custom: true
    }));
    return [...workout.steps, ...customSteps];
}

// Custom workouts don't store explicit "Rest" entries — the workout's
// defaultRest (set once in the builder) is inserted automatically between
// every pair of exercises when Timed mode actually needs the countdown.
// A per-exercise restOverride (also set in the builder) takes priority
// over the default when present, including an override of 0 for "no rest
// after this one." Built-in categories already have their rests baked
// into WORKOUTS, so they pass through unchanged.
function expandWithDefaultRest(workout, mergedSteps) {
    if (!workout.isCustom) return mergedSteps;

    const defaultRest = workout.defaultRest != null ? workout.defaultRest : 15;
    const expanded = [];

    mergedSteps.forEach((step, i) => {
        expanded.push(step);
        const isLast = i === mergedSteps.length - 1;
        if (isLast) return;

        const hasOverride = step.restOverride !== null && step.restOverride !== undefined && step.restOverride !== "";
        const restDuration = hasOverride ? Number(step.restOverride) : defaultRest;
        if (restDuration > 0) {
            expanded.push({ cat: step.cat, name: "Rest", duration: restDuration });
        }
    });

    return expanded;
}

// Re-renders the currently open workout using whichever mode the
// List/Timed toggle is set to. Called on open and whenever the toggle
// changes, and again whenever sign-in state or custom content changes.
function renderCurrentMode() {
    const workout = getActiveWorkout();
    if (!workout) return;

    const isTimed = document.getElementById("mode-toggle").checked;
    const timerCont = document.querySelector(".timer-container");
    const controls = document.querySelector(".workout-controls");
    const merged = getMergedSteps(workout);

    if (isTimed) {
        timerCont.style.display = "flex";
        controls.style.display = "flex";
        steps = expandWithDefaultRest(workout, merged);
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
    if (currentCategory || currentCustomWorkoutId) renderCurrentMode();
}

function renderListSteps(workout, mergedSteps) {
    const content = document.getElementById("overlay-content");
    const signedIn = window.isSignedIn && window.isSignedIn();
    const isCustomWorkout = !!workout.isCustom;

    let html = `<div class="set-counter">${workout.subtitle || ""}</div>`;

    if (isCustomWorkout) {
        html += `<div class="add-exercise-row">
                    <button class="link-btn small" onclick="openEditWorkoutBuilder('${workout.id}')">&#9998; Edit Workout</button>
                 </div>`;
        if (mergedSteps.length === 0) {
            html += `<p style="color:#888; font-size:0.8rem; padding: 10px 0 20px;">No exercises yet — tap "Edit Workout" to build it.</p>`;
        }
    } else {
        html += `<div class="add-exercise-row">
                    <button class="link-btn small" onclick="openAddExerciseForm('${currentCategory}')">+ Add My Exercise</button>
                 </div>`;
    }

    html += `<div class="workout-list">`;
    let lastCat = "";

    mergedSteps.forEach(step => {
        if (step.name === "Rest") return; // checklist mode doesn't need rest timing

        if (step.cat !== lastCat) {
            html += `<h3 class="workout-section-title">${step.cat}</h3>`;
            lastCat = step.cat;
        }

        const tipHtml = step.tip ? `<div class="tech-note"><strong>Tip:</strong> ${step.tip}</div>` : "";
        const deleteHtml = (!isCustomWorkout && step.custom)
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
                    <span class="step-time">${step.reps || formatDuration(step.duration)}</span>
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

function generateStepId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// ============================================================
// CUSTOM EXERCISES & SET/REP LOGGING (UI side — Firebase calls live in auth.js)
// ============================================================
function openAddExerciseForm(category) {
    if (!window.isSignedIn || !window.isSignedIn()) {
        alert("Sign in first, then you can add your own exercises here.");
        return;
    }
    const name = prompt("Exercise name:");
    if (!name) return;
    const duration = prompt("Duration in seconds (used for Timed mode, e.g. 45):", "45");
    const reps = prompt("Reps to show in List mode (e.g. \"x10\") — leave blank to show the time instead:", "") || "";
    const tip = prompt("Optional form tip (leave blank if none):", "") || "";
    window.addCustomExercise(category, name, duration, tip, reps);
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

// ============================================================
// MY WORKOUTS — the full built-in library plus anything the
// signed-in user has created themselves.
// ============================================================
const FULL_WORKOUT_LIST = [
    "morning", "upper body", "lower body",
    "core rotation", "core control",
    "mobility side", "strength side", "evening"
];

// Called from auth.js whenever sign-in state or custom workouts change.
function renderMyWorkoutsSection() {
    const section = document.getElementById("my-workouts-section");
    const promptEl = document.getElementById("signin-prompt");
    if (!section) return;

    const signedIn = window.isSignedIn && window.isSignedIn();

    if (!signedIn) {
        section.style.display = "none";
        if (promptEl) promptEl.style.display = "block";
        return;
    }
    if (promptEl) promptEl.style.display = "none";
    section.style.display = "flex";

    // A null visibleWorkouts setting means "show everything" (the default,
    // before anyone has used Manage to hide something).
    const settings = window.userSettings || {};
    const visibleSet = Array.isArray(settings.visibleWorkouts) ? new Set(settings.visibleWorkouts) : null;

    const allCustom = window.customWorkouts || [];
    const visibleBuiltins = FULL_WORKOUT_LIST.filter(key => !visibleSet || visibleSet.has(key));
    const visibleCustom = allCustom.filter(w => !visibleSet || visibleSet.has(w.id));

    renderTagFilterBar(visibleCustom);

    const showBuiltins = activeTagFilter === "all";
    const filteredCustom = activeTagFilter === "all"
        ? visibleCustom
        : visibleCustom.filter(w => (w.tags || []).includes(activeTagFilter));

    const grid = document.getElementById("my-workouts-grid");
    let html = "";

    if (showBuiltins) {
        visibleBuiltins.forEach(key => {
            html += `<button class="filter-btn my-workout-btn" onclick="filterWorkouts('${key}', this)">
                        <span>${WORKOUTS[key].title}</span>
                     </button>`;
        });
    }

    filteredCustom.forEach(w => {
        html += `<button class="filter-btn my-workout-btn custom" onclick="openCustomWorkout('${w.id}', this)">
                    <span>${w.title}</span>
                    <span class="workout-btn-icons">
                        <span class="edit-workout-btn" onclick="event.stopPropagation(); openEditWorkoutBuilder('${w.id}')" title="Edit">&#9998;</span>
                        <span class="delete-workout-btn" onclick="event.stopPropagation(); deleteWorkout('${w.id}')" title="Delete">&times;</span>
                    </span>
                 </button>`;
    });

    html += `<button class="filter-btn my-workout-btn create-btn" onclick="openCreateWorkoutBuilder()">
                <span>+ Create Workout</span>
             </button>`;

    grid.innerHTML = html;
}

function renderTagFilterBar(visibleCustomWorkouts) {
    const bar = document.getElementById("workout-tag-filter");
    if (!bar) return;

    const allTags = [...new Set(visibleCustomWorkouts.flatMap(w => w.tags || []))];
    if (allTags.length === 0) {
        bar.style.display = "none";
        bar.innerHTML = "";
        return;
    }

    bar.style.display = "flex";
    let html = `<button class="tag-filter-chip ${activeTagFilter === "all" ? "active" : ""}" onclick="setTagFilter('all')">All</button>`;
    allTags.forEach(tag => {
        html += `<button class="tag-filter-chip ${activeTagFilter === tag ? "active" : ""}" onclick="setTagFilter('${escapeForAttr(tag)}')">${tag}</button>`;
    });
    bar.innerHTML = html;
}

function setTagFilter(tag) {
    activeTagFilter = tag;
    renderMyWorkoutsSection();
}

async function deleteWorkout(workoutId) {
    if (!confirm("Delete this workout? This can't be undone.")) return;
    await window.deleteCustomWorkout(workoutId);
    renderMyWorkoutsSection();
    if (currentCustomWorkoutId === workoutId) closeWorkout();
}

// ============================================================
// MANAGE MY WORKOUTS — choose which built-in and custom workouts
// appear on the My Workouts screen.
// ============================================================
function openManageWorkouts() {
    if (!window.isSignedIn || !window.isSignedIn()) {
        alert("Sign in first.");
        return;
    }
    const settings = window.userSettings || {};
    const visibleSet = Array.isArray(settings.visibleWorkouts) ? new Set(settings.visibleWorkouts) : null;

    let html = `<p style="color:#888; font-size:0.8rem; margin-bottom:15px;">Choose which workouts show up on your My Workouts screen.</p>`;
    html += `<div class="manage-list">`;
    FULL_WORKOUT_LIST.forEach(key => {
        html += manageRow(key, WORKOUTS[key].title, !visibleSet || visibleSet.has(key));
    });
    (window.customWorkouts || []).forEach(w => {
        html += manageRow(w.id, w.title, !visibleSet || visibleSet.has(w.id));
    });
    html += `</div>`;
    html += `<div class="builder-actions"><button class="auth-submit" onclick="saveManageWorkouts()">Save</button></div>`;

    document.getElementById("manage-content").innerHTML = html;
    const overlay = document.getElementById("manage-overlay");
    overlay.classList.add("active");
    overlay.style.display = "flex";
}

function manageRow(key, title, checked) {
    return `<label class="manage-row">
                <input type="checkbox" data-key="${escapeForAttr(key)}" ${checked ? "checked" : ""}>
                <span>${title}</span>
            </label>`;
}

function closeManageWorkouts() {
    document.getElementById("manage-overlay").classList.remove("active");
    document.getElementById("manage-overlay").style.display = "none";
}

async function saveManageWorkouts() {
    const checkboxes = document.querySelectorAll("#manage-content input[type=checkbox]");
    const visible = [];
    checkboxes.forEach(cb => { if (cb.checked) visible.push(cb.getAttribute("data-key")); });
    await window.saveVisibleWorkouts(visible);
    closeManageWorkouts();
    renderMyWorkoutsSection();
}

// ============================================================
// WORKOUT BUILDER — create or edit a custom workout: paste a list,
// add/edit exercises inline, reorder them, tag the workout, and set
// a default rest period. Everything is edited in memory and written
// to Firestore in one go when Save is clicked.
// ============================================================
function openCreateWorkoutBuilder() {
    if (!window.isSignedIn || !window.isSignedIn()) {
        alert("Sign in first to create your own workout.");
        return;
    }
    builderState = { id: null, title: "", subtitle: "Your custom workout", tags: [], defaultRest: 15, steps: [] };
    openBuilderOverlay("Create Workout");
}

function openEditWorkoutBuilder(workoutId) {
    const w = (window.customWorkouts || []).find(cw => cw.id === workoutId);
    if (!w) return;

    closeWorkout(); // in case it was open in the run-view underneath

    builderState = {
        id: w.id,
        title: w.title,
        subtitle: w.subtitle || "Your custom workout",
        tags: [...(w.tags || [])],
        defaultRest: w.defaultRest != null ? w.defaultRest : 15,
        steps: (w.steps || []).map(s => ({ ...s, mode: s.mode || (s.reps ? "reps" : "time") }))
    };
    openBuilderOverlay("Edit Workout");
}

function openBuilderOverlay(title) {
    document.getElementById("builder-title").innerText = title;
    const overlay = document.getElementById("builder-overlay");
    overlay.classList.add("active");
    overlay.style.display = "flex";
    renderBuilder();
}

function closeBuilder() {
    document.getElementById("builder-overlay").classList.remove("active");
    document.getElementById("builder-overlay").style.display = "none";
    builderState = null;
}

function renderBuilder() {
    const content = document.getElementById("builder-content");
    const s = builderState;

    const tagsHtml = s.tags.map(t =>
        `<span class="tag-chip">${t} <button onclick="removeTagFromBuilder('${escapeForAttr(t)}')">&times;</button></span>`
    ).join("");

    const stepsHtml = s.steps.map((step, i) => `
        <div class="builder-row" draggable="true"
             ondragstart="handleDragStart(event, ${i})"
             ondragover="handleDragOver(event, ${i})"
             ondrop="handleDrop(event, ${i})">
            <span class="drag-handle" title="Drag to reorder">&#9776;</span>
            <div class="builder-row-fields">
                <input type="text" class="builder-input name-input" value="${escapeAttrValue(step.name)}"
                       placeholder="Exercise name" oninput="updateStepField('${step.id}', 'name', this.value)">
                <select class="builder-select" onchange="updateStepField('${step.id}', 'mode', this.value)">
                    <option value="reps" ${step.mode === "reps" ? "selected" : ""}>Reps</option>
                    <option value="time" ${step.mode === "time" ? "selected" : ""}>Time</option>
                </select>
                ${step.mode === "reps"
                    ? `<input type="text" class="builder-input value-input" placeholder="e.g. x10" value="${escapeAttrValue(step.reps)}" oninput="updateStepField('${step.id}', 'reps', this.value)">`
                    : `<input type="number" min="0" class="builder-input value-input" placeholder="Seconds" value="${step.duration}" oninput="updateStepField('${step.id}', 'duration', this.value)">`
                }
                <input type="number" min="0" class="builder-input rest-input" placeholder="Rest override (s)" value="${step.restOverride ?? ""}" oninput="updateStepField('${step.id}', 'restOverride', this.value)">
            </div>
            <div class="builder-row-actions">
                <button class="reorder-btn" onclick="moveStep(${i}, -1)" title="Move up">&#9650;</button>
                <button class="reorder-btn" onclick="moveStep(${i}, 1)" title="Move down">&#9660;</button>
                <button class="delete-btn" onclick="deleteStepFromBuilder('${step.id}')" title="Remove">&times;</button>
            </div>
        </div>
    `).join("");

    content.innerHTML = `
        <input type="text" class="builder-input builder-title-input" placeholder="Workout name"
               value="${escapeAttrValue(s.title)}" oninput="builderState.title = this.value">

        <div class="builder-section">
            <label class="builder-label">Tags</label>
            <div class="tag-chip-row">${tagsHtml}</div>
            <div class="tag-add-row">
                <input type="text" id="builder-tag-input" class="builder-input" placeholder="e.g. Upper Body, 30 min">
                <button class="link-btn small" onclick="addTagToBuilder()">+ Add Tag</button>
            </div>
        </div>

        <div class="builder-section">
            <label class="builder-label">Default rest between exercises (seconds)</label>
            <input type="number" min="0" class="builder-input" style="max-width:100px;"
                   value="${s.defaultRest}" oninput="builderState.defaultRest = Number(this.value) || 0">
        </div>

        <div class="builder-section">
            <label class="builder-label">Paste a workout list</label>
            <textarea id="builder-paste-area" class="builder-textarea" rows="4"
                      placeholder="Paste exercises, one per line — e.g.&#10;Push ups x10&#10;Plank 45s&#10;Squats x12"></textarea>
            <button class="link-btn small" onclick="parseAndAddPastedExercises()">Parse &amp; Add</button>
        </div>

        <div class="builder-section">
            <label class="builder-label">Exercises</label>
            <div id="builder-steps-list">${stepsHtml || '<p style="color:#888; font-size:0.8rem;">No exercises yet — paste a list above or add one manually.</p>'}</div>
            <button class="link-btn small" onclick="addBlankExerciseRow()">+ Add Exercise</button>
        </div>

        <div class="builder-actions">
            <button class="auth-submit" onclick="saveBuilder()">Save Workout</button>
        </div>
    `;
}

function escapeAttrValue(str) {
    return String(str || "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

function updateStepField(stepId, field, value) {
    const step = builderState.steps.find(s => s.id === stepId);
    if (!step) return;

    if (field === "duration") step.duration = Number(value) || 0;
    else if (field === "restOverride") step.restOverride = value === "" ? null : Number(value);
    else step[field] = value;

    if (field === "mode") renderBuilder(); // the value input needs to switch between reps/time
}

function addBlankExerciseRow() {
    builderState.steps.push({ id: generateStepId(), cat: "EXERCISES", name: "", mode: "reps", reps: "", duration: 40, tip: "", restOverride: null });
    renderBuilder();
}

function deleteStepFromBuilder(stepId) {
    builderState.steps = builderState.steps.filter(s => s.id !== stepId);
    renderBuilder();
}

function parseAndAddPastedExercises() {
    const textarea = document.getElementById("builder-paste-area");
    const text = textarea.value.trim();
    if (!text) return;

    const parsed = parseExerciseLines(text);
    builderState.steps = [...builderState.steps, ...parsed];
    renderBuilder();
}

function addTagToBuilder() {
    const input = document.getElementById("builder-tag-input");
    const tag = input.value.trim();
    if (!tag) return;
    if (!builderState.tags.some(t => t.toLowerCase() === tag.toLowerCase())) {
        builderState.tags.push(tag);
    }
    renderBuilder();
}

function removeTagFromBuilder(tag) {
    builderState.tags = builderState.tags.filter(t => t !== tag);
    renderBuilder();
}

// Reorder via drag-and-drop (mouse/desktop) ...
function handleDragStart(e, index) {
    dragFromIndex = index;
    e.dataTransfer.effectAllowed = "move";
}

function handleDragOver(e) {
    e.preventDefault();
}

function handleDrop(e, index) {
    e.preventDefault();
    if (dragFromIndex === null || dragFromIndex === index) return;
    const [moved] = builderState.steps.splice(dragFromIndex, 1);
    builderState.steps.splice(index, 0, moved);
    dragFromIndex = null;
    renderBuilder();
}

// ... and via up/down buttons (works everywhere, including touch,
// where native HTML5 drag-and-drop mostly doesn't).
function moveStep(index, direction) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= builderState.steps.length) return;
    const steps = builderState.steps;
    [steps[index], steps[newIndex]] = [steps[newIndex], steps[index]];
    renderBuilder();
}

async function saveBuilder() {
    if (!builderState.title || !builderState.title.trim()) {
        alert("Give the workout a name first.");
        return;
    }

    const payload = {
        title: builderState.title.trim(),
        subtitle: builderState.subtitle || "Your custom workout",
        tags: builderState.tags,
        defaultRest: builderState.defaultRest,
        steps: builderState.steps.map(s => ({
            id: s.id,
            cat: s.cat || "EXERCISES",
            name: s.name,
            mode: s.mode,
            duration: Number(s.duration) || 40,
            reps: s.mode === "reps" ? (s.reps || "") : "",
            tip: s.tip || "",
            restOverride: (s.restOverride === null || s.restOverride === undefined || s.restOverride === "") ? null : Number(s.restOverride)
        }))
    };

    if (builderState.id) {
        await window.updateCustomWorkout(builderState.id, payload);
    } else {
        await window.createCustomWorkoutFull(payload);
    }

    closeBuilder();
    renderMyWorkoutsSection();
}

async function openHistory() {
    if (!window.isSignedIn || !window.isSignedIn()) {
        alert("Sign in to see your logged sets & reps.");
        return;
    }
    document.getElementById("profile-btn").classList.remove("open");

    currentCategory = "";
    currentCustomWorkoutId = null;
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
    const workout = getActiveWorkout();
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
    currentCustomWorkoutId = null;
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
        const workout = getActiveWorkout();
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