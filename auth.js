// auth.js — Firebase Auth + Firestore, wired to plain global functions so
// the rest of the app (inline onclick="...") can call them without knowing
// anything about Firebase or modules.
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import {
    getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
    sendPasswordResetEmail, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";
import {
    getFirestore, collection, doc, addDoc, deleteDoc, updateDoc, getDocs,
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
    } else {
        if (loginBtn) loginBtn.style.display = "inline-flex";
        if (profileChip) profileChip.style.display = "none";
        window.customExercisesByCategory = {};
        window.customWorkouts = [];
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

window.addCustomExercise = async function (category, name, duration, tip) {
    if (!currentUser) { alert("Sign in first to add your own exercises."); return; }
    await addDoc(collection(db, "users", currentUser.uid, "customExercises"), {
        category,
        name,
        duration: Number(duration) || 40,
        tip: tip || "",
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
// Each doc: { title, subtitle, steps: [{ id, cat, name, duration, tip }] }
// ============================================================
window.customWorkouts = [];

window.loadCustomWorkouts = async function () {
    if (!currentUser) { window.customWorkouts = []; return; }
    const snap = await getDocs(collection(db, "users", currentUser.uid, "customWorkouts"));
    window.customWorkouts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

window.createCustomWorkout = async function (title) {
    if (!currentUser) { alert("Sign in first to create your own workout."); return null; }
    const ref = await addDoc(collection(db, "users", currentUser.uid, "customWorkouts"), {
        title,
        subtitle: "Your custom workout",
        steps: [],
        createdAt: serverTimestamp()
    });
    await window.loadCustomWorkouts();
    return ref.id;
};

window.deleteCustomWorkout = async function (workoutId) {
    if (!currentUser) return;
    await deleteDoc(doc(db, "users", currentUser.uid, "customWorkouts", workoutId));
    await window.loadCustomWorkouts();
};

window.addStepToCustomWorkout = async function (workoutId, step) {
    if (!currentUser) return;
    const workout = window.customWorkouts.find(w => w.id === workoutId);
    if (!workout) return;
    const newSteps = [...(workout.steps || []), step];
    await updateDoc(doc(db, "users", currentUser.uid, "customWorkouts", workoutId), { steps: newSteps });
    await window.loadCustomWorkouts();
};

window.removeStepFromCustomWorkout = async function (workoutId, stepId) {
    if (!currentUser) return;
    const workout = window.customWorkouts.find(w => w.id === workoutId);
    if (!workout) return;
    const newSteps = (workout.steps || []).filter(s => s.id !== stepId);
    await updateDoc(doc(db, "users", currentUser.uid, "customWorkouts", workoutId), { steps: newSteps });
    await window.loadCustomWorkouts();
};