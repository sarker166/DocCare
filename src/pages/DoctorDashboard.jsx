import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import PrescriptionModal from '../components/PrescriptionModal';
import PrescriptionViewModal from '../components/PrescriptionViewModal';
import DoctorLiveQueue from '../components/live-queue';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  Calendar, Clock, User, CheckCircle2, XCircle,
  AlertTriangle, Plus, Trash2, Save, FileText, Printer, Coffee,
  Lock,
} from 'lucide-react';
import { formatTime12h, formatSingleTime12h } from '../utils/timeFormat';

const inputCls = "w-full py-2 px-3 bg-[#111110] border border-white/[0.08] rounded-xl text-xs text-white placeholder-[#555552] focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500";

export default function DoctorDashboard() {
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState('appointments');
  const [appointments, setAppointments] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [prescriptionModalOpen, setPrescriptionModalOpen] = useState(false);
  const [rxViewModalOpen, setRxViewModalOpen] = useState(false);
  const [selectedRx, setSelectedRx] = useState(null);
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [statusLoading, setStatusLoading] = useState(false);

  const [declineModalOpen, setDeclineModalOpen] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [declineAppt, setDeclineAppt] = useState(null);
  const [declineLoading, setDeclineLoading] = useState(false);

  const [newDay, setNewDay] = useState('Monday');
  const [newStartTime, setNewStartTime] = useState('09:00');
  const [newEndTime, setNewEndTime] = useState('20:30');
  const [newBreakStart, setNewBreakStart] = useState('13:30');
  const [newBreakEnd, setNewBreakEnd] = useState('14:30');
  const [newDuration, setNewDuration] = useState(30);
  const [availLoading, setAvailLoading] = useState(false);

  const [profileData, setProfileData] = useState({
    name: user?.doctorProfile?.name || user?.name || '',
    specialization: user?.doctorProfile?.specialization || '',
    department: user?.doctorProfile?.department || 'Cardiology',
    qualification: user?.doctorProfile?.qualification || '',
    experience: user?.doctorProfile?.experience || 5,
    consultationFee: user?.doctorProfile?.consultationFee || 50,
    bio: user?.doctorProfile?.bio || '',
    clinicAddress: user?.doctorProfile?.clinicAddress || '',
  });

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  const fetchData = async () => {
    try {
      const [apptsRes, schedRes] = await Promise.all([
        api.get('/appointments/my'),
        api.get('/availability/my-schedule'),
      ]);
      const local = JSON.parse(localStorage.getItem('doc_local_appts') || '[]');
      const combined = [...(apptsRes.data || [])];
      for (const loc of local) {
        if (!combined.some((a) => a._id === loc._id)) {
          combined.push(loc);
        }
      }
      setAppointments(combined);
      setSchedules(schedRes.data || []);
    } catch (err) {
      console.error(err);
      const local = JSON.parse(localStorage.getItem('doc_local_appts') || '[]');
      setAppointments(local);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleUpdateStatus = async (id, status, notes = '') => {
    setStatusLoading(true);
    try {
      await api.patch(`/appointments/${id}/status`, { status, notes });
      toast.success(`Appointment marked as ${status}`);
      setCompleteModalOpen(false);
      fetchData();
    } catch (err) {
      const local = JSON.parse(localStorage.getItem('doc_local_appts') || '[]');
      const updated = local.map((a) => (a._id === id ? { ...a, status, notes } : a));
      localStorage.setItem('doc_local_appts', JSON.stringify(updated));
      setAppointments((prev) => prev.map((a) => (a._id === id ? { ...a, status, notes } : a)));
      toast.success(`Appointment marked as ${status}`);
      setCompleteModalOpen(false);
    } finally {
      setStatusLoading(false);
    }
  };

  const handleAcceptAppointment = async (appt) => {
    setStatusLoading(true);
    try {
      await api.patch(`/appointments/${appt._id}/status`, { status: 'confirmed' });
      toast.success(`Appointment accepted for ${appt.patientId?.name || 'patient'}! ✅`);
      fetchData();
    } catch (err) {
      const local = JSON.parse(localStorage.getItem('doc_local_appts') || '[]');
      const updated = local.map((a) => (a._id === appt._id ? { ...a, status: 'confirmed' } : a));
      localStorage.setItem('doc_local_appts', JSON.stringify(updated));
      setAppointments((prev) => prev.map((a) => (a._id === appt._id ? { ...a, status: 'confirmed' } : a)));
      toast.success(`Appointment accepted for ${appt.patientId?.name || 'patient'}! ✅`);
    } finally {
      setStatusLoading(false);
    }
  };

  const handleDeclineSubmit = async (e) => {
    e.preventDefault();
    if (!declineAppt) return;
    setDeclineLoading(true);
    try {
      await api.patch(`/appointments/${declineAppt._id}/cancel`, {
        cancellationReason: declineReason || 'Declined by doctor',
      });
      toast.success('Appointment request declined. Slot released.');
      setDeclineModalOpen(false);
      setDeclineReason('');
      setDeclineAppt(null);
      fetchData();
    } catch (err) {
      const local = JSON.parse(localStorage.getItem('doc_local_appts') || '[]');
      const updated = local.map((a) =>
        a._id === declineAppt._id
          ? { ...a, status: 'cancelled', cancellationReason: declineReason || 'Declined by doctor' }
          : a
      );
      localStorage.setItem('doc_local_appts', JSON.stringify(updated));
      setAppointments((prev) =>
        prev.map((a) =>
          a._id === declineAppt._id
            ? { ...a, status: 'cancelled', cancellationReason: declineReason || 'Declined by doctor' }
            : a
        )
      );
      toast.success('Appointment request declined. Slot released.');
      setDeclineModalOpen(false);
      setDeclineReason('');
      setDeclineAppt(null);
    } finally {
      setDeclineLoading(false);
    }
  };

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
      toast.error('No prescription found for this appointment');
    }
  };

  const handlePrescriptionSaved = (newRx) => {
    fetchData();
    setSelectedRx(newRx);
    setRxViewModalOpen(true);
  };

  const handleSaveAvailability = async (e) => {
    e.preventDefault();
    setAvailLoading(true);
    try {
      await api.post('/availability', {
        day: newDay,
        startTime: newStartTime,
        endTime: newEndTime,
        breakStartTime: newBreakStart,
        breakEndTime: newBreakEnd,
        slotDuration: Number(newDuration),
        isActive: true,
      });
      toast.success(`Schedule for ${newDay} updated!`);
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save availability'); }
    finally { setAvailLoading(false); }
  };

  const handleDeleteSchedule = async (id) => {
    if (!window.confirm('Remove schedule for this day?')) return;
    try {
      await api.delete(`/availability/${id}`);
      toast.success('Schedule deleted');
      fetchData();
    } catch { toast.error('Failed to delete schedule'); }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put('/doctors/profile', profileData);
      toast.success('Doctor profile updated!');
      await refreshUser();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to update profile'); }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setPasswordLoading(true);
    try {
      await api.put('/auth/profile', { password: newPassword });
      toast.success('Your password has been changed successfully! 🔐');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const isApproved = user?.doctorProfile?.approvalStatus === 'approved';

  const tabCls = (t) =>
    `pb-3 border-b-2 transition-all flex items-center gap-2 text-sm font-bold ${
      activeTab === t ? 'border-teal-500 text-teal-400' : 'border-transparent text-[#888882] hover:text-white'
    }`;

  const pendingAppointments = appointments.filter((a) => a.status === 'pending');

  const statusBadgeCls = (s) => ({
    pending:    'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    confirmed:  'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    completed:  'bg-blue-500/10 text-blue-400 border border-blue-500/20',
    cancelled:  'bg-rose-500/10 text-rose-400 border border-rose-500/20',
    'no-show':  'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  }[s] || '');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {!isApproved && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-amber-300 space-y-1">
            <h4 className="font-bold">Doctor Verification Pending</h4>
            <p>Your account is awaiting administrator approval. Once verified, your profile will appear on the public directory.</p>
          </div>
        </div>
      )}

      <div className="bg-[#1a1a18] rounded-3xl p-6 sm:p-8 border border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-bold text-xl shadow-md">
            {user?.name?.charAt(0) || 'D'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white">{user?.name}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                isApproved ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              }`}>
                {user?.doctorProfile?.approvalStatus || 'Pending'}
              </span>
            </div>
            <p className="text-xs text-[#888882] mt-0.5">
              {user?.doctorProfile?.specialization || 'Doctor'} • {user?.doctorProfile?.department || 'Department'}
            </p>
          </div>
        </div>
      </div>

      <div className="border-b border-white/[0.08] flex items-center gap-4 sm:gap-6 overflow-x-auto scrollbar-none pb-px">
        <button onClick={() => setActiveTab('appointments')} className={tabCls('appointments') + ' whitespace-nowrap shrink-0'}>
          <Calendar className="w-4 h-4 shrink-0" /><span>Appointments</span>
          <span className="text-xs bg-white/[0.06] text-[#888882] px-2 py-0.5 rounded-full">{appointments.length}</span>
          {pendingAppointments.length > 0 && (
            <span className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold animate-pulse hidden sm:inline">
              {pendingAppointments.length} Pending
            </span>
          )}
        </button>
        <button onClick={() => setActiveTab('availability')} className={tabCls('availability') + ' whitespace-nowrap shrink-0'}>
          <Clock className="w-4 h-4 shrink-0" /><span>Availability</span>
        </button>
        <button onClick={() => setActiveTab('profile')} className={tabCls('profile') + ' whitespace-nowrap shrink-0'}>
          <User className="w-4 h-4 shrink-0" /><span>Profile</span>
        </button>
      </div>

      {activeTab === 'appointments' && (
        <div className="space-y-6">
          <DoctorLiveQueue
            appointments={appointments}
            onWritePrescription={(appt) => {
              setSelectedAppt(appt);
              setPrescriptionModalOpen(true);
            }}
            onCompleteAppointment={(appt) => {
              setSelectedAppt(appt);
              setClinicalNotes('');
              setCompleteModalOpen(true);
            }}
          />

          {pendingAppointments.length > 0 ? (
            <div className="bg-gradient-to-br from-[#261c10] to-[#1a1a18] rounded-3xl border border-amber-500/30 p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-amber-500/20">
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-amber-400 animate-ping" />
                  <div>
                    <h3 className="font-bold text-white text-base flex items-center gap-2">
                      <span>Pending Patient Booking Requests</span>
                      <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                        {pendingAppointments.length} Awaiting Your Decision
                      </span>
                    </h3>
                    <p className="text-xs text-amber-300/80 mt-0.5">
                      Patients have applied for these slots. Please Accept or Cancel/Decline the booking.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                {pendingAppointments.map((appt) => (
                  <div key={appt._id} className="bg-[#141412] rounded-2xl border border-amber-500/20 p-5 space-y-3 shadow-md">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20 font-mono">
                          {appt.date} • {formatTime12h(appt.timeSlot)}
                        </span>
                        <h4 className="font-bold text-base text-white mt-2">{appt.patientId?.name || 'Patient'}</h4>
                        <p className="text-xs text-[#888882]">Phone: <strong className="text-white">{appt.patientId?.phoneNumber || 'N/A'}</strong> • {appt.patientId?.email}</p>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        Pending
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-[#0c0c0a] border border-white/[0.06] text-xs text-[#888882] space-y-1">
                      <p><strong className="text-white">Chief Complaint: </strong>{appt.reason || 'General Consultation'}</p>
                      {appt.notes && <p className="italic text-[#666660]"><strong>Patient Note: </strong>{appt.notes}</p>}
                    </div>

                    <div className="pt-2 border-t border-white/[0.06] flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleAcceptAppointment(appt)}
                        disabled={statusLoading}
                        className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-700/20 active:scale-95 disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Accept Request</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDeclineAppt(appt);
                          setDeclineReason('');
                          setDeclineModalOpen(true);
                        }}
                        className="flex-1 py-2 px-3 bg-rose-600/10 hover:bg-rose-600/20 border border-rose-500/30 text-rose-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Cancel / Decline</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-[#141d2e]/60 border border-sky-500/20 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">No Pending Patient Requests</p>
                  <p className="text-[11px] text-[#888882]">When patients book an appointment, new requests will appear here for you to Accept or Decline.</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <h3 className="font-bold text-white text-sm">All Booked Appointments</h3>
            <span className="text-xs text-[#888882]">Filter and manage patient records</span>
          </div>
          {loading ? (
            <div className="py-12 text-center text-xs text-[#555552]">Loading appointments...</div>
          ) : appointments.length === 0 ? (
            <div className="bg-[#1a1a18] rounded-3xl border border-dashed border-white/[0.08] p-12 text-center text-xs text-[#888882]">
              No appointments scheduled currently.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {appointments.map((appt) => (
                <div key={appt._id} className="bg-[#1a1a18] rounded-2xl border border-white/[0.08] p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded-md">
                        {appt.date} • {formatTime12h(appt.timeSlot)}
                      </span>
                      <h4 className="font-bold text-base text-white mt-1">{appt.patientId?.name || 'Patient'}</h4>
                      <p className="text-xs text-[#888882]">Phone: {appt.patientId?.phoneNumber || 'N/A'} • {appt.patientId?.email}</p>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusBadgeCls(appt.status)}`}>
                      {appt.status}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#111110] border border-white/[0.06] text-xs text-[#888882] space-y-1">
                    <p><strong className="text-white">Reason: </strong>{appt.reason}</p>
                    {appt.notes && <p className="italic text-[#555552]"><strong>Notes: </strong>{appt.notes}</p>}
                  </div>

                  {appt.status === 'pending' && (
                    <div className="pt-2 border-t border-white/[0.06] flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleAcceptAppointment(appt)}
                        disabled={statusLoading}
                        className="flex-1 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-700/20 active:scale-95 disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Accept Request</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDeclineAppt(appt);
                          setDeclineReason('');
                          setDeclineModalOpen(true);
                        }}
                        className="flex-1 py-1.5 px-3 bg-rose-600/10 hover:bg-rose-600/20 border border-rose-500/30 text-rose-300 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 active:scale-95"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Cancel / Decline</span>
                      </button>
                    </div>
                  )}

                  {appt.status === 'confirmed' && (
                    <div className="pt-2 border-t border-white/[0.06] flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => { setSelectedAppt(appt); setPrescriptionModalOpen(true); }}
                        className="flex-1 min-w-[120px] py-1.5 px-3 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm shadow-teal-600/20"
                      >
                        <FileText className="w-3.5 h-3.5 shrink-0" />
                        <span>Prescribe (Rx)</span>
                      </button>
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => { setSelectedAppt(appt); setClinicalNotes(''); setCompleteModalOpen(true); }}
                          className="py-1.5 px-2.5 bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1"
                          title="Mark completed with simple notes"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>Quick Done</span>
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(appt._id, 'no-show')}
                          className="py-1.5 px-2.5 bg-[#111110] border border-white/[0.08] hover:border-amber-500/30 text-[#888882] hover:text-amber-400 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5 shrink-0" />
                          <span className="hidden sm:inline">No-Show</span>
                          <span className="sm:hidden">NS</span>
                        </button>
                        <button
                          onClick={() => { setDeclineAppt(appt); setDeclineReason(''); setDeclineModalOpen(true); }}
                          className="py-1.5 px-2.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1"
                          title="Cancel this appointment"
                        >
                          <XCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>Cancel</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {appt.status === 'completed' && (
                    <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between">
                      <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Consultation Complete
                      </span>
                      <button
                        onClick={() => handleOpenRxView(appt)}
                        className="py-1 px-3 bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/20 text-teal-300 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>View / Print Rx</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'availability' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-4">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Calendar className="w-4 h-4 text-teal-400" />Active Weekly Schedule
            </h3>
            {schedules.length === 0 ? (
              <div className="bg-[#1a1a18] rounded-2xl border border-dashed border-white/[0.08] p-8 text-center text-xs text-[#888882]">
                No available days added yet. Use the form to set working hours.
              </div>
            ) : (
              <div className="space-y-2.5">
                {schedules.map((s) => (
                  <div key={s._id} className="bg-[#1a1a18] rounded-2xl border border-white/[0.08] p-4 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-white">{s.day}</h4>
                      <p className="text-xs text-[#888882] mt-0.5">
                        Hours: <strong className="text-teal-400">
                          {formatTime12h(s.startTime || '09:00 AM')} – {formatTime12h(s.breakStartTime || '01:30 PM')} &amp; {formatTime12h(s.breakEndTime || '02:30 PM')} – {formatTime12h(s.endTime || '08:30 PM')}
                        </strong>
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-[11px] text-[#555552]">
                        <span>Break: {formatTime12h(s.breakStartTime || '01:30 PM')} – {formatTime12h(s.breakEndTime || '02:30 PM')}</span>
                        <span>•</span>
                        <span>Slot interval: {s.slotDuration || 30} mins</span>
                      </div>
                    </div>
                    <button onClick={() => handleDeleteSchedule(s._id)}
                      className="p-2 text-[#555552] hover:text-rose-400 hover:bg-rose-500/[0.08] rounded-lg transition-colors"
                      title="Remove schedule">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-5">
            <div className="bg-[#1a1a18] rounded-3xl p-6 border border-white/[0.08] space-y-4">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Plus className="w-4 h-4 text-teal-400" />Configure Schedule Day (12-Hour)
              </h3>

              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#555552]">Quick Presets</span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setNewStartTime('09:00');
                      setNewBreakStart('13:30');
                      setNewBreakEnd('14:30');
                      setNewEndTime('20:30');
                    }}
                    className="px-2.5 py-1 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400 hover:bg-teal-500/20 text-[11px] font-semibold transition-colors"
                  >
                    Full Shift (9am-1:30pm &amp; 2:30pm-8:30pm)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewStartTime('09:00');
                      setNewBreakStart('13:30');
                      setNewBreakEnd('13:30');
                      setNewEndTime('13:30');
                    }}
                    className="px-2.5 py-1 rounded-lg bg-[#111110] border border-white/[0.08] text-[#888882] hover:text-white text-[11px] transition-colors"
                  >
                    Morning Only (9:00am - 1:30pm)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewStartTime('14:30');
                      setNewBreakStart('14:30');
                      setNewBreakEnd('14:30');
                      setNewEndTime('20:30');
                    }}
                    className="px-2.5 py-1 rounded-lg bg-[#111110] border border-white/[0.08] text-[#888882] hover:text-white text-[11px] transition-colors"
                  >
                    Evening Only (2:30pm - 8:30pm)
                  </button>
                </div>
              </div>

              <form onSubmit={handleSaveAvailability} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-semibold text-[#888882] mb-1">Day of the Week</label>
                  <select value={newDay} onChange={(e) => setNewDay(e.target.value)} className={inputCls}>
                    {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-[#888882] mb-1">
                      Start Time <span className="text-teal-400 font-normal">({formatSingleTime12h(newStartTime)})</span>
                    </label>
                    <input type="time" required value={newStartTime} onChange={(e) => setNewStartTime(e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className="block font-semibold text-[#888882] mb-1">
                      End Time <span className="text-teal-400 font-normal">({formatSingleTime12h(newEndTime)})</span>
                    </label>
                    <input type="time" required value={newEndTime} onChange={(e) => setNewEndTime(e.target.value)} className={inputCls} />
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-[#141412] border border-amber-500/20 space-y-2">
                  <div className="flex items-center gap-1.5 text-amber-400 font-medium text-[11px]">
                    <Coffee className="w-3.5 h-3.5" />
                    <span>Clinic Break / Lunch Interval (No slots created)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] text-[#888882] mb-0.5">
                        Break Starts ({formatSingleTime12h(newBreakStart)})
                      </label>
                      <input type="time" value={newBreakStart} onChange={(e) => setNewBreakStart(e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-[11px] text-[#888882] mb-0.5">
                        Break Ends ({formatSingleTime12h(newBreakEnd)})
                      </label>
                      <input type="time" value={newBreakEnd} onChange={(e) => setNewBreakEnd(e.target.value)} className={inputCls} />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-[#888882] mb-1">Slot Duration</label>
                  <select value={newDuration} onChange={(e) => setNewDuration(Number(e.target.value))} className={inputCls}>
                    <option value={15}>15 Minutes</option>
                    <option value={30}>30 Minutes (Standard)</option>
                    <option value={45}>45 Minutes</option>
                    <option value={60}>60 Minutes</option>
                  </select>
                </div>
                <button type="submit" disabled={availLoading}
                  className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-md shadow-teal-700/20">
                  <Save className="w-4 h-4" /><span>{availLoading ? 'Saving...' : 'Save Availability Schedule'}</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'profile' && (
        <div className="bg-[#1a1a18] rounded-3xl p-6 sm:p-8 border border-white/[0.08] max-w-2xl space-y-6">
          <h3 className="font-bold text-white text-base">Doctor Profile &amp; Consultation Pricing</h3>
          <form onSubmit={handleProfileSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-[#888882] mb-1">Specialization</label>
                <input type="text" required value={profileData.specialization}
                  onChange={(e) => setProfileData({ ...profileData, specialization: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className="block font-semibold text-[#888882] mb-1">Department</label>
                <input type="text" required value={profileData.department}
                  onChange={(e) => setProfileData({ ...profileData, department: e.target.value })} className={inputCls} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-[#888882] mb-1">Qualification</label>
                <input type="text" required value={profileData.qualification}
                  onChange={(e) => setProfileData({ ...profileData, qualification: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className="block font-semibold text-[#888882] mb-1">Experience (Years)</label>
                <input type="number" min="0" value={profileData.experience}
                  onChange={(e) => setProfileData({ ...profileData, experience: Number(e.target.value) })} className={inputCls} />
              </div>
            </div>
            <div>
              <label className="block font-semibold text-[#888882] mb-1">Clinic Room / Address</label>
              <input type="text" value={profileData.clinicAddress}
                onChange={(e) => setProfileData({ ...profileData, clinicAddress: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className="block font-semibold text-[#888882] mb-1">Biography</label>
              <textarea rows="3" value={profileData.bio}
                onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })} className={inputCls + ' resize-none'} />
            </div>
            <button type="submit"
              className="py-2.5 px-6 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl transition-all flex items-center gap-2">
              <Save className="w-4 h-4" /><span>Save Changes</span>
            </button>
          </form>

          <div className="pt-6 border-t border-white/[0.08] space-y-4">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-teal-400" />
              <h4 className="font-bold text-white text-sm">Account Password &amp; Security</h4>
            </div>
            <p className="text-xs text-[#888882]">
              Set your own custom password for this doctor account. You will use this new password to sign in next time.
            </p>

            <form onSubmit={handlePasswordChange} className="space-y-3 max-w-md text-xs">
              <div>
                <label className="block font-semibold text-[#888882] mb-1">New Password (Min 6 characters)</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={inputCls}
                />
              </div>

              <div>
                <label className="block font-semibold text-[#888882] mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={inputCls}
                />
              </div>

              <button
                type="submit"
                disabled={passwordLoading}
                className="py-2.5 px-5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <Lock className="w-4 h-4" />
                <span>{passwordLoading ? 'Updating Password...' : 'Update Password'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      <Modal isOpen={completeModalOpen} onClose={() => setCompleteModalOpen(false)} title="Mark Appointment Completed">
        <div className="space-y-4">
          <p className="text-xs text-[#888882]">
            Record completion for <strong className="text-white">{selectedAppt?.patientId?.name}</strong>.
          </p>
          <div>
            <label className="block text-xs font-semibold text-[#888882] mb-1">Doctor's Consultation Notes &amp; Advice</label>
            <textarea rows="3" placeholder="e.g. Prescribed medication, follow up in 2 weeks..."
              value={clinicalNotes} onChange={(e) => setClinicalNotes(e.target.value)} className={inputCls + ' resize-none'} />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={() => setCompleteModalOpen(false)}
              className="flex-1 py-2 px-3 border border-white/[0.08] rounded-xl text-xs font-bold text-[#888882] hover:bg-white/[0.06] hover:text-white">
              Cancel
            </button>
            <button type="button" disabled={statusLoading}
              onClick={() => handleUpdateStatus(selectedAppt?._id, 'completed', clinicalNotes)}
              className="flex-1 py-2 px-3 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50">
              {statusLoading ? 'Saving...' : 'Confirm Completed'}
            </button>
          </div>
        </div>
      </Modal>

      <PrescriptionModal
        isOpen={prescriptionModalOpen}
        onClose={() => setPrescriptionModalOpen(false)}
        appointment={selectedAppt}
        onPrescriptionSaved={handlePrescriptionSaved}
      />

      <PrescriptionViewModal
        isOpen={rxViewModalOpen}
        onClose={() => setRxViewModalOpen(false)}
        prescription={selectedRx}
      />

      <Modal isOpen={declineModalOpen} onClose={() => setDeclineModalOpen(false)} title="Decline Appointment Request">
        <form onSubmit={handleDeclineSubmit} className="space-y-4">
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs space-y-1">
            <p className="font-bold">Decline booking request for {declineAppt?.patientId?.name}?</p>
            <p className="text-[11px] text-rose-300/80">
              The requested booking on {declineAppt?.date} at {formatTime12h(declineAppt?.timeSlot)} will be cancelled and the slot will be released back to the schedule.
            </p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#888882] mb-1">Reason for Declining (Sent to Patient)</label>
            <input
              type="text"
              placeholder="e.g. Doctor unavailable at this time, emergency surgery..."
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              className={inputCls}
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setDeclineModalOpen(false)}
              className="flex-1 py-2 px-3 border border-white/[0.08] rounded-xl text-xs font-bold text-[#888882] hover:bg-white/[0.06] hover:text-white"
            >
              Keep Request
            </button>
            <button
              type="submit"
              disabled={declineLoading}
              className="flex-1 py-2 px-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
            >
              {declineLoading ? 'Declining...' : 'Confirm Decline'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
