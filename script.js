let currentCategory = ""; // Tracks which workout we are currently looking at
let workoutTimer;
let isPaused = true; // Start paused
let currentStep = 0;
let elapsed = 0;
let steps = []; // Keep this global so skipStep can see it

// 1. The Greeting Logic
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

function resetWorkoutEngine() {
    window.scrollTo(0, 0);
    clearInterval(workoutTimer);
    currentStep = 0;
    elapsed = 0;
    isPaused = true;

    // Hide the timer components by default during a reset
    const timerCont = document.querySelector(".timer-container");
    const controls = document.querySelector(".workout-controls");
    if (timerCont) timerCont.style.display = "none";
    if (controls) controls.style.display = "none";
    
    // Reset the play button look
    const playBtn = document.getElementById("play-pause-btn");
    if (playBtn) playBtn.innerHTML = "&#9658;";

    // Reset the progress bar
    const progressBar = document.getElementById("progress");
    if (progressBar) progressBar.style.width = "0%";
}

function filterWorkouts(category) {
    currentCategory = category; // Save this so the toggle knows what to refresh
    resetWorkoutEngine();

    // Check if the user wants "Timed" mode (Declared ONCE globally for this function scope)
    const isTimedMode = document.getElementById("mode-toggle").checked;
    const modeLabel = document.getElementById("mode-label");
    
    // Update the label text based on toggle
    if (modeLabel) modeLabel.innerText = isTimedMode ? "Timed Mode" : "List Mode";

    const overlay = document.getElementById("workout-overlay");
    const content = document.getElementById("overlay-content");
    const overlayTitle = document.getElementById("overlay-title");

    let title = "";
    let exercises = "";

    // This handles all your buttons in one place
    switch(category.toLowerCase()) {
        case 'morning':
            title = "Morning Mobility";
            exercises = `
            <div class="set-counter">x 5 each side or x 10 per move</div>
        
            <div class="workout-block">
            <span class="block-title">FLOW 15 min</span>
            <p><strong>1.</strong> Wrist Circles <span class="tip-icon" onclick="alert('Slow circles; feel the stretch in the forearm.')">ⓘ</span></p>
            <p><strong>2.</strong> Neck Circles</p>
            <p><strong>3.</strong> Toe Flex & Splay</p>
            <p><strong>4.</strong> Standing Hip Circles to Forward Fold</p>
            <p><strong>5.</strong> Squat to Overhead Reach</p>
            <p><strong>6.</strong> 90/90 Hip Flow to Lunge with Twist</p>
            <p><strong>7.</strong> Greatest Stretch Lunge to hamstring stretch with Arm Sweep</p>
            <p><strong>8.</strong> Hindu Push Ups</p>
            <p><strong>9.</strong> Cossack Squat to Side Reach</p>
            <p><strong>10.</strong> Dynamic Frog Pose to Thoracic Bridge</p>
            <p><strong>11.</strong> Standing Side Bend to Back Bend</p>
            </div>

            <div class="workout-link-container">
            <p style="text-align:center; font-size: 0.85rem; color: #888; margin: 0;">
            Ready for the timed section?
            </p>
            <button class="link-btn" onclick="startMorningTimed()">
            Start: Balance & Sweat <span>&#9658;</span>
            </button>
            </div>
            `;
            // Ensure timer elements are hidden for the Flow part
            document.querySelector(".timer-container").style.display = "none";
            document.querySelector(".workout-controls").style.display = "none";
        break;

        case 'upper body':
            if (isTimedMode) {
                startUpperBody(); 
                return; // Exit here so the engine takes over
            } else {
                resetWorkoutEngine(); // Kill any active timers/intervals
                document.querySelector(".timer-container").style.display = "none";
                document.querySelector(".workout-controls").style.display = "none";
                
                title = "Upper Body Strength";
                exercises = `
                    <div class="set-counter">Manual Checklist Mode</div>
                    <div class="workout-block">
                        <span class="block-title">WARM UP</span>
                        <p><strong>1.</strong> Quadruped Step-through x 20</p>
                        <p><strong>2.</strong> Karaoke Drill</p>
                        <p><strong>3.</strong> Skater Squat x 10/leg</p>
                        <p><strong>4.</strong> Hindu Pushups x 10</p>
                        <p><strong>5.</strong> Windmills x 20</p>
                        <p><strong>6.</strong> Turkish Get Up x 3/side</p>
                    </div>
                    <div class="workout-block">
                        <span class="block-title">Main Set A x 2</span>
                        <p><strong>1.</strong> Pull-ups to Knee Raise x 5</p>
                        <p><strong>2.</strong> Push-up to Dumbell Row x 5/side</p>
                        <p><strong>3.</strong> Hammer Curl to Arnold Press x 5</p>
                        <p><strong>4.</strong> Floor Bridge with Chest Fly x 10/side</p>
                        <p><strong>5.</strong> Y-Raise - 40s on 20s off</p>
                    </div>
                    <div class="workout-block">
                        <span class="block-title">Main Set B x 2</span>
                        <p><strong>1.</strong> Hand Release Push-up to Downward Dog - 40/20s on/off</p>
                        <p><strong>2.</strong> Overhead Dumbell Press to Lateral and Front Raises - 40/20s on/off</p>
                        <p><strong>3.</strong> Single-leg Dumbell Row - 40/20s on/off</p>
                        <p><strong>4.</strong> Bicep Curl x 5</p>
                    </div>
                    <div class="workout-block">
                        <span class="block-title">COOL DOWN</span>
                        <p><strong>1.</strong> Child's Pose with side stretch 30s/side</p>
                        <p><strong>2.</strong> Seated Forward Fold 45s</p>
                        <p><strong>3.</strong> Chest Opener Stretch 30s/side</p>
                        <p><strong>4.</strong> Supine Figure Four Stretch 30s/side</p>
                    </div>
                `;
            }
        break;

        case 'lower body':
            title = "Lower Body";
            exercises = `
            <div class="set-counter">Strength is a skill</div>

            <div class="workout-block">
            <span class="block-title">WARM UP 5-7 min</span>
            <p><strong>1.</strong> World's greatest stretch</p>
            <p><strong>2.</strong> Inchworm walk</p>
            <p><strong>3.</strong> M-Drill / Leg Swings</p>
            <p><strong>4.</strong> Reach and Roll</p>
            <p><strong>5.</strong> Slender Lateral Drop</p>
            </div>
        
            <div class="workout-block">
            <span class="block-title">MAIN x 3</span>
            <p><strong>1.</strong> Squat & Power Superset</p>
            <p> Goblet Sumo Squats (Heavy)</p>
            <p> Monster Walks</p>
            <p><strong>2.</strong> Posterior Chain Superset</p>
            <p> Dumbell Romanian Deadlift</p>
            <p> Nordic Leans</p>
            <p> Single-leg Deadlift</p>
            <p><strong>3.</strong> Nordic & Glute Focus</p>
            <p> Reverse Nordics</p>
            <p> Weighted Single Leg Glute Bridges</p>
            </div>

                <div class="workout-block">
            <span class="block-title">COOL DOWN - 45s each</span>
            <p><strong>1.</strong> Kneeling Hamstring Stretch</p>
            <p><strong>2.</strong> Hip Flexor Stretch</p>
            <p><strong>3.</strong> Seated Butterfly Stretch</p>
            <p><strong>4.</strong> Pidgeon Pose</p>
            <p><strong>5.</strong> Child's Pose</p>
            </div>

                <div class="workout-link-container">
                <button class="link-btn" onclick="filterWorkouts('core control')">
                    Next: Core Control <span>→</span>
                </button>
            </div>
            `;
            break;

        case 'core rotation':
            if (isTimedMode) {
                startCoreRotation(); 
                return; // Exit here so the engine takes over
            } else {
                resetWorkoutEngine(); // Kill any active timers/intervals
                document.querySelector(".timer-container").style.display = "none";
                document.querySelector(".workout-controls").style.display = "none";
                
                title = "Core Rotation 15 min";
                exercises = `
                    <div class="set-counter">Manual Checklist Mode</div>
                    <div class="workout-block">
                        <span class="block-title">WARM UP</span>
                        <p><strong>1.</strong> Torso twists - 60s</p>
                        <p><strong>2.</strong> Cat cow - 60s</p>
                        <p><strong>3.</strong> Standing side bends - 60s</p>
                    </div>
                    <div class="workout-block">
                        <span class="block-title">WORKOUT</span>
                        <p><strong>1.</strong> Twisting Planks → Side Plank - 2m 30s</p>
                        <p><strong>2.</strong> Russian Twists - 2m 30s</p>
                        <p><strong>3.</strong> Starfish Crunch - 2min 30s</p>
                        <p><strong>4.</strong> Side Plank with Hip Dips - 1min 15s/side</p>
                    </div>
                    <div class="workout-block">
                        <span class="block-title">COOL DOWN</span>
                        <p><strong>1.</strong> Supine Twists - 1min/side</p>
                    </div>
                `;
            }
        break;

        case 'core control':
            startCoreControl(); 
            document.getElementById("workout-overlay").style.display = "flex";
            document.querySelector(".timer-container").style.display = "flex";
            document.querySelector(".workout-controls").style.display = "flex";
            return;

        case 'mobility side':
            title = "Mobility";
            exercises = `
            <div class="set-counter">Quality Full ROM | 2 - 3 SETS</div>

            <div class="workout-block">
                <p><strong>A1.</strong> Crawl 1 min</p>
                <p><strong>A2.</strong> Duck Walk 1 min</p>
            </div>

            <div class="workout-block">
                <p><strong>B1.</strong> Horse Stance 60 s</p>
                <p><strong>B2.</strong> Bridge Push Up x 5</p>
            </div>

            <div class="workout-block">
                <p><strong>C1.</strong> Shoulder Rolls x 10</p>
                <p><strong>C2.</strong> ATG Split Squat x 10 ea</p>
            </div>
            `;
            break;

        case 'strength side':
            title = "Strength";
            exercises = `
            <div class="set-counter">Strength is a skill | 2 - 3 SETS</div>
            
            <div class="workout-block">
                <p><strong>A1.</strong> Push ups x 5-10</p>
                <p><strong>A2.</strong> Broad Jumps x 5</p>
            </div>

            <div class="workout-block">
                <p><strong>B1.</strong> Pull Ups x 5-10</p>
                <p><strong>B2.</strong> Split Squat x 5-8</p>
            </div>

            <div class="workout-block">
                <p><strong>C1.</strong> Cossack Squat x 3-4/side </p>
                <p><strong>C2.</strong> Good mornings x 8</p>
            </div>
            `;
            break;

        case 'evening':
            title = "Evening Calm";
            exercises = `
            <div class="set-counter">Long easy breathes</div>
        
            <div class="workout-block"> <p><strong>1.</strong> Ankle rolls</p>
                <p><strong>2.</strong> Wrist rotations</p>
                <p><strong>3.</strong> Hands open and close</p>
                <p><strong>4.</strong> Shouler shrugs</p>
                <p><strong>5.</strong> Neck rolls</p>
                <p><strong>6.</strong> Forward fold sway</p>
                <p><strong>7.</strong> Windshield wipers</p>
                <p><strong>8.</strong> Legs up wall</p>
                <p><strong>9.</strong> Happy baby</p>
                <p><strong>10.</strong> Supine twist</p>
                <p><strong>11.</strong> Child's pose</p>
                </div>
            `;
            break;

        default:
            const timerCont = document.querySelector(".timer-container");
            const controls = document.querySelector(".workout-controls");
            if (timerCont) timerCont.style.display = "none";
            if (controls) controls.style.display = "none";

            title = "MUVE Workout";
            exercises = "<p>Select a category to begin.</p>";
    }

    if (title !== "") overlayTitle.innerText = title;
    if (exercises !== "") content.innerHTML = exercises;

    // Show the overlay
    overlay.classList.add("active");
    overlay.style.display = "flex";
}

