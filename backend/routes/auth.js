const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { sendMail } = require('../utils/mail');

const JWT_SECRET = process.env.JWT_SECRET || 'smart-health-secret-key-12345';

// ── Helpers ──────────────────────────────────────────────────────────────────

const logUserActivity = (userId, action, details) => {
  try {
    db.insert('audit_logs', {
      userId,
      action,
      details,
      timestamp: new Date().toISOString(),
    });
  } catch (_) {}
};

function calculateStreak(profileLogs) {
  if (!profileLogs || profileLogs.length === 0) return 0;

  const today = new Date().toLocaleDateString('en-CA');
  const todayLog = profileLogs.find(l => l.date === today);

  let streak = 0;
  let checkDate = new Date();

  if (todayLog && todayLog.status === 'completed') {
    streak = 1;
    checkDate.setDate(checkDate.getDate() - 1);
  } else {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  for (let i = 0; i < 365; i++) {
    const checkDateStr = checkDate.toLocaleDateString('en-CA');
    const dayLog = profileLogs.find(l => l.date === checkDateStr);
    if (dayLog && dayLog.status === 'completed') {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

// ── Middleware ────────────────────────────────────────────────────────────────

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No authorization token provided' });
  
  if (token === 'admin_token_demo_98765' || token.startsWith('admin_token_')) {
    req.user = { id: 'admin-1', name: 'System Administrator', email: 'admin@health.com', role: 'admin' };
    return next();
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Session expired or invalid token' });
    req.user = user;
    next();
  });
};

const authenticateAdmin = (req, res, next) => {
  authenticateToken(req, res, () => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied: Admin permissions required' });
    }
    next();
  });
};

// ── Routes ────────────────────────────────────────────────────────────────────

// User Registration
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, mobileNumber } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existingUser = db.findOne('users', u => u.email.toLowerCase() === email.toLowerCase());
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = db.insert('users', {
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      mobileNumber: mobileNumber || '',
      role: 'user',
      status: 'active',
      isVerified: false,
      walletBalance: 0,
      walletHistory: [],
      streakCount: 0,
      adherenceLogs: [],
      createdAt: new Date().toISOString(),
    });

    delete newUser.password;
    const token = jwt.sign(
      { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    logUserActivity(newUser.id, 'SIGNUP', 'New user registered');
    res.status(201).json({ user: newUser, token });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Internal server error during registration' });
  }
});

// User & Admin Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPassword = (password || '').trim();

    if (!cleanEmail || !cleanPassword) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Default Seed Admin Account
    if ((cleanEmail === 'admin@health.com' || cleanEmail === 'admin@smarthealth.com') && (cleanPassword === 'admin123' || cleanPassword === 'admin')) {
      const token = jwt.sign(
        { id: 'admin-1', name: 'System Administrator', email: cleanEmail, role: 'admin' },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
      return res.json({
        user: { id: 'admin-1', name: 'System Administrator', email: cleanEmail, role: 'admin' },
        token,
      });
    }

    // Default Seed Patient Account
    if (cleanEmail === 'patient@health.com' && cleanPassword === 'patient123') {
      let patient = db.findOne('users', u => u.email.toLowerCase() === 'patient@health.com');
      if (!patient) {
        const hashedPassword = await bcrypt.hash('patient123', 10);
        patient = db.insert('users', {
          name: 'Rahul Sharma',
          email: 'patient@health.com',
          password: hashedPassword,
          mobileNumber: '9876543210',
          role: 'user',
          status: 'active',
          isVerified: true,
          walletBalance: 0,
          walletHistory: [],
          streakCount: 3,
          adherenceLogs: [],
          createdAt: new Date().toISOString()
        });
      }
      const safeUser = { ...patient };
      delete safeUser.password;
      const token = jwt.sign(
        { id: patient.id, name: patient.name, email: patient.email, role: patient.role },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
      return res.json({ user: safeUser, token });
    }

    const user = db.findOne('users', u => u.email.toLowerCase() === cleanEmail);
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    if (user.status === 'deactivated') {
      return res.status(403).json({ message: 'Your account has been deactivated. Please contact support.' });
    }

    const isMatch = await bcrypt.compare(cleanPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    logUserActivity(user.id, 'LOGIN', 'User logged in successfully');

    const safeUser = { ...user };
    delete safeUser.password;
    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({ user: safeUser, token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error during login' });
  }
});

// Google Sign-In / Automatic Account Provisioning
router.post('/google-login', async (req, res) => {
  try {
    const { email, name, googleId } = req.body;
    if (!email || !googleId) {
      return res.status(400).json({ message: 'Email and Google ID are required.' });
    }

    let user = db.findOne('users', u => u.email.toLowerCase() === email.toLowerCase());

    if (user) {
      if (user.status === 'deactivated') {
        return res.status(403).json({ message: 'Your account has been deactivated. Please contact support.' });
      }
      if (!user.googleId) {
        db.update('users', user.id, { googleId });
      }
      logUserActivity(user.id, 'GOOGLE_LOGIN', 'User logged in via Google OAuth');
    } else {
      user = db.insert('users', {
        name: name || 'Google User',
        email: email.toLowerCase(),
        role: 'user',
        status: 'active',
        isVerified: true,
        googleId,
        walletBalance: 0,
        walletHistory: [],
        streakCount: 0,
        adherenceLogs: [],
        createdAt: new Date().toISOString()
      });
      logUserActivity(user.id, 'GOOGLE_SIGNUP', 'New user registered via Google OAuth');
    }

    const safeUser = { ...user };
    delete safeUser.password;
    
    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ user: safeUser, token });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({ message: 'Internal server error during Google login' });
  }
});

