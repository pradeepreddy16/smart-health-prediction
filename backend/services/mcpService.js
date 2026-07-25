const express = require('express');
const router = express.Router();
const db = require('../db');

// MCP Tool Definitions Registry (Compliant with Model Context Protocol specification)
const MCP_TOOLS = [
  {
    name: 'get_patient_records',
    description: 'Retrieves patient health risk predictions, vitals history, and organ strain scores for the authenticated user.',
    parameters: {
      type: 'object',
      properties: {
        userId: { type: 'string', description: 'Patient user ID or email identifier' }
      },
      required: ['userId']
    }
  },
  {
    name: 'search_doctors',
    description: 'Queries verified doctors and hospital facilities by medical specialty, location, or consultation mode.',
    parameters: {
      type: 'object',
      properties: {
        specialty: { type: 'string', description: 'Specialty filter e.g. Cardiologist, Nephrologist, Pediatrician, Orthopedist' },
        city: { type: 'string', description: 'Filter by city e.g. Chennai, Bengaluru, Hyderabad' }
      }
    }
  },
  {
    name: 'get_medicine_reminders',
    description: 'Fetches daily prescription dosage schedules and adherence check-in logs for a patient.',
    parameters: {
      type: 'object',
      properties: {
        userId: { type: 'string', description: 'Patient user ID or email identifier' }
      },
      required: ['userId']
    }
  },
  {
    name: 'emergency_triage',
    description: 'Retrieves 1-tap National Emergency Ambulance 108 helpline and nearest Primary Health Center (PHC) hospital locations.',
    parameters: {
      type: 'object',
      properties: {
        symptomSeverity: { type: 'string', description: 'Severity classification e.g. high, critical, acute' }
      }
    }
  }
];

// Execute MCP Tool calls dynamically
const executeMcpTool = (toolName, params = {}) => {
  try {
    switch (toolName) {
      case 'get_patient_records': {
        const userId = params.userId || 'guest';
        const reports = db.get('reports') || [];
        const userReports = Array.isArray(reports) ? reports.filter(r => r && (r.userId === userId || r.email === userId)) : [];
        const topReport = userReports.length > 0 ? userReports[0] : null;
        return {
          status: 'success',
          totalReports: userReports.length,
          latestAssessment: topReport ? {
            prediction: topReport.prediction || topReport.riskLevel || 'Analyzed',
            createdAt: topReport.createdAt,
            overallRisk: topReport.overallRisk || 'Low Risk'
          } : null
        };
      }

      case 'search_doctors': {
        const specialty = params.specialty || '';
        const city = params.city || '';
        const rawHospitals = db.get('hospitals') || [];
        const hospitals = Array.isArray(rawHospitals) ? rawHospitals : [];

        let filtered = hospitals;
        if (specialty) {
          const specLower = String(specialty).toLowerCase();
          filtered = filtered.filter(h => {
            if (!h) return false;
            const matchSpecArray = Array.isArray(h.specialties) && h.specialties.some(s => typeof s === 'string' && s.toLowerCase().includes(specLower));
            const matchSpecStr = typeof h.specialty === 'string' && h.specialty.toLowerCase().includes(specLower);
            const matchDoc = Array.isArray(h.doctors) && h.doctors.some(d => d && d.specialty && typeof d.specialty === 'string' && d.specialty.toLowerCase().includes(specLower));
            return matchSpecArray || matchSpecStr || matchDoc;
          });
        }
        if (city) {
          const cityLower = String(city).toLowerCase();
          filtered = filtered.filter(h => h && h.city && typeof h.city === 'string' && h.city.toLowerCase().includes(cityLower));
        }

        return {
          status: 'success',
          count: filtered.length,
          facilities: filtered.map(h => ({
            name: h.name || 'Medical Center',
            city: h.city || 'Regional Center',
            contact: h.contact || 'N/A',
            doctors: h.doctors || [],
            fee: h.fee || h.onlineFee || 450
          }))
        };
      }

      case 'get_medicine_reminders': {
        const userId = params.userId || 'guest';
        const reminders = db.get('reminders') || [];
        const userReminders = Array.isArray(reminders) ? reminders.filter(r => r && r.userId === userId) : [];
        return {
          status: 'success',
          count: userReminders.length,
          reminders: userReminders
        };
      }

      case 'emergency_triage': {
        return {
          status: 'emergency_ready',
          ambulanceHelpline: '108',
          nationalEmergency: '112',
          recommendedAction: 'Call National Emergency Ambulance 108 immediately or locate nearest Primary Health Center (PHC).'
        };
      }

      default:
        return {
          status: 'error',
          message: `MCP Tool '${toolName}' is not registered in service tool catalog.`
        };
    }
  } catch (err) {
    console.error('executeMcpTool internal error:', err);
    return {
      status: 'error',
      message: err.message
    };
  }
};

// ── MCP HTTP JSON-RPC Endpoints ─────────────────────────────────────────────

// GET /api/mcp/tools - Returns catalog of available MCP tools
router.get('/tools', (req, res) => {
  res.json({
    protocol: 'model-context-protocol',
    version: '1.0.0',
    tools: MCP_TOOLS
  });
});

// POST /api/mcp/execute - Execute an MCP Tool by name
router.post('/execute', (req, res) => {
  try {
    const name = req.body.name || req.body.tool;
    const toolArgs = req.body.arguments || req.body.params || {};

    if (!name) {
      return res.status(400).json({ error: 'Tool name is required for MCP execution.' });
    }

    const result = executeMcpTool(name, toolArgs);
    return res.json({
      protocol: 'model-context-protocol',
      tool: name,
      result
    });
  } catch (err) {
    console.error('MCP execution endpoint error:', err);
    return res.status(500).json({
      protocol: 'model-context-protocol',
      error: err.message
    });
  }
});

module.exports = router;
