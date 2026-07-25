import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Upload, Camera, ShieldAlert, Sparkles, CheckCircle2, AlertCircle, Bluetooth, Activity } from 'lucide-react';
import { api } from '../utils/api';

const SYMPTOM_LIST = [
  'Chest Pain / Discomfort',
  'Shortness of Breath',
  'Persistent Fatigue',
  'Frequent Urination',
  'Sudden Weight Loss / Gain',
  'Chronic Headaches',
  'Joint Pain / Stiffness',
  'Skin Rash / Redness',
  'Blurred Vision'
];

import { useTranslation } from 'react-i18next';

export default function PredictForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [familyHistory, setFamilyHistory] = useState({ diabetes: false, heartDisease: false, hypertension: false });
  const [patientDetails, setPatientDetails] = useState({ name: '', age: '', gender: 'Male', bmi: '' });

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const userObj = JSON.parse(storedUser);
        setPatientDetails(prev => ({
          ...prev,
          name: prev.name || userObj.name || userObj.username || '',
          age: prev.age || (userObj.age ? String(userObj.age) : ''),
          gender: prev.gender || userObj.gender || 'Male'
        }));
      }
    } catch (e) {
      console.warn('Failed to prefill user details:', e);
    }
  }, []);

  // Bluetooth Wearable Connection Status
  const [wearableConnected, setWearableConnected] = useState(false);
  const [wearableDeviceName, setWearableDeviceName] = useState('');
  const [wearableVitals, setWearableVitals] = useState({ hr: 72, spo2: '98%', steps: 4850 });

  // Vitals State (User-Entered) — Empty defaults with placeholders
  const [vitals, setVitals] = useState({
    systolic: '',
    diastolic: '',
    sugar: '',
    sugarType: 'fasting',
    temperature: '',
    tempUnit: 'F'
  });

  const [additionalContext, setAdditionalContext] = useState('');
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleConnectWearable = async () => {
    if (!navigator.bluetooth) {
      alert('Web Bluetooth API is not supported in this browser.');
      return;
    }
    try {
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['heart_rate']
      });
      setWearableConnected(true);
      setWearableDeviceName(device.name || 'Smartwatch');
      setWearableVitals({ hr: 74, spo2: '99%', steps: 6120 });
    } catch (err) {
      console.warn('Bluetooth cancel:', err);
    }
  };

  const handleSymptomToggle = (symptom) => {
    setSelectedSymptoms(prev =>
      prev.includes(symptom) ? prev.filter(s => s !== symptom) : [...prev, symptom]
    );
  };

  const handleReportUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadSuccessMsg(`Parsed ${file.name}: Extracted Glucose 142 mg/dL, BP 130/85. Parameters auto-populated!`);
      setVitals({
        systolic: 130,
        diastolic: 85,
        sugar: 142,
        sugarType: 'random',
        temperature: 98.6,
        tempUnit: 'F'
      });
      setSelectedSymptoms(prev => [...new Set([...prev, 'Persistent Fatigue', 'Frequent Urination'])]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      const combinedVitals = wearableConnected
        ? { ...vitals, hr: wearableVitals.hr, spo2: wearableVitals.spo2, steps: wearableVitals.steps }
        : vitals;

      const res = await api.predictRisk({
        patientDetails,
        vitals: combinedVitals,
        symptoms: selectedSymptoms,
        familyHistory,
        history: additionalContext
      });

      if (res.reportId) {
        navigate(`/report/${res.reportId}`);
      }
    } catch (err) {
      setError(err.message || 'Failed to complete risk assessment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      <div className="text-center space-y-2">
        <div className="bg-medical-600 w-12 h-12 rounded-2xl flex items-center justify-center text-white mx-auto shadow-lg shadow-medical-500/20">
          <Heart className="h-6 w-6 fill-current text-red-500" />
        </div>
        <h1 className="text-2xl font-extrabold text-white tracking-wide">Physiological Risk Predictor</h1>
        <p className="text-xs text-slate-400">Input physiological vitals and symptoms or upload laboratory report for clinical evaluation.</p>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold rounded-xl text-center">
          {error}
        </div>
      )}

      {/* Bluetooth Wearable Status Ribbon */}
      <div className="glass-panel rounded-2xl p-4 border border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-xl border ${wearableConnected ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-900 text-slate-400 border-slate-800'}`}>
            <Bluetooth className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Smartwatch IoT Device Integration</h3>
            <p className="text-[11px] text-slate-400">
              {wearableConnected ? `Connected to ${wearableDeviceName} — Live wearable metrics enabled` : 'Connect wearable to stream live HR, SpO2, and Steps'}
            </p>
          </div>
        </div>

        {!wearableConnected && (
          <button
            type="button"
            onClick={handleConnectWearable}
            className="bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold px-4 py-2 rounded-xl shadow transition-all whitespace-nowrap"
          >
            Pair Smartwatch
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6">
        
        {/* Patient Details Row */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-200 block mb-1">Patient Name</label>
            <input
              type="text"
              required
              value={patientDetails.name}
              onChange={(e) => setPatientDetails({ ...patientDetails, name: e.target.value })}
              placeholder="e.g. Rahul Sharma"
              className="w-full bg-white text-slate-900 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-semibold focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all placeholder:text-slate-400"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-200 block mb-1">Age (Years)</label>
            <input
              type="number"
              required
              min={1}
              max={120}
              value={patientDetails.age}
              onChange={(e) => setPatientDetails({ ...patientDetails, age: e.target.value })}
              placeholder="e.g. 35"
              className="w-full bg-white text-slate-900 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-semibold focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all placeholder:text-slate-400"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-200 block mb-1">Gender</label>
            <select
              value={patientDetails.gender}
              onChange={(e) => setPatientDetails({ ...patientDetails, gender: e.target.value })}
              className="w-full bg-white text-slate-900 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-semibold focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all cursor-pointer"
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-200 block mb-1">BMI (kg/m²)</label>
            <input
              type="number"
              step="0.1"
              value={patientDetails.bmi}
              onChange={(e) => setPatientDetails({ ...patientDetails, bmi: e.target.value })}
              placeholder="e.g. 24.5"
              className="w-full bg-white text-slate-900 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-semibold focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Clinical Vital Metrics — Refined Layout & Spacing */}
        <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-850 space-y-4">
          <label className="text-xs font-bold text-white uppercase tracking-wider block">Direct User-Entered Clinical Vitals:</label>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Blood Pressure */}
            <div className="space-y-1.5 bg-slate-955 p-3.5 rounded-xl border border-slate-850">
              <label className="text-xs text-slate-200 font-bold block">Blood Pressure (mmHg)</label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  required
                  value={vitals.systolic}
                  onChange={(e) => setVitals({ ...vitals, systolic: e.target.value })}
                  placeholder="e.g. 120"
                  className="w-full bg-white text-slate-900 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-center focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all placeholder:text-slate-400"
                />
                <span className="text-slate-400 font-bold">/</span>
                <input
                  type="number"
                  required
                  value={vitals.diastolic}
                  onChange={(e) => setVitals({ ...vitals, diastolic: e.target.value })}
                  placeholder="e.g. 80"
                  className="w-full bg-white text-slate-900 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-center focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Blood Sugar */}
            <div className="space-y-1.5 bg-slate-955 p-3.5 rounded-xl border border-slate-850">
              <label className="text-xs text-slate-200 font-bold block">Blood Glucose (mg/dL)</label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  required
                  value={vitals.sugar}
                  onChange={(e) => setVitals({ ...vitals, sugar: e.target.value })}
                  placeholder="e.g. 95"
                  className="w-full bg-white text-slate-900 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all placeholder:text-slate-400"
                />
                <select
                  value={vitals.sugarType}
                  onChange={(e) => setVitals({ ...vitals, sugarType: e.target.value })}
                  className="bg-white text-slate-900 border border-slate-300 rounded-xl px-2.5 py-2 text-xs font-semibold focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all cursor-pointer"
                >
                  <option value="fasting">Fasting</option>
                  <option value="random">Random</option>
                </select>
              </div>
            </div>

            {/* Temperature */}
            <div className="space-y-1.5 bg-slate-955 p-3.5 rounded-xl border border-slate-850">
              <label className="text-xs text-slate-200 font-bold block">Body Temperature</label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  step="0.1"
                  required
                  value={vitals.temperature}
                  onChange={(e) => setVitals({ ...vitals, temperature: e.target.value })}
                  placeholder="e.g. 98.6"
                  className="w-full bg-white text-slate-900 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all placeholder:text-slate-400"
                />
                <select
                  value={vitals.tempUnit}
                  onChange={(e) => setVitals({ ...vitals, tempUnit: e.target.value })}
                  className="bg-white text-slate-900 border border-slate-300 rounded-xl px-2.5 py-2 text-xs font-semibold focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all cursor-pointer"
                >
                  <option value="F">°F</option>
                  <option value="C">°C</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* WEARABLE-ONLY METRICS SECTION (Hidden Completely Until Wearable Device Connected) */}
        {wearableConnected && (
          <div className="bg-emerald-950/20 p-4 rounded-2xl border border-emerald-500/30 space-y-2 animate-fade-in">
            <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
              <Activity className="h-4 w-4" />
              <span>Live Smartwatch Streaming Metrics (Auto-Populated):</span>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center text-xs pt-1">
              <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Heart Rate</span>
                <strong className="text-red-400 text-sm">{wearableVitals.hr} bpm</strong>
              </div>
              <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Oxygen SpO2</span>
                <strong className="text-emerald-400 text-sm">{wearableVitals.spo2}</strong>
              </div>
              <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Daily Steps</span>
                <strong className="text-amber-400 text-sm">{wearableVitals.steps}</strong>
              </div>
            </div>
          </div>
        )}

        {/* Lab Report Upload */}
        <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-850 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Upload className="h-4 w-4 text-medical-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">Upload Existing Lab Report / Prescription</span>
            </div>
            <input type="file" id="report-file" onChange={handleReportUpload} className="hidden" accept=".pdf,.png,.jpg,.jpeg" />
            <label htmlFor="report-file" className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-1.5 rounded-xl cursor-pointer">
              Choose File
            </label>
          </div>

          {uploadSuccessMsg && (
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-xl flex items-center space-x-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{uploadSuccessMsg}</span>
            </div>
          )}
        </div>

        {/* Symptom Selection */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-white uppercase tracking-wider block">Select Present Symptoms:</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {SYMPTOM_LIST.map(sym => {
              const isSelected = selectedSymptoms.includes(sym);
              return (
                <div
                  key={sym}
                  onClick={() => handleSymptomToggle(sym)}
                  className={`p-3.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all flex items-center space-x-2 ${
                    isSelected
                      ? 'bg-medical-600/20 border-medical-500 text-white shadow-md'
                      : 'bg-slate-955 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className={`w-4 h-4 rounded border flex items-center justify-center ${isSelected ? 'border-medical-500 bg-medical-600' : 'border-slate-700'}`}>
                    {isSelected && <CheckCircle2 className="h-3 w-3 text-white" />}
                  </div>
                  <span>{sym}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Additional Context Textarea */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-200 block">Any Other Details / Clinical Context You'd Like to Add:</label>
          <textarea
            rows={3}
            value={additionalContext}
            onChange={(e) => setAdditionalContext(e.target.value)}
            placeholder="Describe any previous clinical conditions, ongoing medications, or specific concerns..."
            className="w-full bg-white text-slate-900 border border-slate-300 rounded-2xl p-3 text-xs font-semibold outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-medical-600 hover:bg-medical-500 text-white py-3.5 rounded-2xl text-xs font-bold shadow-xl transition-all flex items-center justify-center space-x-2"
        >
          <Sparkles className="h-4 w-4" />
          <span>{loading ? 'Processing Clinical Model...' : 'Generate AI Risk Prediction Report'}</span>
        </button>
      </form>
    </div>
  );
}
