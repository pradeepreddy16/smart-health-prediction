const API_BASE = 'http://localhost:5000/api';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const api = {
  // Authentication
  login: async (email, password) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Login failed');
    return data;
  },

  signup: async (name, email, password) => {
    const res = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Signup failed');
    return data;
  },

  getProfile: async () => {
    const res = await fetch(`${API_BASE}/auth/profile`, {
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Profile fetch failed');
    return data;
  },

  // Predictions / Risk Reports
  runPrediction: async (reportData) => {
    const res = await fetch(`${API_BASE}/predict`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(reportData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Risk assessment failed');
    return data;
  },

  getHistory: async () => {
    const res = await fetch(`${API_BASE}/predict/history`, {
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to retrieve report history');
    return data;
  },

  getReportDetails: async (id) => {
    const res = await fetch(`${API_BASE}/predict/${id}`, {
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to retrieve report details');
    return data;
  },

  getReportPdfUrl: (id) => {
    const token = localStorage.getItem('token');
    return `${API_BASE}/predict/${id}/pdf?token=${encodeURIComponent(token)}`;
  },

  // GPS / Doctor Recommendations
  recommendDoctors: async (searchParams) => {
    const res = await fetch(`${API_BASE}/doctors/recommend`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(searchParams),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Doctor recommendation failed');
    return data;
  },

  bookAppointment: async (appointmentData) => {
    const res = await fetch(`${API_BASE}/doctors/appointment`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(appointmentData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Appointment booking failed');
    return data;
  },

  // Admin Dashboard
  getAdminStats: async () => {
    const res = await fetch(`${API_BASE}/admin/stats`, {
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to load stats');
    return data;
  },

  getAdminUsers: async () => {
    const res = await fetch(`${API_BASE}/admin/users`, {
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to load users list');
    return data;
  },

  toggleUserStatus: async (userId, status) => {
    const res = await fetch(`${API_BASE}/admin/users/${userId}/status`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to change user status');
    return data;
  },

  deleteUser: async (userId) => {
    const res = await fetch(`${API_BASE}/admin/users/${userId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to delete user');
    return data;
  },

  getAdminAppointments: async () => {
    const res = await fetch(`${API_BASE}/admin/appointments`, {
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch appointments list');
    return data;
  },

  updateAppointmentStatus: async (apptId, status) => {
    const res = await fetch(`${API_BASE}/admin/appointments/${apptId}/status`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to update appointment status');
    return data;
  },

  getAdminClinics: async () => {
    const res = await fetch(`${API_BASE}/doctors`, {
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to retrieve clinics');
    return data;
  },

  addClinic: async (clinicData) => {
    const res = await fetch(`${API_BASE}/admin/clinics`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(clinicData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to insert clinic record');
    return data;
  },

  updateClinic: async (clinicId, clinicData) => {
    const res = await fetch(`${API_BASE}/admin/clinics/${clinicId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(clinicData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to update clinic record');
    return data;
  },

  deleteClinic: async (clinicId) => {
    const res = await fetch(`${API_BASE}/admin/clinics/${clinicId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to delete clinic record');
    return data;
  },

  getAuditLogs: async () => {
    const res = await fetch(`${API_BASE}/admin/audit-logs`, {
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to read audit logs');
    return data;
  },

  getExportCsvUrl: () => {
    const token = localStorage.getItem('token');
    return `${API_BASE}/admin/export-csv?token=${encodeURIComponent(token)}`;
  }
};
