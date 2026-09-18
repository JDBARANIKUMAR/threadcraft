import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext();

const readAuthSession = () => {
  if (typeof window === 'undefined') return null;
  try {
    return JSON.parse(window.localStorage.getItem('tc_auth_session') || 'null');
  } catch {
    return null;
  }
};

const writeAuthSession = (user) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem('tc_auth_session', JSON.stringify({
    isLoggedIn: true,
    name: user?.name || '',
    role: user?.role || 'customer',
    user,
  }));
  window.dispatchEvent(new Event('tc-auth-session-updated'));
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => readAuthSession()?.user || null);
  const [token, setToken] = useState(() => (typeof window === 'undefined' ? null : window.localStorage.getItem('tc_token')));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      if (token) {
        try {
          const res = await authService.getMe();
          if (res.success) {
            setUser(res.data);
            writeAuthSession(res.data);
          }
        } catch (err) {
          // Token is expired or invalid - clear stale session cleanly
          localStorage.removeItem('tc_token');
          localStorage.removeItem('tc_auth_session');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    fetchCurrentUser();
  }, [token]);

  const login = async (email, password) => {
    const res = await authService.login({ email, password });
    if (res.success && res.data) {
      localStorage.setItem('tc_token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      writeAuthSession(res.data.user);
      return res.data;
    }
    throw new Error(res.message || 'Login failed');
  };

  const register = async (name, email, password, phone) => {
    const res = await authService.register({ name, email, password, phone });
    if (res.success && res.data) {
      localStorage.setItem('tc_token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      writeAuthSession(res.data.user);
      return res.data;
    }
    throw new Error(res.message || 'Registration failed');
  };

  const logout = () => {
    localStorage.removeItem('tc_token');
    localStorage.removeItem('tc_auth_session');
    localStorage.removeItem('tc_login_role');
    setToken(null);
    setUser(null);
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('tc-auth-session-updated'));
  };

  const updateUserProfile = async (profileData) => {
    const res = await authService.updateProfile(profileData);
    if (res.success && res.data) {
      setUser(res.data);
      return res.data;
    }
    throw new Error(res.message || 'Update failed');
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user,
        isAdmin,
        login,
        register,
        logout,
        updateUserProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
export default AuthProvider;
