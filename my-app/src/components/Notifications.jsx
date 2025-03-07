import { useEffect } from "react";

function Notifications() {
  useEffect(() => {
    if (typeof(EventSource) !== "undefined") {
      const eventSource = new EventSource("http://localhost:8000/sse/notifications");
      eventSource.onmessage = function(event) {
        const notificationsDiv = document.getElementById("notifications");
        const data = JSON.parse(event.data);
        const notification = document.createElement("div");
        notification.className = "notification";
          
        const icon = document.createElement("span");
        icon.className = "notification-icon";
        icon.innerHTML = "&#128276;"; // Example icon (bell)
          
        const message = document.createElement("span");
        message.className = "notification-message";
        message.innerText = data.message;
          
        const timestamp = document.createElement("span");
        timestamp.className = "notification-timestamp";
        timestamp.innerText = new Date().toLocaleTimeString();
          
        const link = document.createElement("a");
        link.className = "notification-link";
        link.href = data.url || "#";
        link.innerText = "More info";
          
        const closeButton = document.createElement("button");
        closeButton.className = "close-button";
        closeButton.innerText = "×";
        closeButton.onclick = function() {
          notification.remove();
        };
          
        notification.appendChild(icon);
        notification.appendChild(message);
        notification.appendChild(timestamp);
        notification.appendChild(link);
        notification.appendChild(closeButton);
        notificationsDiv.appendChild(notification);

        // Remove the notification after 30 seconds
        setTimeout(() => {
          notification.remove();
        }, 30000);
      };

      // Cleanup function to close the EventSource
      return () => {
        eventSource.close();
      };
    } else {
      console.log("Your browser does not support Server-Sent Events.");
    }
  }, []);

  return <div id="notifications" className="notifications-container"></div>;
}

export default Notifications;
