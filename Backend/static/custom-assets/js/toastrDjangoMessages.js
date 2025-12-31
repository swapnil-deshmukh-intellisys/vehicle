document.addEventListener("DOMContentLoaded", function () {
    let messagesElement = document.getElementById("django-messages");
    if (!messagesElement) return;  // If no messages, exit

    let messages = JSON.parse(messagesElement.textContent);  // Parse JSON

    messages.forEach(function (msg) {
        let toastrType = {
            "debug": "info",
            "info": "info",
            "success": "success",
            "warning": "warning",
            "danger": "error",
            "error": "error"
        }[msg.tags] || "info";  // Default to "info"

        toastr[toastrType](msg.message, toastrType.toUpperCase(), {
            closeButton: true,
            tapToDismiss: false,
            progressBar: true,
            showMethod: 'fadeIn',
            hideMethod: 'fadeOut',
            // positionClass: 'toast-top-left',
            timeOut: 5000
        });
    });
});