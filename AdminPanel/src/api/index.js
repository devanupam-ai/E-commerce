import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'http://10.0.2.2:8080/api';
const api = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use(async config => {
  const token = await AsyncStorage.getItem('adminToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const adminAuthAPI = {
  login: data => api.post('/auth/login', data),
};

export const adminOrderAPI = {
  getAllOrders: () => api.get('/orders/admin/all'),
  assignDelivery: (orderId, deliveryBoyId) => api.post('/orders/admin/assign', { orderId, deliveryBoyId }),
};

export const adminAPI = {
  getDeliveryBoys: () => api.get('/admin/delivery-boys'),
  getCustomers: () => api.get('/admin/customers'),
  addProduct: data => api.post('/admin/products', data),
  updateProduct: (id, data) => api.put(`/admin/products/${id}`, data),
};

export const productAPI = {
  getAll: () => api.get('/products'),
  getCategories: () => api.get('/products/categories'),
};

export default api;
