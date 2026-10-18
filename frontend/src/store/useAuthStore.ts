import { create } from 'zustand';
import { User } from '../types/order';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;

  setAuth: (token: string, user: User) => void;
  logout: () => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isAdmin: false,
  isLoading: true,

  setAuth: (token: string, user: User) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('tmbill_token', token);
      localStorage.setItem('tmbill_user', JSON.stringify(user));
    }
    set({
      user,
      token,
      isAuthenticated: true,
      isAdmin: user.role === 'ADMIN',
      isLoading: false,
    });
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('tmbill_token');
      localStorage.removeItem('tmbill_user');
    }
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isAdmin: false,
      isLoading: false,
    });
  },

  initialize: () => {
    if (typeof window === 'undefined') {
      set({ isLoading: false });
      return;
    }

    try {
      const storedToken = localStorage.getItem('tmbill_token');
      const storedUser = localStorage.getItem('tmbill_user');

      if (storedToken && storedUser) {
        const user = JSON.parse(storedUser) as User;
        set({
          token: storedToken,
          user,
          isAuthenticated: true,
          isAdmin: user.role === 'ADMIN',
          isLoading: false,
        });
        return;
      }
    } catch {
      // Fallback
    }

    set({ isLoading: false });
  },
}));
