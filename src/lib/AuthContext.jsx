import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '@/api/supabase';
import { apiClient } from '@/api/client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        loadUser();
      } else {
        setIsLoadingAuth(false);
        setAuthError({ type: 'auth_required' });
      }
    });

    // Listen for auth state changes (login/logout/token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        loadUser();
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsAuthenticated(false);
        setAuthError({ type: 'auth_required' });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUser = async () => {
    try {
      const profile = await apiClient.auth.me();
      setUser(profile);
      setIsAuthenticated(true);
      setAuthError(null);
    } catch (err) {
      setUser(null);
      setIsAuthenticated(false);
      setAuthError({ type: 'auth_required' });
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const logout = () => apiClient.auth.logout();
  const navigateToLogin = () => apiClient.auth.redirectToLogin(window.location.href);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings: false,
      authError,
      authChecked: !isLoadingAuth,
      appPublicSettings: null,
      logout,
      navigateToLogin,
      checkUserAuth: loadUser,
      checkAppState: loadUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
