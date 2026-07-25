const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, config);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || `API error (${response.status}: ${response.statusText})`);
    }

    return data;
  } catch (err) {
    console.error(`API Request failed for ${endpoint}:`, err);
    throw err;
  }
}

export const api = {
  login: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  signup: (name, email, password, mobileNumber) => request('/auth/signup', { method: 'POST', body: JSON.stringify({ name, email, password, mobileNumber }) }),
  googleLogin: (email, name, googleId) => request('/auth/google-login', { method: 'POST', body: JSON.stringify({ email, name, googleId }) }),
  forgotPassword: (email, mobileNumber, channel) => request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email, mobileNumber, channel }) }),
  resendOtp: (email, mobileNumber) => request('/auth/resend-otp', { method: 'POST', body: JSON.stringify({ email, mobileNumber }) }),
  verifyOtp: (email, code, newPassword) => request('/auth/verify-otp', { method: 'POST', body: JSON.stringify({ email, code, newPassword }) }),
  getProfile: () => request('/auth/profile'),
  updateProfile: (data) => request('/auth/profile', { method: 'PUT', body: JSON.stringify(data) }),
  getAppointments: () => request('/auth/appointments'),

  // Medicine Reminders CRUD
  getReminders: () => request('/auth/reminders'),
  createReminder: (data) => request('/auth/reminders', { method: 'POST', body: JSON.stringify(data) }),
  updateReminder: (id, data) => request(`/auth/reminders/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteReminder: (id) => request(`/auth/reminders/${id}`, { method: 'DELETE' }),

  // Predictions & Reports
  predictRisk: (formData) => request('/predict/assess', { method: 'POST', body: JSON.stringify(formData) }),
  getReports: () => request('/predict/reports'),
  getReportDetails: (id) => request(`/predict/report/${id}`),
  deleteReport: (id) => request(`/predict/report/${id}`, { method: 'DELETE' }),
  getReportPdfUrl: (id) => `${API_BASE}/predict/report/${id}/pdf`,

  // Secure Report Link Sharing
  createShareLink: (reportId, expiresInDays = 7) => request('/predict/share', { method: 'POST', body: JSON.stringify({ reportId, expiresInDays }) }),
  revokeShareLink: (token) => request('/predict/revoke-share', { method: 'POST', body: JSON.stringify({ token }) }),
  getReportShares: (reportId) => request(`/predict/shares/${reportId}`),

  // Telemedicine & Clinics
  getDoctors: () => request('/doctors/list'),
  bookAppointment: (data) => request('/doctors/book', { method: 'POST', body: JSON.stringify(data) }),

  // Payments & Receipts
  createPaymentOrder: (data) => request('/payment/create-order', { method: 'POST', body: JSON.stringify(data) }),
  checkOrderStatus: (id) => request(`/payment/order-status/${id}`),
  simulateConfirmPayment: (orderId) => request('/payment/simulate-confirm', { method: 'POST', body: JSON.stringify({ orderId }) }),
  payWithWallet: (orderId) => request('/payment/pay-with-wallet', { method: 'POST', body: JSON.stringify({ orderId }) }),
  getWalletBalance: () => request('/auth/wallet/balance'),
  deductWallet: (amount, description) => request('/auth/wallet/deduct', { method: 'POST', body: JSON.stringify({ amount, description }) }),
  getReceiptPdfUrl: (id) => `${API_BASE}/payment/receipt/${id}/pdf`,

  // Adherence & Consent
  logAdherence: (date, status) => request('/auth/adherence', { method: 'POST', body: JSON.stringify({ date, status }) }),
  getStreak: () => request('/auth/streak'),
  exportDataConsent: () => request('/auth/consent/export'),
};
