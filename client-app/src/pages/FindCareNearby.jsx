import React, { useState } from 'react';
import { MapPin, Navigation, Search, Building2, Stethoscope, Heart, Pill, ShieldCheck, Tag, Droplet, PhoneCall } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import MapViewer from '../components/MapViewer';
import PharmacyPriceComparator from '../components/PharmacyPriceComparator';

export default function FindCareNearby() {
  const { t } = useTranslation();
  const [cityInput, setCityInput] = useState('');
  const [userCoords, setUserCoords] = useState({ lat: 13.0827, lng: 80.2707 }); // Default Chennai
  const [showPharmacyComparator, setShowPharmacyComparator] = useState(false);

  const handleCitySearch = (e) => {
    e.preventDefault();
    const city = cityInput.trim().toLowerCase();
    if (city.includes('bangalore') || city.includes('bengaluru')) {
      setUserCoords({ lat: 12.9716, lng: 77.5946 });
    } else if (city.includes('hyderabad')) {
      setUserCoords({ lat: 17.3850, lng: 78.4867 });
    } else if (city.includes('kochi') || city.includes('cochin')) {
      setUserCoords({ lat: 9.9312, lng: 76.2673 });
    } else {
      setUserCoords({ lat: 13.0827, lng: 80.2707 });
    }
  };

  return (
    <div className="max-w-[1536px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      
      {/* Header Banner */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-gradient-to-r from-slate-900 via-slate-955 to-slate-900 shadow-2xl">
        <div className="space-y-2">
          <div className="flex items-center space-x-3">
            <div className="bg-sky-500/10 p-2 rounded-xl text-sky-400 border border-sky-500/20">
              <MapPin className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-wide">
                {t('nav.find_care')}
              </h1>
              <p className="text-xs text-slate-400">
                Explore nearby hospitals, specialty clinics, primary health centers (PHC), 24/7 pharmacies, and emergency blood donors.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions & Search Input */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <button
            onClick={() => setShowPharmacyComparator(true)}
            type="button"
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold px-4 py-2 rounded-xl shadow transition-all shrink-0 flex items-center gap-1.5"
          >
            <Tag className="w-4 h-4" /> Compare Generic Prices
          </button>

          <form onSubmit={handleCitySearch} className="flex items-center space-x-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="text"
                value={cityInput}
                onChange={(e) => setCityInput(e.target.value)}
                placeholder="Search area (e.g., Adyar, Chennai)..."
                className="w-full bg-white text-slate-900 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs font-semibold outline-none focus:border-sky-500"
              />
            </div>
            <button
              type="submit"
              className="bg-medical-600 hover:bg-medical-500 text-white text-xs font-bold px-4 py-2 rounded-xl shadow transition-all shrink-0"
            >
              Locate
            </button>
          </form>
        </div>
      </div>

      {/* Emergency Blood & Plasma Donor Match Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-3xl bg-slate-900 border-2 border-indigo-500/40 p-5 shadow-xl flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black shadow-lg shadow-indigo-600/30">
              <Droplet className="w-6 h-6 fill-current" />
            </div>
            <div>
              <div className="text-sm font-extrabold text-white">Verified Blood Donors Network</div>
              <div className="text-xs text-slate-300">O-Negative, AB-Negative, A-Negative emergency list</div>
            </div>
          </div>

          <a
            href="tel:108"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-95 shrink-0 flex items-center gap-1"
          >
            <PhoneCall className="w-3.5 h-3.5" /> Call Blood Bank
          </a>
        </div>

        <div className="rounded-3xl bg-slate-900 border-2 border-emerald-500/40 p-5 shadow-xl flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-emerald-500/30">
              <Tag className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm font-extrabold text-white">Generic Medicine Savings Finder</div>
              <div className="text-xs text-slate-300">Save up to 78% with Jan Aushadhi generic equivalents</div>
            </div>
          </div>

          <button
            onClick={() => setShowPharmacyComparator(true)}
            type="button"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-95 shrink-0"
          >
            Compare Now
          </button>
        </div>
      </div>

      {/* Main Interactive Map & Facilities Component */}
      <div className="glass-panel rounded-3xl p-6 border border-slate-800 shadow-2xl bg-slate-900">
        <MapViewer riskLevel="Low Risk" userLat={userCoords.lat} userLng={userCoords.lng} />
      </div>

      {/* Generic Pharmacy Price Comparator Modal */}
      <PharmacyPriceComparator
        isOpen={showPharmacyComparator}
        onClose={() => setShowPharmacyComparator(false)}
      />

    </div>
  );
}

