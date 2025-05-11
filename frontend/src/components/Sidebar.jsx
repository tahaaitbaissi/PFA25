import React, { useState } from 'react';
import { 
  FaHome, 
  FaUser, 
  FaChartLine,
  FaBookmark,
  FaBars, 
  FaTimes,
  FaKey
} from 'react-icons/fa';
import { NavLink } from 'react-router-dom'; // Ajoutez cette ligne
import './styles/Sidebar.css';

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className={`sidebar ${isOpen ? 'open' : ''}`}>
      <button className="toggle-btn" onClick={toggleSidebar}>
        {isOpen ? <FaTimes /> : <FaBars />}
      </button>
      
      <div className="sidebar-content">
        <div className="sidebar-menu">
          <NavLink to="/" className="menu-item" exact="true">
            <FaHome className="icon" />
            <span>Accueil</span>
          </NavLink>
          <NavLink to="/UserArticle" className="menu-item">
            <FaUser className="icon" />
            <span>Your Article</span>
          </NavLink>
          <NavLink to="/bookmarks" className="menu-item">
            <FaBookmark className="icon" />
            <span>Bookmarks</span>
          </NavLink>
          <NavLink to="/tendance" className="menu-item">
            <FaChartLine className="icon" />
            <span>tendance</span>
          </NavLink>
          <NavLink to="/AdminDashboard" className="menu-item">
            <FaKey className="icon" />
            <span>AdminDashboard</span>
          </NavLink>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;