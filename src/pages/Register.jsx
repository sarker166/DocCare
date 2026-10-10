import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import TwoStepVerification from '../components/TwoStepVerification';
import {
  User, Lock, Mail, Phone, Stethoscope, ArrowRight,
  CheckCircle2, AlertCircle, UserRound, Sparkles, Building2,
  HeartPulse,
} from 'lucide-react';
import toast from 'react-hot-toast';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const inputCls = "w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all";
const plainInputCls = "w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all";
const labelCls = "block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5";
const smallLabelCls = "block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1";

export default function Register() {
  const [searchParams, setSearchParams] = useSearchParams();
  const roleFromUrl = searchParams.get('role');
  const [role, setRole] = useState(roleFromUrl === 'doctor' ? 'doctor' : 'patient');
  const [step, setStep] = useState('form');
  const [emailError, setEmailError] = useState('');

  useEffect(() => {
    if (roleFromUrl === 'doctor' || roleFromUrl === 'patient') {
      setRole(roleFromUrl);
    }
  }, [roleFromUrl]);

  const handleRoleChange = (newRole) => {
    setRole(newRole);
    setSearchParams({ role: newRole });
  };

  const [formData, setFormData] = useState({
    name: '', email: '', password: '', phoneNumber: '',
  });

  const [loading, setLoading] = useState(false);
  const { user, register, loading: authLoading, isSupabaseConfigured } = useAuth();
  const navigate = useNavigate();

  const isDoctor = role === 'doctor';

  const dynamicInputCls = isDoctor
    ? "w-full pl-10 pr-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 focus:bg-white transition-all"
    : "w-full pl-10 pr-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 focus:bg-white transition-all";

  const cardBg = isDoctor
    ? "from-[#0f243b]/95 via-[#122133]/90 to-[#0a1522]/95 border-cyan-500/30 shadow-2xl shadow-cyan-950/60"
    : "from-[#0e1d2c]/95 via-[#132233]/90 to-[#0a1522]/95 border-sky-500/30 shadow-2xl shadow-sky-950/60";

  const accentGradient = isDoctor
    ? "from-cyan-400 via-blue-400 to-indigo-400"
    : "from-sky-300 via-cyan-400 to-blue-500";

  const glowOrb = isDoctor ? "bg-cyan-500/25" : "bg-sky-500/25";
  const leftGradient = isDoctor
    ? "bg-gradient-to-br from-cyan-700 via-blue-800 to-indigo-950"
    : "bg-gradient-to-br from-blue-600 via-sky-600 to-indigo-950";

  const btnBg = isDoctor
    ? "bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:via-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-cyan-500/25 border border-cyan-400/30"
    : "bg-gradient-to-r from-sky-500 via-blue-600 to-sky-600 hover:from-sky-400 hover:via-blue-500 hover:to-sky-500 text-white shadow-lg shadow-sky-500/25 border border-sky-400/30";

  const iconColor = isDoctor ? "text-cyan-600" : "text-sky-500";

  useEffect(() => {
    if (!authLoading && user) {
      if (user.role === 'admin') {
        navigate('/admin', { replace: true });
      } else if (user.role === 'doctor') {
        navigate('/doctor', { replace: true });
      } else {
        navigate('/patient', { replace: true });
      }
    }
  }, [user, authLoading, navigate]);

  const validateEmailFormat = (val) => {
    if (!val) {
      setEmailError('Email is required');
      return false;
    }
    if (!EMAIL_REGEX.test(val.trim())) {
      setEmailError('Please enter a valid email address (e.g. name@hospital.com)');
      return false;
    }
    setEmailError('');
    return true;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === 'email' && emailError) {
      validateEmailFormat(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Please enter your full name');
      return;
    }

    if (!validateEmailFormat(formData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    try {
      const res = await register({
        ...formData,
        email: formData.email.trim(),
        role,
      });

      if (res?.requires2FA) {
        setStep('2fa');
        toast('Two-step verification code sent to your email!', { icon: '🔐' });
      } else {
        toast.success(res.message || 'Registration successful!');
        navigate(role === 'doctor' ? '/doctor' : '/patient');
      }
    } catch (err) {
      const msg = err.message || err.response?.data?.message || 'Registration failed.';
      toast.error(msg, { duration: 5000 });
      if (err.response?.data?.alreadyRegistered) {
        setEmailError('This email is already registered. Please go to Login.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handle2FASuccess = (user) => {
    if (user?.role === 'doctor' || role === 'doctor') {
      navigate('/doctor');
    } else {
      navigate('/patient');
    }
  };

  if (!authLoading && user) {
    return (
      <div className="flex-1 min-h-[70vh] bg-gradient-to-br from-[#0a1b38] via-[#0e274d] to-[#071326] flex items-center justify-center">
        <div className="text-center p-8 bg-white border border-slate-200 rounded-2xl shadow-xl max-w-sm">
          <div className="w-10 h-10 border-3 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-semibold text-slate-800">Redirecting...</p>
          <p className="text-xs text-slate-500 mt-1">You are already signed in as {user.name}.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-8 sm:py-12 relative overflow-hidden bg-gradient-to-br from-[#0a1b38] via-[#0e274d] to-[#071326]">
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full blur-[150px] opacity-35 pointer-events-none transition-all duration-700 ${glowOrb}`} />
      <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-cyan-500/20 blur-[120px] pointer-events-none" />
      <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-blue-500/25 blur-[120px] pointer-events-none" />

      {step === '2fa' ? (
        <TwoStepVerification
          email={formData.email.trim()}
          onSuccess={handle2FASuccess}
          onBack={() => setStep('form')}
          actionText="Verify & Activate Account"
        />
      ) : (
        <div className="w-full max-w-5xl bg-white border border-slate-200/90 rounded-[2.5rem] shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 relative z-10">

          <div className={`hidden lg:flex lg:col-span-5 ${leftGradient} p-8 sm:p-10 flex-col justify-between relative overflow-hidden text-white transition-all duration-700`}>
            <div className="absolute -top-16 -left-16 w-60 h-60 rounded-full bg-white/10 blur-2xl pointer-events-none" />
            <div className="absolute -bottom-16 -right-16 w-60 h-60 rounded-full bg-black/25 blur-2xl pointer-events-none" />

            <div className="relative z-10 flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shadow-lg">
                <Stethoscope className="w-5 h-5 text-white drop-shadow" />
              </div>
              <div>
                <span className="text-xl font-extrabold tracking-tight block leading-none text-white">DocCare</span>
                <span className="text-[10px] tracking-wider uppercase text-white/80 font-bold">Healthcare Portal</span>
              </div>
            </div>

            <div className="relative z-10 py-8 sm:py-10 text-center space-y-5">
              <div className="relative inline-flex items-center justify-center">
                <div className="w-32 h-32 rounded-3xl bg-white/10 backdrop-blur-md border border-white/25 flex items-center justify-center shadow-2xl ring-8 ring-white/5">
                  <div className="w-24 h-24 rounded-2xl bg-white/20 border border-white/40 flex items-center justify-center shadow-inner">
                    <HeartPulse className="w-12 h-12 text-white animate-pulse drop-shadow-md" />
                  </div>
                </div>
                <div className="absolute -bottom-2.5 bg-white text-gray-900 font-extrabold text-[10px] uppercase px-3 py-1 rounded-full shadow-lg tracking-wider">
                  DocCare Verified
                </div>
              </div>

              <div className="space-y-1.5">
                <h3 className="text-2xl font-black tracking-tight text-white">
                  Join DocCare Network
                </h3>
                <p className="text-xs text-white/80 max-w-xs mx-auto leading-relaxed">
                  {isDoctor
                    ? 'Publish your consultation hours, manage live patient queues & issue digital prescriptions.'
                    : 'Get fast access to doctors, book free consultations & download official PDF prescriptions.'}
                </p>
              </div>

              <div className="space-y-2 pt-2 text-left max-w-xs mx-auto">
                <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/15 text-xs font-semibold text-white">
                  <CheckCircle2 className="w-4 h-4 text-sky-300 shrink-0" />
                  <span>100% Free Consultations</span>
                </div>
                <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/15 text-xs font-semibold text-white">
                  <CheckCircle2 className="w-4 h-4 text-sky-300 shrink-0" />
                  <span>Instant 1-Click PDF Prescription</span>
                </div>
                <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/15 text-xs font-semibold text-white">
                  <CheckCircle2 className="w-4 h-4 text-sky-300 shrink-0" />
                  <span>2-Step Secure Email Verification</span>
                </div>
              </div>
            </div>

            <div className="relative z-10 pt-4 border-t border-white/15 text-center sm:text-left text-[11px] text-white/70">
              © 2026 DocCare Health System. All rights reserved.
            </div>
          </div>

          <div className="col-span-1 lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between bg-white relative">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-6">
                  <div className={`text-base font-bold relative pb-4 -mb-4 border-b-2 ${
                    isDoctor ? 'border-cyan-500 text-cyan-700' : 'border-sky-500 text-sky-700'
                  }`}>
                    Sign Up
                  </div>
                  <Link
                    to={`/login?role=${role}`}
                    className="text-base font-bold text-slate-400 hover:text-slate-700 transition-colors"
                  >
                    Sign In
                  </Link>
                </div>

                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                  isDoctor
                    ? 'text-cyan-800 bg-cyan-50 border-cyan-200 shadow-sm'
                    : 'text-sky-700 bg-sky-50 border-sky-200 shadow-sm'
                }`}>
                  {isDoctor ? 'DOCTOR REGISTRATION' : 'PATIENT REGISTRATION'}
                </span>
              </div>

              <div className="p-1.5 rounded-2xl bg-slate-100 border border-slate-200/80 grid grid-cols-2 gap-1.5 shadow-inner w-full">
                <button
                  type="button"
                  onClick={() => handleRoleChange('patient')}
                  className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border ${
                    role === 'patient'
                      ? 'bg-white text-sky-600 shadow-sm border-slate-200/80 font-extrabold'
                      : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  <UserRound className="w-3.5 h-3.5 shrink-0" />
                  <span>Patient</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleRoleChange('doctor')}
                  className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border ${
                    role === 'doctor'
                      ? 'bg-white text-cyan-600 shadow-sm border-slate-200/80 font-extrabold'
                      : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  <Stethoscope className="w-3.5 h-3.5 shrink-0" />
                  <span>Doctor</span>
                </button>
              </div>

              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                  {isDoctor ? 'Register as Medical Specialist' : 'Create your Patient Account'}
                </h2>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {isDoctor
                    ? 'Join our medical team, publish your consultation slots & manage patient care'
                    : 'Book consultations, track medical history & receive instant digital prescriptions'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Full Name</label>
                    <div className="relative">
                      <User className={`w-4 h-4 ${iconColor} absolute left-3.5 top-1/2 -translate-y-1/2`} />
                      <input
                        type="text"
                        required
                        name="name"
                        placeholder={isDoctor ? 'Dr. Jane Smith' : 'Jane Smith'}
                        value={formData.name}
                        onChange={handleChange}
                        className={dynamicInputCls}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Phone Number</label>
                    <div className="relative">
                      <Phone className={`w-4 h-4 ${iconColor} absolute left-3.5 top-1/2 -translate-y-1/2`} />
                      <input
                        type="tel"
                        required
                        name="phoneNumber"
                        placeholder="+1 (555) 000-0000"
                        value={formData.phoneNumber}
                        onChange={handleChange}
                        className={dynamicInputCls}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Email Address</label>
                    <div className="relative">
                      <Mail className={`w-4 h-4 ${iconColor} absolute left-3.5 top-1/2 -translate-y-1/2`} />
                      <input
                        type="email"
                        required
                        name="email"
                        placeholder={isDoctor ? 'dr.smith@hospital.com' : 'you@gmail.com'}
                        value={formData.email}
                        onChange={handleChange}
                        onBlur={() => validateEmailFormat(formData.email)}
                        className={`w-full pl-10 pr-3.5 py-3 rounded-xl text-sm transition-all ${
                          emailError
                            ? 'bg-rose-50 border border-rose-300 text-slate-900 placeholder-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-200'
                            : dynamicInputCls
                        }`}
                      />
                    </div>
                    {emailError && (
                      <p className="mt-1 text-[11px] text-rose-600 flex items-center gap-1 font-medium">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        <span>{emailError}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <label className={labelCls}>Password</label>
                    <div className="relative">
                      <Lock className={`w-4 h-4 ${iconColor} absolute left-3.5 top-1/2 -translate-y-1/2`} />
                      <input
                        type="password"
                        required
                        name="password"
                        placeholder="Min 6 characters"
                        value={formData.password}
                        onChange={handleChange}
                        className={dynamicInputCls}
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-3.5 px-4 rounded-xl ${btnBg} text-sm font-bold transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-50 active:scale-[0.99]`}
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>
                        {isDoctor
                          ? 'Register as Doctor & Verify'
                          : 'Register as Patient & Verify'}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-500">
                Already registered?{' '}
                <Link
                  to={isDoctor ? '/login?role=doctor' : '/login?role=patient'}
                  className={`font-bold ${isDoctor ? 'text-cyan-600 hover:text-cyan-700' : 'text-sky-600 hover:text-sky-700'} transition-colors underline`}
                >
                  {isDoctor ? 'Sign in to Doctor Console' : 'Sign in as Patient'}
                </Link>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
