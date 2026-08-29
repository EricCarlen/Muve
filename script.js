// ============================================================
// STATE
// ============================================================
let currentCategory = "";  // key into WORKOUTS, "" if a custom workout is open instead
let currentCustomWorkoutId = null; // id of the open custom workout, null if a built-in category is open
let workoutTimer;
let isPaused = true;
let currentStep = 0;
let elapsed = 0;
let steps = [];             // the active workout's expanded (rounds + rests) step list, used by the timer engine

let builderState = null;    // the workout currently being created/edited in the builder
let dragFrom = null;        // { si, ei } of the builder row currently being dragged
let activeTagFilter = "all"; // which tag is currently filtering the My Workouts grid
let examplesVisible = false; // only relevant once signed in — toggled by "Browse example workouts"

// Previous-performance / logging state (see PERFORMANCE LOGGING section
// below). Reset every time a workout is opened or closed.
let previousPerformanceMap = {}; // key -> { weight, reps } from the user's last time through this exercise/round
let sessionPerformanceLog = {};  // key -> { weight, reps } entered so far *this* time through the workout
let workoutStartTime = null;     // Date.now() when the workout was opened — used to time List-mode sessions

// ============================================================
// WORKOUT DATA — single source of truth.
// Every workout (built-in or custom) shares the same shape:
//   { title, subtitle, defaultRest, next?,
//     sections: [ { name, repeat, exercises: [
//        { name, mode: 'reps'|'time', duration, reps, tip, restOverride }
//     ]}]}
// A section's `repeat` is how many times its whole exercise list runs
// before moving to the next section (e.g. a superset done x3). Rests
// aren't stored — defaultRest (or a per-exercise restOverride) is
// inserted automatically between exercises when Timed mode runs.
// ============================================================
const WORKOUTS = {

    morning: {
        title: "Morning Mobility & Sweat",
        subtitle: "Flow: x5 each side or x10 per move",
        defaultRest: 12,
        sections: [
            {
                name: "FLOW", repeat: 1,
                exercises: [
                    { name: "Wrist Circles", mode: "time", duration: 30, tip: "Slow circles; feel the stretch in the forearm." },
                    { name: "Neck Circles", mode: "time", duration: 30 },
                    { name: "Toe Flex & Splay", mode: "time", duration: 30 },
                    { name: "Standing Hip Circles to Forward Fold", mode: "time", duration: 30 },
                    { name: "Squat to Overhead Reach", mode: "time", duration: 30 },
                    { name: "90/90 Hip Flow to Lunge with Twist", mode: "time", duration: 30 },
                    { name: "Greatest Stretch Lunge to Hamstring Stretch with Arm Sweep", mode: "time", duration: 30 },
                    { name: "Hindu Push Ups", mode: "time", duration: 30 },
                    { name: "Cossack Squat to Side Reach", mode: "time", duration: 30 },
                    { name: "Dynamic Frog Pose to Thoracic Bridge", mode: "time", duration: 30 },
                    { name: "Standing Side Bend to Back Bend", mode: "time", duration: 30 }
                ]
            },
            {
                name: "BALANCE", repeat: 1,
                exercises: [
                    { name: "One Leg Arm Circles (L)", mode: "time", duration: 60 },
                    { name: "One Leg Arm Circles (R)", mode: "time", duration: 60 },
                    { name: "One Leg Toes Clock Reaches (L)", mode: "time", duration: 60 },
                    { name: "One Leg Toes Clock Reaches (R)", mode: "time", duration: 60 }
                ]
            },
            {
                name: "SWEATY", repeat: 1,
                exercises: [
                    { name: "Toe Touches (30s) | Bicycle (30s)", mode: "time", duration: 60 },
                    { name: "Push Ups", mode: "time", duration: 60 },
                    { name: "Horse Stance with Side Bends", mode: "time", duration: 60 },
                    { name: "Plank", mode: "time", duration: 60 },
                    { name: "Pistol Squat (30s/side)", mode: "time", duration: 60 },
                    { name: "Crawl", mode: "time", duration: 60 }
                ]
            }
        ]
    },

    "upper body": {
        title: "Upper Body Strength",
        subtitle: "Bodyweight — tense your core and push",
        defaultRest: 15,
        sections: [
            {
                name: "WARM UP", repeat: 1,
                exercises: [
                    { name: "Quadruped Step-through x 20", mode: "time", duration: 60, tip: "Keep it smooth" },
                    { name: "Karaoke Drill – small to big spins", mode: "time", duration: 60, tip: "Comfortable range" },
                    { name: "Skater Squat x 10/leg", mode: "time", duration: 60, tip: "Comfortable range" },
                    { name: "Hindu Pushup x 10", mode: "time", duration: 60, tip: "Comfortable range" },
                    { name: "Windmills x 20", mode: "time", duration: 60, tip: "Comfortable range" },
                    { name: "Turkish Get Up x 3/side", mode: "time", duration: 90, tip: "Comfortable range", restOverride: 60 }
                ]
            },
            {
                name: "BLOCK A", repeat: 2,
                exercises: [
                    { name: "Pull-up to Knee Raise x 5", mode: "time", duration: 60, tip: "Slow elbow-to-knee, pause briefly at contact" },
                    { name: "Push-up to Renegade Row x 5/side", mode: "time", duration: 60, tip: "Keep hips square, don't rotate through the row" },
                    { name: "Pike Push-up x 5", mode: "time", duration: 60, tip: "Hips high, crown of head toward the floor, control the descent" },
                    { name: "Floor Bridge with Rear Delt Fly x 10", mode: "time", duration: 60, tip: "Squeeze glutes at the top, control the fly" },
                    { name: "Y Raise – 40s on 20s off", mode: "time", duration: 40, tip: "Thumbs up, lead with the elbows", restOverride: 60 }
                ]
            },
            {
                name: "BLOCK B", repeat: 2,
                exercises: [
                    { name: "Hand Release Push-up to Downward Dog – 40s", mode: "time", duration: 40, tip: "Full chest to floor, press back with control" },
                    { name: "Pike-to-Plank Shoulder Taps – 40s", mode: "time", duration: 40, tip: "Ribs down, avoid arching the lower back" },
                    { name: "Single-arm Plank Row (bodyweight) – 40s", mode: "time", duration: 40, tip: "Brace core, minimal hip sway" },
                    { name: "Diamond Push-up x 5", mode: "time", duration: 40, tip: "Elbows tucked, squeeze at the top", restOverride: 60 }
                ]
            },
            {
                name: "COOL DOWN", repeat: 1,
                exercises: [
                    { name: "Child's Pose with side stretch", mode: "time", duration: 30 },
                    { name: "Child's Pose with side stretch", mode: "time", duration: 30 },
                    { name: "Seated Forward Fold", mode: "time", duration: 45 },
                    { name: "Chest Opener Stretch", mode: "time", duration: 30 },
                    { name: "Chest Opener Stretch", mode: "time", duration: 30 },
                    { name: "Supine Figure Four Stretch", mode: "time", duration: 30 },
                    { name: "Supine Figure Four Stretch", mode: "time", duration: 30 }
                ]
            }
        ]
    },

    "lower body": {
        title: "Lower Body",
        subtitle: "Bodyweight — strength is a skill",
        defaultRest: 20,
        next: "core control",
        sections: [
            {
                name: "WARM UP", repeat: 1,
                exercises: [
                    { name: "World's Greatest Stretch", mode: "time", duration: 45 },
                    { name: "Inchworm Walk", mode: "time", duration: 45 },
                    { name: "M-Drill / Leg Swings", mode: "time", duration: 45 },
                    { name: "Reach and Roll", mode: "time", duration: 45 },
                    { name: "Slender Lateral Drop", mode: "time", duration: 45 }
                ]
            },
            {
                name: "MAIN", repeat: 3,
                exercises: [
                    { name: "Bodyweight Sumo Squats", mode: "time", duration: 45, tip: "Squat & Power Superset — full depth, controlled reps" },
                    { name: "Monster Walks", mode: "time", duration: 45 },
                    { name: "Single-leg Romanian Deadlift", mode: "time", duration: 45, tip: "Posterior Chain Superset — hinge at the hips, flat back" },
                    { name: "Nordic Leans", mode: "time", duration: 45 },
                    { name: "Single-leg Glute Bridge", mode: "time", duration: 45 },
                    { name: "Reverse Nordics", mode: "time", duration: 45, tip: "Nordic & Glute Focus — control the descent" },
                    { name: "Single Leg Glute Bridge Pulses", mode: "time", duration: 45, restOverride: 45 }
                ]
            },
            {
                name: "COOL DOWN", repeat: 1,
                exercises: [
                    { name: "Kneeling Hamstring Stretch", mode: "time", duration: 45 },
                    { name: "Hip Flexor Stretch", mode: "time", duration: 45 },
                    { name: "Seated Butterfly Stretch", mode: "time", duration: 45 },
                    { name: "Pigeon Pose", mode: "time", duration: 45 },
                    { name: "Child's Pose", mode: "time", duration: 45 }
                ]
            }
        ]
    },

    core: {
        title: "Core",
        subtitle: "Combined rotation & control — bodyweight",
        defaultRest: 15,
        sections: [
            {
                name: "WARM UP", repeat: 1,
                exercises: [
                    { name: "Dynamic Plank → Downward Dog", mode: "time", duration: 60, tip: "Keep it smooth" },
                    { name: "Cat-Cow", mode: "time", duration: 60 },
                    { name: "Torso Twists", mode: "time", duration: 60 },
                    { name: "Standing Side Bends", mode: "time", duration: 60 }
                ]
            },
            {
                name: "MAIN WORK", repeat: 1,
                exercises: [
                    { name: "Twisting Planks → Side Plank", mode: "time", duration: 150, tip: "Slow transitions, 2 second hold in side plank, focus on rib-to-pelvis control." },
                    { name: "Russian Twists", mode: "time", duration: 150, tip: "Lean back until core engages; keep chest proud. Exhale with each twist." },
                    { name: "Bicycle Crunches", mode: "time", duration: 120, tip: "Slow elbow-to-knee, pause briefly at contact" },
                    { name: "Twisting Bear Crawl", mode: "time", duration: 120, tip: "Knees low, spine quiet, hips steady, ribs rotate" },
                    { name: "Twisting V-Ups", mode: "time", duration: 120, tip: "Alternate sides each rep, control the lowering phase" },
                    { name: "Side Plank with Hip Dips (L)", mode: "time", duration: 75, tip: "Small range, constant tension." },
                    { name: "Side Plank with Hip Dips (R)", mode: "time", duration: 75, tip: "Small range, constant tension." },
                    { name: "Plank Shoulder Taps + Knee Twists", mode: "time", duration: 120, tip: "Reduce speed if hips sway" },
                    { name: "Twisting Hollow Body Hold", mode: "time", duration: 40, tip: "Small, deliberate rotations only" }
                ]
            },
            {
                name: "COOL DOWN", repeat: 1,
                exercises: [
                    { name: "Supine Twists", mode: "time", duration: 90 },
                    { name: "Child's Pose with side stretch", mode: "time", duration: 60 }
                ]
            }
        ]
    },

    "core rotation": {
        title: "Core Rotation",
        subtitle: "15 min",
        defaultRest: 15,
        sections: [
            {
                name: "WARM UP", repeat: 1,
                exercises: [
                    { name: "Torso Twists", mode: "time", duration: 60 },
                    { name: "Cat-Cow", mode: "time", duration: 60 },
                    { name: "Standing Side Bends", mode: "time", duration: 60 }
                ]
            },
            {
                name: "MAIN WORK", repeat: 1,
                exercises: [
                    { name: "Twisting Planks → Side Plank", mode: "time", duration: 150, tip: "Slow transitions, 2 second hold in side plank, focus on rib-to-pelvis control." },
                    { name: "Russian Twists", mode: "time", duration: 150, tip: "Lean back until core engages; keep chest proud. Exhale with each twist." },
                    { name: "Starfish Crunch", mode: "time", duration: 150, tip: "Long reach, no momentum, think diagonal compression." },
                    { name: "Side Plank with Hip Dips (L)", mode: "time", duration: 75, tip: "Small range, constant tension." },
                    { name: "Side Plank with Hip Dips (R)", mode: "time", duration: 75, tip: "Small range, constant tension." }
                ]
            },
            {
                name: "COOL DOWN", repeat: 1,
                exercises: [
                    { name: "Supine Twists", mode: "time", duration: 120 }
                ]
            }
        ]
    },

    "core control": {
        title: "Core Control",
        subtitle: "15 min",
        defaultRest: 15,
        sections: [
            {
                name: "WARM UP", repeat: 1,
                exercises: [
                    { name: "Dynamic Plank → Downward Dog", mode: "time", duration: 120, tip: "Keep it smooth" },
                    { name: "Cat-Cow", mode: "time", duration: 60, tip: "Comfortable range" }
                ]
            },
            {
                name: "MAIN WORK", repeat: 1,
                exercises: [
                    { name: "Bicycle Crunches", mode: "time", duration: 120, tip: "Slow elbow-to-knee, pause briefly at contact" },
                    { name: "Twisting Bear Crawl", mode: "time", duration: 120, tip: "Knees low, spine quiet, hips steady, ribs rotate" },
                    { name: "Twisting V-Ups", mode: "time", duration: 120, tip: "Alternate sides each rep, control the lowering phase" },
                    { name: "Plank Shoulder Taps + Knee Twists", mode: "time", duration: 120, tip: "Reduce speed if hips sway" },
                    { name: "Twisting Hollow Body Hold", mode: "time", duration: 40, tip: "Small, deliberate rotations only" },
                    { name: "Twisting Hollow Body Hold", mode: "time", duration: 40, tip: "Small, deliberate rotations only" }
                ]
            },
            {
                name: "COOL DOWN", repeat: 1,
                exercises: [
                    { name: "Child's Pose with side stretch", mode: "time", duration: 60 },
                    { name: "Child's Pose with side stretch", mode: "time", duration: 60 }
                ]
            }
        ]
    },

    "mobility side": {
        title: "Mobility",
        subtitle: "Quality full ROM | 2 rounds",
        defaultRest: 10,
        sections: [
            { name: "A", repeat: 2, exercises: [
                { name: "Crawl", mode: "time", duration: 60 },
                { name: "Duck Walk", mode: "time", duration: 60 }
            ]},
            { name: "B", repeat: 2, exercises: [
                { name: "Horse Stance", mode: "time", duration: 60 },
                { name: "Bridge Push Up x 5", mode: "time", duration: 30 }
            ]},
            { name: "C", repeat: 2, exercises: [
                { name: "Shoulder Rolls x 10", mode: "time", duration: 30 },
                { name: "ATG Split Squat x 10 ea", mode: "time", duration: 30 }
            ]}
        ]
    },

    "strength side": {
        title: "Strength",
        subtitle: "Strength is a skill | 2 rounds",
        defaultRest: 15,
        sections: [
            { name: "A", repeat: 2, exercises: [
                { name: "Push Ups x 5-10", mode: "time", duration: 40 },
                { name: "Broad Jumps x 5", mode: "time", duration: 30 }
            ]},
            { name: "B", repeat: 2, exercises: [
                { name: "Pull Ups x 5-10", mode: "time", duration: 40 },
                { name: "Split Squat x 5-8", mode: "time", duration: 40 }
            ]},
            { name: "C", repeat: 2, exercises: [
                { name: "Cossack Squat x 3-4/side", mode: "time", duration: 40 },
                { name: "Good Mornings x 8", mode: "time", duration: 40 }
            ]}
        ]
    },

    evening: {
        title: "Evening Calm",
        subtitle: "Long, easy breaths",
        defaultRest: 8,
        sections: [
            {
                name: "WIND DOWN", repeat: 1,
                exercises: [
                    { name: "Ankle Rolls", mode: "time", duration: 30 },
                    { name: "Wrist Rotations", mode: "time", duration: 30 },
                    { name: "Hands Open and Close", mode: "time", duration: 30 },
                    { name: "Shoulder Shrugs", mode: "time", duration: 30 },
                    { name: "Neck Rolls", mode: "time", duration: 30 },
                    { name: "Forward Fold Sway", mode: "time", duration: 30 },
                    { name: "Windshield Wipers", mode: "time", duration: 30 },
                    { name: "Legs Up Wall", mode: "time", duration: 60 },
                    { name: "Happy Baby", mode: "time", duration: 45 },
                    { name: "Supine Twist", mode: "time", duration: 45 },
                    { name: "Child's Pose", mode: "time", duration: 45 }
                ]
            }
        ]
    }
};

