import React from 'react';
import { FaSearch, FaUserCircle } from 'react-icons/fa';
import { Link } from 'react-router-dom'; // Ajouter cette ligne
import './styles/Navbar.css';

const Navbar = () => {
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
        <Link to="/profil" className="user-profile">
          <FaUserCircle className="user-icon" />
          <span>Utilisateur</span>
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;