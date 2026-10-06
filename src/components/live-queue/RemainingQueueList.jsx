import React from 'react';

export default function RemainingQueueList({
  remainingQueue,
  currentPatient,
  formatTime12h,
  handleManualCall
}) {
  if (!remainingQueue || remainingQueue.length === 0) return null;

  return (
    <div className="pt-3 border-t border-white/[0.08] space-y-2.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-bold text-[#888882] uppercase tracking-wider">
          Remaining Queue ({remainingQueue.length} Patients in Line)
        </span>
        <span className="text-[11px] text-[#555552]">Ordered by Appointment Time</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
        {remainingQueue.map((appt, idx) => {
          const tokenNum = (currentPatient ? 2 : 1) + 1 + idx;
          return (
            <div
              key={appt._id}
              className="bg-[#111110] border border-white/[0.06] hover:border-white/[0.12] rounded-xl p-3 text-xs space-y-1.5 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-teal-400 text-[11px] bg-teal-500/10 px-1.5 py-0.5 rounded">
                  Token #{tokenNum}
                </span>
                <span className="text-[10px] text-[#888882] font-mono">{formatTime12h(appt.timeSlot)}</span>
              </div>
              <h4 className="font-bold text-white truncate">{appt.patientId?.name || 'Patient'}</h4>
              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-[#555552] truncate max-w-[110px]">{appt.reason}</span>
                <button
                  type="button"
                  onClick={() => handleManualCall(appt, tokenNum - 1)}
                  className="text-[10px] text-amber-400 hover:text-amber-300 font-bold px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20"
                  title="Ring chime"
                >
                  Call
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
