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
    
    if (hour >= 3 && hour < 11) message = "Morning (Cheeky wink...)";
    else if (hour >= 11 && hour < 14) message = "Goodonya, I just love food";
    else if (hour >= 14 && hour < 18) message = "What a blooming marvelous afternoon";
    else message = "Sometimes I sits and thinks, sometimes I just sits";

    if (greetingElement) greetingElement.innerText = message;
}

function filterWorkouts(category) {
    // 1. Immediately snap to the top of the page/overlay
    window.scrollTo(0, 0);
    clearInterval(workoutTimer); // Stop any running timers from previous clicks

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
            <p><strong>1.</strong> Wrist Circles & Extensions</p>
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

            <div class="workout-block">
            <span class="block-title">BALANCE 4 min</span>
            <p><strong>1.</strong> One Leg arm circles 1 min/leg</p>
            <p><strong>2.</strong> One leg toes clock reaches 1 min/leg</p>
            </div>

            <div class="workout-block">
            <span class="block-title">SWEATY 6 min</span>
            <p><strong>1.</strong> Core - Toe Touches 30s | Bicycle 30s</p>
            <p><strong>2.</strong> Push ups 1 min</p>
            <p><strong>3.</strong> Horse Stance with side bends 1 min</p>
            <p><strong>4.</strong> Plank 1 min</p>
            <p><strong>5.</strong> Pistol Squat 30s/side</p>
            <p><strong>6.</strong> Crawl 1 min</p>
            </div>
            `;
            break;

        case 'upper body':
            title = "Upper Body";
            exercises = `
            <div class="set-counter">Tense your core and crush those weights</div>

            <div class="workout-block">
            <span class="block-title">WARM UP 5 - 7 min</span>
            <p><strong>1.</strong> Quadruped Step-through x 20</p>
            <p><strong>2.</strong> Karaoke Drill - small a big spins</p>
            <p><strong>2.</strong> Skater Squat x 10/leg</p>
            <p><strong>2.</strong> Hindu Pushup x 10</p>
            <p><strong>2.</strong> Windmills x 20</p>
            <p><strong>2.</strong> Turkish Get Up x 3/side</p>
            </div>
        
            <div class="workout-block">
            <span class="block-title">Set 1 - repeat x 2</span>
            <p><strong>1.</strong> Pull-up to Knee Raise x 5</p>
            <p><strong>2.</strong> Push-up to Dumbell Row x 5/side</p>
            <p><strong>3.</strong> Hammer Curl to Arnold Press x 5</p>
            <p><strong>4.</strong> Floor Bridge with Chest Fly x 10</p>
            <p><strong>5.</strong> Y Raise - 40s on 20s off</p>
            </div>

            <div class="workout-block">
            <span class="block-title">Set 2 - repeat x 2</span>
            <p><strong>1.</strong> Hand Release Push-up to Downward Dog - 40s</p>
            <p><strong>2.</strong> Overhead Dumbell Press to Lateral and Front Raises - 40s</p>
            <p><strong>3.</strong> Single-leg Dumbell Row - 40s</p>
            <p><strong>4.</strong> Bicep Curl x 5</p>
            </div>

            <div class="workout-block">
            <span class="block-title">COOL DOWN</span>
            <p><strong>1.</strong> Child's Pose with Side Stretch - 30s/side</p>
            <p><strong>2.</strong> Seated Forward Fold - 45s</p>
            <p><strong>2.</strong> Chest Opener Stretch - 30s/side</p>
            <p><strong>2.</strong> Supine Figure Four Stretch - 30s/side</p>
            </div>

            <div class="workout-link-container">
                <button class="link-btn" onclick="filterWorkouts('core rotation')">
                    Next: Core Rotation <span>→</span>
                </button>
            </div>
            `;
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
            <p><strong>2.</strong> Seated Butterfly Stretch</p>
            <p><strong>2.</strong> Pidgeon Pose</p>
            <p><strong>2.</strong> Child's Pose</p>
            </div>

                <div class="workout-link-container">
                <button class="link-btn" onclick="filterWorkouts('core control')">
                    Next: Core Control <span>→</span>
                </button>
            </div>
            `;
            break;

        case 'core rotation':
    // 1. Launch the timer engine (make sure this function name matches your engine)
        startCoreRotation(); 
    // 2. Manually show the overlay since we are bypassing the default text display
        document.getElementById("workout-overlay").style.display = "flex";
    // 3. 'return' is vital—it stops the function from trying to display empty title/exercises
        return;

        case 'core control':
            title = "Core Control 15 min";
            exercises = `
            <div class="set-counter">Integration & Dynamic Control - Post Lower Body</div>
        
            <div class="workout-block">
            <span class="block-title">WARM UP</span>
            <p><strong>1.</strong> Dynamic Plank → Downward Dog 2 min</p>
            <p><strong>2.</strong> Cat - Cow 1 min</p>
            </div>

            <div class="workout-block">
            <span class="block-title">MAIN WORK 10 min</span>
            <p><strong>1.</strong> Bicycle Crunches 2 min</p>
            <p><strong>2.</strong> Twisting Bear Crawl 2 min</p>
            <p><strong>3.</strong> Twisting V-Ups 2 min</p>
            <p><strong>4.</strong> Plank Shoulder Taps + Knee Twists 2 min</p>
            <p><strong>5.</strong> Twisting Hollow Body Hold 40s on/20s off</p>
            </div>

            <div class="workout-block">
            <span class="block-title">COOL DOWN</span>
            <p><strong>1.</strong> Child's Pose with side stretch 1 min/side</p>
            </div>
            `;
            break;

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
            title = "MUVE Workout";
            exercises = "<p>Select a category to begin.</p>";
    }
    // This only runs if the category wasn't 'core rotation'
    if (title !== "") overlayTitle.innerText = title;
    if (exercises !== "") content.innerHTML = exercises;
    
    overlay.style.display = "flex";
}

