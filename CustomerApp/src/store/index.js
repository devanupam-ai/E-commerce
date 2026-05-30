import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useAuthStore = create((set) => ({
  user: null,
  token: null,
  setAuth: async (user, token) => {
    await AsyncStorage.setItem('token', token);
    await AsyncStorage.setItem('user', JSON.stringify(user));
    set({ user, token });
  },
  logout: async () => {
    await AsyncStorage.multiRemove(['token', 'user']);
    set({ user: null, token: null });
  },
  loadAuth: async () => {
    const token = await AsyncStorage.getItem('token');
    const userStr = await AsyncStorage.getItem('user');
    if (token && userStr) set({ token, user: JSON.parse(userStr) });
  },
}));

export const useCartStore = create((set, get) => ({
  items: [],
  location: null,
  coupon: null,
  setLocation: (location) => set({ location }),
  setItems: (items) => set({ items }),
  addItem: (product) => {
    const items = get().items;
    const existing = items.find(i => i.product.id === product.id);
    if (existing) {
      set({ items: items.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i) });
    } else {
      set({ items: [...items, { product, quantity: 1 }] });
    }
  },
  removeItem: (productId) => set({ items: get().items.filter(i => i.product.id !== productId) }),
  updateQty: (productId, quantity) => {
    if (quantity <= 0) {
      set({ items: get().items.filter(i => i.product.id !== productId) });
    } else {
      set({ items: get().items.map(i => i.product.id === productId ? { ...i, quantity } : i) });
    }
  },
  clearCart: () => set({ items: [] }),
  setCoupon: (coupon) => set({ coupon }),
  getTotalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
  getSubtotal: () => get().items.reduce((sum, i) => sum + (parseFloat(i.product.sellingPrice || i.product.price) || 0) * i.quantity, 0),
}));

export const useWishlistStore = create((set, get) => ({
  wishlist: [],
  setWishlist: (items) => set({ wishlist: items }),
  addToWishlist: (product) => {
    const wishlist = get().wishlist;
    if (!wishlist.find(p => p.id === product.id)) {
      set({ wishlist: [...wishlist, product] });
      // Sync to backend (fire and forget)
      import('../api').then(({ wishlistAPI }) => {
        wishlistAPI.addToWishlist(product.id).catch(() => {});
      });
    }
  },
  removeFromWishlist: (productId) => {
    set({ wishlist: get().wishlist.filter(p => p.id !== productId) });
    // Sync to backend (fire and forget)
    import('../api').then(({ wishlistAPI }) => {
      wishlistAPI.removeFromWishlist(productId).catch(() => {});
    });
  },
  isInWishlist: (productId) => get().wishlist.some(p => p.id === productId),
}));