import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../config/supabase';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchSupabaseProfile = async (userId) => {
    try {
      const { data: prof, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching Supabase profile:', error.message);
      }

      if (prof) {
        setProfile(prof);

        if (prof.role === 'doctor') {
          const { data: docData } = await supabase
            .from('doctors')
            .select('*')
            .eq('user_id', userId)
            .single();

          if (docData) setDoctorProfile(docData);
        }
      }
    } catch (err) {
      console.error('Failed to retrieve Supabase profile:', err);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('doc_token');
      const storedUser = localStorage.getItem('doc_user');

      if (storedToken && storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          setUser(parsed);
          const res = await api.get('/auth/me');
          setUser(res.data);
          if (res.data.doctorProfile) setDoctorProfile(res.data.doctorProfile);
          localStorage.setItem('doc_user', JSON.stringify(res.data));
        } catch (err) {
          console.error('Session restoration failed:', err);
          localStorage.removeItem('doc_token');
          localStorage.removeItem('doc_user');
          setUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password, expectedRole) => {
    const res = await api.post('/auth/login', { email, password, expectedRole });
    if (res.data.requires2FA) {
      return res.data;
    }
    const { token, ...userData } = res.data;
    localStorage.setItem('doc_token', token);
    localStorage.setItem('doc_user', JSON.stringify(userData));
    setUser(userData);
    if (userData.doctorProfile) setDoctorProfile(userData.doctorProfile);
    return userData;
  };

  const verify2FA = async (email, code) => {
    const res = await api.post('/auth/verify-2fa', { email, code });
    const { token, ...userData } = res.data;
    localStorage.setItem('doc_token', token);
    localStorage.setItem('doc_user', JSON.stringify(userData));
    setUser(userData);
    if (userData.doctorProfile) setDoctorProfile(userData.doctorProfile);
    return userData;
  };

  const resend2FA = async (email) => {
    const res = await api.post('/auth/resend-2fa', { email });
    return res.data;
  };

  const register = async (formData) => {
    const role = formData.role || 'patient';
    const localRes = await api.post('/auth/register', formData);

    if (localRes.data?.requires2FA) {
      return localRes.data;
    }

    const { token, ...userData } = localRes.data;
    localStorage.setItem('doc_token', token);
    localStorage.setItem('doc_user', JSON.stringify(userData));
    setUser(userData);
    return localRes.data;
  };

  const logout = async () => {
    try {
      if (isSupabaseConfigured) {
        await supabase.auth.signOut();
      }
    } catch (e) {
    }
    localStorage.removeItem('doc_token');
    localStorage.removeItem('doc_user');
    setUser(null);
    setProfile(null);
    setDoctorProfile(null);
  };

  const refreshUser = async () => {
    try {
      const res = await api.get('/auth/me');
      setUser(res.data);
      if (res.data.doctorProfile) setDoctorProfile(res.data.doctorProfile);
      localStorage.setItem('doc_user', JSON.stringify(res.data));
    } catch (err) {
      console.error('Refresh user error:', err);
    }
  };

  const effectiveRole = profile?.role || user?.user_metadata?.role || user?.role || 'patient';
  const effectiveName = profile?.name || user?.user_metadata?.name || user?.name || user?.email || 'User';

  return (
    <AuthContext.Provider
      value={{
        user: user ? { ...user, role: effectiveRole, name: effectiveName } : null,
        profile,
        doctorProfile: doctorProfile || user?.doctorProfile,
        loading,
        login,
        verify2FA,
        resend2FA,
        register,
        logout,
        refreshUser,
        isSupabaseConfigured,
        isAuthenticated: !!user,
        isPatient: effectiveRole === 'patient',
        isDoctor: effectiveRole === 'doctor',
        isAdmin: effectiveRole === 'admin',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
