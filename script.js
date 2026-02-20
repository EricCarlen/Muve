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
function updateGreeting() {
    // 1. Get the current hour (0 to 23)
    const hour = new Date().getHours();
    const greetingElement = document.getElementById("greeting");

    // 2. Decide what to say based on the time
    let message = "";

    if (hour >= 3 && hour < 11) {
        message = "Good Morning, Let's get Muveing!";
    } else if (hour >= 11 && hour < 14) {
        message = "Goodonya, Muvement before food, nom nom...";
    } else if (hour >= 14 && hour < 18) {
        message = "Good Afternoon, Muve it!";
    } else {
        message = "Good Evening, Relax and MuveZzz.."
    }
    // 3. Put that message into our HTML "id"
    greetingElement.innerText = message;
    const container = document.getElementById("workout-container");
    container.innerHTML = ""; // Clear the container first

    // Look through all workouts and find ones that match the current timeOfDay
    // (Note: You'll need to match the 'timeOfDay' logic from our earlier If/Else)
    const currentTimeOfDay = (hour >= 3 && hour < 11) ? "morning" : 
                             (hour >= 11 && hour < 14) ? "midday" :
                             (hour >= 14 && hour < 18) ? "afternoon" : "evening";

    workouts.forEach(workout => {
        if (workout.timeOfDay === currentTimeOfDay) {
            const card = document.createElement("div");
            card.className = "card";
            // This turns "Animal Movement" into "category-animal-movement"
            const categoryClass = "category-" + workout.category.toLowerCase().replace(" ", "-");
            card.classList.add(categoryClass);
            
            card.innerHTML = `
                <h3>${workout.name}</h3>
                <p>Category: ${workout.category}</p>
            `;
            container.appendChild(card);
        }
    });
}
// Run this function as soon as the page loads
updateGreeting();