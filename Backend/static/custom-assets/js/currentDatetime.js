document.addEventListener("DOMContentLoaded", function() {
    function updateDateTime() {
        const now = new Date();
        const datetimeElement = document.getElementById('current-datetime');
        if (datetimeElement) {
            document.getElementById('current-datetime').textContent = now.toLocaleString();
        }
    }

    updateDateTime(); // Run immediately
    setInterval(updateDateTime, 1000); // Update every second
});