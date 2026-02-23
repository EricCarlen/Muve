// 1. DATA FIRST (The list of workouts)
const workouts = [
    // MORNING (3am - 11am)
    { name: "Sunrise Stretch", category: "Stretch", timeOfDay: "morning" },
    { name: "Primal Flow", category: "Animal Movement", timeOfDay: "morning" },
    { name: "Morning Core Wakeup", category: "Core", timeOfDay: "morning" },

    // MIDDAY (11am - 2pm)
    { name: "Lunchtime Leg Blast", category: "Lower Body", timeOfDay: "midday" },
    { name: "Office Desk Stretch", category: "Stretch", timeOfDay: "midday" },

    // AFTERNOON (2pm - 6pm)
    { name: "Afternoon Power", category: "Upper Body", timeOfDay: "afternoon" },
    { name: "Crawl & Climb", category: "Animal Movement", timeOfDay: "afternoon" },
    { name: "Core Strength II", category: "Core", timeOfDay: "afternoon" },

    // EVENING (6pm - 3am)
    { name: "Evening Zen", category: "Meditate", timeOfDay: "evening" },
    { name: "Deep Tissue Release", category: "Stretch", timeOfDay: "evening" },
    { name: "Nightly Reflection", category: "Meditate", timeOfDay: "evening" }
];

// 2. THE BRAIN (The function that does the work)
function displayWorkouts(filter = 'all') {
    const hour = new Date().getHours();
    // 1. ADD THIS LINE: It finds the empty span in your new header
    const greetingElement = document.getElementById("greeting");

    // 2. LOGIC: Determine the message
    let message = "";
    if (hour >= 3 && hour < 11) message = "Morning (Cheeky wink...)";
    else if (hour >= 11 && hour < 14) message = "Goodonya, I love food!";
    else if (hour >= 14 && hour < 18) message = "What a blooming marvelous afternoon we find ourselves in.";
    else message = "Sometimes and sits and thinks, sometimes I just sits";

    // 3. PUSH MESSAGE: Put the text into the header
    if (greetingElement) {
        greetingElement.innerText = message;
    }

    const container = document.getElementById("workout-container");
    container.innerHTML = "";
    const container = document.getElementById("workout-container");
    
    // This clears the cards before drawing new ones
    container.innerHTML = ""; 

    // Determine current time period
    const currentTimeOfDay = (hour >= 3 && hour < 11) ? "morning" : 
                             (hour >= 11 && hour < 14) ? "midday" :
                             (hour >= 14 && hour < 18) ? "afternoon" : "evening";

    workouts.forEach(workout => {
        const matchesTime = (filter === 'all' && workout.timeOfDay === currentTimeOfDay);
        const matchesCategory = (workout.category === filter);
        const matchesPeriod = (workout.timeOfDay.toLowerCase() === filter.toLowerCase());

        if (matchesTime || matchesCategory || matchesPeriod) {
            const card = document.createElement("div");
            
            // CLEANED: We only give it the "card" class now. 
            // No more dynamic "category-xxx" classes.
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
    // This highlights the button you just clicked
    const buttons = document.querySelectorAll('.filter-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    
    // This adds 'active' to the button you clicked
    event.target.classList.add('active');

    // This tells the display function to show only that category
    displayWorkouts(category);
}

// 3. THE TRIGGER
// This runs the function for the first time when the page opens
displayWorkouts();