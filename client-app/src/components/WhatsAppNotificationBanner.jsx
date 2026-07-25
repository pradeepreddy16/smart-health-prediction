import React, { useEffect, useState } from 'react';
import { MessageSquare, X, Volume2, VolumeX, CheckCircle, AlertTriangle, ArrowRight, ShieldAlert } from 'lucide-react';
import { playWhatsAppNotificationSound } from '../utils/sound';

export default function WhatsAppNotificationBanner({
  notification,
  onDismiss,
  onOpen,
  soundEnabled = true,
  toggleSound,
}) {
  const [isLeaving, setIsLeaving] = useState(false);
  const [progress, setProgress] = useState(100);

  const duration = notification?.duration || 6000;

  useEffect(() => {
    if (!notification) return;

    // Play WhatsApp sound effect on notification display
    if (soundEnabled) {
      playWhatsAppNotificationSound();
    }

    // Auto-dismiss countdown timer
    const interval = 50;
    const step = (interval / duration) * 100;
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= step) {
          clearInterval(timer);
          handleClose();
          return 0;
        }
        return prev - step;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [notification, duration, soundEnabled]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onDismiss(notification?.id);
    }, 300);
  };

  const handleAction = () => {
    if (onOpen && notification) {
      onOpen(notification);
    }
    handleClose();
  };

  if (!notification) return null;

  const getTypeStyles = (type) => {
    switch (type) {
      case 'emergency':
      case 'urgent':
        return {
          badgeBg: 'bg-red-600',
          badgeText: 'EMERGENCY ALERT',
          borderColor: 'border-red-500/50 shadow-red-950/40',
          icon: <ShieldAlert className="w-4 h-4 text-red-400 animate-pulse" />,
        };
      case 'medicine':
        return {
          badgeBg: 'bg-amber-600',
          badgeText: 'MEDICINE REMINDER',
          borderColor: 'border-amber-500/50 shadow-amber-950/40',
          icon: <AlertTriangle className="w-4 h-4 text-amber-400" />,
        };
      case 'doctor':
      case 'consultation':
        return {
          badgeBg: 'bg-emerald-600',
          badgeText: 'CARE NOTIFICATION',
          borderColor: 'border-emerald-500/50 shadow-emerald-950/40',
          icon: <MessageSquare className="w-4 h-4 text-emerald-400" />,
        };
      default:
        return {
          badgeBg: 'bg-emerald-500',
          badgeText: 'HEALTH NOTIFICATION',
          borderColor: 'border-emerald-500/40 shadow-emerald-950/40',
          icon: <CheckCircle className="w-4 h-4 text-emerald-400" />,
        };
    }
  };

  const style = getTypeStyles(notification.type);

  return (
    <div
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-[9999] w-[92%] max-w-md transition-all duration-300 transform ${
        isLeaving
          ? '-translate-y-10 opacity-0 scale-95'
          : 'translate-y-0 opacity-100 scale-100 animate-bounce-subtle'
      }`}
      style={{
        animation: isLeaving ? 'none' : 'slideDownNotification 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <div
        className={`relative overflow-hidden rounded-2xl bg-slate-900/95 backdrop-blur-2xl border ${style.borderColor} shadow-2xl p-4 text-white ring-1 ring-white/10`}
      >
        {/* Top Header: App Name, Badge & Controls */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/80 text-xs">
          <div className="flex items-center gap-2">
            {/* Green Icon Badge */}
            <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-slate-950 font-bold text-[10px] shadow-sm shadow-emerald-500/50">
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l.24.382-1.03 3.766 3.856-1.011.377.23z"/>
              </svg>
            </div>
            <span className="font-extrabold tracking-wider text-slate-300 text-[11px] uppercase">
              Smart Health Alert
            </span>
            <span className="bg-emerald-500/20 text-emerald-400 text-[9px] font-bold px-1.5 py-0.5 rounded-md border border-emerald-500/30">
              {style.badgeText}
            </span>
          </div>


          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-400 font-medium mr-1">now</span>

            {/* Replay Sound Button */}
            <button
              onClick={() => playWhatsAppNotificationSound()}
              className="p-1 hover:bg-slate-800 text-emerald-400 rounded-lg transition-colors"
              title="Replay WhatsApp Sound"
            >
              <Volume2 className="w-3.5 h-3.5" />
            </button>

            {/* Mute/Unmute Sound */}
            {toggleSound && (
              <button
                onClick={toggleSound}
                className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
                title={soundEnabled ? 'Mute Sound' : 'Enable Sound'}
              >
                {soundEnabled ? (
                  <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <VolumeX className="w-3.5 h-3.5 text-red-400" />
                )}
              </button>
            )}

            {/* Close Button */}
            <button
              onClick={handleClose}
              className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Main Body */}
        <div
          onClick={handleAction}
          className="flex items-start gap-3 cursor-pointer group rounded-xl p-1 hover:bg-slate-800/40 transition-colors"
        >
          {/* Avatar / Icon */}
          <div className="relative flex-shrink-0">
            {notification.avatar ? (
              <img
                src={notification.avatar}
                alt="Sender Avatar"
                className="w-11 h-11 rounded-full object-cover ring-2 ring-emerald-500/40"
              />
            ) : (
              <div className="w-11 h-11 rounded-full bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold shadow-inner">
                {style.icon}
              </div>
            )}
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-900" />
          </div>

          {/* Text Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-white truncate group-hover:text-emerald-300 transition-colors">
                {notification.sender || notification.title || 'Smart Health Assistant'}
              </h4>
            </div>
            <p className="text-xs text-slate-300 font-normal line-clamp-2 mt-0.5 leading-relaxed">
              {notification.message}
            </p>
          </div>

          <div className="flex items-center self-center opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-emerald-400">
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>

        {/* Action Button Bar */}
        <div className="mt-3 flex items-center justify-between gap-2 pt-2 border-t border-slate-800/60">
          <span className="text-[10px] text-slate-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block"></span>
            Tap notification to open details
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={handleClose}
              className="px-2.5 py-1 text-xs font-semibold text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              Dismiss
            </button>
            <button
              onClick={handleAction}
              className="px-3 py-1 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-md shadow-emerald-900/50 flex items-center gap-1 transition-all active:scale-95"
            >
              View Message
            </button>
          </div>
        </div>

        {/* Bottom Auto-Dismiss Progress Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-800/80 overflow-hidden rounded-b-2xl">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300 transition-all ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <style>{`
        @keyframes slideDownNotification {
          0% {
            opacity: 0;
            transform: translate(-50%, -24px) scale(0.92);
          }
          60% {
            opacity: 1;
            transform: translate(-50%, 4px) scale(1.02);
          }
          100% {
            opacity: 1;
            transform: translate(-50%, 0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}