function closeWorkout() {
    const overlay = document.getElementById("workout-overlay");
    overlay.style.display = "none";

    clearInterval(workoutTimer);
    resetWorkoutEngine();

    document.getElementById("mode-toggle").checked = false;
    currentCategory = "";

    document.querySelector(".timer-container").style.display = "none";
    document.querySelector(".workout-controls").style.display = "none";
    document.getElementById("overlay-content").innerHTML = "";
}

// Only run the greeting on load
window.addEventListener('DOMContentLoaded', setGreeting);

function startCoreRotation() {
    resetWorkoutEngine();

    // Explicitly open the visual workspace container for timed workflows
    document.querySelector(".timer-container").style.display = "flex";
    document.querySelector(".workout-controls").style.display = "flex";

    const overlayTitle = document.getElementById("overlay-title");
    if (overlayTitle) overlayTitle.innerText = "Core Rotation (15 Min)";
    
    steps = [
        { cat: "WARM UP", name: "Torso Twists", duration: 60 },
        { cat: "WARM UP", name: "Rest", duration: 15 },
        { cat: "WARM UP", name: "Cat-Cow", duration: 60 },
        { cat: "WARM UP", name: "Rest", duration: 15 },
        { cat: "WARM UP", name: "Standing Side Bends", duration: 60 },
        { cat: "WARM UP", name: "Rest", duration: 15 },
        { cat: "MAIN WORK", name: "Twisting Planks → Side Plank", duration: 150, tip: "Slow transitions, 2 second hold in side plank, focus on rib-to-pelvis control."},
        { cat: "MAIN WORK", name: "Rest", duration: 15 },
        { cat: "MAIN WORK", name: "Russian Twists", duration: 150, tip: "Lean back until core engages; keep chest proud. Exhale with each twist"},
        { cat: "MAIN WORK", name: "Rest", duration: 15 },
        { cat: "MAIN WORK", name: "Starfish Crunch", duration: 150, tip: "Long reach, no momentum, think diagonal compression" },
        { cat: "MAIN WORK", name: "Rest", duration: 15 },
        { cat: "MAIN WORK", name: "Side Plank with Hip Dips (L)", duration: 75, tip: "Small range, constant tension" },
        { cat: "MAIN WORK", name: "Rest", duration: 5 },
        { cat: "MAIN WORK", name: "Side Plank with Hip Dips (R)", duration: 75, tip: "Small range, constant tension" },
        { cat: "MAIN WORK", name: "Rest", duration: 15 },
        { cat: "COOL DOWN", name: "Supine Twists", duration: 120 }
    ];

    updateUI(); 
}

