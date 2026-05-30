import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Auto-detect BASE_URL based on environment
import { Platform } from 'react-native';

const getBaseUrl = () => {
  // For Android emulator, use: return 'http://10.0.2.2:8080/api';
  // For physical device, use your PC's local IP (find via: ipconfig in cmd)
  const PC_IP = '192.168.1.7'; // <-- CHANGE THIS to your PC's current IP
  return `http://\${PC_IP}:8080/api`;
};

const BASE_URL = getBaseUrl();

const api = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use(async config => {
  const token = await AsyncStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) AsyncStorage.removeItem('token');
    return Promise.reject(err);
  }
);

export const authAPI = {
  register: data => api.post('/auth/register', data),
  login: data => api.post('/auth/login', data),
  updateFcmToken: (userId, fcmToken) => api.put(`/auth/fcm-token/${userId}`, { fcmToken }),
};

export const productAPI = {
  getCategories: () => api.get('/products/categories'),
  getAll: () => api.get('/products'),
  getByCategory: id => api.get(`/products/category/${id}`),
  search: q => api.get(`/products/search?q=${q}`),
};

export const cartAPI = {
  getCart: () => api.get('/cart'),
  addToCart: (productId, quantity) => api.post('/cart/add', { productId, quantity }),
  updateQuantity: (productId, quantity) => api.put('/cart/update', { productId, quantity }),
  clearCart: () => api.delete('/cart/clear'),
};

export const orderAPI = {
  getBillSummary: () => api.get('/orders/bill-summary'),
  createPaymentOrder: data => api.post('/orders/create-payment-order', data),
  placeOrder: data => api.post('/orders/place', data),
  getMyOrders: () => api.get('/orders/my-orders'),
  applyEMI: (orderId, data) => api.post(`/orders/${orderId}/emi`, data),
};

export const addressAPI = {
  getAddresses: () => api.get('/addresses'),
  addAddress: data => api.post('/addresses', data),
  updateAddress: (id, data) => api.put(`/addresses/${id}`, data),
  deleteAddress: id => api.delete(`/addresses/${id}`),
};
export const wishlistAPI = {
  getWishlist: () => api.get('/wishlist'),
  addToWishlist: (productId) => api.post('/wishlist/add', { productId }),
  removeFromWishlist: (productId) => api.delete(`/wishlist/${productId}`),
};

export const reviewAPI = {
  getProductReviews: (productId) => api.get(`/products/${productId}/reviews`),
  addReview: (productId, data) => api.post(`/products/${productId}/reviews`, data),
};

export const couponAPI = {
  validateCoupon: (code, orderAmount) => api.post('/coupons/validate', { code, orderAmount }),
};

export const userAPI = {
  getProfile: () => api.get('/user/profile'),
  updateProfile: (data) => api.put('/user/profile', data),
  changePassword: (data) => api.put('/user/change-password', data),
  getLoyaltyPoints: () => api.get('/user/loyalty-points'),
  redeemLoyaltyPoints: (data) => api.post('/user/loyalty-points/redeem', data),
};

// ==================== NEW CUSTOMER FEATURES ====================
export const smartSearchAPI = {
  search: (params) => api.get('/customer-features/search', { params }),
};

export const flashSaleAPI = {
  getDeals: () => api.get('/customer-features/flash-sales'),
};

export const priceDropAPI = {
  getAlerts: () => api.get('/customer-features/price-drop-alerts'),
  subscribe: (productId) => api.post(`/customer-features/price-drop-alerts/${productId}/subscribe`),
};

export const orderTrackingAPI = {
  track: (orderId) => api.get(`/customer-features/orders/${orderId}/track`),
};

export const scheduleDeliveryAPI = {
  getSlots: () => api.get('/customer-features/delivery-slots'),
  schedule: (data) => api.post('/customer-features/delivery-schedule', data),
};

export const referEarnAPI = {
  getReferralInfo: () => api.get('/customer-features/referral'),
  shareReferral: () => api.post('/customer-features/referral/share'),
};

export const challengeAPI = {
  getChallenges: () => api.get('/customer-features/challenges'),
  joinChallenge: (id) => api.post(`/customer-features/challenges/${id}/join`),
};

export const leaderboardAPI = {
  get: () => api.get('/customer-features/leaderboard'),
};

export const recommendationAPI = {
  get: () => api.get('/customer-features/recommendations'),
};

export const quickReorderAPI = {
  getHistory: () => api.get('/customer-features/quick-reorder'),
  reorder: (orderId) => api.post(`/customer-features/quick-reorder/${orderId}`),
};

export const receiptAPI = {
  getAll: () => api.get('/customer-features/receipts'),
  getReceipt: (orderId) => api.get(`/customer-features/receipts/${orderId}`),
};

export default api;
