
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import Profile from './pages/profile';
import EditProfile from './pages/EditProfile';
import AdminRequest from './pages/AdminRequest';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/auth" />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/edit-profile" element={<EditProfile />} />
        <Route path="/admin-request" element={<AdminRequest />} />
      </Routes>
    </Router>
  );
}

export default App;


