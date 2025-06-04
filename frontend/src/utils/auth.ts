import { User } from '../types';

export const setAuthToken = (token: string): void => {
  localStorage.setItem('access_token', token);
};

export const getAuthToken = (): string | null => {
  return localStorage.getItem('access_token');
};

export const removeAuthToken = (): void => {
  localStorage.removeItem('access_token');
};

export const isAuthenticated = (): boolean => {
  return !!getAuthToken();
};

export const setCurrentUser = (user: User): void => {
  localStorage.setItem('current_user', JSON.stringify(user));
};

export const getCurrentUser = (): User | null => {
  const userStr = localStorage.getItem('current_user');
  return userStr ? JSON.parse(userStr) : null;
};

export const removeCurrentUser = (): void => {
  localStorage.removeItem('current_user');
};

export const logout = (): void => {
  removeAuthToken();
  removeCurrentUser();
  window.location.href = '/login';
};