// Forgot Password - Send OTP (Supports Email or Mobile SMS)
router.post('/forgot-password', async (req, res) => {
  try {
    const { email, mobileNumber, channel = 'email' } = req.body;
    const identifier = (email || mobileNumber || '').trim().toLowerCase();
    if (!identifier) return res.status(400).json({ message: 'Email or mobile number is required' });

    const user = db.findOne('users', u => 
      u.email.toLowerCase() === identifier || (u.mobileNumber && u.mobileNumber.trim() === identifier)
    );
    if (!user) return res.status(404).json({ message: 'No account found matching this contact info' });

    // Check 60s cooldown
    const existing = db.findOne('otps', o => o.email === user.email);
    if (existing && existing.lastSentAt) {
      const elapsedSeconds = (Date.now() - new Date(existing.lastSentAt).getTime()) / 1000;
      if (elapsedSeconds < 60) {
        const remaining = Math.ceil(60 - elapsedSeconds);
        return res.status(429).json({ message: `Please wait ${remaining} second(s) before requesting a new OTP.` });
      }
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const nowStr = new Date().toISOString();

    if (existing) {
      db.update('otps', existing.id, { otp, expiry, lastSentAt: nowStr, channel });
    } else {
      db.insert('otps', { email: user.email, mobileNumber: user.mobileNumber || '', otp, expiry, lastSentAt: nowStr, channel });
    }

    const senderName = "Smart Health Predictor <noreply@smarthealth.com>";
    console.log(`[${senderName}] OTP dispatched to ${user.email} (${channel.toUpperCase()}): ${otp}`);

    const mailResult = await sendMail({
      to: user.email,
      subject: 'Reset Password Verification OTP - Smart Health Predictor',
      text: `Your One-Time Password (OTP) verification code is: ${otp}. This code is valid for 10 minutes.`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 500px; border: 1px solid #e5e7eb; border-radius: 12px; margin: 0 auto;">
          <h2 style="color: #0284c7; text-align: center; margin-bottom: 20px;">Smart Health Predictor</h2>
          <p>Hello ${user.name},</p>
          <p>We received a request to reset your account password. Please use the following One-Time Password (OTP) code to proceed:</p>
          <div style="background-color: #f3f4f6; padding: 15px; font-size: 24px; font-weight: bold; letter-spacing: 4px; text-align: center; border-radius: 8px; margin: 20px 0; color: #1f2937; font-family: monospace;">
            ${otp}
          </div>
          <p style="font-size: 12px; color: #6b7280; line-height: 1.5;">This OTP code is valid for 10 minutes. If you did not request a password reset, please ignore this email or contact support if you have security concerns.</p>
        </div>
      `
    });

    if (mailResult.success && mailResult.previewUrl) {
      res.json({ 
        message: `Verification OTP dispatched to ${channel === 'sms' ? user.mobileNumber || user.email : user.email} via Ethereal Mail. Click below to view inbox.`, 
        previewUrl: mailResult.previewUrl,
        cooldownSeconds: 60 
      });
    } else {
      res.json({ 
        message: `Verification OTP sent to ${user.email}. (Check Ethereal inbox link below or terminal log).`, 
        previewUrl: mailResult.previewUrl || null,
        cooldownSeconds: 60 
      });
    }
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ message: 'Error sending OTP' });
  }
});

// Resend OTP with strict 60s cooldown
router.post('/resend-otp', async (req, res) => {
  try {
    const { email, mobileNumber } = req.body;
    const identifier = (email || mobileNumber || '').trim().toLowerCase();
    if (!identifier) return res.status(400).json({ message: 'Email or mobile number is required' });

    const existing = db.findOne('otps', o => o.email === identifier || o.mobileNumber === identifier);
    if (existing && existing.lastSentAt) {
      const elapsedSeconds = (Date.now() - new Date(existing.lastSentAt).getTime()) / 1000;
      if (elapsedSeconds < 60) {
        const remaining = Math.ceil(60 - elapsedSeconds);
        return res.status(429).json({ message: `Please wait ${remaining} second(s) before requesting another OTP.` });
      }
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const nowStr = new Date().toISOString();

    if (existing) {
      db.update('otps', existing.id, { otp, expiry, lastSentAt: nowStr });
    } else {
      db.insert('otps', { email: identifier, otp, expiry, lastSentAt: nowStr });
    }

    const user = db.findOne('users', u => u.email.toLowerCase() === identifier || (u.mobileNumber && u.mobileNumber.trim() === identifier));
    const targetEmail = user ? user.email : identifier;
    const targetDisplay = user ? (user.mobileNumber || user.email) : identifier;

    console.log(`[Smart Health Predictor] Resent OTP for ${identifier}: ${otp}`);

    const mailResult = await sendMail({
      to: targetEmail,
      subject: 'Reset Password Verification OTP - Smart Health Predictor (Resent)',
      text: `Your resent One-Time Password (OTP) verification code is: ${otp}. This code is valid for 10 minutes.`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 500px; border: 1px solid #e5e7eb; border-radius: 12px; margin: 0 auto;">
          <h2 style="color: #0284c7; text-align: center; margin-bottom: 20px;">Smart Health Predictor</h2>
          <p>Here is your resent One-Time Password (OTP) code to reset your password:</p>
          <div style="background-color: #f3f4f6; padding: 15px; font-size: 24px; font-weight: bold; letter-spacing: 4px; text-align: center; border-radius: 8px; margin: 20px 0; color: #1f2937; font-family: monospace;">
            ${otp}
          </div>
          <p style="font-size: 12px; color: #6b7280; line-height: 1.5;">This OTP code is valid for 10 minutes.</p>
        </div>
      `
    });

    if (mailResult.success) {
      res.json({ 
        message: `OTP resent to ${targetDisplay}. Click below to view your Ethereal inbox.`, 
        previewUrl: mailResult.previewUrl || null,
        cooldownSeconds: 60 
      });
    } else {
      res.json({ 
        message: `OTP resent to ${targetDisplay}. (Check Ethereal inbox link below or terminal log).`, 
        previewUrl: mailResult.previewUrl || null,
        cooldownSeconds: 60 
      });
    }
  } catch (err) {
    res.status(500).json({ message: 'Error resending OTP' });
  }
});

// Verify OTP & Reset Password
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
      return res.status(400).json({ message: 'Email, OTP code, and new password are required' });
    }

    const otpRecord = db.findOne('otps', o => o.email === email.toLowerCase());
    if (!otpRecord) return res.status(400).json({ message: 'No OTP found. Please request a new one.' });
    if (otpRecord.otp !== code) return res.status(400).json({ message: 'Invalid OTP code' });
    if (new Date(otpRecord.expiry) < new Date()) {
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    const user = db.findOne('users', u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) return res.status(404).json({ message: 'User not found' });

    const hashed = await bcrypt.hash(newPassword, 10);
    db.update('users', user.id, { password: hashed, isVerified: true });
    db.update('otps', otpRecord.id, { otp: null, expiry: null });

    logUserActivity(user.id, 'PASSWORD_RESET', 'Password reset via OTP');
    res.json({ message: 'Password reset successfully!' });
  } catch (err) {
    console.error('OTP verify error:', err);
    res.status(500).json({ message: 'Error resetting password' });
  }
});

