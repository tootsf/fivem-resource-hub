import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

// Configure axios defaults
axios.defaults.baseURL = 'http://localhost:3001';
axios.defaults.withCredentials = true;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/auth/me');

      if (response.data.success) {
        setUser(response.data.data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.log('Not authenticated');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = () => {
    window.location.href = 'http://localhost:3001/auth/github';
  };

  const logout = async () => {
    try {
      await axios.post('/auth/logout');
      setUser(null);
      setError(null);
    } catch (error) {
      console.error('Logout error:', error);
      setError('Failed to logout');
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await axios.put('/auth/profile', profileData);

      if (response.data.success) {
        setUser(response.data.data.user);
        return { success: true };
      } else {
        return { success: false, error: response.data.error };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to update profile';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    updateProfile,
    checkAuthStatus,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
