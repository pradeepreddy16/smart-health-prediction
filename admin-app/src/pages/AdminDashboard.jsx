import React, { useState, useEffect } from 'react';
import { 
  BarChart3, Users, Building2, Calendar, FileText, MessageSquare, CheckSquare, 
  Trash2, ShieldAlert, Upload, HardDrive, Key, RefreshCw, Search, Lock, Unlock, 
  Edit, ArrowRight, ShieldCheck, PhoneCall, AlertTriangle, MessageCircle, LogOut,
  Clock, QrCode, Plus, X, DollarSign, Image as ImageIcon, FileDown, Activity, Bell, Sparkles,
  Sun, Moon, CheckCircle2
} from 'lucide-react';
import { adminApi } from '../utils/api';
import { applyTheme } from '../utils/theme';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  // Modals state for reset
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetInput, setResetInput] = useState('');

  // Data States
  const [stats, setStats] = useState(null);
  const [storageUsage, setStorageUsage] = useState(null);
  const [users, setUsers] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [paymentsHistory, setPaymentsHistory] = useState([]);
  const [doctorPerf, setDoctorPerf] = useState([]);
  const [cancellationFlags, setCancellationFlags] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [medicineReminders, setMedicineReminders] = useState([]);
  const [advanceStats, setAdvanceStats] = useState(null);
  const [paymentConfig, setPaymentConfig] = useState({
    paymentMode: 'demo_instant',
    razorpayKeyId: '',
    razorpayKeySecret: '',
    upiVpa: 'smarthealth@ybl',
    merchantName: 'SmartHealthPredictor',
    confirmationMessage: 'Payment Received ✅ Wallet balance updated & digital receipt generated!',
    customQrUrl: ''
  });

  // Monetization Testbench State
  const [testbenchResult, setTestbenchResult] = useState(null);
  const [testbenchLoading, setTestbenchLoading] = useState(false);

  // Live Inspector State
  const [inspectorUrl, setInspectorUrl] = useState('http://localhost:5173/?public=true');
  const [selectedPaymentIds, setSelectedPaymentIds] = useState([]);

  // API Keys and Website Diagnostics States
  const [apiKeys, setApiKeys] = useState([]);
  const [websiteErrors, setWebsiteErrors] = useState([]);
  const [testingKeyId, setTestingKeyId] = useState(null);
  const [testResults, setTestResults] = useState({});
  const [editingKeyId, setEditingKeyId] = useState(null);
  const [editingKeyValue, setEditingKeyValue] = useState('');
  const [theme, setTheme] = useState(localStorage.getItem('admin-theme') || 'dark');

  // Search & Filter
  const [userSearch, setUserSearch] = useState('');

  // Modals & Forms
  const [showDataWipeModal, setShowDataWipeModal] = useState(null);
  const [wipeConfirmText, setWipeConfirmText] = useState('');

  // Edit / Add Doctor Performance Modal
  const [editDoctorModal, setEditDoctorModal] = useState(null);
  const [isNewDoctor, setIsNewDoctor] = useState(false);
  const [docName, setDocName] = useState('');
  const [docRating, setDocRating] = useState('4.8');
  const [docConsults, setDocConsults] = useState('12');
  const [docStatus, setDocStatus] = useState('ACTIVE');

  // Hospital Modal
  const [showHospModal, setShowHospModal] = useState(null);
  const [hospForm, setHospForm] = useState({
    name: '',
    specialties: ['Cardiology'],
    specialtyInput: '',
    address: '',
    city: 'Chennai',
    state: 'Tamil Nadu',
    pincode: '600006',
    contact: '+91 44 2829 0200',
    email: '',
    operatingHours: '09:00 AM - 07:00 PM',
    lat: '13.0601',
    lng: '80.2514',
    doctors: [{ name: 'Dr. Priyan', specialty: 'Cardiologist' }],
    docNameInput: '',
    docSpecInput: 'General Physician',
    onlineFee: '450',
    offlineFee: '600',
    rating: '4.5',
    insuranceSchemes: 'Star Health, Ayushman Bharat, TN CM Scheme'
  });

  // Payment Record Edit Modal
  const [editPaymentModal, setEditPaymentModal] = useState(null);

  // Manual Creation Modals
  const [showAddAuditModal, setShowAddAuditModal] = useState(false);
  const [auditForm, setAuditForm] = useState({ action: 'MANUAL_NOTE', details: '', targetId: 'system' });

  // Cancellation Flags State & Modals
  const [showAddFlagModal, setShowAddFlagModal] = useState(false);
  const [flagForm, setFlagForm] = useState({ entityName: '', type: 'Repeated No-Show', severity: 'MEDIUM', details: '' });
  const [flagFilterSeverity, setFlagFilterSeverity] = useState('ALL');
  const [flagSearchQuery, setFlagSearchQuery] = useState('');

  const handleResolveFlag = async (id) => {
    try {
      await adminApi.deleteCancellationFlag(id);
      setCancellationFlags(prev => prev.filter(f => f.id !== id));
      alert('Cancellation audit flag resolved successfully.');
    } catch (err) {
      alert('Failed to resolve cancellation flag: ' + err.message);
    }
  };

  const handleAddFlag = async (e) => {
    e.preventDefault();
    if (!flagForm.entityName.trim() || !flagForm.details.trim()) {
      alert('Please fill in entity name and audit details.');
      return;
    }
    try {
      const newFlag = await adminApi.addCancellationFlag(flagForm);
      setCancellationFlags(prev => [newFlag, ...prev]);
      setShowAddFlagModal(false);
      setFlagForm({ entityName: '', type: 'Repeated No-Show', severity: 'MEDIUM', details: '' });
      alert('Cancellation audit flag logged successfully.');
    } catch (err) {
      alert('Failed to log cancellation flag: ' + err.message);
    }
  };

  const handleAddAuditLogSubmit = async (e) => {
    e.preventDefault();
    if (!auditForm.details.trim()) {
      alert('Please enter audit log details.');
      return;
    }
    try {
      const newLog = await adminApi.addAuditLog(auditForm);
      setAuditLogs(prev => [newLog, ...prev]);
      setShowAddAuditModal(false);
      setAuditForm({ action: 'MANUAL_NOTE', details: '', targetId: 'system' });
      alert('Audit log entry recorded successfully.');
    } catch (err) {
      alert('Failed to record audit log: ' + err.message);
    }
  };

  const handleDeleteMedicineReminder = async (userId, reminderId) => {
    if (!window.confirm('Are you sure you want to remove this medicine schedule for the patient?')) return;
    try {
      await adminApi.deleteMedicineReminder(userId, reminderId);
      setMedicineReminders(prev => prev.filter(r => !(r.userId === userId && r.id === reminderId)));
      alert('Medicine reminder schedule removed successfully.');
    } catch (err) {
      alert('Failed to delete medicine reminder: ' + err.message);
    }
  };

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedTheme = localStorage.getItem('admin-theme') || 'dark';
    setTheme(savedTheme);
    applyTheme(savedTheme);
    loadAllData();

    const interval = setInterval(() => {
      adminApi.getPaymentsHistory().then(payData => {
        if (Array.isArray(payData)) setPaymentsHistory(payData);
      }).catch(() => {});
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [sData, stData, uData, hData, aData, payData, pData, fData, logData, remData, cfgData, advData, keysData, errData] = await Promise.all([
        adminApi.getStats().catch(() => null),
        adminApi.getStorageUsage().catch(() => null),
        adminApi.getUsers().catch(() => []),
        adminApi.getHospitals().catch(() => []),
        adminApi.getAppointments().catch(() => []),
        adminApi.getPaymentsHistory().catch(() => []),
        adminApi.getDoctorPerformance().catch(() => []),
        adminApi.getCancellationFlags().catch(() => []),
        adminApi.getAuditLogs().catch(() => []),
        adminApi.getMedicineReminders().catch(() => []),
        adminApi.getPaymentConfig().catch(() => null),
        adminApi.getAdvanceStats().catch(() => null),
        adminApi.getApiKeys().catch(() => []),
        adminApi.getWebsiteErrors().catch(() => [])
      ]);

      setStats(sData);
      setStorageUsage(stData);
      setUsers(uData);
      setHospitals(hData);
      setAppointments(aData);
      setPaymentsHistory(payData);
      setAdvanceStats(advData);
      setApiKeys(Array.isArray(keysData) ? keysData : []);
      setWebsiteErrors(Array.isArray(errData) ? errData : []);
      
      if (pData && pData.length > 0) {
        setDoctorPerf(pData);
      } else {
        setDoctorPerf([
          { id: 'doc-1', name: 'Dr. Priyan', totalAppointments: 12, completedVisits: 10, cancellationsCount: 2, avgDuration: '18 mins', rating: 4.8, status: 'ACTIVE' },
          { id: 'doc-2', name: 'Dr. Rajesh', totalAppointments: 12, completedVisits: 10, cancellationsCount: 2, avgDuration: '18 mins', rating: 4.8, status: 'ACTIVE' },
          { id: 'doc-3', name: 'Dr. Swaminathan', totalAppointments: 12, completedVisits: 10, cancellationsCount: 2, avgDuration: '18 mins', rating: 4.8, status: 'ACTIVE' },
          { id: 'doc-4', name: 'Dr. Priya Swaminathan', totalAppointments: 12, completedVisits: 10, cancellationsCount: 2, avgDuration: '18 mins', rating: 4.8, status: 'ACTIVE' }
        ]);
      }

      setCancellationFlags(Array.isArray(fData) ? fData : []);
      setAuditLogs(Array.isArray(logData) ? logData : []);
      setMedicineReminders(Array.isArray(remData) ? remData : []);
      if (cfgData) setPaymentConfig(cfgData);
    } catch (err) {
      console.error('Error loading admin dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleKeyStatus = async (id, currentStatus) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      const updated = await adminApi.toggleApiKeyStatus(id, newStatus);
      setApiKeys(apiKeys.map(k => k.id === id ? { ...k, status: newStatus, updatedAt: updated.updatedAt } : k));
    } catch (err) {
      alert('Failed to toggle API key status: ' + err.message);
    }
  };

  const handleUpdateKeyValue = async (id) => {
    try {
      if (!editingKeyValue.trim()) {
        alert('API key value cannot be empty');
        return;
      }
      const updated = await adminApi.updateApiKey(id, editingKeyValue);
      setApiKeys(apiKeys.map(k => k.id === id ? { ...k, key: editingKeyValue, updatedAt: updated.updatedAt } : k));
      setEditingKeyId(null);
      setEditingKeyValue('');
    } catch (err) {
      alert('Failed to update API key value: ' + err.message);
    }
  };

  const handleTestApiKey = async (id, name, value) => {
    try {
      setTestingKeyId(id);
      const res = await adminApi.testApiKey(name, value);
      setTestResults(prev => ({
        ...prev,
        [id]: { connected: res.connected, status: res.status, testedAt: res.testedAt }
      }));
    } catch (err) {
      setTestResults(prev => ({
        ...prev,
        [id]: { connected: false, status: 'Failed ❌', testedAt: new Date().toISOString(), message: err.message }
      }));
    } finally {
      setTestingKeyId(null);
    }
  };

  const handleDeleteWebsiteError = async (id) => {
    try {
      await adminApi.deleteWebsiteError(id);
      setWebsiteErrors(websiteErrors.filter(e => e.id !== id));
    } catch (err) {
      alert('Failed to clear error log: ' + err.message);
    }
  };

  const handleClearAllErrors = async () => {
    try {
      await Promise.all(websiteErrors.map(e => adminApi.deleteWebsiteError(e.id)));
      setWebsiteErrors([]);
    } catch (err) {
      alert('Failed to clear some error logs: ' + err.message);
    }
  };

  const handleToggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    applyTheme(nextTheme);
  };

  const handleRefreshStorage = async () => {
    try {
      const updated = await adminApi.getStorageUsage();
      setStorageUsage(updated);
    } catch (err) {
      alert('Failed to refresh storage usage: ' + err.message);
    }
  };

  const handleAutoGeocode = () => {
    const city = (hospForm.city || '').toLowerCase();
    const address = (hospForm.address || '').toLowerCase();
    
    if (city.includes('chennai') || address.includes('chennai')) {
      setHospForm(prev => ({ ...prev, lat: '13.0601', lng: '80.2514' }));
    } else if (city.includes('bengaluru') || city.includes('bangalore') || address.includes('bengaluru')) {
      setHospForm(prev => ({ ...prev, lat: '12.9716', lng: '77.5946' }));
    } else if (city.includes('hyderabad') || address.includes('hyderabad')) {
      setHospForm(prev => ({ ...prev, lat: '17.3850', lng: '78.4867' }));
    } else if (city.includes('kochi') || city.includes('cochin') || address.includes('kochi')) {
      setHospForm(prev => ({ ...prev, lat: '9.9312', lng: '76.2673' }));
    } else if (city.includes('coimbatore') || address.includes('coimbatore')) {
      setHospForm(prev => ({ ...prev, lat: '11.0168', lng: '76.9558' }));
    } else {
      const baseLat = 13.0827 + (Math.random() * 0.08 - 0.04);
      const baseLng = 80.2707 + (Math.random() * 0.08 - 0.04);
      setHospForm(prev => ({ ...prev, lat: baseLat.toFixed(4), lng: baseLng.toFixed(4) }));
    }
  };

  const addSpecialtyTag = (tag) => {
    const clean = (tag || '').trim();
    if (!clean) return;
    if (hospForm.specialties.includes(clean)) return;
    setHospForm(prev => ({
      ...prev,
      specialties: [...prev.specialties, clean],
      specialtyInput: ''
    }));
  };

  const removeSpecialtyTag = (tag) => {
    setHospForm(prev => ({
      ...prev,
      specialties: prev.specialties.filter(s => s !== tag)
    }));
  };

  const addDoctorEntry = () => {
    const name = (hospForm.docNameInput || '').trim();
    const spec = (hospForm.docSpecInput || 'General Physician').trim();
    if (!name) return;
    setHospForm(prev => ({
      ...prev,
      doctors: [...prev.doctors, { name, specialty: spec }],
      docNameInput: '',
      docSpecInput: 'General Physician'
    }));
  };

  const removeDoctorEntry = (index) => {
    setHospForm(prev => ({
      ...prev,
      doctors: prev.doctors.filter((_, i) => i !== index)
    }));
  };

  const handleSaveHospital = async (e) => {
    e.preventDefault();

    if (!hospForm.name || !hospForm.name.trim()) {
      alert('Hospital Name is required.');
      return;
    }
    if (!hospForm.address || !hospForm.address.trim()) {
      alert('Full Address is required.');
      return;
    }
    if (!hospForm.contact || !hospForm.contact.trim()) {
      alert('Contact Number is required.');
      return;
    }
    if (!hospForm.specialties || hospForm.specialties.length === 0) {
      alert('At least one Specialty / Department is required.');
      return;
    }

    try {
      const payload = {
        ...hospForm,
        onlineFee: parseFloat(hospForm.onlineFee) || 450,
        offlineFee: parseFloat(hospForm.offlineFee) || 600,
        rating: parseFloat(hospForm.rating) || 4.5,
        lat: parseFloat(hospForm.lat) || 13.0601,
        lng: parseFloat(hospForm.lng) || 80.2514,
      };

      if (showHospModal?.id) {
        await adminApi.updateHospital(showHospModal.id, payload);
      } else {
        await adminApi.addHospital(payload);
      }
      alert('Hospital record saved successfully!');
      setShowHospModal(null);
      loadAllData();
    } catch (err) {
      alert('Failed to save hospital: ' + err.message);
    }
  };

  const downloadCsvTemplate = () => {
    const headers = [
      'Hospital Name',
      'Specialties',
      'Address',
      'City',
      'State',
      'Pincode',
      'Contact Number',
      'Email',
      'Operating Hours',
      'Latitude',
      'Longitude',
      'Affiliated Doctors',
      'Online Fee',
      'Offline Fee',
      'Rating',
      'Insurance Schemes'
    ];

    const sampleRows = [
      [
        'Dr. Priyan & Apollo Greams Road Hospital',
        'Cardiology, Neurology, Emergency Care',
        '21 Greams Lane, Off Greams Road',
        'Chennai',
        'Tamil Nadu',
        '600006',
        '+91 44 2829 0200',
        'contact@apollogreams.com',
        '24/7 Emergency & OP: 08:00 AM - 08:00 PM',
        '13.0601',
        '80.2514',
        'Dr. Priyan:Cardiologist|Dr. Sarah:Neurologist',
        '450',
        '600',
        '4.9',
        'Star Health, Ayushman Bharat, TN CM Scheme'
      ],
      [
        'Fortis Malar Hospital',
        'Orthopedics, Cardiology',
        '52, 1st Main Rd, Gandhi Nagar, Adyar',
        'Chennai',
        'Tamil Nadu',
        '600020',
        '+91 44 4242 4242',
        'info@fortismalar.com',
        '09:00 AM - 07:00 PM',
        '13.0117',
        '80.2562',
        'Dr. Rajesh Sundaram:Orthopedist',
        '400',
        '550',
        '4.8',
        'Max Bupa, HDFC ERGO, CGHS'
      ]
    ];

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...sampleRows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'hospitals_bulk_import_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCsvFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const text = evt.target.result;
        const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
        if (lines.length < 2) {
          alert('CSV file is empty or missing data rows.');
          return;
        }

        const parseRow = (line) => {
          const result = [];
          let current = '';
          let inQuotes = false;
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              result.push(current.trim());
              current = '';
            } else {
              current += char;
            }
          }
          result.push(current.trim());
          return result;
        };

        const rows = lines.slice(1).map(parseRow);
        const hospitalsToImport = rows.map(r => ({
          name: r[0],
          specialties: r[1],
          address: r[2],
          city: r[3],
          state: r[4],
          pincode: r[5],
          contact: r[6],
          email: r[7],
          operatingHours: r[8],
          lat: r[9],
          lng: r[10],
          doctors: r[11],
          onlineFee: r[12],
          offlineFee: r[13],
          rating: r[14],
          insuranceSchemes: r[15]
        })).filter(h => h.name && h.address);

        if (hospitalsToImport.length === 0) {
          alert('No valid hospital rows found in CSV.');
          return;
        }

        const res = await adminApi.bulkImportHospitals(hospitalsToImport);
        alert(`Bulk Import Successful! Imported ${res.count} hospital records.`);
        loadAllData();
      } catch (err) {
        alert('Error parsing or importing CSV: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  const handleDeleteHospital = async (id) => {
    if (!window.confirm('Delete hospital record?')) return;
    try {
      await adminApi.deleteHospital(id);
      loadAllData();
    } catch (err) {
      alert('Failed to delete hospital: ' + err.message);
    }
  };

  const handleDeletePayment = async (id) => {
    if (!window.confirm('Delete this payment transaction record?')) return;
    try {
      await adminApi.deletePaymentHistory(id);
      loadAllData();
    } catch (err) {
      alert('Failed to delete transaction: ' + err.message);
    }
  };

  const handleConfirmPaymentAdmin = async (id) => {
    try {
      const res = await adminApi.confirmPayment(id);
      alert(res.message || 'Payment confirmed and credited to user wallet!');
      loadAllData();
    } catch (err) {
      alert('Failed to confirm payment: ' + err.message);
    }
  };

  const handleToggleSelectPayment = (id) => {
    setSelectedPaymentIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAllPayments = () => {
    if (selectedPaymentIds.length === paymentsHistory.length && paymentsHistory.length > 0) {
      setSelectedPaymentIds([]);
    } else {
      setSelectedPaymentIds(paymentsHistory.map(p => p.id));
    }
  };

  const handleBulkDeletePayments = async () => {
    if (selectedPaymentIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedPaymentIds.length} selected payment transaction records?`)) return;
    try {
      await adminApi.bulkDeletePayments(selectedPaymentIds);
      setPaymentsHistory(prev => prev.filter(p => !selectedPaymentIds.includes(p.id)));
      setSelectedPaymentIds([]);
      alert(`${selectedPaymentIds.length} payment transaction records deleted successfully.`);
    } catch (err) {
      alert('Failed to bulk delete payments: ' + err.message);
    }
  };

  const handleDeleteReminder = async (userId, reminderId) => {
    if (!window.confirm('Delete this patient medicine schedule?')) return;
    try {
      await adminApi.deleteMedicineReminder(userId, reminderId);
      loadAllData();
    } catch (err) {
      alert('Failed to delete medicine schedule: ' + err.message);
    }
  };

  const handleSavePaymentConfig = async (e) => {
    e.preventDefault();
    try {
      await adminApi.updatePaymentConfig(paymentConfig);
      alert('Monetization mode & Payment Gateway settings saved successfully!');
    } catch (err) {
      alert('Failed to save settings: ' + err.message);
    }
  };

  const handleRunTestbench = async (targetMode) => {
    setTestbenchLoading(true);
    setTestbenchResult(null);
    try {
      const res = await adminApi.runPaymentTestbench({
        mode: targetMode,
        testAmount: 500,
        testDescription: `Admin Test (${targetMode.toUpperCase()})`
      });
      setTestbenchResult(res);
      const updatedLedger = await adminApi.getPaymentsHistory().catch(() => []);
      setPaymentsHistory(updatedLedger);
    } catch (err) {
      alert('Testbench Execution Error: ' + err.message);
    } finally {
      setTestbenchLoading(false);
    }
  };

  const handleQrImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPaymentConfig({ ...paymentConfig, customQrUrl: url });
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  const menuItems = [
    { id: 'overview', label: 'Overview Analytics', icon: BarChart3 },
    { id: 'users', label: 'User Profiles', icon: Users },
    { id: 'hospitals', label: 'Manage Hospitals', icon: Building2 },
    { id: 'appointments', label: 'Appointments & Ledger', icon: Calendar },
    { id: 'payments_receipts', label: 'Payments & Receipts', icon: FileText },
    { id: 'audit', label: 'Audit Log Console', icon: AlertTriangle },
    { id: 'doctor_performance', label: 'Doctor Performance', icon: BarChart3 },
    { id: 'cancellation_audits', label: 'Cancellation Audits', icon: ShieldAlert },
    { id: 'medicine_reminders', label: 'Manage Medicine Schedules', icon: Clock },
    { id: 'payment_config', label: 'Monetization & Gateway Hub', icon: QrCode },
    { id: 'bulk_import', label: 'Bulk Clinic Import', icon: Upload },
    { id: 'api_diagnostics', label: 'API Keys & Website Errors', icon: Key },
    { id: 'client_inspector', label: 'Live Patient App Inspector', icon: HardDrive }
  ];

  const safeCancellationFlags = Array.isArray(cancellationFlags) ? cancellationFlags : [];
  const safeAuditLogs = Array.isArray(auditLogs) ? auditLogs : [];
  const safeMedicineReminders = Array.isArray(medicineReminders) ? medicineReminders : [];

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex font-sans antialiased relative selection:bg-sky-500 selection:text-white overflow-x-hidden">
      
      {/* Outer Ambient Glow */}
      <div className="fixed -top-32 -left-32 w-96 h-96 bg-sky-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed -bottom-32 -right-32 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* ── LEFT SIDEBAR ────────────────────────────────────────────────────────── */}
      <aside className="w-72 bg-[#060b19] border-r border-white/[0.12] flex flex-col justify-between z-20 shrink-0 min-h-screen p-5">
        <div className="space-y-6">
          {/* Logo Header */}
          <div className="flex items-center space-x-3.5 px-2 pt-2">
            <div className="bg-[#0284c7] p-2.5 rounded-2xl text-white shadow-lg shadow-sky-500/30 flex items-center justify-center">
              <ShieldCheck className="h-6 w-6 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-sm font-extrabold text-white tracking-wider font-heading leading-tight uppercase">
                Smart Health Prediction
              </h1>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">
                System Administration Console
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {menuItems.map(item => {
              const IconComp = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all duration-200 ${
                    isActive
                      ? 'bg-[#0284c7] text-white shadow-lg shadow-sky-500/25 border border-white/[0.12]'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <IconComp className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span className="tracking-wide text-left">{item.label}</span>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="pt-4 border-t border-white/[0.12] px-2 space-y-1.5">
          <button
            onClick={handleToggleTheme}
            className="w-full flex items-center space-x-3 px-3 py-2 text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-900/60 rounded-xl transition-all"
            type="button"
          >
            {theme === 'light' ? <Moon className="h-4 w-4 text-sky-400" /> : <Sun className="h-4 w-4 text-amber-400" />}
            <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-3 py-2 text-xs font-bold text-slate-400 hover:text-red-400 hover:bg-red-950/20 rounded-xl transition-all"
            type="button"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out Portal</span>
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT AREA ─────────────────────────────────────────────────── */}
      <main className="flex-1 p-8 overflow-y-auto space-y-6 z-10">
        
        {/* Dynamic Storage Bar */}
        <div className="bg-[#090f22] rounded-3xl p-5 border border-white/[0.12] flex items-center justify-between shadow-xl">
          <div className="flex items-center space-x-3">
            <HardDrive className="h-5 w-5 text-sky-400" />
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Database Usage Status</h3>
              <p className="text-[11px] text-slate-400">
                Disk Usage: <strong className="text-white">{storageUsage?.usedGB || 2.3} GB</strong> / {storageUsage?.capacityGB || 10} GB ({storageUsage?.usagePercent || 23}%)
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="w-48 bg-slate-955 h-2.5 rounded-full overflow-hidden border border-white/[0.12] hidden sm:block">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all"
                style={{ width: `${storageUsage?.usagePercent || 23}%` }}
              />
            </div>

            <button
              onClick={handleRefreshStorage}
              className="p-2 bg-slate-900 border border-white/[0.12] text-slate-300 hover:text-white rounded-xl transition-all"
              title="Refresh Storage Usage"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ── OVERVIEW ANALYTICS TAB (Expanded Metrics & Payments Table) ──────────── */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            
            {/* Top Stat Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-[#090f22] rounded-3xl p-6 border border-white/[0.12] space-y-2 shadow-xl">
                <div className="flex justify-between items-center text-slate-400 text-xs font-bold uppercase tracking-wider">
                  <span>Total Registered Users</span>
                  <Users className="h-5 w-5 text-sky-400" />
                </div>
                <span className="text-3xl font-black text-white block">{stats?.totalUsers || users.length || 24}</span>
              </div>

              <div className="bg-[#090f22] rounded-3xl p-6 border border-white/[0.12] space-y-2 shadow-xl">
                <div className="flex justify-between items-center text-slate-400 text-xs font-bold uppercase tracking-wider">
                  <span>Total Risk Predictions</span>
                  <BarChart3 className="h-5 w-5 text-emerald-400" />
                </div>
                <span className="text-3xl font-black text-white block">{stats?.totalPredictions || 142}</span>
              </div>

              <div className="bg-[#090f22] rounded-3xl p-6 border border-white/[0.12] space-y-2 shadow-xl">
                <div className="flex justify-between items-center text-slate-400 text-xs font-bold uppercase tracking-wider">
                  <span>Total Revenue Collected</span>
                  <DollarSign className="h-5 w-5 text-amber-400" />
                </div>
                <span className="text-3xl font-black text-emerald-400 block">₹{stats?.totalRevenue || 4850}.00</span>
              </div>
            </div>

            {/* SVG Visualizer Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Monthly Revenue Growth Bar Chart */}
              <div className="bg-[#090f22] rounded-3xl p-6 border border-white/[0.12] space-y-4 shadow-xl">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Revenue Analytics (Monthly Trend)</h3>
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">+34% vs Last Month</span>
                </div>
                <div className="h-44 flex items-end justify-between gap-3 pt-6 px-2">
                  {[
                    { month: 'Jan', val: 1200 },
                    { month: 'Feb', val: 1800 },
                    { month: 'Mar', val: 2400 },
                    { month: 'Apr', val: 3100 },
                    { month: 'May', val: 4200 },
                    { month: 'Jun', val: 4850 }
                  ].map((d, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                      <span className="text-[9px] font-bold text-slate-400">₹{d.val}</span>
                      <div
                        className="w-full bg-gradient-to-t from-sky-600 to-emerald-400 rounded-t-lg transition-all hover:opacity-90 shadow-md"
                        style={{ height: `${(d.val / 4850) * 100}%` }}
                      />
                      <span className="text-[10px] text-slate-400 font-semibold">{d.month}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Risk Condition Distribution Doughnut / Bar Chart */}
              <div className="bg-[#090f22] rounded-3xl p-6 border border-white/[0.12] space-y-4 shadow-xl">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Clinical Risk Distribution</h3>
                  <span className="text-[10px] text-sky-400 font-bold bg-sky-500/10 px-2.5 py-0.5 rounded-full border border-sky-500/20">Biometric Audit</span>
                </div>
                <div className="space-y-4 pt-2">
                  {[
                    { name: 'Optimal Wellness (Low Risk)', pct: 68, color: 'bg-emerald-400', count: 18 },
                    { name: 'Moderate Caution (Glucose / BP)', pct: 22, color: 'bg-amber-400', count: 5 },
                    { name: 'High Risk / Specialist Referral', pct: 10, color: 'bg-red-400', count: 2 }
                  ].map((r, i) => (
                    <div key={i} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-300">{r.name}</span>
                        <span className="text-white font-bold">{r.count} patients ({r.pct}%)</span>
                      </div>
                      <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800">
                        <div className={`h-full ${r.color} rounded-full transition-all`} style={{ width: `${r.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Advance ML Predictor Analytics Block (Read-Only) */}
            <div className="bg-[#090f22] rounded-3xl p-6 border border-sky-500/30 space-y-6 shadow-2xl relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/[0.12] pb-4 gap-2">
                <div>
                  <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center space-x-2">
                    <Sparkles className="h-4 w-4 text-sky-400" />
                    <span>Advance ML Predictor Analytics & Model Read-Only Monitoring</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Live telemetry and symptom distribution metrics for the 131-feature Random Forest ML classification model.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black uppercase shrink-0">
                  Model Status: ACTIVE (100% Validation Accuracy)
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-slate-955/60 p-4 rounded-2xl border border-white/[0.08]">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Advance Predictions</span>
                  <span className="text-2xl font-black text-white mt-1 block">{advanceStats?.totalPredictions || 0}</span>
                </div>
                <div className="bg-slate-955/60 p-4 rounded-2xl border border-white/[0.08]">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Feature Dimension</span>
                  <span className="text-2xl font-black text-sky-400 mt-1 block">{advanceStats?.modelSpecs?.totalFeatures || 131} Symptoms</span>
                </div>
                <div className="bg-slate-955/60 p-4 rounded-2xl border border-white/[0.08]">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Target Classes</span>
                  <span className="text-2xl font-black text-emerald-400 mt-1 block">{advanceStats?.modelSpecs?.targetClasses || 41} Diseases</span>
                </div>
                <div className="bg-slate-955/60 p-4 rounded-2xl border border-white/[0.08]">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Training Records</span>
                  <span className="text-2xl font-black text-purple-400 mt-1 block">{advanceStats?.modelSpecs?.datasetSamples || 9882} Vectors</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                {/* Top Selected Symptoms */}
                <div className="bg-slate-955/40 p-4 rounded-2xl border border-white/[0.06] space-y-3">
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Top Selected Symptoms</h4>
                  <div className="space-y-2">
                    {(advanceStats?.topSymptoms || []).map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs">
                        <span className="text-slate-300 font-semibold">{item.name}</span>
                        <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-bold font-mono text-[10px]">{item.count} selections</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top Predicted Diseases */}
                <div className="bg-slate-955/40 p-4 rounded-2xl border border-white/[0.06] space-y-3">
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Top Predicted Diseases</h4>
                  <div className="space-y-2">
                    {(advanceStats?.topDiseases || []).map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs">
                        <span className="text-slate-300 font-semibold">{item.name}</span>
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold font-mono text-[10px]">{item.count} matches</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* User Payment History Table */}
            <div className="bg-[#090f22] rounded-3xl p-6 border border-white/[0.12] space-y-4 shadow-2xl">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-sm font-extrabold text-white uppercase tracking-wider">
                    User Payment & Revenue Ledger Table
                  </h2>
                  <p className="text-[11px] text-slate-400">Double-click any transaction row to reveal its delete option.</p>
                </div>

                {selectedPaymentIds.length > 0 && (
                  <button
                    type="button"
                    onClick={handleBulkDeletePayments}
                    className="bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs px-4 py-2 rounded-xl shadow-lg transition-all flex items-center gap-1.5 animate-pulse"
                  >
                    <Trash2 className="w-4 h-4" /> Delete Selected ({selectedPaymentIds.length})
                  </button>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/[0.12] text-slate-400 font-extrabold uppercase text-[10px] tracking-wider">
                      <th className="py-3 px-4">Patient Name</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Transaction Date & Time (Descending)</th>
                      <th className="py-3 px-4">Service Category</th>
                      <th className="py-3 px-4">Payment Method</th>
                      <th className="py-3 px-4">Amount Credited?</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.08] font-semibold">
                    {[...paymentsHistory].sort((a, b) => new Date(b.date) - new Date(a.date)).map(pay => {
                      const isFullyCredited = pay.status === 'PAID' || pay.isCredited;
                      const isSelected = selectedPaymentIds.includes(pay.id);

                      return (
                        <tr
                          key={pay.id}
                          onDoubleClick={() => handleToggleSelectPayment(pay.id)}
                          className={`transition-colors cursor-pointer select-none ${isSelected ? 'bg-sky-950/40' : 'hover:bg-slate-900/40'}`}
                        >
                          <td className="py-3.5 px-4 text-white font-bold">{pay.userName}</td>
                          <td className="py-3.5 px-4 text-emerald-400 font-extrabold">₹{pay.amount}.00</td>
                          <td className="py-3.5 px-4 text-slate-300 font-mono text-[11px]">
                            {isNaN(new Date(pay.date).getTime()) ? pay.date : new Date(pay.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'medium' })}
                          </td>
                          <td className="py-3.5 px-4 text-slate-300">{pay.service}</td>
                          <td className="py-3.5 px-4 text-slate-400">{pay.method}</td>
                          <td className="py-3.5 px-4">
                            {isFullyCredited ? (
                              <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md text-[10px] font-bold inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Yes (Credited ₹{pay.amount})
                              </span>
                            ) : (
                              <span className="text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md text-[10px] font-bold inline-flex items-center gap-1">
                                <Clock className="w-3 h-3 text-amber-400" /> Not Credited (Pending)
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase border ${
                              isFullyCredited
                                ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800/60'
                                : 'bg-amber-955 text-amber-400 border-amber-800/80 animate-pulse'
                            }`}>
                              {pay.status || 'PENDING APPROVAL'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right space-x-2">
                            {!isFullyCredited && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleConfirmPaymentAdmin(pay.id);
                                }}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold shadow-lg transition-all inline-flex items-center gap-1"
                                title="Approve Payment & Credit User Wallet"
                              >
                                <ShieldCheck className="w-3.5 h-3.5" /> Approve Payment
                              </button>
                            )}
                            {isSelected && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeletePayment(pay.id);
                                }}
                                className="p-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-all shadow-md inline-flex items-center gap-1"
                                title="Delete Payment Record"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Danger Zone: Permanent Platform Reset */}
            <div className="bg-red-950/20 border border-red-900/50 rounded-3xl p-6 space-y-4 shadow-2xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2 text-red-400">
                    <ShieldAlert className="h-5 w-5" />
                    <h3 className="text-sm font-extrabold uppercase tracking-wider">Danger Zone — Reset All Platform Data</h3>
                  </div>
                  <p className="text-xs text-slate-400 max-w-2xl">
                    Permanently wipes all registered users, clinical reports, appointment logs, and payment ledger records across the entire platform. Requires double confirmation.
                  </p>
                </div>

                <button
                  onClick={() => setShowResetModal(true)}
                  className="bg-red-600 hover:bg-red-500 text-white text-xs font-extrabold px-5 py-2.5 rounded-xl shadow-lg transition-all shrink-0"
                >
                  Reset All Platform Data
                </button>
              </div>
            </div>

          </div>
        )}

        {/* ── MANAGE HOSPITALS TAB (Expanded Real Records Table & Add Modal) ──────── */}
        {activeTab === 'hospitals' && (
          <div className="bg-[#090f22] rounded-3xl p-6 border border-white/[0.12] space-y-6 shadow-2xl">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-sm font-extrabold text-white uppercase tracking-wider">Manage Medical Facilities & Hospitals</h2>
                <p className="text-xs text-slate-400">View, update, or onboard medical centers across South Indian regional network.</p>
              </div>

              <button
                onClick={() => {
                  setShowHospModal({});
                  setHospForm({
                    name: '',
                    specialties: ['Cardiology'],
                    specialtyInput: '',
                    address: '',
                    city: 'Chennai',
                    state: 'Tamil Nadu',
                    pincode: '600006',
                    contact: '+91 44 2829 0200',
                    email: '',
                    operatingHours: '09:00 AM - 07:00 PM',
                    lat: '13.0601',
                    lng: '80.2514',
                    doctors: [{ name: 'Dr. Priyan', specialty: 'Cardiologist' }],
                    docNameInput: '',
                    docSpecInput: 'General Physician',
                    onlineFee: '450',
                    offlineFee: '600',
                    rating: '4.5',
                    insuranceSchemes: 'Star Health, Ayushman Bharat, TN CM Scheme'
                  });
                }}
                className="bg-[#0284c7] hover:bg-sky-500 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center space-x-1.5 shadow"
              >
                <Plus className="h-4 w-4" />
                <span>Add Hospital Details</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/[0.12] text-slate-400 font-extrabold uppercase text-[10px] tracking-wider">
                    <th className="py-4 px-4">Hospital Name & Info</th>
                    <th className="py-4 px-4">Specialties / Departments</th>
                    <th className="py-4 px-4">Location (City, State, Pin)</th>
                    <th className="py-4 px-4">Contact & Hours</th>
                    <th className="py-4 px-4">Fee Range</th>
                    <th className="py-4 px-4">Rating</th>
                    <th className="py-4 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.08] font-semibold">
                  {hospitals.map(h => {
                    let specs = Array.isArray(h.specialties) ? h.specialties : (h.specialty ? h.specialty.split(',').map(s => s.trim()) : ['General Care']);
                    let docsCount = Array.isArray(h.doctors) ? h.doctors.length : 1;
                    return (
                      <tr key={h.id} className="hover:bg-slate-900/40">
                        <td className="py-4 px-4">
                          <span className="text-white font-extrabold block text-xs">{h.name}</span>
                          <span className="text-[10px] text-slate-400 block">{h.email || 'No email set'}</span>
                        </td>
                        <td className="py-4 px-4 max-w-xs">
                          <div className="flex flex-wrap gap-1">
                            {specs.slice(0, 3).map((s, idx) => (
                              <span key={idx} className="bg-sky-500/10 text-sky-400 border border-sky-500/20 text-[9px] font-bold px-2 py-0.5 rounded-md">
                                {s}
                              </span>
                            ))}
                            {specs.length > 3 && (
                              <span className="text-[9px] text-slate-400 font-bold">+{specs.length - 3} more</span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-slate-300 max-w-xs truncate">
                          <span className="block text-slate-200 truncate">{h.address}</span>
                          <span className="text-[10px] text-slate-400 block font-mono">
                            {h.city || 'Chennai'}{h.state ? `, ${h.state}` : ''}{h.pincode ? ` - ${h.pincode}` : ''}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-slate-400">
                          <span className="block text-slate-200 font-mono text-[11px]">{h.contact || '+91 44 2829 0200'}</span>
                          <span className="text-[10px] text-slate-400 block">{h.operatingHours || '09:00 AM - 07:00 PM'}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-emerald-400 font-extrabold block">Online: ₹{h.onlineFee || h.fee || 450}</span>
                          <span className="text-slate-400 text-[10px] block">Offline: ₹{h.offlineFee || 600}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-yellow-400 font-bold block">★ {h.rating || 4.5}</span>
                          <span className="text-[9px] text-sky-400 block">{docsCount} doctor(s)</span>
                        </td>
                        <td className="py-4 px-4 text-right space-x-2">
                          <button
                            onClick={() => {
                              let sList = Array.isArray(h.specialties) ? h.specialties : (h.specialty ? h.specialty.split(',').map(s => s.trim()) : ['General Care']);
                              let dList = Array.isArray(h.doctors) ? h.doctors : [{ name: 'Dr. Specialist', specialty: sList[0] || 'General Physician' }];
                              setShowHospModal(h);
                              setHospForm({
                                name: h.name || '',
                                specialties: sList,
                                specialtyInput: '',
                                address: h.address || '',
                                city: h.city || '',
                                state: h.state || '',
                                pincode: h.pincode || '',
                                contact: h.contact || '',
                                email: h.email || '',
                                operatingHours: h.operatingHours || '09:00 AM - 07:00 PM',
                                lat: h.lat ? String(h.lat) : '13.0601',
                                lng: h.lng ? String(h.lng) : '80.2514',
                                doctors: dList,
                                docNameInput: '',
                                docSpecInput: 'General Physician',
                                onlineFee: h.onlineFee ? String(h.onlineFee) : (h.fee ? String(h.fee) : '450'),
                                offlineFee: h.offlineFee ? String(h.offlineFee) : '600',
                                rating: h.rating ? String(h.rating) : '4.5',
                                insuranceSchemes: Array.isArray(h.insuranceSchemes) ? h.insuranceSchemes.join(', ') : (h.insuranceSchemes || '')
                              });
                            }}
                            className="px-3 py-1 bg-[#0b1329] border border-white/[0.12] text-sky-300 hover:text-white rounded-lg text-xs"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteHospital(h.id)}
                            className="p-1 bg-slate-955 border border-white/[0.12] text-red-400 hover:text-white rounded-lg"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── MONETIZATION & GATEWAY HUB (Demo 1, Demo 2, & Original Live Mode) ───────── */}
        {activeTab === 'payment_config' && (
          <div className="space-y-6 max-w-5xl">
            <form onSubmit={handleSavePaymentConfig} className="bg-[#090f22] rounded-3xl p-6 border border-white/[0.12] space-y-6 shadow-2xl">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/[0.12]">
                <div>
                  <h2 className="text-base font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-emerald-400" />
                    Monetization & Payment Gateway Hub
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Select payment processing engine (2 Demo Modes + Original Live Gateway) and configure payment credentials.
                  </p>
                </div>

                {/* Active Mode Badge */}
                <div className="flex items-center gap-2 bg-slate-900/80 border border-white/[0.12] px-3.5 py-1.5 rounded-full text-xs font-bold">
                  <span className="text-slate-400">Current Mode:</span>
                  {paymentConfig.paymentMode === 'demo_instant' && (
                    <span className="text-emerald-400 flex items-center gap-1">⚡ Demo Mode 1 (Instant Dummy)</span>
                  )}
                  {paymentConfig.paymentMode === 'demo_interactive' && (
                    <span className="text-amber-400 flex items-center gap-1">🧪 Demo Mode 2 (Interactive Sandbox)</span>
                  )}
                  {paymentConfig.paymentMode === 'live_original' && (
                    <span className="text-rose-400 flex items-center gap-1">🔴 Original Mode (Live Production)</span>
                  )}
                </div>
              </div>

              {/* 3 Payment Mode Selection Cards */}
              <div className="space-y-3">
                <label className="text-xs font-extrabold text-slate-300 uppercase tracking-wider block">
                  Select Active Application Payment Engine:
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Card 1: Demo 1 */}
                  <div
                    onClick={() => setPaymentConfig({ ...paymentConfig, paymentMode: 'demo_instant' })}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all space-y-2 relative overflow-hidden ${
                      paymentConfig.paymentMode === 'demo_instant'
                        ? 'bg-emerald-950/40 border-emerald-500/80 shadow-lg shadow-emerald-950/30'
                        : 'bg-slate-950/40 border-white/[0.1] hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-emerald-400 uppercase tracking-wider">Demo Mode 1</span>
                      <input
                        type="radio"
                        name="paymentMode"
                        checked={paymentConfig.paymentMode === 'demo_instant'}
                        onChange={() => setPaymentConfig({ ...paymentConfig, paymentMode: 'demo_instant' })}
                        className="accent-emerald-500"
                      />
                    </div>
                    <h3 className="text-sm font-bold text-white">Instant Dummy Auto-Success</h3>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Automatically confirms payment orders in 0 milliseconds without user prompts. Ideal for instant client testing & receipt validation.
                    </p>
                    <span className="inline-block text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono">
                      Dummy Engine A
                    </span>
                  </div>

                  {/* Card 2: Demo 2 */}
                  <div
                    onClick={() => setPaymentConfig({ ...paymentConfig, paymentMode: 'demo_interactive' })}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all space-y-2 relative overflow-hidden ${
                      paymentConfig.paymentMode === 'demo_interactive'
                        ? 'bg-amber-950/40 border-amber-500/80 shadow-lg shadow-amber-950/30'
                        : 'bg-slate-950/40 border-white/[0.1] hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-amber-400 uppercase tracking-wider">Demo Mode 2</span>
                      <input
                        type="radio"
                        name="paymentMode"
                        checked={paymentConfig.paymentMode === 'demo_interactive'}
                        onChange={() => setPaymentConfig({ ...paymentConfig, paymentMode: 'demo_interactive' })}
                        className="accent-amber-500"
                      />
                    </div>
                    <h3 className="text-sm font-bold text-white">Interactive Sandbox Gateway</h3>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Simulates a full interactive payment gateway lifecycle with QR modal, payment status polling, simulated approvals, & webhooks.
                    </p>
                    <span className="inline-block text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-mono">
                      Dummy Engine B
                    </span>
                  </div>

                  {/* Card 3: Original Mode */}
                  <div
                    onClick={() => setPaymentConfig({ ...paymentConfig, paymentMode: 'live_original' })}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all space-y-2 relative overflow-hidden ${
                      paymentConfig.paymentMode === 'live_original'
                        ? 'bg-rose-950/40 border-rose-500/80 shadow-lg shadow-rose-950/30'
                        : 'bg-slate-950/40 border-white/[0.1] hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-rose-400 uppercase tracking-wider">Original Mode</span>
                      <input
                        type="radio"
                        name="paymentMode"
                        checked={paymentConfig.paymentMode === 'live_original'}
                        onChange={() => setPaymentConfig({ ...paymentConfig, paymentMode: 'live_original' })}
                        className="accent-rose-500"
                      />
                    </div>
                    <h3 className="text-sm font-bold text-white">Production Live Gateway</h3>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Connects directly to real Razorpay API & live UPI deep link endpoints to collect real patient payments like a live app.
                    </p>
                    <span className="inline-block text-[10px] bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded font-mono">
                      Razorpay + UPI Live
                    </span>
                  </div>
                </div>
              </div>

              {/* Gateway API Credentials & UPI Configuration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/[0.12]">
                <div className="space-y-4">
                  <h3 className="text-xs font-extrabold text-sky-400 uppercase tracking-wider">
                    Gateway Credentials & Merchant Details
                  </h3>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">Razorpay Key ID (Original Mode)</label>
                    <input
                      type="text"
                      placeholder="rzp_live_xxxxxxxxxxxxx"
                      value={paymentConfig.razorpayKeyId}
                      onChange={(e) => setPaymentConfig({ ...paymentConfig, razorpayKeyId: e.target.value })}
                      className="w-full bg-slate-955 text-white border border-white/[0.12] rounded-xl px-3.5 py-2 text-xs font-mono outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">Razorpay Key Secret (Original Mode)</label>
                    <input
                      type="password"
                      placeholder="••••••••••••••••••••"
                      value={paymentConfig.razorpayKeySecret}
                      onChange={(e) => setPaymentConfig({ ...paymentConfig, razorpayKeySecret: e.target.value })}
                      className="w-full bg-slate-955 text-white border border-white/[0.12] rounded-xl px-3.5 py-2 text-xs font-mono outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">UPI Merchant Virtual Payment Address (VPA)</label>
                    <input
                      type="text"
                      required
                      value={paymentConfig.upiVpa}
                      onChange={(e) => setPaymentConfig({ ...paymentConfig, upiVpa: e.target.value })}
                      className="w-full bg-slate-955 text-white border border-white/[0.12] rounded-xl px-3.5 py-2 text-xs font-bold outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">Merchant Display Name</label>
                    <input
                      type="text"
                      required
                      value={paymentConfig.merchantName}
                      onChange={(e) => setPaymentConfig({ ...paymentConfig, merchantName: e.target.value })}
                      className="w-full bg-slate-955 text-white border border-white/[0.12] rounded-xl px-3.5 py-2 text-xs font-bold outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xs font-extrabold text-sky-400 uppercase tracking-wider">
                    Receipt Messaging & Custom QR Image
                  </h3>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">User Payment Confirmation Message</label>
                    <textarea
                      rows={3}
                      required
                      value={paymentConfig.confirmationMessage}
                      onChange={(e) => setPaymentConfig({ ...paymentConfig, confirmationMessage: e.target.value })}
                      className="w-full bg-slate-955 text-white border border-white/[0.12] rounded-xl p-3 text-xs font-bold outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-300">Upload Custom Merchant UPI QR Image</label>
                    <div className="bg-slate-955 border border-white/[0.12] rounded-2xl p-4 text-center space-y-3 flex flex-col items-center justify-center min-h-[140px]">
                      {paymentConfig.customQrUrl ? (
                        <img src={paymentConfig.customQrUrl} alt="Custom QR" className="w-28 h-28 object-contain rounded-xl border bg-white p-2" />
                      ) : (
                        <ImageIcon className="h-8 w-8 text-slate-500" />
                      )}
                      <input type="file" id="admin-qr-file" onChange={handleQrImageUpload} className="hidden" accept="image/*" />
                      <label htmlFor="admin-qr-file" className="bg-slate-900 border border-white/[0.12] text-sky-400 hover:text-white text-xs font-bold px-3 py-1.5 rounded-xl cursor-pointer">
                        {paymentConfig.customQrUrl ? 'Change Custom QR' : 'Upload Custom QR Image'}
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-white/[0.12] flex justify-end">
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-6 py-3 rounded-xl shadow-lg transition-all flex items-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  Save Monetization Mode & Settings
                </button>
              </div>
            </form>

            {/* ── ADMIN MONETIZATION & PAYMENT TEST BENCH (Works ONLY in Admin) ──── */}
            <div className="bg-[#090f22] rounded-3xl p-6 border border-sky-500/30 space-y-6 shadow-2xl relative overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/[0.12]">
                <div>
                  <h2 className="text-sm font-extrabold text-sky-400 uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    Admin-Only Monetization & Payment Sandbox Testbench
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Execute live test payment flows directly inside Admin Dashboard for Demo 1, Demo 2, or Original Mode.
                  </p>
                </div>

                <span className="text-[11px] font-mono font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40 px-3 py-1 rounded-full">
                  Admin Exclusive Sandbox
                </span>
              </div>

              {/* 3 Live Execution Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  type="button"
                  disabled={testbenchLoading}
                  onClick={() => handleRunTestbench('demo_instant')}
                  className="bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-300 p-4 rounded-2xl font-bold text-xs text-left transition-all flex flex-col justify-between space-y-2 group shadow-lg"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[10px] font-extrabold tracking-widest uppercase bg-emerald-500/20 px-2 py-0.5 rounded">
                      Demo 1
                    </span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                  <div>
                    <div className="text-sm text-white font-extrabold">⚡ Test Instant Dummy Mode</div>
                    <div className="text-[11px] text-slate-400 font-normal mt-0.5">Fires instant ₹500 auto-success transaction</div>
                  </div>
                </button>

                <button
                  type="button"
                  disabled={testbenchLoading}
                  onClick={() => handleRunTestbench('demo_interactive')}
                  className="bg-amber-950/80 hover:bg-amber-900 border border-amber-500/50 text-amber-300 p-4 rounded-2xl font-bold text-xs text-left transition-all flex flex-col justify-between space-y-2 group shadow-lg"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[10px] font-extrabold tracking-widest uppercase bg-amber-500/20 px-2 py-0.5 rounded">
                      Demo 2
                    </span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                  <div>
                    <div className="text-sm text-white font-extrabold">🧪 Test Sandbox Gateway</div>
                    <div className="text-[11px] text-slate-400 font-normal mt-0.5">Fires interactive ₹500 sandbox lifecycle test</div>
                  </div>
                </button>

                <button
                  type="button"
                  disabled={testbenchLoading}
                  onClick={() => handleRunTestbench('live_original')}
                  className="bg-rose-950/80 hover:bg-rose-900 border border-rose-500/50 text-rose-300 p-4 rounded-2xl font-bold text-xs text-left transition-all flex flex-col justify-between space-y-2 group shadow-lg"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[10px] font-extrabold tracking-widest uppercase bg-rose-500/20 px-2 py-0.5 rounded">
                      Original
                    </span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                  <div>
                    <div className="text-sm text-white font-extrabold">🔴 Test Original Live Mode</div>
                    <div className="text-[11px] text-slate-400 font-normal mt-0.5">Tests live Razorpay SDK order creation & keys</div>
                  </div>
                </button>
              </div>

              {/* Testbench Loader & Output Display */}
              {testbenchLoading && (
                <div className="bg-slate-950 p-6 rounded-2xl border border-white/[0.1] text-center space-y-2">
                  <RefreshCw className="w-6 h-6 text-sky-400 animate-spin mx-auto" />
                  <p className="text-xs font-bold text-white">Running Monetization Gateway Testbench...</p>
                </div>
              )}

              {testbenchResult && !testbenchLoading && (
                <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/[0.1]">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">
                        {testbenchResult.modeTitle} Output
                      </h4>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/20 px-3 py-0.5 rounded-full font-mono">
                      Status: {testbenchResult.status}
                    </span>
                  </div>

                  <div className="text-xs text-slate-300 font-medium">
                    {testbenchResult.message}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-900/60 p-3 rounded-xl border border-white/[0.05] text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Transaction ID</span>
                      <span className="font-mono text-sky-400 font-bold">{testbenchResult.transactionId}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Amount</span>
                      <span className="font-bold text-emerald-400">₹{testbenchResult.amount}.00</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Engine Mode</span>
                      <span className="font-mono text-amber-400 font-bold">{testbenchResult.mode}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Digital Receipt</span>
                      <a
                        href={testbenchResult.receiptPdfUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sky-400 hover:underline font-bold flex items-center gap-1"
                      >
                        <FileDown className="w-3.5 h-3.5" /> Download PDF
                      </a>
                    </div>
                  </div>

                  {testbenchResult.simulationSteps && (
                    <div className="space-y-1.5 pt-2">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        Interactive Simulation Pipeline Steps:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {testbenchResult.simulationSteps.map((step, idx) => (
                          <span key={idx} className="bg-slate-900 border border-amber-500/30 text-amber-300 text-[10px] font-mono px-2.5 py-1 rounded-lg">
                            {idx + 1}. {step}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <details className="text-[11px] text-slate-400 pt-2 border-t border-white/[0.05]">
                    <summary className="cursor-pointer font-bold text-slate-300 hover:text-white">
                      View Raw Payload Data JSON
                    </summary>
                    <pre className="mt-2 bg-slate-900 p-3 rounded-xl overflow-x-auto text-[10px] font-mono text-slate-300">
                      {JSON.stringify(testbenchResult.rawPayload, null, 2)}
                    </pre>
                  </details>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── DOCTOR PERFORMANCE TAB ──────────────────────────────────────────── */}
        {activeTab === 'doctor_performance' && (
          <div className="bg-[#090f22] rounded-3xl p-6 border border-white/[0.12] space-y-6 shadow-2xl">
            <h2 className="text-sm font-extrabold text-white uppercase tracking-wider">Doctor Performance Metrics</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/[0.12] text-slate-400 font-extrabold uppercase text-[10px] tracking-wider">
                    <th className="py-4 px-4">Doctor Name</th>
                    <th className="py-4 px-4">Total Appointments</th>
                    <th className="py-4 px-4">Cancellations Count</th>
                    <th className="py-4 px-4">Rating</th>
                    <th className="py-4 px-4">Status</th>
                    <th className="py-4 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.08] font-semibold">
                  {doctorPerf.map(doc => (
                    <tr key={doc.id} className="hover:bg-slate-900/40">
                      <td className="py-4 px-4 text-white font-extrabold">{doc.name}</td>
                      <td className="py-4 px-4 text-slate-200">{doc.totalAppointments || doc.completedVisits || 12}</td>
                      <td className="py-4 px-4 text-amber-400 font-extrabold">{doc.cancellationsCount || 0}</td>
                      <td className="py-4 px-4 text-sky-400 font-extrabold">★ {doc.rating || 4.8}</td>
                      <td className="py-4 px-4">
                        <span className="bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 text-[10px] font-black px-2.5 py-0.5 rounded-md uppercase">
                          {doc.status || 'ACTIVE'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right space-x-2">
                        <button
                          onClick={() => {
                            setEditDoctorModal(doc);
                            setEditDocForm({
                              rating: doc.rating || 4.8,
                              consultationCount: doc.totalAppointments || doc.completedVisits || 12,
                              status: doc.status || 'ACTIVE'
                            });
                          }}
                          className="px-3 py-1 bg-[#0b1329] border border-white/[0.12] text-sky-300 hover:text-white rounded-lg text-xs font-semibold"
                        >
                          Edit
                        </button>
                        <button
                          onClick={async () => {
                            if (window.confirm(`Are you sure you want to delete doctor performance record for ${doc.name}?`)) {
                              try {
                                await adminApi.deleteDoctorPerformance(doc.id);
                                loadAllData();
                              } catch (e) {
                                alert('Failed to delete doctor: ' + e.message);
                              }
                            }
                          }}
                          className="p-1 bg-red-955/80 border border-red-900/60 text-red-400 hover:text-white rounded-lg"
                          title="Delete Doctor Performance Record"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── USER PROFILES DIRECTORY TAB ─────────────────────────────────────── */}
        {activeTab === 'users' && (
          <div className="bg-[#090f22] rounded-3xl p-6 border border-white/[0.12] space-y-4 shadow-2xl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/[0.12] pb-4">
              <div>
                <h2 className="text-sm font-extrabold text-white uppercase tracking-wider">
                  Registered Patient & User Directory ({users.length})
                </h2>
                <p className="text-xs text-slate-400">Manage user accounts, toggle access status, and view clinical history logs.</p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search name or email..."
                  className="w-full bg-slate-955 text-white border border-white/[0.12] rounded-xl pl-9 pr-3 py-2 text-xs font-semibold outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/[0.12] text-slate-400 font-extrabold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">Patient Profile</th>
                    <th className="py-3 px-4">Contact Mobile</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Wallet Balance</th>
                    <th className="py-3 px-4">Checkups Run</th>
                    <th className="py-3 px-4">Account Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.08] font-semibold">
                  {users
                    .filter(u => !userSearch || (u.name || '').toLowerCase().includes(userSearch.toLowerCase()) || (u.email || '').toLowerCase().includes(userSearch.toLowerCase()))
                    .map(u => (
                      <tr key={u.id} className="hover:bg-slate-900/40">
                        <td className="py-3.5 px-4">
                          <span className="text-white font-bold block">{u.name || 'Patient'}</span>
                          <span className="text-[10px] text-slate-400 block">{u.email}</span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-300 font-mono">{u.mobileNumber || 'Not set'}</td>
                        <td className="py-3.5 px-4">
                          <span className={`text-[9px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                            u.role === 'admin' ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' : 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}>
                            {(u.role || 'user').toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-emerald-400 font-extrabold">₹{u.walletBalance || 0}.00</td>
                        <td className="py-3.5 px-4 text-sky-400 font-bold">{u.reportsCount || 0} reports</td>
                        <td className="py-3.5 px-4">
                          <span className={`text-[9px] font-black px-2.5 py-0.5 rounded-md border ${
                            u.status === 'deactivated' ? 'bg-red-950/80 text-red-400 border-red-800/60' : 'bg-emerald-950/80 text-emerald-400 border-emerald-800/60'
                          }`}>
                            {(u.status || 'active').toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={async () => {
                              const newStatus = u.status === 'deactivated' ? 'active' : 'deactivated';
                              try {
                                await adminApi.toggleUserStatus(u.id, newStatus);
                                loadAllData();
                              } catch (e) {
                                alert('Error updating user status: ' + e.message);
                              }
                            }}
                            className="bg-slate-900 hover:bg-slate-800 border border-white/[0.12] text-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                          >
                            {u.status === 'deactivated' ? 'Activate' : 'Deactivate'}
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── APPOINTMENTS & TELEMEDICINE LEDGER TAB ──────────────────────────── */}
        {activeTab === 'appointments' && (
          <div className="bg-[#090f22] rounded-3xl p-6 border border-white/[0.12] space-y-6 shadow-2xl">
            <div className="flex justify-between items-center border-b border-white/[0.12] pb-4">
              <div>
                <h2 className="text-sm font-extrabold text-white uppercase tracking-wider">Appointments & Telemedicine Ledger</h2>
                <p className="text-xs text-slate-400">Complete historical register of patient consultations and scheduled visits.</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/[0.12] text-slate-400 font-extrabold uppercase text-[10px] tracking-wider">
                    <th className="py-4 px-4">Appointment ID</th>
                    <th className="py-4 px-4">Patient Name</th>
                    <th className="py-4 px-4">Doctor / Facility</th>
                    <th className="py-4 px-4">Date & Time</th>
                    <th className="py-4 px-4">Consultation Fee</th>
                    <th className="py-4 px-4">Type</th>
                    <th className="py-4 px-4">Status</th>
                    <th className="py-4 px-4 text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.08] font-semibold">
                  {appointments.map(apt => (
                    <tr key={apt.id} className="hover:bg-slate-900/40">
                      <td className="py-4 px-4 text-sky-400 font-mono">#{apt.id}</td>
                      <td className="py-4 px-4 text-white font-extrabold">{apt.userName || apt.patientName || 'Patient'}</td>
                      <td className="py-4 px-4 text-slate-300">
                        <span className="font-bold block text-white">{apt.doctorName}</span>
                        <span className="text-[10px] text-slate-400 block">{apt.hospitalName || 'Apollo Greams Road'}</span>
                      </td>
                      <td className="py-4 px-4 text-slate-300">{apt.date} • {apt.time}</td>
                      <td className="py-4 px-4 text-emerald-400 font-bold">₹{apt.fee || apt.amountPaid || 450}.00</td>
                      <td className="py-4 px-4">
                        <span className="bg-slate-800 text-sky-300 text-[9px] font-bold px-2.5 py-0.5 rounded-full border border-slate-700">
                          {apt.type || 'Video'}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`text-[9px] font-black px-2.5 py-0.5 rounded-md border ${
                          apt.status === 'Completed' || apt.status === 'Confirmed' ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800/60' : 'bg-amber-950/80 text-amber-400 border-amber-800/60'
                        }`}>
                          {(apt.status || 'Confirmed').toUpperCase()}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <a
                          href={`/api/payment/receipt/${apt.id}/pdf`}
                          target="_blank"
                          rel="noreferrer"
                          className="bg-slate-900 hover:bg-slate-800 border border-white/[0.12] text-sky-400 hover:text-white px-2.5 py-1.5 rounded-xl text-[10px] font-bold transition-all flex items-center space-x-1 inline-flex"
                        >
                          <FileDown className="h-3 w-3" />
                          <span>PDF</span>
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── PAYMENTS & RECEIPTS DRILL-DOWN TAB ──────────────────────────────── */}
        {activeTab === 'payments_receipts' && (
          <div className="bg-[#090f22] rounded-3xl p-6 border border-white/[0.12] space-y-6 shadow-2xl">
            <div className="flex justify-between items-center border-b border-white/[0.12] pb-4">
              <div>
                <h2 className="text-sm font-extrabold text-white uppercase tracking-wider">Payments & Transaction Receipts Ledger</h2>
                <p className="text-xs text-slate-400">Detailed transaction audit log with downloadable digital PDF receipts for every gateway charge.</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/[0.12] text-slate-400 font-extrabold uppercase text-[10px] tracking-wider">
                    <th className="py-3.5 px-4">Transaction ID</th>
                    <th className="py-3.5 px-4">User / Patient</th>
                    <th className="py-3.5 px-4">Amount</th>
                    <th className="py-3.5 px-4">Payment Method</th>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.08] font-semibold">
                  {paymentsHistory.map(pay => (
                    <tr key={pay.id} className="hover:bg-slate-900/40">
                      <td className="py-3.5 px-4 text-sky-400 font-mono">{pay.id}</td>
                      <td className="py-3.5 px-4 text-white font-bold">{pay.userName}</td>
                      <td className="py-3.5 px-4 text-emerald-400 font-extrabold">₹{pay.amount}.00</td>
                      <td className="py-3.5 px-4 text-slate-300">{pay.method}</td>
                      <td className="py-3.5 px-4 text-slate-400">{new Date(pay.date).toLocaleDateString()}</td>
                      <td className="py-3.5 px-4">
                        <span className="bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 text-[9px] font-black px-2.5 py-0.5 rounded-md uppercase">
                          {pay.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <a
                          href={`/api/payment/receipt/${pay.id}/pdf`}
                          target="_blank"
                          rel="noreferrer"
                          className="bg-[#0284c7] hover:bg-sky-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all inline-flex items-center space-x-1 shadow"
                        >
                          <FileDown className="h-3.5 w-3.5" />
                          <span>Download Receipt</span>
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── MANAGE MEDICINE SCHEDULES TAB ────────────────────────────────────────── */}
        {activeTab === 'medicine_reminders' && (
          <div className="bg-[#090f22] rounded-3xl p-6 border border-white/[0.12] space-y-6 shadow-2xl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/[0.12] pb-4">
              <div>
                <h2 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-sky-400" />
                  <span>Patient Medicine Schedule Registry ({medicineReminders.length})</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Active medication schedules, dosage timings, and patient treatment compliance across registered accounts.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold px-3 py-1 rounded-full flex items-center space-x-1">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Root API Synchronized</span>
                </span>
              </div>
            </div>

            {/* Summary Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-[#060b19] p-4 rounded-2xl border border-white/[0.1] space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Active Schedules</span>
                <span className="text-2xl font-black text-white">{medicineReminders.length}</span>
              </div>

              <div className="bg-[#060b19] p-4 rounded-2xl border border-white/[0.1] space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Patients Monitored</span>
                <span className="text-2xl font-black text-sky-400">
                  {new Set(medicineReminders.map(r => r.userId || r.userEmail)).size}
                </span>
              </div>

              <div className="bg-[#060b19] p-4 rounded-2xl border border-white/[0.1] space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Schedule Compliance</span>
                <span className="text-2xl font-black text-emerald-400">96.4%</span>
              </div>
            </div>

            {/* Schedules Table */}
            {medicineReminders.length === 0 ? (
              <div className="bg-slate-955 border border-white/[0.1] rounded-2xl p-8 text-center space-y-2">
                <Clock className="h-8 w-8 text-slate-500 mx-auto" />
                <h3 className="text-sm font-bold text-white">No Medicine Schedules Found</h3>
                <p className="text-xs text-slate-400">Patients have not created any medication reminders yet, or all schedules are complete.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-white/[0.1]">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-950/80 text-[11px] uppercase text-slate-400 font-bold tracking-wider border-b border-white/[0.1]">
                      <th className="py-3 px-4">Patient Info</th>
                      <th className="py-3 px-4">Medication & Dosage</th>
                      <th className="py-3 px-4">Duration (Start - End)</th>
                      <th className="py-3 px-4">Scheduled Times</th>
                      <th className="py-3 px-4">Instructions / Notes</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.08] text-xs">
                    {medicineReminders.map(rem => (
                      <tr key={rem.id || rem.name} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-white">{rem.userName || 'Patient'}</div>
                          <div className="text-[11px] text-slate-400">{rem.userEmail}</div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-extrabold text-sky-400">{rem.name}</div>
                          <div className="text-[11px] text-slate-300 font-semibold">{rem.dosage || '500mg'}</div>
                        </td>

                        <td className="py-3.5 px-4 text-slate-300">
                          <div>📅 {rem.startDate || '2026-07-20'}</div>
                          <div className="text-[11px] text-slate-400">to {rem.endDate || 'Ongoing'}</div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap gap-1">
                            {(Array.isArray(rem.times) ? rem.times : (rem.timesStr || '08:00 AM, 09:00 PM').split(',')).map((t, idx) => (
                              <span key={idx} className="bg-slate-900 border border-white/[0.15] text-white text-[10px] font-bold px-2 py-0.5 rounded-lg">
                                ⏰ {t.trim()}
                              </span>
                            ))}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-slate-400 italic max-w-xs truncate">
                          {rem.notes || 'After food'}
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase">
                            Active
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleDeleteReminder(rem.userId, rem.id)}
                            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-950/20 rounded-xl transition-all"
                            title="Delete Medicine Schedule"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── BULK CSV IMPORT TAB ────────────────────────────────────────────── */}
        {activeTab === 'bulk_import' && (
          <div className="bg-[#090f22] rounded-3xl p-6 border border-white/[0.12] space-y-6 shadow-2xl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/[0.12] pb-4">
              <div>
                <h2 className="text-sm font-extrabold text-white uppercase tracking-wider">
                  Bulk Hospital & Clinic CSV Importer
                </h2>
                <p className="text-xs text-slate-400">Batch onboard medical centers, departments, doctors, and location coordinates via CSV spreadsheet.</p>
              </div>

              <button
                onClick={downloadCsvTemplate}
                className="bg-slate-900 hover:bg-slate-800 text-sky-400 border border-white/[0.12] text-xs font-bold px-4 py-2 rounded-xl flex items-center space-x-1.5 shadow transition-all"
              >
                <FileDown className="h-4 w-4" />
                <span>Download CSV Template</span>
              </button>
            </div>

            <div className="bg-slate-955 border-2 border-dashed border-white/[0.15] rounded-3xl p-8 text-center space-y-4">
              <Upload className="h-10 w-10 text-sky-400 mx-auto" />
              <div>
                <h3 className="text-sm font-bold text-white">Upload Hospitals CSV Spreadsheet</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto pt-1">
                  Select a CSV file formatted according to the expanded schema. All 16 fields will be ingested into the root database.
                </p>
              </div>

              <input
                type="file"
                id="bulk-csv-input"
                accept=".csv"
                onChange={handleCsvFileUpload}
                className="hidden"
              />

              <label
                htmlFor="bulk-csv-input"
                className="bg-[#0284c7] hover:bg-sky-500 text-white text-xs font-bold px-6 py-3 rounded-xl cursor-pointer inline-block shadow-lg shadow-sky-500/25 transition-all"
              >
                Choose CSV File to Import
              </label>
            </div>

            <div className="bg-slate-900/60 rounded-2xl p-4 border border-white/[0.08] space-y-2">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Supported CSV Schema Columns:</h4>
              <p className="text-[11px] text-slate-400 font-mono leading-relaxed">
                Hospital Name, Specialties, Address, City, State, Pincode, Contact Number, Email, Operating Hours, Latitude, Longitude, Affiliated Doctors, Online Fee, Offline Fee, Rating, Insurance Schemes
              </p>
            </div>
          </div>
        )}

        {/* ── CANCELLATION AUDITS TAB ───────────────────────────────────────── */}
        {activeTab === 'cancellation_audits' && (
          <div className="space-y-6">
            {/* Top Stat Summary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-[#090f22] p-5 rounded-3xl border border-white/[0.12] shadow-xl">
                <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 block">Total Active Flags</span>
                <span className="text-2xl font-black text-white mt-1 block">{safeCancellationFlags.length}</span>
              </div>
              <div className="bg-[#090f22] p-5 rounded-3xl border border-red-500/30 shadow-xl">
                <span className="text-[10px] uppercase font-extrabold tracking-wider text-red-400 block">High Severity Alerts</span>
                <span className="text-2xl font-black text-red-400 mt-1 block">
                  {safeCancellationFlags.filter(f => f.severity === 'HIGH').length}
                </span>
              </div>
              <div className="bg-[#090f22] p-5 rounded-3xl border border-amber-500/30 shadow-xl">
                <span className="text-[10px] uppercase font-extrabold tracking-wider text-amber-400 block">Repeated No-Shows</span>
                <span className="text-2xl font-black text-amber-400 mt-1 block">
                  {safeCancellationFlags.filter(f => (f.type || '').toLowerCase().includes('no-show')).length}
                </span>
              </div>
              <div className="bg-[#090f22] p-5 rounded-3xl border border-sky-500/30 shadow-xl">
                <span className="text-[10px] uppercase font-extrabold tracking-wider text-sky-400 block">Payment Disputes</span>
                <span className="text-2xl font-black text-sky-400 mt-1 block">
                  {safeCancellationFlags.filter(f => (f.type || '').toLowerCase().includes('payment') || (f.type || '').toLowerCase().includes('dispute')).length}
                </span>
              </div>
            </div>

            {/* Main Panel */}
            <div className="bg-[#090f22] rounded-3xl p-6 border border-white/[0.12] space-y-6 shadow-2xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.12] pb-5">
                <div>
                  <h2 className="text-base font-extrabold text-white uppercase tracking-wider flex items-center space-x-2">
                    <ShieldAlert className="h-5 w-5 text-red-400" />
                    <span>Cancellation Audits & Fraud Alert Registry</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Monitors patient no-shows, repeated appointment cancellations, provider flags, and payment disputes.
                  </p>
                </div>

                <button
                  onClick={() => setShowAddFlagModal(true)}
                  className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg transition-all self-start sm:self-auto shrink-0"
                >
                  + Log Audit Flag
                </button>
              </div>

              {/* Toolbar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-950/60 p-3 rounded-2xl border border-white/[0.08]">
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search flags by entity or details..."
                    value={flagSearchQuery}
                    onChange={e => setFlagSearchQuery(e.target.value)}
                    className="w-full bg-slate-900 border border-white/[0.12] rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                  <span className="text-xs text-slate-400 font-semibold">Severity:</span>
                  <select
                    value={flagFilterSeverity}
                    onChange={e => setFlagFilterSeverity(e.target.value)}
                    className="bg-slate-900 border border-white/[0.12] rounded-xl px-3 py-1.5 text-xs text-slate-200 outline-none"
                  >
                    <option value="ALL">All Severities</option>
                    <option value="HIGH">HIGH Only</option>
                    <option value="MEDIUM">MEDIUM Only</option>
                    <option value="LOW">LOW Only</option>
                  </select>
                </div>
              </div>

              {/* Audit Flags Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-white/[0.12] text-slate-400 font-bold uppercase tracking-wider">
                      <th className="py-3 px-4">Flag ID & Entity</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Severity</th>
                      <th className="py-3 px-4">Audit Details & Context</th>
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.06] text-slate-300">
                    {safeCancellationFlags
                      .filter(f => flagFilterSeverity === 'ALL' || f.severity === flagFilterSeverity)
                      .filter(f => !flagSearchQuery || (f.entityName || '').toLowerCase().includes(flagSearchQuery.toLowerCase()) || (f.details || '').toLowerCase().includes(flagSearchQuery.toLowerCase()))
                      .map((flag) => (
                        <tr key={flag.id} className="hover:bg-slate-900/40 transition-colors">
                          <td className="py-3 px-4">
                            <span className="font-extrabold text-white block">{flag.entityName || 'System Entity'}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{flag.id}</span>
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-200">{flag.type}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                                flag.severity === 'HIGH'
                                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                  : flag.severity === 'MEDIUM'
                                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                  : 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                              }`}
                            >
                              {flag.severity || 'MEDIUM'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-300 max-w-xs">{flag.details}</td>
                          <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                            {new Date(flag.timestamp || Date.now()).toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => handleResolveFlag(flag.id)}
                              className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 rounded-xl font-bold transition-all"
                            >
                              Resolve / Dismiss
                            </button>
                          </td>
                        </tr>
                      ))}
                    {safeCancellationFlags.length === 0 && (
                      <tr>
                        <td colSpan="6" className="py-8 text-center text-slate-500 font-semibold">
                          No active cancellation flags or fraud alerts logged.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── SYSTEM AUDIT LOGS TAB ─────────────────────────────────────────── */}
        {activeTab === 'audit' && (
          <div className="bg-[#090f22] rounded-3xl p-6 border border-white/[0.12] space-y-6 shadow-2xl">
            <div className="flex justify-between items-center border-b border-white/[0.12] pb-5">
              <div>
                <h2 className="text-base font-extrabold text-white uppercase tracking-wider flex items-center space-x-2">
                  <Activity className="h-5 w-5 text-sky-400" />
                  <span>System Audit Logs & Admin Activity History</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Immutable ledger of administrative actions, profile modifications, data wipes, and security events.
                </p>
              </div>

              <button
                onClick={() => setShowAddAuditModal(true)}
                className="bg-[#0284c7] hover:bg-sky-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg transition-all"
              >
                + Record Audit Note
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/[0.12] text-slate-400 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Log ID</th>
                    <th className="py-3 px-4">Admin ID</th>
                    <th className="py-3 px-4">Action Code</th>
                    <th className="py-3 px-4">Target ID</th>
                    <th className="py-3 px-4">Action Details</th>
                    <th className="py-3 px-4">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06] text-slate-300">
                  {safeAuditLogs.map((log, idx) => (
                    <tr key={log.id || idx} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">{log.id || `log-${idx+1}`}</td>
                      <td className="py-3 px-4 font-bold text-white">{log.adminId || 'Admin'}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-mono text-[10px]">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-400">{log.targetId || 'N/A'}</td>
                      <td className="py-3 px-4 text-slate-200">{log.details}</td>
                      <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                        {new Date(log.timestamp || Date.now()).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  {safeAuditLogs.length === 0 && (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-slate-500 font-semibold">
                        No audit log entries recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── MEDICINE REMINDERS TAB ────────────────────────────────────────── */}
        {activeTab === 'medicine_reminders' && (
          <div className="bg-[#090f22] rounded-3xl p-6 border border-white/[0.12] space-y-6 shadow-2xl">
            <div className="border-b border-white/[0.12] pb-5">
              <h2 className="text-base font-extrabold text-white uppercase tracking-wider flex items-center space-x-2">
                <Bell className="h-5 w-5 text-purple-400" />
                <span>Patient Medicine Reminder Schedules</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Overview of active pill reminders, dosages, and compliance schedules set by registered patients.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/[0.12] text-slate-400 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Patient Name</th>
                    <th className="py-3 px-4">Medicine Name</th>
                    <th className="py-3 px-4">Dosage</th>
                    <th className="py-3 px-4">Time & Frequency</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06] text-slate-300">
                  {safeMedicineReminders.map((rem, idx) => (
                    <tr key={rem.id || idx} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-extrabold text-white block">{rem.userName || 'Patient'}</span>
                        <span className="text-[10px] text-slate-400">{rem.userEmail}</span>
                      </td>
                      <td className="py-3 px-4 font-bold text-sky-300">{rem.medicineName || rem.name}</td>
                      <td className="py-3 px-4 font-semibold text-slate-200">{rem.dosage || '1 Tablet'}</td>
                      <td className="py-3 px-4 text-slate-300 font-mono">
                        {rem.time || '08:00 AM'} ({rem.frequency || 'Daily'})
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                          ACTIVE
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDeleteMedicineReminder(rem.userId, rem.id)}
                          className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-xl font-bold transition-all"
                        >
                          Delete Schedule
                        </button>
                      </td>
                    </tr>
                  ))}
                  {safeMedicineReminders.length === 0 && (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-slate-500 font-semibold">
                        No active medicine reminder schedules registered across patient accounts.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── API KEYS & WEBSITE ERRORS DIAGNOSTICS TAB ──────────────────────────── */}
        {activeTab === 'api_diagnostics' && (
          <div className="space-y-6 animate-fade-in text-xs">
            {/* Header banner */}
            <div className="bg-[#090f22] p-5 rounded-3xl border border-white/[0.12] shadow-2xl flex items-center justify-between">
              <div className="flex items-center space-x-3.5">
                <div className="bg-[#0284c7]/10 p-2.5 rounded-2xl text-sky-400 border border-sky-500/20">
                  <Key className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white tracking-wide">API Keys & Client Error Logs Console</h3>
                  <p className="text-xs text-slate-400 font-medium">Verify third-party integration statuses and track real-time website JS exceptions.</p>
                </div>
              </div>
              <button
                onClick={loadAllData}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 text-sky-400 text-xs font-bold px-3.5 py-2 rounded-xl flex items-center space-x-2 transition-all cursor-pointer shadow-md"
                type="button"
              >
                <RefreshCw className="h-3.5 w-3.5 animate-spin-slow" />
                <span>Refresh Logs</span>
              </button>
            </div>

            {/* Grid Layout: API Keys (Left) and Error Logs (Right) */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* API KEYS SECTION */}
              <div className="bg-[#060b19] border border-white/[0.12] rounded-3xl p-6 space-y-4 shadow-xl">
                <div className="flex items-center space-x-2 border-b border-white/[0.08] pb-3">
                  <Key className="h-5 w-5 text-sky-400" />
                  <h4 className="text-sm font-extrabold text-white tracking-wider uppercase">Platform Integration API Keys</h4>
                </div>

                <div className="space-y-4">
                  {apiKeys.map(keyObj => (
                    <div key={keyObj.id} className="bg-slate-950 p-4 rounded-2xl border border-white/[0.06] space-y-3 shadow-md">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="font-extrabold text-white text-xs block">{keyObj.name}</span>
                          <span className="text-[10px] text-slate-400 block pt-0.5">Last updated: {new Date(keyObj.updatedAt).toLocaleString()}</span>
                        </div>
                        <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase border shrink-0 ${
                          keyObj.status === 'active'
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                            : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                        }`}>
                          {keyObj.status}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        {editingKeyId === keyObj.id ? (
                          <div className="flex items-center space-x-2 w-full">
                            <input
                              type="text"
                              value={editingKeyValue}
                              onChange={(e) => setEditingKeyValue(e.target.value)}
                              className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-900 font-semibold outline-none focus:border-[#0284c7]"
                            />
                            <button
                              onClick={() => handleUpdateKeyValue(keyObj.id)}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingKeyId(null)}
                              className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex-1 font-mono text-[10px] text-slate-300 bg-slate-900/60 border border-white/[0.04] px-3 py-2 rounded-xl truncate">
                            {keyObj.key}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between border-t border-white/[0.04] pt-2">
                        <button
                          onClick={() => handleToggleKeyStatus(keyObj.id, keyObj.status)}
                          className={`text-[10px] font-bold transition-all cursor-pointer hover:underline ${
                            keyObj.status === 'active' ? 'text-rose-400' : 'text-emerald-400'
                          }`}
                        >
                          {keyObj.status === 'active' ? 'Deactivate Key' : 'Activate Key'}
                        </button>

                        <div className="flex items-center space-x-2">
                          {editingKeyId !== keyObj.id && (
                            <button
                              onClick={() => {
                                setEditingKeyId(keyObj.id);
                                setEditingKeyValue(keyObj.key);
                              }}
                              className="text-[10px] font-bold text-sky-400 hover:underline cursor-pointer"
                            >
                              Edit Key
                            </button>
                          )}
                          <button
                            onClick={() => handleTestApiKey(keyObj.id, keyObj.name, keyObj.key)}
                            disabled={testingKeyId === keyObj.id}
                            className="bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                          >
                            {testingKeyId === keyObj.id ? 'Testing...' : 'Test Connection'}
                          </button>
                        </div>
                      </div>

                      {/* Test Connection Results */}
                      {testResults[keyObj.id] && (
                        <div className={`text-[10px] font-bold p-2.5 rounded-xl border flex items-center justify-between gap-2 mt-2 ${
                          testResults[keyObj.id].connected
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                            : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                        }`}>
                          <span>Status: {testResults[keyObj.id].status}</span>
                          <span className="text-[9px] text-slate-400 font-normal">Tested at: {new Date(testResults[keyObj.id].testedAt).toLocaleTimeString()}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* WEBSITE ERROR TRACKING SECTION */}
              <div className="bg-[#060b19] border border-white/[0.12] rounded-3xl p-6 space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5 text-rose-400" />
                    <h4 className="text-sm font-extrabold text-white tracking-wider uppercase">Real-Time Client Crash Log</h4>
                  </div>
                  {websiteErrors.length > 0 && (
                    <button
                      onClick={handleClearAllErrors}
                      className="text-[10px] font-bold text-rose-400 hover:underline cursor-pointer"
                    >
                      Clear All Logs
                    </button>
                  )}
                </div>

                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                  {websiteErrors.length === 0 ? (
                    <div className="text-center py-16 text-slate-500">
                      <Activity className="h-8 w-8 text-slate-700 mx-auto mb-2 animate-pulse" />
                      <p className="text-xs font-semibold">Zero exceptions logged. Website health is optimal! ✅</p>
                    </div>
                  ) : (
                    websiteErrors.map(errLog => (
                      <div key={errLog.id} className="bg-slate-950 p-4 rounded-2xl border border-white/[0.06] space-y-2 shadow-md">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <span className="font-extrabold text-rose-400 text-xs block leading-relaxed">{errLog.message}</span>
                            <span className="text-[9px] text-slate-400 block pt-0.5">Timestamp: {new Date(errLog.timestamp).toLocaleString()}</span>
                          </div>
                          <button
                            onClick={() => handleDeleteWebsiteError(errLog.id)}
                            className="text-slate-500 hover:text-rose-400 cursor-pointer p-0.5 shrink-0 transition-colors"
                            title="Resolve/Dismiss Error"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <div className="space-y-1.5 pt-1 text-[10px]">
                          <div className="bg-slate-900 border border-white/[0.03] p-2.5 rounded-xl text-slate-400 font-mono text-[9px] whitespace-pre-wrap break-all max-h-24 overflow-y-auto">
                            {errLog.stack}
                          </div>
                          <div className="flex flex-wrap gap-2 text-slate-400 font-semibold pt-1">
                            <span className="bg-slate-900 px-2 py-0.5 rounded border border-white/[0.04] text-[9px]">URL: {errLog.url}</span>
                            <span className="bg-slate-900 px-2 py-0.5 rounded border border-white/[0.04] text-[9px]">User: {errLog.userEmail}</span>
                          </div>
                          <div className="text-[9px] text-slate-500 font-medium truncate pt-0.5">
                            Client Device: {errLog.userAgent}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── LIVE CLIENT APP INSPECTOR TAB ──────────────────────────────────── */}
        {activeTab === 'client_inspector' && (
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between bg-[#090f22] p-5 rounded-3xl border border-white/[0.12] shadow-2xl gap-4">
              <div className="flex items-center space-x-3">
                <HardDrive className="h-6 w-6 text-sky-400" />
                <div>
                  <h3 className="text-sm font-extrabold text-white tracking-wide">Live Patient App Workspace Inspector</h3>
                  <p className="text-[11px] text-slate-400">Live platform preview inspector (Select route to preview real client application)</p>
                </div>
              </div>

              {/* View Selector Controls */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setInspectorUrl('http://localhost:5173/?public=true')}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all ${
                    inspectorUrl.includes('public=true') && !inspectorUrl.includes('login')
                      ? 'bg-sky-600 text-white border-sky-400'
                      : 'bg-slate-900 text-slate-300 border-white/[0.12] hover:text-white'
                  }`}
                >
                  🌐 Public Landing Page
                </button>

                <button
                  type="button"
                  onClick={() => setInspectorUrl('http://localhost:5173/login?public=true')}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all ${
                    inspectorUrl.includes('/login')
                      ? 'bg-sky-600 text-white border-sky-400'
                      : 'bg-slate-900 text-slate-300 border-white/[0.12] hover:text-white'
                  }`}
                >
                  🔑 Login Portal
                </button>

                <button
                  type="button"
                  onClick={() => setInspectorUrl('http://localhost:5173/dashboard')}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all ${
                    inspectorUrl.includes('/dashboard')
                      ? 'bg-sky-600 text-white border-sky-400'
                      : 'bg-slate-900 text-slate-300 border-white/[0.12] hover:text-white'
                  }`}
                >
                  👤 Patient Dashboard
                </button>

                <a
                  href={inspectorUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-[#0284c7] hover:bg-sky-500 text-white text-xs font-bold px-4 py-1.5 rounded-xl shadow-lg transition-all flex items-center gap-1 ml-2"
                >
                  Open Window ↗
                </a>
              </div>
            </div>

            <div className="w-full h-[750px] rounded-3xl border border-white/[0.12] overflow-hidden shadow-2xl bg-slate-955">
              <iframe
                key={inspectorUrl}
                src={inspectorUrl}
                title="Client Application Live Inspector"
                className="w-full h-full border-none"
              />
            </div>
          </div>
        )}

      </main>

      {/* ADD / EDIT EXPANDED HOSPITAL MODAL */}
      {showHospModal && (
        <div className="fixed inset-0 bg-slate-955/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <form onSubmit={handleSaveHospital} className="bg-[#090f22] max-w-3xl w-full rounded-3xl p-6 border border-white/[0.12] space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl relative animate-fadeIn">
            <div className="flex justify-between items-center border-b border-white/[0.12] pb-4">
              <div>
                <h3 className="text-base font-black text-white uppercase tracking-wider">
                  {showHospModal.id ? 'Edit Hospital Record' : 'Add New Hospital Details'}
                </h3>
                <p className="text-xs text-slate-400">Configure medical facility profiles, specialties, location coordinates, doctors, and fees.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowHospModal(null)}
                className="p-2 bg-slate-900 border border-white/[0.12] text-slate-400 hover:text-white rounded-xl"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Form Section 1: Basic Information */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-sky-400 uppercase tracking-widest border-b border-sky-500/20 pb-1">1. Facility Basic Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Hospital Name <span className="text-red-400">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apollo Greams Road Hospital"
                    value={hospForm.name}
                    onChange={(e) => setHospForm({ ...hospForm, name: e.target.value })}
                    className="w-full bg-slate-955 text-white border border-white/[0.12] rounded-xl px-3.5 py-2 text-xs font-semibold outline-none focus:border-sky-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Contact Number <span className="text-red-400">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. +91 44 2829 0200"
                    value={hospForm.contact}
                    onChange={(e) => setHospForm({ ...hospForm, contact: e.target.value })}
                    className="w-full bg-slate-955 text-white border border-white/[0.12] rounded-xl px-3.5 py-2 text-xs font-semibold outline-none focus:border-sky-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Email Address (Optional)</label>
                  <input
                    type="email"
                    placeholder="e.g. contact@hospital.com"
                    value={hospForm.email}
                    onChange={(e) => setHospForm({ ...hospForm, email: e.target.value })}
                    className="w-full bg-slate-955 text-white border border-white/[0.12] rounded-xl px-3.5 py-2 text-xs font-semibold outline-none focus:border-sky-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Operating Hours</label>
                  <input
                    type="text"
                    placeholder="e.g. 24/7 Emergency & OP: 08:00 AM - 08:00 PM"
                    value={hospForm.operatingHours}
                    onChange={(e) => setHospForm({ ...hospForm, operatingHours: e.target.value })}
                    className="w-full bg-slate-955 text-white border border-white/[0.12] rounded-xl px-3.5 py-2 text-xs font-semibold outline-none focus:border-sky-500"
                  />
                </div>
              </div>
            </div>

            {/* Form Section 2: Specialties & Departments */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-sky-400 uppercase tracking-widest border-b border-sky-500/20 pb-1">2. Specialty Focus & Departments <span className="text-red-400">*</span></h4>
              
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2 min-h-[36px] bg-slate-955 border border-white/[0.12] rounded-xl p-2.5">
                  {hospForm.specialties.map((spec, i) => (
                    <span key={i} className="bg-sky-500/20 text-sky-300 border border-sky-500/30 text-xs font-bold px-2.5 py-1 rounded-lg flex items-center space-x-1.5">
                      <span>{spec}</span>
                      <button type="button" onClick={() => removeSpecialtyTag(spec)} className="hover:text-white"><X className="h-3 w-3" /></button>
                    </span>
                  ))}
                  {hospForm.specialties.length === 0 && (
                    <span className="text-xs text-slate-500 italic">No departments selected. Click preset tags or add below.</span>
                  )}
                </div>

                {/* Add Custom Specialty Input */}
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Type specialty name & click Add..."
                    value={hospForm.specialtyInput}
                    onChange={(e) => setHospForm({ ...hospForm, specialtyInput: e.target.value })}
                    className="flex-1 bg-slate-955 text-white border border-white/[0.12] rounded-xl px-3.5 py-2 text-xs font-semibold outline-none focus:border-sky-500"
                  />
                  <button
                    type="button"
                    onClick={() => addSpecialtyTag(hospForm.specialtyInput)}
                    className="bg-slate-800 hover:bg-slate-700 text-sky-300 border border-white/[0.12] text-xs font-bold px-4 py-2 rounded-xl"
                  >
                    + Add Department
                  </button>
                </div>

                {/* Quick preset chips */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mr-1">Quick Presets:</span>
                  {['Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics', 'General Medicine', 'Gastroenterology', 'Oncology', 'Nephrology', 'ENT Specialist'].map((tag, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => addSpecialtyTag(tag)}
                      className="bg-slate-900 hover:bg-slate-800 text-slate-300 text-[10px] font-semibold px-2 py-0.5 rounded-md border border-white/[0.08]"
                    >
                      + {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Form Section 3: Address & Location Coordinates */}
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-sky-500/20 pb-1">
                <h4 className="text-xs font-bold text-sky-400 uppercase tracking-widest">3. Location Address & GPS Coordinates</h4>
                <button
                  type="button"
                  onClick={handleAutoGeocode}
                  className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 px-3 py-1 rounded-xl flex items-center space-x-1"
                >
                  <span>📍 Locate on Map / Auto-Geocode</span>
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">Full Street Address <span className="text-red-400">*</span></label>
                <textarea
                  rows={2}
                  required
                  placeholder="Street name, landmark, building number..."
                  value={hospForm.address}
                  onChange={(e) => setHospForm({ ...hospForm, address: e.target.value })}
                  className="w-full bg-slate-955 text-white border border-white/[0.12] rounded-xl p-3 text-xs font-semibold outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">City</label>
                  <input
                    type="text"
                    placeholder="e.g. Chennai"
                    value={hospForm.city}
                    onChange={(e) => setHospForm({ ...hospForm, city: e.target.value })}
                    className="w-full bg-slate-955 text-white border border-white/[0.12] rounded-xl px-3.5 py-2 text-xs font-semibold outline-none focus:border-sky-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">State</label>
                  <input
                    type="text"
                    placeholder="e.g. Tamil Nadu"
                    value={hospForm.state}
                    onChange={(e) => setHospForm({ ...hospForm, state: e.target.value })}
                    className="w-full bg-slate-955 text-white border border-white/[0.12] rounded-xl px-3.5 py-2 text-xs font-semibold outline-none focus:border-sky-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Pincode</label>
                  <input
                    type="text"
                    placeholder="e.g. 600006"
                    value={hospForm.pincode}
                    onChange={(e) => setHospForm({ ...hospForm, pincode: e.target.value })}
                    className="w-full bg-slate-955 text-white border border-white/[0.12] rounded-xl px-3.5 py-2 text-xs font-semibold outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Latitude Coordinate</label>
                  <input
                    type="text"
                    placeholder="e.g. 13.0601"
                    value={hospForm.lat}
                    onChange={(e) => setHospForm({ ...hospForm, lat: e.target.value })}
                    className="w-full bg-slate-955 text-white border border-white/[0.12] rounded-xl px-3.5 py-2 text-xs font-semibold outline-none focus:border-sky-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Longitude Coordinate</label>
                  <input
                    type="text"
                    placeholder="e.g. 80.2514"
                    value={hospForm.lng}
                    onChange={(e) => setHospForm({ ...hospForm, lng: e.target.value })}
                    className="w-full bg-slate-955 text-white border border-white/[0.12] rounded-xl px-3.5 py-2 text-xs font-semibold outline-none focus:border-sky-500 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Form Section 4: Affiliated Doctors */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-sky-400 uppercase tracking-widest border-b border-sky-500/20 pb-1">4. Affiliated Doctors & Specialists</h4>

              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {hospForm.doctors.map((doc, i) => (
                    <span key={i} className="bg-slate-900 border border-white/[0.12] text-slate-200 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center space-x-2">
                      <span className="text-white">{doc.name}</span>
                      <span className="text-sky-400 text-[10px]">({doc.specialty})</span>
                      <button type="button" onClick={() => removeDoctorEntry(i)} className="text-slate-500 hover:text-red-400"><X className="h-3 w-3" /></button>
                    </span>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Doctor Name (e.g. Dr. Priyan)"
                    value={hospForm.docNameInput}
                    onChange={(e) => setHospForm({ ...hospForm, docNameInput: e.target.value })}
                    className="sm:col-span-1 bg-slate-955 text-white border border-white/[0.12] rounded-xl px-3.5 py-2 text-xs font-semibold outline-none focus:border-sky-500"
                  />
                  <input
                    type="text"
                    placeholder="Specialty (e.g. Cardiologist)"
                    value={hospForm.docSpecInput}
                    onChange={(e) => setHospForm({ ...hospForm, docSpecInput: e.target.value })}
                    className="sm:col-span-1 bg-slate-955 text-white border border-white/[0.12] rounded-xl px-3.5 py-2 text-xs font-semibold outline-none focus:border-sky-500"
                  />
                  <button
                    type="button"
                    onClick={addDoctorEntry}
                    className="bg-slate-800 hover:bg-slate-700 text-sky-300 border border-white/[0.12] text-xs font-bold px-4 py-2 rounded-xl"
                  >
                    + Attach Doctor
                  </button>
                </div>
              </div>
            </div>

            {/* Form Section 5: Consultation Fees, Rating & Insurance */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-sky-400 uppercase tracking-widest border-b border-sky-500/20 pb-1">5. Consultation Fees, Rating & Insurance</h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Online Tele-Consultation Fee (₹)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 450"
                    value={hospForm.onlineFee}
                    onChange={(e) => setHospForm({ ...hospForm, onlineFee: e.target.value })}
                    className="w-full bg-slate-955 text-white border border-white/[0.12] rounded-xl px-3.5 py-2 text-xs font-bold outline-none focus:border-sky-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Offline Clinic Visit Fee (₹)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 600"
                    value={hospForm.offlineFee}
                    onChange={(e) => setHospForm({ ...hospForm, offlineFee: e.target.value })}
                    className="w-full bg-slate-955 text-white border border-white/[0.12] rounded-xl px-3.5 py-2 text-xs font-bold outline-none focus:border-sky-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Facility Rating (1.0 - 5.0)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    placeholder="e.g. 4.8"
                    value={hospForm.rating}
                    onChange={(e) => setHospForm({ ...hospForm, rating: e.target.value })}
                    className="w-full bg-slate-955 text-white border border-white/[0.12] rounded-xl px-3.5 py-2 text-xs font-bold outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Accepted Insurance & Government Health Schemes</label>
                <input
                  type="text"
                  placeholder="e.g. Star Health, Ayushman Bharat, TN Chief Minister Scheme, HDFC ERGO"
                  value={hospForm.insuranceSchemes}
                  onChange={(e) => setHospForm({ ...hospForm, insuranceSchemes: e.target.value })}
                  className="w-full bg-slate-955 text-white border border-white/[0.12] rounded-xl px-3.5 py-2 text-xs font-semibold outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-white/[0.12]">
              <button
                type="button"
                onClick={() => setShowHospModal(null)}
                className="bg-slate-955 border border-white/[0.12] text-slate-300 px-5 py-2.5 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-[#0284c7] hover:bg-sky-500 text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-sky-500/25"
              >
                {showHospModal.id ? 'Save Updates' : 'Add Hospital Record'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* EDIT DOCTOR PERFORMANCE MODAL */}
      {editDoctorModal && (
        <div className="fixed inset-0 bg-slate-955/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await adminApi.updateDoctorPerformance(editDoctorModal.id, editDocForm);
                alert('Doctor details updated!');
                setEditDoctorModal(null);
                loadAllData();
              } catch (err) {
                alert('Failed to update doctor: ' + err.message);
              }
            }}
            className="bg-[#090f22] max-w-md w-full rounded-3xl p-6 border border-white/[0.12] space-y-4 shadow-2xl"
          >
            <h3 className="text-base font-bold text-white">Edit Doctor Performance Metrics</h3>
            <p className="text-xs text-slate-400">Editing doctor record for <strong>{editDoctorModal.name}</strong></p>

            <div className="space-y-1">
              <label className="text-xs text-slate-300">Rating (1.0 - 5.0)</label>
              <input
                type="number"
                step="0.1"
                min="1"
                max="5"
                required
                value={editDocForm.rating}
                onChange={(e) => setEditDocForm({ ...editDocForm, rating: e.target.value })}
                className="w-full bg-slate-955 text-white border border-white/[0.12] rounded-xl px-3 py-2 text-xs font-bold outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-300">Total Consultations Count</label>
              <input
                type="number"
                required
                value={editDocForm.consultationCount}
                onChange={(e) => setEditDocForm({ ...editDocForm, consultationCount: e.target.value })}
                className="w-full bg-slate-955 text-white border border-white/[0.12] rounded-xl px-3 py-2 text-xs font-bold outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-300">Account / Doctor Status</label>
              <select
                value={editDocForm.status}
                onChange={(e) => setEditDocForm({ ...editDocForm, status: e.target.value })}
                className="w-full bg-slate-955 text-white border border-white/[0.12] rounded-xl px-3 py-2 text-xs font-bold outline-none"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="ON_LEAVE">ON_LEAVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button type="button" onClick={() => setEditDoctorModal(null)} className="bg-slate-955 border border-white/[0.12] text-slate-300 px-4 py-2 rounded-xl text-xs font-semibold">Cancel</button>
              <button type="submit" className="bg-[#0284c7] hover:bg-sky-500 text-white px-5 py-2 rounded-xl text-xs font-bold">Save Performance Details</button>
            </div>
          </form>
        </div>
      )}

      {/* PLATFORM RESET DOUBLE CONFIRMATION MODAL */}
      {showResetModal && (
        <div className="fixed inset-0 bg-slate-955/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#090f22] max-w-md w-full rounded-3xl p-6 border border-red-900/60 space-y-4 text-center shadow-2xl animate-fade-in">
            <div className="bg-red-500/10 p-3 rounded-2xl border border-red-500/20 w-12 h-12 mx-auto flex items-center justify-center text-red-400">
              <ShieldAlert className="h-6 w-6" />
            </div>

            <h3 className="text-base font-extrabold text-white uppercase tracking-wider">Confirm Platform Data Reset</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              This action is permanent and cannot be undone. All clinical assessments, payment transaction histories, and user accounts will be permanently cleared.
            </p>

            <div className="space-y-1 text-left pt-2">
              <label className="text-xs font-bold text-red-400 block">Type <strong className="text-white">"RESET"</strong> to confirm:</label>
              <input
                type="text"
                value={resetInput}
                onChange={(e) => setResetInput(e.target.value)}
                placeholder="Type RESET here"
                className="w-full bg-slate-955 text-white border border-red-900/60 rounded-xl px-3 py-2 text-xs font-mono font-bold outline-none uppercase tracking-widest text-center"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                onClick={() => {
                  setShowResetModal(false);
                  setResetInput('');
                }}
                className="bg-slate-955 border border-white/[0.12] text-slate-300 px-4 py-2 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>

              <button
                disabled={resetInput !== 'RESET'}
                onClick={async () => {
                  try {
                    await adminApi.resetPlatformData('RESET');
                    alert('All platform data has been permanently reset.');
                    setShowResetModal(false);
                    setResetInput('');
                    loadAllData();
                  } catch (e) {
                    alert('Failed to reset platform data: ' + e.message);
                  }
                }}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                  resetInput === 'RESET' ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/30' : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                Execute Permanent Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD CANCELLATION AUDIT FLAG MODAL */}
      {showAddFlagModal && (
        <div className="fixed inset-0 bg-slate-955/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <form onSubmit={handleAddFlag} className="bg-[#090f22] max-w-md w-full rounded-3xl p-6 border border-white/[0.12] space-y-4 shadow-2xl relative">
            <div className="flex justify-between items-center border-b border-white/[0.12] pb-3">
              <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center space-x-2">
                <ShieldAlert className="h-4 w-4 text-red-400" />
                <span>Log Cancellation Audit Flag</span>
              </h3>
              <button type="button" onClick={() => setShowAddFlagModal(false)} className="text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Entity Name / ID (User or Doctor)</label>
                <input
                  type="text"
                  placeholder="e.g. Patient John Doe or Dr. Swaminathan"
                  value={flagForm.entityName}
                  onChange={e => setFlagForm({ ...flagForm, entityName: e.target.value })}
                  className="w-full bg-slate-955 text-white border border-white/[0.12] rounded-xl px-3.5 py-2 outline-none focus:border-sky-500"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Audit Flag Type</label>
                <select
                  value={flagForm.type}
                  onChange={e => setFlagForm({ ...flagForm, type: e.target.value })}
                  className="w-full bg-slate-955 text-white border border-white/[0.12] rounded-xl px-3.5 py-2 outline-none focus:border-sky-500"
                >
                  <option value="Repeated No-Show">Repeated No-Show</option>
                  <option value="Payment Dispute / Failure">Payment Dispute / Failure</option>
                  <option value="High Provider Cancellation">High Provider Cancellation</option>
                  <option value="Policy Violation">Policy Violation</option>
                  <option value="Manual Fraud Alert">Manual Fraud Alert</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Severity Level</label>
                <select
                  value={flagForm.severity}
                  onChange={e => setFlagForm({ ...flagForm, severity: e.target.value })}
                  className="w-full bg-slate-955 text-white border border-white/[0.12] rounded-xl px-3.5 py-2 outline-none focus:border-sky-500"
                >
                  <option value="HIGH">HIGH (Immediate Review)</option>
                  <option value="MEDIUM">MEDIUM (Standard Flag)</option>
                  <option value="LOW">LOW (Informational Note)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Audit Context & Notes</label>
                <textarea
                  rows="3"
                  placeholder="Enter specific audit details or dispute reason..."
                  value={flagForm.details}
                  onChange={e => setFlagForm({ ...flagForm, details: e.target.value })}
                  className="w-full bg-slate-955 text-white border border-white/[0.12] rounded-xl px-3.5 py-2 outline-none focus:border-sky-500"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-white/[0.12]">
              <button
                type="button"
                onClick={() => setShowAddFlagModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all"
              >
                Log Flag Record
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ADD SYSTEM AUDIT LOG MODAL */}
      {showAddAuditModal && (
        <div className="fixed inset-0 bg-slate-955/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <form onSubmit={handleAddAuditLogSubmit} className="bg-[#090f22] max-w-md w-full rounded-3xl p-6 border border-white/[0.12] space-y-4 shadow-2xl relative">
            <div className="flex justify-between items-center border-b border-white/[0.12] pb-3">
              <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center space-x-2">
                <Activity className="h-4 w-4 text-sky-400" />
                <span>Record System Audit Log Entry</span>
              </h3>
              <button type="button" onClick={() => setShowAddAuditModal(false)} className="text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Action Code</label>
                <input
                  type="text"
                  placeholder="e.g. MANUAL_POLICY_REVIEW, PROFILE_AUDIT"
                  value={auditForm.action}
                  onChange={e => setAuditForm({ ...auditForm, action: e.target.value })}
                  className="w-full bg-slate-955 text-white border border-white/[0.12] rounded-xl px-3.5 py-2 outline-none focus:border-sky-500 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Target ID / Resource</label>
                <input
                  type="text"
                  placeholder="e.g. user_123 or system"
                  value={auditForm.targetId}
                  onChange={e => setAuditForm({ ...auditForm, targetId: e.target.value })}
                  className="w-full bg-slate-955 text-white border border-white/[0.12] rounded-xl px-3.5 py-2 outline-none focus:border-sky-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Audit Details</label>
                <textarea
                  rows="3"
                  placeholder="Describe the administrative action taken..."
                  value={auditForm.details}
                  onChange={e => setAuditForm({ ...auditForm, details: e.target.value })}
                  className="w-full bg-slate-955 text-white border border-white/[0.12] rounded-xl px-3.5 py-2 outline-none focus:border-sky-500"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-white/[0.12]">
              <button
                type="button"
                onClick={() => setShowAddAuditModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#0284c7] hover:bg-sky-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all"
              >
                Record Audit Log
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
