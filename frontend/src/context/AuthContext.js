import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    console.log("🔍 LOGIN START:", new Date().toISOString());
    const loginStartTime = performance.now();
    
    try {
      console.log("🔍 About to call authAPI.login...");
      const apiStartTime = performance.now();
      
      const response = await authAPI.login(email, password);
      
      const apiEndTime = performance.now();
      console.log(`🔍 API call completed in ${(apiEndTime - apiStartTime).toFixed(3)}ms`);
      console.log("🔍 Response received:", response);
      
      const { access_token, user: userData } = response;
      
      console.log("🔍 Storing token and user data...");
      const storageStartTime = performance.now();
      
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      
      const storageEndTime = performance.now();
      console.log(`🔍 Storage operations completed in ${(storageEndTime - storageStartTime).toFixed(3)}ms`);
      
      const totalTime = performance.now() - loginStartTime;
      console.log(`🔍 TOTAL LOGIN TIME: ${totalTime.toFixed(3)}ms`);
      
      return { success: true };
    } catch (error) {
      const totalTime = performance.now() - loginStartTime;
      console.log(`🔍 LOGIN FAILED after ${totalTime.toFixed(3)}ms`);
      console.error('Login error:', error);
      
      // Always show user-friendly messages, never expose technical errors
      let errorMessage = 'Incorrect email or password';
      
      // Handle specific cases where we want different messages
      if (!error.response) {
        errorMessage = 'Unable to connect to server. Please try again.';
      } else if (error.response?.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.response?.status === 422) {
        errorMessage = 'Please check your email and password format.';
      }
      // For all authentication errors (401, 403, etc.), keep the generic message
      
      console.log('🔍 Final error message:', errorMessage);
      
      return { 
        success: false, 
        error: errorMessage 
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      const { access_token, user: newUser } = response;
      
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(newUser));
      setUser(newUser);
      
      return { success: true };
    } catch (error) {
      console.error('Registration error:', error);
      
      // User-friendly registration error messages
      let errorMessage = 'Registration failed. Please try again.';
      
      if (!error.response) {
        errorMessage = 'Unable to connect to server. Please try again.';
      } else if (error.response?.status === 400) {
        errorMessage = 'Please check your information and try again.';
      } else if (error.response?.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      }
      
      return { 
        success: false, 
        error: errorMessage 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
