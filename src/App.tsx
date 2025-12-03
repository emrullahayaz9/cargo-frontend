import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import AdminDashboard from './components/AdminDashboard';
import UserTracking from './components/UserTracking';

const App: React.FC = () => {
  return (
    <Router>
      <nav style={{ padding: 10, background: '#333' }}>
        <Link to="/" style={{ color: 'white', marginRight: 15 }}>cargo query</Link>
        <Link to="/admin" style={{ color: '#e67e22' }}>Admin Panel</Link>
      </nav>

      <Routes>
        <Route path="/" element={<UserTracking />} />
        
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
};

export default App;

