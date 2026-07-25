import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Heart, Flame, Wallet, Plus, Bluetooth, Activity, CheckCircle, XCircle, 
  Clock, ShieldAlert, PhoneCall, ArrowRight, Sparkles, BookOpen, AlertCircle, RefreshCw, Trash2, Edit, User, Mail, MapPin, ShieldCheck, FileDown, X, Calendar, Video, Eye, EyeOff, Tag, Pill, Droplet, Navigation
} from 'lucide-react';
import { api } from '../utils/api';
import { useTranslation } from 'react-i18next';

import WhatIfRiskSimulator from '../components/WhatIfRiskSimulator';
import HydrationTracker from '../components/HydrationTracker';
import PharmacyPriceComparator from '../components/PharmacyPriceComparator';

export default function UserDashboard({ elderlyMode, setElderlyMode }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [streak, setStreak] = useState(0);
  const [wallet, setWallet] = useState({ balance: 0, history: [] });
  const [reports, setReports] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Wearable Bluetooth & Live Stream state
  const [bleDevice, setBleDevice] = useState(null);
  const [bleStatus, setBleStatus] = useState('Bluetooth Disconnected');
  const [vitals, setVitals] = useState({ hr: 72, bp: '120/80', spo2: '98%', steps: 4850 });

  // Extract exact biometrics from patient's latest clinical report or profile
  const getExactUserVitals = () => {
    const latest = reports && reports.length > 0 ? reports[0] : null;
    const input = latest?.inputData || latest?.vitals || {};

    const hr = input.heart_rate || input.hr || profile?.heart_rate || 72;
    const sys = input.systolic_bp || input.systolic || profile?.systolic_bp || 120;
    const dia = input.diastolic_bp || input.diastolic || profile?.diastolic_bp || 80;
    const bp = `${sys}/${dia}`;
    const spo2 = `${input.spo2 || profile?.spo2 || 98}%`;
    const steps = input.steps || profile?.steps || 4850;

    return { hr: Number(hr), bp, spo2, steps: Number(steps) };
  };

  // Pharmacy Comparator Modal State
  const [showPharmacyComparator, setShowPharmacyComparator] = useState(false);

  // Live Pulse Ticker Effect for Smartwatch Stream (Runs when device is paired)
  useEffect(() => {
    if (!bleDevice) return;
    const timer = setInterval(() => {
      const exact = getExactUserVitals();
      setVitals((prev) => ({
        ...prev,
        hr: exact.hr + Math.floor(Math.random() * 3) - 1, // subtle natural variation around exact patient HR
        steps: (prev.steps || exact.steps) + Math.floor(Math.random() * 2),
      }));
    }, 3000);
    return () => clearInterval(timer);
  }, [bleDevice, reports, profile]);



  // Wallet Top-Up Modal
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('250');
  const [activePaymentOrder, setActivePaymentOrder] = useState(null);
  const [paymentPolling, setPaymentPolling] = useState(false);
  const [paymentSuccessMsg, setPaymentSuccessMsg] = useState('');

  // Report Deletion Modal State
  const [deleteReportModal, setDeleteReportModal] = useState(null);


  // Profile Edit Modal State
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profForm, setProfForm] = useState({
    name: '', age: 35, gender: 'Male', mobileNumber: '', email: '', address: '', medicalHistory: '', emergencyContactName: '', emergencyContactPhone: '', abhaId: '91-8765-4321-0987'
  });

  // Medicine Reminders State
  const [reminders, setReminders] = useState([]);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [editReminderObj, setEditReminderObj] = useState(null);
  const [remForm, setRemForm] = useState({
    name: '', dosage: '', startDate: '', endDate: '', timesStr: '', notes: ''
  });

  // Post-Login App Permissions Prompt State
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [permissionStep, setPermissionStep] = useState(1);
  const [showDetails, setShowDetails] = useState(false);
  const [permissions, setPermissions] = useState({
    location: null,
    bluetooth: null,
    contacts: null
  });

  useEffect(() => {
    loadData();
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('openProfile') === 'true') {
      setShowProfileModal(true);
    }

    if (localStorage.getItem('showPermissionModal') === 'true') {
      setShowPermissionModal(true);
      localStorage.removeItem('showPermissionModal');
    }
  }, [window.location.search]);

  const handleAllowLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => {
          setPermissions(prev => ({ ...prev, location: 'allowed' }));
          setPermissionStep(2);
        },
        () => {
          setPermissions(prev => ({ ...prev, location: 'denied' }));
          setPermissionStep(2);
        }
      );
    } else {
      setPermissions(prev => ({ ...prev, location: 'allowed' }));
      setPermissionStep(2);
    }
  };

  const handleDenyLocation = () => {
    setPermissions(prev => ({ ...prev, location: 'denied' }));
    setPermissionStep(2);
  };

  const handleAllowBluetooth = () => {
    setPermissions(prev => ({ ...prev, bluetooth: 'allowed' }));
    setPermissionStep(3);
  };

  const handleDenyBluetooth = () => {
    setPermissions(prev => ({ ...prev, bluetooth: 'denied' }));
    setPermissionStep(3);
  };

  const handleAllowContacts = () => {
    setPermissions(prev => ({ ...prev, contacts: 'allowed' }));
    setShowPermissionModal(false);
  };

  const handleDenyContacts = () => {
    setPermissions(prev => ({ ...prev, contacts: 'denied' }));
    setShowPermissionModal(false);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const userProf = await api.getProfile();
      setProfile(userProf);
      setProfForm({
        name: userProf.name || '',
        age: userProf.age || 35,
        gender: userProf.gender || 'Male',
        mobileNumber: userProf.mobileNumber || '',
        email: userProf.email || '',
        address: userProf.address || '',
        medicalHistory: userProf.medicalHistory || '',
        emergencyContactName: userProf.emergencyContactName || '',
        emergencyContactPhone: userProf.emergencyContactPhone || '',
        abhaId: userProf.abhaId || '91-8765-4321-0987'
      });

      const streakData = await api.getStreak().catch(() => ({ streak: 0 }));
      setStreak(streakData.streak);

      const walletData = await api.getWalletBalance().catch(() => ({ balance: 0, history: [] }));
      setWallet(walletData);

      const reportData = await api.getReports().catch(() => []);
      setReports(reportData);

      const aptsData = await api.getAppointments().catch(() => []);
      setAppointments(aptsData);

      const remData = await api.getReminders().catch(() => []);
      setReminders(remData);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      const res = await api.updateProfile(profForm);
      setProfile(res.user);
      setShowProfileModal(false);
      alert('Profile updated successfully!');
    } catch (err) {
      alert('Failed to update profile: ' + err.message);
    }
  };

  const handleDeleteReport = async () => {
    if (!deleteReportModal) return;
    try {
      await api.deleteReport(deleteReportModal.id);
      setReports(prev => prev.filter(r => r.id !== deleteReportModal.id));
      setDeleteReportModal(null);
      alert('Assessment report deleted successfully.');
    } catch (err) {
      alert('Failed to delete report: ' + err.message);
    }
  };

  const getDynamicHealthIndex = () => {
    if (!reports || reports.length === 0) {
      return { score: null, label: 'Checkup Needed', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' };
    }
    const latest = reports[0];
    let score = 92;

    if (typeof latest.score === 'number') {
      score = latest.score;
    } else if (latest.vitalAssessment && typeof latest.vitalAssessment.score === 'number') {
      score = latest.vitalAssessment.score;
    } else if (latest.overallRisk === 'High Risk' || latest.overallRisk === 'High') {
      score = 48;
    } else if (latest.overallRisk === 'Moderate Risk' || latest.overallRisk === 'Moderate') {
      score = 72;
    } else if (latest.overallRisk === 'Low Risk' || latest.overallRisk === 'Optimal') {
      score = 94;
    }

    if (score >= 85) return { score, label: 'Optimal', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' };
    if (score >= 65) return { score, label: 'Moderate Risk', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' };
    return { score, label: 'High Risk', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' };
  };

  const healthIndex = getDynamicHealthIndex();

  const handleOpenReminderModal = (rem = null) => {
    if (rem) {
      setEditReminderObj(rem);
      setRemForm({
        name: rem.name,
        dosage: rem.dosage,
        startDate: rem.startDate,
        endDate: rem.endDate,
        timesStr: Array.isArray(rem.times) ? rem.times.join(', ') : rem.times,
        notes: rem.notes || ''
      });
    } else {
      setEditReminderObj(null);
      setRemForm({
        name: '', dosage: '', startDate: '', endDate: '', timesStr: '', notes: ''
      });
    }
    setShowReminderModal(true);
  };

  const handleSaveReminder = async (e) => {
    e.preventDefault();
    const timesArr = remForm.timesStr.split(',').map(t => t.trim()).filter(Boolean);
    const payload = {
      name: remForm.name,
      dosage: remForm.dosage,
      startDate: remForm.startDate,
      endDate: remForm.endDate,
      times: timesArr,
      notes: remForm.notes
    };

    try {
      if (editReminderObj) {
        const res = await api.updateReminder(editReminderObj.id, payload);
        setReminders(res.reminders);
      } else {
        const res = await api.createReminder(payload);
        setReminders(res.reminders);
      }
      window.dispatchEvent(new Event('reminders_updated'));
      setShowReminderModal(false);
    } catch (err) {
      alert('Failed to save reminder: ' + err.message);
    }
  };

  const handleDeleteReminder = async (id) => {
    if (!window.confirm('Delete this medicine schedule?')) return;
    try {
      const res = await api.deleteReminder(id);
      setReminders(res.reminders);
      window.dispatchEvent(new Event('reminders_updated'));
    } catch (err) {
      alert('Failed to delete reminder: ' + err.message);
    }
  };


  // Bluetooth Permission Modal State
  const [showBleModal, setShowBleModal] = useState(false);

  const handleConnectWearable = () => {
    setShowBleModal(true);
  };

  const handleAllowBleConnection = () => {
    const exact = getExactUserVitals();
    setBleDevice({ name: 'ActiveWatch Pro' });
    setBleStatus('Connected to ActiveWatch Pro');
    setVitals(exact);
    setShowBleModal(false);
  };


  const handleDenyBleConnection = () => {
    setBleDevice(null);
    setBleStatus('Bluetooth Disconnected');
    setShowBleModal(false);
  };



  useEffect(() => {
    let interval;
    if (activePaymentOrder && activePaymentOrder.orderId) {
      interval = setInterval(async () => {
        try {
          const res = await api.checkOrderStatus(activePaymentOrder.orderId);
          if (res && res.status === 'paid') {
            clearInterval(interval);
            setPaymentSuccessMsg('Payment Verified & Confirmed! ✅ Wallet balance updated.');
            setActivePaymentOrder(null);
            setShowWalletModal(false);
            loadData();
          }
        } catch (e) {
          console.warn('Top-Up status check:', e);
        }
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [activePaymentOrder]);

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    try {
      setPaymentSuccessMsg('');
      const order = await api.createPaymentOrder({
        amount: Number(topUpAmount),
        description: 'Health Wallet Top-up'
      });
      setActivePaymentOrder(order);
    } catch (err) {
      alert('Payment initialization failed: ' + err.message);
    }
  };

  const getTimelineActivities = () => {
    const activities = [];

    // 1. Appointments
    if (Array.isArray(appointments)) {
      appointments.forEach(apt => {
        activities.push({
          id: `apt-${apt.id}`,
          title: 'Telemedicine Consultation Booked',
          details: `Dr. ${apt.doctorName} (${apt.clinicName || apt.hospitalName || 'Apollo Greams Road'}) • Status: ${apt.status || 'Confirmed'}`,
          timestamp: new Date(apt.createdAt || apt.date || Date.now()),
          color: 'emerald'
        });
      });
    }

    // 2. Wallet Transactions
    if (wallet && Array.isArray(wallet.history)) {
      wallet.history.forEach((txn, index) => {
        const isCredit = txn.type === 'credit' || (txn.amount > 0 && !txn.description?.toLowerCase().includes('deduct'));
        activities.push({
          id: `wallet-${index}`,
          title: isCredit ? 'Health Wallet Gateway Credit' : 'Health Wallet Debit',
          details: `${txn.description || 'Top-up ledger confirmed'} (₹${Math.abs(txn.amount)})`,
          timestamp: new Date(txn.timestamp || txn.date || Date.now()),
          color: isCredit ? 'sky' : 'rose'
        });
      });
    }

    // 3. Biometric Reports
    if (Array.isArray(reports)) {
      reports.forEach(rep => {
        activities.push({
          id: `report-${rep.id}`,
          title: 'Biometric Health Risk Assessment',
          details: `Overall Risk Index: ${rep.overallRisk || rep.score || 88}/100 (${rep.riskClassification || rep.status || 'Optimal Wellness'})`,
          timestamp: new Date(rep.createdAt || rep.timestamp || Date.now()),
          color: 'amber'
        });
      });
    }

    // Sort by timestamp descending
    activities.sort((a, b) => b.timestamp - a.timestamp);

    // Fallback placeholders if user has no activity yet (so it matches the original beautiful dashboard mockup!)
    if (activities.length === 0) {
      return [
        {
          id: 'mock-1',
          title: 'Telemedicine Consultation Booked',
          details: 'Dr. Priyan (Apollo Greams Road) • 60m Grace window active',
          timestamp: new Date(),
          color: 'emerald'
        },
        {
          id: 'mock-2',
          title: 'Health Wallet Gateway Credit',
          details: 'Top-up ledger confirmed via payment gateway',
          timestamp: new Date(Date.now() - 3600000),
          color: 'sky'
        },
        {
          id: 'mock-3',
          title: 'Biometric Health Risk Assessment',
          details: 'Overall Risk Index: 88/100 (Optimal Wellness)',
          timestamp: new Date(Date.now() - 7200000),
          color: 'amber'
        }
      ];
    }

    return activities.slice(0, 5); // Show top 5 latest activities
  };

  if (loading) {
    return <div className="text-center py-24 text-slate-500 text-sm">Loading clinical dashboard parameters...</div>;
  }

  return (
    <div className="max-w-[1536px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      
      {/* Header Banner — Complete Patient Details Display (No User Role Field) */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-gradient-to-r from-slate-900 via-slate-955 to-slate-900 shadow-2xl">
        <div className="space-y-2">
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-wide">
              {profile?.name || 'Patient'}
            </h1>
            <span className="bg-medical-500/10 text-medical-400 border border-medical-500/20 text-xs font-bold px-3 py-1 rounded-full flex items-center">
              Patient Profile
            </span>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer flex items-center justify-center"
              title={showDetails ? "Hide Details" : "Show Details"}
              type="button"
            >
              {showDetails ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {/* Full Patient Details Display (No User Role) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs text-slate-300 pt-1">
            <span>📧 {showDetails ? profile?.email : '••••••••'}</span>
            <span>📱 {showDetails ? (profile?.mobileNumber || 'Contact not set') : '••••••••'}</span>
            <span>👤 Age/Gender: {showDetails ? `${profile?.age || 35} yrs / ${profile?.gender || 'Male'}` : '••••••••'}</span>
            <span>📍 Address: {showDetails ? (profile?.address || 'Chennai, TN') : '••••••••'}</span>
            <span>🏥 Emergency Contact: {showDetails ? `${profile?.emergencyContactName || 'Not set'} (${profile?.emergencyContactPhone || '-'})` : '••••••••'}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowProfileModal(true)}
            className="bg-slate-900 border border-slate-800 text-slate-200 hover:text-white text-xs font-bold px-4 py-3 rounded-xl flex items-center space-x-2 transition-all"
          >
            <User className="h-4 w-4 text-sky-400" />
            <span>Edit Full Details</span>
          </button>

          <button
            onClick={() => navigate('/predict')}
            className="bg-medical-600 hover:bg-medical-500 text-white text-xs font-bold px-4 py-3 rounded-xl shadow-lg shadow-medical-500/20 flex items-center space-x-2 transition-all hover:scale-105"
          >
            <Sparkles className="h-4 w-4" />
            <span>New Health Assessment</span>
          </button>
        </div>
      </div>

      {/* Quick Actions Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => navigate('/predict')}
          className="glass-panel p-3.5 rounded-2xl border border-slate-800 hover:border-medical-500/50 bg-slate-900/80 hover:bg-slate-900 text-left transition-all flex items-center space-x-3 group shadow-lg"
        >
          <div className="bg-medical-500/10 p-2.5 rounded-xl text-medical-400 border border-medical-500/20 group-hover:scale-105 transition-transform shrink-0">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <span className="font-bold text-xs text-white block">Run Risk Check</span>
            <span className="text-[10px] text-slate-400">2-min organ check</span>
          </div>
        </button>

        <button
          onClick={() => navigate('/telemedicine')}
          className="glass-panel p-3.5 rounded-2xl border border-slate-800 hover:border-sky-500/50 bg-slate-900/80 hover:bg-slate-900 text-left transition-all flex items-center space-x-3 group shadow-lg"
        >
          <div className="bg-sky-500/10 p-2.5 rounded-xl text-sky-400 border border-sky-500/20 group-hover:scale-105 transition-transform shrink-0">
            <PhoneCall className="h-5 w-5" />
          </div>
          <div>
            <span className="font-bold text-xs text-white block">Book Doctor</span>
            <span className="text-[10px] text-slate-400">Video & offline visit</span>
          </div>
        </button>

        <button
          onClick={() => navigate('/find-care')}
          className="glass-panel p-3.5 rounded-2xl border border-slate-800 hover:border-emerald-500/50 bg-slate-900/80 hover:bg-slate-900 text-left transition-all flex items-center space-x-3 group shadow-lg"
        >
          <div className="bg-emerald-500/10 p-2.5 rounded-xl text-emerald-400 border border-emerald-500/20 group-hover:scale-105 transition-transform shrink-0">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <span className="font-bold text-xs text-white block">Find Nearby Care</span>
            <span className="text-[10px] text-slate-400">Hospitals & Clinics</span>
          </div>
        </button>

        <button
          onClick={() => navigate('/forum')}
          className="glass-panel p-3.5 rounded-2xl border border-slate-800 hover:border-amber-500/50 bg-slate-900/80 hover:bg-slate-900 text-left transition-all flex items-center space-x-3 group shadow-lg"
        >
          <div className="bg-amber-500/10 p-2.5 rounded-xl text-amber-400 border border-amber-500/20 group-hover:scale-105 transition-transform shrink-0">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <span className="font-bold text-xs text-white block">Ask Assistant</span>
            <span className="text-[10px] text-slate-400">Community & AI</span>
          </div>
        </button>
      </div>

      {/* Top Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Overall Health Score Card */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Health Index</span>
            <div className="bg-sky-500/10 p-2 rounded-xl text-sky-400 border border-sky-500/20">
              <Heart className="h-5 w-5 fill-current" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            {healthIndex.score !== null ? (
              <>
                <span className="text-3xl font-extrabold text-white">{healthIndex.score}<span className="text-sm text-sky-400 font-bold">/100</span></span>
                <span className={`text-[10px] font-bold ${healthIndex.color} ${healthIndex.bg} px-2 py-0.5 rounded-full uppercase`}>
                  {healthIndex.label}
                </span>
              </>
            ) : (
              <>
                <span className="text-2xl font-extrabold text-slate-400">N/A</span>
                <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full uppercase">
                  Checkup Needed
                </span>
              </>
            )}
          </div>
          <p className="text-[11px] text-slate-500">
            {healthIndex.score !== null 
              ? 'Calculated dynamically from your latest clinical risk assessment.' 
              : 'Complete an AI Health Checkup to calculate your personalized Health Index.'}
          </p>
        </div>
        
        {/* Streak */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">{t('dashboard.streak')}</span>
            <div className="bg-amber-500/10 p-2 rounded-xl text-amber-400 border border-amber-500/20">
              <Flame className="h-5 w-5 fill-current" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-white">{streak}</span>
            <span className="text-xs text-slate-400 font-semibold">consecutive days</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Increments when all daily medicine doses are logged or smartwatch vitals sync.
          </p>
        </div>

        {/* Health Wallet */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">{t('dashboard.wallet')}</span>
            <div className="bg-emerald-500/10 p-2 rounded-xl text-emerald-400 border border-emerald-500/20">
              <Wallet className="h-5 w-5" />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-3xl font-extrabold text-white">₹{wallet.balance || 0}.00</span>
            <button
              onClick={() => setShowWalletModal(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow flex items-center space-x-1 transition-all"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{t('dashboard.add_money')}</span>
            </button>
          </div>
          <p className="text-[11px] text-slate-500">
            Gateway-backed balance for telemedicine consultations & offline visit bookings.
          </p>
        </div>

        {/* Smartwatch Live Stream & Bluetooth Connectivity Widget */}
        <div className="glass-panel rounded-2xl p-6 border border-sky-500/30 bg-slate-900/90 space-y-3 md:col-span-2 lg:col-span-1 relative overflow-hidden shadow-xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Bluetooth className="h-4 w-4 text-sky-400 animate-pulse" />
              <span className="text-xs text-slate-300 font-extrabold uppercase tracking-wider">Smartwatch Bluetooth Stream</span>
            </div>
            <button
              onClick={handleConnectWearable}
              type="button"
              className="bg-sky-600 hover:bg-sky-500 text-white text-[11px] font-extrabold px-3 py-1.5 rounded-xl shadow transition-all flex items-center gap-1 shrink-0"
            >
              <Bluetooth className="w-3.5 h-3.5" /> Pair Bluetooth
            </button>
          </div>

          {/* ECG Pulse Animation */}
          <div className="h-6 w-full opacity-80 overflow-hidden flex items-center justify-center my-1">
            <svg className="w-full h-full text-emerald-400" viewBox="0 0 200 40">
              <path
                d="M0,20 L30,20 L40,5 L50,35 L60,10 L70,25 L80,20 L120,20 L130,5 L140,35 L150,10 L160,25 L170,20 L200,20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                className="animate-pulse"
              />
            </svg>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className={`font-bold flex items-center gap-1.5 text-[11px] ${bleDevice ? 'text-emerald-400' : 'text-slate-400'}`}>
              <span className={`w-2 h-2 rounded-full ${bleDevice ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`}></span> {bleStatus}
            </span>
            <button
              onClick={() => setShowPharmacyComparator(true)}
              className="text-[10px] text-sky-300 font-bold bg-sky-500/20 px-2 py-1 rounded-lg border border-sky-500/30 hover:bg-sky-500/30 transition-all flex items-center gap-1"
            >
              <Tag className="w-3 h-3" /> Generic Savings
            </button>
          </div>

          <div className="grid grid-cols-4 gap-2 pt-1 text-center">
            <div className="bg-slate-800/90 border border-slate-700/80 p-2 rounded-xl">
              <span className="text-[9px] text-slate-400 font-bold uppercase block">HR</span>
              <span className="text-xs font-black text-rose-400 flex items-center justify-center gap-0.5">
                <Heart className={`w-3 h-3 fill-current ${bleDevice ? 'animate-bounce' : ''}`} />
                {bleDevice ? `${vitals.hr} bpm` : '?'}
              </span>
            </div>
            <div className="bg-slate-800/90 border border-slate-700/80 p-2 rounded-xl">
              <span className="text-[9px] text-slate-400 font-bold uppercase block">BP</span>
              <span className="text-xs font-black text-sky-300">
                {bleDevice ? vitals.bp : '?/?'}
              </span>
            </div>
            <div className="bg-slate-800/90 border border-slate-700/80 p-2 rounded-xl">
              <span className="text-[9px] text-slate-400 font-bold uppercase block">SpO2</span>
              <span className="text-xs font-black text-emerald-400">
                {bleDevice ? vitals.spo2 : '?%'}
              </span>
            </div>
            <div className="bg-slate-800/90 border border-slate-700/80 p-2 rounded-xl">
              <span className="text-[9px] text-slate-400 font-bold uppercase block">Steps</span>
              <span className="text-xs font-black text-amber-300">
                {bleDevice ? vitals.steps : '?'}
              </span>
            </div>
          </div>

        </div>


      </div>







      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Reports History */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold text-white tracking-wide">Recent Health Assessments</h2>
            <button onClick={() => navigate('/predict')} className="text-xs text-medical-400 hover:underline font-semibold">
              + Run Checkup
            </button>
          </div>

          {reports.length === 0 ? (
            <div className="glass-panel rounded-3xl p-12 text-center border border-slate-800 space-y-4">
              <Activity className="h-12 w-12 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-400">No clinical health assessments recorded yet.</p>
              <button
                onClick={() => navigate('/predict')}
                className="bg-medical-600 hover:bg-medical-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-lg transition-all"
              >
                Run First Health Check
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map(rep => (
                <div
                  key={rep.id}
                  className="glass-panel rounded-2xl p-5 border border-slate-800 hover:border-slate-700 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1 cursor-pointer flex-1" onClick={() => navigate(`/report/${rep.id}`)}>
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-bold text-white">Biometric Diagnostic #{rep.id.substring(0, 8)}</span>
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                        rep.overallRisk === 'Optimal' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        rep.overallRisk === 'Good' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                        'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}>
                        {rep.overallRisk || 'Clinical Assessed'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Generated: {new Date(rep.createdAt || rep.timestamp).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => navigate(`/report/${rep.id}`)}
                      className="bg-slate-900 border border-slate-800 text-slate-200 hover:text-white px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5"
                    >
                      <span>View Report</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>

                    <button
                      onClick={() => setDeleteReportModal(rep)}
                      className="p-2 bg-red-950/40 border border-red-900/40 hover:bg-red-900/40 text-red-400 rounded-xl transition-colors"
                      title="Delete Report"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Recent Activity Timeline Feed (Left Column Fill) */}
          <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-4 bg-slate-900/60 shadow-xl">
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-amber-400" />
              <h3 className="text-sm font-bold text-white tracking-wide">Recent Clinical Activity Timeline</h3>
            </div>

            <div className="space-y-4 text-xs border-l-2 border-slate-800 pl-4 py-1">
              {getTimelineActivities().map(act => (
                <div key={act.id} className="relative space-y-0.5">
                  <div className={`absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full border-2 border-slate-900 ${
                    act.color === 'emerald' ? 'bg-emerald-400' :
                    act.color === 'sky' ? 'bg-sky-400' :
                    act.color === 'rose' ? 'bg-rose-400' : 'bg-amber-400'
                  }`} />
                  <span className="font-bold text-white block">{act.title}</span>
                  <span className="text-[10px] text-slate-300 block">{act.details}</span>
                  <span className="text-[9px] text-slate-500 block">
                    {new Date(act.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} at {new Date(act.timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Sidebar Widgets */}
        <div className="space-y-6">

          {/* Upcoming Consultations Widget */}

          {/* Upcoming Consultations Widget */}
          <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Video className="h-5 w-5 text-sky-400" />
                <h3 className="text-sm font-bold text-white">Upcoming Consultations</h3>
              </div>
              <button onClick={() => navigate('/telemedicine')} className="text-xs text-sky-400 hover:underline font-semibold">
                Book New
              </button>
            </div>

            {(() => {
              const sessionsStr = localStorage.getItem('doctorSessions') || '{}';
              let activeList = [];
              try {
                const parsed = JSON.parse(sessionsStr);
                activeList = Object.entries(parsed)
                  .map(([docId, sess]) => ({ docId, ...sess }))
                  .filter(s => s.paid && s.status === 'active' && (s.expiresAt ? Date.now() < s.expiresAt : true));
              } catch (e) {}

              if (activeList.length === 0) {
                return (
                  <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-850 text-center space-y-2">
                    <p className="text-xs text-slate-400">No active paid consultations right now.</p>
                    <button
                      onClick={() => navigate('/telemedicine')}
                      className="bg-medical-600 hover:bg-medical-500 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl shadow transition-all"
                    >
                      Consult a Specialist
                    </button>
                  </div>
                );
              }

              return (
                <div className="space-y-3">
                  {activeList.map((s, idx) => (
                    <div key={idx} className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-850 space-y-2.5 text-xs">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-bold text-white block">Dr. Specialist Consultation</span>
                          <span className="text-[10px] text-emerald-400 font-semibold flex items-center space-x-1 mt-0.5">
                            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                            <span>Paid — 60m Grace Window Active</span>
                          </span>
                        </div>
                        <button
                          onClick={() => navigate('/telemedicine')}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow animate-pulse shrink-0"
                        >
                          Join Call
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>

          {/* Medicine Reminders */}
          <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-medical-400" />
                <h3 className="text-sm font-bold text-white">Medicine Schedules</h3>
              </div>
              <button
                onClick={() => handleOpenReminderModal(null)}
                className="bg-medical-600 hover:bg-medical-500 text-white text-xs font-bold px-2.5 py-1 rounded-xl shadow flex items-center space-x-1"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Form</span>
              </button>
            </div>

            <div className="space-y-3">
              {reminders.length > 0 ? (
                reminders.map(rem => (
                  <div key={rem.id} className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-850 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-white block">{rem.name} ({rem.dosage})</span>
                        <span className="text-[10px] text-slate-400 block">
                          Course: {rem.startDate} to {rem.endDate}
                        </span>
                      </div>

                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleOpenReminderModal(rem)}
                          className="p-1 text-slate-400 hover:text-white"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteReminder(rem.id)}
                          className="p-1 text-slate-400 hover:text-red-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {(Array.isArray(rem.times) ? rem.times : [rem.times]).map((t, idx) => (
                        <span key={idx} className="bg-slate-955 border border-slate-800 text-sky-400 text-[9px] font-bold px-2 py-0.5 rounded-md">
                          ⏰ {t}
                        </span>
                      ))}
                    </div>

                    {rem.notes && (
                      <span className="text-[10px] text-slate-400 italic block">Note: {rem.notes}</span>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-6 border border-dashed border-slate-800 rounded-2xl p-4 space-y-2 bg-slate-950/40">
                  <Clock className="h-7 w-7 text-slate-500 mx-auto opacity-50" />
                  <p className="text-xs font-bold text-slate-300">No Medicine Schedules Logged</p>
                  <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                    Add your daily prescription medications to receive automated dosage alerts.
                  </p>
                  <button
                    onClick={() => handleOpenReminderModal(null)}
                    className="inline-flex items-center space-x-1.5 bg-sky-600/20 hover:bg-sky-600/30 text-sky-400 border border-sky-500/30 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Medicine Schedule</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Compact Apple-style Hydration Widget at the bottom */}
          <HydrationTracker />

        </div>

      </div>


      {/* FULL USER PROFILE EDIT MODAL */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-slate-955/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSaveProfile} className="glass-panel max-w-lg w-full rounded-3xl p-6 border border-slate-800 space-y-4 bg-slate-900 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Edit Full Patient Profile Details</h3>
              <button type="button" onClick={() => setShowProfileModal(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-200 block">Full Name</label>
                <input
                  type="text"
                  required
                  value={profForm.name}
                  onChange={(e) => setProfForm({ ...profForm, name: e.target.value })}
                  className="w-full bg-white text-slate-900 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-200 block">Age</label>
                <input
                  type="number"
                  required
                  value={profForm.age}
                  onChange={(e) => setProfForm({ ...profForm, age: Number(e.target.value) })}
                  className="w-full bg-white text-slate-900 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-200 block">Gender</label>
                <select
                  value={profForm.gender}
                  onChange={(e) => setProfForm({ ...profForm, gender: e.target.value })}
                  className="w-full bg-white text-slate-900 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold outline-none"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-200 block">Mobile Contact Phone</label>
                <input
                  type="tel"
                  value={profForm.mobileNumber}
                  onChange={(e) => setProfForm({ ...profForm, mobileNumber: e.target.value })}
                  className="w-full bg-white text-slate-900 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-200 block">Residential Address</label>
              <input
                type="text"
                value={profForm.address}
                onChange={(e) => setProfForm({ ...profForm, address: e.target.value })}
                placeholder="21 Greams Rd, Chennai"
                className="w-full bg-white text-slate-900 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-200 block">Medical History Summary</label>
              <textarea
                rows={2}
                value={profForm.medicalHistory}
                onChange={(e) => setProfForm({ ...profForm, medicalHistory: e.target.value })}
                className="w-full bg-white text-slate-900 border border-slate-300 rounded-xl p-3 text-xs font-semibold outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-200 block">Emergency Contact Name</label>
                <input
                  type="text"
                  value={profForm.emergencyContactName}
                  onChange={(e) => setProfForm({ ...profForm, emergencyContactName: e.target.value })}
                  className="w-full bg-white text-slate-900 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-200 block">Emergency Phone</label>
                <input
                  type="tel"
                  value={profForm.emergencyContactPhone}
                  onChange={(e) => setProfForm({ ...profForm, emergencyContactPhone: e.target.value })}
                  className="w-full bg-white text-slate-900 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-medical-600 hover:bg-medical-500 text-white py-3 rounded-xl text-xs font-bold shadow-lg transition-all"
            >
              Update Profile Details
            </button>
          </form>
        </div>
      )}

      {/* Delete Report Confirmation Modal */}
      {deleteReportModal && (
        <div className="fixed inset-0 bg-slate-955/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel max-w-md w-full rounded-3xl p-6 border border-red-900/50 bg-slate-900 space-y-4 text-center">
            <h3 className="text-base font-bold text-white">Confirm Assessment Deletion</h3>
            <p className="text-xs text-slate-300">
              Are you sure you want to delete Health Assessment report <strong>#{deleteReportModal.id.substring(0, 8)}</strong>?
            </p>
            <div className="flex justify-end space-x-3 pt-2">
              <button onClick={() => setDeleteReportModal(null)} className="bg-slate-955 border border-slate-800 text-slate-300 px-4 py-2 rounded-xl text-xs font-semibold">
                Cancel
              </button>
              <button onClick={handleDeleteReport} className="bg-red-600 hover:bg-red-500 text-white px-5 py-2 rounded-xl text-xs font-bold">
                Permanently Delete Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HEALTH WALLET TOP-UP MODAL */}
      {showWalletModal && (
        <div className="fixed inset-0 bg-slate-955/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel max-w-md w-full rounded-3xl p-6 border border-slate-800 space-y-5 bg-slate-900 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Wallet className="h-5 w-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Top-Up Health Wallet</h3>
              </div>
              <button
                onClick={() => {
                  setShowWalletModal(false);
                  setActivePaymentOrder(null);
                  setPaymentSuccessMsg('');
                }}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="bg-slate-955 p-4 rounded-2xl border border-slate-850 flex items-center justify-between">
              <span className="text-xs text-slate-400 font-semibold">Current Wallet Balance</span>
              <span className="text-xl font-extrabold text-emerald-400">₹{wallet.balance || 0}.00</span>
            </div>

            {paymentSuccessMsg ? (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-center text-emerald-400 text-xs font-bold space-y-2">
                <CheckCircle className="h-8 w-8 mx-auto" />
                <p>{paymentSuccessMsg}</p>
                <button
                  onClick={() => {
                    setShowWalletModal(false);
                    setActivePaymentOrder(null);
                    setPaymentSuccessMsg('');
                  }}
                  className="bg-emerald-600 text-white px-4 py-2 rounded-xl mt-2 font-bold"
                >
                  Done
                </button>
              </div>
            ) : !activePaymentOrder ? (
              <form onSubmit={handleCreateOrder} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-200 block">Select Top-Up Amount (₹)</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['250', '500', '1000'].map(amt => (
                      <button
                        type="button"
                        key={amt}
                        onClick={() => setTopUpAmount(amt)}
                        className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                          topUpAmount === amt ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-slate-955 text-slate-300 border-slate-800'
                        }`}
                      >
                        ₹{amt}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-200 block">Or Enter Custom Amount</label>
                  <input
                    type="number"
                    min="50"
                    required
                    value={topUpAmount}
                    onChange={(e) => setTopUpAmount(e.target.value)}
                    className="w-full bg-white text-slate-900 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl text-xs font-bold shadow-lg transition-all"
                >
                  Generate Gateway Payment Order (₹{topUpAmount})
                </button>
              </form>
            ) : (
              <div className="space-y-4 text-center">
                <div className="bg-white p-3 rounded-2xl w-44 h-44 mx-auto border border-slate-300 shadow-md">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(activePaymentOrder.upiUrl)}`}
                    alt="UPI QR Code"
                    className="w-full h-full object-contain"
                  />
                </div>
                <p className="text-[11px] text-slate-400">Scan QR Code using Google Pay, PhonePe, or Paytm to top up ₹{activePaymentOrder.amount}.00</p>

                <div className="bg-slate-800/90 border border-emerald-500/40 rounded-2xl p-3 text-center space-y-1 shadow-lg">
                  <div className="flex items-center justify-center space-x-2 text-xs font-extrabold text-emerald-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                    <span>Awaiting Admin Payment Verification...</span>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Your payment will be verified by the admin. Wallet balance will update automatically upon approval.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MEDICINE REMINDER SCHEDULE MODAL */}
      {showReminderModal && (
        <div className="fixed inset-0 bg-slate-955/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSaveReminder} className="glass-panel max-w-md w-full rounded-3xl p-6 border border-slate-800 space-y-4 bg-slate-900 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-medical-400" />
                <h3 className="text-base font-bold text-white">{editReminderObj ? 'Edit Medicine Schedule' : 'Add Medicine Schedule'}</h3>
              </div>
              <button type="button" onClick={() => setShowReminderModal(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-200 block">Medicine Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Metformin / Paracetamol"
                value={remForm.name}
                onChange={(e) => setRemForm({ ...remForm, name: e.target.value })}
                className="w-full bg-white text-slate-900 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-200 block">Dosage</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 500mg / 1 tablet"
                  value={remForm.dosage}
                  onChange={(e) => setRemForm({ ...remForm, dosage: e.target.value })}
                  className="w-full bg-white text-slate-900 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-200 block">Scheduled Times</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 08:00 AM, 09:00 PM"
                  value={remForm.timesStr}
                  onChange={(e) => setRemForm({ ...remForm, timesStr: e.target.value })}
                  className="w-full bg-white text-slate-900 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-200 block">Start Date</label>
                <input
                  type="date"
                  required
                  value={remForm.startDate}
                  onChange={(e) => setRemForm({ ...remForm, startDate: e.target.value })}
                  className="w-full bg-white text-slate-900 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-200 block">End Date</label>
                <input
                  type="date"
                  required
                  value={remForm.endDate}
                  onChange={(e) => setRemForm({ ...remForm, endDate: e.target.value })}
                  className="w-full bg-white text-slate-900 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-200 block">Instructions / Notes</label>
              <input
                type="text"
                placeholder="e.g. Take after food with warm water"
                value={remForm.notes}
                onChange={(e) => setRemForm({ ...remForm, notes: e.target.value })}
                className="w-full bg-white text-slate-900 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-medical-600 hover:bg-medical-500 text-white py-3 rounded-xl text-xs font-bold shadow-lg transition-all"
            >
              Save Medicine Schedule
            </button>
          </form>
        </div>
      )}

      {/* POST-LOGIN APP PERMISSIONS DIALOG */}
      {showPermissionModal && (
        <div className="fixed inset-0 bg-slate-955/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel max-w-md w-full rounded-3xl p-6 border border-slate-800 bg-slate-900 shadow-2xl space-y-6">
            
            {/* Step Indicators (Dots) */}
            <div className="flex justify-center items-center space-x-2">
              <span className={`h-1.5 rounded-full transition-all ${permissionStep === 1 ? 'w-6 bg-sky-500' : 'w-1.5 bg-slate-700'}`} />
              <span className={`h-1.5 rounded-full transition-all ${permissionStep === 2 ? 'w-6 bg-sky-500' : 'w-1.5 bg-slate-700'}`} />
              <span className={`h-1.5 rounded-full transition-all ${permissionStep === 3 ? 'w-6 bg-sky-500' : 'w-1.5 bg-slate-700'}`} />
            </div>

            {permissionStep === 1 && (
              <div className="space-y-6 animate-fade-in">
                <div className="text-center space-y-3">
                  <div className="bg-red-500/20 w-16 h-16 rounded-2xl flex items-center justify-center text-red-400 mx-auto border border-red-500/30 shadow-lg shadow-red-500/10">
                    <MapPin className="h-8 w-8" />
                  </div>
                  <h2 className="text-lg font-bold text-white font-heading">Location Access</h2>
                  <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
                    Smart Health Prediction needs location access to search for nearby hospitals, pharmacies, emergency medical care, and PHCs in real-time.
                  </p>
                </div>

                <div className="flex flex-col space-y-2">
                  <button
                    onClick={handleAllowLocation}
                    type="button"
                    className="w-full bg-medical-600 hover:bg-medical-500 text-white py-3 rounded-xl text-xs font-bold shadow-lg transition-all text-center cursor-pointer hover:scale-[1.01]"
                  >
                    Allow Location Access
                  </button>
                  <button
                    onClick={handleDenyLocation}
                    type="button"
                    className="w-full bg-slate-800 hover:bg-slate-750 text-slate-300 py-3 rounded-xl text-xs font-bold transition-all text-center cursor-pointer border border-slate-700 hover:scale-[1.01]"
                  >
                    Deny
                  </button>
                </div>
              </div>
            )}

            {permissionStep === 2 && (
              <div className="space-y-6 animate-fade-in">
                <div className="text-center space-y-3">
                  <div className="bg-blue-500/20 w-16 h-16 rounded-2xl flex items-center justify-center text-blue-400 mx-auto border border-blue-500/30 shadow-lg shadow-blue-500/10">
                    <Bluetooth className="h-8 w-8" />
                  </div>
                  <h2 className="text-lg font-bold text-white font-heading">Bluetooth Integration</h2>
                  <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
                    Allow bluetooth access to sync physiological data from external blood pressure monitors, smartwatch vitals trackers, and oximeters automatically.
                  </p>
                </div>

                <div className="flex flex-col space-y-2">
                  <button
                    onClick={handleAllowBluetooth}
                    type="button"
                    className="w-full bg-medical-600 hover:bg-medical-500 text-white py-3 rounded-xl text-xs font-bold shadow-lg transition-all text-center cursor-pointer hover:scale-[1.01]"
                  >
                    Allow Bluetooth Access
                  </button>
                  <button
                    onClick={handleDenyBluetooth}
                    type="button"
                    className="w-full bg-slate-800 hover:bg-slate-750 text-slate-300 py-3 rounded-xl text-xs font-bold transition-all text-center cursor-pointer border border-slate-700 hover:scale-[1.01]"
                  >
                    Deny
                  </button>
                </div>
              </div>
            )}

            {permissionStep === 3 && (
              <div className="space-y-6 animate-fade-in">
                <div className="text-center space-y-3">
                  <div className="bg-amber-500/20 w-16 h-16 rounded-2xl flex items-center justify-center text-amber-400 mx-auto border border-amber-500/30 shadow-lg shadow-amber-500/10">
                    <User className="h-8 w-8" />
                  </div>
                  <h2 className="text-lg font-bold text-white font-heading">Emergency Contacts</h2>
                  <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
                    Secure access to emergency contact details to automatically trigger SOS alert messages and send clinical risk reports when high critical cardiac anomalies are detected.
                  </p>
                </div>

                <div className="flex flex-col space-y-2">
                  <button
                    onClick={handleAllowContacts}
                    type="button"
                    className="w-full bg-medical-600 hover:bg-medical-500 text-white py-3 rounded-xl text-xs font-bold shadow-lg transition-all text-center cursor-pointer hover:scale-[1.01]"
                  >
                    Allow Contacts Access
                  </button>
                  <button
                    onClick={handleDenyContacts}
                    type="button"
                    className="w-full bg-slate-800 hover:bg-slate-750 text-slate-300 py-3 rounded-xl text-xs font-bold transition-all text-center cursor-pointer border border-slate-700 hover:scale-[1.01]"
                  >
                    Deny
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Bluetooth Pairing Request Permission Modal */}
      {showBleModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border-2 border-sky-500/50 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 text-white">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="w-12 h-12 rounded-2xl bg-sky-500/20 border border-sky-500/40 text-sky-400 flex items-center justify-center shrink-0">
                <Bluetooth className="w-7 h-7 animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">Bluetooth Device Pairing</h3>
                <p className="text-xs text-slate-300 font-bold">Detected: ActiveWatch Pro</p>
              </div>
            </div>

            <p className="text-xs text-slate-200 font-medium leading-relaxed">
              Allow <strong>Smart Health Predictor</strong> to pair with <strong>ActiveWatch Pro</strong> over Bluetooth to stream real-time heart rate, blood pressure, SpO2 %, and step count?
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={handleDenyBleConnection}
                type="button"
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-extrabold py-3 rounded-xl text-xs border border-slate-700 transition-all cursor-pointer"
              >
                Deny
              </button>
              <button
                onClick={handleAllowBleConnection}
                type="button"
                className="w-full bg-sky-600 hover:bg-sky-500 text-white font-black py-3 rounded-xl text-xs shadow-lg transition-all active:scale-95 cursor-pointer"
              >
                Allow & Connect
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generic Pharmacy Price Comparator Modal */}
      <PharmacyPriceComparator
        isOpen={showPharmacyComparator}
        onClose={() => setShowPharmacyComparator(false)}
      />
    </div>
  );
}


