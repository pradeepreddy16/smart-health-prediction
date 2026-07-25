import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, AlertTriangle, PhoneCall, ShieldAlert, Heart, Building2, Stethoscope, Pill, Video, Share2, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';

const CATEGORY_COLORS = {
  Hospital: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20', icon: Building2 },
  Clinic: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20', icon: Stethoscope },
  PHC: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', icon: Heart },
  Pharmacy: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20', icon: Pill }
};

export default function MapViewer({ riskLevel = 'Low Risk', userLat = 13.0827, userLng = 80.2707 }) {
  const navigate = useNavigate();
  const [facilities, setFacilities] = useState([]);
  const [searchRadius, setSearchRadius] = useState(20);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [locationSent, setLocationSent] = useState(false);

  useEffect(() => {
    const fetchClinics = async () => {
      try {
        setLoading(true);
        const data = await api.getDoctors();
        const rawList = data.clinics || [];

        // Calculate distance in km from user coords
        let calculated = rawList.map(item => {
          const lat = item.lat || 13.0827;
          const lng = item.lng || 80.2707;
          const d = calculateDistance(userLat, userLng, lat, lng);
          return { ...item, distanceKm: d };
        });

        calculated.sort((a, b) => a.distanceKm - b.distanceKm);

        // Radius check: Check if any results fall within 20 km
        let inside20 = calculated.filter(f => f.distanceKm <= 20);
        let activeRadius = 20;

        if (inside20.length === 0) {
          // Auto-expand search radius: 20 km -> 50 km -> 100 km
          let inside50 = calculated.filter(f => f.distanceKm <= 50);
          if (inside50.length > 0) {
            activeRadius = 50;
            calculated = inside50;
          } else {
            activeRadius = 100;
          }
        } else {
          calculated = inside20;
        }

        setSearchRadius(activeRadius);
        setFacilities(calculated);
        if (calculated.length > 0) {
          setSelectedFacility(calculated[0]);
        }
      } catch (err) {
        console.error('Error loading facilities:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchClinics();
  }, [userLat, userLng]);

  // Haversine formula to compute honest distance
  function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return parseFloat((R * c).toFixed(1));
  }

  const handleNotifyEmergencyContact = () => {
    const mapsLink = `https://maps.google.com/?q=${userLat},${userLng}`;
    const text = encodeURIComponent(`EMERGENCY HEALTH ALERT: I need medical assistance. My live GPS location: ${mapsLink}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
    setLocationSent(true);
    setTimeout(() => setLocationSent(false), 4000);
  };

  const isEmergency = riskLevel.toLowerCase().includes('high') || riskLevel.toLowerCase().includes('emergency');

  const displayedFacilities = activeCategoryFilter === 'All'
    ? facilities
    : facilities.filter(f => (f.type || 'Hospital').toLowerCase() === activeCategoryFilter.toLowerCase());

  return (
    <div className="space-y-4">
      {/* Search Header Banner */}
      <div className="glass-panel rounded-2xl p-4 border border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center space-x-3">
          <div className="bg-medical-600/20 p-2.5 rounded-xl border border-medical-500/30 text-medical-400">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">Nearby Medical Facilities & Hospitals</h3>
            <p className="text-[11px] text-slate-400">GPS location search radius: <strong className="text-white">{searchRadius} km</strong></p>
          </div>
        </div>

        {facilities.length > 0 && facilities[0].distanceKm > 20 && (
          <span className="bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold px-3 py-1.5 rounded-xl">
            Nearest hospital: {facilities[0].distanceKm} km away (Auto-Expanded Radius)
          </span>
        )}
      </div>

      {/* Category Filters Pill Row */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none text-xs">
        {['All', 'Hospital', 'Clinic', 'PHC', 'Pharmacy'].map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategoryFilter(cat)}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all border whitespace-nowrap ${
              activeCategoryFilter === cat
                ? 'bg-medical-600 text-white border-medical-500 shadow-md'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Facilities List Column */}
        <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
          {loading ? (
            <div className="text-center py-12 text-slate-500 text-xs">Locating nearest clinics & hospitals...</div>
          ) : displayedFacilities.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center text-xs text-slate-400">
              No matching {activeCategoryFilter} facilities found within radius.
            </div>
          ) : (
            displayedFacilities.map(fac => {
              const catInfo = CATEGORY_COLORS[fac.type || 'Hospital'] || CATEGORY_COLORS.Hospital;
              const IconComp = catInfo.icon;
              const isSelected = selectedFacility?.id === fac.id;

              return (
                <div
                  key={fac.id}
                  onClick={() => setSelectedFacility(fac)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                    isSelected
                      ? 'bg-slate-900 border-medical-500 shadow-lg'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div className={`p-2 rounded-xl ${catInfo.bg} ${catInfo.text} border ${catInfo.border}`}>
                        <IconComp className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white">{fac.name}</h4>
                        <span className="text-[10px] text-slate-400">{fac.specialty || 'General Care'}</span>
                      </div>
                    </div>

                    <span className="text-[10px] font-extrabold text-white bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-lg whitespace-nowrap shadow-sm">
                      {fac.distanceKm} km away
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 line-clamp-1">{fac.address}</p>

                  <div className="flex items-center justify-between text-[10px] pt-1">
                    <span className="text-yellow-400 font-bold">★ {fac.rating || 4.5}</span>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${fac.lat},${fac.lng}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-medical-400 hover:text-medical-300 font-bold flex items-center space-x-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Navigation className="h-3 w-3" />
                      <span>Directions</span>
                    </a>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Directions, Tips, & Immediate Alternatives Column */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Selected Facility Detail Box */}
          {selectedFacility && (
            <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-base font-extrabold text-white">{selectedFacility.name}</h3>
                  <p className="text-xs text-slate-400">{selectedFacility.address}</p>
                </div>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${selectedFacility.lat},${selectedFacility.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-medical-600 hover:bg-medical-500 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center space-x-2 transition-all shadow-lg"
                >
                  <Navigation className="h-4 w-4" />
                  <span>Navigate Route</span>
                </a>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-xs">
                <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl">
                  <span className="text-[9px] text-slate-500 font-bold uppercase block">Actual Distance</span>
                  <strong className="text-white text-sm">{selectedFacility.distanceKm} km</strong>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl">
                  <span className="text-[9px] text-slate-500 font-bold uppercase block">Estimated Travel ETA</span>
                  <strong className="text-white text-sm">{Math.round(selectedFacility.distanceKm * 2.5)} mins</strong>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl col-span-2 sm:col-span-1">
                  <span className="text-[9px] text-slate-500 font-bold uppercase block">Contact Phone</span>
                  <strong className="text-emerald-400 text-sm">{selectedFacility.contact || '044-28290200'}</strong>
                </div>
              </div>
            </div>
          )}

          {/* 3 Immediate Alternative Actions Card */}
          <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-3 bg-slate-900/90 shadow-xl">
            <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">Immediate Care Alternatives:</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => navigate('/telemedicine')}
                className="bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-400 text-white text-xs font-extrabold py-3.5 px-4 rounded-xl flex flex-col items-center justify-center space-y-1.5 transition-all shadow-lg shadow-sky-500/20 border border-sky-400/30 hover:scale-[1.02] cursor-pointer"
              >
                <Video className="h-4 w-4 text-white" />
                <span>Book Telemedicine Video Call</span>
              </button>

              <button
                onClick={() => setActiveCategoryFilter('Pharmacy')}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-extrabold py-3.5 px-4 rounded-xl flex flex-col items-center justify-center space-y-1.5 transition-all shadow-lg shadow-purple-500/20 border border-purple-400/30 hover:scale-[1.02] cursor-pointer"
              >
                <Pill className="h-4 w-4 text-white" />
                <span>Locate Nearby Pharmacies</span>
              </button>

              <button
                onClick={handleNotifyEmergencyContact}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-extrabold py-3.5 px-4 rounded-xl flex flex-col items-center justify-center space-y-1.5 transition-all shadow-lg shadow-emerald-500/20 border border-emerald-400/30 hover:scale-[1.02] cursor-pointer"
              >
                <Share2 className="h-4 w-4 text-white" />
                <span>{locationSent ? 'Alert Dispatched! ✅' : 'Notify Contact with Live GPS'}</span>
              </button>
            </div>
          </div>

          {/* Tips & Precautions Travel Advisory Card */}
          <div className={`rounded-2xl p-5 border space-y-3 ${
            isEmergency 
              ? 'bg-red-950/40 border-red-900/50 text-red-200' 
              : 'bg-slate-900/60 border-slate-800 text-slate-200'
          }`}>
            <div className="flex items-center space-x-2">
              {isEmergency ? (
                <ShieldAlert className="h-5 w-5 text-red-400 shrink-0" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />
              )}
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                {isEmergency ? 'Emergency Travel Precautions' : 'Self-Care & Travel Guidance'}
              </h4>
            </div>

            {isEmergency ? (
              <div className="space-y-2 text-xs leading-relaxed">
                <p className="font-semibold text-red-300">
                  ⚠️ High Risk Detected: Call National Emergency Ambulance Service immediately if self-driving is unsafe.
                </p>
                <div className="flex items-center space-x-3 bg-red-950 p-3 rounded-xl border border-red-800/40">
                  <PhoneCall className="h-5 w-5 text-red-400 animate-pulse" />
                  <div>
                    <span className="text-[10px] text-red-300 font-bold uppercase block">National Ambulance Service</span>
                    <a href="tel:108" className="text-lg font-black text-white hover:underline">108 (Call Now)</a>
                  </div>
                </div>
                <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px] pt-1">
                  <li>Call ahead to the hospital so emergency room triage staff prepare before arrival.</li>
                  <li>Do NOT self-drive if experiencing chest discomfort, fainting, or severe bleeding.</li>
                  <li>Visit the nearest Primary Health Center (PHC) first if main hospital travel time exceeds 45 mins.</li>
                </ul>
              </div>
            ) : (
              <div className="space-y-2 text-xs leading-relaxed">
                <p className="text-slate-300">
                  Stay hydrated, rest comfortably, and avoid strenuous physical exertion while traveling to your appointment.
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px]">
                  <li>Keep your previous clinical reports and prescriptions handy.</li>
                  <li>Consider booking a Telemedicine video consultation if travel is delayed.</li>
                </ul>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