function startCoreControl() {
    resetWorkoutEngine();

    const overlayTitle = document.getElementById("overlay-title");
    if (overlayTitle) overlayTitle.innerText = "Core Control (15 Min)";
    
    steps = [
        { cat: "WARM UP", name: "Dynamic Plank → Downward Dog", duration: 120, tip: "Keep it smooth" },
        { cat: "WARM UP", name: "Rest", duration: 5 },
        { cat: "WARM UP", name: "Cat-Cow", duration: 60, tip: "Comfortable range" },
        { cat: "WARM UP", name: "Rest", duration: 15 },
        { cat: "MAIN WORK", name: "Bicycle Crunches", duration: 120, tip: "Slow elbow-to-knee, pause briefly at contact" },
        { cat: "MAIN WORK", name: "Rest", duration: 15 },
        { cat: "MAIN WORK", name: "Twisting Bear Crawl", duration: 120, tip: "Knees low, spine quiet, 'hips steady, ribs rotate'" },
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
    ];

    updateUI(); 
}

function startMorningTimed() {
    document.querySelector(".timer-container").style.display = "flex";
    document.querySelector(".workout-controls").style.display = "flex";
    
    resetWorkoutEngine();

    steps = [
        { cat: "BALANCE", name: "One Leg Arm Circles (L)", duration: 60 },
        { cat: "BALANCE", name: "One Leg Arm Circles (R)", duration: 60 },
        { cat: "BALANCE", name: "One Leg Toes Clock Reaches (L)", duration: 60 },
        { cat: "BALANCE", name: "One Leg Toes Clock Reaches (R)", duration: 60 },
        { cat: "REST", name: "Get the Heart Rate Going", duration: 15 },
        { cat: "SWEATY", name: "Toe Touches (30s) | Bicycle (30s)", duration: 60 },
        { cat: "SWEATY", name: "Push Ups", duration: 60 },
        { cat: "SWEATY", name: "Horse Stance with Side Bends", duration: 60 },
        { cat: "SWEATY", name: "Plank", duration: 60 },
        { cat: "SWEATY", name: "Pistol Squat (30s/side)", duration: 60 },
        { cat: "SWEATY", name: "Crawl", duration: 60 }
    ];

    updateUI();
}

