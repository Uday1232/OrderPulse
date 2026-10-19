'use client';

import { useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { ApiService } from '../services/api';

export function useAuth() {
  const { user, token, isAuthenticated, isAdmin, isLoading, setAuth, logout, initialize } =
    useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  const login = async (credentials: { email: string; password: string }) => {
    const res = await ApiService.login(credentials);
    setAuth(res.data.token, res.data.user);
    return res.data;
  };

  const register = async (data: {
    name: string;
    email: string;
    password: string;
    role?: 'SUPERADMIN' | 'ADMIN' | 'USER';
  }) => {
    const res = await ApiService.register(data);
    setAuth(res.data.token, res.data.user);
    return res.data;
  };

  return {
    user,
    token,
    isAuthenticated,
    isAdmin,
    isLoading,
    login,
    register,
    logout,
  };
}
