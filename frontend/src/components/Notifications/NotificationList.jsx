import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './NotificationList.css';

const NotificationList = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadOnly, setUnreadOnly] = useState(false);

  const fetchNotifications = async () => {
    try {
      const response = await axios.get(`/api/notifications${unreadOnly ? '?unread_only=true' : ''}`);
      setNotifications(response.data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await axios.put(`/api/notifications/${notificationId}/read`);
      fetchNotifications(); // Refresh the list
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [unreadOnly]);

  return (
    <div className="notifications-container">
      <div className="notifications-header">
        <h2>Notifications</h2>
        <label>
          <input
            type="checkbox"
            checked={unreadOnly}
            onChange={(e) => setUnreadOnly(e.target.checked)}
          />
          Show unread only
        </label>
      </div>
      <div className="notifications-list">
        {notifications.length === 0 ? (
          <p className="no-notifications">No notifications to display</p>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.notification_id}
              className={`notification-item ${!notification.read ? 'unread' : ''}`}
            >
              <div className={`notification-severity ${notification.alert_type}`}>
                {notification.alert_type}
              </div>
              <div className="notification-content">
                <p className="notification-message">{notification.message}</p>
                <p className="notification-time">
                  {new Date(notification.timestamp).toLocaleString()}
                </p>
              </div>
              {!notification.read && (
                <button
                  className="mark-read-button"
                  onClick={() => markAsRead(notification.notification_id)}
                >
                  Mark as read
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationList;