const FULL_WORKOUT_LIST = [
    "morning", "upper body", "lower body",
    "core rotation", "core control",
    "mobility side", "strength side", "evening"
];

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
    workout.sections.forEach(section => {
        section.exercises.forEach(step => {
            if (step.reps) return;
            const found = extractReps(step.name);
            if (found) step.reps = found;
        });
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
        return { id: generateStepId(), name: name || clean, mode: "reps", reps, duration: 40, tip: "", restOverride: null, trackPerformance: true };
    }

    const timeMatch = clean.match(TIME_PATTERN);
    if (timeMatch) {
        const seconds = timeMatch[1]
            ? parseInt(timeMatch[1], 10) * 60 + (timeMatch[2] ? parseInt(timeMatch[2], 10) : 0)
            : parseInt(timeMatch[3], 10);
        const name = clean.replace(timeMatch[0], "").replace(/[-–,]\s*$/, "").trim();
        return { id: generateStepId(), name: name || clean, mode: "time", reps: "", duration: seconds, tip: "", restOverride: null, trackPerformance: true };
    }

    // No recognisable count in the line — default to a 40s timed entry;
    // easy to switch to Reps and fix up afterward if that's wrong.
    return { id: generateStepId(), name: clean, mode: "time", reps: "", duration: 40, tip: "", restOverride: null, trackPerformance: true };
}

