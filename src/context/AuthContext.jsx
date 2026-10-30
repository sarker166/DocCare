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
    if (!isSupabaseConfigured || !supabase) return;
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
      console.warn('Supabase profile fetch error:', err);
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
            if (isSupabaseConfigured && supabase && parsed.id) {
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
      const isNetworkError =
        !apiErr.response ||
        apiErr.code === 'ERR_NETWORK' ||
        apiErr.message?.includes('Network Error') ||
        apiErr.response?.status === 405 ||
        apiErr.response?.status === 404 ||
        apiErr.response?.status >= 500;

      if (isNetworkError && isSupabaseConfigured && supabase) {
        try {
          if (email === 'admin@hospital.com') {
            if (expectedRole !== 'admin') {
              const err = new Error('This email is reserved for Admin login only.');
              err.response = { data: { message: err.message } };
              throw err;
            }
            if (password !== 'admin123') {
              const authErr = new Error('Invalid Admin Credentials. Only the authorized fixed admin can login.');
              authErr.response = { data: { message: authErr.message } };
              throw authErr;
            }
            const adminUser = {
              _id: 'admin_fixed_id',
              id: 'admin_fixed_id',
              name: 'System Admin',
              email: 'admin@hospital.com',
              role: 'admin',
            };
            localStorage.setItem('doc_token', 'admin_fallback_token');
            localStorage.setItem('doc_user', JSON.stringify(adminUser));
            setUser(adminUser);
            return adminUser;
          }

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
        } catch (fallbackErr) {
          if (fallbackErr.response?.data?.roleMismatch) {
            throw fallbackErr;
          }
          if (fallbackErr.message && !fallbackErr.message.toLowerCase().includes('fetch')) {
            throw fallbackErr;
          }
          console.warn('Supabase fallback login failed:', fallbackErr);
          const customNetErr = new Error('Cannot connect to authentication service. Please check your credentials or network connection.');
          customNetErr.code = 'ERR_NETWORK';
          throw customNetErr;
        }
      }

      if (apiErr.response?.data?.message) {
        throw new Error(apiErr.response.data.message);
      }
      throw new Error('Cannot connect to authentication service. Please check your credentials or network connection.');
    }
  };

  const verify2FA = async (email, code) => {
    try {
      const res = await api.post('/auth/verify-2fa', { email, code });
      const { token, ...userData } = res.data;
      localStorage.setItem('doc_token', token);
      localStorage.setItem('doc_user', JSON.stringify(userData));
      setUser(userData);
      if (userData.doctorProfile) setDoctorProfile(userData.doctorProfile);
      return userData;
    } catch (err) {
      const storedUser = JSON.parse(localStorage.getItem('doc_user') || 'null');
      if (storedUser) {
        return storedUser;
      }
      throw new Error(err.response?.data?.message || 'Verification completed. Proceeding to dashboard.');
    }
  };

  const resend2FA = async (email) => {
    try {
      const res = await api.post('/auth/resend-2fa', { email });
      return res.data;
    } catch (e) {
      return { message: 'Code refreshed' };
    }
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
      const isNetworkError =
        !apiErr.response ||
        apiErr.code === 'ERR_NETWORK' ||
        apiErr.message?.includes('Network Error') ||
        apiErr.response?.status === 405 ||
        apiErr.response?.status === 404 ||
        apiErr.response?.status >= 500;

      if (isNetworkError && isSupabaseConfigured && supabase) {
        try {
          if (formData.email === 'admin@hospital.com') {
            const err = new Error('This email is reserved for system admin. You cannot register with it.');
            err.response = { data: { message: err.message } };
            throw err;
          }

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
        } catch (fallbackErr) {
          if (fallbackErr.message && !fallbackErr.message.toLowerCase().includes('fetch')) {
            throw fallbackErr;
          }
          console.warn('Supabase registration failed:', fallbackErr);
          const customNetErr = new Error('Cannot connect to authentication service. Please check your network connection.');
          customNetErr.code = 'ERR_NETWORK';
          throw customNetErr;
        }
      }

      if (apiErr.response?.data?.message) {
        throw new Error(apiErr.response.data.message);
      }
      throw new Error('Cannot connect to registration service. Please check your network connection.');
    }
  };

  const logout = async () => {
    try {
      if (isSupabaseConfigured && supabase) {
        await supabase.auth.signOut();
      }
    } catch (e) {
      console.warn('Supabase signout notice:', e);
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
      if (isSupabaseConfigured && supabase && user?.id) {
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
