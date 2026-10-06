import React from 'react';
import { Radio, Clock, Volume2, VolumeX, Bell } from 'lucide-react';

export default function QueueHeader({
  currentTime,
  soundEnabled,
  toggleSound,
  handleTestSound,
  queueFilter,
  setQueueFilter,
  totalUpcoming
}) {
  return (
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
            <strong className="text-white font-mono">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </strong>
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
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

        <button
          type="button"
          onClick={handleTestSound}
          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#111110] border border-white/[0.08] hover:border-teal-500/30 text-white hover:text-teal-400 transition-colors flex items-center gap-1.5"
          title="Test the clinic chime sound right now"
        >
          <Bell className="w-3.5 h-3.5 text-teal-400" />
          <span>Test Chime</span>
        </button>

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
            All Upcoming ({totalUpcoming})
          </button>
        </div>
      </div>
    </div>
  );
}
