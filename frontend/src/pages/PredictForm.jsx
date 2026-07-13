import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Activity, Shield, User, Heart, Settings, AlertCircle } from 'lucide-react';
import { api } from '../utils/api';

const SYMPTOMS_LIST = [
  { id: 'chest_pain', labelKey: 'chest_pain' },
  { id: 'shortness_of_breath', labelKey: 'shortness_of_breath' },
  { id: 'palpitations', labelKey: 'palpitations' },
  { id: 'yellow_skin', labelKey: 'yellow_skin' },
  { id: 'nausea', labelKey: 'nausea' },
  { id: 'abdominal_pain', labelKey: 'abdominal_pain' },
  { id: 'swollen_ankles', labelKey: 'swollen_ankles' },
  { id: 'frequent_urination', labelKey: 'frequent_urination' },
  { id: 'foamy_urine', labelKey: 'foamy_urine' },
  { id: 'weight_fluctuation', labelKey: 'weight_fluctuation' },
  { id: 'extreme_fatigue', labelKey: 'extreme_fatigue' },
  { id: 'cold_intolerance', labelKey: 'cold_intolerance' },
  { id: 'heat_intolerance', labelKey: 'heat_intolerance' },
  { id: 'excessive_thirst', labelKey: 'excessive_thirst' },
  { id: 'slow_healing', labelKey: 'slow_healing' },
  { id: 'blurred_vision', labelKey: 'blurred_vision' },
  { id: 'dizziness', labelKey: 'dizziness' },
  { id: 'pale_skin', labelKey: 'pale_skin' },
  { id: 'easy_bruising', labelKey: 'easy_bruising' }
];

