import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import './i18n';

// Global error tracking reporting to admin portal
window.addEventListener('error', (event) => {
  try {
    const errorPayload = {
      message: event.message || (event.error && event.error.message) || 'Unknown Script Error',
      stack: (event.error && event.error.stack) || 'N/A',
      url: window.location.href,
      userAgent: navigator.userAgent,
      userEmail: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).email : 'Guest User'
    };
    fetch('/api/admin/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(errorPayload)
    }).catch(() => {});
  } catch (_) {}
});

window.addEventListener('unhandledrejection', (event) => {
  try {
    const errorPayload = {
      message: (event.reason && (event.reason.message || String(event.reason))) || 'Unhandled Promise Rejection',
      stack: (event.reason && event.reason.stack) || 'N/A',
      url: window.location.href,
      userAgent: navigator.userAgent,
      userEmail: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).email : 'Guest User'
    };
    fetch('/api/admin/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(errorPayload)
    }).catch(() => {});
  } catch (_) {}
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
