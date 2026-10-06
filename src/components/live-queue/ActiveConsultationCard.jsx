import React from 'react';
import { Bell, Stethoscope, FileText, CheckCircle2 } from 'lucide-react';

export default function ActiveConsultationCard({
  currentPatient,
  formatTime12h,
  handleManualCall,
  onWritePrescription,
  onCompleteAppointment
}) {
  return (
    <div className="lg:col-span-6 bg-gradient-to-br from-[#141d1a] to-[#1a1a18] rounded-2xl border border-teal-500/30 p-5 space-y-4 relative overflow-hidden">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
            {currentPatient ? 'Now In Consultation' : 'Chamber Ready'}
          </span>
        </div>
        {currentPatient && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
            {formatTime12h(currentPatient.timeSlot)}
          </span>
        )}
      </div>

      {currentPatient ? (
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>{currentPatient.patientId?.name || 'Patient'}</span>
                <span className="text-xs font-normal text-[#888882] font-mono">
                  (Token #1)
                </span>
              </h3>
              <p className="text-xs text-[#888882] mt-0.5">
                Phone: <span className="text-white font-medium">{currentPatient.patientId?.phoneNumber || 'N/A'}</span> • {currentPatient.patientId?.email}
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleManualCall(currentPatient, 0)}
              className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
              title="Ring chime for this patient"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Ring Chime</span>
            </button>
          </div>

          <div className="p-3 bg-[#111110]/80 border border-white/[0.06] rounded-xl text-xs space-y-1">
            <p className="text-[#888882]">
              <strong className="text-white">Chief Complaint / Reason: </strong>
              {currentPatient.reason || 'Routine consultation'}
            </p>
            <p className="text-[#555552] text-[11px]">
              Scheduled: {currentPatient.date} ({formatTime12h(currentPatient.timeSlot)})
            </p>
          </div>

          <div className="pt-2 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onWritePrescription(currentPatient)}
              className="flex-1 py-2 px-3 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md shadow-teal-700/20"
            >
              <FileText className="w-4 h-4" />
              <span>Write Digital Prescription (Rx)</span>
            </button>
            <button
              type="button"
              onClick={() => onCompleteAppointment(currentPatient)}
              className="py-2 px-3 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Complete Visit</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="py-6 text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-white/[0.04] text-[#888882] mx-auto flex items-center justify-center">
            <Stethoscope className="w-6 h-6 text-teal-400" />
          </div>
          <p className="text-sm font-semibold text-white">Chamber is currently open</p>
          <p className="text-xs text-[#888882] max-w-xs mx-auto">
            No patient consultation is in progress at this exact moment. Review the next in line card.
          </p>
        </div>
      )}
    </div>
  );
}