function closeWorkout() {
    // 1. Hide the overlay
    const overlay = document.getElementById("workout-overlay");
    overlay.style.display = "none";

    // 2. Stop the timer immediately so it doesn't keep running in the background
    clearInterval(workoutTimer);

    // 3. Reset the content so it's clean for the next time you open it
    document.getElementById("overlay-content").innerHTML = "";
}

// Only run the greeting on load
window.addEventListener('DOMContentLoaded', setGreeting);

function startCoreRotation() {
    // RESET GLOBAL STATE
    clearInterval(workoutTimer);
    currentStep = 0;
    elapsed = 0;
    isPaused = true;
    
    // Reset the Play button symbol when the workout starts
    const playBtn = document.getElementById("play-pause-btn");
    if (playBtn) playBtn.innerHTML = "&#9658;";

    const overlayTitle = document.getElementById("overlay-title");
    overlayTitle.innerText = "Core Rotation (15 Min)";
    
    // Update the global 'steps' array
    steps = [
        { cat: "WARM UP", name: "Torso Twists", duration: 60 },
        { cat: "WARM UP", name: "Rest", duration: 15 },
        { cat: "WARM UP", name: "Cat-Cow", duration: 60 },
        { cat: "WARM UP", name: "Rest", duration: 15 },
        { cat: "WARM UP", name: "Standing Side Bends", duration: 60 },
        { cat: "WARM UP", name: "Rest", duration: 15 },
        { cat: "MAIN WORK", name: "Twisting Planks → Side Plank", duration: 150 },
        { cat: "MAIN WORK", name: "Rest", duration: 15 },
        { cat: "MAIN WORK", name: "Russian Twists", duration: 150 },
        { cat: "MAIN WORK", name: "Rest", duration: 15 },
        { cat: "MAIN WORK", name: "Starfish Crunch", duration: 150 },
        { cat: "MAIN WORK", name: "Rest", duration: 15 },
        { cat: "MAIN WORK", name: "Side Plank with Hip Dips", duration: 150 },
        { cat: "MAIN WORK", name: "Rest", duration: 15 },
        { cat: "COOL DOWN", name: "Supine Twists", duration: 120 }
    ];

    updateUI(); // Draw the list for the first time
}

// 2. THE PAINTER (Draws the list)
function updateUI() { // ...and finds the definition HERE
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

        html += `<div class="exercise-item ${status}">
                    <span class="step-name">${step.name}</span>
                    <span class="step-time">${timeDisplay}</span>
                 </div>`;
    });
    
    html += `</div>`; // Close the backtick, THEN add the semicolon
    content.innerHTML = html;
}

function togglePlayPause() {
    const btn = document.getElementById("play-pause-btn");
    if (isPaused) {
        isPaused = false;
        // Use innerHTML so the browser "reads" the symbol code
        btn.innerHTML = "&#10074;&#10074;"; // Pause symbol ||
        startTicker();
    } else {
        isPaused = true;
        btn.innerHTML = "&#9658;"; // Play symbol >
        clearInterval(workoutTimer);
    }
}

function startTicker() {
    clearInterval(workoutTimer);
    workoutTimer = setInterval(() => {
        elapsed++;
        
        // 1. Overall Progress Bar
        const totalTime = steps.reduce((acc, s) => acc + s.duration, 0);
        const progressBar = document.getElementById("progress");
        if (progressBar) {
            progressBar.style.width = (elapsed / totalTime) * 100 + "%";
        }

        // 2. Step Countdown Logic
        const countdownEl = document.getElementById("timer-countdown");
        if (countdownEl) {
            // Calculate total time of all steps up to the current one
            let timeAtEndOfCurrentStep = steps.slice(0, currentStep + 1).reduce((acc, s) => acc + s.duration, 0);
            let secondsLeftInStep = timeAtEndOfCurrentStep - elapsed;

            let m = Math.floor(secondsLeftInStep / 60);
            let s = secondsLeftInStep % 60;
            countdownEl.innerText = `${m}:${s < 10 ? '0' + s : s}`;
        }

        // 3. Move to next step
        let timePassedForSteps = steps.slice(0, currentStep + 1).reduce((acc, s) => acc + s.duration, 0);
        if (elapsed >= timePassedForSteps) {
            goToNextStep();
        }
    }, 1000);
}

function skipStep() {
    // Jump 'elapsed' to the end of the current step
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