let _token = null;
const _listeners = new Set();

export const authState = {
  setToken: (t) => { _token = t; _listeners.forEach(fn => fn(t)); },
  getToken: () => _token,
  subscribe: (fn) => { _listeners.add(fn); return () => _listeners.delete(fn); },
};
