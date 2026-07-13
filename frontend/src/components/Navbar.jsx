import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Menu, X, Heart, Activity, LayoutDashboard, History, Stethoscope, ShieldAlert, LogOut } from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';

export default function Navbar() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isLoggedIn = !!token;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsOpen(false);
    navigate('/login');
  };

  const navItems = [
    { label: t('nav.dashboard'), path: '/dashboard', icon: LayoutDashboard, role: 'user' },
    { label: t('nav.predict'), path: '/predict', icon: Activity, role: 'user' },
    { label: t('nav.telemedicine'), path: '/telemedicine', icon: Stethoscope, role: 'user' },
    { label: t('nav.admin'), path: '/admin-dashboard', icon: ShieldAlert, role: 'admin' }
  ];

  // Filter visible items by role
  const visibleItems = navItems.filter(item => {
    if (!isLoggedIn) return false;
    if (item.role === 'admin' && user.role !== 'admin') return false;
    return true;
  });

  const navigateTo = (path) => {
    setIsOpen(false);
    navigate(path);
  };

  return (
    <>
      {/* Top Header Navbar */}
      <header className="glass-panel sticky top-0 z-40 border-b border-slate-800 bg-slate-950/80 px-4 py-3 flex items-center justify-between">
        {/* Brand Logo & Name */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate(isLoggedIn ? '/dashboard' : '/login')}>
          <div className="bg-medical-600 rounded-xl p-2 flex items-center justify-center text-white shadow-lg shadow-medical-500/25 animate-pulse-subtle">
            <Heart className="h-5 w-5 fill-current" />
          </div>
          <span className="font-semibold text-lg text-white font-sans tracking-wide">
            {t('app.name')}
          </span>
        </div>

        {/* Desktop Controls */}
        <div className="hidden md:flex items-center space-x-6">
          {visibleItems.map(item => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex items-center space-x-1.5 text-sm font-medium transition-colors ${
                location.pathname === item.path ? 'text-medical-500' : 'text-slate-300 hover:text-white'
              }`}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </button>
          ))}
          <LanguageSwitcher />
          {isLoggedIn && (
            <button
              onClick={handleLogout}
              className="flex items-center space-x-1.5 text-sm font-medium text-slate-300 hover:text-red-400 transition-colors border border-slate-700 hover:border-red-900/50 rounded-lg px-3 py-1.5"
            >
              <LogOut className="h-4 w-4" />
              <span>{t('nav.logout')}</span>
            </button>
          )}
        </div>

        {/* Mobile controls */}
        <div className="flex items-center space-x-4 md:hidden">
          <LanguageSwitcher />
          {isLoggedIn && (
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-slate-300 hover:text-white focus:outline-none"
              id="mobile-menu-btn"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          )}
        </div>
      </header>

      {/* Mobile Drawer Overlay */}
      {isOpen && isLoggedIn && (
        <div className="fixed inset-0 z-30 bg-slate-950/70 backdrop-blur-sm md:hidden" onClick={() => setIsOpen(false)} />
      )}

      {/* Mobile Navigation Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-64 bg-slate-900 border-l border-slate-800 z-50 transform transition-transform duration-300 ease-in-out md:hidden ${
          isOpen && isLoggedIn ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <span className="font-semibold text-slate-200">Navigation</span>
          <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">
            <X className="h-6 w-6" />
          </button>
        </div>
        <div className="flex flex-col p-4 space-y-4">
          <div className="py-2 border-b border-slate-800">
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Signed in as</p>
            <p className="text-sm font-medium text-slate-200 truncate">{user.name}</p>
            <p className="text-xs text-slate-400 truncate">{user.email}</p>
          </div>
          {visibleItems.map(item => (
            <button
              key={item.path}
              onClick={() => navigateTo(item.path)}
              className={`flex items-center space-x-3 w-full p-2.5 rounded-lg text-left text-sm font-medium transition-colors ${
                location.pathname === item.path
                  ? 'bg-medical-500/10 text-medical-500 border border-medical-500/20'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </button>
          ))}
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 w-full p-2.5 rounded-lg text-left text-sm font-medium text-red-400 hover:bg-red-950/20 border border-transparent hover:border-red-900/30 transition-colors mt-auto"
          >
            <LogOut className="h-5 w-5" />
            <span>{t('nav.logout')}</span>
          </button>
        </div>
      </div>
    </>
  );
}
