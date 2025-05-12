import React, { useState } from 'react';
import './styles/Notification.css'; // Create this CSS file for styling

const Notification = ({ notifications: initialNotifications }) => {
  const [notifications, setNotifications] = useState(initialNotifications);

  const handleMarkAsRead = (id) => {
    setNotifications(notifications.map(notification =>
      notification.id === id ? { ...notification, isRead: true } : notification
    ));
  };

  return (
    <div className="notification-container">
      <h3>Notifications</h3>
      {notifications.map(notification => (
        <div 
          key={notification.id}
          className={`notification-item ${notification.isRead ? 'read' : 'unread'}`}
        >
          <div className="notification-content">
            <p>{notification.message}</p>
            <small>{new Date(notification.date).toLocaleString()}</small>
          </div>
          {!notification.isRead && (
            <button
              className="mark-read-btn"
              onClick={() => handleMarkAsRead(notification.id)}
            >
              Marquer comme lu
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

export default Notification;