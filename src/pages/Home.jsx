import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Stethoscope, UserRound, ChevronRight, CalendarCheck } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#111110] flex flex-col items-center justify-center px-6">
      <div className="mb-6 flex flex-col items-center">
        <div
          className="w-24 h-24 rounded-[28px] flex items-center justify-center shadow-2xl"
          style={{ background: 'linear-gradient(145deg, #2dd4bf, #0d9488)' }}
        >
          <Stethoscope className="w-12 h-12 text-white drop-shadow-md" strokeWidth={1.8} />
        </div>
      </div>

      <h1 className="text-white text-3xl font-bold tracking-tight mt-1">DocCare</h1>
      <p className="text-[#888882] text-sm text-center max-w-xs mt-2 leading-relaxed">
        Real-time doctor availability &amp; instant appointment scheduling, right at your fingertips.
      </p>

      <div className="mt-14 w-full max-w-sm space-y-3">
        <button
          onClick={() => navigate('/login?role=patient')}
          className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all active:scale-[0.98]"
          style={{ background: 'rgba(45,212,191,0.15)', border: '1px solid rgba(45,212,191,0.25)' }}
        >
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: '#0d9488' }}
          >
            <UserRound className="w-5 h-5 text-white" strokeWidth={2} />
          </div>
          <div className="flex-1 text-left">
            <p className="text-white text-sm font-semibold leading-tight">Continue as Patient</p>
            <p className="text-[#6b7280] text-xs mt-0.5">Book appointments &amp; track your visits</p>
          </div>
          <ChevronRight className="w-5 h-5 text-[#4b5563] shrink-0" />
        </button>

        <button
          onClick={() => navigate('/login?role=doctor')}
          className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all active:scale-[0.98]"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: '#374151' }}
          >
            <CalendarCheck className="w-5 h-5 text-teal-400" strokeWidth={2} />
          </div>
          <div className="flex-1 text-left">
            <p className="text-white text-sm font-semibold leading-tight">Continue as Doctor</p>
            <p className="text-[#6b7280] text-xs mt-0.5">Manage schedule &amp; view appointments</p>
          </div>
          <ChevronRight className="w-5 h-5 text-[#4b5563] shrink-0" />
        </button>
      </div>

      <p className="mt-10 text-[#3d3d3a] text-xs text-center">
        Admin access via the login page
      </p>
    </div>
  );
}
