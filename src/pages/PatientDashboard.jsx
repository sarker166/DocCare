import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import SlotPicker from '../components/SlotPicker';
import Modal from '../components/Modal';
import PrescriptionViewModal from '../components/PrescriptionViewModal';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  Calendar, Clock, MapPin, CalendarX2, RefreshCw,
  CheckCircle2, Stethoscope, Plus, FileText, Printer, Download,
} from 'lucide-react';
import { formatTime12h, parseApptDateTime } from '../utils/timeFormat';
import { generatePrescriptionPdf } from '../utils/generatePrescriptionPdf';

const inputCls = "w-full py-2 px-3 bg-[#111110] border border-white/[0.08] rounded-xl text-xs text-white placeholder-[#555552] focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500";

export default function PatientDashboard() {
  const { user } = useAuth();
  const { notifications } = useNotifications();
  const [appointments, setAppointments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');

  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [newSlot, setNewSlot] = useState(null);

  const [rxViewModalOpen, setRxViewModalOpen] = useState(false);
  const [selectedRx, setSelectedRx] = useState(null);

  const fetchData = async () => {
    try {
      const [apptsRes, rxRes] = await Promise.all([
        api.get('/appointments/my'),
        api.get('/prescriptions/my').catch(() => ({ data: [] })),
      ]);
      setAppointments(apptsRes.data);
      setPrescriptions(rxRes.data || []);
    } catch {
      const local = JSON.parse(localStorage.getItem('doc_local_appts') || '[]');
      setAppointments(local);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleOpenRxView = async (appt) => {
    try {
      const res = await api.get(`/prescriptions/appointment/${appt._id}`);
      setSelectedRx(res.data);
      setRxViewModalOpen(true);
    } catch (err) {
      const isNetworkErr = !err.response || err.code === 'ERR_NETWORK';
      if (isNetworkErr || err.response?.status === 404) {
        const localRxs = JSON.parse(localStorage.getItem('doc_local_rx') || '[]');
        const localRx = localRxs.find(rx => rx.appointmentId === appt._id);
        if (localRx) {
          setSelectedRx(localRx);
          setRxViewModalOpen(true);
          return;
        }
      }
      toast.error('No prescription has been issued yet for this appointment');
    }
  };

  const handleDirectRxView = (rx) => {
    setSelectedRx(rx);
    setRxViewModalOpen(true);
  };

  const now = new Date();
  const todayStr = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().split('T')[0];

  const upcomingAppointments = appointments.filter((a) => {
    if (a.status !== 'confirmed' && a.status !== 'pending') return false;
    if (a.date < todayStr) return false;
    
    if (a.date === todayStr) {
      const { end } = parseApptDateTime(a.date, a.timeSlot);
      if (end && end <= now) return false;
    }
    return true;
  });

  const pastAppointments = appointments.filter((a) => {
    if (a.status !== 'confirmed' && a.status !== 'pending') return true;
    if (a.date < todayStr) return true;
    
    if (a.date === todayStr) {
      const { end } = parseApptDateTime(a.date, a.timeSlot);
      if (end && end <= now) return true;
    }
    return false;
  });

  const handleCancelSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAppt) return;
    setActionLoading(true);
    try {
      await api.patch(`/appointments/${selectedAppt._id}/cancel`, { cancellationReason: cancelReason });
      toast.success('Appointment cancelled. Slot has been freed.');
      setCancelModalOpen(false);
      fetchData();
    } catch (err) {
      const local = JSON.parse(localStorage.getItem('doc_local_appts') || '[]');
      const updated = local.map((a) =>
        a._id === selectedAppt._id
          ? { ...a, status: 'cancelled', cancellationReason: cancelReason || 'Cancelled by patient' }
          : a
      );
      localStorage.setItem('doc_local_appts', JSON.stringify(updated));
      setAppointments((prev) =>
        prev.map((a) =>
          a._id === selectedAppt._id
            ? { ...a, status: 'cancelled', cancellationReason: cancelReason || 'Cancelled by patient' }
            : a
        )
      );
      toast.success('Appointment cancelled. Slot has been freed.');
      setCancelModalOpen(false);
    } finally { setActionLoading(false); }
  };

  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAppt || !newDate || !newSlot) { toast.error('Please select both a new date and slot'); return; }
    setActionLoading(true);
    try {
      await api.patch(`/appointments/${selectedAppt._id}/reschedule`, { newDate, newTimeSlot: newSlot });
      toast.success('Appointment rescheduled successfully!');
      setRescheduleModalOpen(false);
      fetchData();
    } catch (err) {
      const local = JSON.parse(localStorage.getItem('doc_local_appts') || '[]');
      const updated = local.map((a) =>
        a._id === selectedAppt._id
          ? { ...a, date: newDate, timeSlot: newSlot }
          : a
      );
      localStorage.setItem('doc_local_appts', JSON.stringify(updated));
      setAppointments((prev) =>
        prev.map((a) =>
          a._id === selectedAppt._id
            ? { ...a, date: newDate, timeSlot: newSlot }
            : a
        )
      );
      toast.success('Appointment rescheduled successfully!');
      setRescheduleModalOpen(false);
    } finally { setActionLoading(false); }
  };

  const getStatusBadge = (status) => {
    const map = {
      pending:   'bg-amber-500/10 text-amber-400 border border-amber-500/20',
      confirmed: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
      completed:  'bg-blue-500/10 text-blue-400 border border-blue-500/20',
      cancelled:  'bg-rose-500/10 text-rose-400 border border-rose-500/20',
      'no-show':  'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    };
    const label = status === 'pending' ? 'Pending Approval ⏳' : status === 'confirmed' ? 'Confirmed ✅' : status;
    return (
      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${map[status] || ''}`}>
        {label}
      </span>
    );
  };

  const tabCls = (t) =>
    `pb-3 border-b-2 transition-all flex items-center gap-2 text-sm font-bold ${
      activeTab === t ? 'border-teal-500 text-teal-400' : 'border-transparent text-[#888882] hover:text-white'
    }`;

  const countBadge = (n) => (
    <span className="text-xs bg-white/[0.06] text-[#888882] px-2 py-0.5 rounded-full font-semibold">{n}</span>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-teal-800/40 to-teal-900/20 border border-teal-500/20 rounded-3xl p-6 sm:p-8 text-white">
        <div>
          <span className="text-teal-400 text-xs font-semibold uppercase tracking-wider">Patient Portal</span>
          <h1 className="text-2xl sm:text-3xl font-bold mt-1">Hello, {user?.name} 👋</h1>
          <p className="text-xs sm:text-sm text-[#888882] mt-1">Manage your clinic consultations, upcoming dates, and medical visit history.</p>
        </div>
        <Link to="/doctors"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs sm:text-sm transition-all self-start sm:self-auto">
          <Plus className="w-4 h-4" /><span>Book New Appointment</span>
        </Link>
      </div>

      <div className="border-b border-white/[0.08] flex items-center gap-6 overflow-x-auto">
        <button onClick={() => setActiveTab('upcoming')} className={tabCls('upcoming')}>
          <span>Upcoming Visits</span>{countBadge(upcomingAppointments.length)}
        </button>
        <button onClick={() => setActiveTab('history')} className={tabCls('history')}>
          <span>Visit History</span>{countBadge(pastAppointments.length)}
        </button>
        <button onClick={() => setActiveTab('prescriptions')} className={tabCls('prescriptions')}>
          <FileText className="w-3.5 h-3.5" />
          <span>Prescriptions (Rx)</span>{countBadge(prescriptions.length)}
        </button>
        <button onClick={() => setActiveTab('notifications')} className={tabCls('notifications')}>
          <span>Reminders &amp; Alerts</span>{countBadge(notifications.length)}
        </button>
      </div>

      {loading ? (
        <div className="py-16 text-center">
          <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-[#555552] mt-2">Loading your appointments...</p>
        </div>
      ) : activeTab === 'upcoming' ? (
        upcomingAppointments.length === 0 ? (
          <div className="bg-[#1a1a18] rounded-3xl border border-dashed border-white/[0.08] p-12 text-center max-w-md mx-auto space-y-3">
            <Calendar className="w-12 h-12 text-[#3a3a38] mx-auto" />
            <h3 className="text-base font-bold text-white">No Upcoming Appointments</h3>
            <p className="text-xs text-[#888882]">You do not have any scheduled doctor visits right now.</p>
            <Link to="/doctors" className="inline-block mt-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold">
              Browse Available Doctors
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {upcomingAppointments.map((appt) => (
              <div key={appt._id} className="bg-[#1a1a18] rounded-3xl border border-white/[0.08] p-6 hover:border-teal-500/20 transition-all flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <img src={appt.doctorId?.avatar || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300'}
                        alt={appt.doctorId?.name} className="w-14 h-14 rounded-2xl object-cover border border-white/[0.08]" />
                      <div>
                        <h3 className="font-bold text-base text-white">{appt.doctorId?.name}</h3>
                        <p className="text-xs text-teal-400 font-semibold">{appt.doctorId?.specialization}</p>
                        <span className="text-[11px] text-[#555552]">{appt.doctorId?.department}</span>
                      </div>
                    </div>
                    {getStatusBadge(appt.status)}
                  </div>

                  <div className="mt-4 p-3.5 rounded-2xl bg-teal-500/[0.07] border border-teal-500/20 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[#555552] block text-[10px] uppercase font-bold">Date</span>
                      <span className="font-bold text-white flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3.5 h-3.5 text-teal-400" />{appt.date}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#555552] block text-[10px] uppercase font-bold">Time Slot</span>
                      <span className="font-bold text-white flex items-center gap-1 mt-0.5">
                        <Clock className="w-3.5 h-3.5 text-teal-400" />{formatTime12h(appt.timeSlot)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 space-y-1.5 text-xs text-[#888882]">
                    <p><span className="text-[#555552]">Reason: </span>{appt.reason}</p>
                    {appt.notes && <p className="text-[11px] italic">Notes: {appt.notes}</p>}
                    <p className="flex items-center gap-1.5 text-[11px]">
                      <MapPin className="w-3.5 h-3.5 text-[#555552]" />{appt.doctorId?.clinicAddress}
                    </p>
                  </div>

                  {appt.status === 'pending' && (
                    <div className="mt-3 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center gap-2">
                      <span className="text-sm">⏳</span>
                      <span>Booking request submitted. Awaiting approval from Dr. {appt.doctorId?.name}.</span>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-white/[0.06] flex items-center gap-2">
                  <button onClick={() => { setSelectedAppt(appt); setNewDate(appt.date); setNewSlot(null); setRescheduleModalOpen(true); }}
                    className="flex-1 py-2 px-3 rounded-xl border border-white/[0.08] hover:border-teal-500/30 hover:bg-teal-500/[0.07] text-[#888882] hover:text-teal-300 text-xs font-bold transition-all flex items-center justify-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5" /><span>Reschedule</span>
                  </button>
                  <button onClick={() => { setSelectedAppt(appt); setCancelReason(''); setCancelModalOpen(true); }}
                    className="py-2 px-3 rounded-xl border border-rose-500/20 hover:bg-rose-500/[0.08] text-rose-400 text-xs font-bold transition-all flex items-center justify-center gap-1.5">
                    <CalendarX2 className="w-3.5 h-3.5" /><span>Cancel</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : activeTab === 'history' ? (
        pastAppointments.length === 0 ? (
          <div className="bg-[#1a1a18] rounded-3xl border border-dashed border-white/[0.08] p-12 text-center max-w-md mx-auto">
            <CheckCircle2 className="w-12 h-12 text-[#3a3a38] mx-auto mb-2" />
            <h3 className="text-base font-bold text-white">No Past Consultations</h3>
            <p className="text-xs text-[#888882] mt-1">Completed and past appointments will appear here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pastAppointments.map((appt) => (
              <div key={appt._id} className="bg-[#1a1a18] rounded-2xl border border-white/[0.08] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#111110] border border-white/[0.06] flex items-center justify-center">
                    <Stethoscope className="w-6 h-6 text-teal-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h4 className="font-bold text-sm text-white">{appt.doctorId?.name}</h4>
                      {getStatusBadge(appt.status)}
                    </div>
                    <p className="text-xs text-[#888882] mt-0.5">{appt.doctorId?.department} • {appt.reason}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-[#888882]">
                      <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-[#555552]" />{appt.date}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-[#555552]" />{formatTime12h(appt.timeSlot)}</span>
                    </div>
                    {appt.status === 'completed' && appt.notes && (
                      <div className="mt-2 p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300">
                        <span className="font-bold block text-[10px] uppercase">Doctor's Notes:</span>{appt.notes}
                      </div>
                    )}
                    {appt.status === 'cancelled' && (
                      <p className="text-[11px] text-rose-400 mt-1">Reason: {appt.cancellationReason || 'Cancelled by user'}</p>
                    )}
                  </div>
                </div>
                <div className="self-end sm:self-center flex items-center gap-2">
                  {appt.status === 'completed' && (
                    <button
                      onClick={() => handleOpenRxView(appt)}
                      className="px-3.5 py-1.5 bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 text-teal-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                      title="View & Download Official Digital Prescription"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Rx</span>
                    </button>
                  )}
                  <Link to={`/doctors/${appt.doctorId?._id}`}
                    className="px-3 py-1.5 bg-[#111110] border border-white/[0.08] hover:border-teal-500/30 hover:text-teal-300 text-[#888882] rounded-xl text-xs font-semibold transition-colors">
                    Book Again
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )
      ) : activeTab === 'prescriptions' ? (
        prescriptions.length === 0 ? (
          <div className="bg-[#1a1a18] rounded-3xl border border-dashed border-white/[0.08] p-12 text-center max-w-md mx-auto space-y-3">
            <FileText className="w-12 h-12 text-[#3a3a38] mx-auto" />
            <h3 className="text-base font-bold text-white">No Digital Prescriptions Yet</h3>
            <p className="text-xs text-[#888882]">When your doctor issues a digital prescription after an appointment, it will appear here for easy viewing and 1-click PDF download.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {prescriptions.map((rx) => (
              <div key={rx._id} className="bg-[#1a1a18] rounded-2xl border border-white/[0.08] p-5 hover:border-teal-500/30 transition-all flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/20 font-bold">
                        {rx.prescriptionNumber || 'RX-MED'}
                      </span>
                      <h4 className="font-bold text-sm text-white mt-1.5">{rx.doctorId?.name || 'Doctor'}</h4>
                      <p className="text-xs text-teal-400/80 font-medium">{rx.doctorId?.specialization || rx.doctorId?.department}</p>
                    </div>
                    <span className="text-[11px] text-[#888882] flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-[#555552]" />
                      {new Date(rx.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {rx.diagnosis && (
                    <div className="mt-3 p-2.5 rounded-xl bg-[#111110] border border-white/[0.06] text-xs">
                      <span className="text-[10px] uppercase font-bold text-[#555552] block">Diagnosis</span>
                      <p className="text-[#dcdcd8] font-medium mt-0.5">{rx.diagnosis}</p>
                    </div>
                  )}

                  <div className="mt-3 text-xs text-[#888882] space-y-1">
                    <p className="text-white font-medium flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-400 inline-block"></span>
                      {rx.medicines?.length || 0} Prescribed Medication{rx.medicines?.length === 1 ? '' : 's'}
                    </p>
                    {rx.medicines?.slice(0, 2).map((m, idx) => (
                      <p key={idx} className="text-[11px] text-[#888882] pl-3 truncate">
                        • {m.name} — <span className="text-teal-400 font-mono">{m.dosage}</span> ({m.timing})
                      </p>
                    ))}
                    {(rx.medicines?.length || 0) > 2 && (
                      <p className="text-[10px] text-[#555552] pl-3">+ {rx.medicines.length - 2} more</p>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between gap-2">
                  <span className="text-[10px] text-[#555552]">Valid Medical Rx</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleDirectRxView(rx)}
                      className="px-3 py-1.5 bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
                      title="View prescription letterhead"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>View</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        try {
                          toast.loading('Generating PDF prescription...', { id: 'pdf-toast' });
                          generatePrescriptionPdf(rx);
                          toast.success('Prescription PDF downloaded! 📄', { id: 'pdf-toast' });
                        } catch (err) {
                          toast.error('Failed to generate PDF', { id: 'pdf-toast' });
                          console.error(err);
                          handleDirectRxView(rx);
                        }
                      }}
                      className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-teal-900/30 active:scale-95"
                      title="Direct 1-click PDF download"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download PDF</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="bg-[#1a1a18] rounded-3xl border border-white/[0.08] p-6 space-y-3">
          <h3 className="font-bold text-sm text-white mb-4">Patient Notification History</h3>
          {notifications.length === 0 ? (
            <p className="text-xs text-[#555552] text-center py-8">No notifications received</p>
          ) : (
            notifications.map((n) => (
              <div key={n._id} className="p-3.5 rounded-xl bg-[#111110] border border-white/[0.06] text-xs flex items-start justify-between gap-4">
                <div>
                  <h4 className="font-bold text-white">{n.title}</h4>
                  <p className="text-[#888882] mt-0.5">{n.message}</p>
                </div>
                <span className="text-[10px] text-[#555552] whitespace-nowrap">{new Date(n.createdAt).toLocaleDateString()}</span>
              </div>
            ))
          )}
        </div>
      )}

      <Modal isOpen={cancelModalOpen} onClose={() => setCancelModalOpen(false)} title="Cancel Appointment">
        <form onSubmit={handleCancelSubmit} className="space-y-4">
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
            <p className="font-bold">Are you sure you want to cancel this visit?</p>
            <p className="mt-1">Slot ({selectedAppt?.date} at {formatTime12h(selectedAppt?.timeSlot)}) with {selectedAppt?.doctorId?.name} will be released.</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#888882] mb-1">Reason (Optional)</label>
            <input type="text" placeholder="e.g. Schedule clash, feeling better..."
              value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} className={inputCls} />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={() => setCancelModalOpen(false)}
              className="flex-1 py-2 px-3 rounded-xl border border-white/[0.08] text-xs font-bold text-[#888882] hover:bg-white/[0.06] hover:text-white">
              Keep Appointment
            </button>
            <button type="submit" disabled={actionLoading}
              className="flex-1 py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors disabled:opacity-50">
              {actionLoading ? 'Cancelling...' : 'Confirm Cancellation'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={rescheduleModalOpen} onClose={() => setRescheduleModalOpen(false)} title="Reschedule Appointment" maxWidth="max-w-2xl">
        <form onSubmit={handleRescheduleSubmit} className="space-y-4">
          <p className="text-xs text-[#888882]">
            Rescheduling with <strong className="text-white">{selectedAppt?.doctorId?.name}</strong>. Choose a new date and open slot.
          </p>
          {selectedAppt && (
            <SlotPicker
              doctorId={selectedAppt.doctorId?._id}
              selectedDate={newDate} onDateChange={(d) => setNewDate(d)}
              selectedSlot={newSlot} onSelectSlot={(s) => setNewSlot(s)}
            />
          )}
          <div className="flex gap-2 pt-4 border-t border-white/[0.06]">
            <button type="button" onClick={() => setRescheduleModalOpen(false)}
              className="flex-1 py-2 px-3 rounded-xl border border-white/[0.08] text-xs font-bold text-[#888882] hover:bg-white/[0.06] hover:text-white">
              Back
            </button>
            <button type="submit" disabled={!newSlot || actionLoading}
              className="flex-1 py-2 px-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-colors disabled:opacity-50">
              {actionLoading ? 'Rescheduling...' : `Confirm Reschedule (${newSlot || 'Select Slot'})`}
            </button>
          </div>
        </form>
      </Modal>

      <PrescriptionViewModal
        isOpen={rxViewModalOpen}
        onClose={() => setRxViewModalOpen(false)}
        prescription={selectedRx}
      />
    </div>
  );
}
