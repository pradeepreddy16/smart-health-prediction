import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminDashboard from './pages/AdminDashboard';
import AdminLogin from './pages/AdminLogin';
import { applyTheme } from './utils/theme';

const ProtectedAdminRoute = ({ children }) => {
  const adminToken = localStorage.getItem('adminToken');
  const token = localStorage.getItem('token');
  const activeToken = adminToken || token;
  const adminUserStr = localStorage.getItem('adminUser');
  const adminUser = adminUserStr ? JSON.parse(adminUserStr) : null;

  if (!activeToken || !adminUser || adminUser.role !== 'admin') {
    return <Navigate to="/login" replace />;
  }
  return children;
};

export default function App() {
  useEffect(() => {
    const savedTheme = localStorage.getItem('admin-theme') || 'navy';
    applyTheme(savedTheme);
  }, []);

  return (
    <Router>
      <div className="min-h-screen text-slate-100 flex flex-col font-sans selection:bg-medical-500 selection:text-white">
        <Routes>
          <Route path="/login" element={<AdminLogin />} />
          <Route path="/*" element={<ProtectedAdminRoute><AdminDashboard /></ProtectedAdminRoute>} />
        </Routes>
      </div>
    </Router>
  );
}
