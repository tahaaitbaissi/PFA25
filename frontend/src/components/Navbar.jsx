import React, { useState } from 'react';
import { FaSearch, FaUserCircle, FaSignOutAlt, FaBell } from 'react-icons/fa'; // Added FaBell
import { Link, useNavigate } from 'react-router-dom';
import './styles/Navbar.css';

const Navbar = ({ notifications = [] }) => { // Added notifications prop
  const [showMenu, setShowMenu] = useState(false);
  const navigate = useNavigate();

  // Calculate unread notifications
  const unreadNotifications = notifications.filter(n => !n.isRead).length;

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    navigate('/auth');
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
        {/* Notification Icon */}
        <Link to="/Notification" className="notification-icon">
          <FaBell className="nav-icon" />
          {unreadNotifications > 0 && (
            <span className="notification-badge">{unreadNotifications}</span>
          )}
        </Link>

        {/* User Profile */}
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
      </div>
    </nav>
  );
};

export default Navbar;