const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
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
    console.error(`Admin API Request failed for ${endpoint}:`, err);
    throw err;
  }
}

export const adminApi = {
  login: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  getStats: () => request('/admin/stats'),
  getAdvanceStats: () => request('/admin/advance-stats'),
  getStorageUsage: () => request('/admin/storage-usage'),
  getUsers: () => request('/admin/users'),
  toggleUserStatus: (id, status) => request(`/admin/users/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  dataWipe: (id, confirmation) => request(`/admin/data-wipe/${id}`, { method: 'DELETE', body: JSON.stringify({ confirmation }) }),
  
  // Hospitals & Doctors
  getClinics: () => request('/doctors/list'),
  getHospitals: () => request('/admin/hospitals'),
  addHospital: (data) => request('/admin/hospitals', { method: 'POST', body: JSON.stringify(data) }),
  updateHospital: (id, data) => request(`/admin/hospitals/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteHospital: (id) => request(`/admin/hospitals/${id}`, { method: 'DELETE' }),
  bulkImportHospitals: (hospitals) => request('/admin/hospitals/bulk-import', { method: 'POST', body: JSON.stringify({ hospitals }) }),

  getDoctorPerformance: () => request('/admin/doctor-performance'),
  updateDoctorPerformance: (id, data) => request(`/admin/doctors/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteDoctorPerformance: (id) => request(`/admin/doctors/${id}`, { method: 'DELETE' }),
  addDoctorPerformance: (data) => request('/admin/doctors', { method: 'POST', body: JSON.stringify(data) }),
  resetPlatformData: (confirmation) => request('/admin/reset-platform-data', { method: 'POST', body: JSON.stringify({ confirmation }) }),

  // Appointments & Ledger
  getAppointments: () => request('/admin/appointments'),
  getPaymentsHistory: () => request('/admin/payments-history'),
  confirmPayment: (id) => request(`/admin/payments-history/${id}/confirm`, { method: 'POST' }),
  deletePaymentHistory: (id) => request(`/admin/payments-history/${id}`, { method: 'DELETE' }),
  bulkDeletePayments: (ids) => request('/admin/payments-history/bulk-delete', { method: 'POST', body: JSON.stringify({ ids }) }),
  refundWalletDeposit: (transactionId, amount) => request('/admin/wallet/refund', { method: 'POST', body: JSON.stringify({ transactionId, amount }) }),

  // Audits & Flags
  getCancellationFlags: () => request('/admin/cancellation-flags'),
  addCancellationFlag: (data) => request('/admin/cancellation-flags', { method: 'POST', body: JSON.stringify(data) }),
  deleteCancellationFlag: (id) => request(`/admin/cancellation-flags/${id}`, { method: 'DELETE' }),
  getAuditLogs: () => request('/admin/audit-logs'),
  addAuditLog: (data) => request('/admin/audit-logs', { method: 'POST', body: JSON.stringify(data) }),

  // Reminders & Payment Config
  getMedicineReminders: () => request('/admin/medicine-reminders'),
  deleteMedicineReminder: (userId, reminderId) => request(`/admin/medicine-reminders/${userId}/${reminderId}`, { method: 'DELETE' }),
  getPaymentConfig: () => request('/admin/payment-config'),
  updatePaymentConfig: (data) => request('/admin/payment-config', { method: 'POST', body: JSON.stringify(data) }),
  runPaymentTestbench: (data) => request('/admin/payment-testbench', { method: 'POST', body: JSON.stringify(data) }),

  // API Key Tests & Management
  testApiKey: (keyName, keyValue) => request('/admin/test-api-key', { method: 'POST', body: JSON.stringify({ keyName, keyValue }) }),
  getApiKeys: () => request('/admin/api-keys'),
  toggleApiKeyStatus: (id, status) => request(`/admin/api-keys/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  updateApiKey: (id, key) => request(`/admin/api-keys/${id}`, { method: 'PUT', body: JSON.stringify({ key }) }),

  // Website Errors Tracker
  getWebsiteErrors: () => request('/admin/errors'),
  deleteWebsiteError: (id) => request(`/admin/errors/${id}`, { method: 'DELETE' }),
};
