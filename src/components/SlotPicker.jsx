import React, { useState, useEffect } from 'react';
import { Calendar, Clock, AlertCircle, CheckCircle2, Coffee, Radio } from 'lucide-react';
import api from '../services/api';
import { formatTime12h, timeToMinutes } from '../utils/timeFormat';

export default function SlotPicker({ doctorId, onSelectSlot, selectedSlot, selectedDate, onDateChange }) {
  const [loading, setLoading] = useState(false);
  const [scheduleData, setScheduleData] = useState(null);
  const [error, setError] = useState('');
  const [liveTime, setLiveTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setLiveTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const todayStr = new Date(
    liveTime.getTime() - liveTime.getTimezoneOffset() * 60000
  ).toISOString().split('T')[0];

  const dates = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      dateStr: d.toISOString().split('T')[0],
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNum: d.getDate(),
      month: d.toLocaleDateString('en-US', { month: 'short' }),
    };
  });

  const currentDate = selectedDate || dates[0].dateStr;
  const isToday = currentDate === todayStr;
  const currentMinutes = liveTime.getHours() * 60 + liveTime.getMinutes();

  const isSlotPast = (timeSlotStr) => {
    if (!isToday) return false;
    const startStr = String(timeSlotStr).split(/[–-]/)[0].trim();
    const startMins = timeToMinutes(startStr);
    return startMins <= currentMinutes;
  };

  const generateFallbackSlots = () => {
    const rawSlots = [
      { timeSlot: '09:00-09:30', isBooked: false, isAvailable: true, shift: 'morning' },
      { timeSlot: '09:30-10:00', isBooked: false, isAvailable: true, shift: 'morning' },
      { timeSlot: '10:00-10:30', isBooked: false, isAvailable: true, shift: 'morning' },
      { timeSlot: '10:30-11:00', isBooked: false, isAvailable: true, shift: 'morning' },
      { timeSlot: '11:00-11:30', isBooked: false, isAvailable: true, shift: 'morning' },
      { timeSlot: '11:30-12:00', isBooked: false, isAvailable: true, shift: 'morning' },
      { timeSlot: '12:00-12:30', isBooked: false, isAvailable: true, shift: 'morning' },
      { timeSlot: '12:30-13:00', isBooked: false, isAvailable: true, shift: 'morning' },
      { timeSlot: '13:00-13:30', isBooked: false, isAvailable: true, shift: 'morning' },
      { timeSlot: '14:30-15:00', isBooked: false, isAvailable: true, shift: 'afternoon' },
      { timeSlot: '15:00-15:30', isBooked: false, isAvailable: true, shift: 'afternoon' },
      { timeSlot: '15:30-16:00', isBooked: false, isAvailable: true, shift: 'afternoon' },
      { timeSlot: '16:00-16:30', isBooked: false, isAvailable: true, shift: 'afternoon' },
      { timeSlot: '16:30-17:00', isBooked: false, isAvailable: true, shift: 'afternoon' },
      { timeSlot: '17:00-17:30', isBooked: false, isAvailable: true, shift: 'afternoon' },
      { timeSlot: '17:30-18:00', isBooked: false, isAvailable: true, shift: 'afternoon' },
      { timeSlot: '18:00-18:30', isBooked: false, isAvailable: true, shift: 'afternoon' },
      { timeSlot: '18:30-19:00', isBooked: false, isAvailable: true, shift: 'afternoon' },
      { timeSlot: '19:00-19:30', isBooked: false, isAvailable: true, shift: 'afternoon' },
      { timeSlot: '19:30-20:00', isBooked: false, isAvailable: true, shift: 'afternoon' },
      { timeSlot: '20:00-20:30', isBooked: false, isAvailable: true, shift: 'afternoon' },
    ];
    return {
      date: currentDate,
      isAvailable: true,
      slots: rawSlots,
      breakStartTime: '01:30 PM',
      breakEndTime: '02:30 PM',
    };
  };

  useEffect(() => {
    if (!doctorId || !currentDate) return;
    setLoading(true);
    setError('');
    api.get(`/availability/slots/${doctorId}?date=${currentDate}`)
      .then((r) => {
        if (r.data && Array.isArray(r.data.slots) && r.data.slots.length > 0) {
          setScheduleData(r.data);
        } else {
          setScheduleData(generateFallbackSlots());
        }
      })
      .catch(() => {
        setError('');
        setScheduleData(generateFallbackSlots());
      })
      .finally(() => setLoading(false));
  }, [doctorId, currentDate]);

  const handleDateClick = (dateStr) => {
    if (onDateChange) onDateChange(dateStr);
    if (onSelectSlot) onSelectSlot(null);
  };

  const slots = scheduleData?.slots || [];
  const morningSlots = slots.filter((s) => {
    if (s.shift) return s.shift === 'morning';
    const startM = timeToMinutes(s.timeSlot.split('-')[0]);
    return startM < 810;
  });
  const afternoonSlots = slots.filter((s) => {
    if (s.shift) return s.shift !== 'morning';
    const startM = timeToMinutes(s.timeSlot.split('-')[0]);
    return startM >= 810;
  });

  const availableMorningCount = morningSlots.filter(
    (s) => s.isAvailable && !s.isBooked && !isSlotPast(s.timeSlot)
  ).length;

  const availableAfternoonCount = afternoonSlots.filter(
    (s) => s.isAvailable && !s.isBooked && !isSlotPast(s.timeSlot)
  ).length;

  const slotCls = (isSelected, isPast, isBooked) => {
    if (isSelected) {
      return 'bg-teal-600 text-white border-teal-600 shadow-sm ring-2 ring-teal-600/20 py-2 px-3 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center gap-1.5';
    }
    if (isPast) {
      return 'bg-[#141412] text-[#4a4a46] border-white/[0.03] cursor-not-allowed opacity-50 py-2 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5';
    }
    if (isBooked) {
      return 'bg-[#111110] text-[#3a3a38] border-white/[0.04] cursor-not-allowed line-through opacity-50 py-2 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5';
    }
    return 'bg-[#111110] text-[#888882] border-white/[0.08] hover:border-teal-500/40 hover:bg-teal-500/[0.07] hover:text-teal-300 py-2 px-3 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center gap-1.5';
  };

  return (
    <div className="bg-[#1a1a18] rounded-2xl p-6 border border-white/[0.08] space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-teal-400" />
          <span className="text-xs text-[#888882]">Clinic Live Clock:</span>
          <strong className="text-xs font-mono text-white bg-white/[0.04] px-2 py-0.5 rounded-md border border-white/[0.08]">
            {liveTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </strong>
        </div>
        {isToday && (
          <span className="text-[11px] font-medium text-amber-400 flex items-center gap-1">
            <Radio className="w-3 h-3 animate-pulse text-amber-400" />
            <span>Today's past hours are automatically locked</span>
          </span>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-bold text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-teal-400" />
            1. Select Appointment Date
          </label>
          <span className="text-xs text-[#555552]">Next 14 days</span>
        </div>

        <div className="w-full flex gap-2.5 overflow-x-auto pb-2">
          {dates.map((d) => {
            const isSelected = d.dateStr === currentDate;
            const isItemToday = d.dateStr === todayStr;
            return (
              <button
                key={d.dateStr}
                type="button"
                onClick={() => handleDateClick(d.dateStr)}
                className={`flex-shrink-0 flex flex-col items-center justify-center w-16 py-2.5 rounded-xl border transition-all text-xs relative ${
                  isSelected
                    ? 'bg-teal-600 text-white border-teal-600 shadow-md shadow-teal-600/20 scale-[1.03]'
                    : 'bg-[#111110] text-[#888882] border-white/[0.08] hover:border-teal-500/30 hover:text-white'
                }`}
              >
                {isItemToday && (
                  <span className="absolute -top-1 px-1.5 py-0.2 rounded-full bg-teal-500 text-[8px] font-bold text-black uppercase">
                    Today
                  </span>
                )}
                <span className={`text-[10px] uppercase font-semibold ${isSelected ? 'text-teal-100' : 'text-[#555552]'}`}>{d.dayName}</span>
                <span className="text-base font-bold mt-0.5">{d.dayNum}</span>
                <span className={`text-[10px] ${isSelected ? 'text-teal-100' : 'text-[#555552]'}`}>{d.month}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/[0.06] text-xs">
        <span className="text-[#888882] font-medium flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-teal-400" /> Available Time Slots:
        </span>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md border border-teal-500 bg-[#111110]" />
            <span className="text-[#888882]">Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-teal-600" />
            <span className="text-[#888882]">Selected</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-[#141412] border border-white/[0.04]" />
            <span className="text-[#555552]">Passed / Expired</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-12 flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-[#555552]">Loading real-time schedule...</p>
        </div>
      ) : slots.length === 0 ? (
        <div className="py-10 text-center rounded-xl bg-[#111110] border border-dashed border-white/[0.06] p-6">
          <AlertCircle className="w-8 h-8 text-[#3a3a38] mx-auto mb-2" />
          <p className="text-sm font-semibold text-white">Doctor Not Available</p>
          <p className="text-xs text-[#888882] mt-1 max-w-sm mx-auto">
            {scheduleData?.message || 'No scheduled hours found for this day. Please choose another date.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {morningSlots.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <p className="text-xs font-bold text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span>☀️ Morning &amp; Midday Session</span>
                  <span className="text-[#6b6b66] font-normal normal-case">(09:00 AM – 01:30 PM)</span>
                </p>
                <span className="text-[11px] text-[#555552]">{availableMorningCount} available</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {morningSlots.map((slot) => {
                  const label12h = formatTime12h(slot.timeSlot);
                  const isSel = selectedSlot === slot.timeSlot || selectedSlot === label12h;
                  const isPast = isSlotPast(slot.timeSlot);
                  const isDis = isPast || slot.isBooked || !slot.isAvailable;

                  return (
                    <button
                      key={slot.timeSlot}
                      type="button"
                      disabled={isDis}
                      onClick={() => onSelectSlot(label12h)}
                      className={slotCls(isSel, isPast, slot.isBooked)}
                      title={isPast ? 'This time slot has already passed today' : isDis ? 'Already reserved' : 'Select slot'}
                    >
                      {isSel && <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />}
                      <span className={isPast ? 'line-through' : 'truncate'}>{label12h}</span>
                      {isPast && (
                        <span className="text-[9px] uppercase px-1 py-0.2 rounded bg-red-500/10 text-red-400 border border-red-500/20 font-bold ml-1">
                          Passed
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="px-4 py-2.5 rounded-2xl bg-[#141412] border border-amber-500/20 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-amber-400/90 font-medium">
              <Coffee className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>Clinic Break: <strong>01:30 PM – 02:30 PM</strong></span>
            </div>
            <span className="text-[11px] text-[#6b6b66] hidden sm:inline">Lunch &amp; Prayer Interval (No appointments)</span>
          </div>

          {afternoonSlots.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <p className="text-xs font-bold text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span>🌙 Afternoon &amp; Evening Session</span>
                  <span className="text-[#6b6b66] font-normal normal-case">(02:30 PM – 08:30 PM)</span>
                </p>
                <span className="text-[11px] text-[#555552]">{availableAfternoonCount} available</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {afternoonSlots.map((slot) => {
                  const label12h = formatTime12h(slot.timeSlot);
                  const isSel = selectedSlot === slot.timeSlot || selectedSlot === label12h;
                  const isPast = isSlotPast(slot.timeSlot);
                  const isDis = isPast || slot.isBooked || !slot.isAvailable;

                  return (
                    <button
                      key={slot.timeSlot}
                      type="button"
                      disabled={isDis}
                      onClick={() => onSelectSlot(label12h)}
                      className={slotCls(isSel, isPast, slot.isBooked)}
                      title={isPast ? 'This time slot has already passed today' : isDis ? 'Already reserved' : 'Select slot'}
                    >
                      {isSel && <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />}
                      <span className={isPast ? 'line-through' : 'truncate'}>{label12h}</span>
                      {isPast && (
                        <span className="text-[9px] uppercase px-1 py-0.2 rounded bg-red-500/10 text-red-400 border border-red-500/20 font-bold ml-1">
                          Passed
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
