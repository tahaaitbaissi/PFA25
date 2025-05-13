import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, Outlet } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import ArticleList from './components/ArticleList';
import ArticleDetail from './components/ArticleDetail';
import Profil from './components/Profil';
import Bookmarks from './components/Bookmarks';
import Tendance from './components/Tendance';
import SignInSignUp from './components/SignInSignUp';
import UserArticle from './components/UserArticle';
import AdminDashboard from './components/AdminDashboard';
import Notification from './components/Notification';
import SearchResults from './components/SearchResults';
import './App.css';
import data from './data';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('isAuthenticated') === 'true';
  });

    const sampleNotifications = [
    {
      id: 1,
      message: 'Nouveau message de la part de l\'équipe',
      date: '2024-03-20T10:00:00',
      isRead: false
    },
    {
      id: 2,
      message: 'Votre commande a été expédiée',
      date: '2024-03-20T09:30:00',
      isRead: true
    }
  ];

  useEffect(() => {
  // Simulation de nouvelle notification
  const interval = setInterval(() => {
    setSampleNotifications(prev => [...prev, {
      id: Date.now(),
      message: 'Nouvelle notification en temps réel',
      date: new Date().toISOString(),
      isRead: false
    }]);
  }, 10000); // Toutes les 10 secondes

  return () => clearInterval(interval);
}, []);

  useEffect(() => {
    localStorage.setItem('isAuthenticated', isAuthenticated);
  }, [isAuthenticated]);

  const ProtectedLayout = () => {
    if (!isAuthenticated) {
      return <Navigate to="/auth" replace />;
    }
    return (
      <div className="app">
        <Navbar notifications={sampleNotifications} />
        <div className="app-container">
          <Sidebar />
          <main className="main-content">
            <Outlet />
          </main>
        </div>
      </div>
    );
  };

  return (
    <Router>
      <Routes>
        <Route path="/auth" element={
          <SignInSignUp onAuthentication={() => setIsAuthenticated(true)} />
        }/>

        <Route element={<ProtectedLayout />}>
          <Route index element={<ArticleList articles={data.articles} />} />
          <Route path="article/:id" element={<ArticleDetail articles={data.articles} />} />
          <Route path="profil" element={<Profil />} />
          <Route path="bookmarks" element={<Bookmarks articles={data.articles}/>} />
          <Route path="tendance" element={<Tendance articles={data.articles}/>} />
          <Route path="AdminDashboard" element={<AdminDashboard/>} />
          <Route path="userarticle" element={<UserArticle articles={data.articles}/>} />
          <Route path="Notification" element={<Notification notifications={sampleNotifications}/>} />
          <Route path="/search" element={<SearchResults />} />
        </Route>

        <Route path="*" element={
          <Navigate to={isAuthenticated ? "/" : "/auth"} replace />
        }/>
      </Routes>
    </Router>
  );
}

export default App;