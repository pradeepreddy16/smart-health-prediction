import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, Navigation, Phone, Star, ShieldAlert, AlertCircle, PhoneCall, Stethoscope, Car, Landmark, Train, HelpCircle } from 'lucide-react';
import { api } from '../utils/api';

export default function MapViewer({ specialty, riskLevel }) {
  const { t, i18n } = useTranslation();
  const [gpsConsent, setGpsConsent] = useState(true); // Shows explanation modal first
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [locationGranted, setLocationGranted] = useState(false);
  const [coords, setCoords] = useState(null);
  const [manualCity, setManualCity] = useState('');
  
  const [recommendations, setRecommendations] = useState(null);
  const [selectedClinic, setSelectedClinic] = useState(null);
  const [travelMode, setTravelMode] = useState('driving'); // driving, walking, transit

  // Search recommendation
  const fetchRecommendations = async (lat, lng, cityVal) => {
    setLoading(true);
    setError('');
    try {
      const data = await api.recommendDoctors({
        lat,
        lng,
        city: cityVal,
        specialty,
        riskLevel
      });
      setRecommendations(data);
      if (data.clinics && data.clinics.length > 0) {
        setSelectedClinic(data.clinics[0]);
      }
    } catch (err) {
      console.error(err);
      setError('Could not connect to recommendation engine. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestGPS = () => {
    setGpsConsent(false);
    setLoading(true);
    setError('');

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser. Please enter city manually.');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCoords({ lat: latitude, lng: longitude });
        setLocationGranted(true);
        fetchRecommendations(latitude, longitude, null);
      },
      (err) => {
        console.warn("GPS Denied, using manual fallback:", err);
        setError('Location access denied. Please type in your city or postal code below.');
        setLoading(false);
      },
      { timeout: 8000 }
    );
  };

  const handleManualSearch = (e) => {
    e.preventDefault();
    if (!manualCity.trim()) return;
    setCoords(null);
    setLocationGranted(false);
    fetchRecommendations(null, null, manualCity);
  };

  // Pre-trigger on load if user consents
  useEffect(() => {
    // We start by asking user consent
  }, []);

  // Compute mock ETA based on distance and travel mode
  const getETA = (distance, mode) => {
    if (!distance) return { text: "15 mins", value: 15 };
    let speed = 40; // driving speed km/h
    if (mode === 'walking') speed = 5;
    if (mode === 'transit') speed = 25;

    const timeHrs = distance / speed;
    const timeMins = Math.round(timeHrs * 60);

    if (timeMins > 60) {
      const hrs = Math.floor(timeMins / 60);
      const mins = timeMins % 60;
      return `${hrs} hr ${mins} mins`;
    }
    return `${timeMins} mins`;
  };

  return (
    <div className="space-y-6">
      {/* 1. Geolocation Consent Modal */}
      {gpsConsent && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-start space-x-3.5">
            <div className="bg-medical-500/10 text-medical-500 p-2.5 rounded-xl border border-medical-500/25">
              <MapPin className="h-6 w-6" />
            </div>
            <div className="space-y-1.5 flex-1">
              <h3 className="font-semibold text-slate-100">{t('gps.consent_title')}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{t('gps.consent_desc')}</p>
            </div>
          </div>
          <div className="mt-5 flex items-center justify-end space-x-3">
            <button
              onClick={() => { setGpsConsent(false); setError('Please enter city manually.'); }}
              className="text-xs font-semibold text-slate-400 hover:text-white transition-colors px-3 py-2"
            >
              {t('gps.deny_btn')}
            </button>
            <button
              onClick={handleRequestGPS}
              className="bg-medical-600 hover:bg-medical-500 text-white text-xs font-semibold px-4.5 py-2.5 rounded-xl transition-colors shadow-lg shadow-medical-500/20"
            >
              {t('gps.allow_btn')}
            </button>
          </div>
        </div>
      )}

      {/* 2. Manual Fallback Input Form */}
      {!gpsConsent && !locationGranted && (
        <form onSubmit={handleManualSearch} className="bg-slate-900 border border-slate-800 rounded-2xl p-4.5 flex items-center space-x-3 shadow-lg">
          <div className="flex-1 relative">
            <MapPin className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-500" />
            <input
              type="text"
              value={manualCity}
              onChange={(e) => setManualCity(e.target.value)}
              placeholder={t('gps.placeholder_city')}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-200 outline-none focus:border-medical-500 transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white px-5 py-3 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
          >
            {loading ? 'Searching...' : t('gps.find_btn')}
          </button>
        </form>
      )}

      {/* Error state */}
      {error && (
        <div className="bg-red-950/20 border border-red-900/30 rounded-xl p-3 flex items-center space-x-2 text-xs text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 3. Map Split Layout */}
      {recommendations && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Hand: Clinics list + Advisory Card */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Fallback Banner Alert */}
            {recommendations.fallbackTriggered && (
              <div className="bg-amber-950/20 border border-amber-900/30 rounded-2xl p-4 flex items-start space-x-3 text-xs text-amber-400 animate-pulse-subtle">
                <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-semibold">No Clinics Found Within 20 KM</h4>
                  <p className="leading-relaxed">
                    Search radius expanded to <strong>{recommendations.radiusSearched} km</strong>. Displaying closest matching specialist facilities.
                  </p>
                </div>
              </div>
            )}

            {/* Travel Advisory Callout */}
            {recommendations.fallbackTriggered && recommendations.travelAdvisory && (
              <div className="bg-red-950/20 border border-red-900/30 rounded-2xl p-4 space-y-3.5">
                <div className="flex items-center space-x-2 text-red-400 font-bold text-xs uppercase tracking-wider">
                  <PhoneCall className="h-4.5 w-4.5" />
                  <span>{t('gps.travel_advisory')} ({recommendations.travelAdvisory.urgency} URGENCY)</span>
                </div>
                
                <p className="text-xs text-slate-300 font-semibold leading-relaxed">
                  {recommendations.travelAdvisory.primaryTip}
                </p>

                {recommendations.travelAdvisory.urgency === 'HIGH' && (
                  <a
                    href="tel:108"
                    className="flex items-center justify-center space-x-2 w-full bg-red-600 hover:bg-red-500 text-white rounded-xl py-3 font-semibold text-xs tracking-wider transition-colors shadow-lg shadow-red-600/20"
                  >
                    <Phone className="h-4.5 w-4.5 fill-current" />
                    <span>DIAL SOUTH INDIA SOS: 108</span>
                  </a>
                )}

                <div className="border-t border-slate-800 pt-3 space-y-2">
                  {recommendations.travelAdvisory.guidance.map((tip, idx) => (
                    <div key={idx} className="flex items-start space-x-2 text-[11px] text-slate-400 leading-relaxed">
                      <span className="text-red-500 shrink-0 font-bold">•</span>
                      <span>{tip}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-medium">Alternative Immediate Option:</span>
                  <button
                    onClick={() => window.location.href = '/telemedicine'}
                    className="text-medical-500 hover:text-medical-400 font-semibold flex items-center space-x-1.5"
                  >
                    <Stethoscope className="h-3.5 w-3.5" />
                    <span>Telemedicine Booking</span>
                  </button>
                </div>
              </div>
            )}

            {/* List of Hospital Cards */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Recommended Clinics</h3>
              {recommendations.clinics.map((clinic) => (
                <div
                  key={clinic.id}
                  onClick={() => setSelectedClinic(clinic)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col space-y-2.5 ${
                    selectedClinic?.id === clinic.id
                      ? 'bg-slate-900 border-medical-500 shadow-md shadow-medical-500/10'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <h4 className="font-semibold text-sm text-slate-200">{clinic.name}</h4>
                    <span className="bg-medical-500/10 text-medical-500 border border-medical-500/20 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                      {clinic.specialty}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">{clinic.address}</p>

                  <div className="flex items-center justify-between text-xs border-t border-slate-900 pt-2.5">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center text-amber-500 space-x-0.5 font-medium">
                        <Star className="h-3.5 w-3.5 fill-current" />
                        <span>{clinic.rating}</span>
                      </div>
                      <div className="text-slate-500">
                        {clinic.distance} km away
                      </div>
                    </div>
                    
                    {clinic.contact && (
                      <a href={`tel:${clinic.contact}`} className="text-slate-400 hover:text-white flex items-center space-x-1 font-semibold">
                        <Phone className="h-3 w-3" />
                        <span className="text-[10px]">Call</span>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Primary Health Center Section if recommended */}
            {recommendations.nearestPHC && (
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col space-y-2">
                <div className="flex items-center space-x-2 text-xs font-semibold text-sky-400">
                  <Landmark className="h-4 w-4" />
                  <span>{t('gps.phc_option')}</span>
                </div>
                <h4 className="text-xs font-bold text-slate-200">{recommendations.nearestPHC.name}</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">{recommendations.nearestPHC.address}</p>
                <div className="text-[10px] text-slate-500">
                  Distance: {recommendations.nearestPHC.distance} km away • Basic trauma & care stabilization
                </div>
                <button
                  onClick={() => setSelectedClinic(recommendations.nearestPHC)}
                  className="mt-1 flex items-center justify-center space-x-1 border border-slate-800 hover:border-slate-700 hover:bg-slate-900 rounded-lg py-1.5 text-[10px] font-semibold text-slate-300 transition-colors"
                >
                  <Navigation className="h-3 w-3" />
                  <span>Route to PHC</span>
                </button>
              </div>
            )}

          </div>

          {/* Right Hand: Map Visualizer (Beautiful Custom SVG Map) */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-lg h-[460px] flex flex-col relative">
            
            {/* Map Header details */}
            <div className="bg-slate-950 px-4.5 py-3 border-b border-slate-800 flex items-center justify-between z-10">
              <div className="flex items-center space-x-3">
                <Navigation className="h-4.5 w-4.5 text-medical-500" />
                <div>
                  <h4 className="text-xs font-semibold text-slate-200">Route Navigation Overview</h4>
                  {selectedClinic && (
                    <span className="text-[10px] text-slate-400">
                      Destination: {selectedClinic.name} ({selectedClinic.distance} km)
                    </span>
                  )}
                </div>
              </div>
              
              {/* Travel mode selectors */}
              <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 space-x-1">
                <button
                  onClick={() => setTravelMode('driving')}
                  className={`p-1.5 rounded-lg transition-colors ${travelMode === 'driving' ? 'bg-medical-600 text-white' : 'text-slate-400 hover:text-white'}`}
                  title="Driving"
                >
                  <Car className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setTravelMode('transit')}
                  className={`p-1.5 rounded-lg transition-colors ${travelMode === 'transit' ? 'bg-medical-600 text-white' : 'text-slate-400 hover:text-white'}`}
                  title="Public Transit"
                >
                  <Train className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setTravelMode('walking')}
                  className={`p-1.5 rounded-lg transition-colors ${travelMode === 'walking' ? 'bg-medical-600 text-white' : 'text-slate-400 hover:text-white'}`}
                  title="Walking"
                >
                  <Navigation className="h-3.5 w-3.5 rotate-45" />
                </button>
              </div>
            </div>

            {/* Custom Interactive SVG Map Rendering */}
            <div className="flex-1 bg-slate-950 relative flex items-center justify-center overflow-hidden">
              {/* Map background grid pattern */}
              <svg className="absolute inset-0 h-full w-full opacity-10" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                    <path d="M 30 0 L 0 0 0 30" fill="none" stroke="white" strokeWidth="1" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>

              {/* Dotted paths showing routes */}
              {selectedClinic && (
                <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
                  {/* Route path */}
                  <path
                    d="M 120 280 C 180 220, 240 320, 380 180"
                    fill="none"
                    stroke="#0ea5e9"
                    strokeWidth="3.5"
                    strokeDasharray="6, 6"
                    className="stroke-medical-500"
                  />
                  {/* Walking pulse or drive marker movement */}
                  <circle r="6" fill="#0284c7" className="animate-ping">
                    <animateMotion
                      dur="6s"
                      repeatCount="indefinite"
                      path="M 120 280 C 180 220, 240 320, 380 180"
                    />
                  </circle>
                  <circle r="4" fill="#38bdf8">
                    <animateMotion
                      dur="6s"
                      repeatCount="indefinite"
                      path="M 120 280 C 180 220, 240 320, 380 180"
                    />
                  </circle>
                </svg>
              )}

              {/* Coords User Start Pin */}
              <div className="absolute left-[90px] top-[260px] flex flex-col items-center">
                <div className="bg-sky-500 rounded-full h-4 w-4 border-2 border-white shadow-lg animate-pulse" />
                <span className="text-[9px] bg-slate-900 text-slate-300 px-1.5 py-0.5 rounded border border-slate-800 mt-1 shadow font-bold">
                  Your Location
                </span>
              </div>

              {/* Coords Hospital Target Pin */}
              {selectedClinic && (
                <div className="absolute left-[360px] top-[140px] flex flex-col items-center">
                  <MapPin className="h-8 w-8 text-red-500 filter drop-shadow-md animate-bounce" />
                  <span className="text-[9px] bg-slate-900 text-slate-100 px-1.5 py-0.5 rounded border border-slate-800 shadow font-bold max-w-[120px] truncate">
                    {selectedClinic.name}
                  </span>
                </div>
              )}

              {/* Custom Map Compass Card HUD overlay */}
              {selectedClinic && (
                <div className="absolute bottom-4 left-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 max-w-[200px] text-xs space-y-1.5 backdrop-blur shadow-2xl">
                  <div className="font-semibold text-slate-300">Directions ETA</div>
                  <div className="text-lg font-bold text-white tracking-tight">
                    {getETA(selectedClinic.distance, travelMode)}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Distance: <strong>{selectedClinic.distance} km</strong>
                  </div>
                  <div className="text-[10px] text-slate-400 font-semibold capitalize">
                    Mode: {travelMode}
                  </div>
                </div>
              )}
            </div>

            {/* Map footer directions button */}
            {selectedClinic && (
              <div className="bg-slate-950 p-3.5 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 leading-relaxed max-w-[70%]">
                  Google Maps API offline. Rendering system routing matrix path vectors.
                </span>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${selectedClinic.lat},${selectedClinic.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-medical-600 hover:bg-medical-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors shadow flex items-center space-x-1"
                >
                  <Navigation className="h-3.5 w-3.5 fill-current" />
                  <span>Get Directions</span>
                </a>
              </div>
            )}

          </div>

        </div>
      )}
    </div>
  );
}
