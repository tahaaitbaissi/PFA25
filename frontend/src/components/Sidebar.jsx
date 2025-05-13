import React, { useState, useEffect } from 'react';
import { 
  FaHome, 
  FaUser, 
  FaChartLine,
  FaBookmark,
  FaBars, 
  FaTimes,
  FaKey
} from 'react-icons/fa';
import { NavLink } from 'react-router-dom';
import './styles/Sidebar.css';
import axios from 'axios';

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Create axios instance with base configuration
  const api = axios.create({
    baseURL: 'http://localhost:5000',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  });

  // Add request interceptor for auth token
  api.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setIsAdmin(false);
          setLoading(false);
          return;
        }

        // Fetch user profile which includes role information
        const response = await api.get('/user_auth/profile');
        
        // Check if user has admin role
        setIsAdmin(response.data.user?.role === 'admin');
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, []);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  if (loading) {
    return <div className="sidebar-loading">Loading...</div>;
  }

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
            <span>Tendance</span>
          </NavLink>
          {isAdmin && (
            <NavLink 
              to="/AdminDashboard" 
              className="menu-item"
              onClick={() => {
                // Verify admin status again before navigating
                if (!isAdmin) {
                  alert("You don't have admin privileges");
                  return false;
                }
              }}
            >
              <FaKey className="icon" />
              <span>Admin Dashboard</span>
            </NavLink>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;