import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'http://10.0.2.2:8080/api';
const api = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use(async config => {
  const token = await AsyncStorage.getItem('deliveryToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const deliveryAuthAPI = {
  login: data => api.post('/auth/login', data),
};

export const deliveryOrderAPI = {
  getMyOrders: () => api.get('/orders/delivery/my-orders'),
  updateStatus: (orderId, status) => api.put(`/orders/delivery/status/${orderId}?status=${status}`),
  verifyOtp: (orderId, otp) => api.post('/orders/delivery/verify-otp', { orderId, otp }),
  updateLocation: (orderId, latitude, longitude) =>
    api.post('/orders/delivery/location', { orderId, latitude, longitude }),
};

export const deliveryAuthUpdate = {
  updateFcmToken: (userId, fcmToken) => api.put(`/auth/fcm-token/${userId}`, { fcmToken }),
};

export default api;
