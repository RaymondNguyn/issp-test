import React, { useState, useRef, useEffect } from 'react';
import NotificationBell from '../NotificationBell/NotificationBell';
import NotificationList from '../Notifications/NotificationList';
import './NotificationLayout.css';

const NotificationLayout = ({ auth }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="notification-layout" ref={notificationRef}>
      <NotificationBell auth={auth} onClick={() => setShowNotifications(!showNotifications)} />
      {showNotifications && (
        <div className="notification-drawer">
          <NotificationList auth={auth} onClose={() => setShowNotifications(false)} />
        </div>
      )}
    </div>
  );
};

export default NotificationLayout;
