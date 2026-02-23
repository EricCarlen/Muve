const workouts = [
    { name: "Sunrise Stretch", category: "Stretch", timeOfDay: "morning" },
    { name: "Primal Flow", category: "Animal Movement", timeOfDay: "morning" },
    { name: "Morning Core Wakeup", category: "Core", timeOfDay: "morning" },
    { name: "Lunchtime Leg Blast", category: "Lower Body", timeOfDay: "midday" },
    { name: "Office Desk Stretch", category: "Stretch", timeOfDay: "midday" },
    { name: "Afternoon Power", category: "Upper Body", timeOfDay: "afternoon" },
    { name: "Crawl & Climb", category: "Animal Movement", timeOfDay: "afternoon" },
    { name: "Core Strength II", category: "Core", timeOfDay: "afternoon" },
    { name: "Evening Zen", category: "Meditate", timeOfDay: "evening" },
    { name: "Deep Tissue Release", category: "Stretch", timeOfDay: "evening" },
    { name: "Nightly Reflection", category: "Meditate", timeOfDay: "evening" }
];

function displayWorkouts(filter = 'all') {
    const hour = new Date().getHours();
    const greetingElement = document.getElementById("greeting");
    const container = document.getElementById("workout-container");

    // 1. Set the Greeting
    let message = "";
    if (hour >= 3 && hour < 11) message = "Good Morning";
    else if (hour >= 11 && hour < 14) message = "Good Midday";
    else if (hour >= 14 && hour < 18) message = "Good Afternoon";
    else message = "Good Evening";

    if (greetingElement) {
        greetingElement.innerText = message;
    }

    // 2. Clear the container
    container.innerHTML = ""; 

    // 3. Determine time period for 'all' view
    const currentTimeOfDay = (hour >= 3 && hour < 11) ? "morning" : 
                             (hour >= 11 && hour < 14) ? "midday" :
                             (hour >= 14 && hour < 18) ? "afternoon" : "evening";

    // 4. Draw the Cards
    workouts.forEach(workout => {
        const matchesTime = (filter === 'all' && workout.timeOfDay === currentTimeOfDay);
        const matchesCategory = (workout.category === filter);
        const matchesPeriod = (workout.timeOfDay.toLowerCase() === filter.toLowerCase());

        if (matchesTime || matchesCategory || matchesPeriod) {
            const card = document.createElement("div");
            card.className = "card"; // Simple B&W class
            card.innerHTML = `
                <h3>${workout.name}</h3>
                <p>${workout.category.toUpperCase()} | ${workout.timeOfDay.toUpperCase()}</p>
            `;
            container.appendChild(card);
        }
    });
}

function filterWorkouts(category) {
    const buttons = document.querySelectorAll('.filter-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    
    // Add active class to the button that was clicked
    if (event && event.target) {
        event.target.classList.add('active');
    }

    displayWorkouts(category);
}

// Start the app
displayWorkouts();