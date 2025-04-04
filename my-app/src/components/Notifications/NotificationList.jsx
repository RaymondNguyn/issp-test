import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './NotificationList.css';

const NotificationList = ({ onClose, auth }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:8000/api/notifications${unreadOnly ? '?unread_only=true' : ''}`, {
        headers: {
          'Authorization': `Bearer ${auth.token}`
        }
      });
      setNotifications(response.data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await axios.put(`http://localhost:8000/api/notifications/${notificationId}/read`, {}, {
        headers: {
          'Authorization': `Bearer ${auth.token}`
        }
      });
      fetchNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await axios.delete(`http://localhost:8000/api/notifications/${notificationId}`, {
        headers: {
          'Authorization': `Bearer ${auth.token}`
        }
      });
      fetchNotifications();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [unreadOnly]);

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const getAlertTypeIcon = (type) => {
    switch (type.toLowerCase()) {
      case 'warning':
        return '⚠️';
      case 'critical':
        return '🚨';
      case 'info':
      default:
        return 'ℹ️';
    }
  };

  return (
    <div className="notifications-container">
      <div className="notifications-header">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Notifications</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-2"
            aria-label="Close notifications"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div className="flex items-center mb-4">
          <label className="flex items-center space-x-2 text-sm">
            <input
              type="checkbox"
              checked={unreadOnly}
              onChange={(e) => setUnreadOnly(e.target.checked)}
              className="form-checkbox h-4 w-4 text-indigo-600"
            />
            <span>Show unread only</span>
          </label>
        </div>
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
              <button
                className="delete-button text-red-500 hover:text-red-700 text-sm"
                onClick={() => markAsRead(notification.notification_id)}
              >
                Delete
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationList;
