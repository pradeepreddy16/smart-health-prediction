import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Activity, Calendar, ArrowRight, Heart, FileText, ChevronRight, Bell, AlertTriangle } from 'lucide-react';
import { api } from '../utils/api';

export default function UserDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const history = await api.getHistory();
        setReports(history);
      } catch (err) {
        console.error(err);
        setError('Failed to load past assessments.');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  // Compute vitals data points for custom SVG line charts
  const getVitalsPoints = (metric) => {
    if (reports.length === 0) return '';
    // Reverse reports to go chronological
    const data = [...reports].reverse().map(r => {
      const summary = r.patientDetails.vitalsSummary;
      if (metric === 'bp') return summary.systolic;
      if (metric === 'sugar') return summary.sugar;
      if (metric === 'weight') return summary.weight;
      return 0;
    });

    if (data.length === 1) return `M 10 40 L 290 40`;

    const width = 280;
    const height = 60;
    const minVal = Math.min(...data) - 10;
    const maxVal = Math.max(...data) + 10;
    const valRange = maxVal - minVal || 1;

    return data.map((val, idx) => {
      const x = 10 + (idx / (data.length - 1)) * width;
      const y = height + 10 - ((val - minVal) / valRange) * height;
      return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    }).join(' ');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      
      {/* 1. Header Hero Panel */}
      <div className="glass-panel rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between border border-slate-800 relative overflow-hidden shadow-2xl">
        <div className="absolute -top-16 -left-16 h-32 w-32 bg-medical-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="space-y-2 max-w-xl">
          <h1 className="text-2xl md:text-3xl font-extrabold text-white">
            {t('dashboard.welcome', { name: user.name })}
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            Assess symptoms, evaluate organ functions, generate printable reports, and track wellness metrics in Tamil, Telugu, Kannada, and Malayalam.
          </p>
        </div>
        <button
          onClick={() => navigate('/predict')}
          className="mt-6 md:mt-0 bg-medical-600 hover:bg-medical-500 text-white rounded-2xl px-6 py-3.5 text-sm font-semibold transition-all hover:-translate-y-0.5 shadow-lg shadow-medical-500/20 flex items-center space-x-2 shrink-0"
        >
          <span>{t('dashboard.new_prediction')}</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {/* 2. Grid Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Past Reports */}
        <div className="lg:col-span-8 space-y-4">
          <h2 className="text-lg font-bold text-slate-200 tracking-wide flex items-center space-x-2">
            <FileText className="h-5 w-5 text-medical-500" />
            <span>{t('dashboard.recent_reports')}</span>
          </h2>

          {loading ? (
            <div className="text-center py-12 text-slate-500 text-sm">Loading reports history...</div>
          ) : error ? (
            <div className="bg-red-950/15 border border-red-900/30 text-red-400 text-xs rounded-xl p-4">{error}</div>
          ) : reports.length === 0 ? (
            <div className="glass-panel rounded-2xl p-8 border border-slate-800 text-center space-y-3">
              <Activity className="h-10 w-10 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-400">{t('dashboard.no_reports')}</p>
              <button
                onClick={() => navigate('/predict')}
                className="text-xs font-semibold text-medical-500 hover:text-medical-400 transition-colors"
              >
                Start Assessment
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => (
                <div
                  key={report.id}
                  onClick={() => navigate(`/report/${report.id}`)}
                  className="glass-panel-hover glass-panel rounded-2xl p-5 border border-slate-800/80 cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center space-x-2.5">
                      <span className="font-semibold text-sm text-slate-200">
                        {t('report.title')}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        report.overallRisk === 'High' 
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                          : report.overallRisk === 'Medium' 
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {report.overallRisk.toUpperCase()} RISK
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                      <span>{t('report.generated_on')}: {new Date(report.createdAt || report.timestamp).toLocaleDateString()}</span>
                      <span>Specialist: <strong>{report.recommendedSpecialist}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center text-xs font-semibold text-medical-500 hover:text-medical-400 transition-colors">
                    <span>{t('dashboard.view_report')}</span>
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Vitals trend + Notifications */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* Health Reminders Panel */}
          <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-semibold text-sm text-slate-200 flex items-center space-x-2">
                <Bell className="h-4.5 w-4.5 text-medical-500" />
                <span>Health Reminders</span>
              </h3>
              <span className="bg-medical-500/10 text-medical-500 text-[10px] px-2 py-0.5 rounded-full font-bold">2 active</span>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="flex items-start space-x-3.5 bg-slate-950/40 p-3 rounded-xl border border-slate-800">
                <Calendar className="h-4 w-4 text-sky-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-300">Medication Follow-up</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Check vitals trends and repeat organ scores in 7 days.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3.5 bg-slate-950/40 p-3 rounded-xl border border-slate-800">
                <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-300">Annual Checkup Alert</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Consult a General Physician for biometric panel tests.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Vitals Trend Sparklines */}
          <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-5">
            <h3 className="font-semibold text-sm text-slate-200 flex items-center space-x-2 border-b border-slate-800 pb-3">
              <Activity className="h-4.5 w-4.5 text-medical-500" />
              <span>{t('dashboard.vitals_summary')}</span>
            </h3>

            {reports.length < 2 ? (
              <div className="text-center py-6 text-slate-600 text-xs leading-relaxed">
                Trends become active after running at least 2 health assessments.
              </div>
            ) : (
              <div className="space-y-5 text-xs">
                
                {/* Systolic BP Trend */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-slate-400">
                    <span>{t('dashboard.blood_pressure')} (Systolic)</span>
                    <span className="font-bold text-slate-300">
                      {reports[0].patientDetails.vitalsSummary.systolic} mmHg
                    </span>
                  </div>
                  <div className="bg-slate-950/60 rounded-xl p-2 border border-slate-800/80">
                    <svg className="w-full h-16" viewBox="0 0 300 80">
                      <path
                        d={getVitalsPoints('bp')}
                        fill="none"
                        stroke="#0ea5e9"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>

                {/* Blood Sugar Trend */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-slate-400">
                    <span>{t('dashboard.blood_sugar')} (Fasting)</span>
                    <span className="font-bold text-slate-300">
                      {reports[0].patientDetails.vitalsSummary.sugar} mg/dL
                    </span>
                  </div>
                  <div className="bg-slate-950/60 rounded-xl p-2 border border-slate-800/80">
                    <svg className="w-full h-16" viewBox="0 0 300 80">
                      <path
                        d={getVitalsPoints('sugar')}
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>

                {/* Weight Trend */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-slate-400">
                    <span>{t('dashboard.weight')}</span>
                    <span className="font-bold text-slate-300">
                      {reports[0].patientDetails.vitalsSummary.weight} kg
                    </span>
                  </div>
                  <div className="bg-slate-950/60 rounded-xl p-2 border border-slate-800/80">
                    <svg className="w-full h-16" viewBox="0 0 300 80">
                      <path
                        d={getVitalsPoints('weight')}
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>

              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
