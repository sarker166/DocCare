import React, { useRef, useState } from 'react';
import Modal from './Modal';
import { Printer, Download, Stethoscope, Activity, Calendar, User, Phone, CheckCircle2, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { generatePrescriptionPdf } from '../utils/generatePrescriptionPdf';

export default function PrescriptionViewModal({ isOpen, onClose, prescription }) {
  if (!prescription) return null;

  const doctor = prescription.doctorId || {};
  const patient = prescription.patientId || {};
  const vitals = prescription.vitals || {};
  const medicines = prescription.medicines || [];
  const labTests = prescription.labTests || [];
  const [downloading, setDownloading] = useState(false);

  const handleDownloadPdf = () => {
    try {
      setDownloading(true);
      toast.loading('Generating official PDF prescription...', { id: 'pdf-toast' });
      generatePrescriptionPdf(prescription);
      toast.success('Prescription PDF downloaded successfully! 📄', { id: 'pdf-toast' });
    } catch (err) {
      console.error('PDF generation error:', err);
      toast.error(`PDF Error: ${err.message || 'Unknown crash'}`, { id: 'pdf-toast' });
      handlePrint();
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    const printContent = document.getElementById('printable-prescription');
    if (!printContent) return;

    const printWindow = window.open('', '_blank', 'width=850,height=950');
    if (!printWindow) {
      alert('Please allow popups to print / download the PDF prescription');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Prescription_${prescription.prescriptionNumber}_${patient.name || 'Patient'}</title>
          <style>
            @page {
              size: A4;
              margin: 15mm;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              color: #1a1a1a;
              margin: 0;
              padding: 20px;
              background: #ffffff;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              border-bottom: 2px solid #0d9488;
              padding-bottom: 15px;
              margin-bottom: 20px;
            }
            .hospital-brand {
              display: flex;
              align-items: center;
              gap: 12px;
            }
            .hospital-logo {
              width: 48px;
              height: 48px;
              border-radius: 12px;
              background: #0d9488;
              color: white;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 26px;
              font-weight: bold;
              text-align: center;
              line-height: 48px;
            }
            .hospital-title {
              font-size: 20px;
              font-weight: 800;
              color: #0f172a;
              margin: 0;
            }
            .hospital-sub {
              font-size: 11px;
              color: #64748b;
              margin-top: 2px;
            }
            .doc-info {
              text-align: right;
            }
            .doc-name {
              font-size: 16px;
              font-weight: 700;
              color: #0d9488;
              margin: 0;
            }
            .doc-detail {
              font-size: 11px;
              color: #475569;
              margin-top: 2px;
            }
            .patient-bar {
              display: grid;
              grid-template-columns: 2fr 1fr 1fr 1fr;
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 10px 15px;
              font-size: 12px;
              margin-bottom: 20px;
            }
            .patient-bar div {
              color: #475569;
            }
            .patient-bar strong {
              color: #0f172a;
            }
            .vitals-bar {
              display: flex;
              gap: 20px;
              background: #f0fdfa;
              border: 1px dashed #99f6e4;
              border-radius: 8px;
              padding: 8px 15px;
              font-size: 11px;
              color: #0f766e;
              margin-bottom: 25px;
            }
            .vitals-bar strong {
              color: #115e59;
            }
            .rx-section {
              margin-top: 15px;
            }
            .rx-symbol {
              font-family: Georgia, serif;
              font-size: 28px;
              font-weight: bold;
              color: #0d9488;
              margin-bottom: 10px;
            }
            table.med-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 25px;
            }
            table.med-table th {
              background: #f1f5f9;
              text-align: left;
              padding: 8px 10px;
              font-size: 11px;
              text-transform: uppercase;
              color: #475569;
              border-bottom: 1px solid #cbd5e1;
            }
            table.med-table td {
              padding: 10px;
              font-size: 12px;
              border-bottom: 1px solid #f1f5f9;
              color: #1e293b;
            }
            .med-name {
              font-weight: 700;
              color: #0f172a;
            }
            .advice-box {
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 12px 15px;
              margin-bottom: 20px;
            }
            .advice-box h4 {
              margin: 0 0 6px;
              font-size: 12px;
              color: #0f172a;
              text-transform: uppercase;
            }
            .advice-box p {
              margin: 0;
              font-size: 12px;
              color: #475569;
              line-height: 1.5;
            }
            .footer {
              margin-top: 50px;
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
              padding-top: 20px;
              border-top: 1px solid #e2e8f0;
            }
            .signature-box {
              text-align: center;
              border-top: 1px solid #64748b;
              padding-top: 6px;
              min-width: 180px;
              font-size: 11px;
              color: #64748b;
            }
            .disclaimer {
              font-size: 10px;
              color: #94a3b8;
              max-width: 320px;
              line-height: 1.4;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="hospital-brand">
              <div class="hospital-logo">🩺</div>
              <div>
                <h1 class="hospital-title">DocCare Hospital &amp; Medical Center</h1>
                <div class="hospital-sub">Department of ${doctor.department || 'Specialized Medicine'} • 24/7 Helpline: +1 (555) 100-2000</div>
              </div>
            </div>
            <div class="doc-info">
              <h2 class="doc-name">${doctor.name || 'Doctor'}</h2>
              <div class="doc-detail">${doctor.qualification || 'MBBS, MD'}</div>
              <div class="doc-detail">${doctor.specialization || 'Consultant Specialist'}</div>
              <div class="doc-detail">${doctor.clinicAddress || 'Main Outpatient Clinic'}</div>
            </div>
          </div>

          <div class="patient-bar">
            <div>Patient Name: <strong>${patient.name || 'Patient'}</strong></div>
            <div>Phone: <strong>${patient.phoneNumber || 'N/A'}</strong></div>
            <div>Date: <strong>${new Date(prescription.createdAt).toLocaleDateString()}</strong></div>
            <div>Rx ID: <strong>#${prescription.prescriptionNumber}</strong></div>
          </div>

          ${(vitals.bloodPressure || vitals.pulseRate || vitals.weight || vitals.temperature) ? `
            <div class="vitals-bar">
              ${vitals.bloodPressure ? `<div>BP: <strong>${vitals.bloodPressure}</strong></div>` : ''}
              ${vitals.pulseRate ? `<div>Pulse: <strong>${vitals.pulseRate}</strong></div>` : ''}
              ${vitals.weight ? `<div>Weight: <strong>${vitals.weight}</strong></div>` : ''}
              ${vitals.temperature ? `<div>Temp: <strong>${vitals.temperature}</strong></div>` : ''}
            </div>
          ` : ''}

          ${prescription.diagnosis ? `
            <div style="margin-bottom: 15px; font-size: 12px; color: #475569;">
              <strong>Clinical Diagnosis:</strong> <span style="color: #0f172a; font-weight: 600;">${prescription.diagnosis}</span>
              ${prescription.symptoms ? `<span style="margin-left: 15px;">• Complaints: ${prescription.symptoms}</span>` : ''}
            </div>
          ` : ''}

          <div class="rx-section">
            <div class="rx-symbol">℞</div>
            <table class="med-table">
              <thead>
                <tr>
                  <th style="width: 45%;">Medicine Name</th>
                  <th style="width: 25%;">Dosage &amp; Timing</th>
                  <th style="width: 15%;">Duration</th>
                  <th style="width: 15%;">Instruction</th>
                </tr>
              </thead>
              <tbody>
                ${medicines.map((m, i) => `
                  <tr>
                    <td>
                      <span style="color: #64748b; font-size: 11px;">${i + 1}. </span>
                      <span class="med-name">${m.name}</span>
                    </td>
                    <td><strong>${m.dosage}</strong> • ${m.timing}</td>
                    <td>${m.duration}</td>
                    <td>${m.instructions || '-'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          ${labTests.length > 0 ? `
            <div class="advice-box" style="margin-top: 15px;">
              <h4>Recommended Lab Tests / Investigations</h4>
              <p>${labTests.join(', ')}</p>
            </div>
          ` : ''}

          ${prescription.advice ? `
            <div class="advice-box">
              <h4>Doctor's Advice &amp; Lifestyle Guidance</h4>
              <p>${prescription.advice}</p>
            </div>
          ` : ''}

          ${prescription.followUpDate ? `
            <div style="font-size: 12px; color: #0d9488; font-weight: bold; margin-bottom: 20px;">
              📅 Next Follow-up: ${prescription.followUpDate}
            </div>
          ` : ''}

          <div class="footer">
            <div class="disclaimer">
              This is a legally valid computer-generated electronic prescription issued by a verified medical practitioner on the DocCare Healthcare Network.
            </div>
            <div class="signature-box">
              <strong>${doctor.name || 'Attending Physician'}</strong><br />
              Authorized Electronic Signature
            </div>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 400);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Prescription #${prescription.prescriptionNumber}`}>
      <div className="space-y-5 text-xs max-h-[75vh] overflow-y-auto pr-1">
        <div id="printable-prescription" className="bg-[#111110] border border-white/[0.08] rounded-3xl p-6 space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-white/[0.08] gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-teal-600/20 border border-teal-500/30 text-teal-400 flex items-center justify-center font-bold text-xl">
                <Stethoscope className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">DocCare Medical Center</h3>
                <p className="text-[11px] text-[#888882]">Department of {doctor.department || 'Medicine'}</p>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <h4 className="text-sm font-bold text-teal-400">{doctor.name}</h4>
              <p className="text-[11px] text-[#888882]">{doctor.qualification || 'MBBS, MD'}</p>
              <p className="text-[10px] text-[#555552]">{doctor.specialization} • {doctor.clinicAddress}</p>
            </div>
          </div>

          <div className="bg-[#1a1a18] border border-white/[0.06] rounded-2xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-[10px] text-[#555552] uppercase font-bold block">Patient</span>
              <strong className="text-white text-xs">{patient.name || 'Patient'}</strong>
            </div>
            <div>
              <span className="text-[10px] text-[#555552] uppercase font-bold block">Phone</span>
              <span className="text-[#888882]">{patient.phoneNumber || 'N/A'}</span>
            </div>
            <div>
              <span className="text-[10px] text-[#555552] uppercase font-bold block">Date</span>
              <span className="text-[#888882]">{new Date(prescription.createdAt).toLocaleDateString()}</span>
            </div>
            <div>
              <span className="text-[10px] text-[#555552] uppercase font-bold block">Rx Number</span>
              <span className="font-mono font-bold text-teal-400">#{prescription.prescriptionNumber}</span>
            </div>
          </div>

          {(vitals.bloodPressure || vitals.pulseRate || vitals.weight || vitals.temperature) && (
            <div className="bg-teal-500/[0.06] border border-teal-500/20 rounded-xl p-3 flex flex-wrap gap-4 text-xs text-[#888882]">
              {vitals.bloodPressure && <span>BP: <strong className="text-teal-300">{vitals.bloodPressure}</strong></span>}
              {vitals.pulseRate && <span>Pulse: <strong className="text-teal-300">{vitals.pulseRate}</strong></span>}
              {vitals.weight && <span>Weight: <strong className="text-teal-300">{vitals.weight}</strong></span>}
              {vitals.temperature && <span>Temp: <strong className="text-teal-300">{vitals.temperature}</strong></span>}
            </div>
          )}

          {prescription.diagnosis && (
            <div className="text-xs">
              <span className="text-[#555552] font-semibold">Diagnosis: </span>
              <strong className="text-white">{prescription.diagnosis}</strong>
              {prescription.symptoms && (
                <span className="text-[#888882] ml-2">({prescription.symptoms})</span>
              )}
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center gap-1.5 font-serif font-black text-teal-400 text-lg">
              <span>℞</span>
              <span className="text-xs font-sans font-bold text-white tracking-wider uppercase ml-1">
                Prescribed Medicines
              </span>
            </div>

            <div className="bg-[#1a1a18] border border-white/[0.06] rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#111110] text-[#555552] uppercase text-[10px] font-bold border-b border-white/[0.06]">
                  <tr>
                    <th className="p-3">Medicine</th>
                    <th className="p-3">Dosage</th>
                    <th className="p-3">Timing</th>
                    <th className="p-3">Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {medicines.map((m, idx) => (
                    <tr key={idx} className="hover:bg-white/[0.02]">
                      <td className="p-3 font-bold text-white">{m.name}</td>
                      <td className="p-3 font-semibold text-teal-300">{m.dosage}</td>
                      <td className="p-3 text-[#888882]">{m.timing}</td>
                      <td className="p-3 text-[#888882]">{m.duration}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {labTests.length > 0 && (
            <div className="bg-[#1a1a18] border border-white/[0.06] rounded-xl p-3.5 space-y-1">
              <span className="text-[10px] text-[#555552] uppercase font-bold block">Recommended Investigations</span>
              <p className="text-xs text-teal-300 font-medium">{labTests.join(', ')}</p>
            </div>
          )}

          {prescription.advice && (
            <div className="bg-[#1a1a18] border border-white/[0.06] rounded-xl p-3.5 space-y-1">
              <span className="text-[10px] text-[#555552] uppercase font-bold block">Doctor's Advice</span>
              <p className="text-xs text-[#888882] leading-relaxed">{prescription.advice}</p>
            </div>
          )}

          {prescription.followUpDate && (
            <div className="text-xs text-teal-400 font-semibold flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>Next Follow-up: {prescription.followUpDate}</span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/[0.08]">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl border border-white/[0.08] text-[#888882] hover:text-white hover:bg-white/[0.06] font-semibold text-xs transition-colors"
          >
            Close
          </button>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handlePrint}
              className="py-2.5 px-4 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] text-white font-semibold text-xs transition-colors flex items-center gap-1.5"
              title="Open browser print preview dialog"
            >
              <Printer className="w-4 h-4 text-[#888882]" />
              <span>Print Preview</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={downloading}
              className="py-2.5 px-5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-lg shadow-teal-700/30 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
              title="Instantly download the official prescription as a vector PDF document"
            >
              <Download className="w-4 h-4" />
              <span>{downloading ? 'Downloading...' : 'Download Official PDF'}</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
