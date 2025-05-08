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
import './App.css';
import data from './data';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('isAuthenticated') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('isAuthenticated', isAuthenticated);
  }, [isAuthenticated]);

  const ProtectedLayout = () => {
    if (!isAuthenticated) {
      return <Navigate to="/auth" replace />;
    }
    return (
      <div className="app">
        <Navbar />
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
{/*         <Route path="/auth" element={
          <SignInSignUp onAuthentication={() => setIsAuthenticated(true)} />
        }/>

        <Route element={<ProtectedLayout />}>
          <Route index element={<ArticleList articles={data.articles} />} />
          <Route path="article/:id" element={<ArticleDetail articles={data.articles} />} />
          <Route path="profil" element={<Profil />} />
          <Route path="bookmarks" element={<Bookmarks />} />
          <Route path="tendance" element={<Tendance />} />
        </Route>

        <Route path="*" element={
          <Navigate to={isAuthenticated ? "/" : "/auth"} replace />
        }/> */}
        <Route path="profil" element={<Profil />} />
      </Routes>
    </Router>
  );
}

export default App;