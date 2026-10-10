import React, { useState } from 'react';
import Modal from './Modal';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Plus, Trash2, Stethoscope, Save, FileText, Activity } from 'lucide-react';

const inputCls = "w-full py-2 px-3 bg-[#111110] border border-white/[0.08] rounded-xl text-xs text-white placeholder-[#555552] focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500";
const labelCls = "block text-[11px] font-semibold text-[#888882] mb-1";

export default function PrescriptionModal({ isOpen, onClose, appointment, onPrescriptionSaved }) {
  const [loading, setLoading] = useState(false);
  const [vitals, setVitals] = useState({
    bloodPressure: '120/80',
    pulseRate: '72 bpm',
    weight: '65 kg',
    temperature: '98.4 °F',
  });
  const [diagnosis, setDiagnosis] = useState('');
  const [symptoms, setSymptoms] = useState(appointment?.reason || '');
  const [medicines, setMedicines] = useState([
    { name: '', dosage: '1 + 0 + 1', duration: '7 days', timing: 'After meal', instructions: '' },
  ]);
  const [labTests, setLabTests] = useState('');
  const [advice, setAdvice] = useState('');
  const [followUpDate, setFollowUpDate] = useState('After 7 days');

  const addMedicine = () => {
    setMedicines((prev) => [
      ...prev,
      { name: '', dosage: '1 + 0 + 1', duration: '7 days', timing: 'After meal', instructions: '' },
    ]);
  };

  const removeMedicine = (index) => {
    if (medicines.length <= 1) return;
    setMedicines((prev) => prev.filter((_, i) => i !== index));
  };

  const updateMedicine = (index, field, value) => {
    setMedicines((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validMedicines = medicines.filter((m) => m.name.trim());
    if (validMedicines.length === 0) {
      toast.error('Please add at least one prescribed medicine');
      return;
    }

    setLoading(true);
    try {
      const labTestsArray = labTests
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const payload = {
        appointmentId: appointment._id,
        vitals,
        diagnosis: diagnosis.trim() || 'Clinical Consultation',
        symptoms: symptoms.trim(),
        medicines: validMedicines,
        labTests: labTestsArray,
        advice: advice.trim(),
        followUpDate: followUpDate.trim(),
      };

      const res = await api.post('/prescriptions', payload);
      toast.success('Digital Prescription issued successfully!');
      if (onPrescriptionSaved) {
        onPrescriptionSaved(res.data.prescription);
      }
      onClose();
    } catch (err) {
      const isNetworkErr = !err.response || err.code === 'ERR_NETWORK';
      if (isNetworkErr) {
        // Local storage fallback
        const rxNumber = `RX-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

        // Build full doctor object from appointment (with all fields PDF needs)
        const doctorObj = appointment.doctorId
          ? (typeof appointment.doctorId === 'object' ? appointment.doctorId : { _id: appointment.doctorId, name: 'Doctor', department: '', specialization: '', qualification: '', clinicAddress: '' })
          : { name: 'Doctor', department: '', specialization: '', qualification: '', clinicAddress: '' };

        // Build full patient object from appointment
        const patientObj = appointment.patientId
          ? (typeof appointment.patientId === 'object' ? appointment.patientId : { _id: appointment.patientId, name: 'Patient', phoneNumber: '' })
          : { name: 'Patient', phoneNumber: '' };

        const localRx = {
          _id: `rx_${Date.now()}`,
          prescriptionNumber: rxNumber,
          appointmentId: appointment._id,
          doctorId: doctorObj,
          patientId: patientObj,
          vitals,
          diagnosis: diagnosis.trim() || 'Clinical Consultation',
          symptoms: symptoms.trim(),
          medicines: validMedicines,
          labTests: labTests.split(',').map(t => t.trim()).filter(Boolean),
          advice: advice.trim(),
          followUpDate: followUpDate.trim(),
          createdAt: new Date().toISOString(),
        };
        const storedRx = JSON.parse(localStorage.getItem('doc_local_rx') || '[]');
        storedRx.push(localRx);
        localStorage.setItem('doc_local_rx', JSON.stringify(storedRx));

        // Update appointment status to completed locally
        const localAppts = JSON.parse(localStorage.getItem('doc_local_appts') || '[]');
        const updatedAppts = localAppts.map(a =>
          a._id === appointment._id
            ? { ...a, status: 'completed', hasPrescription: true, prescriptionId: localRx._id }
            : a
        );
        localStorage.setItem('doc_local_appts', JSON.stringify(updatedAppts));

        toast.success('Digital Prescription issued (Local Mode)!');
        if (onPrescriptionSaved) {
          onPrescriptionSaved(localRx);
        }
        onClose();
      } else {
        toast.error(err.response?.data?.message || 'Failed to issue prescription');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!appointment) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Issue Digital Prescription (Rx)">
      <form onSubmit={handleSubmit} className="space-y-5 text-xs max-h-[75vh] overflow-y-auto pr-1">
        <div className="bg-[#111110] border border-white/[0.08] rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <span className="text-[10px] uppercase font-bold text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded-md">
              Patient
            </span>
            <h4 className="text-sm font-bold text-white mt-1">{appointment.patientId?.name || 'Patient'}</h4>
            <p className="text-[11px] text-[#888882]">
              {appointment.patientId?.email} • {appointment.patientId?.phoneNumber || 'No phone'}
            </p>
          </div>
          <div className="text-left sm:text-right text-[11px] text-[#888882]">
            <div>Slot: <strong className="text-white">{appointment.date} ({appointment.timeSlot})</strong></div>
            <div className="text-[10px] text-[#555552] mt-0.5">Chief Complaint: {appointment.reason}</div>
          </div>
        </div>

        <div className="space-y-2">
          <h5 className="font-bold text-white flex items-center gap-1.5 text-xs">
            <Activity className="w-3.5 h-3.5 text-teal-400" /> Patient Vitals
          </h5>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div>
              <label className={labelCls}>Blood Pressure</label>
              <input
                type="text"
                placeholder="120/80 mmHg"
                value={vitals.bloodPressure}
                onChange={(e) => setVitals({ ...vitals, bloodPressure: e.target.value })}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Pulse Rate</label>
              <input
                type="text"
                placeholder="72 bpm"
                value={vitals.pulseRate}
                onChange={(e) => setVitals({ ...vitals, pulseRate: e.target.value })}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Weight</label>
              <input
                type="text"
                placeholder="65 kg"
                value={vitals.weight}
                onChange={(e) => setVitals({ ...vitals, weight: e.target.value })}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Temperature</label>
              <input
                type="text"
                placeholder="98.6 °F"
                value={vitals.temperature}
                onChange={(e) => setVitals({ ...vitals, temperature: e.target.value })}
                className={inputCls}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Clinical Diagnosis</label>
            <input
              type="text"
              required
              placeholder="e.g. Acute Bronchitis, Hypertension Stage 1"
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Symptoms &amp; Observations</label>
            <input
              type="text"
              placeholder="e.g. Dry cough for 4 days, mild sore throat"
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              className={inputCls}
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h5 className="font-bold text-white flex items-center gap-1.5 text-xs">
              <span className="font-serif font-black text-teal-400 text-sm">℞</span> Prescribed Medicines
            </h5>
            <button
              type="button"
              onClick={addMedicine}
              className="py-1 px-2.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 font-semibold text-[11px] flex items-center gap-1 transition-all"
            >
              <Plus className="w-3 h-3" /> Add Medicine
            </button>
          </div>

          <div className="space-y-2.5">
            {medicines.map((med, idx) => (
              <div
                key={idx}
                className="bg-[#111110] border border-white/[0.06] rounded-2xl p-3 space-y-2 relative group"
              >
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                  <div className="sm:col-span-5">
                    <input
                      type="text"
                      required
                      placeholder={`Medicine #${idx + 1} (e.g. Tab. Napa Extra 500mg)`}
                      value={med.name}
                      onChange={(e) => updateMedicine(idx, 'name', e.target.value)}
                      className={inputCls}
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <select
                      value={med.dosage}
                      onChange={(e) => updateMedicine(idx, 'dosage', e.target.value)}
                      className={inputCls}
                    >
                      <option value="1 + 0 + 1">1 + 0 + 1 (Morning + Night)</option>
                      <option value="1 + 1 + 1">1 + 1 + 1 (TDS - 3 times)</option>
                      <option value="1 + 0 + 0">1 + 0 + 0 (Morning only)</option>
                      <option value="0 + 0 + 1">0 + 0 + 1 (Bedtime only)</option>
                      <option value="0 + 1 + 0">0 + 1 + 0 (Noon only)</option>
                      <option value="1 + 1 + 1 + 1">1 + 1 + 1 + 1 (QDS - 4 times)</option>
                      <option value="SOS">SOS (As needed)</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <select
                      value={med.timing}
                      onChange={(e) => updateMedicine(idx, 'timing', e.target.value)}
                      className={inputCls}
                    >
                      <option value="After meal">After meal</option>
                      <option value="Before meal">Before meal</option>
                      <option value="With meal">With meal</option>
                      <option value="Empty stomach">Empty stomach</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2 flex items-center gap-1.5">
                    <input
                      type="text"
                      placeholder="e.g. 7 days"
                      value={med.duration}
                      onChange={(e) => updateMedicine(idx, 'duration', e.target.value)}
                      className={inputCls}
                    />
                    {medicines.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMedicine(idx)}
                        className="p-1.5 text-[#555552] hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors shrink-0"
                        title="Delete medicine row"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Lab Tests / Investigations (comma separated)</label>
            <input
              type="text"
              placeholder="e.g. CBC, Serum Creatinine, Chest X-ray"
              value={labTests}
              onChange={(e) => setLabTests(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Follow-up Instructions</label>
            <input
              type="text"
              placeholder="e.g. After 7 days, or if symptoms persist"
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
              className={inputCls}
            />
          </div>
        </div>

        <div>
          <label className={labelCls}>Doctor's Advice &amp; Lifestyle Guidance</label>
          <textarea
            rows="3"
            placeholder="e.g. Drink 3L water daily, avoid oily food, complete the antibiotic course..."
            value={advice}
            onChange={(e) => setAdvice(e.target.value)}
            className={inputCls + ' resize-none'}
          />
        </div>

        <div className="pt-3 border-t border-white/[0.08] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl border border-white/[0.08] text-[#888882] hover:text-white hover:bg-white/[0.06] font-semibold text-xs transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="py-2.5 px-5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Save &amp; Complete Visit</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