function generateStepId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function escapeForAttr(str) {
    return String(str || "").replace(/'/g, "\\'");
}

function escapeAttrValue(str) {
    return String(str || "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

function slugify(name) {
    return name.replace(/[^a-z0-9]/gi, "").toLowerCase();
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
// SOUND — short synthesized beeps (no audio files needed). AudioContext
// can't start until a real user gesture (tap/click), so it's created
// lazily the first time togglePlayPause or a breathing session runs.
// ============================================================
let audioCtx = null;

function ensureAudioContext() {
    if (!audioCtx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (AC) audioCtx = new AC();
    }
    return audioCtx;
}

function playBeep(frequency = 880, durationMs = 150, volume = 0.15) {
    const ctx = ensureAudioContext();
    if (!ctx) return;
    try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = frequency;
        gain.gain.setValueAtTime(volume, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + durationMs / 1000);
    } catch (e) {
        // Audio isn't available in this browser/context — fail silently,
        // a missing beep shouldn't break the workout.
    }
}

// ============================================================
// WORKOUT ENGINE
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

// The single entry point every built-in category button calls.
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

    // Fresh logging state for this pass through the workout. Today's
    // entries always start blank — only the "Previous" reference text is
    // pre-filled, and that arrives asynchronously below.
    sessionPerformanceLog = {};
    previousPerformanceMap = {};
    workoutStartTime = Date.now();

    renderCurrentMode();
    loadPreviousPerformanceForActiveWorkout();
}

// Returns the workout currently open, whether it's one of the built-in
// WORKOUTS entries or a workout the signed-in user created themselves.
// Everything downstream only ever talks to this shape.
function getActiveWorkout() {
    if (currentCustomWorkoutId) {
        const w = (window.customWorkouts || []).find(cw => cw.id === currentCustomWorkoutId);
        if (!w) return null;
        return {
            title: w.title,
            subtitle: w.subtitle || "",
            sections: normalizeSectionsForRun(w),
            defaultRest: w.defaultRest != null ? w.defaultRest : 15,
            next: w.next || null,
            isCustom: true,
            id: w.id
        };
    }
    return WORKOUTS[currentCategory] || null;
}

// Back-compat for custom workouts saved before sections existed (a flat
// `steps` array) — wraps them as a single section so they still open.
function normalizeSectionsForRun(w) {
    if (Array.isArray(w.sections)) return w.sections;
    if (Array.isArray(w.steps)) {
        return [{ name: "Exercises", repeat: 1, exercises: w.steps.filter(s => s.name !== "Rest") }];
    }
    return [];
}

// Flattens a workout's sections into the physical, timer-ready step list:
// each section's exercises repeated `section.repeat` times, with rests
// (defaultRest, or a per-exercise restOverride) inserted automatically
// between every pair of exercises. Each expanded step is tagged with
// which section/round it belongs to, so Timed mode can show
// "Superset — Round 2 of 3" instead of a flat repeated list.
function expandSections(workout) {
    const defaultRest = workout.defaultRest != null ? workout.defaultRest : 15;
    const flat = [];

    workout.sections.forEach(section => {
        const rounds = section.repeat || 1;
        for (let r = 1; r <= rounds; r++) {
            section.exercises.forEach(ex => {
                flat.push({ ...ex, sectionId: section.id, sectionName: section.name, sectionRound: r, sectionRounds: rounds });
            });
        }
    });

    const withRests = [];
    flat.forEach((step, i) => {
        withRests.push(step);
        const isLast = i === flat.length - 1;
        if (isLast) return;

        const hasOverride = step.restOverride !== null && step.restOverride !== undefined && step.restOverride !== "";
        const restDuration = hasOverride ? Number(step.restOverride) : defaultRest;
        if (restDuration > 0) {
            withRests.push({
                name: "Rest", duration: restDuration,
                sectionName: step.sectionName, sectionRound: step.sectionRound, sectionRounds: step.sectionRounds
            });
        }
    });

    return withRests;
}

// Same grouping as expandSections (each section's exercises repeated
// `section.repeat` times, tagged with sectionId/round info) but WITHOUT
// rest steps inserted — this is what List mode walks (no timer, so no
// rests to show) and it's also the shape performance-logging keys are
// built from, so the same section/round grouping is used everywhere the
// workout is displayed.
function expandSectionsFlat(workout) {
    const flat = [];
    workout.sections.forEach(section => {
        const rounds = section.repeat || 1;
        for (let r = 1; r <= rounds; r++) {
            section.exercises.forEach(ex => {
                flat.push({ ...ex, sectionId: section.id, sectionName: section.name, sectionRound: r, sectionRounds: rounds });
            });
        }
    });
    return flat;
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

    if (isTimed) {
        timerCont.style.display = "flex";
        controls.style.display = "flex";
        steps = expandSections(workout);
        resetTimerState();
        renderTimedSteps();
    } else {
        timerCont.style.display = "none";
        controls.style.display = "none";
        clearInterval(workoutTimer);
        renderListSteps(workout);
    }
}

function refreshWorkoutView() {
    if (currentCategory || currentCustomWorkoutId) renderCurrentMode();
}

// List mode is the "performing" view for rep/weight-based workouts (no
// timer needed). Repeated sections are expanded round-by-round — same as
// Timed mode — so a superset done x3 clearly reads as three separate
// rounds rather than one block with a vague "× 3" label, and each round
// gets its own Previous/Today logging row.
function renderListSteps(workout) {
    const content = document.getElementById("overlay-content");
    const isCustomWorkout = !!workout.isCustom;

    let html = `<div class="set-counter">${workout.subtitle || ""}</div>`;

    if (isCustomWorkout) {
        html += `<div class="add-exercise-row">
                    <button class="link-btn small" onclick="openEditWorkoutBuilder('${workout.id}')">&#9998; Edit Workout</button>
                 </div>`;
        if (!workout.sections.length || workout.sections.every(s => s.exercises.length === 0)) {
            html += `<p style="color:#888; font-size:0.8rem; padding: 10px 0 20px;">No exercises yet — tap "Edit Workout" to build it.</p>`;
        }
    }

    html += `<div class="workout-list">`;
    const flatSteps = expandSectionsFlat(workout);
    let lastGroupKey = "";

    flatSteps.forEach(step => {
        const groupKey = `${step.sectionId || step.sectionName}|${step.sectionRound}`;
        if (groupKey !== lastGroupKey) {
            const label = step.sectionRounds > 1
                ? `${step.sectionName} — Round ${step.sectionRound} of ${step.sectionRounds}`
                : step.sectionName;
            html += `<h3 class="workout-section-title">${label}</h3>`;
            lastGroupKey = groupKey;
        }

        const tipHtml = step.tip ? `<div class="tech-note"><strong>Tip:</strong> ${step.tip}</div>` : "";
        const perfHtml = isCustomWorkout ? renderPerformanceFields(step, step.sectionId, step.sectionRound) : "";

        html += `<div class="exercise-item list">
                    <div class="exercise-info-wrapper">
                        <span class="step-name">${step.name}</span>
                        ${tipHtml}
                        ${perfHtml}
                    </div>
                    <span class="step-time">${step.reps || formatDuration(step.duration)}</span>
                 </div>`;
    });
    html += `</div>`;

    // Timed mode logs + saves on completion automatically (see
    // goToNextStep); List mode has no natural "end" event, so it gets an
    // explicit Finish & Save action instead.
    if (isCustomWorkout) {
        html += `<div class="workout-link-container">
                    <button class="filter-btn" onclick="finishAndSaveWorkout()">Finish &amp; Save</button>
                 </div>`;
    }

    html += nextWorkoutButton(workout);
    html += breathingButton();
    content.innerHTML = html;
}

// Timed mode walks the expanded, round-aware step list. A new header only
// prints when the section OR the round within a repeating section changes
// — so a 3-round superset shows "Superset — Round 2 of 3" once, not the
// same block heading repeated for every exercise inside it.
function renderTimedSteps() {
    const content = document.getElementById("overlay-content");
    const workout = getActiveWorkout();
    const totalSeconds = steps.reduce((acc, s) => acc + s.duration, 0);
    let html = `<div class="set-counter">${workout.subtitle || ""}</div>
                <div class="total-duration">Total: ${formatDuration(totalSeconds)}</div>
                <div class="workout-list">`;
    let lastGroupKey = "";

    steps.forEach((step, index) => {
        if (step.name === "Rest" && index < currentStep) return;

        const groupKey = `${step.sectionId || step.sectionName}|${step.sectionRound}`;
        if (groupKey !== lastGroupKey) {
            const label = step.sectionRounds > 1
                ? `${step.sectionName} — Round ${step.sectionRound} of ${step.sectionRounds}`
                : step.sectionName;
            html += `<h3 class="workout-section-title">${label}</h3>`;
            lastGroupKey = groupKey;
        }

        let status = index === currentStep ? "active" : (index < currentStep ? "completed" : "");
        if (step.name === "Rest") status += " rest";

        const techNote = (step.tip && index === currentStep) ? `<div class="tech-note"><strong>Tip:</strong> ${step.tip}</div>` : "";
        const perfHtml = (workout.isCustom && step.mode === "reps" && index === currentStep)
            ? renderPerformanceFields(step, step.sectionId, step.sectionRound)
            : "";

        html += `<div class="exercise-item ${status}">
                    <div class="exercise-info-wrapper">
                        <span class="step-name">${step.name}</span>
                        ${techNote}
                        ${perfHtml}
                    </div>
                    <span class="step-time">${formatDuration(step.duration)}</span>
                 </div>`;
    });

    html += `</div>`;
    html += breathingButton();
    content.innerHTML = html;

    const tipElement = document.getElementById("active-tip");
    if (tipElement && steps[currentStep]) {
        tipElement.innerText = steps[currentStep].name === "Rest"
            ? (steps[currentStep].tip || "Recover & prep for next move")
            : (steps[currentStep].tip || "Keep your form tight!");
    }
}

function breathingButton() {
    return `<div class="breathing-row">
                <button class="link-btn small" onclick="openBreathing()">&#129496; Breathing</button>
             </div>`;
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
    sessionPerformanceLog = {};
    previousPerformanceMap = {};
    workoutStartTime = null;
    // Note: the List/Timed toggle is left as-is on purpose, so your
    // preferred mode carries over to the next workout you open.
}

// ============================================================
// PERFORMANCE LOGGING — previous performance + today's weight/reps for
// strength (reps-mode) exercises, and turning what the user enters into
// records ready to save to workout history. Only shown for the user's
// own saved (custom) workouts, since built-in exercises have no stable
// id to key a history record against.
//
// A logging key uniquely identifies one exercise in one round of one
// section: `${sectionId}::${round}::${exerciseId}`. This is the same
// shape expected back from window.loadPreviousPerformance(workoutId) —
// it should resolve to an object mapping these keys to the most recent
// { weight, reps } logged for that slot, e.g.:
//   { "sec1::1::ex3": { weight: 20, reps: 10 }, ... }
// ============================================================
function performanceKey(sectionId, round, exerciseId) {
    // exerciseId (from generateStepId) is already globally unique per
    // exercise, so sectionId isn't needed for uniqueness — and it's kept
    // as an unused parameter only so every call site stays unchanged.
    // This must match how window.loadPreviousPerformance() in auth.js
    // builds its keys.
    return `${round}::${exerciseId}`;
}

function renderPerformanceFields(step, sectionId, round) {
    if (step.mode !== "reps" || !step.id) return "";
    if (step.trackPerformance === false) return ""; // opted out — e.g. a stretch or mobility move

    const key = performanceKey(sectionId, round, step.id);
    const prev = previousPerformanceMap[key];
    const logged = sessionPerformanceLog[key] || {};

    const prevText = prev && (prev.weight != null || prev.reps != null)
        ? `Previous: ${prev.weight != null && prev.weight !== "" ? prev.weight + " kg × " : ""}${prev.reps != null ? prev.reps : "0"} reps`
        : "Previous: —";

    return `<div class="performance-row">
                <div class="performance-previous">${prevText}</div>
                <div class="performance-inputs">
                    <input type="number" min="0" step="0.5" class="builder-input perf-weight" placeholder="kg"
                           value="${logged.weight ?? ""}"
                           oninput="updatePerformanceField('${key}', 'weight', this.value)">
                    <span class="perf-x">×</span>
                    <input type="number" min="0" class="builder-input perf-reps" placeholder="reps"
                           value="${logged.reps ?? ""}"
                           oninput="updatePerformanceField('${key}', 'reps', this.value)">
                </div>
            </div>`;
}

function updatePerformanceField(key, field, value) {
    if (!sessionPerformanceLog[key]) sessionPerformanceLog[key] = {};
    sessionPerformanceLog[key][field] = value;
}

// Fetches the user's last-logged weight/reps for every slot in the
// currently open workout. Runs after the workout is already on screen so
// opening never blocks on a network round trip — inputs just fill in
// their "Previous" text once this resolves.
async function loadPreviousPerformanceForActiveWorkout() {
    const workout = getActiveWorkout();
    if (!workout || !workout.isCustom || !workout.id || !window.loadPreviousPerformance) return;

    try {
        const map = await window.loadPreviousPerformance(workout.id);
        // Bail if the user has since closed the workout or opened a
        // different one while this was in flight.
        const stillOpen = getActiveWorkout() && getActiveWorkout().id === workout.id;
        if (!stillOpen) return;
        previousPerformanceMap = map || {};
        refreshWorkoutView();
    } catch (e) {
        // No previous performance available — inputs just show without a
        // comparison, which is a fine first-time state.
    }
}

// Converts whatever the user has typed into the Today fields into a flat
// list of history records — one per exercise per round that actually has
// a weight or rep count entered. Shared by the List-mode "Finish & Save"
// button and by Timed mode's automatic save on workout completion.
function buildPerformanceEntries(workout) {
    if (!workout || !workout.isCustom) return [];

    const flat = expandSectionsFlat(workout);
    const entries = [];

    flat.forEach(step => {
        if (step.mode !== "reps" || !step.id) return;
        const key = performanceKey(step.sectionId, step.sectionRound, step.id);
        const logged = sessionPerformanceLog[key];
        if (!logged || (logged.weight === undefined || logged.weight === "") && (logged.reps === undefined || logged.reps === "")) return;

        entries.push({
            sectionId: step.sectionId || null,
            sectionName: step.sectionName,
            round: step.sectionRound,
            totalRounds: step.sectionRounds,
            exerciseId: step.id,
            exerciseName: step.name,
            weight: (logged.weight !== undefined && logged.weight !== "") ? Number(logged.weight) : null,
            reps: (logged.reps !== undefined && logged.reps !== "") ? Number(logged.reps) : null
        });
    });

    return entries;
}

// List mode's explicit "end of workout" action — saves whatever was
// logged as a completed history session, then closes the overlay.
async function finishAndSaveWorkout() {
    const workout = getActiveWorkout();
    if (!workout) { closeWorkout(); return; }

    const durationSeconds = workoutStartTime ? Math.round((Date.now() - workoutStartTime) / 1000) : 0;
    await saveWorkoutSession(workout, durationSeconds);
    closeWorkout();
}

// Timed mode's natural "end of workout" moment — called from
// goToNextStep once the step list is exhausted.
async function saveTimedWorkoutSession(workout) {
    if (!workout || !workout.isCustom) return;
    await saveWorkoutSession(workout, elapsed);
}

async function saveWorkoutSession(workout, durationSeconds) {
    if (!workout || !workout.isCustom || !window.saveWorkoutSession) return;

    const performance = buildPerformanceEntries(workout);
    try {
        await window.saveWorkoutSession({
            workoutId: workout.id,
            workoutTitle: workout.title,
            durationSeconds: durationSeconds || 0,
            performance
        });
    } catch (e) {
        // Saving history shouldn't block the user from finishing their
        // workout — fail silently and let them carry on.
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
function renderMyWorkoutsSection() {
    const section = document.getElementById("my-workouts-section");
    const promptEl = document.getElementById("signin-prompt");
    const examplesSection = document.getElementById("examples-section");
    const browseLink = document.getElementById("browse-examples-link");
    if (!section) return;

    const signedIn = window.isSignedIn && window.isSignedIn();

    if (!signedIn) {
        section.style.display = "none";
        if (promptEl) promptEl.style.display = "block";
        if (browseLink) browseLink.style.display = "none";
        if (examplesSection) examplesSection.style.display = "block";
        return;
    }

    if (promptEl) promptEl.style.display = "none";
    if (browseLink) browseLink.style.display = "block";
    if (examplesSection) examplesSection.style.display = examplesVisible ? "block" : "none";
    updateBrowseExamplesLabel();
    section.style.display = "flex";

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

function toggleExamplesVisible() {
    examplesVisible = !examplesVisible;
    document.getElementById("examples-section").style.display = examplesVisible ? "block" : "none";
    updateBrowseExamplesLabel();
}

function updateBrowseExamplesLabel() {
    const anchor = document.getElementById("browse-examples-anchor");
    if (anchor) anchor.innerText = examplesVisible ? "Hide example workouts" : "Browse example workouts";
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
// WORKOUT BUILDER — create or edit a custom workout. Sections are the
// core building block: each has a name, a repeat count (for supersets/
// repeated rounds), and its own list of exercises — paste a list, add
// them manually, edit any field inline, and reorder within a section.
// Everything is edited in memory and written to Firestore in one go
// when Save is clicked.
// ============================================================
function openCreateWorkoutBuilder() {
    if (!window.isSignedIn || !window.isSignedIn()) {
        alert("Sign in first to create your own workout.");
        return;
    }
    builderState = {
        id: null, title: "", subtitle: "Your custom workout", tags: [], defaultRest: 15,
        sections: [{ id: generateStepId(), name: "Exercises", repeat: 1, exercises: [] }]
    };
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
        sections: normalizeSectionsForBuilder(w)
    };
    openBuilderOverlay("Edit Workout");
}

// Same back-compat as the run-view: older custom workouts had a flat
// `steps` array instead of `sections`.
function normalizeSectionsForBuilder(w) {
    if (Array.isArray(w.sections)) {
        return w.sections.map(sec => ({
            id: sec.id || generateStepId(),
            name: sec.name || "Exercises",
            repeat: sec.repeat || 1,
            exercises: (sec.exercises || []).map(ex => ({
                id: ex.id || generateStepId(),
                ...ex,
                mode: ex.mode || (ex.reps ? "reps" : "time"),
                trackPerformance: ex.trackPerformance !== false
            }))
        }));
    }
    if (Array.isArray(w.steps)) {
        return [{
            id: generateStepId(),
            name: "Exercises",
            repeat: 1,
            exercises: w.steps.filter(s => s.name !== "Rest").map(s => ({
                id: s.id || generateStepId(),
                ...s,
                mode: s.mode || (s.reps ? "reps" : "time"),
                trackPerformance: s.trackPerformance !== false
            }))
        }];
    }
    return [{ id: generateStepId(), name: "Exercises", repeat: 1, exercises: [] }];
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

    const sectionsHtml = s.sections.map((section, si) => renderBuilderSection(section, si)).join("");

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

        <div id="builder-sections-list">${sectionsHtml}</div>

        <button class="link-btn small" onclick="addSectionToBuilder()" style="margin: 10px 0 25px;">+ Add Section</button>

        <div class="builder-actions">
            <button class="auth-submit" onclick="saveBuilder()">Save Workout</button>
        </div>
    `;
}

function renderBuilderSection(section, si) {
    const exercisesHtml = section.exercises.map((ex, ei) => renderBuilderExerciseRow(ex, si, ei)).join("");
    const canDelete = builderState.sections.length > 1;

    return `
        <div class="builder-section-block">
            <div class="section-header-row">
                <input type="text" class="builder-input section-name-input" placeholder="Section name (e.g. Warm-up, Superset)"
                       value="${escapeAttrValue(section.name)}" oninput="updateSectionField(${si}, 'name', this.value)">
                <div class="section-repeat-row">
                    <label>Repeat ×</label>
                    <input type="number" min="1" class="builder-input repeat-input" value="${section.repeat}"
                           oninput="updateSectionField(${si}, 'repeat', this.value)">
                </div>
                ${canDelete ? `<button class="delete-btn" onclick="deleteSectionFromBuilder(${si})" title="Delete section">&times;</button>` : ""}
            </div>

            <div class="builder-paste-row">
                <textarea id="paste-area-${si}" class="builder-textarea" rows="3"
                          placeholder="Paste exercises for this section, one per line — e.g.&#10;Push ups x10&#10;Plank 45s"></textarea>
                <button class="link-btn small" onclick="parseAndAddPastedExercises(${si})">Parse &amp; Add</button>
            </div>

            <div id="section-exercises-${si}">${exercisesHtml || '<p style="color:#888; font-size:0.75rem;">No exercises yet.</p>'}</div>
            <button class="link-btn small" onclick="addBlankExerciseRow(${si})">+ Add Exercise</button>
        </div>
    `;
}

function renderBuilderExerciseRow(step, si, ei) {
    return `
        <div class="builder-row" draggable="true"
             ondragstart="handleDragStart(event, ${si}, ${ei})"
             ondragover="handleDragOver(event)"
             ondrop="handleDrop(event, ${si}, ${ei})">
            <span class="drag-handle" title="Drag to reorder">&#9776;</span>
            <div class="builder-row-fields">
                <input type="text" class="builder-input name-input" value="${escapeAttrValue(step.name)}"
                       placeholder="Exercise name" oninput="updateStepField(${si}, ${ei}, 'name', this.value)">
                <select class="builder-select" onchange="updateStepField(${si}, ${ei}, 'mode', this.value)">
                    <option value="reps" ${step.mode === "reps" ? "selected" : ""}>Reps</option>
                    <option value="time" ${step.mode === "time" ? "selected" : ""}>Time</option>
                </select>
                ${step.mode === "reps"
                    ? `<input type="text" class="builder-input value-input" placeholder="e.g. x10" value="${escapeAttrValue(step.reps)}" oninput="updateStepField(${si}, ${ei}, 'reps', this.value)">`
                    : `<input type="number" min="0" class="builder-input value-input" placeholder="Seconds" value="${step.duration}" oninput="updateStepField(${si}, ${ei}, 'duration', this.value)">`
                }
                <input type="number" min="0" class="builder-input rest-input" placeholder="Rest override (s)" value="${step.restOverride ?? ""}" oninput="updateStepField(${si}, ${ei}, 'restOverride', this.value)">
                <input type="text" class="builder-input tip-input" placeholder="Optional tip, e.g. &quot;Keep chest tall&quot;"
                       value="${escapeAttrValue(step.tip)}" oninput="updateStepField(${si}, ${ei}, 'tip', this.value)">
                ${step.mode === "reps" ? `
                <label class="track-perf-toggle">
                    <input type="checkbox" ${step.trackPerformance === false ? "" : "checked"}
                           onchange="updateStepField(${si}, ${ei}, 'trackPerformance', this.checked)">
                    Log weight &amp; reps for this exercise
                </label>` : ""}
            </div>
            <div class="builder-row-actions">
                <button class="reorder-btn" onclick="moveStepWithinSection(${si}, ${ei}, -1)" title="Move up">&#9650;</button>
                <button class="reorder-btn" onclick="moveStepWithinSection(${si}, ${ei}, 1)" title="Move down">&#9660;</button>
                <button class="delete-btn" onclick="deleteStepFromBuilder(${si}, ${ei})" title="Remove">&times;</button>
            </div>
        </div>
    `;
}

function addSectionToBuilder() {
    builderState.sections.push({ id: generateStepId(), name: "", repeat: 1, exercises: [] });
    renderBuilder();
}

function deleteSectionFromBuilder(si) {
    builderState.sections.splice(si, 1);
    renderBuilder();
}

function updateSectionField(si, field, value) {
    const section = builderState.sections[si];
    if (!section) return;
    section[field] = field === "repeat" ? Math.max(1, Number(value) || 1) : value;
}

function updateStepField(si, ei, field, value) {
    const step = builderState.sections[si]?.exercises[ei];
    if (!step) return;

    if (field === "duration") step.duration = Number(value) || 0;
    else if (field === "restOverride") step.restOverride = value === "" ? null : Number(value);
    else step[field] = value;

    if (field === "mode") renderBuilder(); // the value input needs to switch between reps/time
}

function addBlankExerciseRow(si) {
    builderState.sections[si].exercises.push({ id: generateStepId(), name: "", mode: "reps", reps: "", duration: 40, tip: "", restOverride: null, trackPerformance: true });
    renderBuilder();
}

function deleteStepFromBuilder(si, ei) {
    builderState.sections[si].exercises.splice(ei, 1);
    renderBuilder();
}

function parseAndAddPastedExercises(si) {
    const textarea = document.getElementById(`paste-area-${si}`);
    const text = textarea.value.trim();
    if (!text) return;

    const parsed = parseExerciseLines(text);
    builderState.sections[si].exercises = [...builderState.sections[si].exercises, ...parsed];
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

// Reorder via drag-and-drop (mouse/desktop), scoped within a section...
function handleDragStart(e, si, ei) {
    dragFrom = { si, ei };
    e.dataTransfer.effectAllowed = "move";
}

function handleDragOver(e) {
    e.preventDefault();
}

function handleDrop(e, si, ei) {
    e.preventDefault();
    if (!dragFrom || dragFrom.si !== si || dragFrom.ei === ei) { dragFrom = null; return; }
    const exercises = builderState.sections[si].exercises;
    const [moved] = exercises.splice(dragFrom.ei, 1);
    exercises.splice(ei, 0, moved);
    dragFrom = null;
    renderBuilder();
}

// ... and via up/down buttons (works everywhere, including touch,
// where native HTML5 drag-and-drop mostly doesn't).
function moveStepWithinSection(si, ei, direction) {
    const exercises = builderState.sections[si].exercises;
    const newIndex = ei + direction;
    if (newIndex < 0 || newIndex >= exercises.length) return;
    [exercises[ei], exercises[newIndex]] = [exercises[newIndex], exercises[ei]];
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
        sections: builderState.sections.map(sec => ({
            id: sec.id,
            name: sec.name || "Exercises",
            repeat: Math.max(1, Number(sec.repeat) || 1),
            exercises: sec.exercises.map(s => ({
                id: s.id,
                name: s.name,
                mode: s.mode,
                duration: Number(s.duration) || 40,
                reps: s.mode === "reps" ? (s.reps || "") : "",
                tip: s.tip || "",
                restOverride: (s.restOverride === null || s.restOverride === undefined || s.restOverride === "") ? null : Number(s.restOverride),
                trackPerformance: s.trackPerformance !== false
            }))
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

// ============================================================
// WORKOUT HISTORY
// 7.1 shows a list of completed sessions (title, date, duration).
// 7.2 tapping one opens the full record: every logged exercise, grouped
// by section/round exactly like the workout was performed, so a
// superset's individual rounds are visible rather than flattened away.
// ============================================================
let historySessionsCache = [];

async function openHistory() {
    if (!window.isSignedIn || !window.isSignedIn()) {
        alert("Sign in to see your workout history.");
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
    document.getElementById("overlay-title").innerText = "Workout History";
    document.getElementById("overlay-content").innerHTML = `<p style="padding:40px 0; color:#888; text-align:center;">Loading…</p>`;

    const sessions = await window.loadWorkoutHistoryList();
    historySessionsCache = sessions || [];

    let html = `<div class="workout-list">`;
    if (!historySessionsCache.length) {
        html += `<p style="padding:20px 0; color:#888; text-align:center;">No completed workouts yet.</p>`;
    } else {
        historySessionsCache.forEach(s => {
            const dateStr = formatHistoryDate(s.completedAt);
            html += `<div class="exercise-item list history-row" onclick="openHistoryDetail('${s.id}')">
                        <div class="exercise-info-wrapper">
                            <span class="step-name">${s.workoutTitle}</span>
                            <div class="tech-note">${dateStr}</div>
                        </div>
                        <span class="step-time">${formatDuration(s.durationSeconds || 0)}</span>
                     </div>`;
        });
    }
    html += `</div>`;
    document.getElementById("overlay-content").innerHTML = html;
}

// Opens the full record for one completed session: every logged
// exercise, grouped by section and round exactly as it was performed.
async function openHistoryDetail(sessionId) {
    let session = historySessionsCache.find(s => s.id === sessionId);
    if ((!session || !session.performance) && window.loadWorkoutHistoryDetail) {
        session = await window.loadWorkoutHistoryDetail(sessionId) || session;
    }
    if (!session) return;

    document.getElementById("overlay-title").innerText = session.workoutTitle || "Workout";

    const dateStr = formatHistoryDate(session.completedAt);
    let html = `<div class="set-counter">${dateStr} · ${formatDuration(session.durationSeconds || 0)}</div>`;
    html += `<div class="add-exercise-row">
                <button class="link-btn small" onclick="openHistory()">&#8592; Back to History</button>
             </div>`;

    const entries = session.performance || [];
    if (!entries.length) {
        html += `<p style="padding:20px 0; color:#888; text-align:center;">No logged sets for this workout.</p>`;
    } else {
        html += `<div class="workout-list">`;
        let lastGroupKey = "";
        entries.forEach(entry => {
            const groupKey = `${entry.sectionName}|${entry.round}`;
            if (groupKey !== lastGroupKey) {
                const label = entry.totalRounds > 1
                    ? `${entry.sectionName} — Round ${entry.round} of ${entry.totalRounds}`
                    : entry.sectionName;
                html += `<h3 class="workout-section-title">${label}</h3>`;
                lastGroupKey = groupKey;
            }

            const weightText = entry.weight != null ? `${entry.weight} kg` : "—";
            const repsText = entry.reps != null ? entry.reps : "—";
            html += `<div class="exercise-item list">
                        <span class="step-name">${entry.exerciseName}</span>
                        <span class="step-time">${weightText} × ${repsText}</span>
                     </div>`;
        });
        html += `</div>`;
    }

    document.getElementById("overlay-content").innerHTML = html;
}

function formatHistoryDate(completedAt) {
    return completedAt && completedAt.toDate
        ? completedAt.toDate().toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })
        : "";
}

// ============================================================
// BREATHING EXERCISE — a self-contained overlay reachable from any
// workout without losing your place in it. Fixed 5s inhale / 5s exhale
// cycle, repeating for however long the person sets (default 2 min).
// ============================================================
let breathingCountdownTimer = null;
let breathingPhaseTimeout = null;
let breathingEndTime = 0;

function openBreathing() {
    ensureAudioContext();

    if (!isPaused && document.getElementById("play-pause-btn")) {
        togglePlayPause();
    }

    resetBreathingUI();
    const overlay = document.getElementById("breathing-overlay");
    overlay.classList.add("active");
    overlay.style.display = "flex";
}

function closeBreathing() {
    stopBreathing();
    const overlay = document.getElementById("breathing-overlay");
    overlay.classList.remove("active");
    overlay.style.display = "none";
}

function resetBreathingUI() {
    document.getElementById("breathing-setup").style.display = "block";
    document.getElementById("breathing-visual-wrap").style.display = "none";
    document.getElementById("breathing-visual").classList.remove("inhale");
    document.getElementById("breathing-phase-label").innerText = "Ready";
    document.getElementById("breathing-time-left").innerText = "";
}

function startBreathing() {
    const minutes = Number(document.getElementById("breathing-duration").value) || 2;
    breathingEndTime = Date.now() + minutes * 60 * 1000;

    document.getElementById("breathing-setup").style.display = "none";
    document.getElementById("breathing-visual-wrap").style.display = "block";

    runBreathingPhase("in");
    breathingCountdownTimer = setInterval(updateBreathingCountdown, 1000);
}

function runBreathingPhase(phase) {
    if (Date.now() >= breathingEndTime) { stopBreathing(); return; }

    const visual = document.getElementById("breathing-visual");
    const label = document.getElementById("breathing-phase-label");

    if (phase === "in") {
        label.innerText = "Breathe In";
        visual.classList.add("inhale");
        playBeep(660, 180, 0.12);
        breathingPhaseTimeout = setTimeout(() => runBreathingPhase("out"), 5000);
    } else {
        label.innerText = "Breathe Out";
        visual.classList.remove("inhale");
        playBeep(330, 180, 0.12);
        breathingPhaseTimeout = setTimeout(() => runBreathingPhase("in"), 5000);
    }
}

function updateBreathingCountdown() {
    const remaining = Math.max(0, Math.round((breathingEndTime - Date.now()) / 1000));
    const m = Math.floor(remaining / 60);
    const s = remaining % 60;
    const timeEl = document.getElementById("breathing-time-left");
    if (timeEl) timeEl.innerText = `${m}:${s < 10 ? "0" + s : s} left`;
    if (remaining <= 0) stopBreathing();
}

function stopBreathing() {
    clearTimeout(breathingPhaseTimeout);
    clearInterval(breathingCountdownTimer);
    resetBreathingUI();
}

// ============================================================
// TIMER CONTROLS
// ============================================================
function togglePlayPause() {
    ensureAudioContext();
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
        if (elapsed >= timePassedForSteps) {
            playBeep(); // the exercise or rest timer just hit zero
            goToNextStep();
        }
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
        saveTimedWorkoutSession(workout);
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

// Steps back to the previous exercise/rest and resets the timer to the
// start of it, so the countdown for that step runs in full again.
function previousStep() {
    if (currentStep <= 0) return;
    currentStep--;
    elapsed = steps.slice(0, currentStep).reduce((acc, s) => acc + s.duration, 0);
    renderTimedSteps();
}