function updateUI() {
    const content = document.getElementById("overlay-content");
    let html = `<div class="workout-list">`;
    let lastCategory = "";

    steps.forEach((step, index) => {
        if (step.name === "Rest" && index < currentStep) return;

        if (step.cat !== lastCategory) {
            html += `<h3 class="workout-section-title">${step.cat}</h3>`;
            lastCategory = step.cat;
        }

        let status = index === currentStep ? 'active' : (index < currentStep ? 'completed' : '');
        if (step.name === "Rest") status += " rest";
        
        let mins = Math.floor(step.duration / 60);
        let secs = step.duration % 60;
        let timeDisplay = mins > 0 ? `${mins}m ${secs < 10 ? '0'+secs : secs}s` : `${secs}s`;

        const techNote = (step.tip && status === 'active') 
    ? `<div class="tech-note"><strong>Tip:</strong> ${step.tip}</div>` 
    : '';

        html += `<div class="exercise-item ${status}">
                    <div class="exercise-info-wrapper">
                        <span class="step-name">${step.name}</span>
                        ${techNote}
                    </div>
                    <span class="step-time">${timeDisplay}</span>
                 </div>`;
    });
    
    html += `</div>`; 
    content.innerHTML = html;

    const tipElement = document.getElementById("active-tip");
    if (tipElement && steps[currentStep]) {
        if (steps[currentStep].name === "Rest") {
            tipElement.innerText = "Recover & Prep for next move";
        } else {
            tipElement.innerText = steps[currentStep].tip || "Keep your form tight!";
        }
    }
}

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
        if (progressBar) {
            progressBar.style.width = (elapsed / totalTime) * 100 + "%";
        }

        const countdownEl = document.getElementById("timer-countdown");
        if (countdownEl) {
            let timeAtEndOfCurrentStep = steps.slice(0, currentStep + 1).reduce((acc, s) => acc + s.duration, 0);
            let secondsLeftInStep = timeAtEndOfCurrentStep - elapsed;

            let m = Math.floor(secondsLeftInStep / 60);
            let s = secondsLeftInStep % 60;
            countdownEl.innerText = `${m}:${s < 10 ? '0' + s : s}`;
        }

        let timePassedForSteps = steps.slice(0, currentStep + 1).reduce((acc, s) => acc + s.duration, 0);
        if (elapsed >= timePassedForSteps) {
            goToNextStep();
        }
    }, 1000);
}

