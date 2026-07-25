import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Chatbot from './components/Chatbot';
import { NotificationProvider } from './context/NotificationContext';

import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import UserDashboard from './pages/UserDashboard';
import PredictForm from './pages/PredictForm';
import AdvancePredict from './pages/AdvancePredict';
import ReportDashboard from './pages/ReportDashboard';
import Telemedicine from './pages/Telemedicine';
import CommunityForum from './pages/CommunityForum';
import FindCareNearby from './pages/FindCareNearby';
import SharedReportView from './pages/SharedReportView';
import Notifications from './pages/Notifications';

import { applyTheme } from './utils/theme';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  let user = {};
  try {
    user = JSON.parse(userStr || '{}');
  } catch (e) {}

  if (!token) return <Navigate to="/login" replace />;
  if (user && user.status === 'deactivated') {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return <Navigate to="/login" replace />;
  }

  return children;
};

const PublicOnlyRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const urlParams = new URLSearchParams(window.location.search);
  const isPublicPreview = urlParams.get('public') === 'true' || urlParams.get('preview') === 'true';
  if (token && !isPublicPreview) return <Navigate to="/dashboard" replace />;
  return children;
};

export default function App() {
  const [elderlyMode, setElderlyMode] = useState(() => localStorage.getItem('elderlyMode') === 'true');

  useEffect(() => {
    localStorage.setItem('elderlyMode', elderlyMode);
    if (elderlyMode) {
      document.body.classList.add('elderly-mode');
    } else {
      document.body.classList.remove('elderly-mode');
    }
  }, [elderlyMode]);

  useEffect(() => {
    const savedTheme = localStorage.getItem('app-theme') || 'navy';
    applyTheme(savedTheme);
  }, []);

  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));

  useEffect(() => {
    const checkLogin = () => {
      setIsLoggedIn(!!localStorage.getItem('token'));
    };
    window.addEventListener('storage', checkLogin);
    const interval = setInterval(checkLogin, 1000);
    return () => {
      window.removeEventListener('storage', checkLogin);
      clearInterval(interval);
    };
  }, []);

  return (
    <Router>
      <NotificationProvider>
        <div className="min-h-screen text-slate-100 flex flex-col font-sans selection:bg-medical-500 selection:text-white">
          <Navbar elderlyMode={elderlyMode} setElderlyMode={setElderlyMode} />

          <main className="flex-1">
            <Routes>
              <Route path="/" element={<PublicOnlyRoute><LandingPage /></PublicOnlyRoute>} />
              <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />

              <Route path="/dashboard" element={<ProtectedRoute><UserDashboard elderlyMode={elderlyMode} setElderlyMode={setElderlyMode} /></ProtectedRoute>} />
              <Route path="/predict" element={<ProtectedRoute><PredictForm /></ProtectedRoute>} />
              <Route path="/advance" element={<ProtectedRoute><AdvancePredict /></ProtectedRoute>} />
              <Route path="/report/:id" element={<ProtectedRoute><ReportDashboard /></ProtectedRoute>} />
              <Route path="/telemedicine" element={<ProtectedRoute><Telemedicine /></ProtectedRoute>} />
              <Route path="/find-care" element={<ProtectedRoute><FindCareNearby /></ProtectedRoute>} />
              <Route path="/forum" element={<ProtectedRoute><CommunityForum /></ProtectedRoute>} />
              <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
              <Route path="/shared-report/:token" element={<SharedReportView />} />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          {isLoggedIn && <Chatbot />}
        </div>
      </NotificationProvider>
    </Router>
  );
}

