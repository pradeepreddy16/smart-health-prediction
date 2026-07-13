import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Heart, Activity, Mail, Lock, User, ShieldAlert } from 'lucide-react';
import { api } from '../utils/api';

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const [isSignUp, setIsSignUp] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        const data = await api.signup(name, email, password);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        navigate('/dashboard');
      } else {
        // Admin direct login override handles credential checks
        const loginEmail = isAdmin ? 'admin@health.com' : email;
        const data = await api.login(loginEmail, password);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        if (data.user.role === 'admin') {
          navigate('/admin-dashboard');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const toggleAdmin = () => {
    setIsAdmin(!isAdmin);
    setIsSignUp(false);
    setError('');
    setEmail('');
    setPassword('');
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="glass-panel max-w-md w-full rounded-3xl p-8 space-y-6 border border-slate-800 shadow-2xl relative overflow-hidden">
        
        {/* Glow decoration */}
        <div className="absolute -top-24 -left-24 h-48 w-48 bg-medical-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 h-48 w-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Banner */}
        <div className="text-center space-y-2">
          <div className="inline-flex bg-medical-600 rounded-2xl p-3 text-white shadow-xl shadow-medical-500/10 mb-2">
            {isAdmin ? <ShieldAlert className="h-6 w-6" /> : <Heart className="h-6 w-6 fill-current animate-pulse-subtle" />}
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            {isAdmin ? 'Admin Console' : isSignUp ? t('signup.title') : t('login.title')}
          </h2>
          <p className="text-xs text-slate-400">
            {isAdmin ? 'System maintenance portal' : t('login.subtitle')}
          </p>
        </div>

        {/* Error Warning */}
        {error && (
          <div className="bg-red-950/20 border border-red-900/30 text-red-400 text-xs rounded-xl p-3 text-center">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">{t('signup.name')}</label>
              <div className="relative">
                <User className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-200 outline-none focus:border-medical-500 transition-colors placeholder:text-slate-600"
                />
              </div>
            </div>
          )}

          {!isAdmin && (
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">{t('login.email')}</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-200 outline-none focus:border-medical-500 transition-colors placeholder:text-slate-600"
                />
              </div>
            </div>
          )}

          {isAdmin && (
            <div className="space-y-1.5 bg-slate-950/50 p-3.5 rounded-xl border border-slate-800 text-xs text-slate-400 leading-relaxed">
              Sign in as administrator. To log in with default credentials, type password <strong>admin123</strong> (email auto-completes to admin@health.com).
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">{t('login.password')}</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-200 outline-none focus:border-medical-500 transition-colors placeholder:text-slate-600"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-medical-600 hover:bg-medical-500 text-white rounded-xl py-3 text-sm font-semibold tracking-wide transition-colors disabled:opacity-50 shadow-lg shadow-medical-500/25 flex items-center justify-center space-x-2"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>{isSignUp ? t('signup.submit') : t('login.submit')}</span>
                <Activity className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {/* Toggles */}
        <div className="space-y-3.5 text-center border-t border-slate-800 pt-5">
          {!isAdmin && (
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-xs text-slate-400 hover:text-medical-400 transition-colors block w-full"
            >
              {isSignUp ? t('signup.have_account') : t('login.no_account')}
            </button>
          )}

          <button
            onClick={toggleAdmin}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors block w-full"
          >
            {isAdmin ? t('login.user_btn') : t('login.admin_btn')}
          </button>
        </div>

      </div>
    </div>
  );
}
