const workouts = [
    { name: "Lower Body Burn", category: "Lower Body", timeOfDay: "morning" },
    { name: "Push & Pull", category: "Upper Body", timeOfDay: "morning" },
    { name: "Abs Foundation", category: "Core A", timeOfDay: "morning" },
    { name: "Oblique Focus", category: "Core B", timeOfDay: "morning" },
    { name: "Flow & Flex", category: "Body Mobility", timeOfDay: "morning" },
    { name: "Total Body Power", category: "Body Strength", timeOfDay: "morning" }
];

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
    const overlay = document.getElementById("workout-overlay");
    const content = document.getElementById("overlay-content");
    //Morning Section
    if (category.toLowerCase() === 'morning') {
        content.innerHTML = `
            <p style="text-transform: uppercase; letter-spacing: 2px; font-size: 0.7rem; color: #666;">Daily Ritual</p>
            <h1>Morning Mobility</h1>
            <div style="border-top: 1px solid black; width: 30px; margin: 15px auto;"></div>
            
            <div class="mobility-list">
                <p><strong>1.</strong> Wrist Circles & Extensions</p>
                <p><strong>2.</strong> Neck Circles</p>
                <p><strong>3.</strong> Toe Flex & Splay</p>
                <p><strong>4.</strong> Standing Hip Circles to Forward Fold</p>
                <p><strong>5.</strong> Squat to Overhead Reach</p>
                <p><strong>6.</strong> 90/90 Hip Flow to Lunge with Twist</p>
                <p><strong>7.</strong> Greatest Stretch Lunge with Arm Sweep</p>
                <p><strong>8.</strong> Plank to Downward Dog with Shoulder Tap</p>
                <p><strong>9.</strong> Cossack Squat to Side Reach</p>
                <p><strong>10.</strong> Kneeling Lunge to Hamstring Stretch</p>
                <p><strong>11.</strong> Dynamic Frog Pose to Thoracic Bridge</p>
                <p><strong>12.</strong> Standing Side Bend to Back Bend</p>
            </div>
        `;
    } 
    else {
        const workout = workouts.find(w => w.category.toLowerCase() === category.toLowerCase());
        if (workout) {
            content.innerHTML = `
                <p style="text-transform: uppercase; font-size: 0.7rem; color: #666; letter-spacing: 1px;">${workout.category}</p>
                <h1>${workout.name}</h1>
                <div style="border-top: 1px solid black; width: 30px; margin: 15px auto;"></div>
                <p style="font-style: italic;">Ready to muve?</p>
                `;
        }
    }
    overlay.classList.add("active");
}

function closeWorkout() {
    document.getElementById("workout-overlay").classList.remove("active");
}

// Only run the greeting on load
window.addEventListener('DOMContentLoaded', setGreeting);