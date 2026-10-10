import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import TwoStepVerification from '../components/TwoStepVerification';
import {
  Lock, Mail, Stethoscope, ArrowRight, ShieldCheck,
  AlertCircle, UserRound, ShieldAlert, Sparkles,
  HeartPulse, CheckCircle2,
} from 'lucide-react';
import toast from 'react-hot-toast';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export default function Login() {
  const [searchParams, setSearchParams] = useSearchParams();
  const roleFromUrl = searchParams.get('role');
  const initialRole = roleFromUrl === 'doctor' ? 'doctor' : roleFromUrl === 'admin' ? 'admin' : 'patient';

  const [activeRole, setActiveRole] = useState(initialRole);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('credentials');
  const [emailError, setEmailError] = useState('');
  const [notRegisteredError, setNotRegisteredError] = useState(false);
  const [notVerifiedError, setNotVerifiedError] = useState(false);
  const [roleMismatchError, setRoleMismatchError] = useState(null);

  const { user, login, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname;

  useEffect(() => {
    if (!authLoading && user) {
      if (from) {
        navigate(from, { replace: true });
      } else if (user.role === 'admin') {
        navigate('/admin', { replace: true });
      } else if (user.role === 'doctor') {
        navigate('/doctor', { replace: true });
      } else {
        navigate('/patient', { replace: true });
      }
    }
  }, [user, authLoading, from, navigate]);

  useEffect(() => {
    if (roleFromUrl && ['patient', 'doctor', 'admin'].includes(roleFromUrl)) {
      setActiveRole(roleFromUrl);
    }
  }, [roleFromUrl]);

  const switchRole = (newRole) => {
    setActiveRole(newRole);
    setSearchParams({ role: newRole });
    setNotRegisteredError(false);
    setNotVerifiedError(false);
    setRoleMismatchError(null);
    setEmailError('');
  };

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

  const handleEmailChange = (e) => {
    const val = e.target.value;
    setEmail(val);
    setNotRegisteredError(false);
    setNotVerifiedError(false);
    setRoleMismatchError(null);
    if (emailError) {
      validateEmailFormat(val);
    }
  };

  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    setNotRegisteredError(false);
    setNotVerifiedError(false);
    setRoleMismatchError(null);

    if (!validateEmailFormat(cleanEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (!password) {
      toast.error('Please enter your password');
      return;
    }

    setLoading(true);
    try {
      const result = await login(cleanEmail, password, activeRole);

      if (result?.requires2FA) {
        setStep('2fa');
        toast('Two-step verification code sent to your email!', { icon: '🔐' });
      } else {
        handleSuccessfulAuth(result);
      }
    } catch (err) {
      const isMismatch = err.response?.data?.roleMismatch;
      const isUnregistered = err.response?.data?.notRegistered || err.response?.status === 404;
      const isUnverified = err.response?.data?.notVerified || err.response?.status === 403;

      if (isMismatch) {
        setRoleMismatchError(err.response?.data);
        toast.error(err.response?.data?.message || 'Role mismatch', { duration: 6000 });
      } else if (isUnregistered) {
        setNotRegisteredError(true);
        setEmailError('This email is not registered. You must register an account first.');
        toast.error('No account found! Please register an account first.', { duration: 5000 });
      } else if (isUnverified) {
        setNotVerifiedError(true);
        toast.error('Account not verified. Please complete email verification.', { duration: 5000 });
      } else {
        const msg = err.response?.data?.message || err.message || 'Login failed. Check your credentials.';
        toast.error(msg, { duration: 5000 });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessfulAuth = (user) => {
    if (from) {
      navigate(from, { replace: true });
    } else if (user.role === 'admin') {
      navigate('/admin');
    } else if (user.role === 'doctor') {
      navigate('/doctor');
    } else {
      navigate('/patient');
    }
  };

  const roleConfig = {
    patient: {
      tag: 'PATIENT PORTAL',
      tagColor: 'text-sky-700 bg-sky-50 border-sky-200 shadow-sm',
      iconBg: 'from-sky-400 via-blue-500 to-indigo-600 shadow-sky-500/40',
      icon: <UserRound className="w-7 h-7 text-white" strokeWidth={2.2} />,
      title: 'Patient Sign In',
      subtitle: 'Access your doctor consultations, digital prescriptions (Rx) & health visit history',
      placeholder: 'patient.name@gmail.com',
      buttonText: 'Sign In as Patient',
      btnBg: 'bg-gradient-to-r from-sky-500 via-blue-600 to-sky-600 hover:from-sky-400 hover:via-blue-500 hover:to-sky-500 text-white shadow-lg shadow-sky-500/25 border border-sky-400/30',
      cardBg: 'from-[#0e1d2c]/95 via-[#132233]/90 to-[#0a1522]/95 border-sky-500/30 shadow-2xl shadow-sky-950/60',
      glowOrb: 'bg-sky-500/25',
      accentGradient: 'from-sky-300 via-cyan-400 to-blue-500',
      leftGradient: 'bg-gradient-to-br from-blue-600 via-sky-600 to-indigo-950',
      inputCls: 'bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20',
      iconColor: 'text-sky-500',
      linkText: 'text-sky-600 hover:text-sky-700',
      registerText: "Don't have a patient account?",
      registerAction: 'Register as Patient',
      registerLink: '/register?role=patient',
    },
    doctor: {
      tag: 'DOCTOR & CLINIC CONSOLE',
      tagColor: 'text-cyan-800 bg-cyan-50 border-cyan-200 shadow-sm',
      iconBg: 'from-cyan-400 via-blue-500 to-indigo-600 shadow-cyan-500/40',
      icon: <Stethoscope className="w-7 h-7 text-white" strokeWidth={2.2} />,
      title: 'Doctor Portal Sign In',
      subtitle: 'Manage your patient queue, issue digital Rx prescriptions & customize clinic hours',
      placeholder: 'dr.sarah@hospital.com',
      buttonText: 'Sign In to Doctor Console',
      btnBg: 'bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:via-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-cyan-500/25 border border-cyan-400/30',
      cardBg: 'from-[#0f243b]/95 via-[#122133]/90 to-[#0a1522]/95 border-cyan-500/30 shadow-2xl shadow-cyan-950/60',
      glowOrb: 'bg-cyan-500/25',
      accentGradient: 'from-cyan-400 via-blue-400 to-indigo-400',
      leftGradient: 'bg-gradient-to-br from-cyan-700 via-blue-800 to-indigo-950',
      inputCls: 'bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20',
      iconColor: 'text-cyan-600',
      linkText: 'text-cyan-600 hover:text-cyan-700',
      registerText: 'New healthcare provider?',
      registerAction: 'Apply / Register as Doctor',
      registerLink: '/register?role=doctor',
    },
    admin: {
      tag: 'HOSPITAL ADMINISTRATION',
      tagColor: 'text-purple-800 bg-purple-50 border-purple-200 shadow-sm',
      iconBg: 'from-fuchsia-500 via-purple-600 to-indigo-600 shadow-purple-500/40',
      icon: <ShieldAlert className="w-7 h-7 text-white" strokeWidth={2.2} />,
      title: 'Hospital Admin Console',
      subtitle: 'System approvals, department configurations & clinic analytics overview',
      placeholder: 'admin@hospital.com',
      buttonText: 'Sign In to Admin Portal',
      btnBg: 'bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-600 hover:from-purple-500 hover:via-fuchsia-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-500/25 border border-purple-400/30',
      cardBg: 'from-[#29133b]/95 via-[#1e132c]/90 to-[#140b20]/95 border-purple-500/30 shadow-2xl shadow-purple-950/60',
      glowOrb: 'bg-purple-500/25',
      accentGradient: 'from-purple-400 via-fuchsia-400 to-indigo-400',
      leftGradient: 'bg-gradient-to-br from-purple-800 via-fuchsia-900 to-indigo-950',
      inputCls: 'bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20',
      iconColor: 'text-purple-600',
      linkText: 'text-purple-600 hover:text-purple-700',
      registerText: 'Standard user?',
      registerAction: 'Switch to Patient Sign In',
      registerLink: '/login?role=patient',
    },
  };

  const currentConfig = roleConfig[activeRole] || roleConfig.patient;

  if (user) {
    return (
      <div className="flex-1 min-h-[70vh] bg-gradient-to-br from-[#0a1b38] via-[#0e274d] to-[#071326] flex flex-col items-center justify-center gap-3 text-center px-4">
        <div className="text-center p-8 bg-white border border-slate-200 rounded-2xl shadow-xl max-w-sm">
          <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-800">Redirecting...</p>
          <p className="text-xs text-slate-500 mt-1">
            You are already signed in as <strong className="text-slate-800 font-semibold">{user.name}</strong>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-8 sm:py-12 relative overflow-hidden bg-gradient-to-br from-[#0a1b38] via-[#0e274d] to-[#071326]">
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full blur-[150px] opacity-35 pointer-events-none transition-all duration-700 ${currentConfig.glowOrb}`} />
      <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-cyan-500/20 blur-[120px] pointer-events-none" />
      <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-blue-500/25 blur-[120px] pointer-events-none" />

      {step === '2fa' ? (
        <TwoStepVerification
          email={email.trim()}
          onSuccess={handleSuccessfulAuth}
          onBack={() => setStep('credentials')}
          actionText={
            activeRole === 'doctor'
              ? 'Verify & Open Doctor Console'
              : activeRole === 'admin'
              ? 'Verify Admin Access'
              : 'Verify & Open Patient Portal'
          }
        />
      ) : (
        <div className="w-full max-w-5xl bg-white border border-slate-200/90 rounded-[2.5rem] shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 relative z-10">

          <div className={`hidden lg:flex lg:col-span-5 ${currentConfig.leftGradient} p-8 sm:p-10 flex-col justify-between relative overflow-hidden text-white transition-all duration-700`}>
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
                  Welcome to DocCare
                </h3>
                <p className="text-xs text-white/80 max-w-xs mx-auto leading-relaxed">
                  Your smart healthcare companion with verified doctors, live chamber queue & 100% free consultations.
                </p>
              </div>

              <div className="space-y-2 pt-2 text-left max-w-xs mx-auto">
                <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/15 text-xs font-semibold text-white">
                  <CheckCircle2 className="w-4 h-4 text-sky-300 shrink-0" />
                  <span>Verified Medical Specialists</span>
                </div>
                <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/15 text-xs font-semibold text-white">
                  <CheckCircle2 className="w-4 h-4 text-sky-300 shrink-0" />
                  <span>Instant 1-Click PDF Prescription</span>
                </div>
                <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/15 text-xs font-semibold text-white">
                  <CheckCircle2 className="w-4 h-4 text-sky-300 shrink-0" />
                  <span>Live Queue & Audio Chimes</span>
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
                  <Link
                    to={`/register?role=${activeRole}`}
                    className="text-base font-bold text-slate-400 hover:text-slate-700 transition-colors"
                  >
                    Sign Up
                  </Link>
                  <div className={`text-base font-bold relative pb-4 -mb-4 border-b-2 ${
                    activeRole === 'doctor'
                      ? 'border-cyan-500 text-cyan-700'
                      : activeRole === 'admin'
                      ? 'border-purple-600 text-purple-700'
                      : 'border-sky-500 text-sky-700'
                  }`}>
                    Sign In
                  </div>
                </div>

                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${currentConfig.tagColor}`}>
                  {currentConfig.tag}
                </span>
              </div>

              <div className="p-1.5 rounded-2xl bg-slate-100 border border-slate-200/80 grid grid-cols-3 gap-1.5 shadow-inner w-full">
                <button
                  type="button"
                  onClick={() => switchRole('patient')}
                  className={`w-full py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border ${
                    activeRole === 'patient'
                      ? 'bg-white text-sky-600 shadow-sm border-slate-200/80 font-extrabold'
                      : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  <UserRound className="w-3.5 h-3.5 shrink-0" />
                  <span>Patient</span>
                </button>

                <button
                  type="button"
                  onClick={() => switchRole('doctor')}
                  className={`w-full py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border ${
                    activeRole === 'doctor'
                      ? 'bg-white text-cyan-600 shadow-sm border-slate-200/80 font-extrabold'
                      : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  <Stethoscope className="w-3.5 h-3.5 shrink-0" />
                  <span>Doctor</span>
                </button>

                <button
                  type="button"
                  onClick={() => switchRole('admin')}
                  className={`w-full py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border ${
                    activeRole === 'admin'
                      ? 'bg-white text-purple-600 shadow-sm border-slate-200/80 font-extrabold'
                      : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-white/60'
                  }`}
                  title="Hospital Administrator Login"
                >
                  <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                  <span>Admin</span>
                </button>
              </div>

              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                  {currentConfig.title}
                </h2>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {currentConfig.subtitle}
                </p>
              </div>

              {notRegisteredError && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-2.5 animate-in fade-in shadow-sm">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-rose-900 text-sm">Account Not Found!</h4>
                      <p className="mt-0.5 text-rose-700">
                        No account is registered with <span className="font-semibold text-rose-900 underline">{email}</span>. You cannot sign in without creating an account first.
                      </p>
                    </div>
                  </div>
                  <Link
                    to={currentConfig.registerLink}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold text-xs transition-colors shadow-sm"
                  >
                    <span>Create an Account Now</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}

              {notVerifiedError && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs space-y-2.5 animate-in fade-in shadow-sm">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-amber-900 text-sm">Account Not Verified</h4>
                      <p className="mt-0.5 text-amber-700">
                        This account was created but email 2-step verification was not completed.
                      </p>
                    </div>
                  </div>
                  <Link
                    to={currentConfig.registerLink}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold text-xs transition-colors shadow-sm"
                  >
                    <span>Complete Verification</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}

              {roleMismatchError && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs space-y-2.5 animate-in fade-in shadow-sm">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-amber-900 text-sm">Account Type Mismatch</h4>
                      <p className="mt-0.5 text-amber-800">
                        {roleMismatchError.message}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => switchRole(roleMismatchError.actualRole || 'patient')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold text-xs transition-colors shadow-sm"
                  >
                    <span>Switch to {roleMismatchError.actualRole === 'doctor' ? 'Doctor' : roleMismatchError.actualRole === 'admin' ? 'Admin' : 'Patient'} Sign In</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {activeRole === 'doctor' && (
                <div className="p-3.5 rounded-2xl bg-cyan-50/70 border border-cyan-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-900 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
                      <span>Verified Doctor Accounts (Click to Select Email)</span>
                    </span>
                    <Link
                      to="/register?role=doctor"
                      className="text-[10px] text-cyan-700 hover:text-cyan-900 font-bold underline"
                    >
                      + Register as Doctor
                    </Link>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {[
                      { name: 'Dr. Azizul Kahhar', email: 'dr.azizul@hospital.com', dept: 'Psychiatry' },
                      { name: 'Dr. Moksed Ali', email: 'dr.moksed@hospital.com', dept: 'Surgery' },
                      { name: 'Dr. Farida Yeasmin', email: 'dr.farida@hospital.com', dept: 'Pediatrics' },
                      { name: 'Dr. Farhana Rahman', email: 'dr.farhana@hospital.com', dept: 'Dermatology' },
                    ].map((doc) => (
                      <button
                        key={doc.email}
                        type="button"
                        onClick={() => {
                          setEmail(doc.email);
                          setPassword('');
                          setEmailError('');
                          setRoleMismatchError(null);
                          toast.success(`Selected ${doc.name}. Enter your password to sign in.`);
                        }}
                        className="text-left p-2 rounded-xl bg-white border border-cyan-200/70 hover:border-cyan-500 hover:shadow-sm transition-all text-xs group"
                      >
                        <div className="font-bold text-slate-900 group-hover:text-cyan-700 truncate">{doc.name}</div>
                        <div className="text-[10px] text-slate-500 truncate">{doc.email} • {doc.dept}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeRole === 'admin' && (
                <div className="p-3 rounded-2xl bg-purple-50 border border-purple-200 text-xs flex items-center justify-between">
                  <div>
                    <p className="font-bold text-purple-900">Hospital Admin Credentials</p>
                    <p className="text-[11px] text-purple-700">admin@hospital.com • pass: admin123</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('admin@hospital.com');
                      setPassword('admin123');
                      setEmailError('');
                      setRoleMismatchError(null);
                      toast.success('Admin credentials set');
                    }}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold text-xs transition-colors"
                  >
                    Auto-Fill
                  </button>
                </div>
              )}

              <form onSubmit={handleCredentialsSubmit} className="space-y-4" noValidate>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className={`w-4 h-4 ${currentConfig.iconColor} absolute left-3.5 top-1/2 -translate-y-1/2`} />
                    <input
                      type="email"
                      required
                      placeholder={currentConfig.placeholder}
                      value={email}
                      onChange={handleEmailChange}
                      onBlur={() => validateEmailFormat(email)}
                      className={`w-full pl-10 pr-3.5 py-3 rounded-xl text-sm transition-all ${
                        emailError
                          ? 'bg-rose-50 border border-rose-300 text-slate-900 placeholder-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-200'
                          : currentConfig.inputCls
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
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className={`w-4 h-4 ${currentConfig.iconColor} absolute left-3.5 top-1/2 -translate-y-1/2`} />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`w-full pl-10 pr-3.5 py-3 rounded-xl text-sm transition-all ${currentConfig.inputCls}`}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-3.5 px-4 rounded-xl ${currentConfig.btnBg} text-sm font-bold transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-50 active:scale-[0.99]`}
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>{currentConfig.buttonText}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-500">
                {currentConfig.registerText}{' '}
                <Link
                  to={currentConfig.registerLink}
                  className={`font-bold ${currentConfig.linkText} transition-colors underline`}
                >
                  {currentConfig.registerAction}
                </Link>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
