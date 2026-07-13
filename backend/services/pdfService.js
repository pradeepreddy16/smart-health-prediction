const PDFDocument = require('pdfkit');

function buildReportPDF(reportData, stream) {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  doc.pipe(stream);

  const { patientDetails, organScores, recommendedSpecialist, overallRisk, timestamp } = reportData;

  // Header Blue Bar
  doc.rect(0, 0, 595.28, 90)
     .fill('#1e3a8a');

  // App Logo Title
  doc.fillColor('#ffffff')
     .fontSize(22)
     .font('Helvetica-Bold')
     .text('SMART HEALTH PREDICTOR', 50, 25);

  doc.fontSize(10)
     .font('Helvetica')
     .text('Personalized AI Health Risk Assessment Report', 50, 52);

  // Date
  const dateStr = new Date(timestamp).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
  doc.fontSize(9)
     .text(`Date Generated: ${dateStr}`, 400, 40, { align: 'right', width: 145 });

  // Move down below header
  doc.y = 120;

  // Section: Patient Details
  doc.fillColor('#1e293b')
     .fontSize(14)
     .font('Helvetica-Bold')
     .text('Patient Summary', 50, doc.y);

  doc.strokeColor('#cbd5e1')
     .lineWidth(1)
     .moveTo(50, doc.y + 5)
     .lineTo(545, doc.y + 5)
     .stroke();

  doc.y += 15;
  const initialY = doc.y;

  // Grid
  doc.fontSize(10).font('Helvetica-Bold').fillColor('#475569');
  doc.text('Name:', 50, initialY);
  doc.text('Age / Gender:', 50, initialY + 20);
  doc.text('Body Mass Index (BMI):', 50, initialY + 40);

  doc.font('Helvetica').fillColor('#0f172a');
  doc.text(patientDetails.name, 180, initialY);
  doc.text(`${patientDetails.age} Years / ${patientDetails.gender}`, 180, initialY + 20);
  doc.text(`${patientDetails.bmi} kg/m² (${patientDetails.vitalsSummary.bmiCategory || 'Normal'})`, 180, initialY + 40);

  doc.font('Helvetica-Bold').fillColor('#475569');
  doc.text('Blood Pressure:', 320, initialY);
  doc.text('Fasting Blood Sugar:', 320, initialY + 20);
  doc.text('Body Temperature:', 320, initialY + 40);

  doc.font('Helvetica').fillColor('#0f172a');
  doc.text(`${patientDetails.vitalsSummary.systolic}/${patientDetails.vitalsSummary.diastolic} mmHg`, 450, initialY);
  doc.text(`${patientDetails.vitalsSummary.sugar} mg/dL`, 450, initialY + 20);
  doc.text(`${patientDetails.vitalsSummary.temperature} °F`, 450, initialY + 40);

  doc.y = initialY + 70;

  // Section: Overall Risk Status
  doc.rect(50, doc.y, 495, 45)
     .fillColor(overallRisk === 'High' ? '#fef2f2' : overallRisk === 'Medium' ? '#fffbeb' : '#f0fdf4')
     .rect(50, doc.y, 495, 45)
     .strokeColor(overallRisk === 'High' ? '#fee2e2' : overallRisk === 'Medium' ? '#fef3c7' : '#dcfce7')
     .fillAndStroke();

  doc.fillColor(overallRisk === 'High' ? '#991b1b' : overallRisk === 'Medium' ? '#92400e' : '#166534')
     .font('Helvetica-Bold')
     .fontSize(11)
     .text(`Overall Risk Rating: ${overallRisk.toUpperCase()}`, 65, doc.y + 10);

  doc.fontSize(9)
     .font('Helvetica')
     .text(`Based on your physiological scores, a consultation with a ${recommendedSpecialist} is advised.`, 65, doc.y + 25);

  doc.y += 65;

  // Section: Organ Health Scores
  doc.fillColor('#1e293b')
     .fontSize(14)
     .font('Helvetica-Bold')
     .text('Organ Health System Scores', 50, doc.y);

  doc.strokeColor('#cbd5e1')
     .lineWidth(1)
     .moveTo(50, doc.y + 5)
     .lineTo(545, doc.y + 5)
     .stroke();

  doc.y += 15;

  // Table Headers
  const tableY = doc.y;
  doc.fontSize(10).font('Helvetica-Bold').fillColor('#475569');
  doc.text('Organ System', 60, tableY);
  doc.text('Score', 240, tableY);
  doc.text('Status', 320, tableY);
  doc.text('Suggested Specialist', 420, tableY);

  doc.strokeColor('#cbd5e1')
     .moveTo(50, tableY + 15)
     .lineTo(545, tableY + 15)
     .stroke();

  let currentY = tableY + 22;

  const organNames = {
    heart: "Heart (Cardiovascular)",
    liver: "Liver System",
    kidney: "Kidney Function",
    thyroid: "Thyroid Balance",
    metabolic: "Metabolic Status",
    blood: "Blood Maintenance"
  };

  const getStatusText = (score) => {
    if (score >= 85) return "OPTIMAL";
    if (score >= 70) return "GOOD";
    if (score >= 50) return "CAUTION";
    return "AT RISK";
  };

  const getStatusColor = (score) => {
    if (score >= 85) return '#166534'; // Green
    if (score >= 70) return '#1d4ed8'; // Blue
    if (score >= 50) return '#c2410c'; // Orange
    return '#b91c1c'; // Red
  };

  const getSpecialist = (organ) => {
    switch (organ) {
      case "heart": return "Cardiologist";
      case "liver": return "Gastroenterologist";
      case "kidney": return "Nephrologist";
      case "thyroid": return "Endocrinologist";
      case "metabolic": return "Endocrinologist";
      default: return "General Physician";
    }
  };

  Object.entries(organScores).forEach(([organ, score]) => {
    doc.fontSize(10).font('Helvetica').fillColor('#0f172a');
    doc.text(organNames[organ] || organ, 60, currentY);
    doc.font('Helvetica-Bold').text(`${score}/100`, 240, currentY);

    const status = getStatusText(score);
    const color = getStatusColor(score);
    
    doc.fillColor(color).text(status, 320, currentY);
    doc.fillColor('#0f172a').font('Helvetica').text(getSpecialist(organ), 420, currentY);

    // Draw bottom row divider line
    doc.strokeColor('#f1f5f9')
       .moveTo(50, currentY + 14)
       .lineTo(545, currentY + 14)
       .stroke();

    currentY += 22;
  });

  doc.y = currentY + 20;

  // Section: Recommendations Disclaimer
  doc.rect(50, doc.y, 495, 65)
     .fillColor('#f8fafc')
     .rect(50, doc.y, 495, 65)
     .strokeColor('#e2e8f0')
     .fillAndStroke();

  doc.fillColor('#475569')
     .font('Helvetica-Bold')
     .fontSize(9)
     .text('CLINICAL ADVISORY & DIRECTIONS', 65, doc.y + 10);

  doc.font('Helvetica')
     .fontSize(8.5)
     .text('• Diet, supplements, and exercise metrics recommendations are loaded in your digital dashboard under the Supplements and Exercise sections.', 65, doc.y + 24)
     .text('• To find nearby clinics for specialists recommended above, use the "GPS Locator" feature inside the app dashboard.', 65, doc.y + 36)
     .text('• Please consult a primary care physician before adding new high-potency vitamins or herbal items to your diet.', 65, doc.y + 48);

  doc.y += 90;

  // Footer Disclaimer
  doc.strokeColor('#cbd5e1')
     .moveTo(50, doc.y)
     .lineTo(545, doc.y)
     .stroke();

  doc.y += 10;

  doc.fillColor('#64748b')
     .font('Helvetica-Oblique')
     .fontSize(8)
     .text('Medical Disclaimer:', 50, doc.y);

  doc.font('Helvetica')
     .text('This report is an AI-generated health risk prediction estimate, not an official medical diagnosis or clinical assessment. You should consult a certified medical practitioner/doctor to discuss these values, get precise blood checks, and receive tailored dosage specifications.', 50, doc.y + 12, { width: 495, align: 'justify' });

  doc.end();
}

module.exports = {
  buildReportPDF
};