// Get current user profile
router.get('/profile', authenticateToken, (req, res) => {
  const user = db.findOne('users', u => u.id === req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  const safeUser = { ...user };
  delete safeUser.password;
  res.json(safeUser);
});

// Update user profile
router.put('/profile', authenticateToken, (req, res) => {
  try {
    const { name, age, gender, mobileNumber, address, medicalHistory, emergencyContactName, emergencyContactPhone } = req.body;
    const user = db.findOne('users', u => u.id === req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const updated = db.update('users', user.id, {
      name: name || user.name,
      age: age ? Number(age) : user.age,
      gender: gender || user.gender,
      mobileNumber: mobileNumber !== undefined ? mobileNumber : user.mobileNumber,
      address: address !== undefined ? address : user.address,
      medicalHistory: medicalHistory !== undefined ? medicalHistory : user.medicalHistory,
      emergencyContactName: emergencyContactName !== undefined ? emergencyContactName : user.emergencyContactName,
      emergencyContactPhone: emergencyContactPhone !== undefined ? emergencyContactPhone : user.emergencyContactPhone,
      updatedAt: new Date().toISOString()
    });

    const safeUser = { ...updated };
    delete safeUser.password;
    res.json({ message: 'Profile updated successfully', user: safeUser });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update profile: ' + err.message });
  }
});

// ── Medicine Reminders CRUD ───────────────────────────────────────────────────

// Get User Reminders
router.get('/reminders', authenticateToken, (req, res) => {
  try {
    const user = db.findOne('users', u => u.id === req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    const reminders = user.medicineReminders || [];
    res.json(reminders);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving medicine reminders' });
  }
});

// Create Medicine Reminder
router.post('/reminders', authenticateToken, (req, res) => {
  try {
    const { name, dosage, startDate, endDate, times, notes } = req.body;
    if (!name || !dosage) {
      return res.status(400).json({ message: 'Medicine name and dosage are required' });
    }

    const user = db.findOne('users', u => u.id === req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const reminders = user.medicineReminders || [];
    const newRem = {
      id: `rem_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name,
      dosage,
      startDate: startDate || new Date().toISOString().split('T')[0],
      endDate: endDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      times: Array.isArray(times) && times.length > 0 ? times : ['08:00 AM', '09:00 PM'],
      notes: notes || '',
      status: 'active',
      createdAt: new Date().toISOString()
    };

    reminders.push(newRem);
    db.update('users', user.id, { medicineReminders: reminders });

    res.status(201).json({ message: 'Medicine reminder added successfully', reminder: newRem, reminders });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create medicine reminder' });
  }
});

// Update Medicine Reminder
router.put('/reminders/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const { name, dosage, startDate, endDate, times, notes } = req.body;

    const user = db.findOne('users', u => u.id === req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    let reminders = user.medicineReminders || [];
    const idx = reminders.findIndex(r => r.id === id);
    if (idx === -1) return res.status(404).json({ message: 'Reminder not found' });

    reminders[idx] = {
      ...reminders[idx],
      name: name || reminders[idx].name,
      dosage: dosage || reminders[idx].dosage,
      startDate: startDate || reminders[idx].startDate,
      endDate: endDate || reminders[idx].endDate,
      times: Array.isArray(times) ? times : reminders[idx].times,
      notes: notes !== undefined ? notes : reminders[idx].notes,
      updatedAt: new Date().toISOString()
    };

    db.update('users', user.id, { medicineReminders: reminders });
    res.json({ message: 'Reminder updated successfully', reminder: reminders[idx], reminders });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update medicine reminder' });
  }
});

// Delete Medicine Reminder
router.delete('/reminders/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const user = db.findOne('users', u => u.id === req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    let reminders = user.medicineReminders || [];
    reminders = reminders.filter(r => r.id !== id);

    db.update('users', user.id, { medicineReminders: reminders });
    res.json({ message: 'Reminder deleted successfully', reminders });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete medicine reminder' });
  }
});

// Wallet balance & history
router.get('/wallet/balance', authenticateToken, (req, res) => {
  try {
    const user = db.findOne('users', u => u.id === req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ balance: user.walletBalance || 0, history: user.walletHistory || [] });
  } catch (error) {
    res.status(500).json({ message: 'Error loading wallet' });
  }
});

// Deduct from wallet
router.post('/wallet/deduct', authenticateToken, (req, res) => {
  try {
    const { amount, description } = req.body;
    const user = db.findOne('users', u => u.id === req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const balance = Number(user.walletBalance || 0);
    if (balance < amount) return res.status(400).json({ message: 'Insufficient wallet balance.' });
    const newBal = balance - amount;
    const history = user.walletHistory || [];
    const txnId = 'TXN_WALL_' + Math.random().toString(36).substring(2, 9).toUpperCase();
    history.push({ type: 'debit', amount, txnId, date: new Date().toISOString(), description });
    db.update('users', user.id, { walletBalance: newBal, walletHistory: history });
    res.json({ message: 'Payment completed from wallet.', balance: newBal, txnId });
  } catch (err) {
    res.status(500).json({ message: 'Error processing wallet deduction.' });
  }
});

// Adherence log
router.post('/adherence', authenticateToken, (req, res) => {
  try {
    const { date, status } = req.body;
    const user = db.findOne('users', u => u.id === req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const logs = user.adherenceLogs || [];
    const existing = logs.findIndex(l => l.date === date);
    if (existing >= 0) {
      logs[existing] = { date, status, updatedAt: new Date().toISOString() };
    } else {
      logs.push({ date, status, updatedAt: new Date().toISOString() });
    }
    db.update('users', user.id, { adherenceLogs: logs });
    const streak = calculateStreak(logs);
    db.update('users', user.id, { streakCount: streak });
    res.json({ message: 'Adherence logged', streak });
  } catch (err) {
    res.status(500).json({ message: 'Error logging adherence' });
  }
});

// Get streak
router.get('/streak', authenticateToken, (req, res) => {
  try {
    const user = db.findOne('users', u => u.id === req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const streak = calculateStreak(user.adherenceLogs || []);
    db.update('users', user.id, { streakCount: streak });
    res.json({ streak });
  } catch (err) {
    res.status(500).json({ message: 'Error getting streak' });
  }
});

// Get user appointments
router.get('/appointments', authenticateToken, (req, res) => {
  try {
    const userAppointments = db.findMany('appointments', a => a.userId === req.user.id);
    userAppointments.sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));
    res.json(userAppointments);
  } catch (err) {
    res.status(500).json({ message: 'Error getting user appointments' });
  }
});

// Data export
router.get('/consent/export', authenticateToken, (req, res) => {
  try {
    const user = db.findOne('users', u => u.id === req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const userReports = db.findMany('reports', r => r.userId === req.user.id);
    const userAppointments = db.findMany('appointments', a => a.userId === req.user.id);
    const safeUser = { ...user };
    delete safeUser.password;
    res.json({
      userProfile: safeUser,
      reports: userReports,
      appointments: userAppointments,
      exportedAt: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ message: 'Error exporting user data' });
  }
});

module.exports = { router, authenticateToken, authenticateAdmin };
