import React, { useState, useEffect } from 'react';
import { Bell, CreditCard, Video, Clock, CheckCircle, ShieldAlert, Trash2, Volume2, MessageSquare, Play, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { api } from '../utils/api';
import { useNotification } from '../context/NotificationContext';

export default function Notifications() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  
  const {
    showNotification,
    soundEnabled,
    toggleSound,
    triggerSound,
    triggerWhatsAppTest,
    triggerMedicineAlertTest,
    triggerEmergencyAlertTest,
  } = useNotification();

  const loadNotifications = async () => {
    try {
      const [remData, walletData, aptData] = await Promise.all([
        api.getReminders().catch(() => []),
        api.getWalletBalance().catch(() => ({ balance: 0, history: [] })),
        api.getAppointments().catch(() => [])
      ]);

      const readIds = JSON.parse(localStorage.getItem('read_notifications') || '[]');
      const deletedIds = JSON.parse(localStorage.getItem('deleted_notifications') || '[]');
      
      // 1. Dynamic medicine reminders mapped per take (times)
      const medicineAlerts = [];
      (remData || []).forEach(rem => {
        const times = Array.isArray(rem.times) ? rem.times : [rem.time || rem.times || '09:00 AM'];
        times.forEach((time, index) => {
          const alertId = `notif-med-${rem.id}-${index}`;
          medicineAlerts.push({
            id: alertId,
            type: 'medicine',
            title: 'Medicine Schedule Alert',
            message: `Dose due: ${rem.name || rem.medicineName || 'Medication'} ${rem.dosage || ''} (${time}). Instructions: ${rem.notes || 'After food'}`,
            timestamp: `Scheduled Today at ${time}`,
            read: readIds.includes(alertId),
            deleted: deletedIds.includes(alertId),
            icon: Clock,
            iconBg: 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
          });
        });
      });

      // 2. Dynamic wallet transactions
      const walletAlerts = [];
      if (walletData && Array.isArray(walletData.history)) {
        walletData.history.forEach((txn, index) => {
          const isCredit = txn.type === 'credit' || (txn.amount > 0 && !txn.description?.toLowerCase().includes('deduct'));
          const alertId = `notif-wallet-${index}`;
          walletAlerts.push({
            id: alertId,
            type: 'payment',
            title: isCredit ? 'Wallet Balance Credited' : 'Wallet Balance Debited',
            message: `₹${Math.abs(txn.amount)}.00 processed. Description: ${txn.description || 'Health Wallet transaction'}.`,
            timestamp: txn.date ? new Date(txn.date).toLocaleDateString() : 'Recently',
            read: readIds.includes(alertId),
            deleted: deletedIds.includes(alertId),
            icon: CreditCard,
            iconBg: isCredit ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20' : 'bg-rose-500 text-white font-bold shadow-md shadow-rose-500/20'
          });
        });
      }

      // 3. Dynamic consultations/appointments
      const consultationAlerts = [];
      if (Array.isArray(aptData)) {
        aptData.forEach(apt => {
          const alertId = `notif-apt-${apt.id}`;
          consultationAlerts.push({
            id: alertId,
            type: 'consultation',
            title: 'Upcoming Video Consultation',
            message: `₹${apt.fee || 450}.00 processed for Dr. ${apt.doctorName || 'Specialist'} (${apt.clinicName || apt.hospitalName || 'Apollo Greams Road'}). Consultation window is active.`,
            timestamp: apt.date ? new Date(apt.date).toLocaleDateString() : 'Recently',
            read: readIds.includes(alertId),
            deleted: deletedIds.includes(alertId),
            icon: Video,
            iconBg: 'bg-sky-500 text-slate-950 font-bold shadow-md shadow-sky-500/20'
          });
        });
      }

      // 4. Default fallbacks if empty
      const staticAlerts = [];
      if (walletAlerts.length === 0 && consultationAlerts.length === 0) {
        staticAlerts.push(
          {
            id: 'notif-payment',
            type: 'payment',
            title: 'Payment Confirmation Received',
            message: '₹450.00 successfully processed for Dr. Priyan (Apollo Greams Road). Digital receipt generated.',
            timestamp: '10 minutes ago',
            read: readIds.includes('notif-payment'),
            deleted: deletedIds.includes('notif-payment'),
            icon: CreditCard,
            iconBg: 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
          },
          {
            id: 'notif-consultation-upcoming',
            type: 'consultation',
            title: 'Upcoming Video Consultation',
            message: 'Your 60-minute active grace window is live for Dr. Priyan. Click Join Call to connect.',
            timestamp: '25 minutes ago',
            read: readIds.includes('notif-consultation-upcoming'),
            deleted: deletedIds.includes('notif-consultation-upcoming'),
            icon: Video,
            iconBg: 'bg-sky-500 text-slate-950 font-bold shadow-md shadow-sky-500/20'
          }
        );
      }

      staticAlerts.push({
        id: 'notif-assignment',
        type: 'report',
        title: 'Biometric Assessment Complete',
        message: 'You have completed your weekly health assignment. Wellness index: 88/100 (Optimal).',
        timestamp: 'Yesterday',
        read: readIds.includes('notif-assignment'),
        deleted: deletedIds.includes('notif-assignment'),
        icon: CheckCircle,
        iconBg: 'bg-indigo-500 text-white font-bold shadow-md shadow-indigo-500/20'
      });

      setNotifications([...medicineAlerts, ...walletAlerts, ...consultationAlerts, ...staticAlerts]);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const markAsRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    const readIds = JSON.parse(localStorage.getItem('read_notifications') || '[]');
    if (!readIds.includes(id)) {
      readIds.push(id);
      localStorage.setItem('read_notifications', JSON.stringify(readIds));
    }
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    const allIds = notifications.map(n => n.id);
    localStorage.setItem('read_notifications', JSON.stringify(allIds));
  };

  const deleteNotification = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, deleted: true } : n));
    const deletedIds = JSON.parse(localStorage.getItem('deleted_notifications') || '[]');
    if (!deletedIds.includes(id)) {
      deletedIds.push(id);
      localStorage.setItem('deleted_notifications', JSON.stringify(deletedIds));
    }
  };

  if (loading) {
    return <div className="text-center py-24 text-slate-500 text-sm font-semibold">Loading clinical notifications...</div>;
  }

  const visibleNotifications = notifications.filter(n => !n.deleted);
  const unreadCount = visibleNotifications.filter(n => !n.read).length;

  return (
    <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-800 pb-4 gap-4">
        <div className="flex items-center space-x-3">
          <div className="bg-sky-600 p-2.5 rounded-2xl text-white">
            <Bell className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white tracking-wide">Notifications & Alerts Feed</h1>
            <p className="text-xs text-slate-400">Unified updates with real-time notification sounds & alerts.</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={toggleSound}
            type="button"
            title={soundEnabled ? "Notification Sound: ON" : "Notification Sound: MUTED"}
            className={`p-2 rounded-xl border transition-all flex items-center space-x-1.5 text-xs font-bold cursor-pointer ${
              soundEnabled
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20'
            }`}
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            <span>{soundEnabled ? 'Sound ON' : 'Muted'}</span>
          </button>

          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="bg-slate-900 border border-slate-700 hover:border-slate-600 text-sky-400 px-3 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer"
              type="button"
            >
              Mark All as Read
            </button>
          )}
        </div>
      </div>

      {/* Notification Feed Cards List */}
      <div className="space-y-3.5">
        {visibleNotifications.length === 0 ? (
          <div className="rounded-3xl bg-slate-900 p-12 text-center border border-slate-800 space-y-3 text-white">
            <Bell className="h-10 w-10 text-slate-500 mx-auto animate-pulse" />
            <p className="text-xs text-slate-400 font-medium">No new notifications in your feed right now.</p>
          </div>
        ) : (
          visibleNotifications.map(n => {
            const IconComponent = n.icon;
            return (
              <div
                key={n.id}
                className={`rounded-2xl p-4 sm:p-5 border-2 transition-all flex items-start justify-between gap-4 animate-fade-in text-white ${
                  n.read
                    ? 'border-slate-800 bg-slate-900/90 opacity-85 hover:opacity-100 hover:border-slate-700'
                    : 'border-emerald-500/50 bg-slate-900 ring-1 ring-emerald-500/30'
                }`}
              >
                <div className="flex items-start space-x-3.5 sm:space-x-4">
                  <div className={`p-3 rounded-2xl shrink-0 ${n.iconBg || 'bg-emerald-500 text-slate-950 font-bold'}`}>
                    <IconComponent className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-sm sm:text-base font-extrabold text-white tracking-wide">{n.title}</h3>
                      {!n.read && (
                        <span className="flex h-2.5 w-2.5 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">{n.message}</p>
                    <span className="text-[11px] text-slate-400 font-semibold block pt-1">{n.timestamp}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-1 sm:space-x-2 shrink-0">
                  {!n.read && (
                    <button
                      onClick={() => markAsRead(n.id)}
                      className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-xl cursor-pointer transition-colors"
                      title="Mark as Read"
                      type="button"
                    >
                      <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotification(n.id)}
                    className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl cursor-pointer transition-colors"
                    title="Remove Notification"
                    type="button"
                  >
                    <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}


