import axios from 'axios';

const api = axios.create({ baseURL: `${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api` });

api.interceptors.request.use(config => {
  const token = localStorage.getItem('adminToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const authAPI = {
  login: data => api.post('/auth/login', data),
};

export const orderAPI = {
  getAll: () => api.get('/orders/admin/all'),
  assign: (orderId, deliveryBoyId) => api.post('/orders/admin/assign', { orderId, deliveryBoyId }),
  confirm: (orderId) => api.post(`/orders/admin/confirm/${orderId}`),
  cancel: (orderId) => api.post(`/orders/admin/cancel/${orderId}`),
  getDeliveryLocation: (orderId) => api.get(`/orders/${orderId}/location`),
};

export const adminAPI = {
  getDeliveryBoys: () => api.get('/admin/delivery-boys'),
  getStats: () => api.get('/admin/stats'),
  getProducts: () => api.get('/admin/products'),
  addProduct: data => api.post('/admin/products', data),
  updateProduct: (id, data) => api.put(`/admin/products/${id}`, data),
  updateStock: (id, stockQuantity) => api.patch(`/admin/products/${id}/stock`, { stockQuantity }),
  deleteProduct: id => api.delete(`/admin/products/${id}`),
  getCategories: () => api.get('/admin/categories'),
  addCategory: data => api.post('/admin/categories', data),
  updateCategory: (id, data) => api.put(`/admin/categories/${id}`, data),
  uploadProductImage: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/admin/products/upload-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  addProductImage: (productId, data) => api.post(`/admin/products/${productId}/images`, data),
  deleteProductImage: (imageId) => api.delete(`/admin/products/images/${imageId}`),
};

export const offlineBillAPI = {
  getAll: () => api.get('/admin/offline-bills'),
  create: data => api.post('/admin/offline-bills', data),
  delete: id => api.delete(`/admin/offline-bills/${id}`),
};

// ==================== ADMIN FEATURES (9 NEW) ====================
export const themeAPI = {
  get: () => api.get('/bb/admin-features/theme'),
  update: data => api.put('/bb/admin-features/theme', data),
};

export const dashboardBuilderAPI = {
  getLayout: () => api.get('/bb/admin-features/dashboard-layout'),
  saveLayout: layout => api.post('/bb/admin-features/dashboard-layout', { layout }),
};

export const heatmapAPI = {
  getData: (year, month) => api.get('/bb/admin-features/heatmap', { params: { year, month } }),
};

export const aiInsightsAPI = {
  get: () => api.get('/bb/admin-features/ai-insights'),
};

export const inventoryAlertAPI = {
  getAll: () => api.get('/bb/admin-features/inventory-alerts'),
  resolve: id => api.put(`/bb/admin-features/inventory-alerts/${id}/resolve`),
};

export const cashFlowAPI = {
  getTimeline: (period = 'MONTH') => api.get('/bb/admin-features/cash-flow', { params: { period } }),
  addEntry: data => api.post('/bb/admin-features/cash-flow', data),
};

export const expenseReceiptAPI = {
  scan: file => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/bb/admin-features/expense-receipt/scan', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  confirm: (id, data) => api.post(`/bb/admin-features/expense-receipt/${id}/confirm`, data),
  getAll: () => api.get('/bb/admin-features/expense-receipts'),
};

export const notificationAPI = {
  getAll: () => api.get('/bb/admin-features/notifications'),
  getUnreadCount: () => api.get('/bb/admin-features/notifications/unread-count'),
  markRead: id => api.put(`/bb/admin-features/notifications/${id}/read`),
  markAllRead: () => api.put('/bb/admin-features/notifications/mark-all-read'),
  togglePin: id => api.put(`/bb/admin-features/notifications/${id}/pin`),
  clearRead: () => api.delete('/bb/admin-features/notifications/clear-read'),
};

export const businessCardAPI = {
  get: () => api.get('/bb/admin-features/business-card'),
  update: data => api.put('/bb/admin-features/business-card', data),
  share: () => api.post('/bb/admin-features/business-card/share'),
};

// ==================== NEW FEATURES ====================
export const salesForecastAPI = {
  get: () => api.get('/bb/admin-features/sales-forecast'),
};

export const aiDescriptionAPI = {
  generate: data => api.post('/bb/admin-features/generate-description', data),
};

export const returnsAPI = {
  getAll: () => api.get('/bb/admin-features/returns'),
  approve: id => api.put(`/bb/admin-features/returns/${id}/approve`),
  reject: id => api.put(`/bb/admin-features/returns/${id}/reject`),
  processRefund: id => api.post(`/bb/admin-features/returns/${id}/refund`),
};

export const promoCodeAPI = {
  getAll: () => api.get('/bb/admin-features/promo-codes'),
  create: data => api.post('/bb/admin-features/promo-codes', data),
  update: (id, data) => api.put(`/bb/admin-features/promo-codes/${id}`, data),
  delete: id => api.delete(`/bb/admin-features/promo-codes/${id}`),
  toggle: id => api.put(`/bb/admin-features/promo-codes/${id}/toggle`),
};

export const profitLossAPI = {
  get: (period) => api.get('/bb/admin-features/profit-loss', { params: { period } }),
};

export default api;
