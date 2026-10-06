import React from 'react';
import { Clock, Bell, Sparkles, CheckCircle2 } from 'lucide-react';

export default function NextPatientCard({
  nextPatient,
  currentPatient,
  formatTime12h,
  getCountdownText,
  handleManualCall,
  onWritePrescription
}) {
  return (
    <div className="lg:col-span-6 bg-gradient-to-br from-[#1a1715] to-[#1a1a18] rounded-2xl border border-amber-500/20 p-5 space-y-4 relative overflow-hidden">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
            Next In Line
          </span>
        </div>
        {nextPatient?.startTimeDate && (
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-mono flex items-center gap-1">
            <span>⏳</span>
            <span>{getCountdownText(nextPatient.startTimeDate) || 'Upcoming'}</span>
          </span>
        )}
      </div>

      {nextPatient ? (
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>{nextPatient.patientId?.name || 'Patient'}</span>
                <span className="text-xs font-normal text-[#888882] font-mono">
                  (Token #{currentPatient ? 2 : 1})
                </span>
              </h3>
              <p className="text-xs text-[#888882] mt-0.5">
                Phone: <span className="text-white font-medium">{nextPatient.patientId?.phoneNumber || 'N/A'}</span>
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleManualCall(nextPatient, currentPatient ? 1 : 0)}
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-black rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95"
              title="Call this patient into chamber with chime alert"
            >
              <Bell className="w-4 h-4 fill-black" />
              <span>Call Next Patient</span>
            </button>
          </div>

          <div className="p-3 bg-[#111110]/80 border border-white/[0.06] rounded-xl text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-white font-semibold">{nextPatient.date}</span>
              <span className="text-teal-400 font-mono font-bold">{formatTime12h(nextPatient.timeSlot)}</span>
            </div>
            <p className="text-[#888882] text-[11px] pt-1">
              <strong className="text-white">Reason: </strong>{nextPatient.reason || 'General Health Issue'}
            </p>
          </div>

          <div className="pt-2 flex items-center justify-between text-xs text-[#888882]">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>System will play audio chime when slot arrives</span>
            </span>
            <button
              type="button"
              onClick={() => onWritePrescription(nextPatient)}
              className="text-xs text-teal-400 hover:text-teal-300 font-bold hover:underline"
            >
              Prepare Prescription &rarr;
            </button>
          </div>
        </div>
      ) : (
        <div className="py-6 text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-white/[0.04] text-[#888882] mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
          </div>
          <p className="text-sm font-semibold text-white">All upcoming patients attended</p>
          <p className="text-xs text-[#888882] max-w-xs mx-auto">
            No further confirmed patients remaining in queue for this selection.
          </p>
        </div>
      )}
    </div>
  );
}
