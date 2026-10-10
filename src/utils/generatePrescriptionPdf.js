import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generatePrescriptionPdf = (prescription) => {
  if (!prescription) return;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const doctor = prescription.doctorId || {};
  const patient = prescription.patientId || {};
  const vitals = prescription.vitals || {};
  const medicines = prescription.medicines || [];
  const labTests = prescription.labTests || [];

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  doc.setFillColor(13, 148, 136);
  doc.rect(0, 0, pageWidth, 5, 'F');

  let currentY = 16;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42);
  doc.text('DocCare Hospital & Medical Center', margin, currentY);

  currentY += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Department of ${doctor.department || 'Specialized Medicine'}  •  24/7 Emergency: +880 1915-997662`,
    margin,
    currentY
  );

  const rightX = pageWidth - margin;
  let docY = 15;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(13, 148, 136);
  doc.text(doctor.name || 'Attending Physician', rightX, docY, { align: 'right' });

  docY += 4.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  if (doctor.qualification) {
    doc.text(doctor.qualification, rightX, docY, { align: 'right' });
    docY += 4;
  }
  if (doctor.specialization) {
    doc.text(doctor.specialization, rightX, docY, { align: 'right' });
    docY += 4;
  }
  if (doctor.clinicAddress) {
    doc.text(doctor.clinicAddress, rightX, docY, { align: 'right' });
  }

  currentY = Math.max(currentY + 6, docY + 4);

  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.5);
  doc.line(margin, currentY, rightX, currentY);
  currentY += 6;

  const boxHeight = 16;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, currentY, contentWidth, boxHeight, 2, 2, 'FD');

  const colWidth = contentWidth / 4;
  const pY = currentY + 5.5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('PATIENT NAME', margin + 3, pY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text(patient.name || 'Patient', margin + 3, pY + 5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('PHONE / CONTACT', margin + colWidth + 3, pY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  doc.text(patient.phoneNumber || 'N/A', margin + colWidth + 3, pY + 5);

  const dateStr = prescription.createdAt
    ? new Date(prescription.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : new Date().toLocaleDateString();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('PRESCRIPTION DATE', margin + colWidth * 2 + 3, pY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  doc.text(dateStr, margin + colWidth * 2 + 3, pY + 5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('PRESCRIPTION ID', margin + colWidth * 3 + 3, pY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(13, 148, 136);
  doc.text(`#${prescription.prescriptionNumber || 'RX-MED'}`, margin + colWidth * 3 + 3, pY + 5);

  currentY += boxHeight + 4;

  const hasVitals = vitals.bloodPressure || vitals.pulseRate || vitals.weight || vitals.temperature;
  if (hasVitals) {
    doc.setFillColor(240, 253, 250);
    doc.setDrawColor(153, 246, 228);
    doc.roundedRect(margin, currentY, contentWidth, 9, 1.5, 1.5, 'FD');

    let vX = margin + 4;
    doc.setFontSize(8);

    if (vitals.bloodPressure) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 118, 110);
      doc.text('BP: ', vX, currentY + 6);
      vX += 7;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(19, 78, 74);
      doc.text(`${vitals.bloodPressure} mmHg    `, vX, currentY + 6);
      vX += doc.getTextWidth(`${vitals.bloodPressure} mmHg    `) + 5;
    }

    if (vitals.pulseRate) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 118, 110);
      doc.text('Pulse: ', vX, currentY + 6);
      vX += 11;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(19, 78, 74);
      doc.text(`${vitals.pulseRate} bpm    `, vX, currentY + 6);
      vX += doc.getTextWidth(`${vitals.pulseRate} bpm    `) + 5;
    }

    if (vitals.weight) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 118, 110);
      doc.text('Weight: ', vX, currentY + 6);
      vX += 13;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(19, 78, 74);
      doc.text(`${vitals.weight} kg    `, vX, currentY + 6);
      vX += doc.getTextWidth(`${vitals.weight} kg    `) + 5;
    }

    if (vitals.temperature) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 118, 110);
      doc.text('Temp: ', vX, currentY + 6);
      vX += 11;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(19, 78, 74);
      doc.text(`${vitals.temperature} °F`, vX, currentY + 6);
    }

    currentY += 13;
  }

  if (prescription.diagnosis || prescription.symptoms) {
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    const diagHeight = prescription.symptoms ? 14 : 10;
    doc.roundedRect(margin, currentY, contentWidth, diagHeight, 1.5, 1.5, 'FD');

    let dY = currentY + 6;
    if (prescription.diagnosis) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      doc.text('DIAGNOSIS:', margin + 4, dY);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(prescription.diagnosis, margin + 28, dY);
    }

    if (prescription.symptoms) {
      dY += 5;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text('COMPLAINTS:', margin + 4, dY);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      doc.text(prescription.symptoms, margin + 28, dY);
    }

    currentY += diagHeight + 5;
  }

  doc.setFont('times', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(13, 148, 136);
  doc.text('Rx', margin, currentY + 5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('PRESCRIBED MEDICINES', margin + 12, currentY + 4);

  currentY += 8;

  const tableData = medicines.map((m, idx) => [
    idx + 1,
    m.name || 'Medicine',
    `${m.dosage || ''}\n${m.timing || ''}`.trim(),
    m.duration || '-',
    m.instructions || '-',
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['#', 'Medicine Name', 'Dosage & Timing', 'Duration', 'Instructions']],
    body: tableData.length > 0 ? tableData : [['-', 'No medications listed', '-', '-', '-']],
    theme: 'plain',
    margin: { left: margin, right: margin },
    headStyles: {
      fillColor: [241, 245, 249],
      textColor: [51, 65, 85],
      fontSize: 8.5,
      fontStyle: 'bold',
      halign: 'left',
      cellPadding: 3,
    },
    bodyStyles: {
      textColor: [30, 41, 59],
      fontSize: 8.5,
      cellPadding: 3.5,
      lineColor: [241, 245, 249],
      lineWidth: 0.3,
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center', textColor: [148, 163, 184] },
      1: { cellWidth: 65, fontStyle: 'bold', textColor: [15, 23, 42] },
      2: { cellWidth: 45 },
      3: { cellWidth: 28 },
      4: { cellWidth: 'auto' },
    },
    alternateRowStyles: {
      fillColor: [250, 250, 250],
    },
  });

  currentY = doc.lastAutoTable.finalY + 6;

  if (labTests && labTests.length > 0) {
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, currentY, contentWidth, 12, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 118, 110);
    doc.text('RECOMMENDED INVESTIGATIONS / LAB TESTS:', margin + 4, currentY + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    doc.text(labTests.join('   •   '), margin + 4, currentY + 9);

    currentY += 16;
  }

  if (prescription.advice) {
    const adviceLines = doc.splitTextToSize(prescription.advice, contentWidth - 8);
    const boxH = Math.max(14, adviceLines.length * 4.5 + 8);

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, currentY, contentWidth, boxH, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text("DOCTOR'S ADVICE & GUIDANCE:", margin + 4, currentY + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    doc.text(adviceLines, margin + 4, currentY + 9.5);

    currentY += boxH + 4;
  }

  if (prescription.followUpDate) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(13, 148, 136);
    doc.text(`Follow-up Date: ${prescription.followUpDate}`, margin, currentY + 4);
    currentY += 8;
  }

  const footerY = Math.max(currentY + 10, pageHeight - 28);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  const disclaimerText = [
    'This is an official computer-generated electronic medical prescription (Rx).',
    'Issued by a verified practitioner on DocCare Hospital Healthcare System.',
  ];
  doc.text(disclaimerText, margin, footerY + 5);

  const sigX = pageWidth - margin - 50;
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.4);
  doc.line(sigX - 10, footerY + 4, pageWidth - margin, footerY + 4);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(doctor.name || 'Doctor', (sigX - 10 + pageWidth - margin) / 2, footerY + 8, {
    align: 'center',
  });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('Authorized Electronic Signature', (sigX - 10 + pageWidth - margin) / 2, footerY + 11.5, {
    align: 'center',
  });

  doc.setFillColor(13, 148, 136);
  doc.rect(0, pageHeight - 3, pageWidth, 3, 'F');

  const safePatient = (patient.name || 'Patient').replace(/[^a-zA-Z0-9]/g, '_');
  const safeRxNum = prescription.prescriptionNumber || 'DocCare';
  const fileName = `Prescription_${safeRxNum}_${safePatient}.pdf`;

  doc.save(fileName);
  return doc;
};
