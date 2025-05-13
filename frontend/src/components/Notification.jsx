import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './styles/Notification.css';

const api = axios.create({
  baseURL: 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const Notification = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Memoized fetch function
  const fetchNotifications = useCallback(async (pageNum = 1, reset = false) => {
    try {
      setLoading(true);
      const response = await api.get('/notifications/', {
        params: {
          page: pageNum,
          per_page: 10
        }
      });
      
      // Either reset or append based on the reset flag
      setNotifications(prev => 
        reset 
          ? response.data.notifications 
          : [...prev, ...response.data.notifications]
      );
      
      setHasMore(response.data.notifications.length > 0);
      setPage(pageNum);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load with cleanup
  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      await fetchNotifications(1, true);
    };
    
    if (isMounted) {
      loadData();
    }
    
    return () => {
      isMounted = false;
    };
  }, [fetchNotifications]);

  const handleMarkAsRead = async (notificationId) => {
    try {
      await api.post(`/notifications/mark-read/${notificationId}`);
      
      setNotifications(prev => 
        prev.map(notification =>
          notification._id === notificationId 
            ? { ...notification, is_read: true } 
            : notification
        )
      );
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to mark as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.post('/notifications/mark-all-read');
      setNotifications(prev => 
        prev.map(notification => ({
          ...notification,
          is_read: true
        }))
      );
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to mark all as read');
    }
  };

  const handleDelete = async (notificationId) => {
    try {
      await api.delete(`/notifications/${notificationId}`);
      setNotifications(prev => 
        prev.filter(notification => notification._id !== notificationId)
      );
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete notification');
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchNotifications(page + 1);
    }
  };

  if (loading && notifications.length === 0) {
    return <div className="loading">Loading notifications...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="notification-container">
      <div className="notification-header">
        <h3>Notifications</h3>
        {notifications.some(n => !n.is_read) && (
          <button 
            className="mark-all-read-btn"
            onClick={handleMarkAllAsRead}
          >
            Mark All as Read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="empty-state">No notifications</div>
      ) : (
        <>
          {notifications.map(notification => (
            <div 
              key={notification._id}
              className={`notification-item ${notification.is_read ? 'read' : 'unread'}`}
            >
              <div className="notification-content">
                <p>{notification.content}</p>
                <small>{new Date(notification.created_at).toLocaleString()}</small>
                <div className="notification-type">
                  Type: {notification.type || 'general'}
                </div>
              </div>
              <div className="notification-actions">
                {!notification.is_read && (
                  <button
                    className="mark-read-btn"
                    onClick={() => handleMarkAsRead(notification._id)}
                  >
                    Mark as Read
                  </button>
                )}
                <button
                  className="delete-btn"
                  onClick={() => handleDelete(notification._id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}

          {hasMore && (
            <button 
              className="load-more-btn"
              onClick={loadMore}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Load More'}
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default Notification;