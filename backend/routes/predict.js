const express = require('express');
const router = express.Router();
const { authenticateToken } = require('./auth');
const aiService = require('../services/aiService');
const pdfService = require('../services/pdfService');
const db = require('../db');

// Run new prediction (Supports both POST / and POST /assess)
const handleAssessPrediction = async (req, res) => {
  try {
    const { name, age, gender, symptoms, vitals, history, patientDetails, familyHistory } = req.body;

    // Handle nested patientDetails shape from frontend PredictForm.jsx
    const pName = name || (patientDetails && patientDetails.name) || req.user.name || 'Patient';
    const pAge = Number(age || (patientDetails && patientDetails.age) || 35);
    const pGender = gender || (patientDetails && patientDetails.gender) || 'Male';
    const pSymptoms = symptoms || [];

    const pVitals = vitals || {
      systolic: 120,
      diastolic: 80,
      sugar: 95,
      temperature: 98.6,
      weight: 70,
      height: 170
    };

    // Call AI analysis service
    const predictionReport = await aiService.predictHealthRisks({
      name: pName,
      age: pAge,
      gender: pGender,
      symptoms: pSymptoms,
      vitals: {
        systolic: Number(pVitals.systolic || 120),
        diastolic: Number(pVitals.diastolic || 80),
        sugar: Number(pVitals.sugar || 95),
        temperature: Number(pVitals.temperature || 98.6),
        weight: Number(pVitals.weight || 70),
        height: Number(pVitals.height || 170)
      },
      history: history || (familyHistory ? JSON.stringify(familyHistory) : "")
    });

    const reportObj = {
      userId: req.user.id,
      patientDetails: {
        name: pName,
        age: pAge,
        gender: pGender,
        bmi: (patientDetails && patientDetails.bmi) || 24.2
      },
      symptoms: pSymptoms,
      familyHistory: familyHistory || {},
      ...predictionReport,
      createdAt: new Date().toISOString()
    };

    // Save prediction record associated with user
    const savedReport = db.insert('reports', reportObj);

    res.status(201).json({
      reportId: savedReport.id,
      ...savedReport
    });
  } catch (error) {
    console.error("Prediction error:", error);
    res.status(500).json({ message: 'Error processing health prediction assessment: ' + error.message });
  }
};

router.post('/', authenticateToken, handleAssessPrediction);
router.post('/assess', authenticateToken, handleAssessPrediction);

// Retrieve logged-in user's report history (Supports GET /history and GET /reports)
const handleGetHistory = (req, res) => {
  try {
    const reports = db.findMany('reports', r => r.userId === req.user.id);
    reports.sort((a, b) => new Date(b.createdAt || b.timestamp || 0) - new Date(a.createdAt || a.timestamp || 0));
    res.json(reports);
  } catch (error) {
    console.error("Fetch history error:", error);
    res.status(500).json({ message: 'Error fetching health report history' });
  }
};

router.get('/history', authenticateToken, handleGetHistory);
router.get('/reports', authenticateToken, handleGetHistory);

// Retrieve single report details (Supports GET /:id and GET /report/:id)
const handleGetReportDetails = (req, res) => {
  try {
    const reportId = req.params.id;
    const report = db.findOne('reports', r => r.id === reportId);
    
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    if (report.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized access to this report' });
    }

    res.json(report);
  } catch (error) {
    console.error("Fetch report error:", error);
    res.status(500).json({ message: 'Error retrieving report details' });
  }
};

router.get('/:id', authenticateToken, handleGetReportDetails);
router.get('/report/:id', authenticateToken, handleGetReportDetails);

// Delete report
const handleDeleteReport = (req, res) => {
  try {
    const reportId = req.params.id;
    const report = db.findOne('reports', r => r.id === reportId);
    if (!report) return res.status(404).json({ message: 'Report not found' });
    if (report.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized action' });
    }
    db.delete('reports', reportId);
    res.json({ message: 'Report deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting report' });
  }
};

router.delete('/:id', authenticateToken, handleDeleteReport);
router.delete('/report/:id', authenticateToken, handleDeleteReport);

