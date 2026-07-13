const express = require('express');
const router = express.Router();
const { authenticateToken } = require('./auth');
const db = require('../db');

// Helper to calculate distance in KM using Haversine formula
const getDistanceKM = (lat1, lon1, lat2, lon2) => {
  const toRad = (value) => (value * Math.PI) / 180;
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
};

// Retrieve all hospitals (Admin dashboard access)
router.get('/', authenticateToken, (req, res) => {
  const clinics = db.get('clinics');
  res.json(clinics);
});

// GPS / Manual Search Doctor Recommendation Endpoint
router.post('/recommend', authenticateToken, (req, res) => {
  try {
    const { lat, lng, city, specialty, riskLevel } = req.body;
    let clinics = db.get('clinics');

    // Filter by specialty if provided
    if (specialty) {
      clinics = clinics.filter(c => c.specialty.toLowerCase() === specialty.toLowerCase() || c.specialty === 'General Physician');
    }

    let userLat = parseFloat(lat);
    let userLng = parseFloat(lng);

    // Manual entry city coordinates fallback
    if ((isNaN(userLat) || isNaN(userLng)) && city) {
      const cityLower = city.trim().toLowerCase();
      if (cityLower.includes('chennai')) {
        userLat = 13.0827; userLng = 80.2707;
      } else if (cityLower.includes('bangalore') || cityLower.includes('bengaluru')) {
        userLat = 12.9716; userLng = 77.5946;
      } else if (cityLower.includes('hyderabad')) {
        userLat = 17.3850; userLng = 78.4867;
      } else if (cityLower.includes('kochi') || cityLower.includes('cochin')) {
        userLat = 9.9312; userLng = 76.2673;
      } else {
        // Default to a rural location to test fallback radius expansion (e.g. rural South India)
        userLat = 11.5000; userLng = 78.5000; // Rural Tamil Nadu
      }
    }

    // If still no valid location can be parsed, return all specialty matches
    if (isNaN(userLat) || isNaN(userLng)) {
      return res.json({
        clinics: clinics.slice(0, 3),
        locationType: "none",
        fallbackTriggered: false
      });
    }

    // Compute distances for all matched clinics
    let results = clinics.map(c => ({
      ...c,
      distance: getDistanceKM(userLat, userLng, c.lat, c.lng)
    }));

    // Sort by distance ascending
    results.sort((a, b) => a.distance - b.distance);

    // GPS Radius Check (20 km boundary)
    const within20km = results.filter(c => c.distance <= 20);
    
    let responseClinics = [];
    let fallbackTriggered = false;
    let radius = 20;

    if (within20km.length > 0) {
      responseClinics = within20km;
    } else {
      // Fallback protocol: Expand search radius automatically
      fallbackTriggered = true;
      if (results.some(c => c.distance <= 50)) {
        radius = 50;
        responseClinics = results.filter(c => c.distance <= 50);
      } else if (results.some(c => c.distance <= 100)) {
        radius = 100;
        responseClinics = results.filter(c => c.distance <= 100);
      } else {
        radius = 1000; // National/regional scope
        responseClinics = results.slice(0, 3); // Return closest 3 matches
      }
    }

    // Separate clinics and Primary Health Center options
    const finalClinics = responseClinics.filter(c => !c.name.includes("Primary Health Centre"));
    const phcClinics = results.filter(c => c.name.includes("Primary Health Centre") && c.distance <= 100).slice(0, 1);

    // Construct travel safety card tips based on risk levels
    let travelAdvisory = null;
    if (fallbackTriggered) {
      const isUrgent = riskLevel === 'High' || specialty === 'Cardiologist' || specialty === 'Nephrologist';
      
      if (isUrgent) {
        travelAdvisory = {
          urgency: "HIGH",
          emergencyPhone: "108",
          primaryTip: "PRIORITIZE IMMEDIATE ACTION: An emergency ambulance is advised for severe symptoms. Call 108.",
          guidance: [
            "Call ahead to the hospital to inform them of your condition so they are ready upon arrival.",
            phcClinics.length > 0 ? `Consider visiting the nearest Primary Health Center: ${phcClinics[0].name} (${phcClinics[0].distance} km away) for first-aid assessment before a long travel.` : "Visit the nearest local clinic or PHC for immediate first-response stabilization.",
            "Do NOT self-drive if experiencing severe chest pain, numbness, fainting, or major bleeding. Have a relative drive or request an ambulance."
          ],
          telemedicineRecommended: true
        };
      } else {
        travelAdvisory = {
          urgency: "LOW_MEDIUM",
          primaryTip: "Monitor symptoms closely while traveling to the clinic.",
          guidance: [
            "Stay hydrated and avoid heavy exertion.",
            "Bring all current medications and reports with you.",
            "If symptoms worsen, pause at the nearest public clinic."
          ],
          telemedicineRecommended: true
        };
      }
    }

    res.json({
      clinics: finalClinics,
      nearestPHC: phcClinics.length > 0 ? phcClinics[0] : null,
      userLocation: { lat: userLat, lng: userLng },
      radiusSearched: radius,
      fallbackTriggered,
      travelAdvisory
    });
  } catch (error) {
    console.error("Doctor recommend error:", error);
    res.status(500).json({ message: 'Error processing doctor recommendation search' });
  }
});

// Book appointment request
router.post('/appointment', authenticateToken, (req, res) => {
  try {
    const { clinicId, clinicName, date, time, reason } = req.body;
    if (!clinicId || !clinicName || !date || !time) {
      return res.status(400).json({ message: 'Missing appointment details' });
    }

    const appointment = db.insert('appointments', {
      userId: req.user.id,
      userName: req.user.name,
      userEmail: req.user.email,
      clinicId,
      clinicName,
      date,
      time,
      reason: reason || "",
      status: 'pending' // pending, approved, completed, rejected
    });

    res.status(201).json(appointment);
  } catch (error) {
    console.error("Appointment booking error:", error);
    res.status(500).json({ message: 'Error booking appointment request' });
  }
});

module.exports = router;
