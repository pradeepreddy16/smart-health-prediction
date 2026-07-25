// Real-time Notification Audio Synthesizer & Sound Engine
// Uses Web Audio API with automatic Context unlocking for instant, crystal-clear sound playback.

let audioCtx = null;

const initAudio = () => {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  return audioCtx;
};

// Global listener to unlock audio on first user touch/click/keypress
if (typeof window !== 'undefined') {
  const unlock = () => {
    const ctx = initAudio();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
  };
  window.addEventListener('click', unlock, { capture: true, once: false });
  window.addEventListener('keydown', unlock, { capture: true, once: false });
  window.addEventListener('touchstart', unlock, { capture: true, once: false });
}

/**
 * Synthesizes a loud, crisp 2-pop notification chime sound (WhatsApp / Mobile push notification style)
 */
export const playWhatsAppNotificationSound = async () => {
  try {
    const ctx = initAudio();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    const now = ctx.currentTime;

    // Primary High Tone Pop (C6: 1046.5 Hz -> A5: 880 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(1046.5, now);
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.08);

    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.6, now + 0.01);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.15);

    // Secondary Chime Tone Pop (E6: 1318.5 Hz -> D6: 1174.6 Hz starting 65ms later)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1318.5, now + 0.065);
    osc2.frequency.exponentialRampToValueAtTime(1174.6, now + 0.18);

    gain2.gain.setValueAtTime(0, now + 0.065);
    gain2.gain.linearRampToValueAtTime(0.7, now + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.065);
    osc2.stop(now + 0.34);

    // Warm Base Resonance (C5: 523.25 Hz)
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = 'triangle';
    osc3.frequency.setValueAtTime(523.25, now + 0.065);

    gain3.gain.setValueAtTime(0, now + 0.065);
    gain3.gain.linearRampToValueAtTime(0.25, now + 0.08);
    gain3.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);

    osc3.connect(gain3);
    gain3.connect(ctx.destination);
    osc3.start(now + 0.065);
    osc3.stop(now + 0.27);

    // Mobile Haptic Vibration
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([80, 40, 80]);
    }
  } catch (err) {
    console.warn('Notification audio synthesis notice:', err);
  }
};

export const triggerBrowserNotification = (title, options = {}) => {
  if (typeof window === 'undefined' || !('Notification' in window)) return;

  if (Notification.permission === 'granted') {
    new Notification(title, {
      vibrate: [100, 50, 100],
      ...options,
    });
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then((permission) => {
      if (permission === 'granted') {
        new Notification(title, options);
      }
    });
  }
};
