// 1. DATA FIRST (The list of workouts)
const workouts = [
    { name: "Sun Salutation", category: "Stretch", timeOfDay: "morning" },
    { name: "Morning Flow", category: "Animal Movement", timeOfDay: "morning" },
    { name: "Power Lunch Squats", category: "Lower Body", timeOfDay: "midday" },
    { name: "Core Crusher", category: "Core", timeOfDay: "afternoon" },
    { name: "Evening Zen", category: "Meditate", timeOfDay: "evening" }
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