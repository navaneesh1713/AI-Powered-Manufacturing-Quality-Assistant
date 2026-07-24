import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

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
  }, [token]);

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

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
