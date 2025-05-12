import React, { useState, useEffect } from 'react';
import { FaSearch, FaUserCircle, FaSignOutAlt, FaBell, FaTimes } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import './styles/Navbar.css';

const Navbar = ({ notifications = [] }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [currentNotification, setCurrentNotification] = useState(null);
  const navigate = useNavigate();

  const unreadNotifications = notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    if (notifications.length > 0) {
      const latestNotification = notifications[notifications.length - 1];
      if (!latestNotification.isRead) {
        setCurrentNotification(latestNotification);
        setShowPopup(true);
        
        const timer = setTimeout(() => {
          setShowPopup(false);
        }, 5000);

        return () => clearTimeout(timer);
      }
    }
  }, [notifications]);

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    navigate('/auth');
  };

  const handlePopupClick = () => {
    setShowPopup(false);
    navigate('/Notification');
  };

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <div className="logo">FakeNews</div>
      </div>
      
      <div className="navbar-center">
        <div className="search-bar">
          <input type="text" placeholder="Rechercher..." />
          <button className="search-button">
            <FaSearch />
          </button>
        </div>
      </div>
      
      <div className="navbar-right">
        <Link to="/Notification" className="notification-icon">
          <FaBell className="nav-icon" />
          {unreadNotifications > 0 && (
            <span className="notification-badge">{unreadNotifications}</span>
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

        {showPopup && currentNotification && (
          <div className="notification-popup" onClick={handlePopupClick}>
            <div className="popup-timer"></div>
            <div className="popup-content">
              <FaBell className="popup-icon" />
              <div>
                <p className="popup-message">{currentNotification.message}</p>
                <small className="popup-time">
                  {new Date(currentNotification.date).toLocaleTimeString()}
                </small>
              </div>
              <button 
                className="popup-close"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowPopup(false);
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