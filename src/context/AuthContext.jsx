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
      console.error(err);
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
          if (parsed.doctorProfile) setDoctorProfile(parsed.doctorProfile);

          try {
            const res = await api.get('/auth/me');
            setUser(res.data);
            if (res.data.doctorProfile) setDoctorProfile(res.data.doctorProfile);
            localStorage.setItem('doc_user', JSON.stringify(res.data));
          } catch (apiErr) {
            if (isSupabaseConfigured && parsed.id) {
              await fetchSupabaseProfile(parsed.id);
            }
          }
        } catch (err) {
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
    try {
      const res = await api.post('/auth/login', { email, password, expectedRole });
      if (res.data?.requires2FA) {
        return res.data;
      }
      const { token, ...userData } = res.data;
      localStorage.setItem('doc_token', token);
      localStorage.setItem('doc_user', JSON.stringify(userData));
      setUser(userData);
      if (userData.doctorProfile) setDoctorProfile(userData.doctorProfile);
      return userData;
    } catch (apiErr) {
      const canFallback = isSupabaseConfigured && (
        !apiErr.response ||
        apiErr.code === 'ERR_NETWORK' ||
        apiErr.response?.status === 404 ||
        apiErr.response?.data?.notRegistered
      );
      if (canFallback) {
        const { data: supaAuth, error: supaErr } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (supaErr) {
          throw new Error(supaErr.message);
        }

        const { data: prof } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', supaAuth.user.id)
          .single();

        const userRole = prof?.role || supaAuth.user?.user_metadata?.role || 'patient';
        if (expectedRole && userRole !== expectedRole) {
          await supabase.auth.signOut();
          const mismatchErr = new Error(`Role mismatch: Account is registered as ${userRole}, not ${expectedRole}`);
          mismatchErr.response = {
            data: {
              roleMismatch: true,
              message: `Role mismatch: This account is registered as ${userRole}. Please switch to the ${userRole} tab.`,
              actualRole: userRole,
            },
          };
          throw mismatchErr;
        }

        let docProf = null;
        if (userRole === 'doctor') {
          const { data: docData } = await supabase
            .from('doctors')
            .select('*')
            .eq('user_id', supaAuth.user.id)
            .single();
          docProf = docData;
          if (docProf) setDoctorProfile(docProf);
        }

        const supaUser = {
          _id: supaAuth.user.id,
          id: supaAuth.user.id,
          name: prof?.name || supaAuth.user?.user_metadata?.name || 'User',
          email: supaAuth.user.email,
          phoneNumber: prof?.phone || supaAuth.user?.user_metadata?.phoneNumber || '',
          role: userRole,
          doctorProfile: docProf,
        };

        const token = supaAuth.session?.access_token || 'supa_token_' + Date.now();
        localStorage.setItem('doc_token', token);
        localStorage.setItem('doc_user', JSON.stringify(supaUser));
        setUser(supaUser);
        return supaUser;
      }
      throw apiErr;
    }
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

    try {
      const localRes = await api.post('/auth/register', formData);
      if (localRes.data?.requires2FA) {
        return localRes.data;
      }

      const { token, ...userData } = localRes.data;
      localStorage.setItem('doc_token', token);
      localStorage.setItem('doc_user', JSON.stringify(userData));
      setUser(userData);
      return localRes.data;
    } catch (apiErr) {
      const canFallback = isSupabaseConfigured && (
        !apiErr.response ||
        apiErr.code === 'ERR_NETWORK' ||
        apiErr.response?.status >= 500
      );
      if (canFallback) {
        const { data: supaAuth, error: supaErr } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              name: formData.name,
              phoneNumber: formData.phoneNumber || '',
              role: role,
            },
          },
        });

        if (supaErr) {
          throw new Error(supaErr.message);
        }

        const supaUser = {
          _id: supaAuth.user?.id,
          id: supaAuth.user?.id,
          name: formData.name,
          email: formData.email,
          phoneNumber: formData.phoneNumber || '',
          role: role,
        };

        if (role === 'doctor' && supaAuth.user?.id) {
          await supabase.from('doctors').insert([
            {
              user_id: supaAuth.user.id,
              specialization: formData.specialization || 'General Physician',
              department: formData.department || 'General Medicine',
              qualification: formData.qualification || 'MBBS',
              experience: Number(formData.experience) || 1,
              consultation_fee: Number(formData.consultationFee) || 500,
              bio: formData.bio || '',
              clinic_address: formData.clinicAddress || 'Main Chamber',
              approval_status: 'approved',
            },
          ]);
        }

        const token = supaAuth.session?.access_token || 'supa_token_' + Date.now();
        localStorage.setItem('doc_token', token);
        localStorage.setItem('doc_user', JSON.stringify(supaUser));
        setUser(supaUser);
        return supaUser;
      }
      throw apiErr;
    }
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
      if (isSupabaseConfigured && user?.id) {
        await fetchSupabaseProfile(user.id);
      }
    }
  };

  const isAuthenticated = Boolean(user);
  const currentRole = user?.role || profile?.role || 'patient';
  const isPatient = isAuthenticated && currentRole === 'patient';
  const isDoctor = isAuthenticated && currentRole === 'doctor';
  const isAdmin = isAuthenticated && currentRole === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        doctorProfile,
        loading,
        login,
        register,
        verify2FA,
        resend2FA,
        logout,
        refreshUser,
        isSupabaseConfigured,
        isAuthenticated,
        isPatient,
        isDoctor,
        isAdmin,
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