function skipStep() {
    let timeToEndOfCurrent = steps.slice(0, currentStep + 1).reduce((acc, s) => acc + s.duration, 0);
    elapsed = timeToEndOfCurrent;
    goToNextStep();
}

function goToNextStep() {
    currentStep++;
    if (currentStep >= steps.length) {
        clearInterval(workoutTimer);
        document.getElementById("overlay-content").innerHTML = `
            <div style="text-align:center; padding: 50px;">
                <h2>Workout Complete!</h2>
                <button class="filter-btn" onclick="closeWorkout()">Finish</button>
            </div>`;
    } else {
        updateUI();
    }
}

function startUpperBody() {
    resetWorkoutEngine();
    document.querySelector(".timer-container").style.display = "flex";
    document.querySelector(".workout-controls").style.display = "flex";

    const overlayTitle = document.getElementById("overlay-title");
    if (overlayTitle) overlayTitle.innerText = "Upper Body Strength";

    const content = document.getElementById("overlay-content");
    content.innerHTML = `<div class="set-counter">Tense your core and crush those weights</div>`;
    
    const warmup = [
        { cat: "WARM UP", name: "Quadruped Step-through x 20", duration: 60, tip: "Keep it smooth" },
        { cat: "WARM UP", name: "Rest", duration: 10 },
        { cat: "WARM UP", name: "Karaoke Drill - small a big spins", duration: 60, tip: "Comfortable range" },
        { cat: "WARM UP", name: "Rest", duration: 15 },
        { cat: "WARM UP", name: "Skater Squat x 10/leg", duration: 60, tip: "Comfortable range" },
        { cat: "WARM UP", name: "Rest", duration: 15 },
        { cat: "WARM UP", name: "Hindu Pushup x 10", duration: 60, tip: "Comfortable range" },
        { cat: "WARM UP", name: "Rest", duration: 20 },
        { cat: "WARM UP", name: "Windmills x 20", duration: 60, tip: "Comfortable range" },
        { cat: "WARM UP", name: "Rest", duration: 20 },
        { cat: "WARM UP", name: "Turkish Get Up x 3/side", duration: 90, tip: "Comfortable range" },
        { cat: "WARM UP", name: "Rest", duration: 120 },
    ];
    const blockA = [
        { cat: "BLOCK A", name: "Pull-up to Knee Raise x 5", duration: 60, tip: "Slow elbow-to-knee, pause briefly at contact" },
        { cat: "BLOCK A", name: "Rest", duration: 15 },
        { cat: "BLOCK A", name: "Push-up to Dumbell Row x 5/side", duration: 60, tip: "Knees low, spine quiet, 'hips steady, ribs rotate'" },
        { cat: "BLOCK A", name: "Rest", duration: 15 },
        { cat: "BLOCK A", name: "Hammer Curl to Arnold Press x 5", duration: 60, tip: "Alternate sides each rep, control the lowering phase" },
        { cat: "BLOCK A", name: "Rest", duration: 15 },
        { cat: "BLOCK A", name: "Floor Bridge with Chest Fly x 10", duration: 60, tip: "Reduce speed if hips sway" },
        { cat: "BLOCK A", name: "Rest", duration: 15 },
        { cat: "BLOCK A", name: "Y Raise - 40s on 20s off", duration: 40, tip: "Small, deliberate rotations only" },
        { cat: "BLOCK A", name: "Rest", duration: 120 },
    ];
    const blockB = [
        { cat: "BLOCK B", name: "Hand Release Push-up to Downward Dog - 40s", duration: 40, tip: "Small, deliberate rotations only" },
        { cat: "BLOCK B", name: "Rest", duration: 20 },
        { cat: "BLOCK B", name: "Overhead Dumbell Press to Lateral and Front Raises - 40s", duration: 40, tip: "Small, deliberate rotations only" },
        { cat: "BLOCK B", name: "Rest", duration: 20 },
        { cat: "BLOCK B", name: "Single-leg Dumbell Row - 40s", duration: 40, tip: "Small, deliberate rotations only" },
        { cat: "BLOCK B", name: "Rest", duration: 20 },
        { cat: "BLOCK B", name: "Bicep Curl x 5", duration: 40, tip: "Small, deliberate rotations only" },
        { cat: "BLOCK B", name: "Rest", duration: 120 },
    ];
    const cooldown = [
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
    ];

    steps = [...warmup, ...blockA, ...blockA, ...blockB, ...blockB, ...cooldown];
    openOverlay("Upper Body Strength"); 
    updateUI();                         
}

function openOverlay(title) {
    const overlay = document.getElementById("workout-overlay");
    const timerCont = document.querySelector(".timer-container");
    const controls = document.querySelector(".workout-controls");

    if (overlay) overlay.style.display = "flex";
    if (timerCont) timerCont.style.display = "flex";
    if (controls) controls.style.display = "flex";

    const overlayTitle = document.getElementById("overlay-title");
    if (overlayTitle) overlayTitle.innerText = title;
}

function refreshWorkoutView() {
    if (currentCategory !== "") {
        filterWorkouts(currentCategory);
    }
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