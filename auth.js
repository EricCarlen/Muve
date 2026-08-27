// auth.js — Firebase Auth + Firestore, wired to plain global functions so
// the rest of the app (inline onclick="...") can call them without knowing
// anything about Firebase or modules.
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import {
    getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
    sendPasswordResetEmail, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";
import {
    getFirestore, collection, doc, addDoc, deleteDoc, updateDoc, setDoc, getDoc, getDocs,
    query, orderBy, limit, serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentUser = null;

// Custom exercises, grouped by workout category key (e.g. "upper body").
// script.js reads this directly when building each workout's step list.
window.customExercisesByCategory = {};

// ============================================================
// AUTH — email + password
// ============================================================
// Turns Firebase's error codes (e.g. "auth/wrong-password") into
// something a person can actually read.
function friendlyAuthError(err) {
    const map = {
        "auth/email-already-in-use": "That email already has an account. Try signing in instead.",
        "auth/invalid-email": "That doesn't look like a valid email address.",
        "auth/weak-password": "Password needs to be at least 6 characters.",
        "auth/wrong-password": "Incorrect password.",
        "auth/user-not-found": "No account found with that email.",
        "auth/invalid-credential": "Incorrect email or password.",
        "auth/too-many-requests": "Too many attempts — please wait a bit and try again."
    };
    return map[err.code] || err.message;
}

window.signUpWithEmail = async function (email, password) {
    try {
        await createUserWithEmailAndPassword(auth, email, password);
        return { ok: true };
    } catch (err) {
        return { ok: false, message: friendlyAuthError(err) };
    }
};

window.signInWithEmail = async function (email, password) {
    try {
        await signInWithEmailAndPassword(auth, email, password);
        return { ok: true };
    } catch (err) {
        return { ok: false, message: friendlyAuthError(err) };
    }
};

window.resetPassword = async function (email) {
    try {
        await sendPasswordResetEmail(auth, email);
        return { ok: true };
    } catch (err) {
        return { ok: false, message: friendlyAuthError(err) };
    }
};

window.signOutUser = async function () {
    await signOut(auth);
};

window.isSignedIn = function () {
    return !!currentUser;
};

onAuthStateChanged(auth, async (user) => {
    currentUser = user;

    const loginBtn = document.getElementById("login-btn");
    const profileChip = document.getElementById("profile-btn");

    if (user) {
        if (loginBtn) loginBtn.style.display = "none";
        if (profileChip) {
            profileChip.style.display = "flex";
            document.getElementById("profile-name").innerText = user.email.split("@")[0];
        }
        await window.loadCustomExercises();
        await window.loadCustomWorkouts();
        await window.loadUserSettings();
    } else {
        if (loginBtn) loginBtn.style.display = "inline-flex";
        if (profileChip) profileChip.style.display = "none";
        window.customExercisesByCategory = {};
        window.customWorkouts = [];
        window.userSettings = {};
    }

    // Re-render whatever workout is currently open, now that sign-in
    // state (and custom content) may have changed, and refresh the
    // My Workouts grid to reflect the new sign-in state.
    if (typeof window.refreshWorkoutView === "function") window.refreshWorkoutView();
    if (typeof window.renderMyWorkoutsSection === "function") window.renderMyWorkoutsSection();
});

// ============================================================
// CUSTOM EXERCISES  (users/{uid}/customExercises)
// ============================================================
window.loadCustomExercises = async function () {
    if (!currentUser) return;
    const snap = await getDocs(collection(db, "users", currentUser.uid, "customExercises"));
    const byCategory = {};
    snap.forEach(docSnap => {
        const data = docSnap.data();
        if (!byCategory[data.category]) byCategory[data.category] = [];
        byCategory[data.category].push({ id: docSnap.id, ...data });
    });
    window.customExercisesByCategory = byCategory;
};

window.addCustomExercise = async function (category, name, duration, tip, reps) {
    if (!currentUser) { alert("Sign in first to add your own exercises."); return; }
    await addDoc(collection(db, "users", currentUser.uid, "customExercises"), {
        category,
        name,
        duration: Number(duration) || 40,
        tip: tip || "",
        reps: reps || "",
        createdAt: serverTimestamp()
    });
    await window.loadCustomExercises();
    if (typeof window.refreshWorkoutView === "function") window.refreshWorkoutView();
};

window.deleteCustomExercise = async function (id) {
    if (!currentUser) return;
    await deleteDoc(doc(db, "users", currentUser.uid, "customExercises", id));
    await window.loadCustomExercises();
    if (typeof window.refreshWorkoutView === "function") window.refreshWorkoutView();
};

// ============================================================
// SET / REP LOGS  (users/{uid}/logs)
// Kept for back-compat with any existing callers — workout history now
// goes through the WORKOUT HISTORY section below instead, which is what
// the workout-overlay's Previous/Today fields and history screens use.
// ============================================================
window.logSetEntry = async function (category, exerciseName, sets, reps, weight) {
    if (!currentUser) { alert("Sign in to save your sets & reps."); return; }
    await addDoc(collection(db, "users", currentUser.uid, "logs"), {
        category,
        exerciseName,
        sets: Number(sets) || 0,
        reps: Number(reps) || 0,
        weight: weight ? Number(weight) : null,
        date: new Date().toISOString().slice(0, 10),
        createdAt: serverTimestamp()
    });
};

window.getRecentLogs = async function () {
    if (!currentUser) return [];
    const q = query(
        collection(db, "users", currentUser.uid, "logs"),
        orderBy("createdAt", "desc"),
        limit(30)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data());
};

// ============================================================
// CUSTOM WORKOUTS  (users/{uid}/customWorkouts)
// Each doc: { title, subtitle, tags: [], defaultRest: number,
//             steps: [{ id, cat, name, mode, duration, reps, tip, restOverride }] }
// ============================================================
window.customWorkouts = [];

window.loadCustomWorkouts = async function () {
    if (!currentUser) { window.customWorkouts = []; return; }
    const snap = await getDocs(collection(db, "users", currentUser.uid, "customWorkouts"));
    window.customWorkouts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

// Creates a fully-formed workout from the builder (title, tags,
// defaultRest, and all its steps) in one write.
window.createCustomWorkoutFull = async function (payload) {
    if (!currentUser) { alert("Sign in first to create your own workout."); return null; }
    const ref = await addDoc(collection(db, "users", currentUser.uid, "customWorkouts"), {
        ...payload,
        createdAt: serverTimestamp()
    });
    await window.loadCustomWorkouts();
    return ref.id;
};

// Overwrites an existing workout with the builder's current state —
// used both for editing details and for reordering/adding/removing steps.
window.updateCustomWorkout = async function (workoutId, payload) {
    if (!currentUser) return;
    await updateDoc(doc(db, "users", currentUser.uid, "customWorkouts", workoutId), payload);
    await window.loadCustomWorkouts();
};

window.deleteCustomWorkout = async function (workoutId) {
    if (!currentUser) return;
    await deleteDoc(doc(db, "users", currentUser.uid, "customWorkouts", workoutId));
    await window.loadCustomWorkouts();
};

// ============================================================
// WORKOUT HISTORY  (users/{uid}/workoutHistory)
// One doc per completed session:
//   { workoutId, workoutTitle, durationSeconds, performance: [...], completedAt }
// `performance` is the array script.js's buildPerformanceEntries()
// builds — one entry per exercise/round the user actually logged a
// weight or rep count for:
//   { sectionName, round, totalRounds, exerciseId, exerciseName, weight, reps }
// ============================================================

// Called by script.js's finishAndSaveWorkout() (List mode) and
// saveTimedWorkoutSession() (Timed mode, on completion).
window.saveWorkoutSession = async function (sessionData) {
    if (!currentUser) return null;
    const ref = await addDoc(collection(db, "users", currentUser.uid, "workoutHistory"), {
        workoutId: sessionData.workoutId || null,
        workoutTitle: sessionData.workoutTitle || "Workout",
        durationSeconds: Number(sessionData.durationSeconds) || 0,
        performance: sessionData.performance || [],
        completedAt: serverTimestamp()
    });
    return ref.id;
};

// Powers the Workout History overview (7.1) — most recent sessions first.
window.loadWorkoutHistoryList = async function () {
    if (!currentUser) return [];
    const q = query(
        collection(db, "users", currentUser.uid, "workoutHistory"),
        orderBy("completedAt", "desc"),
        limit(50)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

// Powers the individual session detail view (7.2). Only used as a
// fallback — script.js already has the full record in memory from
// loadWorkoutHistoryList() in the common case.
window.loadWorkoutHistoryDetail = async function (sessionId) {
    if (!currentUser) return null;
    const snap = await getDoc(doc(db, "users", currentUser.uid, "workoutHistory", sessionId));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

// Looks at the user's most recent completed session for this specific
// workout and returns a map of "<round>::<exerciseId>" -> { weight, reps }
// so script.js can show "Previous: 20kg × 10 reps" against each exercise.
// Scans the last 20 sessions client-side for a workoutId match rather
// than a Firestore "where" query, so no composite index is required.
// Only the single most recent matching session is used — earlier ones
// remain visible via Workout History if the user wants to look further back.
window.loadPreviousPerformance = async function (workoutId) {
    if (!currentUser || !workoutId) return {};

    const q = query(
        collection(db, "users", currentUser.uid, "workoutHistory"),
        orderBy("completedAt", "desc"),
        limit(20)
    );
    const snap = await getDocs(q);

    for (const docSnap of snap.docs) {
        const data = docSnap.data();
        if (data.workoutId !== workoutId) continue;

        const map = {};
        (data.performance || []).forEach(entry => {
            if (!entry.exerciseId) return;
            map[`${entry.round}::${entry.exerciseId}`] = { weight: entry.weight, reps: entry.reps };
        });
        return map;
    }

    return {};
};

// ============================================================
// USER SETTINGS  (users/{uid} — a single doc)
// Currently just holds which workouts are visible on the My Workouts
// screen. A missing/undefined visibleWorkouts means "show everything."
// ============================================================
window.userSettings = {};

window.loadUserSettings = async function () {
    if (!currentUser) { window.userSettings = {}; return; }
    const snap = await getDoc(doc(db, "users", currentUser.uid));
    window.userSettings = snap.exists() ? snap.data() : {};
};

window.saveVisibleWorkouts = async function (visibleList) {
    if (!currentUser) return;
    await setDoc(doc(db, "users", currentUser.uid), { visibleWorkouts: visibleList }, { merge: true });
    window.userSettings.visibleWorkouts = visibleList;
};