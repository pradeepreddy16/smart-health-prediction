import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import WhatsAppNotificationBanner from '../components/WhatsAppNotificationBanner';
import { playWhatsAppNotificationSound, triggerBrowserNotification } from '../utils/sound';
import { api } from '../utils/api';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const [activeNotification, setActiveNotification] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem('whatsapp_sound_enabled') !== 'false';
  });

  const triggeredKeysRef = useRef(new Set(JSON.parse(localStorage.getItem('triggered_reminder_keys') || '[]')));

  useEffect(() => {
    localStorage.setItem('whatsapp_sound_enabled', soundEnabled);
  }, [soundEnabled]);

  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => !prev);
  }, []);

  const triggerSound = useCallback(() => {
    playWhatsAppNotificationSound();
  }, []);

  const showNotification = useCallback(
    (data) => {
      const id = Date.now() + '-' + Math.random().toString(36).substr(2, 5);
      const newNotif = {
        id,
        sender: data.sender || data.title || 'Smart Health Alert',
        title: data.title || 'New Notification',
        message: data.message || '',
        avatar: data.avatar || null,
        type: data.type || 'medicine', // 'medicine' | 'emergency' | 'doctor'
        link: data.link || '/notifications',
        duration: data.duration || 7000,
        ...data,
      };

      // Play sound immediately on trigger action
      if (soundEnabled && data.sound !== false) {
        playWhatsAppNotificationSound();
      }

      // Flash active notification state to force fresh re-mount & animation
      setActiveNotification(null);
      requestAnimationFrame(() => {
        setActiveNotification(newNotif);
      });

      // Trigger desktop OS notification
      triggerBrowserNotification(newNotif.sender, {
        body: newNotif.message,
      });
    },
    [soundEnabled]
  );

  const dismissNotification = useCallback((id) => {
    setActiveNotification((current) => (current?.id === id ? null : current));
  }, []);

  // --- Real-time Background Medicine Reminder Alarm Engine ---
  const checkReminders = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const remData = await api.getReminders().catch(() => []);
      if (!Array.isArray(remData) || remData.length === 0) return;

      const now = new Date();
      const dateStr = now.toISOString().split('T')[0]; // "2026-07-24"

      // Generate all current time variants
      const hours24 = now.getHours();
      const minutes = now.getMinutes();
      const minsPadded = minutes < 10 ? `0${minutes}` : `${minutes}`;
      const period = hours24 >= 12 ? 'PM' : 'AM';
      const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
      const hours12Padded = hours12 < 10 ? `0${hours12}` : `${hours12}`;
      const hours24Padded = hours24 < 10 ? `0${hours24}` : `${hours24}`;

      const timeVariants = [
        `${hours12Padded}:${minsPadded} ${period}`,
        `${hours12}:${minsPadded} ${period}`,
        `${hours12Padded}:${minsPadded}${period}`,
        `${hours12}:${minsPadded}${period}`,
        `${hours12Padded}:${minsPadded} ${period.toLowerCase()}`,
        `${hours12}:${minsPadded} ${period.toLowerCase()}`,
        `${hours24Padded}:${minsPadded}`,
        `${hours24}:${minsPadded}`,
      ].map((t) => t.toUpperCase());

      remData.forEach((rem) => {
        const times = Array.isArray(rem.times)
          ? rem.times
          : typeof rem.times === 'string'
          ? rem.times.split(',').map((t) => t.trim())
          : [];

        times.forEach((t) => {
          const cleanTime = String(t).trim().toUpperCase();
          if (timeVariants.includes(cleanTime)) {
            const triggerKey = `${rem.id || rem.name}_${cleanTime}_${dateStr}`;

            if (!triggeredKeysRef.current.has(triggerKey)) {
              triggeredKeysRef.current.add(triggerKey);

              // Persist triggered keys array
              const arr = Array.from(triggeredKeysRef.current);
              if (arr.length > 200) arr.shift(); // keep last 200 keys
              localStorage.setItem('triggered_reminder_keys', JSON.stringify(arr));

              // Ring notification chime and show popup banner
              showNotification({
                sender: 'Medicine Schedule Alert',
                title: `Dose Due: ${rem.name} ${rem.dosage || ''}`,
                message: `Time to take your scheduled dose (${t}). Instructions: ${rem.notes || 'Take now with water'}`,
                type: 'medicine',
                link: '/dashboard',
                duration: 8000,
              });
            }
          }
        });
      });
    } catch (err) {
      console.error('Error checking scheduled reminders:', err);
    }
  }, [showNotification]);

  // Check every 5 seconds for matching reminder schedule
  useEffect(() => {
    checkReminders();
    const interval = setInterval(checkReminders, 5000);
    window.addEventListener('reminders_updated', checkReminders);
    return () => {
      clearInterval(interval);
      window.removeEventListener('reminders_updated', checkReminders);
    };
  }, [checkReminders]);


  // Preset quick triggers for testing
  const triggerWhatsAppTest = useCallback(() => {
    showNotification({
      sender: 'Dr. Priyan (Cardiologist)',
      title: 'WhatsApp Consultation Message',
      message: 'Hello! Your recent ECG assessment looks stable. Please take your prescribed medicine after dinner.',
      type: 'doctor',
      link: '/telemedicine',
      avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150&auto=format&fit=crop&q=80',
    });
  }, [showNotification]);

  const triggerMedicineAlertTest = useCallback(() => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    showNotification({
      sender: 'Medicine Schedule Alert',
      title: 'Dose Due: Paracetamol 1 Tablet',
      message: `Scheduled dose due now (${timeStr}). Instructions: Take after food with water.`,
      type: 'medicine',
      link: '/dashboard',
    });
  }, [showNotification]);

  const triggerEmergencyAlertTest = useCallback(() => {
    showNotification({
      sender: 'SOS Emergency System',
      title: 'Critical Health Warning',
      message: 'High risk indicator detected in blood pressure metrics. Emergency contact notified.',
      type: 'emergency',
      link: '/advance',
    });
  }, [showNotification]);

  return (
    <NotificationContext.Provider
      value={{
        activeNotification,
        showNotification,
        dismissNotification,
        soundEnabled,
        toggleSound,
        triggerSound,
        triggerWhatsAppTest,
        triggerMedicineAlertTest,
        triggerEmergencyAlertTest,
        checkReminders,
      }}
    >
      {children}
      {activeNotification && (
        <WhatsAppNotificationBanner
          key={activeNotification.id}
          notification={activeNotification}
          onDismiss={dismissNotification}
          onOpen={(notif) => {
            if (notif.link) {
              window.location.href = notif.link;
            }
          }}
          soundEnabled={soundEnabled}
          toggleSound={toggleSound}
        />
      )}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}
