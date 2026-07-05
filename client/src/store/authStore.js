import { create } from 'zustand';

const STORAGE_KEY = 'securesheet_auth';

const loadInitial = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { token: null, user: null };
  } catch {
    return { token: null, user: null };
  }
};

const initial = loadInitial();

export const useAuthStore = create((set) => ({
  token: initial.token,
  user: initial.user,
  isAuthenticated: !!initial.token,

  setAuth: (token, user) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, user }));
    set({ token, user, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({ token: null, user: null, isAuthenticated: false });
  },
}));
