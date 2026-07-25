import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PhoneCall, Video, Calendar, ShieldCheck, CheckCircle2, RefreshCw, FileText, X, MapPin, Search, Navigation, CreditCard, Wallet, QrCode, Smartphone, ExternalLink, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { api } from '../utils/api';

export default function Telemedicine() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const specialtyParam = searchParams.get('specialty');

  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [consultType, setConsultType] = useState('video'); // video, direct_call, offline
  const [loading, setLoading] = useState(true);

  // Per-Doctor Consultation & Payment State Isolation (Keyed by doc.id)
  const [doctorSessions, setDoctorSessions] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('doctorSessions') || '{}');
    } catch (e) {
      return {};
    }
  });
  const [activeVideoDocId, setActiveVideoDocId] = useState(null);
  const [callTimer, setCallTimer] = useState(0);

  // Discovery Mode (Auto GPS vs Manual Location Entry)
  const [discoveryMode, setDiscoveryMode] = useState('gps');
  const [manualSearchAddress, setManualSearchAddress] = useState('');

  useEffect(() => {
    if (specialtyParam) {
      setDiscoveryMode('manual');
      setManualSearchAddress(specialtyParam);
    }
  }, [specialtyParam]);

  // Mandatory Patient Details Form for Offline Appointment (No hardcoded dummy values)
  const userObj = JSON.parse(localStorage.getItem('user') || '{}');
  const [patientDetailsForm, setPatientDetailsForm] = useState({
    name: userObj.name || '',
    age: userObj.age || '',
    gender: userObj.gender || 'Male',
    phone: userObj.mobileNumber || '',
    reason: '',
    preferredDate: '',
    preferredSlot: '10:00 AM - 10:30 AM',
    allergiesMedications: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    idProofRef: ''
  });
  const [showOfflineDetailsModal, setShowOfflineDetailsModal] = useState(false);

  // Professional Payment Modal State & Tabbed Payment Methods
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentOrder, setPaymentOrder] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('qr'); // qr, phonepe, card, wallet
  const [cardDetails, setCardDetails] = useState({ number: '', expiry: '', cvv: '', name: '' });
  const [walletBalance, setWalletBalance] = useState(0);
  const [isPolling, setIsPolling] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const pollIntervalRef = useRef(null);

  useEffect(() => {
    loadDoctors();
    loadWallet();
    return () => clearInterval(pollIntervalRef.current);
  }, []);

  useEffect(() => {
    let interval;
    if (activeVideoDocId) {
      interval = setInterval(() => setCallTimer(t => t + 1), 1000);
    } else {
      setCallTimer(0);
    }
    return () => clearInterval(interval);
  }, [activeVideoDocId]);

  const loadDoctors = async () => {
    try {
      setLoading(true);
      const data = await api.getDoctors();
      setDoctors(data.clinics || []);
    } catch (err) {
      console.error('Failed to load doctor directory:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadWallet = async () => {
    try {
      const w = await api.getWalletBalance().catch(() => ({ balance: 0 }));
      setWalletBalance(w.balance || 0);
    } catch (e) {
      console.error(e);
    }
  };

  const handleStartConsultation = (doc, type) => {
    setSelectedDoctor(doc);
    setConsultType(type);

    if (type === 'offline') {
      setShowOfflineDetailsModal(true);
      return;
    }

    if (type === 'direct_call') {
      window.location.href = `tel:${doc.contact || '04428290200'}`;
      return;
    }

    // Check if already paid/unlocked for this doctor (must be active & not completed/ended)
    const existingSession = doctorSessions[doc.id];
    if (existingSession && existingSession.paid && existingSession.status === 'active' && !existingSession.callEnded && (existingSession.expiresAt ? Date.now() < existingSession.expiresAt : true)) {
      setActiveVideoDocId(doc.id);
      return;
    }

    handleInitiatePayment(doc, type);
  };

  const handleConfirmOfflinePatientForm = (e) => {
    e.preventDefault();
    if (!patientDetailsForm.name || !patientDetailsForm.phone || !patientDetailsForm.reason) {
      alert('Please fill out all mandatory patient details before booking an offline appointment.');
      return;
    }
    setShowOfflineDetailsModal(false);
    handleInitiatePayment(selectedDoctor, 'offline');
  };

  const handleInitiatePayment = async (doc, type) => {
    try {
      setPaymentSuccess(false);
      setPaymentError('');
      const order = await api.createPaymentOrder({
        amount: doc.fee || 350,
        description: `${type === 'video' ? 'Video' : 'Offline'} Consultation — ${doc.name}`
      });
      setPaymentOrder(order);
      setShowPaymentModal(true);
      startStatusPolling(order.orderId, doc.id, type);
    } catch (err) {
      alert('Payment initialization error: ' + err.message);
    }
  };

  const startStatusPolling = (orderId, docId, type) => {
    clearInterval(pollIntervalRef.current);
    setIsPolling(true);
    pollIntervalRef.current = setInterval(async () => {
      try {
        const res = await api.checkOrderStatus(orderId);
        if (res && res.status === 'paid') {
          clearInterval(pollIntervalRef.current);
          setIsPolling(false);
          onPaymentVerifiedSuccess(orderId, docId, type);
        }
      } catch (e) {
        console.warn('Payment polling:', e);
      }
    }, 2500);
  };

  const onPaymentVerifiedSuccess = (orderId, docId, type) => {
    setPaymentSuccess(true);
    const roomName = `SmartHealth_Doc_${docId}_${orderId.substring(0, 8)}`;
    const now = Date.now();
    const newSession = {
      paid: true,
      type,
      orderId,
      roomName,
      paidAt: now,
      expiresAt: now + 60 * 60 * 1000, // 60-Minute Grace Window
      status: 'active'
    };

    setDoctorSessions(prev => {
      const updated = { ...prev, [docId]: newSession };
      localStorage.setItem('doctorSessions', JSON.stringify(updated));
      return updated;
    });

    setTimeout(() => {
      setShowPaymentModal(false);
      if (type === 'video') {
        setActiveVideoDocId(docId);
      } else {
        alert('Offline visit confirmed! Patient details recorded & PDF receipt ready.');
      }
    }, 1500);
  };

  const handleSimulatePayment = async () => {
    if (!paymentOrder || !selectedDoctor) return;
    try {
      setPaymentError('');
      await api.simulateConfirmPayment(paymentOrder.orderId);
      clearInterval(pollIntervalRef.current);
      setIsPolling(false);
      onPaymentVerifiedSuccess(paymentOrder.orderId, selectedDoctor.id, consultType);
    } catch (err) {
      setPaymentError(err.message);
    }
  };

  const handlePayViaWallet = async () => {
    if (!paymentOrder || !selectedDoctor) return;
    try {
      setPaymentError('');
      const res = await api.payWithWallet(paymentOrder.orderId);
      setWalletBalance(res.remainingBalance);
      clearInterval(pollIntervalRef.current);
      setIsPolling(false);
      onPaymentVerifiedSuccess(paymentOrder.orderId, selectedDoctor.id, consultType);
    } catch (err) {
      setPaymentError(err.message);
    }
  };

  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const filteredDoctors = discoveryMode === 'manual' && manualSearchAddress.trim().length > 0
    ? doctors.filter(d => d.address.toLowerCase().includes(manualSearchAddress.toLowerCase()) || d.name.toLowerCase().includes(manualSearchAddress.toLowerCase()) || d.specialty.toLowerCase().includes(manualSearchAddress.toLowerCase()))
    : doctors;

  const activeDoc = doctors.find(d => d.id === activeVideoDocId);
  const activeSession = activeVideoDocId ? doctorSessions[activeVideoDocId] : null;

  return (
    <div className="max-w-[1536px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-wide">{t('telemedicine.title')}</h1>
          <p className="text-xs text-slate-400">{t('telemedicine.subtitle')}</p>
        </div>
      </div>

      {/* Active WebRTC Isolated Video Consultation Room */}
      {activeDoc && activeSession && (
        <div className="glass-panel rounded-3xl p-6 border border-emerald-500/40 bg-slate-900 space-y-4 shadow-2xl relative">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-3">
              <span className="w-3 h-3 bg-red-500 rounded-full animate-ping" />
              <h3 className="text-sm font-bold text-white">Live HD Video Consultation — {activeDoc.name} ({activeDoc.specialty})</h3>
            </div>
            <span className="font-mono text-emerald-400 font-bold text-xs bg-slate-955 px-3 py-1 rounded-lg border border-slate-800">
              Session: {formatTimer(callTimer)}
            </span>
          </div>

          {/* Embedded Isolated Jitsi Meet Frame */}
          <div className="w-full rounded-2xl overflow-hidden border border-slate-800 bg-black h-[420px] shadow-inner relative">
            <iframe
              src={`https://meet.jit.si/${activeSession.roomName}`}
              title={`Video Call with ${activeDoc.name}`}
              className="w-full h-full border-0"
              allow="camera; microphone; display-capture; autoplay; clipboard-write"
            />
          </div>

          <div className="flex justify-between items-center pt-2">
            <a
              href={api.getReceiptPdfUrl(activeSession.orderId)}
              target="_blank"
              rel="noreferrer"
              className="bg-slate-800 hover:bg-slate-700 text-sky-400 px-4 py-2 rounded-xl text-xs font-bold border border-slate-700 flex items-center space-x-1.5"
            >
              <FileText className="h-4 w-4" />
              <span>Download Digital Receipt & Consultation Summary</span>
            </a>

            <button
              onClick={() => {
                if (activeDoc && activeDoc.id) {
                  const updatedSessions = { ...doctorSessions };
                  delete updatedSessions[activeDoc.id];
                  setDoctorSessions(updatedSessions);
                  localStorage.setItem('doctorSessions', JSON.stringify(updatedSessions));
                }
                setActiveVideoDocId(null);
                alert('Consultation call ended cleanly. You can book a new consultation with any doctor anytime.');
              }}
              className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-lg transition-all"
            >
              End Consultation Call
            </button>
          </div>
        </div>
      )}

      {/* Hospital Discovery Mode Selector */}
      <div className="glass-panel rounded-2xl p-4 border border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center space-x-3">
          <MapPin className="h-5 w-5 text-sky-400" />
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">{t('telemedicine.discovery_title')}</h3>
            <p className="text-[11px] text-slate-400">{t('telemedicine.discovery_subtitle')}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <div className="flex bg-slate-955 p-1 rounded-xl border border-slate-800 text-xs font-bold">
            <button
              onClick={() => setDiscoveryMode('gps')}
              className={`px-3 py-1 rounded-lg transition-all ${
                discoveryMode === 'gps' ? 'bg-medical-600 text-white' : 'text-slate-400'
              }`}
            >
              {t('telemedicine.auto_gps')}
            </button>
            <button
              onClick={() => setDiscoveryMode('manual')}
              className={`px-3 py-1 rounded-lg transition-all ${
                discoveryMode === 'manual' ? 'bg-medical-600 text-white' : 'text-slate-400'
              }`}
            >
              {t('telemedicine.manual_address')}
            </button>
          </div>

          {discoveryMode === 'manual' && (
            <div className="relative flex-1 sm:w-48">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-500" />
              <input
                type="text"
                value={manualSearchAddress}
                onChange={(e) => setManualSearchAddress(e.target.value)}
                placeholder="Search specialty, city..."
                className="w-full bg-white text-slate-900 border border-slate-300 rounded-xl pl-8 pr-2 py-1 text-xs font-semibold outline-none"
              />
            </div>
          )}
        </div>
      </div>

      {/* Specialist Directory Cards */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-white tracking-wide">{t('telemedicine.directory_title')}</h2>

        {loading ? (
          <div className="text-center py-12 text-slate-500 text-xs">Loading specialist directory...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDoctors.map(doc => {
              const docSession = doctorSessions[doc.id];
              const isDocSessionActive = docSession?.paid && docSession?.status === 'active' && !docSession?.callEnded && (docSession?.expiresAt ? Date.now() < docSession.expiresAt : true);

              return (
                <div key={doc.id} className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4 hover:border-slate-700 transition-all flex flex-col justify-between">
                  <div className="space-y-3">
                    
                    {/* Uniform Right-Aligned VERIFIED Badge Header */}
                    <div className="flex items-center justify-between border-b border-slate-850 pb-2.5">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-sm font-bold text-white">{doc.name}</h3>
                        <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" title="Verified License" />
                      </div>
                      <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase shrink-0">
                        {t('telemedicine.verified')}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-sky-400 block">{doc.specialty || 'General Practitioner'}</span>
                      <p className="text-xs text-slate-400 line-clamp-2">{doc.address}</p>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-850">
                      <span className="text-yellow-400 font-bold">★ {doc.rating || 4.8}</span>
                      <span className="text-white font-extrabold">Fee: ₹{doc.fee || 350}</span>
                    </div>
                  </div>

                  {/* Actions: Video Call, Direct Call, Offline Visit, Get Directions */}
                  <div className="space-y-2 pt-2">
                    {isDocSessionActive ? (
                      <button
                        onClick={() => setActiveVideoDocId(doc.id)}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2 rounded-xl flex items-center justify-center space-x-2 transition-all shadow-lg animate-pulse"
                      >
                        <Video className="h-4 w-4" />
                        <span>Re-enter Active HD Video Call</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStartConsultation(doc, 'video')}
                        className="w-full bg-medical-600 hover:bg-medical-500 text-white text-xs font-bold py-2 rounded-xl flex items-center justify-center space-x-2 transition-all shadow"
                      >
                        <Video className="h-4 w-4" />
                        <span>{t('telemedicine.hd_video')}</span>
                      </button>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleStartConsultation(doc, 'direct_call')}
                        className="bg-slate-900 border border-slate-800 text-slate-200 hover:text-white text-xs font-semibold py-2 rounded-xl flex items-center justify-center space-x-1"
                      >
                        <PhoneCall className="h-3.5 w-3.5 text-sky-400" />
                        <span>{t('telemedicine.direct_call')}</span>
                      </button>

                      <button
                        onClick={() => handleStartConsultation(doc, 'offline')}
                        className="bg-slate-900 border border-slate-800 text-slate-200 hover:text-white text-xs font-semibold py-2 rounded-xl flex items-center justify-center space-x-1"
                      >
                        <Calendar className="h-3.5 w-3.5 text-amber-400" />
                        <span>{t('telemedicine.offline_visit')}</span>
                      </button>
                    </div>

                    {/* Gated Get Directions Button */}
                    {isDocSessionActive ? (
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${doc.lat || 13.0601},${doc.lng || 80.2514}`}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full bg-slate-955 border border-slate-800 text-sky-400 hover:text-white text-xs font-semibold py-1.5 rounded-xl flex items-center justify-center space-x-1.5 block text-center"
                      >
                        <Navigation className="h-3.5 w-3.5" />
                        <span>{t('telemedicine.get_directions')}</span>
                      </a>
                    ) : (
                      <div className="w-full bg-slate-955/50 border border-slate-850 text-slate-500 text-[11px] font-semibold py-1.5 rounded-xl text-center select-none cursor-not-allowed flex items-center justify-center space-x-1">
                        <span>🔒 Get Directions (Available after booking is confirmed)</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MANDATORY PATIENT DETAILS MODAL */}
      {showOfflineDetailsModal && selectedDoctor && (
        <div className="fixed inset-0 bg-slate-955/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleConfirmOfflinePatientForm} className="glass-panel max-w-md w-full rounded-3xl p-6 border border-slate-800 space-y-4 bg-slate-900 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Mandatory Patient Offline Details</h3>
              <button type="button" onClick={() => setShowOfflineDetailsModal(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Complete patient information before proceeding to offline visit booking with <strong>{selectedDoctor.name}</strong>.
            </p>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-200 block">Patient Name</label>
              <input
                type="text"
                required
                value={patientDetailsForm.name}
                onChange={(e) => setPatientDetailsForm({ ...patientDetailsForm, name: e.target.value })}
                className="w-full bg-white text-slate-900 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-200 block">Age</label>
                <input
                  type="number"
                  required
                  value={patientDetailsForm.age}
                  onChange={(e) => setPatientDetailsForm({ ...patientDetailsForm, age: Number(e.target.value) })}
                  className="w-full bg-white text-slate-900 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-200 block">Gender</label>
                <select
                  value={patientDetailsForm.gender}
                  onChange={(e) => setPatientDetailsForm({ ...patientDetailsForm, gender: e.target.value })}
                  className="w-full bg-white text-slate-900 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold outline-none"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-200 block">Contact Phone</label>
              <input
                type="tel"
                required
                value={patientDetailsForm.phone}
                onChange={(e) => setPatientDetailsForm({ ...patientDetailsForm, phone: e.target.value })}
                className="w-full bg-white text-slate-900 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-200 block">Reason for Consultation</label>
              <input
                type="text"
                required
                value={patientDetailsForm.reason}
                onChange={(e) => setPatientDetailsForm({ ...patientDetailsForm, reason: e.target.value })}
                placeholder="e.g. Cardiac Checkup / General Consultation"
                className="w-full bg-white text-slate-900 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold outline-none"
              />
            </div>

            {/* Preferred Appointment Date & Time Slot */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-200 block">Preferred Date</label>
                <input
                  type="date"
                  required
                  value={patientDetailsForm.preferredDate}
                  onChange={(e) => setPatientDetailsForm({ ...patientDetailsForm, preferredDate: e.target.value })}
                  className="w-full bg-white text-slate-900 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-200 block">Time Slot</label>
                <select
                  value={patientDetailsForm.preferredSlot}
                  onChange={(e) => setPatientDetailsForm({ ...patientDetailsForm, preferredSlot: e.target.value })}
                  className="w-full bg-white text-slate-900 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold outline-none"
                >
                  <option value="09:00 AM - 09:30 AM">09:00 AM - 09:30 AM</option>
                  <option value="10:00 AM - 10:30 AM">10:00 AM - 10:30 AM</option>
                  <option value="11:30 AM - 12:00 PM">11:30 AM - 12:00 PM</option>
                  <option value="02:00 PM - 02:30 PM">02:00 PM - 02:30 PM</option>
                  <option value="04:30 PM - 05:00 PM">04:30 PM - 05:00 PM</option>
                  <option value="06:00 PM - 06:30 PM">06:00 PM - 06:30 PM</option>
                </select>
              </div>
            </div>

            {/* Emergency Contact Name & Number */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-200 block">Emergency Contact Name</label>
                <input
                  type="text"
                  required
                  value={patientDetailsForm.emergencyContactName}
                  onChange={(e) => setPatientDetailsForm({ ...patientDetailsForm, emergencyContactName: e.target.value })}
                  placeholder="Relative / Guardian Name"
                  className="w-full bg-white text-slate-900 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-200 block">Emergency Phone</label>
                <input
                  type="tel"
                  required
                  value={patientDetailsForm.emergencyContactPhone}
                  onChange={(e) => setPatientDetailsForm({ ...patientDetailsForm, emergencyContactPhone: e.target.value })}
                  placeholder="+91 Mobile Number"
                  className="w-full bg-white text-slate-900 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold outline-none"
                />
              </div>
            </div>

            {/* Known Allergies / Ongoing Medications */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-200 block">Known Allergies / Ongoing Medications (Optional)</label>
              <textarea
                rows={2}
                value={patientDetailsForm.allergiesMedications}
                onChange={(e) => setPatientDetailsForm({ ...patientDetailsForm, allergiesMedications: e.target.value })}
                placeholder="e.g. Penicillin allergy, taking Metformin 500mg daily..."
                className="w-full bg-white text-slate-900 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold outline-none"
              />
            </div>

            {/* ID Proof Reference */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-200 block">ID Proof Reference (Optional)</label>
              <input
                type="text"
                value={patientDetailsForm.idProofRef}
                onChange={(e) => setPatientDetailsForm({ ...patientDetailsForm, idProofRef: e.target.value })}
                placeholder="e.g. Aadhaar / Passport last 4 digits: 4321"
                className="w-full bg-white text-slate-900 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-medical-600 hover:bg-medical-500 text-white py-3 rounded-xl text-xs font-bold shadow-lg transition-all"
            >
              Proceed to Gateway Payment & Confirmation
            </button>
          </form>
        </div>
      )}

      {/* PROFESSIONAL CONSULTATION FEE PAYMENT MODAL */}
      {showPaymentModal && paymentOrder && selectedDoctor && (
        <div className="fixed inset-0 bg-slate-955/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel max-w-lg w-full rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden">
            
            {/* Modal Header Banner */}
            <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-955 p-6 border-b border-slate-800 flex justify-between items-start">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-sky-400 font-bold block">SmartHealth Checkout</span>
                <h3 className="text-lg font-extrabold text-white">{selectedDoctor.name}</h3>
                <span className="text-xs text-slate-400">{selectedDoctor.specialty}</span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-emerald-400 block">₹{paymentOrder.amount}.00</span>
                <button
                  onClick={() => {
                    clearInterval(pollIntervalRef.current);
                    setShowPaymentModal(false);
                  }}
                  className="text-slate-400 hover:text-white mt-1"
                >
                  <X className="h-5 w-5 ml-auto" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5">

              {paymentSuccess ? (
                <div className="p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-center text-emerald-400 text-xs font-bold space-y-3">
                  <CheckCircle2 className="h-10 w-10 mx-auto text-emerald-400 animate-bounce" />
                  <p className="text-sm">Payment Verified & Gateway Confirmed! ✅</p>
                  <p className="text-slate-300 font-normal">Unlocking consultation room & generating PDF receipt...</p>
                </div>
              ) : (
                <>
                  {/* Payment Method Tabs */}
                  <div className="grid grid-cols-4 gap-1 bg-slate-955 p-1 rounded-xl border border-slate-800 text-xs font-bold">
                    <button
                      onClick={() => setPaymentMethod('qr')}
                      className={`py-2 px-1 rounded-lg flex flex-col items-center justify-center space-y-1 transition-all ${
                        paymentMethod === 'qr' ? 'bg-medical-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <QrCode className="h-4 w-4" />
                      <span className="text-[10px]">{t('payment.upi_qr')}</span>
                    </button>

                    <button
                      onClick={() => setPaymentMethod('phonepe')}
                      className={`py-2 px-1 rounded-lg flex flex-col items-center justify-center space-y-1 transition-all ${
                        paymentMethod === 'phonepe' ? 'bg-medical-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Smartphone className="h-4 w-4" />
                      <span className="text-[10px]">{t('payment.phonepe')}</span>
                    </button>

                    <button
                      onClick={() => setPaymentMethod('card')}
                      className={`py-2 px-1 rounded-lg flex flex-col items-center justify-center space-y-1 transition-all ${
                        paymentMethod === 'card' ? 'bg-medical-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <CreditCard className="h-4 w-4" />
                      <span className="text-[10px]">{t('payment.card')}</span>
                    </button>

                    <button
                      onClick={() => setPaymentMethod('wallet')}
                      className={`py-2 px-1 rounded-lg flex flex-col items-center justify-center space-y-1 transition-all ${
                        paymentMethod === 'wallet' ? 'bg-medical-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Wallet className="h-4 w-4" />
                      <span className="text-[10px]">{t('payment.wallet')}</span>
                    </button>
                  </div>

                  {paymentError && (
                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-semibold">
                      ⚠️ {paymentError}
                    </div>
                  )}

                  {/* Tab Body */}
                  {paymentMethod === 'qr' && (
                    <div className="space-y-3 text-center">
                      <div className="bg-white p-3 rounded-2xl w-44 h-44 mx-auto border border-slate-300 shadow-md">
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(paymentOrder.upiUrl)}`}
                          alt="UPI QR Code"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <p className="text-[11px] text-slate-400">Scan QR Code using Google Pay, PhonePe, Paytm or any UPI App.</p>
                    </div>
                  )}

                  {paymentMethod === 'phonepe' && (
                    <div className="space-y-3 text-center py-2">
                      <Smartphone className="h-10 w-10 text-purple-400 mx-auto" />
                      <p className="text-xs text-slate-300">Tap below to pay via PhonePe / GPay app intent:</p>
                      <a
                        href={paymentOrder.phonePeIntent || `upi://pay?pa=smarthealth@ybl&pn=SmartHealthPrediction&am=${paymentOrder.amount}&tr=${paymentOrder.orderId}`}
                        className="inline-flex items-center space-x-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-lg transition-all"
                      >
                        <Smartphone className="h-4 w-4" />
                        <span>Open PhonePe / GPay App (Mobile Intent)</span>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                      <p className="text-[10px] text-slate-400 italic max-w-xs mx-auto">
                        Note: App intent links open installed UPI apps on mobile devices. On desktop computers, please use the <strong>UPI QR Code</strong> tab to scan and pay.
                      </p>
                    </div>
                  )}

                  {paymentMethod === 'card' && (
                    <div className="space-y-3 text-left">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-300 block">Card Number</label>
                        <input
                          type="text"
                          value={cardDetails.number}
                          onChange={(e) => setCardDetails({ ...cardDetails, number: e.target.value })}
                          placeholder="1234 5678 9012 3456"
                          className="w-full bg-white text-slate-900 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold outline-none placeholder:text-slate-400 placeholder:font-normal"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-300 block">Expiry (MM/YY)</label>
                          <input
                            type="text"
                            value={cardDetails.expiry}
                            onChange={(e) => setCardDetails({ ...cardDetails, expiry: e.target.value })}
                            placeholder="MM/YY"
                            className="w-full bg-white text-slate-900 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold outline-none placeholder:text-slate-400 placeholder:font-normal"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-300 block">CVV</label>
                          <input
                            type="password"
                            maxLength={3}
                            value={cardDetails.cvv}
                            onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value })}
                            placeholder="123"
                            className="w-full bg-white text-slate-900 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold outline-none placeholder:text-slate-400 placeholder:font-normal"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'wallet' && (
                    <div className="p-4 bg-slate-955 rounded-2xl border border-slate-800 space-y-3 text-center">
                      <Wallet className="h-8 w-8 text-emerald-400 mx-auto" />
                      <div>
                        <span className="text-xs text-slate-400 block">Current Health Wallet Balance</span>
                        <span className="text-2xl font-black text-white">₹{walletBalance}.00</span>
                      </div>

                      {walletBalance >= paymentOrder.amount ? (
                        <button
                          onClick={handlePayViaWallet}
                          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2.5 rounded-xl shadow-lg transition-all"
                        >
                          Pay ₹{paymentOrder.amount}.00 Instantly from Wallet
                        </button>
                      ) : (
                        <p className="text-xs text-red-400 font-semibold">
                          Insufficient wallet balance. Please add money to wallet or select another payment option.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Awaiting Admin Verification Live Status Indicator */}
                  <div className="bg-slate-800/90 border border-emerald-500/40 rounded-2xl p-3.5 text-center space-y-1 shadow-lg">
                    <div className="flex items-center justify-center space-x-2 text-xs font-extrabold text-emerald-400">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                      <span>Awaiting Admin Payment Verification...</span>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Scan QR code or complete payment of ₹{paymentOrder.amount}.00. Consultation room will unlock automatically once verified by admin.
                    </p>
                  </div>

                  <a
                    href={api.getReceiptPdfUrl(paymentOrder.orderId)}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full bg-slate-955 hover:bg-slate-800 text-sky-400 py-2 rounded-xl text-xs font-bold border border-slate-800 flex items-center justify-center space-x-1.5 block text-center"
                  >
                    <FileText className="h-4 w-4" />
                    <span>{t('payment.download_receipt')}</span>
                  </a>
                </>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
