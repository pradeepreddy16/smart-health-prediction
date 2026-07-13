const express = require('express');
const router = express.Router();
const { authenticateToken } = require('./auth');
const aiService = require('../services/aiService');
const pdfService = require('../services/pdfService');
const db = require('../db');

// Run new prediction
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, age, gender, symptoms, vitals, history } = req.body;
    
    if (!age || !gender || !vitals) {
      return res.status(400).json({ message: 'Missing required parameters: age, gender, and vitals' });
    }

    // Call AI analysis
    const predictionReport = await aiService.predictHealthRisks({
      name: name || req.user.name,
      age: Number(age),
      gender,
      symptoms: symptoms || [],
      vitals: {
        systolic: Number(vitals.systolic),
        diastolic: Number(vitals.diastolic),
        sugar: Number(vitals.sugar),
        temperature: Number(vitals.temperature),
        weight: Number(vitals.weight),
        height: Number(vitals.height)
      },
      history: history || ""
    });

    // Save prediction record associated with user
    const savedReport = db.insert('reports', {
      userId: req.user.id,
      ...predictionReport
    });

    res.status(201).json(savedReport);
  } catch (error) {
    console.error("Prediction error:", error);
    res.status(500).json({ message: 'Error processing health prediction assessment' });
  }
});

// Retrieve logged-in user's report history
router.get('/history', authenticateToken, (req, res) => {
  try {
    const reports = db.findMany('reports', r => r.userId === req.user.id);
    // Sort reports by date descending
    reports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(reports);
  } catch (error) {
    console.error("Fetch history error:", error);
    res.status(500).json({ message: 'Error fetching health report history' });
  }
});

// Retrieve single report details
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const report = db.findOne('reports', r => r.id === req.params.id);
    
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    // Authorize: Only report owner or Admin can view
    if (report.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized access to this report' });
    }

    res.json(report);
  } catch (error) {
    console.error("Fetch report error:", error);
    res.status(500).json({ message: 'Error retrieving report details' });
  }
});

// Download PDF report
router.get('/:id/pdf', (req, res) => {
  try {
    const reportId = req.params.id;
    // We fetch without authenticateToken header check directly here to support browser triggers, 
    // but check the token via query param as fallback to keep it secure.
    const token = req.query.token;
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized PDF request: token required' });
    }

    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'smart-health-secret-key-12345';
    let authUser;
    
    try {
      authUser = jwt.verify(token, JWT_SECRET);
    } catch (e) {
      return res.status(403).json({ message: 'Invalid or expired download token' });
    }

    const report = db.findOne('reports', r => r.id === reportId);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    if (report.userId !== authUser.id && authUser.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized download' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=HealthReport_${reportId}.pdf`);

    // Stream the PDF directly to Express response
    pdfService.buildReportPDF(report, res);
  } catch (error) {
    console.error("PDF download error:", error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Failed to generate and download PDF' });
    }
  }
});

module.exports = router;
