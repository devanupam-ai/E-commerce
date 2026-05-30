import { create } from 'zustand';

const useAuth = create((set) => ({
  user: JSON.parse(localStorage.getItem('bb_user') || 'null'),
  login: (user, token) => {
    localStorage.setItem('bb_token', token);
    localStorage.setItem('bb_user', JSON.stringify(user));
    set({ user });
  },
  logout: () => {
    localStorage.removeItem('bb_token');
    localStorage.removeItem('bb_user');
    set({ user: null });
  },
}));

export default useAuth;
