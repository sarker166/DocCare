import React, { useState, useEffect, useRef } from 'react';
import {
  Volume2, VolumeX, Bell, Clock, User, CheckCircle2,
  FileText, Play, Sparkles, ChevronRight, AlertCircle,
  Radio, Calendar, Stethoscope
} from 'lucide-react';
import toast from 'react-hot-toast';
import { playHospitalChime, playMedicalBeep, initAudioContext } from '../utils/audioAlert';
import { parseApptDateTime, formatTime12h } from '../utils/timeFormat';

export default function DoctorLiveQueue({
  appointments = [],
  onWritePrescription,
  onCompleteAppointment,
}) {
  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem('doc_sound_enabled') !== 'false';
  });
  const [soundVolume, setSoundVolume] = useState(0.8);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [queueFilter, setQueueFilter] = useState('all'); 
  const [lastCalledId, setLastCalledId] = useState(null);

 
  const alertedIdsRef = useRef(new Set());


  const toggleSound = () => {
    initAudioContext();
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem('doc_sound_enabled', String(next));
    if (next) {
      playMedicalBeep(soundVolume);
      toast.success('Sound alerts enabled');
    } else {
      toast('Sound alerts muted', { icon: '🔕' });
    }
  };

  const handleTestSound = () => {
    initAudioContext();
    playHospitalChime(soundVolume);
    toast.success('Playing hospital chime test...');
  };

  
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);


  const todayStr = new Date(
    currentTime.getTime() - currentTime.getTimezoneOffset() * 60000
  ).toISOString().split('T')[0];


  const parseApptTime = (dateStr, timeSlotStr) => {
    return parseApptDateTime(dateStr, timeSlotStr);
  };

  const confirmedAppts = appointments
    .filter((a) => a.status === 'confirmed')
    .map((a) => {
      const { start, end } = parseApptTime(a.date, a.timeSlot);
      return { ...a, startTimeDate: start, endTimeDate: end };
    })
    .sort((a, b) => {
      if (!a.startTimeDate) return 1;
      if (!b.startTimeDate) return -1;
      return a.startTimeDate.getTime() - b.startTimeDate.getTime();
    });

  
  const activeList = queueFilter === 'today'
    ? confirmedAppts.filter((a) => a.date === todayStr)
    : confirmedAppts;

  let currentPatient = null;
  let nextPatient = null;
  const remainingQueue = [];

  const nowMs = currentTime.getTime();

  for (const appt of activeList) {
    if (appt.startTimeDate && appt.endTimeDate) {
      const startMs = appt.startTimeDate.getTime();
      const endMs = appt.endTimeDate.getTime();

      
      if (nowMs >= startMs && nowMs <= endMs) {
        if (!currentPatient) {
          currentPatient = appt;
          continue;
        }
      }

     
      if (startMs > nowMs) {
        if (!nextPatient) {
          nextPatient = appt;
        } else {
          remainingQueue.push(appt);
        }
        continue;
      }
    }
    
    if (!currentPatient && !nextPatient) {
      nextPatient = appt;
    } else {
      remainingQueue.push(appt);
    }
  }

  
  useEffect(() => {
    if (!soundEnabled) return;

    activeList.forEach((appt) => {
      if (appt.startTimeDate) {
        const diffMs = appt.startTimeDate.getTime() - currentTime.getTime();
        // Trigger within 5 seconds window of start time (or up to 15s after if just refreshed)
        if (diffMs <= 5000 && diffMs >= -15000 && !alertedIdsRef.current.has(appt._id)) {
          alertedIdsRef.current.add(appt._id);
          playHospitalChime(soundVolume);
          toast(
            (t) => (
              <div className="flex items-center gap-3">
                <span className="text-xl">🔔</span>
                <div>
                  <p className="font-bold text-sm text-white">Patient Appointment Started!</p>
                  <p className="text-xs text-[#888882]">
                    Time for <strong className="text-teal-400">{appt.patientId?.name || 'Patient'}</strong> ({formatTime12h(appt.timeSlot)})
                  </p>
                </div>
              </div>
            ),
            { duration: 8000 }
          );
        }
      }
    });
  }, [currentTime, soundEnabled, activeList, soundVolume]);

  // Format countdown string for next patient
  const getCountdownText = (targetDate) => {
    if (!targetDate) return null;
    const diffSec = Math.floor((targetDate.getTime() - currentTime.getTime()) / 1000);
    if (diffSec <= 0) return 'Active Now';
    const hours = Math.floor(diffSec / 3600);
    const mins = Math.floor((diffSec % 3600) / 60);
    const secs = diffSec % 60;

    if (hours > 0) {
      return `${hours}h ${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
    }
    return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  };

  const handleManualCall = (appt, tokenIndex) => {
    initAudioContext();
    playHospitalChime(soundVolume);
    setLastCalledId(appt._id);
    toast.success(
      `Calling Token #${tokenIndex + 1}: ${appt.patientId?.name || 'Patient'} for consultation!`,
      { icon: '📢', duration: 5000 }
    );
  };

  return (
    <div className="bg-[#1a1a18] rounded-3xl border border-white/[0.08] p-6 space-y-6 shadow-xl relative overflow-hidden">
      {/* Background ambient medical accent */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/[0.03] rounded-full blur-3xl pointer-events-none" />

      {/* Header & Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-white/[0.08] relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center relative">
            <Radio className="w-5 h-5 animate-pulse text-teal-400" />
            <span className="w-2 h-2 rounded-full bg-teal-400 absolute top-2 right-2 animate-ping" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-base text-white">Live Patient Queue Monitor</h2>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20">
                Real-Time
              </span>
            </div>
            <p className="text-xs text-[#888882] flex items-center gap-1.5 mt-0.5">
              <Clock className="w-3.5 h-3.5 text-teal-400" />
              <span>Current Clinic Time: </span>
              <strong className="text-white font-mono">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</strong>
            </p>
          </div>
        </div>

        {/* Audio & Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Sound Alert Toggle */}
          <button
            type="button"
            onClick={toggleSound}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
              soundEnabled
                ? 'bg-teal-500/10 border-teal-500/30 text-teal-400 shadow-sm shadow-teal-500/10'
                : 'bg-[#111110] border-white/[0.08] text-[#888882] hover:text-white'
            }`}
            title="Toggle automatic audio chime when patient's slot starts"
          >
            {soundEnabled ? (
              <>
                <Volume2 className="w-4 h-4 text-teal-400" />
                <span>Audio Alert: ON</span>
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4 text-[#888882]" />
                <span>Audio Alert: MUTED</span>
              </>
            )}
          </button>

          {/* Test Chime Button */}
          <button
            type="button"
            onClick={handleTestSound}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#111110] border border-white/[0.08] hover:border-teal-500/30 text-white hover:text-teal-400 transition-colors flex items-center gap-1.5"
            title="Test the clinic chime sound right now"
          >
            <Bell className="w-3.5 h-3.5 text-teal-400" />
            <span>Test Chime</span>
          </button>

          {/* Queue Filter */}
          <div className="bg-[#111110] border border-white/[0.08] rounded-xl p-0.5 flex items-center text-xs font-bold">
            <button
              type="button"
              onClick={() => setQueueFilter('today')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                queueFilter === 'today' ? 'bg-white/[0.08] text-white' : 'text-[#888882] hover:text-white'
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setQueueFilter('all')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                queueFilter === 'all' ? 'bg-white/[0.08] text-white' : 'text-[#888882] hover:text-white'
              }`}
            >
              All Upcoming ({confirmedAppts.length})
            </button>
          </div>
        </div>
      </div>

      {/* Main Queue Showcase Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 relative z-10">
        {/* Current Active Patient / Now In Consultation */}
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

              {/* Direct Doctor Actions */}
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

        {/* Next Patient in Line & Live Countdown */}
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

                {/* Call Next Patient Button */}
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
      </div>

      {/* Remaining Queue Strip (Tokens) */}
      {remainingQueue.length > 0 && (
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
      )}
    </div>
  );
}
