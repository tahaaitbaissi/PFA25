import React, { useState, useEffect, useRef } from 'react'; // Import useRef
import { FaSearch, FaUserCircle, FaSignOutAlt, FaBell, FaTimes } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import { SocketService } from '../services/SocketService';
import axios from 'axios';
import './styles/Navbar.css';

// Helper function to format date/time (optional, but good for display)
const formatNotificationTime = (isoString) => {
  try {
    const date = new Date(isoString);
    if (isNaN(date)) return ''; // Handle invalid dates
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    console.error("Error formatting date:", isoString, e);
    return '';
  }
};

const API_URL = 'http://localhost:5000';

const Navbar = ({ notifications = [] }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  // Use a separate state for the notification currently displayed in the popup
  const [currentPopupNotification, setCurrentPopupNotification] = useState(null);
  const [socketNotifications, setSocketNotifications] = useState([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);

  const navigate = useNavigate();

  const handleSearch = async (e) => {
    e.preventDefault();

    const query = searchQuery.trim();
    if (!query) {
        setSearchError('Please enter a search query.'); // Provide feedback for empty search
        return;
    }

    try {
      setIsSearching(true);
      setSearchError(null);

      // Call the backend endpoint directly using axios
      const token = localStorage.getItem('token'); // Get token from local storage

      const response = await axios.get(`${API_URL}/articles/search`, {
        params: { q: query }, // Pass the query as a URL parameter
        headers: {
          // Include the Authorization header if a token exists
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });

      const results = response.data;

      // Navigate to search results page with the results and query
      navigate('/search', {
        state: {
          results,
          query: searchQuery
        }
      });

    } catch (error) {
      console.error('Search failed:', error);

      // Provide more specific error feedback if possible
      if (error.response) {
          // Server responded with a status code outside 2xx range
          console.error('Search error response:', error.response.data);
          setSearchError(`Search failed: ${error.response.data.error || error.response.statusText}`);
      } else if (error.request) {
          // The request was made but no response was received
          console.error('Search error request:', error.request);
          setSearchError('Network error: Could not reach the server.');
      } else {
          // Something else happened
          console.error('Search error message:', error.message);
          setSearchError(`An error occurred during search: ${error.message}`);
      }

    } finally {
      setIsSearching(false);
    }
  };

  // Combine prop notifications (initial load) and socket notifications (real-time)
  const allNotifications = [...notifications, ...socketNotifications];
  const unreadNotificationsCount = allNotifications.filter(n => !n.is_read).length; // Use backend field name 'is_read'

  // Ref to keep track of the popup timer ID
  const popupTimerRef = useRef(null);

  // Effect to handle incoming socket notifications and trigger the popup
  useEffect(() => {
    // This effect runs when socketNotifications changes (a new notification arrives)
    if (socketNotifications.length > 0) {
      const latestSocketNotification = socketNotifications[socketNotifications.length - 1];

      // Clear any existing popup timer before showing a new one
      if (popupTimerRef.current) {
        clearTimeout(popupTimerRef.current);
      }

      // Set the new notification as the one to display in the popup
      setCurrentPopupNotification(latestSocketNotification);
      setShowPopup(true); // Show the popup

      // Set a timer to hide the popup after 5 seconds
      popupTimerRef.current = setTimeout(() => {
        setShowPopup(false);
        // Optionally, clear the currentPopupNotification state after hiding
        // setCurrentPopupNotification(null); // Decide if you want to clear it immediately or keep it until the next notification
      }, 5000);
    }

    // Cleanup function for the timer
    return () => {
      if (popupTimerRef.current) {
        clearTimeout(popupTimerRef.current);
      }
    };
  }, [socketNotifications]); // Dependency array: run this effect when socketNotifications changes


  // WebSocket connection logic
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn("No token found, skipping WebSocket connection.");
      return;
    }

    try {
      const socket = SocketService.init(token);

      // Attach listener BEFORE waiting for connect promise
      SocketService.onNewNotification((notification) => {
        console.log("Received new notification:", notification);
        // Add the new notification to the socketNotifications state
        setSocketNotifications((prev) => [...prev, { ...notification, is_read: false }]); // Assume new socket notifs are unread
      });

      SocketService.connect()
        .then(() => {
          console.log("SocketService connected successfully.");
          // No need to explicitly join room here if backend joins on authenticated connect
        })
        .catch(error => {
          console.error("SocketService connection failed:", error);
          // Handle connection errors (e.g., show a message to the user)
        });

      // Cleanup function: disconnect and remove listener when component unmounts
      return () => {
        console.log("Cleaning up WebSocket connection...");
        SocketService.offNewNotification(); // Remove listener
        SocketService.disconnect(); // Disconnect socket
      };
    } catch (error) {
      console.error("Error initializing or connecting SocketService:", error);
      // Handle initialization errors
    }

  }, []); // Empty dependency array: runs once on mount and cleans up on unmount


  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Disconnect socket on logout
    SocketService.disconnect();
    navigate('/auth');
  };

  const handlePopupClick = () => {
    // When popup is clicked, hide it and navigate
    setShowPopup(false);
    // Optionally, mark the notification as read if you implement that logic
    // SocketService.markNotificationAsRead(currentPopupNotification._id); // Example
    navigate('/Notification'); // Navigate to the notification page
  };

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <div className="logo">FakeNews</div>
      </div>

      <div className="navbar-center">
        <form className="search-bar" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={isSearching}
            aria-label="Search articles"
          />
          <button 
            type="submit" 
            className="search-button"
            disabled={isSearching}
            aria-label="Submit search"
          >
            {isSearching ? (
              <div className="spinner"></div>
            ) : (
              <FaSearch />
            )}
          </button>
        </form>
        {searchError && (
          <div className="search-error">
            {searchError}
          </div>
        )}
      </div>

      <div className="navbar-right">
        <Link to="/Notification" className="notification-icon">
          <FaBell className="nav-icon" />
          {/* Display the count of unread notifications */}
          {unreadNotificationsCount > 0 && (
            <span className="notification-badge">{unreadNotificationsCount}</span>
          )}
        </Link>

        <div className="user-profile" onClick={() => setShowMenu(!showMenu)}>
          <FaUserCircle className="user-icon" />
          <span>Utilisateur</span>
        </div>

        {showMenu && (
          <div className="profile-menu">
            <Link to="/profil" className="menu-item">
              <FaUserCircle className="menu-icon" />
              <p>Profil</p>
            </Link>
            <div className="menu-item" onClick={handleLogout}>
              <FaSignOutAlt className="menu-icon" />
              <p>Déconnexion</p>
            </div>
          </div>
        )}

        {/* Render the popup only if showPopup is true AND there's a notification to display */}
        {showPopup && currentPopupNotification && (
          <div className="notification-popup" onClick={handlePopupClick}>
            <div className="popup-timer"></div> {/* Assuming this is for visual timer */}
            <div className="popup-content">
              <FaBell className="popup-icon" />
              <div>
                {/* Use the correct field name from backend: 'content' */}
                <p className="popup-message">{currentPopupNotification.content}</p>
                <small className="popup-time">
                  {/* Use the correct field name from backend: 'created_at' */}
                  {formatNotificationTime(currentPopupNotification.created_at)}
                </small>
              </div>
              <button
                className="popup-close"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent click from triggering handlePopupClick
                  setShowPopup(false); // Hide the popup
                  // Optionally, clear the currentPopupNotification state here too
                  // setCurrentPopupNotification(null);
                  if (popupTimerRef.current) {
                     clearTimeout(popupTimerRef.current); // Clear timer if closed manually
                  }
                }}>
                <FaTimes />
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
