import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Lock, Mail, Phone, ArrowRight, ShieldCheck, KeyRound, Clock, Eye, EyeOff, Loader2, ExternalLink, ChevronRight, X } from 'lucide-react';
import { api } from '../utils/api';

export default function Login() {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgot, setIsForgot] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');

  // OTP states
  const [otpChannel, setOtpChannel] = useState('email');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [etherealUrl, setEtherealUrl] = useState('');

  // Google OAuth Selector Modal State
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [isCustomGoogle, setIsCustomGoogle] = useState(false);
  const [googleEmailInput, setGoogleEmailInput] = useState('');
  const [googleNameInput, setGoogleNameInput] = useState('');
  const [googleAuthenticating, setGoogleAuthenticating] = useState(false);
  const [authAccountName, setAuthAccountName] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Cooldown countdown timer
  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown(c => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      if (isSignUp) {
        const strengthScore = [
          password.length >= 8,
          /[A-Z]/.test(password),
          /[0-9]/.test(password),
          /[^A-Za-z0-9]/.test(password)
        ].filter(Boolean).length;

        if (strengthScore < 3) {
          setError('Password is too weak. Please include 8+ chars, numbers & uppercase letters.');
          setLoading(false);
          return;
        }

        const res = await api.signup(name, email, password, mobileNumber);
        localStorage.setItem('token', res.token);
        localStorage.setItem('user', JSON.stringify(res.user));
        localStorage.setItem('showPermissionModal', 'true');
        navigate('/dashboard');
      } else {
        const res = await api.login(email, password);
        localStorage.setItem('token', res.token);
        localStorage.setItem('user', JSON.stringify(res.user));
        localStorage.setItem('showPermissionModal', 'true');
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLoginClick = () => {
    setError('');
    setMessage('');
    setShowGoogleModal(true);
    setIsCustomGoogle(false);
    setGoogleEmailInput('');
    setGoogleNameInput('');
  };

  const executeGoogleAuth = async (targetEmail, targetName, gId) => {
    setGoogleAuthenticating(true);
    setAuthAccountName(targetName);
    try {
      const generatedGId = gId || 'google_id_' + Math.random().toString(36).substring(2, 9);
      const res = await api.googleLogin(targetEmail, targetName, generatedGId);
      
      setTimeout(() => {
        localStorage.setItem('token', res.token);
        localStorage.setItem('user', JSON.stringify(res.user));
        localStorage.setItem('showPermissionModal', 'true');
        setShowGoogleModal(false);
        setGoogleAuthenticating(false);
        navigate('/dashboard');
      }, 700);
    } catch (err) {
      setGoogleAuthenticating(false);
      setShowGoogleModal(false);
      setError(err.message || 'Google Authentication failed');
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (cooldown > 0 || loading) return;
    setError('');
    setMessage('');
    setEtherealUrl('');
    setLoading(true);

    try {
      const targetIdentifier = otpChannel === 'email' ? email : mobileNumber;
      if (!targetIdentifier || !targetIdentifier.trim()) {
        setError(otpChannel === 'email' ? 'Please enter registered email address' : 'Please enter registered mobile number');
        setLoading(false);
        return;
      }

      const res = await api.forgotPassword(email, mobileNumber, otpChannel);
      setMessage(res.message);
      if (res.previewUrl) {
        setEtherealUrl(res.previewUrl);
      }
      setOtpSent(true);
      setCooldown(res.cooldownSeconds || 60);
      setOtpCode(''); // Keep OTP code empty so user opens Ethereal inbox and enters code manually
    } catch (err) {
      setError(err.message || 'Error sending OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const strengthScore = [
      newPassword.length >= 8,
      /[A-Z]/.test(newPassword),
      /[0-9]/.test(newPassword),
      /[@$!%*?&]/.test(newPassword)
    ].filter(Boolean).length;

    if (strengthScore < 3) {
      setError('Password is too weak. Please include 8+ chars, numbers & uppercase letters.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.verifyOtp(email, otpCode, newPassword);
      setMessage(res.message);
      setTimeout(() => {
        setIsForgot(false);
        setOtpSent(false);
        setConfirmPassword('');
        setNewPassword('');
        setOtpCode('');
        setMessage('');
      }, 2000);
    } catch (err) {
      setError(err.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="glass-panel max-w-md w-full rounded-3xl p-8 border border-slate-800 shadow-2xl relative overflow-hidden bg-slate-900">
        
        {/* Top Glow Accent */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-medical-500/20 rounded-full blur-3xl" />
        
        {/* Header */}
        <div className="text-center space-y-2 mb-8">
          <div className="bg-medical-600 w-12 h-12 rounded-2xl flex items-center justify-center text-white mx-auto shadow-lg shadow-medical-500/30">
            <Heart className="h-6 w-6 fill-current text-red-500 animate-pulse-subtle" />
          </div>
          <h1 className="text-xl font-extrabold text-white tracking-wide">
            {isForgot ? 'Reset Password' : isSignUp ? 'Create Patient Account' : 'Clinical Health Portal'}
          </h1>
          <p className="text-xs text-slate-300 font-semibold">
            Smart Health Predictor & Biometric Diagnostics
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold text-center">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold text-center space-y-2">
            <p>{message}</p>
            {etherealUrl && (
              <a
                href={etherealUrl}
                target="_blank"
                rel="noreferrer"
                onClick={() => {
                  setMessage('');
                  setEtherealUrl('');
                }}
                className="inline-flex items-center justify-center space-x-1.5 bg-sky-600 hover:bg-sky-500 text-white px-3 py-1.5 rounded-lg text-[11px] font-bold shadow transition-colors w-full"
              >
                <Mail className="h-3.5 w-3.5" />
                <span>📬 View Ethereal Email Inbox</span>
                <ExternalLink className="h-3 w-3 ml-0.5" />
              </a>
            )}
          </div>
        )}

        {/* FORGOT PASSWORD FORM */}
        {isForgot ? (
          !otpSent ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs mb-2">
                <button
                  type="button"
                  onClick={() => setOtpChannel('email')}
                  className={`flex-1 py-1.5 rounded-lg font-bold transition-all ${
                    otpChannel === 'email' ? 'bg-medical-600 text-white' : 'text-slate-300'
                  }`}
                >
                  Email OTP
                </button>
                <button
                  type="button"
                  onClick={() => setOtpChannel('sms')}
                  className={`flex-1 py-1.5 rounded-lg font-bold transition-all ${
                    otpChannel === 'sms' ? 'bg-medical-600 text-white' : 'text-slate-300'
                  }`}
                >
                  Mobile SMS OTP
                </button>
              </div>

              {otpChannel === 'email' ? (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-200 block">Registered Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-600" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="user@health.com"
                      className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 font-semibold outline-none focus:border-medical-500 focus:ring-2 focus:ring-medical-500/20 placeholder:text-slate-500"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-200 block">Registered Mobile Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-3 h-4 w-4 text-slate-600" />
                    <input
                      type="tel"
                      required
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      placeholder="9876543210"
                      className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 font-semibold outline-none focus:border-medical-500 focus:ring-2 focus:ring-medical-500/20 placeholder:text-slate-500"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || cooldown > 0}
                className="w-full bg-medical-600 hover:bg-medical-500 disabled:opacity-60 text-white py-3 rounded-xl text-xs font-bold shadow-lg transition-all flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                    <span>Dispatching OTP...</span>
                  </>
                ) : cooldown > 0 ? (
                  <>
                    <Clock className="h-4 w-4 animate-pulse text-amber-400" />
                    <span>Wait {cooldown}s before resend</span>
                  </>
                ) : (
                  <span>Send Verification OTP</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setIsForgot(false)}
                className="w-full text-xs text-slate-300 hover:text-white font-bold pt-2 block text-center"
              >
                Back to Sign In
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-200 block">6-Digit OTP Code</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => {
                    setOtpCode(e.target.value);
                    if (message || etherealUrl) {
                      setMessage('');
                      setEtherealUrl('');
                    }
                  }}
                  placeholder="123456"
                  className="w-full bg-white border border-slate-300 rounded-xl text-center font-mono tracking-widest py-2.5 text-sm text-slate-900 font-bold outline-none focus:border-medical-500 placeholder:text-slate-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-200 block">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-600" />
                  <input
                    type={showNewPassword ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password..."
                    className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-10 py-2.5 text-xs text-slate-900 font-semibold outline-none focus:border-medical-500 placeholder:text-slate-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {newPassword.length > 0 && (() => {
                  const strengthScore = [
                    newPassword.length >= 8,
                    /[A-Z]/.test(newPassword),
                    /[0-9]/.test(newPassword),
                    /[@$!%*?&]/.test(newPassword)
                  ].filter(Boolean).length;

                  const getStrengthLabel = (score) => {
                    if (score === 0) return { label: 'Empty', color: 'bg-slate-700', text: 'text-slate-400' };
                    if (score === 1) return { label: 'Weak', color: 'bg-red-500', text: 'text-red-400' };
                    if (score === 2) return { label: 'Fair', color: 'bg-amber-500', text: 'text-amber-500' };
                    if (score === 3) return { label: 'Good', color: 'bg-blue-500', text: 'text-blue-400' };
                    return { label: 'Strong', color: 'bg-emerald-500', text: 'text-emerald-500' };
                  };
                  const labelInfo = getStrengthLabel(strengthScore);

                  return (
                    <div className="space-y-2 pt-2">
                      <div className="flex items-center justify-between text-[10px] font-bold">
                        <span className="text-slate-400">Password Strength:</span>
                        <span className={`${labelInfo.text} font-extrabold uppercase`}>{labelInfo.label}</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${labelInfo.color}`}
                          style={{ width: `${(strengthScore / 4) * 100}%` }}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[9px] font-semibold text-slate-400">
                        <div className="flex items-center space-x-1">
                          <span className={newPassword.length >= 8 ? "text-emerald-500" : "text-slate-600"}>✓</span>
                          <span>Min 8 characters</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span className={/[A-Z]/.test(newPassword) ? "text-emerald-500" : "text-slate-600"}>✓</span>
                          <span>One uppercase</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span className={/[0-9]/.test(newPassword) ? "text-emerald-500" : "text-slate-600"}>✓</span>
                          <span>One number</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span className={/[@$!%*?&]/.test(newPassword) ? "text-emerald-500" : "text-slate-600"}>✓</span>
                          <span>One special char</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-200 block">Confirm New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-600" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password..."
                    className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-10 py-2.5 text-xs text-slate-900 font-semibold outline-none focus:border-medical-500 placeholder:text-slate-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-medical-600 hover:bg-medical-500 text-white py-3 rounded-xl text-xs font-bold shadow-lg transition-all"
              >
                Verify & Reset Password
              </button>
            </form>
          )
        ) : (
          /* LOGIN & SIGNUP FORM */
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-200 block">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-semibold outline-none focus:border-medical-500 focus:ring-2 focus:ring-medical-500/20 placeholder:text-slate-500"
                />
              </div>
            )}

            {isSignUp && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-200 block">Mobile Number (SMS Notifications)</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3 h-4 w-4 text-slate-600" />
                  <input
                    type="tel"
                    required
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    placeholder="9876543210"
                    className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 font-semibold outline-none focus:border-medical-500 focus:ring-2 focus:ring-medical-500/20 placeholder:text-slate-500"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-200 block">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-600" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@health.com"
                  className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 font-semibold outline-none focus:border-medical-500 focus:ring-2 focus:ring-medical-500/20 placeholder:text-slate-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-200 block">Password</label>
                {!isSignUp && (
                  <button
                    type="button"
                    onClick={() => setIsForgot(true)}
                    className="text-[11px] text-sky-400 hover:underline font-bold"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-600" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 font-semibold outline-none focus:border-medical-500 focus:ring-2 focus:ring-medical-500/20 placeholder:text-slate-500"
                />
              </div>
              {isSignUp && password.length > 0 && (() => {
                const strengthScore = [
                  password.length >= 8,
                  /[A-Z]/.test(password),
                  /[0-9]/.test(password),
                  /[@$!%*?&]/.test(password)
                ].filter(Boolean).length;

                const getStrengthLabel = (score) => {
                  if (score === 0) return { label: 'Empty', color: 'bg-slate-700', text: 'text-slate-400' };
                  if (score === 1) return { label: 'Weak', color: 'bg-red-500', text: 'text-red-400' };
                  if (score === 2) return { label: 'Fair', color: 'bg-amber-500', text: 'text-amber-500' };
                  if (score === 3) return { label: 'Good', color: 'bg-blue-500', text: 'text-blue-400' };
                  return { label: 'Strong', color: 'bg-emerald-500', text: 'text-emerald-500' };
                };
                const labelInfo = getStrengthLabel(strengthScore);

                return (
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between text-[10px] font-bold">
                      <span className="text-slate-400">Password Strength:</span>
                      <span className={`${labelInfo.text} font-extrabold uppercase`}>{labelInfo.label}</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${labelInfo.color}`}
                        style={{ width: `${(strengthScore / 4) * 100}%` }}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[9px] font-semibold text-slate-400">
                      <div className="flex items-center space-x-1">
                        <span className={password.length >= 8 ? "text-emerald-500" : "text-slate-600"}>✓</span>
                        <span>Min 8 characters</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className={/[A-Z]/.test(password) ? "text-emerald-500" : "text-slate-600"}>✓</span>
                        <span>One uppercase</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className={/[0-9]/.test(password) ? "text-emerald-500" : "text-slate-600"}>✓</span>
                        <span>One number</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className={/[@$!%*?&]/.test(password) ? "text-emerald-500" : "text-slate-600"}>✓</span>
                        <span>One special char</span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-medical-600 hover:bg-medical-500 text-white py-3 rounded-xl text-xs font-bold shadow-lg transition-all flex items-center justify-center space-x-2"
            >
              <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            {/* Official Google Branding Sign In Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleGoogleLoginClick}
                className="w-full bg-white text-slate-900 hover:bg-slate-100 border border-slate-300 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center space-x-3 transition-colors shadow"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span className="text-slate-900 font-bold">Sign in with Google</span>
              </button>
            </div>
          </form>
        )}

        {/* Bottom Switch */}
        <div className="mt-6 border-t border-slate-800 pt-4 text-center">
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setIsForgot(false);
            }}
            className="text-xs text-slate-300 hover:text-white font-bold"
          >
            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign up"}
          </button>
        </div>
      </div>

      {/* Realistic Google OAuth Account Picker Modal */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 text-white relative">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span className="text-xs font-bold text-slate-200">Sign in with Google</span>
              </div>
              <button
                onClick={() => !googleAuthenticating && setShowGoogleModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {googleAuthenticating ? (
              <div className="py-8 text-center space-y-4">
                <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <div className="space-y-1">
                  <p className="text-sm font-bold text-white">Signing in as {authAccountName}...</p>
                  <p className="text-xs text-slate-400">Authenticating with Google OAuth 2.0</p>
                </div>
              </div>
            ) : isCustomGoogle ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!googleEmailInput.trim() || !googleNameInput.trim()) return;
                  executeGoogleAuth(googleEmailInput, googleNameInput);
                }}
                className="space-y-3 pt-1"
              >
                <p className="text-xs font-bold text-slate-300">Enter your Google Account details:</p>
                
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400">Google Full Name</label>
                  <input
                    type="text"
                    required
                    value={googleNameInput}
                    onChange={(e) => setGoogleNameInput(e.target.value)}
                    placeholder="e.g. Alex Morgan"
                    className="w-full bg-white text-slate-900 text-xs font-bold rounded-xl px-3 py-2 outline-none border border-slate-300"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400">Google Email Address</label>
                  <input
                    type="email"
                    required
                    value={googleEmailInput}
                    onChange={(e) => setGoogleEmailInput(e.target.value)}
                    placeholder="e.g. alex.morgan@gmail.com"
                    className="w-full bg-white text-slate-900 text-xs font-bold rounded-xl px-3 py-2 outline-none border border-slate-300"
                  />
                </div>

                <div className="pt-2 space-y-2">
                  <button
                    type="submit"
                    className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-2.5 rounded-xl text-xs shadow"
                  >
                    Continue to Smart Health Predictor
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCustomGoogle(false)}
                    className="w-full bg-slate-800 text-slate-300 hover:text-white font-bold py-2 rounded-xl text-xs border border-slate-700"
                  >
                    Back to account list
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-3 pt-1">
                <div className="space-y-1">
                  <h4 className="text-sm font-extrabold text-white">Choose an account</h4>
                  <p className="text-xs text-slate-400">to continue to Smart Health Predictor</p>
                </div>

                <div className="space-y-2 pt-2">
                  {/* Option 1: Registered User King */}
                  <button
                    type="button"
                    onClick={() => executeGoogleAuth('king12@gmail.com', 'King User', 'google_id_king12')}
                    className="w-full bg-slate-955 hover:bg-slate-800 border border-slate-800 p-3 rounded-2xl flex items-center justify-between text-left transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-sky-600 text-white font-extrabold flex items-center justify-center text-xs">
                        K
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">King User</p>
                        <p className="text-[10px] text-slate-400">king12@gmail.com</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-500" />
                  </button>

                  {/* Option 2: Doctor Alex Morgan */}
                  <button
                    type="button"
                    onClick={() => executeGoogleAuth('alex.morgan@gmail.com', 'Dr. Alex Morgan', 'google_id_alex')}
                    className="w-full bg-slate-955 hover:bg-slate-800 border border-slate-800 p-3 rounded-2xl flex items-center justify-between text-left transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-extrabold flex items-center justify-center text-xs">
                        A
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">Alex Morgan</p>
                        <p className="text-[10px] text-slate-400">alex.morgan@gmail.com</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-500" />
                  </button>

                  {/* Option 3: Custom Google Account Entry */}
                  <button
                    type="button"
                    onClick={() => setIsCustomGoogle(true)}
                    className="w-full bg-slate-900 hover:bg-slate-850 border border-dashed border-slate-700 p-3 rounded-2xl flex items-center space-x-3 text-left transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 font-bold flex items-center justify-center text-sm">
                      +
                    </div>
                    <span className="text-xs font-bold text-sky-400">Use another Google account</span>
                  </button>
                </div>

                <p className="text-[10px] text-slate-500 text-center pt-2">
                  To continue, Google will share your name, email address, and profile picture with Smart Health Predictor.
                </p>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
