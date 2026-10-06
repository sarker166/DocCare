import React, { useState, useEffect } from 'react';
import { Calendar, Clock, AlertCircle, CheckCircle2, Coffee } from 'lucide-react';
import api from '../services/api';
import { formatTime12h, timeToMinutes } from '../utils/timeFormat';

export default function SlotPicker({ doctorId, onSelectSlot, selectedSlot, selectedDate, onDateChange }) {
  const [loading, setLoading] = useState(false);
  const [scheduleData, setScheduleData] = useState(null);
  const [error, setError] = useState('');

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

  useEffect(() => {
    if (!doctorId || !currentDate) return;
    setLoading(true);
    setError('');
    api.get(`/availability/slots/${doctorId}?date=${currentDate}`)
      .then((r) => setScheduleData(r.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to fetch slots.'))
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

  const slotCls = (isSelected, isDisabled) =>
    `py-2 px-3 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center gap-1.5 ${
      isSelected
        ? 'bg-teal-600 text-white border-teal-600 shadow-sm ring-2 ring-teal-600/20'
        : isDisabled
        ? 'bg-[#111110] text-[#3a3a38] border-white/[0.04] cursor-not-allowed line-through opacity-50'
        : 'bg-[#111110] text-[#888882] border-white/[0.08] hover:border-teal-500/40 hover:bg-teal-500/[0.07] hover:text-teal-300'
    }`;

  return (
    <div className="bg-[#1a1a18] rounded-2xl p-6 border border-white/[0.08] space-y-6">
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-bold text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-teal-400" />
            1. Select Appointment Date
          </label>
          <span className="text-xs text-[#555552]">Next 14 days</span>
        </div>

        <div className="flex gap-2.5 overflow-x-auto pb-2">
          {dates.map((d) => {
            const isSelected = d.dateStr === currentDate;
            return (
              <button key={d.dateStr} type="button" onClick={() => handleDateClick(d.dateStr)}
                className={`flex-shrink-0 flex flex-col items-center justify-center w-16 py-2.5 rounded-xl border transition-all text-xs ${
                  isSelected
                    ? 'bg-teal-600 text-white border-teal-600 shadow-md shadow-teal-600/20 scale-[1.03]'
                    : 'bg-[#111110] text-[#888882] border-white/[0.08] hover:border-teal-500/30 hover:text-white'
                }`}>
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
            <span className="w-3 h-3 rounded-md bg-[#1a1a18] border border-white/[0.04]" />
            <span className="text-[#555552]">Reserved</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-12 flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-[#555552]">Loading real-time schedule...</p>
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /><span>{error}</span>
        </div>
      ) : !scheduleData?.isAvailable || slots.length === 0 ? (
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
                <span className="text-[11px] text-[#555552]">{morningSlots.filter(s => s.isAvailable).length} available</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {morningSlots.map((slot) => {
                  const label12h = formatTime12h(slot.timeSlot);
                  const isSel = selectedSlot === slot.timeSlot || selectedSlot === label12h;
                  const isDis = !slot.isAvailable;
                  return (
                    <button key={slot.timeSlot} type="button" disabled={isDis}
                      onClick={() => onSelectSlot(label12h)} className={slotCls(isSel, isDis)}>
                      {isSel && <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />}
                      <span className="truncate">{label12h}</span>
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
                <span className="text-[11px] text-[#555552]">{afternoonSlots.filter(s => s.isAvailable).length} available</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {afternoonSlots.map((slot) => {
                  const label12h = formatTime12h(slot.timeSlot);
                  const isSel = selectedSlot === slot.timeSlot || selectedSlot === label12h;
                  const isDis = !slot.isAvailable;
                  return (
                    <button key={slot.timeSlot} type="button" disabled={isDis}
                      onClick={() => onSelectSlot(label12h)} className={slotCls(isSel, isDis)}>
                      {isSel && <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />}
                      <span className="truncate">{label12h}</span>
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
