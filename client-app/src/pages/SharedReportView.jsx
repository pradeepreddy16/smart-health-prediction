import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShieldCheck, Heart, Activity, AlertTriangle, Lock, FileText, CheckCircle2, Clock } from 'lucide-react';

export default function SharedReportView() {
  const { token } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSharedReport = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/predict/shared/${token}`);
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || 'Shared report link is invalid or has expired.');
        }
        const data = await res.json();
        setReport(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchSharedReport();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-955 flex items-center justify-center p-4 text-slate-400 text-xs font-semibold">
        Verifying secure encryption token & loading clinical report...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-955 flex items-center justify-center p-4">
        <div className="glass-panel max-w-md w-full rounded-3xl p-8 border border-red-500/30 bg-slate-900 text-center space-y-4 shadow-2xl">
          <div className="w-14 h-14 bg-red-500/10 rounded-2xl border border-red-500/20 text-red-400 flex items-center justify-center mx-auto">
            <Lock className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-bold text-white">Access Expired or Revoked</h2>
          <p className="text-xs text-slate-300 font-medium leading-relaxed">
            {error}
          </p>
          <div className="pt-2">
            <Link to="/" className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-6 py-2.5 rounded-xl border border-slate-700 inline-block">
              Go to SmartHealth Portal
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-955 py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-6 selection:bg-medical-500 selection:text-white">
      
      {/* Read-Only Security Banner */}
      <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl flex items-center justify-between text-xs text-emerald-400 font-bold">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="h-5 w-5 shrink-0" />
          <span>Verified Read-Only Clinical Health Report (Shared via Secure Patient Link)</span>
        </div>
        <div className="flex items-center space-x-1 text-[10px] text-slate-400">
          <Clock className="h-3.5 w-3.5 text-amber-400" />
          <span>Expires: {new Date(report.shareExpiresAt).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Main Report Card */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 bg-slate-900 space-y-6 shadow-2xl">
        
        {/* Patient & Assessment Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-6">
          <div>
            <span className="text-xs font-bold text-sky-400 uppercase tracking-widest block">Biometric Diagnostic Report</span>
            <h1 className="text-2xl font-extrabold text-white">
              Patient: {report.patientDetails?.name || 'Patient'}
            </h1>
            <p className="text-xs text-slate-400 font-medium mt-1">
              Age/Gender: {report.patientDetails?.age} yrs / {report.patientDetails?.gender} • Assessed: {new Date(report.createdAt).toLocaleDateString()}
            </p>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Overall Health Status</span>
            <span className={`text-base font-extrabold px-3 py-1 rounded-full border inline-block mt-1 ${
              report.overallRisk === 'Optimal' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
              report.overallRisk === 'Good' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
              'bg-amber-500/10 text-amber-400 border-amber-500/20'
            }`}>
              {report.overallRisk}
            </span>
          </div>
        </div>

        {/* Organ Systems Risk Breakdown */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Physiological System Indicators</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(report.organRisks || {}).map(([organ, data]) => {
              const score = typeof data === 'object' ? data.score || 85 : data;
              const status = typeof data === 'object' ? data.status || 'Optimal' : 'Optimal';

              return (
                <div key={organ} className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-850 space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-white capitalize">{organ} System</span>
                    <span className="text-sky-400 font-extrabold">{score}/100</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${score >= 80 ? 'bg-emerald-400' : score >= 60 ? 'bg-amber-400' : 'bg-red-400'}`}
                      style={{ width: `${score}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Vital Metrics Summary */}
        <div className="space-y-3 pt-2">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Recorded Vital Indicators</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-850">
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Blood Pressure</span>
              <span className="text-white font-bold">{report.vitals?.systolic || 120}/{report.vitals?.diastolic || 80} mmHg</span>
            </div>
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-850">
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Blood Glucose</span>
              <span className="text-white font-bold">{report.vitals?.sugar || 95} mg/dL</span>
            </div>
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-850">
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Temperature</span>
              <span className="text-white font-bold">{report.vitals?.temperature || 98.6}°F</span>
            </div>
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-850">
              <span className="text-slate-400 text-[10px] uppercase font-bold block">BMI</span>
              <span className="text-white font-bold">{report.patientDetails?.bmi || 24.2} kg/m²</span>
            </div>
          </div>
        </div>

        {/* Clinical Guidance */}
        {Array.isArray(report.clinicalRecommendations) && report.clinicalRecommendations.length > 0 && (
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Clinical Guidance & Preventive Recommendations</h3>
            <ul className="space-y-2 text-xs text-slate-300">
              {report.clinicalRecommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start space-x-2 bg-slate-950/50 p-2.5 rounded-xl border border-slate-850">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

      </div>
    </div>
  );
}
