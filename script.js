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
}
// Run this function as soon as the page loads
updateGreeting();