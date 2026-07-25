import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, Mail, AlertCircle, ArrowRight } from 'lucide-react';
import { adminApi } from '../utils/api';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@smarthealth.com');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      
      const res = await adminApi.login(email, password);
      localStorage.setItem('adminToken', res.token);
      localStorage.setItem('token', res.token);
      localStorage.setItem('adminUser', JSON.stringify(res.user));
      navigate('/');
    } catch (err) {
      setError(err.message || 'Invalid admin credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex items-center justify-center p-4 font-sans relative selection:bg-sky-500 selection:text-white">
      
      {/* Background Orbs */}
      <div className="fixed -top-32 -left-32 w-96 h-96 bg-sky-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed -bottom-32 -right-32 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <form onSubmit={handleSubmit} className="bg-[#090f22] max-w-md w-full rounded-3xl p-8 border border-white/[0.12] space-y-6 shadow-2xl z-10 relative">
        <div className="text-center space-y-3">
          <div className="bg-[#0284c7] p-3 rounded-2xl text-white w-14 h-14 mx-auto flex items-center justify-center shadow-lg shadow-sky-500/30">
            <ShieldCheck className="h-8 w-8 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-white tracking-wider uppercase">Smart Health</h1>
            <span className="text-xs text-sky-400 font-bold uppercase tracking-widest block">System Admin Portal Access</span>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold rounded-xl flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-300 block">Admin Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-955 text-white border border-white/[0.12] rounded-xl pl-10 pr-3.5 py-2.5 text-xs font-semibold outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-300 block">Admin Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-955 text-white border border-white/[0.12] rounded-xl pl-10 pr-3.5 py-2.5 text-xs font-semibold outline-none focus:border-sky-500"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#0284c7] hover:bg-sky-500 text-white py-3 rounded-xl text-xs font-bold shadow-lg shadow-sky-500/25 flex items-center justify-center space-x-2 transition-all"
        >
          <span>{loading ? 'Authenticating Admin Console...' : 'Sign In to Admin Portal'}</span>
          <ArrowRight className="h-4 w-4" />
        </button>

        <p className="text-[10px] text-slate-500 text-center font-mono">
          Authorized System Operations Personnel Only
        </p>
      </form>
    </div>
  );
}
