import React, { useState } from 'react';
import { FaSearch, FaUserCircle, FaSignOutAlt } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import './styles/Navbar.css';

const Navbar = () => {
  const [showMenu, setShowMenu] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    // Ajoutez ici la logique de déconnexion
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
      
      <div className="navbar-right" onClick={() => setShowMenu(!showMenu)}>
        <div className="user-profile">
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