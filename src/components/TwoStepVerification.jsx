import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, ArrowRight, ArrowLeft, RefreshCw, KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';

export default function TwoStepVerification({
  email,
  onSuccess,
  onBack,
  actionText = 'Verify & Sign In',
}) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [timer, setTimer] = useState(30);
  const { verify2FA, resend2FA } = useAuth();
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    const cleanCode = code.trim();

    if (!cleanCode) {
      toast.error('Please enter the 6-digit verification code');
      return;
    }

    if (!/^\d{6}$/.test(cleanCode)) {
      toast.error('The verification code must be exactly 6 digits');
      return;
    }

    setLoading(true);
    try {
      const user = await verify2FA(email, cleanCode);
      toast.success(user.role === 'doctor' ? 'Welcome Dr. ' + (user.name || '') : 'Welcome back, ' + (user.name || '') + '!');
      if (onSuccess) onSuccess(user);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Invalid or expired verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0 || resending) return;
    setResending(true);
    try {
      await resend2FA(email);
      toast.success('A new 6-digit verification code has been sent to your email!');
      setTimer(30);
      setCode('');
      inputRef.current?.focus();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend code');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-6 animate-in fade-in zoom-in-95 duration-200">
      <div className="text-center space-y-2">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 text-white mx-auto flex items-center justify-center shadow-lg shadow-sky-500/25">
          <KeyRound className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Two-Step Verification</h2>
        <p className="text-xs text-slate-500 max-w-xs mx-auto">
          We have sent a secure 6-digit code to{' '}
          <strong className="text-sky-600 font-semibold">{email}</strong>.
          Please check your Gmail inbox.
        </p>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-slate-200/90 shadow-2xl relative overflow-hidden space-y-5">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider text-center mb-2.5">
              Enter 6-Digit Code
            </label>
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                required
                placeholder="••••••"
                value={code}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setCode(val);
                }}
                className="w-full py-3.5 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-center text-2xl font-mono font-extrabold text-slate-900 tracking-[0.5em] placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || code.trim().length !== 6}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-sky-500 via-blue-600 to-sky-600 hover:from-sky-400 hover:via-blue-500 hover:to-sky-500 text-white text-sm font-bold shadow-lg shadow-sky-500/25 border border-sky-400/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>{actionText}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Use different email</span>
          </button>

          <button
            type="button"
            onClick={handleResend}
            disabled={timer > 0 || resending}
            className={`inline-flex items-center gap-1.5 font-semibold transition-colors ${
              timer > 0 || resending
                ? 'text-slate-400 cursor-not-allowed'
                : 'text-sky-600 hover:text-sky-700'
            }`}
          >
            <RefreshCw className={`w-3 h-3 ${resending ? 'animate-spin' : ''}`} />
            <span>{timer > 0 ? `Resend in ${timer}s` : 'Resend Code'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
