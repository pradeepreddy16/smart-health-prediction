import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Heart, Shield, Clock, CheckCircle, FileDown, MapPin, 
  ChevronDown, ChevronUp, Stethoscope, MessageCircle, Menu
} from 'lucide-react';
import { api } from '../utils/api';
import MapViewer from '../components/MapViewer';

export default function ReportDashboard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [animated, setAnimated] = useState(false);
  const [expandedOrgan, setExpandedOrgan] = useState(null);
  const [activeTab, setActiveTab] = useState('organs'); // organs, risks, bio_age, supplements, exercise, syndromes
  const [menuOpen, setMenuOpen] = useState(false);

  const mapRef = useRef(null);

  // Load report data
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await api.getReportDetails(id);
        setReport(data);
        // Start animation after a brief delay
        setTimeout(() => setAnimated(true), 150);
      } catch (err) {
        console.error(err);
        setError('Unauthorized or unable to retrieve clinical health assessment.');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  // Color mappings based on score
  const getStatusColor = (score) => {
    if (score >= 85) return { bg: 'bg-emerald-500', text: 'text-emerald-400', label: t('report.optimal'), border: 'border-emerald-950/30' };
    if (score >= 70) return { bg: 'bg-blue-500', text: 'text-blue-400', label: t('report.good'), border: 'border-blue-950/30' };
    if (score >= 50) return { bg: 'bg-amber-500', text: 'text-amber-400', label: t('report.caution'), border: 'border-amber-950/30' };
    return { bg: 'bg-red-500', text: 'text-red-400', label: t('report.at_risk'), border: 'border-red-950/30' };
  };

  // Scroll to Map locator
  const scrollToMap = () => {
    mapRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDownloadPDF = () => {
    const url = api.getReportPdfUrl(id);
    // Trigger download in new tab or direct window trigger
    window.open(url, '_blank');
  };

  if (loading) {
    return <div className="text-center py-24 text-slate-500 text-sm">Generating and loading report parameters...</div>;
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto my-12 glass-panel rounded-2xl p-6 border border-red-900/30 text-center space-y-4">
        <div className="text-red-400 text-sm font-semibold">{error}</div>
        <button onClick={() => navigate('/dashboard')} className="bg-slate-800 text-slate-200 px-4 py-2 rounded-xl text-xs">
          Back to Dashboard
        </button>
      </div>
    );
  }

  const { patientDetails, organScores, overallRisk, recommendedSpecialist, createdAt, timestamp } = report;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8 animate-fade-in relative">
      
      {/* 1. Header Row */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-5">
        <div className="flex items-center space-x-3.5">
          <div className="bg-medical-600 rounded-xl p-2.5 flex items-center justify-center text-white shadow-lg shadow-medical-500/20">
            <Heart className="h-6 w-6 fill-current animate-pulse-subtle" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white tracking-wide">Smart Health Report</h1>
            <p className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase">Clinical Risk Profile</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleDownloadPDF}
            className="bg-slate-900 border border-slate-700 hover:border-slate-600 text-slate-200 px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all hover:bg-slate-850"
          >
            <FileDown className="h-4 w-4" />
            <span className="hidden sm:inline">Download PDF</span>
          </button>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="bg-slate-900 border border-slate-700 hover:border-slate-600 text-slate-200 p-2.5 rounded-xl transition-all hover:bg-slate-850 flex items-center justify-center"
            title="Navigation Menu"
            id="report-hamburger-btn"
          >
            <Menu className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 2. Trust Badges Row */}
      <div className="flex flex-wrap gap-2.5 border-b border-slate-900 pb-4">
        <div className="flex items-center space-x-1.5 bg-slate-900/80 border border-slate-800 rounded-full px-3.5 py-1.5 text-[10px] font-semibold text-slate-300">
          <Heart className="h-3.5 w-3.5 text-medical-500" />
          <span>{t('badges.biomarkers')}</span>
        </div>
        <div className="flex items-center space-x-1.5 bg-slate-900/80 border border-slate-800 rounded-full px-3.5 py-1.5 text-[10px] font-semibold text-slate-300">
          <Shield className="h-3.5 w-3.5 text-emerald-500" />
          <span>{t('badges.indices')}</span>
        </div>
        <div className="flex items-center space-x-1.5 bg-slate-900/80 border border-slate-800 rounded-full px-3.5 py-1.5 text-[10px] font-semibold text-slate-300">
          <Clock className="h-3.5 w-3.5 text-amber-500" />
          <span>{t('badges.delivery')}</span>
        </div>
        <div className="flex items-center space-x-1.5 bg-slate-900/80 border border-slate-800 rounded-full px-3.5 py-1.5 text-[10px] font-semibold text-slate-300">
          <CheckCircle className="h-3.5 w-3.5 text-blue-500" />
          <span>{t('badges.labs')}</span>
        </div>
      </div>

      {/* 3. Main Report Card */}
      <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
        {/* Card Header */}
        <div className="bg-slate-900/60 border-b border-slate-800 px-6 py-4.5 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
          <h2 className="font-extrabold text-slate-100 text-sm tracking-wide">Physiological Biometric Analysis</h2>
          <span className="text-[10px] text-slate-400 font-semibold bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
            {t('report.generated_on')}: {new Date(createdAt || timestamp).toLocaleDateString()}
          </span>
        </div>

        {/* Patient Summary Panel */}
        <div className="p-6 border-b border-slate-900 bg-slate-950/30 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div className="space-y-1">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{t('report.patient_summary')}</p>
            <p className="text-base font-bold text-white">
              {patientDetails.name} <span className="text-slate-400 font-medium">({patientDetails.gender} · {patientDetails.age} yrs · BMI {patientDetails.bmi})</span>
            </p>
          </div>
          <span className="bg-medical-500/10 text-medical-500 border border-medical-500/20 text-[10px] font-bold px-3 py-1.5 rounded-full">
            {t('report.panels', { count: Object.keys(organScores).length })}
          </span>
        </div>

        {/* Card Body Tabs Navigation */}
        <div className="border-b border-slate-900 bg-slate-950/20 flex flex-wrap px-4 py-2 gap-1.5">
          {Object.entries(t('report.tabs', { returnObjects: true })).map(([key, label]) => {
            const isActive = activeTab === key;
            return (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`text-[10px] font-bold px-4 py-2 rounded-xl transition-all uppercase tracking-wider ${
                  isActive
                    ? 'bg-medical-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 border border-transparent hover:border-slate-850'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Dynamic Card Content Area */}
        <div className="p-6">
          
          {/* TAB 1: ORGANS LIST */}
          {activeTab === 'organs' && (
            <div className="space-y-5">
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2">SYSTEMIC ORGAN RATINGS</div>
              <div className="space-y-3">
                {Object.entries(organScores).map(([organ, score]) => {
                  const status = getStatusColor(score);
                  const isExpanded = expandedOrgan === organ;
                  
                  return (
                    <div key={organ} className="border border-slate-900 rounded-2xl overflow-hidden bg-slate-950/10 hover:bg-slate-950/40 transition-colors">
                      {/* Main Organ Row */}
                      <div
                        onClick={() => setExpandedOrgan(isExpanded ? null : organ)}
                        className="p-4 flex items-center justify-between cursor-pointer select-none"
                      >
                        {/* Left Side: status dot + name */}
                        <div className="flex items-center space-x-3 w-[150px] sm:w-[220px]">
                          <span className={`h-3 w-3 rounded-full ${status.bg} shrink-0 animate-pulse-subtle`} />
                          <span className="font-semibold text-xs text-slate-200">{t(`organs.${organ}`)}</span>
                        </div>

                        {/* Middle: Progress Bar */}
                        <div className="flex-1 max-w-[280px] hidden sm:block mx-4">
                          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-900">
                            <div
                              className={`${status.bg} h-full rounded-full transition-all duration-[1200ms] ease-out`}
                              style={{ width: animated ? `${score}%` : '0%' }}
                            />
                          </div>
                        </div>

                        {/* Right: Numeric Score & Status */}
                        <div className="flex items-center space-x-4">
                          <span className="font-extrabold text-xs text-slate-100">{score}</span>
                          <span className={`text-[9px] font-bold uppercase w-16 px-1.5 py-0.5 rounded text-center border ${status.border} ${status.text}`}>
                            {status.label}
                          </span>
                          {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                        </div>
                      </div>

                      {/* Expandable Description Details */}
                      {isExpanded && (
                        <div className="px-11 pb-4.5 pt-1 border-t border-slate-900/60 space-y-3.5 text-xs text-slate-400 leading-relaxed">
                          <p>
                            We checked values for this subsystem against symptom markers. A score of <strong>{score}/100</strong> represents a status of <strong>{status.label}</strong>.
                          </p>
                          <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-3.5 space-y-2.5">
                            <div>
                              <strong className="text-slate-300 font-semibold">Recommended Foods:</strong>
                              <p className="text-[11px] mt-0.5">{t(`foods.${organ}`)}</p>
                            </div>
                            <div>
                              <strong className="text-slate-300 font-semibold">Target Activity/Exercise:</strong>
                              <p className="text-[11px] mt-0.5">{t(`exercises.${organ}`)}</p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between pt-1 text-[11px]">
                            <span className="text-slate-500 font-medium">Recommended Specialist: <strong>{status.specialty}</strong></span>
                            <button
                              onClick={scrollToMap}
                              className="text-medical-500 hover:text-medical-400 font-semibold flex items-center space-x-1"
                            >
                              <MapPin className="h-3 w-3" />
                              <span>Find Doctor</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: CLINICAL RISK INDICES */}
          {activeTab === 'risks' && (
            <div className="space-y-4 max-w-xl">
              <h3 className="font-bold text-xs text-slate-200">Physiological Biomarker Indices</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{t('report.risk_indices_text')}</p>
              
              <div className="grid grid-cols-2 gap-4 pt-3.5 text-xs">
                <div className="bg-slate-950/40 border border-slate-800 p-3 rounded-xl">
                  <span className="text-slate-500">Cardiovascular Risk Score</span>
                  <p className="text-lg font-bold text-sky-400 mt-1">{organScores.heart}%</p>
                </div>
                <div className="bg-slate-950/40 border border-slate-800 p-3 rounded-xl">
                  <span className="text-slate-500">Metabolic/Insulin Index</span>
                  <p className="text-lg font-bold text-emerald-400 mt-1">{organScores.metabolic}%</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: BIO AGE */}
          {activeTab === 'bio_age' && (
            <div className="space-y-4 max-w-xl">
              <h3 className="font-bold text-xs text-slate-200">Biological Vital Age Analysis</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{t('report.bio_age_text')}</p>
              
              <div className="bg-slate-950/40 border border-slate-800 p-5 rounded-2xl inline-flex items-center space-x-6 mt-2">
                <div className="text-center">
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest">Chronological</span>
                  <p className="text-2xl font-bold text-white mt-1">{patientDetails.age} Yrs</p>
                </div>
                <div className="h-8 w-px bg-slate-800" />
                <div className="text-center">
                  <span className="text-[10px] text-sky-500 uppercase tracking-widest font-semibold">Estimated Bio-Age</span>
                  <p className="text-2xl font-bold text-sky-400 mt-1">
                    {Math.round(patientDetails.age + (50 - (organScores.metabolic + organScores.heart)/2) * 0.1)} Yrs
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SUPPLEMENTS */}
          {activeTab === 'supplements' && (
            <div className="space-y-6">
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">SUGGESTED NUTRITIONAL SUPPLEMENTS</div>
              
              {/* Warnings and Disclaimers */}
              <div className="bg-amber-950/20 border border-amber-900/30 rounded-2xl p-4.5 text-xs text-amber-400 leading-relaxed space-y-1.5 max-w-2xl">
                <div className="flex items-center space-x-2 font-bold uppercase tracking-wide">
                  <Shield className="h-4.5 w-4.5" />
                  <span>Clinical Safety Disclaimer</span>
                </div>
                <p>{t('app.consult_disclaimer')}</p>
              </div>

              <div className="space-y-3.5">
                {Object.entries(organScores).map(([organ, score]) => {
                  const status = getStatusColor(score);
                  const showDoctorLink = score < 85;
                  
                  return (
                    <div key={organ} className="p-4 bg-slate-950/40 border border-slate-800 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3.5 sm:space-y-0">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-xs text-slate-200">{t(`organs.${organ}`)}</span>
                          <span className={`text-[9px] font-bold border rounded px-1.5 uppercase ${status.text} ${status.border}`}>{status.label}</span>
                        </div>
                        <p className="text-xs text-slate-300 font-medium pt-1">
                          Nutrient Suggestions: <strong className="text-sky-400 font-semibold">{t(`supplements.${organ}`)}</strong>
                        </p>
                      </div>

                      {showDoctorLink && (
                        <button
                          onClick={scrollToMap}
                          className="bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-700 hover:border-slate-600 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors"
                        >
                          <Stethoscope className="h-3.5 w-3.5 text-medical-500" />
                          <span>{t('report.find_doctor')}</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 5: EXERCISE */}
          {activeTab === 'exercise' && (
            <div className="space-y-5">
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">TAILORED ACTIVITY RECOMMENDATIONS</div>
              
              <div className="space-y-3">
                {Object.entries(organScores).map(([organ, score]) => {
                  const status = getStatusColor(score);
                  return (
                    <div key={organ} className="p-4 bg-slate-950/40 border border-slate-800 rounded-2xl space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-xs text-slate-200">{t(`organs.${organ}`)}</span>
                        <span className={`text-[9px] font-bold border rounded px-1.5 uppercase ${status.text} ${status.border}`}>{status.label}</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {t(`exercises.${organ}`)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 6: SYNDROMES */}
          {activeTab === 'syndromes' && (
            <div className="space-y-4 max-w-xl">
              <h3 className="font-bold text-xs text-slate-200">Systemic & Metabolic Syndrome Screenings</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{t('report.syndromes_text')}</p>
              
              <div className="bg-slate-950/40 border border-slate-800 p-4.5 rounded-2xl text-xs space-y-2.5">
                <div className="flex justify-between items-center text-slate-300">
                  <span>Metabolic Syndrome Indicators</span>
                  <span className={`font-bold ${organScores.metabolic < 70 ? 'text-amber-500' : 'text-slate-400'}`}>
                    {organScores.metabolic < 70 ? 'Caution Triggered' : 'Unflagged'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span>Cardiovascular Load Tension</span>
                  <span className={`font-bold ${organScores.heart < 70 ? 'text-amber-500' : 'text-slate-400'}`}>
                    {organScores.heart < 70 ? 'Elevated Strain' : 'Unflagged'}
                  </span>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* 4. Stats Footer Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-panel p-4.5 rounded-2xl border border-slate-800 text-center space-y-1">
          <p className="text-2xl font-black text-sky-400">{t('report.stats.biomarkers_val')}</p>
          <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">{t('report.stats.biomarkers')}</p>
        </div>
        <div className="glass-panel p-4.5 rounded-2xl border border-slate-800 text-center space-y-1">
          <p className="text-2xl font-black text-sky-400">{t('report.stats.indices_val')}</p>
          <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">{t('report.stats.indices')}</p>
        </div>
        <div className="glass-panel p-4.5 rounded-2xl border border-slate-800 text-center space-y-1">
          <p className="text-2xl font-black text-sky-400">{t('report.stats.organs_val')}</p>
          <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">{t('report.stats.organs')}</p>
        </div>
        <div className="glass-panel p-4.5 rounded-2xl border border-slate-800 text-center space-y-1">
          <p className="text-2xl font-black text-sky-400">{t('report.stats.report_pages_val')}</p>
          <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">{t('report.stats.report_pages')}</p>
        </div>
      </div>

      {/* 5. Google Maps / GPS Locator Widget */}
      <div ref={mapRef} className="border-t border-slate-900 pt-8 space-y-4">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-slate-200 tracking-wide flex items-center space-x-2">
            <MapPin className="h-5 w-5 text-medical-500" />
            <span>GPS Doctor Recommendation & Directions</span>
          </h2>
          <p className="text-xs text-slate-500">
            Location-based hospital locator. Integrates automatic radius expanding.
          </p>
        </div>

        <MapViewer specialty={recommendedSpecialist} riskLevel={overallRisk} />
      </div>

      {/* 6. Medical Disclaimer Alert Bar */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-5 text-center text-xs text-slate-500 max-w-3xl mx-auto leading-relaxed">
        <strong>Medical Disclaimer</strong>: {t('app.disclaimer')}
      </div>

      {/* 7. Floating Action Button (WhatsAppFAB) */}
      <a
        href="https://wa.me/911234567890?text=Hi,%20I%20have%20a%20question%2520about%20my%2520Smart%2520Health%20Report"
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-6 right-6 z-40 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full p-4 shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center border border-emerald-500"
        title={t('report.whats_app_support')}
      >
        <MessageCircle className="h-6 w-6 fill-current" />
      </a>

      {/* 8. Local Sidebar Drawer Menu overlay */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm" onClick={() => setMenuOpen(false)}>
          <div 
            className="fixed top-0 right-0 h-full w-64 bg-slate-900 border-l border-slate-800 p-6 flex flex-col space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <span className="font-extrabold text-slate-200 text-sm tracking-wide">Report Menu</span>
              <button onClick={() => setMenuOpen(false)} className="text-slate-400 hover:text-white font-bold text-xs uppercase">
                Close
              </button>
            </div>
            
            <div className="flex flex-col space-y-4 text-xs font-semibold">
              <button
                onClick={() => { setMenuOpen(false); navigate('/dashboard'); }}
                className="w-full text-left p-3 bg-slate-950 border border-slate-850 hover:border-slate-700 rounded-xl transition-all text-slate-200"
              >
                Go to Dashboard
              </button>
              
              <button
                onClick={() => { setMenuOpen(false); navigate('/predict'); }}
                className="w-full text-left p-3 bg-slate-950 border border-slate-850 hover:border-slate-700 rounded-xl transition-all text-slate-200"
              >
                Run New Prediction
              </button>
              
              <button
                onClick={() => { setMenuOpen(false); navigate('/telemedicine'); }}
                className="w-full text-left p-3 bg-slate-950 border border-slate-850 hover:border-slate-700 rounded-xl transition-all text-slate-200"
              >
                Consult Online
              </button>
              
              <button
                onClick={() => {
                  setMenuOpen(false);
                  localStorage.clear();
                  navigate('/login');
                }}
                className="w-full text-left p-3 bg-red-950/20 border border-red-900/30 hover:border-red-900/50 rounded-xl transition-all text-red-400 font-bold"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
