import React, { createContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      if (token) {
        try {
          const response = await api.get('/auth/profile');
          setUser(response.data);
        } catch (error) {
          console.error('Failed to load profile', error);
          logout();
        }
      }
      setLoading(false);
    };

    fetchProfile();
  }, [token, logout]);

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const { token: userToken, ...userData } = response.data;
    localStorage.setItem('token', userToken);
    setToken(userToken);
    setUser(userData);
    return response.data;
  };

  const register = async (name, email, password, role, plant_location) => {
    const response = await api.post('/auth/register', { name, email, password, role, plant_location });
    const { token: userToken, ...userData } = response.data;
    localStorage.setItem('token', userToken);
    setToken(userToken);
    setUser(userData);
    return response.data;
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

