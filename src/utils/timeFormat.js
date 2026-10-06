
export const timeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const str = String(timeStr).trim();
  const match12 = str.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (match12) {
    let hours = parseInt(match12[1], 10);
    const minutes = parseInt(match12[2], 10);
    const period = match12[3]?.toUpperCase();
    if (period === 'PM' && hours < 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  }
  const [h, m] = str.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

export const minutesTo12Hour = (minutes) => {
  const total = ((minutes % 1440) + 1440) % 1440;
  let hours = Math.floor(total / 60);
  const mins = total % 60;
  const period = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  if (hours === 0) hours = 12;
  const hStr = hours.toString().padStart(2, '0');
  const mStr = mins.toString().padStart(2, '0');
  return `${hStr}:${mStr} ${period}`;
};

export const formatSingleTime12h = (timeStr) => {
  if (!timeStr) return '';
  const str = String(timeStr).trim();
  if (/am|pm/i.test(str)) {
    const match = str.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (match) {
      const h = match[1].padStart(2, '0');
      const m = match[2];
      const p = match[3].toUpperCase();
      return `${h}:${m} ${p}`;
    }
    return str;
  }
  return minutesTo12Hour(timeToMinutes(str));
};

export const formatTime12h = (timeSlotStr) => {
  if (!timeSlotStr) return '';
  const str = String(timeSlotStr).trim();
  if (str.includes('–')) {
    const parts = str.split('–').map((s) => s.trim());
    return `${formatSingleTime12h(parts[0])} – ${formatSingleTime12h(parts[1])}`;
  }
  if (str.includes('-')) {
    const parts = str.split('-').map((s) => s.trim());
    return `${formatSingleTime12h(parts[0])} - ${formatSingleTime12h(parts[1])}`;
  }
  return formatSingleTime12h(str);
};

export const parseApptDateTime = (dateStr, timeSlotStr) => {
  try {
    if (!dateStr || !timeSlotStr) return { start: null, end: null };
    const parts = (timeSlotStr.includes('–') ? timeSlotStr.split('–') : timeSlotStr.split('-')).map((s) => s.trim());
    const startMins = timeToMinutes(parts[0]);
    const endMins = timeToMinutes(parts[1] || parts[0]);

    const [y, m, d] = dateStr.split('-').map(Number);
    const startH = Math.floor(startMins / 60);
    const startM = startMins % 60;
    const endH = Math.floor(endMins / 60);
    const endM = endMins % 60;

    const start = new Date(y, m - 1, d, startH, startM, 0);
    const end = new Date(y, m - 1, d, endH, endM, 0);
    return { start, end };
  } catch {
    return { start: null, end: null };
  }
};