// Stream PDF Report
const handleStreamPDF = (req, res) => {
  try {
    const reportId = req.params.id;
    const authHeader = req.headers['authorization'];
    const tokenFromHeader = authHeader && authHeader.split(' ')[1];
    const token = req.query.token || tokenFromHeader;

    let authUser = req.user;
    if (!authUser && token) {
      const jwt = require('jsonwebtoken');
      const JWT_SECRET = process.env.JWT_SECRET || 'smart-health-secret-key-12345';
      try {
        authUser = jwt.verify(token, JWT_SECRET);
      } catch (e) {}
    }

    const report = db.findOne('reports', r => r.id === reportId);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=HealthReport_${reportId}.pdf`);

    pdfService.buildReportPDF(report, res);
  } catch (error) {
    console.error("PDF download error:", error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Failed to generate and download PDF' });
    }
  }
};

router.get('/:id/pdf', handleStreamPDF);
router.get('/report/:id/pdf', handleStreamPDF);

// ── SECURE REPORT LINK SHARING ENDPOINTS ───────────────────────────────────

// Create a secure time-limited share token for a report
router.post('/share', authenticateToken, (req, res) => {
  try {
    const { reportId, expiresInDays = 7 } = req.body;
    if (!reportId) return res.status(400).json({ message: 'reportId is required' });

    const report = db.findOne('reports', r => r.id === reportId);
    if (!report) return res.status(404).json({ message: 'Report not found' });
    if (report.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized action' });
    }

    const token = `sh_tok_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const expiresAt = new Date(Date.now() + Number(expiresInDays) * 24 * 60 * 60 * 1000).toISOString();

    const shareRecord = db.insert('shared_reports', {
      token,
      reportId,
      userId: req.user.id,
      createdAt: new Date().toISOString(),
      expiresAt,
      isRevoked: false
    });

    const host = req.get('host') || 'localhost:5173';
    const protocol = req.protocol || 'http';
    const clientOrigin = req.get('origin') || `${protocol}://${host.replace(':5000', ':5173')}`;
    const shareUrl = `${clientOrigin}/shared-report/${token}`;

    res.status(201).json({
      token,
      shareUrl,
      expiresAt,
      message: 'Secure share link generated successfully'
    });
  } catch (e) {
    console.error('Create share error:', e);
    res.status(500).json({ message: 'Failed to generate secure share link' });
  }
});

// Revoke an active share token
router.post('/revoke-share', authenticateToken, (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: 'Token is required' });

    const share = db.findOne('shared_reports', s => s.token === token);
    if (!share) return res.status(404).json({ message: 'Share token not found' });

    if (share.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized action' });
    }

    db.update('shared_reports', share.id, { isRevoked: true, revokedAt: new Date().toISOString() });
    res.json({ message: 'Share link revoked successfully' });
  } catch (e) {
    console.error('Revoke share error:', e);
    res.status(500).json({ message: 'Failed to revoke share link' });
  }
});

// Get all share links generated for a report
router.get('/shares/:reportId', authenticateToken, (req, res) => {
  try {
    const reportId = req.params.reportId;
    const shares = db.findMany('shared_reports', s => s.reportId === reportId && s.userId === req.user.id);
    res.json(shares);
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch report share history' });
  }
});

// PUBLIC GATED VIEW: Retrieve stripped-down read-only report via share token (NO Auth Required)
router.get('/shared/:token', (req, res) => {
  try {
    const token = req.params.token;
    const share = db.findOne('shared_reports', s => s.token === token);

    if (!share) {
      return res.status(404).json({ message: 'This shared report link does not exist or has been removed.' });
    }

    if (share.isRevoked) {
      return res.status(403).json({ message: 'This shared report link has been revoked by the patient.' });
    }

    if (new Date() > new Date(share.expiresAt)) {
      return res.status(403).json({ message: 'This shared report link has expired.' });
    }

    const report = db.findOne('reports', r => r.id === share.reportId);
    if (!report) {
      return res.status(404).json({ message: 'Report data not found.' });
    }

    // Return stripped-down, safe read-only payload
    res.json({
      reportId: report.id,
      patientDetails: {
        name: report.patientDetails?.name || 'Patient',
        age: report.patientDetails?.age || 35,
        gender: report.patientDetails?.gender || 'Male'
      },
      overallRisk: report.overallRisk || 'Optimal',
      organRisks: report.organRisks || {},
      vitals: report.vitals || {},
      symptoms: report.symptoms || [],
      clinicalRecommendations: report.clinicalRecommendations || [],
      createdAt: report.createdAt || report.timestamp,
      shareExpiresAt: share.expiresAt,
      isReadOnly: true
    });
  } catch (e) {
    console.error('Shared report view error:', e);
    res.status(500).json({ message: 'Failed to load shared report details' });
  }
});

module.exports = router;
