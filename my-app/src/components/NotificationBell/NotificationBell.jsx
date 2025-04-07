import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import NotificationList from '../Notifications/NotificationList';
import './NotificationBell.css';

const NotificationBell = ({ auth }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const bellRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (bellRef.current && !bellRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

  const fetchUnreadCount = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/notifications?unread_only=true', {
        headers: {
          'Authorization': `Bearer ${auth.token}`
        }
      });
      setUnreadCount(response.data.length);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  const handleClose = () => {
    setShowNotifications(false);
  };

  return (
    <div className="notification-bell-container" ref={bellRef}>
      <div className="notification-bell" onClick={toggleNotifications}>
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
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
        {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
      </div>
      {showNotifications && (
        <div className="notification-dropdown">
          <NotificationList auth={auth} onClose={handleClose} />
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
