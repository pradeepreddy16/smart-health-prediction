import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Users, Activity, Calendar, Download, Trash2, ShieldCheck, 
  Settings, Save, Plus, MapPin, Check, X, ShieldAlert 
} from 'lucide-react';
import { api } from '../utils/api';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Hospital CRUD state
  const [showAddClinic, setShowAddClinic] = useState(false);
  const [cName, setCName] = useState('');
  const [cSpecialty, setCSpecialty] = useState('Cardiologist');
  const [cAddress, setCAddress] = useState('');
  const [cLat, setCLat] = useState('');
  const [cLng, setCLng] = useState('');
  const [cContact, setCContact] = useState('');
  const [cRating, setCRating] = useState('4.5');

  // Search/Filter User
  const [userSearch, setUserSearch] = useState('');

  // Tab control
  const [activeSubTab, setActiveSubTab] = useState('users'); // users, clinics, appointments, audits

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (!token || user.role !== 'admin') {
        navigate('/login');
        return;
      }

      const [statsData, usersList, clinicsList, apptsList, auditsList] = await Promise.all([
        api.getAdminStats(),
        api.getAdminUsers(),
        api.getAdminClinics(),
        api.getAdminAppointments(),
        api.getAuditLogs()
      ]);

      setStats(statsData);
      setUsers(usersList);
      setClinics(clinicsList);
      setAppointments(apptsList);
      setAuditLogs(auditsList);
    } catch (err) {
      console.error(err);
      setError('Unauthorized access. Only systems administrators permitted.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleUserStatus = async (userId, currentStatus) => {
    try {
      const nextStatus = currentStatus === 'active' ? 'deactivated' : 'active';
      await api.toggleUserStatus(userId, nextStatus);
      fetchData();
    } catch (err) {
      alert(err.message || 'Error updating user state');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Permanently delete this user profile? All linked reports will be deleted.")) return;
    try {
      await api.deleteUser(userId);
      fetchData();
    } catch (err) {
      alert(err.message || 'Error deleting account');
    }
  };

  const handleApptStatus = async (apptId, status) => {
    try {
      await api.updateAppointmentStatus(apptId, status);
      fetchData();
    } catch (err) {
      alert(err.message || 'Error updating appointment status');
    }
  };

  const handleAddClinicSubmit = async (e) => {
    e.preventDefault();
    if (!cName || !cAddress || !cLat || !cLng) {
      alert("Please fill in name, address, latitude, and longitude.");
      return;
    }

    try {
      await api.addClinic({
        name: cName,
        specialty: cSpecialty,
        address: cAddress,
        lat: Number(cLat),
        lng: Number(cLng),
        contact: cContact,
        rating: Number(cRating)
      });
      setShowAddClinic(false);
      setCName('');
      setCAddress('');
      setCLat('');
      setCLng('');
      setCContact('');
      fetchData();
    } catch (err) {
      alert(err.message || 'Error inserting hospital');
    }
  };

  const handleDeleteClinic = async (clinicId) => {
    if (!window.confirm("Delete this hospital record?")) return;
    try {
      await api.deleteClinic(clinicId);
      fetchData();
    } catch (err) {
      alert(err.message || 'Error deleting clinic');
    }
  };

  const handleExportCSV = () => {
    const url = api.getExportCsvUrl();
    window.open(url, '_blank');
  };

  if (loading) {
    return <div className="text-center py-24 text-slate-500 text-sm">Loading admin metrics console...</div>;
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto my-12 glass-panel rounded-2xl p-6 border border-red-900/30 text-center space-y-4">
        <div className="text-red-400 text-sm font-semibold">{error}</div>
        <button onClick={() => navigate('/login')} className="bg-slate-800 text-slate-200 px-4 py-2 rounded-xl text-xs">
          Back to Login
        </button>
      </div>
    );
  }

  // Filter users list
  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(userSearch.toLowerCase()) || 
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-fade-in">
      
      {/* 1. Header with CSV export */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center space-x-3">
          <div className="bg-red-950/40 text-red-500 rounded-xl p-2 border border-red-900/20">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white tracking-wide">Admin Control Console</h1>
            <p className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase">System Audits & Analytics</p>
          </div>
        </div>

        <button
          onClick={handleExportCSV}
          className="bg-medical-600 hover:bg-medical-500 text-white rounded-xl px-4 py-2.5 text-xs font-semibold flex items-center space-x-2 transition-colors shadow-lg shadow-medical-500/10"
        >
          <Download className="h-4 w-4" />
          <span>Export Predictions CSV</span>
        </button>
      </div>

      {/* 2. Visual Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
            <Users className="h-5 w-5 text-sky-400" />
            <p className="text-2xl font-bold text-white mt-2">{stats.totalUsers}</p>
            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Total Users Registered</p>
          </div>
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
            <Activity className="h-5 w-5 text-emerald-400" />
            <p className="text-2xl font-bold text-white mt-2">{stats.totalPredictions}</p>
            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Total Assessments Run</p>
          </div>
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
            <Calendar className="h-5 w-5 text-amber-500" />
            <p className="text-2xl font-bold text-white mt-2">{stats.totalAppointments}</p>
            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Appointment Requests</p>
          </div>
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
            <ShieldCheck className="h-5 w-5 text-blue-400" />
            <p className="text-2xl font-bold text-white mt-2">{stats.pendingAppointments}</p>
            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Pending Bookings</p>
          </div>
        </div>
      )}

      {/* 3. Analytics CSS Graphs Grid */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Condition Distribution Graph */}
          <div className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-850 pb-3">
              Subsystem Risk Flags Frequency
            </h3>
            
            {stats.conditionDistribution.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-500">No flags recorded yet.</div>
            ) : (
              <div className="space-y-3.5 pt-2">
                {stats.conditionDistribution.map((c) => (
                  <div key={c.name} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-slate-300">
                      <span className="capitalize">{c.name} Strain</span>
                      <span>{c.count} flags</span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-medical-500 h-full rounded-full transition-all duration-700"
                        style={{ width: `${Math.min(100, (c.count / (stats.totalPredictions || 1)) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Language Usage stats */}
          <div className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-850 pb-3">
              Application Language Distribution
            </h3>
            
            <div className="space-y-3.5 pt-2">
              {stats.languageDistribution.map((l) => (
                <div key={l.name} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-300">
                    <span>{l.name}</span>
                    <span>{l.value} reports</span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-700"
                      style={{ width: `${Math.min(100, (l.value / (stats.totalPredictions || 1)) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. Sub-Navigation Tabs */}
      <div className="border-b border-slate-850 flex space-x-6 text-sm font-semibold">
        <button
          onClick={() => setActiveSubTab('users')}
          className={`pb-3 transition-colors ${activeSubTab === 'users' ? 'text-medical-500 border-b-2 border-medical-500' : 'text-slate-450 hover:text-slate-200'}`}
        >
          User Accounts
        </button>
        <button
          onClick={() => setActiveSubTab('clinics')}
          className={`pb-3 transition-colors ${activeSubTab === 'clinics' ? 'text-medical-500 border-b-2 border-medical-500' : 'text-slate-450 hover:text-slate-200'}`}
        >
          Hospitals Database
        </button>
        <button
          onClick={() => setActiveSubTab('appointments')}
          className={`pb-3 transition-colors ${activeSubTab === 'appointments' ? 'text-medical-500 border-b-2 border-medical-500' : 'text-slate-450 hover:text-slate-200'}`}
        >
          Appointment Bookings
        </button>
        <button
          onClick={() => setActiveSubTab('audits')}
          className={`pb-3 transition-colors ${activeSubTab === 'audits' ? 'text-medical-500 border-b-2 border-medical-500' : 'text-slate-450 hover:text-slate-200'}`}
        >
          Privacy Audit Logs
        </button>
      </div>

      {/* 5. TAB 1: User list table */}
      {activeSubTab === 'users' && (
        <div className="space-y-4">
          <div className="flex items-center space-x-3 max-w-sm">
            <input
              type="text"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder="Search user by name or email..."
              className="bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 outline-none focus:border-medical-500 w-full"
            />
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950/60 border-b border-slate-850 text-slate-450 font-bold uppercase tracking-wider">
                  <th className="p-4">Name</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Reports Run</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-950/20 text-slate-350 font-medium">
                    <td className="p-4 text-white font-bold">{u.name}</td>
                    <td className="p-4">{u.email}</td>
                    <td className="p-4">{u.reportsCount} report(s)</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[9px] ${
                        u.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                      }`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="p-4 text-right flex justify-end space-x-2.5">
                      <button
                        onClick={() => handleToggleUserStatus(u.id, u.status)}
                        className={`px-3 py-1.5 rounded-xl border text-[10px] font-bold ${
                          u.status === 'active'
                            ? 'text-red-400 border-red-950 hover:bg-red-950/25'
                            : 'text-emerald-400 border-emerald-950 hover:bg-emerald-950/25'
                        }`}
                      >
                        {u.status === 'active' ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleDeleteUser(u.id)}
                        className="text-slate-450 hover:text-red-400 p-1.5 transition-colors border border-slate-800 hover:border-red-900/50 rounded-xl"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. TAB 2: Hospitals Manager */}
      {activeSubTab === 'clinics' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Medical Facilities Listing</h3>
            <button
              onClick={() => setShowAddClinic(!showAddClinic)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl px-3.5 py-2 text-xs font-semibold flex items-center space-x-1.5 border border-slate-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Add Hospital</span>
            </button>
          </div>

          {/* Add Clinic Form Drawer */}
          {showAddClinic && (
            <form onSubmit={handleAddClinicSubmit} className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4 max-w-xl text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold uppercase">Hospital Name</label>
                  <input
                    type="text"
                    required
                    value={cName}
                    onChange={(e) => setCName(e.target.value)}
                    placeholder="E.g. Apollo Adyar"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-200 outline-none focus:border-medical-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold uppercase">Specialty Type</label>
                  <select
                    value={cSpecialty}
                    onChange={(e) => setCSpecialty(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-200 outline-none focus:border-medical-500"
                  >
                    <option value="Cardiologist">Cardiologist</option>
                    <option value="Endocrinologist">Endocrinologist</option>
                    <option value="Nephrologist">Nephrologist</option>
                    <option value="General Physician">General Physician</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-semibold uppercase">Address</label>
                <input
                  type="text"
                  required
                  value={cAddress}
                  onChange={(e) => setCAddress(e.target.value)}
                  placeholder="Street and City Details"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-200 outline-none"
                />
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-1 col-span-2">
                  <label className="text-slate-400 font-semibold uppercase">Contact No</label>
                  <input
                    type="text"
                    value={cContact}
                    onChange={(e) => setCContact(e.target.value)}
                    placeholder="+91 44 ..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-200 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold uppercase">Lat</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={cLat}
                    onChange={(e) => setCLat(e.target.value)}
                    placeholder="13.0601"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-200 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold uppercase">Lng</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={cLng}
                    onChange={(e) => setCLng(e.target.value)}
                    placeholder="80.2514"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-200 outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="bg-medical-600 hover:bg-medical-500 text-white rounded-xl px-4 py-2 text-xs font-semibold"
              >
                Insert Clinic Record
              </button>
            </form>
          )}

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950/60 border-b border-slate-855 text-slate-450 font-bold uppercase tracking-wider">
                  <th className="p-4">Name</th>
                  <th className="p-4">Specialty</th>
                  <th className="p-4">Location Coordinates</th>
                  <th className="p-4">Contact Info</th>
                  <th className="p-4 text-right">Delete</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {clinics.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-950/20 text-slate-350 font-medium">
                    <td className="p-4 text-white font-bold">{c.name}</td>
                    <td className="p-4">{c.specialty}</td>
                    <td className="p-4">Lat: {c.lat}, Lng: {c.lng}</td>
                    <td className="p-4">{c.contact || 'No phone'}</td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleDeleteClinic(c.id)}
                        className="text-slate-450 hover:text-red-400 p-1.5 transition-colors border border-slate-800 hover:border-red-900/50 rounded-xl"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 7. TAB 3: Appointments bookings status update */}
      {activeSubTab === 'appointments' && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/60 border-b border-slate-850 text-slate-450 font-bold uppercase tracking-wider">
                <th className="p-4">Patient Name</th>
                <th className="p-4">Hospital Name</th>
                <th className="p-4">Date/Time</th>
                <th className="p-4">Reason</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Approval Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {appointments.map((a) => (
                <tr key={a.id} className="hover:bg-slate-950/20 text-slate-350 font-medium">
                  <td className="p-4 text-white font-bold">{a.userName}</td>
                  <td className="p-4">{a.clinicName}</td>
                  <td className="p-4">{a.date} at {a.time}</td>
                  <td className="p-4 italic">{a.reason || 'None'}</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[9px] ${
                      a.status === 'approved' 
                        ? 'bg-emerald-500/10 text-emerald-400' 
                        : a.status === 'rejected' 
                        ? 'bg-red-500/10 text-red-400' 
                        : 'bg-amber-500/10 text-amber-400'
                    }`}>
                      {a.status}
                    </span>
                  </td>
                  <td className="p-4 text-right flex justify-end space-x-2">
                    {a.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleApptStatus(a.id, 'approved')}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg p-1.5 shadow"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleApptStatus(a.id, 'rejected')}
                          className="bg-red-600 hover:bg-red-500 text-white rounded-lg p-1.5 shadow"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 8. TAB 4: Audit Logs */}
      {activeSubTab === 'audits' && (
        <div className="space-y-4">
          <div className="flex items-center space-x-3 text-xs text-slate-400 bg-slate-900 border border-slate-800 p-4.5 rounded-2xl max-w-2xl leading-relaxed">
            <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0" />
            <p>
              <strong>Compliance Audit Registry</strong>: Tracks administrator interactions involving medical database alterations, appointment schedules, user account activations, and profile access vectors.
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950/60 border-b border-slate-850 text-slate-450 font-bold uppercase tracking-wider">
                  <th className="p-4">Timestamp</th>
                  <th className="p-4">Action</th>
                  <th className="p-4">Target ID</th>
                  <th className="p-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-950/20 text-slate-350 font-medium">
                    <td className="p-4 text-slate-400 font-mono">{new Date(log.timestamp).toLocaleString()}</td>
                    <td className="p-4 text-white font-bold uppercase tracking-wide">{log.action}</td>
                    <td className="p-4 text-slate-450 font-mono">{log.targetId || 'SYSTEM'}</td>
                    <td className="p-4 italic text-slate-300">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