export default function PredictForm() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male');
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [sugar, setSugar] = useState('');
  const [temperature, setTemperature] = useState('98.6');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [history, setHistory] = useState('');
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [freeText, setFreeText] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Handle prefilled symptoms from Chatbot state
  useEffect(() => {
    if (location.state && location.state.prefilledSymptoms) {
      setSelectedSymptoms(location.state.prefilledSymptoms);
    }
  }, [location.state]);

  const handleToggleSymptom = (id) => {
    setSelectedSymptoms(prev => {
      if (prev.includes(id)) {
        return prev.filter(item => item !== id);
      }
      return [...prev, id];
    });
  };

  const getSymptomLabel = (id) => {
    // Falls back to en.json matching standard key names
    const fallbackText = id.replace(/_/g, ' ');
    // We check if translation lookup exists, otherwise use localized text
    return t(`symptoms.${id}`, fallbackText);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validations
    if (!age || !systolic || !diastolic || !sugar || !weight || !height) {
      setError('Please fill in all medical parameters and vitals.');
      return;
    }

    setLoading(true);

    try {
      const report = await api.runPrediction({
        age: Number(age),
        gender,
        symptoms: selectedSymptoms,
        vitals: {
          systolic: Number(systolic),
          diastolic: Number(diastolic),
          sugar: Number(sugar),
          temperature: Number(temperature),
          weight: Number(weight),
          height: Number(height)
        },
        history: history + (freeText ? `. Additional details: ${freeText}` : '')
      });

      navigate(`/report/${report.id}`);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error processing risk calculation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 animate-fade-in">
      
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-extrabold text-white flex items-center space-x-2">
          <Activity className="h-6 w-6 text-medical-500 animate-pulse-subtle" />
          <span>{t('predict_form.title')}</span>
        </h1>
        <p className="text-xs text-slate-400">
          Enter physiological parameters to compute systemic organ risk percentiles.
        </p>
      </div>

      {error && (
        <div className="bg-red-950/20 border border-red-900/30 text-red-400 text-xs rounded-xl p-3.5 flex items-center space-x-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Intake Form Container */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        
        {/* Left Side: Physiological Vitals */}
        <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-5">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-3 flex items-center space-x-2">
            <User className="h-4 w-4 text-medical-500" />
            <span>Demographics & Physiological Vitals</span>
          </h2>

          <div className="grid grid-cols-2 gap-4">
            {/* Age */}
            <div className="space-y-1.5">
              <label className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">{t('predict_form.age')}</label>
              <input
                type="number"
                required
                min="1"
                max="120"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="45"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 outline-none focus:border-medical-500 transition-colors"
              />
            </div>

            {/* Gender */}
            <div className="space-y-1.5">
              <label className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">{t('predict_form.gender')}</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 outline-none focus:border-medical-500 transition-colors"
              >
                <option value="Male">{t('predict_form.male')}</option>
                <option value="Female">{t('predict_form.female')}</option>
                <option value="Other">{t('predict_form.other')}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Systolic BP */}
            <div className="space-y-1.5">
              <label className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">{t('predict_form.systolic')}</label>
              <input
                type="number"
                required
                min="60"
                max="250"
                value={systolic}
                onChange={(e) => setSystolic(e.target.value)}
                placeholder="120"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 outline-none focus:border-medical-500 transition-colors"
              />
            </div>

            {/* Diastolic BP */}
            <div className="space-y-1.5">
              <label className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">{t('predict_form.diastolic')}</label>
              <input
                type="number"
                required
                min="40"
                max="150"
                value={diastolic}
                onChange={(e) => setDiastolic(e.target.value)}
                placeholder="80"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 outline-none focus:border-medical-500 transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Fasting sugar */}
            <div className="space-y-1.5">
              <label className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">{t('predict_form.sugar')}</label>
              <input
                type="number"
                required
                min="40"
                max="500"
                value={sugar}
                onChange={(e) => setSugar(e.target.value)}
                placeholder="95"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 outline-none focus:border-medical-500 transition-colors"
              />
            </div>

            {/* Temperature */}
            <div className="space-y-1.5">
              <label className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">{t('predict_form.temperature')}</label>
              <input
                type="number"
                required
                step="0.1"
                min="90"
                max="110"
                value={temperature}
                onChange={(e) => setTemperature(e.target.value)}
                placeholder="98.6"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 outline-none focus:border-medical-500 transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Weight */}
            <div className="space-y-1.5">
              <label className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">{t('predict_form.weight')}</label>
              <input
                type="number"
                required
                min="10"
                max="250"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="70"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 outline-none focus:border-medical-500 transition-colors"
              />
            </div>

            {/* Height */}
            <div className="space-y-1.5">
              <label className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">{t('predict_form.height')}</label>
              <input
                type="number"
                required
                min="50"
                max="250"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="170"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 outline-none focus:border-medical-500 transition-colors"
              />
            </div>
          </div>

          {/* History */}
          <div className="space-y-1.5">
            <label className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">{t('predict_form.medical_history')}</label>
            <textarea
              value={history}
              onChange={(e) => setHistory(e.target.value)}
              placeholder="e.g. Type-2 Diabetes diagnosed 3 years ago, taking Metformin 500mg daily. Family history of coronary arterial strain."
              rows="3"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 outline-none focus:border-medical-500 transition-colors resize-none placeholder:text-slate-700"
            />
          </div>
        </div>

        {/* Right Side: Symptoms checklist */}
        <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-5">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-3 flex items-center space-x-2">
            <Heart className="h-4 w-4 text-medical-500" />
            <span>{t('predict_form.symptoms')}</span>
          </h2>

          {/* Multi-select Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 h-[255px] overflow-y-auto pr-1">
            {SYMPTOMS_LIST.map((sym) => {
              const isSelected = selectedSymptoms.includes(sym.id);
              return (
                <div
                  key={sym.id}
                  onClick={() => handleToggleSymptom(sym.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer select-none text-[11px] font-medium flex items-center space-x-2.5 ${
                    isSelected
                      ? 'bg-medical-500/10 border-medical-500 text-medical-500'
                      : 'bg-slate-950/40 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    readOnly
                    className="rounded border-slate-700 text-medical-500 focus:ring-0 focus:ring-offset-0 bg-slate-900 h-3.5 w-3.5"
                  />
                  <span>{getSymptomLabel(sym.id)}</span>
                </div>
              );
            })}
          </div>

          {/* Free Text */}
          <div className="space-y-1.5 pt-1">
            <label className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">{t('predict_form.free_text')}</label>
            <input
              type="text"
              value={freeText}
              onChange={(e) => setFreeText(e.target.value)}
              placeholder="e.g. Occasional mild joint stiffness in morning"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 outline-none focus:border-medical-500 transition-colors placeholder:text-slate-700"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-medical-600 hover:bg-medical-500 text-white rounded-xl py-3.5 text-xs font-bold tracking-wider uppercase transition-all shadow-lg shadow-medical-500/20"
          >
            {loading ? t('predict_form.submitting') : t('predict_form.submit')}
          </button>
        </div>

      </form>
      
      {/* Privacy note */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4.5 flex items-center space-x-3 text-[11px] text-slate-400 leading-relaxed max-w-xl">
        <Shield className="h-4.5 w-4.5 text-medical-500 shrink-0" />
        <p>
          <strong>Privacy Compliance Assurance</strong>: Your clinical data parameters are stored locally. Access control complies with security norms for patient records.
        </p>
      </div>

    </div>
  );
}
