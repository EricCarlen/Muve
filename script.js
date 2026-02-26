const workouts = [
    { name: "Lower Body Burn", category: "Lower Body", timeOfDay: "morning" },
    { name: "Glute Activation", category: "Lower Body", timeOfDay: "evening" },
    { name: "Push & Pull", category: "Upper Body", timeOfDay: "morning" },
    { name: "Shoulder Mobility", category: "Upper Body", timeOfDay: "evening" },
    { name: "Abs Foundation", category: "Core A", timeOfDay: "morning" },
    { name: "Plank Series", category: "Core A", timeOfDay: "evening" },
    { name: "Oblique Focus", category: "Core B", timeOfDay: "morning" },
    { name: "Deep Core Work", category: "Core B", timeOfDay: "evening" },
    { name: "Flow & Flex", category: "Body Mobility", timeOfDay: "morning" },
    { name: "Joint Health", category: "Body Mobility", timeOfDay: "evening" },
    { name: "Total Body Power", category: "Body Strength", timeOfDay: "morning" },
    { name: "Functional Strength", category: "Body Strength", timeOfDay: "evening" }
];

function displayWorkouts(filter = 'all') {
    const hour = new Date().getHours();
    const greetingElement = document.getElementById("greeting");
    const container = document.getElementById("workout-container");

    // 1. GREETING LOGIC: Remains dependent on time of day
    let message = "";
    if (hour >= 3 && hour < 11) message = "Morning (Cheeky wink...)";
    else if (hour >= 11 && hour < 14) message = "Goodonya, I just love food";
    else if (hour >= 14 && hour < 18) message = "What a blooming marvelous afternoon we find ourselves in";
    else message = "Sometimes I sits and thinks, sometimes I just sits";

    if (greetingElement) {
        greetingElement.innerText = message;
    }

    // 2. Clear the container
    container.innerHTML = ""; 

    // 3. FILTER LOGIC: Purely manual (not dependent on current time)
    workouts.forEach(workout => {
        // This checks if the workout category OR time matches the button clicked
        const matchesCategory = (filter === 'all' || 
                                 workout.category.toLowerCase() === filter.toLowerCase() || 
                                 workout.timeOfDay.toLowerCase() === filter.toLowerCase());

        if (matchesCategory) {
            const card = document.createElement("div");
            card.className = "card";
            card.innerHTML = `
                <h3>${workout.name}</h3>
                <p>${workout.category.toUpperCase()} | ${workout.timeOfDay.toUpperCase()}</p>
            `;
            container.appendChild(card);
        }
    });
}

function filterWorkouts(category) {
    const overlay = document.getElementById("workout-overlay");
    const content = document.getElementById("overlay-content");
    
    // 1. Check if we clicked 'morning' or 'evening' (for a list)
    if (category.toLowerCase() === 'morning' || category.toLowerCase() === 'evening') {
        const list = workouts.filter(w => w.timeOfDay.toLowerCase() === category.toLowerCase());
        
        content.innerHTML = `
            <p style="text-transform: uppercase; letter-spacing: 2px;">${category} Session</p>
            <div style="text-align: left; margin-top: 20px;">
                ${list.map(w => `<p style="border-bottom: 1px solid #eee; padding: 10px 0;">• ${w.name}</p>`).join('')}
            </div>
        `;
    } 
    // 2. Otherwise, show the single category workout
    else {
        const selectedWorkout = workouts.find(w => w.category.toLowerCase() === category.toLowerCase());
        if (selectedWorkout) {
            content.innerHTML = `
                <p style="text-transform: uppercase; font-size: 0.7rem; color: #666;">${selectedWorkout.category}</p>
                <h1>${selectedWorkout.name}</h1>
                <div style="border-top: 2px solid black; width: 40px; margin: 20px auto;"></div>
                <p>Ready to muve?</p>
            `;
        }
    }

    overlay.classList.add("active");
}

// 4. Add this brand new function to handle the BACK button
function closeWorkout() {
    const overlay = document.getElementById("workout-overlay");
    overlay.classList.remove("active");
}

// Start the app - will show all workouts initially
window.addEventListener('DOMContentLoaded', () => {
    displayWorkouts();
});