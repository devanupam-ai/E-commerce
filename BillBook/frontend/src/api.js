import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:9999/api/bb' });

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('bb_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response && (err.response.status === 401 || err.response.status === 403)) {
      localStorage.removeItem('bb_token');
      localStorage.removeItem('bb_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

// Vendor APIs
export const vendorAPI = {
  list: (q) => api.get('/vendors', { params: q ? { q } : {} }),
  get: (id) => api.get(`/vendors/${id}`),
  create: (data) => api.post('/vendors', data),
  update: (id, data) => api.put(`/vendors/${id}`, data),
  delete: (id) => api.delete(`/vendors/${id}`),
};

// Purchase APIs
export const purchaseAPI = {
  list: (params) => api.get('/purchases', { params }),
  get: (id) => api.get(`/purchases/${id}`),
  create: (data) => api.post('/purchases', data),
  recordPayment: (id, data) => api.post(`/purchases/${id}/payment`, data),
  vendorLedger: (vendorId) => api.get(`/purchases/vendor-ledger/${vendorId}`),
};

// Khata (Udhaar Book) APIs
export const khataAPI = {
  overview: () => api.get('/khata/overview'),
  addEntry: (data) => api.post('/khata/entry', data),
  partyKhata: (partyId) => api.get(`/khata/party/${partyId}`),
  settle: (data) => api.post('/khata/settle', data),
  calculateInterest: (data) => api.post('/khata/calculate-interest', data),
  sendReminder: (partyId) => api.get(`/khata/reminder/${partyId}`),
  getOverdue: () => api.get('/khata/overdue'),
  syncInvoice: (invoiceId) => api.post(`/khata/sync-invoice/${invoiceId}`),
};

// WhatsApp APIs
export const whatsappAPI = {
  sendInvoice: (invoiceId) => api.get(`/whatsapp/invoice/${invoiceId}`),
  sendReminder: (customerId) => api.get(`/whatsapp/reminder/${customerId}`),
  sendOverdue: (customerId) => api.get(`/whatsapp/overdue/${customerId}`),
  sendReceipt: (invoiceId) => api.get(`/whatsapp/receipt/${invoiceId}`),
  sendPurchase: (purchaseId) => api.get(`/whatsapp/purchase/${purchaseId}`),
  sendVendorPayment: (vendorId) => api.get(`/whatsapp/vendor-reminder/${vendorId}`),
  sendKhataReminder: (customerId) => api.get(`/whatsapp/khata-reminder/${customerId}`),
  sendProductCatalog: (customerId) => api.get(`/whatsapp/catalog/${customerId}`),
  sendBulkOverdue: () => api.get('/whatsapp/bulk-overdue'),
  sendCustom: (data) => api.post('/whatsapp/custom', data),
};

// GST Reports APIs
export const gstAPI = {
  dashboard: () => api.get('/gst/dashboard'),
  gstr1: (from, to) => api.get('/gst/gstr1', { params: { from, to } }),
  gstr3b: (from, to) => api.get('/gst/gstr3b', { params: { from, to } }),
  hsnSummary: (from, to) => api.get('/gst/hsn-summary', { params: { from, to } }),
  purchaseRegister: (from, to) => api.get('/gst/purchase-register', { params: { from, to } }),
  monthlyComparison: (year) => api.get('/gst/monthly-comparison', { params: { year } }),
};

// Dashboard API
export const dashboardAPI = {
  stats: () => api.get('/dashboard'),
};

// Expense APIs
export const expenseAPI = {
  list: (params) => api.get('/expenses', { params }),
  create: (data) => api.post('/expenses', data),
  update: (id, data) => api.put(`/expenses/${id}`, data),
  delete: (id) => api.delete(`/expenses/${id}`),
};

// Quotation APIs
export const quotationAPI = {
  list: (params) => api.get('/quotations', { params }),
  get: (id) => api.get(`/quotations/${id}`),
  create: (data) => api.post('/quotations', data),
  update: (id, data) => api.put(`/quotations/${id}`, data),
  delete: (id) => api.delete(`/quotations/${id}`),
  convertToInvoice: (id) => api.post(`/quotations/${id}/convert`),
};

// Reports APIs
export const reportsAPI = {
  profitLoss: (from, to) => api.get('/reports/profit-loss', { params: { from, to } }),
  gstReport: (from, to) => api.get('/reports/gst', { params: { from, to } }),
  partyLedger: (type, partyId) => api.get('/reports/party-ledger', { params: { type, partyId } }),
  dayBook: (date) => api.get('/reports/day-book', { params: { date } }),
};

// Analytics APIs
export const analyticsAPI = {
  getAnalytics: (months) => api.get('/analytics', { params: { months } }),
};

// Business Profile API
export const businessProfileAPI = {
  get: () => api.get('/business-profile'),
  create: (data) => api.post('/business-profile', data),
  update: (id, data) => api.put(`/business-profile/${id}`, data),
};

// Stock APIs
export const stockAPI = {
  movements: () => api.get('/stock/movements'),
  lowStock: () => api.get('/stock/low-stock'),
  dashboard: () => api.get('/stock/dashboard'),
  adjust: (data) => api.post('/stock/adjust', data),
};

// Payment APIs
export const paymentAPI = {
  list: (params) => api.get('/payments', { params }),
  create: (data) => api.post('/payments', data),
};

// Sale Return APIs
export const saleReturnAPI = {
  list: () => api.get('/sale-returns'),
  create: (data) => api.post('/sale-returns', data),
  delete: (id) => api.delete(`/sale-returns/${id}`),
};

// Purchase Return APIs
export const purchaseReturnAPI = {
  list: () => api.get('/purchase-returns'),
  create: (data) => api.post('/purchase-returns', data),
  delete: (id) => api.delete(`/purchase-returns/${id}`),
};

// Cash Register APIs
export const cashRegisterAPI = {
  openDay: (data) => api.post('/cash-register/open', data),
  getToday: () => api.get('/cash-register/today'),
  quickEntry: (data) => api.post('/cash-register/quick-entry', data),
  closeDay: (data) => api.post('/cash-register/close', data),
  history: (params) => api.get('/cash-register/history', { params }),
  mismatchAnalysis: () => api.get('/cash-register/mismatch-analysis'),
};

export default api;
