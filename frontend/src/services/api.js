// Cliente de API centralizado para CuidarVe
import { API_BASE_URL } from '../config';

const BASE_URL = API_BASE_URL;

function getStoredToken() {
  try {
    const auth = localStorage.getItem('cuidarve_auth');
    if (auth) {
      const parsed = JSON.parse(auth);
      return parsed.token || null;
    }
  } catch (e) {
    return null;
  }
  return null;
}

async function request(endpoint, options = {}) {
  const token = getStoredToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.error || data.message || `Error en el servidor (${response.status})`;
    throw new Error(errorMsg);
  }

  return data;
}

export const api = {
  // Autenticación
  register: (userData) => request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData)
  }),

  login: (identifier, password) => request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifier, password })
  }),

  getMe: () => request('/auth/me'),

  // Solicitudes Médicas
  createRequest: (data) => request('/requests', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  getRequests: (zone) => {
    const query = zone && zone !== 'Todas' ? `?zone=${encodeURIComponent(zone)}` : '';
    return request(`/requests${query}`);
  },

  getMyRequests: () => request('/requests/my'),

  acceptRequest: (requestId) => request(`/requests/${requestId}/accept`, {
    method: 'POST'
  }),

  // Tokens y Pagos
  getTokenBalance: () => request('/tokens/balance'),

  getTokenTransactions: () => request('/tokens/transactions'),

  getPaymentInfo: () => request('/config/payment-info'),

  rechargeTokens: (data) => request('/tokens/recharge', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  // --- MÓDULO EXCLUSIVO DEL DUEÑO / ADMIN ---
  getAdminStats: () => request('/admin/stats'),

  getAdminConfig: () => request('/admin/config'),

  updateAdminConfig: (data) => request('/admin/config', {
    method: 'PUT',
    body: JSON.stringify(data)
  }),

  getAdminRecharges: () => request('/admin/recharges'),

  getAdminUsers: () => request('/admin/users'),

  toggleUserVerify: (userId, mpps_license) => request(`/admin/users/${userId}/verify`, {
    method: 'PUT',
    body: JSON.stringify({ mpps_license })
  }),

  // Modo Demo
  resetDemoData: () => request('/demo/reset', {
    method: 'POST'
  }),

  // BCV - Banco Central de Venezuela
  getBcvRate: () => request('/bcv/rate'),

  syncBcvRate: () => request('/admin/bcv/sync', {
    method: 'POST'
  })
};
