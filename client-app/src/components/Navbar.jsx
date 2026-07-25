import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Heart, Activity, PhoneCall, MessageSquare, LogOut, Globe, Menu, X, User, 
  MapPin, Bell, Sun, Moon, Sparkles, UserCheck 
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { applyTheme } from '../utils/theme';
import { api } from '../utils/api';

export default function Navbar({ elderlyMode, setElderlyMode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('app-theme') || 'dark');

  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isLoggedIn = !!token;
  const userId = user.id || user._id || user.email;

  const [notifications, setNotifications] = useState([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) return;
    const fetchNotifications = async () => {
      try {
        const [remData, walletData, aptData] = await Promise.all([
          api.getReminders().catch(() => []),
          api.getWalletBalance().catch(() => ({ balance: 0, history: [] })),
          api.getAppointments().catch(() => [])
        ]);

        const readIds = JSON.parse(localStorage.getItem('read_notifications') || '[]');
        const deletedIds = JSON.parse(localStorage.getItem('deleted_notifications') || '[]');
        
        const medicineAlerts = [];
        remData.forEach(rem => {
          const times = Array.isArray(rem.times) ? rem.times : [rem.times];
          times.forEach((time, index) => {
            const alertId = `notif-med-${rem.id}-${index}`;
            medicineAlerts.push({
              id: alertId,
              type: 'medicine',
              title: 'Medicine Reminder',
              message: `Dose due: ${rem.name} ${rem.dosage} (${time})`,
              link: '/dashboard',
              read: readIds.includes(alertId),
              deleted: deletedIds.includes(alertId)
            });
          });
        });

        const walletAlerts = [];
        if (walletData && Array.isArray(walletData.history)) {
          walletData.history.forEach((txn, index) => {
            const isCredit = txn.type === 'credit' || (txn.amount > 0 && !txn.description?.toLowerCase().includes('deduct'));
            const alertId = `notif-wallet-${index}`;
            walletAlerts.push({
              id: alertId,
              type: 'payment',
              title: isCredit ? 'Wallet Credited' : 'Wallet Debited',
              message: `₹${Math.abs(txn.amount)}.00 processed.`,
              link: '/dashboard',
              read: readIds.includes(alertId),
              deleted: deletedIds.includes(alertId)
            });
          });
        }

        const consultationAlerts = [];
        if (Array.isArray(aptData)) {
          aptData.forEach(apt => {
            const alertId = `notif-apt-${apt.id}`;
            consultationAlerts.push({
              id: alertId,
              type: 'consultation',
              title: 'Consultation Booked',
              message: `₹${apt.fee || 450}.00 processed for Dr. ${apt.doctorName}`,
              link: '/telemedicine',
              read: readIds.includes(alertId),
              deleted: deletedIds.includes(alertId)
            });
          });
        }

        const staticAlerts = [];
        if (walletAlerts.length === 0 && consultationAlerts.length === 0) {
          staticAlerts.push(
            {
              id: 'notif-payment',
              type: 'payment',
              title: 'Payment Confirmation',
              message: '₹450.00 processed for Dr. Priyan.',
              link: '/telemedicine',
              read: readIds.includes('notif-payment'),
              deleted: deletedIds.includes('notif-payment')
            },
            {
              id: 'notif-consultation-upcoming',
              type: 'consultation',
              title: 'Upcoming Video Consultation',
              message: 'Dr. Priyan video window is active.',
              link: '/telemedicine',
              read: readIds.includes('notif-consultation-upcoming'),
              deleted: deletedIds.includes('notif-consultation-upcoming')
            }
          );
        }

        staticAlerts.push({
          id: 'notif-assignment',
          type: 'report',
          title: 'Biometric Assessment Complete',
          message: 'Wellness index complete: 88/100.',
          link: '/dashboard',
          read: readIds.includes('notif-assignment'),
          deleted: deletedIds.includes('notif-assignment')
        });

        const allAlerts = [...medicineAlerts, ...walletAlerts, ...consultationAlerts, ...staticAlerts];
        setNotifications(allAlerts.filter(a => !a.deleted));
      } catch (err) {
        console.error(err);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000);
    
    window.addEventListener('notifications_updated', fetchNotifications);
    window.addEventListener('storage', fetchNotifications);

    return () => {
      clearInterval(interval);
      window.removeEventListener('notifications_updated', fetchNotifications);
      window.removeEventListener('storage', fetchNotifications);
    };
  }, [isLoggedIn, location.pathname]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleLogout = () => {
    if (userId) {
      localStorage.removeItem(`doctorSessions_${userId}`);
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('doctorSessions');
    localStorage.removeItem('prefilled_symptoms');
    setMobileMenuOpen(false);
    navigate('/');
  };

  const handleLanguageChange = (e) => {
    const lang = e.target.value;
    i18n.changeLanguage(lang);
    localStorage.setItem('i18nextLng', lang);
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    applyTheme(nextTheme);
  };

  const handleProfileClick = () => {
    setMobileMenuOpen(false);
    navigate('/dashboard?openProfile=true');
  };

  return (
    <nav className="glass-panel border-b border-slate-800 sticky top-0 z-40 bg-slate-955/80 backdrop-blur-md">
      <div className="max-w-[1536px] w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo - Flush Left */}
          <Link to="/" className="flex items-center space-x-3 group shrink-0 mr-4">
            <div className="bg-medical-600 p-2.5 rounded-2xl text-white shadow-lg shadow-medical-500/20 group-hover:scale-105 transition-transform">
              <Heart className="h-5 w-5 fill-current text-red-500" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-extrabold text-base tracking-wide text-white font-heading">
                Smart Health <span className="text-sky-400">Prediction</span>
              </span>
              <span className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mt-0.5">
                AI Biometric & Clinical Platform
              </span>
            </div>
          </Link>

          {/* Right Controls Area */}
          <div className="flex items-center space-x-2.5">
            
            {/* 3-Line Hamburger Menu Toggle Button (Positioned to the LEFT of Notifications on PC & Mobile) */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer shadow-sm"
              title="Toggle Full Navigation Menu"
            >
              {mobileMenuOpen ? (
                <X className="h-4 w-4 text-sky-400" />
              ) : (
                <Menu className="h-4 w-4 text-sky-400" />
              )}
              <span className="hidden md:inline text-xs font-bold text-slate-200">Menu</span>
            </button>

            {/* Notifications Link (Placed directly to the RIGHT of Hamburger Menu) */}
            {isLoggedIn && (
              <Link
                to="/notifications"
                className={`p-2 rounded-xl transition-all flex items-center space-x-1.5 relative ${
                  location.pathname === '/notifications'
                    ? 'bg-medical-600 text-white shadow-md'
                    : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white'
                }`}
                title="Notifications & WhatsApp Alerts"
              >
                <Bell className="h-4 w-4 text-sky-400" />
                <span className="hidden sm:inline text-xs font-bold">Notifications</span>
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-500 !text-white text-[10px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center animate-bounce shadow-md">
                    {unreadCount}
                  </span>
                )}
              </Link>
            )}


            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white rounded-xl transition-all"
              title="Toggle Light / Dark Theme"
            >
              {theme === 'light' ? <Moon className="h-4 w-4 text-slate-700" /> : <Sun className="h-4 w-4 text-amber-400" />}
            </button>

            {/* Language Switcher */}
            <div className="hidden sm:flex items-center space-x-1 bg-slate-900 border border-slate-800 rounded-xl px-2 py-1.5 text-xs">
              <Globe className="h-3.5 w-3.5 text-slate-400" />
              <select
                value={i18n.language || 'en'}
                onChange={handleLanguageChange}
                className="nav-select bg-transparent text-slate-200 text-xs font-semibold cursor-pointer outline-none"
              >
                <option value="en" className="bg-slate-900">EN</option>
                <option value="ta" className="bg-slate-900">TA</option>
                <option value="te" className="bg-slate-900">TE</option>
                <option value="kn" className="bg-slate-900">KN</option>
                <option value="ml" className="bg-slate-900">ML</option>
                <option value="hi" className="bg-slate-900">HI</option>
              </select>
            </div>

            {/* User Profile Click & Logout Controls */}
            {isLoggedIn ? (
              <div className="flex items-center space-x-2 border-l border-slate-800 pl-2.5">
                
                {/* Clickable Profile (User Name / Email) -> Opens User Details Modal */}
                <button
                  onClick={handleProfileClick}
                  className="flex items-center space-x-2 p-1.5 rounded-xl hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-all text-left group cursor-pointer"
                  title="Click to view & edit Profile details"
                >
                  <div className="bg-sky-500/20 border border-sky-500/40 p-1.5 rounded-full text-sky-400 group-hover:scale-105 transition-transform">
                    <User className="h-4 w-4" />
                  </div>
                  <div className="hidden sm:block leading-tight">
                    <span className="font-bold text-xs text-white group-hover:text-sky-400 transition-colors block max-w-[110px] truncate">
                      {user.name || 'User'}
                    </span>
                    <span className="text-[9px] text-slate-400 font-semibold block max-w-[110px] truncate">
                      {user.email || 'user@health.com'}
                    </span>
                  </div>
                </button>

                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-900 rounded-xl transition-colors cursor-pointer"
                  title={t('nav.logout')}
                >
                  <LogOut className="h-4 w-4" />
                </button>

              </div>
            ) : (
              <div className="hidden sm:flex items-center space-x-2">
                <Link
                  to="/login"
                  className="text-xs font-bold text-slate-300 hover:text-white px-3 py-2 rounded-xl transition-colors"
                >
                  {t('nav.signin')}
                </Link>
                <Link
                  to="/predict"
                  className="bg-medical-600 hover:bg-medical-500 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-lg shadow-medical-500/20 transition-all"
                >
                  {t('nav.get_started')}
                </Link>
              </div>
            )}

          </div>

        </div>
      </div>

      {/* Expanded Hamburger Navigation Menu Drawer (Works on both PC & Mobile when Menu is clicked) */}
      {mobileMenuOpen && (
        <div className="border-t border-slate-800 bg-slate-950 p-4 space-y-2 animate-fade-in shadow-2xl">
          
          {/* User Profile Card inside Hamburger for Quick Profile Access */}
          {isLoggedIn && (
            <div 
              onClick={handleProfileClick}
              className="glass-panel p-3 rounded-2xl border border-sky-500/30 bg-sky-955/40 flex items-center justify-between cursor-pointer mb-3 hover:border-sky-500/60 transition-all"
            >
              <div className="flex items-center space-x-2.5">
                <div className="bg-sky-500/20 p-2 rounded-xl text-sky-400">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">{user.name || 'User Profile'}</h4>
                  <p className="text-[10px] text-slate-400">{user.email}</p>
                </div>
              </div>
              <span className="text-[10px] bg-sky-500/20 text-sky-300 font-bold px-2.5 py-1 rounded-lg border border-sky-500/40">
                Edit Profile Details →
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
                location.pathname === '/' ? 'bg-medical-600 text-white' : 'text-slate-200 bg-slate-900/60 hover:bg-slate-900 border border-slate-800'
              }`}
            >
              <Heart className="h-4 w-4 text-sky-400" />
              <span>{t('nav.home')}</span>
            </Link>

            {isLoggedIn && (
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
                  location.pathname === '/dashboard' ? 'bg-medical-600 text-white' : 'text-slate-200 bg-slate-900/60 hover:bg-slate-900 border border-slate-800'
                }`}
              >
                <Activity className="h-4 w-4 text-emerald-400" />
                <span>{t('nav.dashboard')}</span>
              </Link>
            )}

            <Link
              to="/predict"
              onClick={() => setMobileMenuOpen(false)}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
                location.pathname === '/predict' ? 'bg-medical-600 text-white' : 'text-slate-200 bg-slate-900/60 hover:bg-slate-900 border border-slate-800'
              }`}
            >
              <Heart className="h-4 w-4 text-medical-400" />
              <span>{t('nav.predict')}</span>
            </Link>

            <Link
              to="/advance"
              onClick={() => setMobileMenuOpen(false)}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
                location.pathname === '/advance' ? 'bg-medical-600 text-white' : 'text-slate-200 bg-slate-900/60 hover:bg-slate-900 border border-slate-800'
              }`}
            >
              <Sparkles className="h-4 w-4 text-amber-400" />
              <span>{t('nav.advance') || 'Advance ML'}</span>
            </Link>

            <Link
              to="/telemedicine"
              onClick={() => setMobileMenuOpen(false)}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
                location.pathname === '/telemedicine' ? 'bg-medical-600 text-white' : 'text-slate-200 bg-slate-900/60 hover:bg-slate-900 border border-slate-800'
              }`}
            >
              <PhoneCall className="h-4 w-4 text-purple-400" />
              <span>{t('nav.telemedicine')}</span>
            </Link>

            <Link
              to="/find-care"
              onClick={() => setMobileMenuOpen(false)}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
                location.pathname === '/find-care' ? 'bg-medical-600 text-white' : 'text-slate-200 bg-slate-900/60 hover:bg-slate-900 border border-slate-800'
              }`}
            >
              <MapPin className="h-4 w-4 text-red-400" />
              <span>{t('nav.find_care')}</span>
            </Link>

            <Link
              to="/forum"
              onClick={() => setMobileMenuOpen(false)}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
                location.pathname === '/forum' ? 'bg-medical-600 text-white' : 'text-slate-200 bg-slate-900/60 hover:bg-slate-900 border border-slate-800'
              }`}
            >
              <MessageSquare className="h-4 w-4 text-blue-400" />
              <span>{t('nav.forum')}</span>
            </Link>

            {isLoggedIn && (
              <Link
                to="/notifications"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                  location.pathname === '/notifications' ? 'bg-medical-600 text-white' : 'text-slate-200 bg-slate-900/60 hover:bg-slate-900 border border-slate-800'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Bell className="h-4 w-4 text-sky-400" />
                  <span>Notifications</span>
                </div>
                {unreadCount > 0 && (
                  <span className="bg-red-500 !text-white text-[10px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center shadow-md">
                    {unreadCount}
                  </span>
                )}
              </Link>
            )}
          </div>

          {isLoggedIn ? (
            <div className="pt-2 border-t border-slate-900 flex justify-end">
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-red-400 hover:text-white bg-slate-900 hover:bg-red-600/30 text-xs font-bold rounded-xl border border-slate-800 transition-all cursor-pointer flex items-center space-x-1"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="pt-2 border-t border-slate-900 flex justify-end gap-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-2 bg-slate-900 text-slate-200 text-xs font-bold rounded-xl border border-slate-800"
              >
                Sign In / Register
              </Link>
            </div>
          )}

        </div>
      )}
    </nav>
  );
}
