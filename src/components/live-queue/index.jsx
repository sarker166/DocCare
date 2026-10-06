import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { playHospitalChime, playMedicalBeep, initAudioContext } from '../../utils/audioAlert';
import { parseApptDateTime, formatTime12h } from '../../utils/timeFormat';
import QueueHeader from './QueueHeader';
import ActiveConsultationCard from './ActiveConsultationCard';
import NextPatientCard from './NextPatientCard';
import RemainingQueueList from './RemainingQueueList';

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

  const confirmedAppts = appointments
    .filter((a) => a.status === 'confirmed')
    .map((a) => {
      const { start, end } = parseApptDateTime(a.date, a.timeSlot);
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
      <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/[0.03] rounded-full blur-3xl pointer-events-none" />

      <QueueHeader
        currentTime={currentTime}
        soundEnabled={soundEnabled}
        toggleSound={toggleSound}
        handleTestSound={handleTestSound}
        queueFilter={queueFilter}
        setQueueFilter={setQueueFilter}
        totalUpcoming={confirmedAppts.length}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 relative z-10">
        <ActiveConsultationCard
          currentPatient={currentPatient}
          formatTime12h={formatTime12h}
          handleManualCall={handleManualCall}
          onWritePrescription={onWritePrescription}
          onCompleteAppointment={onCompleteAppointment}
        />

        <NextPatientCard
          nextPatient={nextPatient}
          currentPatient={currentPatient}
          formatTime12h={formatTime12h}
          getCountdownText={getCountdownText}
          handleManualCall={handleManualCall}
          onWritePrescription={onWritePrescription}
        />
      </div>

      <RemainingQueueList
        remainingQueue={remainingQueue}
        currentPatient={currentPatient}
        formatTime12h={formatTime12h}
        handleManualCall={handleManualCall}
      />
    </div>
  );
}
