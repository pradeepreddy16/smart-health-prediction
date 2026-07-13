import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Chatbot from './components/Chatbot';

import Login from './pages/Login';
import UserDashboard from './pages/UserDashboard';
import PredictForm from './pages/PredictForm';
import ReportDashboard from './pages/ReportDashboard';
import Telemedicine from './pages/Telemedicine';
import AdminDashboard from './pages/AdminDashboard';

// Protected Route for Users
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Deactivated check
  if (user.status === 'deactivated') {
    localStorage.clear();
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Protected Route for Admins
const AdminRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  if (!token || user.role !== 'admin') {
    return <Navigate to="/login" replace />;
  }
  return children;
};

export default function App() {
  const token = localStorage.getItem('token');
  const isLoggedIn = !!token;

  return (
    <Router>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-medical-500 selection:text-white">
        
        {/* Global Navigation Bar */}
        <Navbar />

        {/* Page Content Container */}
        <main className="flex-1">
          <Routes>
            {/* Public Access */}
            <Route path="/login" element={<Login />} />

            {/* Guarded User Dashboard Portal */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <UserDashboard />
                </ProtectedRoute>
              }
            />

            {/* Parameter Intake Risk Predictor */}
            <Route
              path="/predict"
              element={
                <ProtectedRoute>
                  <PredictForm />
                </ProtectedRoute>
              }
            />

            {/* Dynamic Report Details Card */}
            <Route
              path="/report/:id"
              element={
                <ProtectedRoute>
                  <ReportDashboard />
                </ProtectedRoute>
              }
            />

            {/* Standby Tele-health Consultation */}
            <Route
              path="/telemedicine"
              element={
                <ProtectedRoute>
                  <Telemedicine />
                </ProtectedRoute>
              }
            />

            {/* Systems Administrator Dashboard */}
            <Route
              path="/admin-dashboard"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />

            {/* Fallbacks */}
            <Route
              path="*"
              element={<Navigate to={isLoggedIn ? "/dashboard" : "/login"} replace />}
            />
          </Routes>
        </main>

        {/* Global Symptom Checker Chatbot (Floats in lower right) */}
        {isLoggedIn && <Chatbot />}

      </div>
    </Router>
  );
}
