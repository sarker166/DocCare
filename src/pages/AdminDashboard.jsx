import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  Calendar, CheckCircle2, XCircle, AlertTriangle,
  Building2, FileBarChart, ShieldCheck, Plus, Trash2,
} from 'lucide-react';
import { formatTime12h } from '../utils/timeFormat';

const inputCls = "w-full py-2 px-3 bg-[#111110] border border-white/[0.08] rounded-xl text-xs text-white placeholder-[#555552] focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500";
const thCls = "p-3 text-[10px] uppercase font-bold text-[#555552]";
const tdCls = "p-3 text-xs text-[#888882]";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptDesc, setNewDeptDesc] = useState('');
  const [deptLoading, setDeptLoading] = useState(false);

  const fetchAdminData = async () => {
    try {
      const [statsRes, docsRes, deptsRes, reportsRes] = await Promise.all([
        api.get('/admin/stats'), api.get('/admin/doctors'),
        api.get('/admin/departments'), api.get('/admin/reports'),
      ]);
      setStats(statsRes.data); setDoctors(docsRes.data);
      setDepartments(deptsRes.data); setReports(reportsRes.data);
    } catch { toast.error('Failed to load administrative data'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAdminData(); }, []);

  const handleApproval = async (doctorId, status) => {
    try {
      await api.patch(`/admin/doctors/${doctorId}/status`, { approvalStatus: status });
      toast.success(`Doctor marked as ${status}`);
      fetchAdminData();
    } catch { toast.error('Failed to update doctor status'); }
  };

  const handleAddDept = async (e) => {
    e.preventDefault();
    if (!newDeptName) return;
    setDeptLoading(true);
    try {
      await api.post('/admin/departments', { name: newDeptName, description: newDeptDesc });
      toast.success('Department created');
      setNewDeptName(''); setNewDeptDesc('');
      fetchAdminData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create department');
    } finally { setDeptLoading(false); }
  };

  const handleDeleteDept = async (id) => {
    if (!window.confirm('Delete this department?')) return;
    try { await api.delete(`/admin/departments/${id}`); toast.success('Department deleted'); fetchAdminData(); }
    catch { toast.error('Failed to delete department'); }
  };

  const metrics = stats?.metrics;

  const tabCls = (t) =>
    `pb-3 border-b-2 transition-all flex items-center gap-2 text-sm font-bold whitespace-nowrap ${
      activeTab === t ? 'border-purple-500 text-purple-400' : 'border-transparent text-[#888882] hover:text-white'
    }`;

  const statusBadgeCls = (s) => ({
    confirmed: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    completed:  'bg-blue-500/10 text-blue-400 border border-blue-500/20',
    cancelled:  'bg-rose-500/10 text-rose-400 border border-rose-500/20',
    'no-show':  'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    approved:   'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    rejected:   'bg-rose-500/10 text-rose-400 border border-rose-500/20',
    pending:    'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  }[s] || 'bg-white/[0.05] text-[#888882]');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-purple-900/40 to-indigo-900/30 border border-purple-500/20 rounded-3xl p-6 sm:p-8 text-white">
        <div>
          <span className="text-purple-400 text-xs font-semibold uppercase tracking-wider">Hospital Administration Console</span>
          <h1 className="text-2xl sm:text-3xl font-bold mt-1">System Operations &amp; Analytics 🏥</h1>
          <p className="text-xs sm:text-sm text-[#888882] mt-1">Monitor clinic metrics, approve doctor registrations, and audit attendance reports.</p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs font-bold text-purple-300">
            {metrics?.pendingDoctors || 0} Doctor Approvals Pending
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[
          { label: 'Total Bookings', value: metrics?.totalAppointments || 0, sub: `${metrics?.todayAppointments || 0} today`, icon: <Calendar className="w-4 h-4 text-teal-400" />, color: 'text-teal-400' },
          { label: 'Completed Visits', value: metrics?.completedAppointments || 0, sub: `${metrics?.completedAppointments || 0} consultations served`, icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />, color: 'text-emerald-400' },
          { label: 'Cancellations', value: metrics?.cancelledAppointments || 0, sub: 'Slots released back', icon: <XCircle className="w-4 h-4 text-rose-400" />, color: 'text-rose-400' },
          { label: 'No-Shows', value: metrics?.noShowAppointments || 0, sub: `${metrics?.approvedDoctors || 0} active doctors`, icon: <AlertTriangle className="w-4 h-4 text-amber-400" />, color: 'text-amber-400' },
        ].map(({ label, value, sub, icon, color }) => (
          <div key={label} className="bg-[#1a1a18] p-5 rounded-2xl border border-white/[0.08] space-y-2">
            <div className="flex items-center justify-between text-[#555552]">
              <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
              {icon}
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-white">{value}</div>
            <span className={`text-[11px] font-semibold block ${color}`}>{sub}</span>
          </div>
        ))}
      </div>

      <div className="border-b border-white/[0.08] flex items-center gap-6 overflow-x-auto">
        <button onClick={() => setActiveTab('overview')} className={tabCls('overview')}>
          <FileBarChart className="w-4 h-4" /><span>Recent Activity</span>
        </button>
        <button onClick={() => setActiveTab('doctors')} className={tabCls('doctors')}>
          <ShieldCheck className="w-4 h-4" />
          <span>Doctor Approvals ({doctors.filter((d) => d.approvalStatus === 'pending').length})</span>
        </button>
        <button onClick={() => setActiveTab('departments')} className={tabCls('departments')}>
          <Building2 className="w-4 h-4" /><span>Departments</span>
        </button>
        <button onClick={() => setActiveTab('reports')} className={tabCls('reports')}>
          <AlertTriangle className="w-4 h-4" /><span>Cancellation &amp; No-Show Audit</span>
        </button>
      </div>

      {activeTab === 'overview' && (
        <div className="bg-[#1a1a18] rounded-3xl border border-white/[0.08] p-6 space-y-4">
          <h3 className="font-bold text-white text-base">Latest Appointments Log</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#111110]">
                <tr>
                  {['Patient','Doctor','Department','Date & Slot','Reason','Status'].map((h) => (
                    <th key={h} className={thCls}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {stats?.recentAppointments?.map((a) => (
                  <tr key={a._id} className="hover:bg-white/[0.02]">
                    <td className={tdCls + ' font-bold text-white'}>{a.patientId?.name || 'User'}</td>
                    <td className={tdCls}>{a.doctorId?.name || 'Doctor'}</td>
                    <td className={tdCls + ' text-teal-400'}>{a.doctorId?.department}</td>
                    <td className={tdCls + ' whitespace-nowrap'}>{a.date} <span className="text-[#555552]">({formatTime12h(a.timeSlot)})</span></td>
                    <td className={tdCls + ' truncate max-w-xs'}>{a.reason}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${statusBadgeCls(a.status)}`}>{a.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'doctors' && (
        <div className="bg-[#1a1a18] rounded-3xl border border-white/[0.08] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-base">Physician Accounts &amp; Approvals</h3>
            <span className="text-xs text-[#888882]">Review qualifications and toggle approval</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#111110]">
                <tr>
                  {['Doctor','Department & Specialty','Qualifications','Experience','Contact','Status','Action'].map((h) => (
                    <th key={h} className={thCls}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {doctors.map((d) => (
                  <tr key={d._id} className="hover:bg-white/[0.02]">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <img src={d.avatar} alt={d.name} className="w-10 h-10 rounded-xl object-cover border border-white/[0.08]" />
                        <div>
                          <div className="font-bold text-white text-xs">{d.name}</div>
                          <div className="text-[11px] text-[#555552]">{d.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-teal-400 text-xs">{d.department}</div>
                      <div className="text-[11px] text-[#555552]">{d.specialization}</div>
                    </td>
                    <td className={tdCls}>{d.qualification}</td>
                    <td className={tdCls}>{d.experience} yrs</td>
                    <td className={tdCls}>{d.phoneNumber || 'N/A'}</td>
                    <td className="p-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${statusBadgeCls(d.approvalStatus)}`}>
                        {d.approvalStatus}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {d.approvalStatus !== 'approved' && (
                          <button onClick={() => handleApproval(d._id, 'approved')}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors">
                            Approve
                          </button>
                        )}
                        {d.approvalStatus !== 'rejected' && (
                          <button onClick={() => handleApproval(d._id, 'rejected')}
                            className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 rounded-lg text-xs font-bold transition-colors">
                            Reject
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'departments' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-4">
            <h3 className="font-bold text-white text-base">Active Clinical Departments</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {departments.map((dept) => (
                <div key={dept._id} className="bg-[#1a1a18] rounded-2xl border border-white/[0.08] p-4 flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-white text-sm">{dept.name}</h4>
                    <p className="text-xs text-[#888882] mt-0.5">{dept.description}</p>
                  </div>
                  <button onClick={() => handleDeleteDept(dept._id)}
                    className="p-1.5 text-[#555552] hover:text-rose-400 hover:bg-rose-500/[0.08] rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="bg-[#1a1a18] rounded-3xl p-6 border border-white/[0.08] space-y-4">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Plus className="w-4 h-4 text-purple-400" />Add New Department
              </h3>
              <form onSubmit={handleAddDept} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-[#888882] mb-1">Department Name</label>
                  <input type="text" required placeholder="e.g. Oncology, Ophthalmology..."
                    value={newDeptName} onChange={(e) => setNewDeptName(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="block font-semibold text-[#888882] mb-1">Description</label>
                  <textarea rows="3" placeholder="Brief description of specialized services..."
                    value={newDeptDesc} onChange={(e) => setNewDeptDesc(e.target.value)} className={inputCls + ' resize-none'} />
                </div>
                <button type="submit" disabled={deptLoading}
                  className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-all">
                  {deptLoading ? 'Creating...' : 'Create Department'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="bg-[#1a1a18] rounded-3xl border border-white/[0.08] p-6 space-y-4">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <XCircle className="w-5 h-5 text-rose-400" />
              Cancelled Appointments Audit ({reports?.totalCancelled || 0})
            </h3>
            {!reports?.cancelled?.length ? (
              <p className="text-xs text-[#555552] py-4 text-center">No cancellation records</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-[#111110]">
                    <tr>{['Patient','Doctor','Date & Slot','Reason','Date'].map((h) => <th key={h} className={thCls}>{h}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {reports.cancelled.map((c) => (
                      <tr key={c._id} className="hover:bg-white/[0.02]">
                        <td className={tdCls + ' font-bold text-white'}>{c.patientId?.name || 'User'}</td>
                        <td className={tdCls}>{c.doctorId?.name} ({c.doctorId?.department})</td>
                        <td className={tdCls}>{c.date} ({formatTime12h(c.timeSlot)})</td>
                        <td className="p-3 text-rose-400 text-xs font-medium">{c.cancellationReason || 'No reason provided'}</td>
                        <td className={tdCls}>{new Date(c.updatedAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="bg-[#1a1a18] rounded-3xl border border-white/[0.08] p-6 space-y-4">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              No-Show Records Audit ({reports?.totalNoShows || 0})
            </h3>
            {!reports?.noShows?.length ? (
              <p className="text-xs text-[#555552] py-4 text-center">No no-show records recorded</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-[#111110]">
                    <tr>{['Patient','Phone','Doctor','Date & Slot','Notes'].map((h) => <th key={h} className={thCls}>{h}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {reports.noShows.map((ns) => (
                      <tr key={ns._id} className="hover:bg-white/[0.02]">
                        <td className={tdCls + ' font-bold text-white'}>{ns.patientId?.name || 'User'}</td>
                        <td className={tdCls}>{ns.patientId?.phoneNumber || 'N/A'}</td>
                        <td className={tdCls}>{ns.doctorId?.name} ({ns.doctorId?.department})</td>
                        <td className={tdCls}>{ns.date} ({formatTime12h(ns.timeSlot)})</td>
                        <td className={tdCls}>{ns.notes || 'Patient did not attend'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
