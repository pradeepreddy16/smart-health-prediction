import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles, Search, ChevronDown, ChevronUp, CheckSquare, Square, RefreshCw,
  AlertTriangle, ShieldAlert, CheckCircle2, ArrowRight, Stethoscope, MapPin,
  Activity, Info, Award, Download, X, Heart
} from 'lucide-react';

const API_BASE = '/api/advance-predict';

export default function AdvancePredict() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [error, setError] = useState(null);

  // Metadata from backend
  const [symptomDetails, setSymptomDetails] = useState([]);
  const [categorizedSymptoms, setCategorizedSymptoms] = useState({});
  const [diseaseCount, setDiseaseCount] = useState(41);
  const [symptomCount, setSymptomCount] = useState(131);
  const [datasetSamples, setDatasetSamples] = useState(9882);
  const [bestModelName, setBestModelName] = useState('Random Forest Classifier');
  const [bestValAccuracy, setBestValAccuracy] = useState(100.0);
  const [modelComparison, setModelComparison] = useState({});

  // UI State
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [openCategories, setOpenCategories] = useState({});
  const [predictionReport, setPredictionReport] = useState(null);

  useEffect(() => {
    fetchSymptomsMetadata();
    try {
      const prefilled = sessionStorage.getItem('prefilled_symptoms');
      if (prefilled) {
        const parsed = JSON.parse(prefilled);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSelectedSymptoms(parsed);
          sessionStorage.removeItem('prefilled_symptoms');
        }
      }
    } catch (e) {
      console.warn(e);
    }
  }, []);

  const fetchSymptomsMetadata = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE}/symptoms`);
      if (!res.ok) {
        throw new Error('Failed to fetch symptom checklist data');
      }
      const data = await res.json();
      setSymptomDetails(data.symptomDetails || []);
      setCategorizedSymptoms(data.categorizedSymptoms || {});
      setDiseaseCount(data.diseaseCount || 41);
      setSymptomCount(data.symptomCount || 131);
      setDatasetSamples(data.datasetSamples || 9882);
      setBestModelName(data.bestModelName || 'Random Forest Classifier');
      setBestValAccuracy(data.bestValAccuracy || 100.0);
      setModelComparison(data.modelComparison || {});

      const initialOpen = {};
      Object.keys(data.categorizedSymptoms || {}).forEach((cat) => {
        initialOpen[cat] = true;
      });
      setOpenCategories(initialOpen);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error initializing Advance ML predictor');
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (cat) => {
    setOpenCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  const toggleSymptom = (symptomId) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symptomId)
        ? prev.filter((id) => id !== symptomId)
        : [...prev, symptomId]
    );
  };

  const handleClearAll = () => {
    setSelectedSymptoms([]);
    setPredictionReport(null);
  };

  const handleSubmitPrediction = async (e) => {
    e.preventDefault();
    if (selectedSymptoms.length === 0) {
      alert('Please select at least one symptom from the checklist before submitting.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symptoms: selectedSymptoms }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to generate prediction');
      }

      const reportData = await res.json();
      setPredictionReport(reportData);

      setTimeout(() => {
        const reportElement = document.getElementById('prediction-report-section');
        if (reportElement) {
          reportElement.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error processing prediction');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!predictionReport) return;
    try {
      setDownloadingPdf(true);
      const userObj = JSON.parse(localStorage.getItem('user') || '{}');
      const res = await fetch(`${API_BASE}/pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symptoms: selectedSymptoms,
          topMatches: predictionReport.topMatches,
          patientName: userObj.name || 'Patient',
          disclaimer: predictionReport.disclaimer
        })
      });

      if (!res.ok) {
        throw new Error('Failed to generate PDF report');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Advance_ML_Disease_Report_${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err) {
      alert('Error downloading PDF: ' + err.message);
    } finally {
      setDownloadingPdf(false);
    }
  };

  const labelMap = React.useMemo(() => {
    const map = {};
    symptomDetails.forEach((s) => {
      map[s.id] = s.label;
    });
    return map;
  }, [symptomDetails]);

  // Filter symptoms and auto-expand matching categories during search
  const filteredCategories = React.useMemo(() => {
    if (!searchQuery.trim()) return categorizedSymptoms;

    const q = searchQuery.toLowerCase();
    const result = {};

    Object.entries(categorizedSymptoms).forEach(([cat, symptoms]) => {
      const matching = symptoms.filter(
        (symId) =>
          symId.toLowerCase().includes(q) ||
          (labelMap[symId] && labelMap[symId].toLowerCase().includes(q))
      );
      if (matching.length > 0) {
        result[cat] = matching;
      }
    });

    return result;
  }, [categorizedSymptoms, searchQuery, labelMap]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="inline-flex items-center justify-center p-4 bg-medical-500/10 rounded-2xl mb-4 border border-medical-500/20">
          <RefreshCw className="h-8 w-8 text-sky-400 animate-spin" />
        </div>
        <h2 className="text-xl font-bold text-white font-heading">Initializing ML Model & Symptom Checklist...</h2>
        <p className="text-sm text-slate-400 mt-2">Loading combined dataset mappings across 41 disease categories</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 border border-slate-800 p-6 sm:p-8 overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Optimal Model Selected: {bestModelName}</span>
              </div>
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-bold uppercase tracking-wider">
                <Award className="h-3.5 w-3.5" />
                <span>Val Accuracy: {bestValAccuracy}%</span>
              </div>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-heading tracking-tight">
              Advance <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-emerald-400">ML Disease Predictor</span>
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Multi-dataset disease classification evaluated across candidate machine learning algorithms (Random Forest, Extra Trees, Gradient Boosting, Logistic Regression). <strong className="text-emerald-400">{bestModelName}</strong> achieved top validation performance on {datasetSamples.toLocaleString()} sample vectors.
            </p>
          </div>

          {/* Stat Badges */}
          <div className="grid grid-cols-3 gap-3 shrink-0">
            <div className="bg-slate-955/60 border border-slate-800 rounded-2xl p-3.5 text-center">
              <span className="block text-2xl font-black text-emerald-400">{symptomCount}</span>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Symptoms</span>
            </div>
            <div className="bg-slate-955/60 border border-slate-800 rounded-2xl p-3.5 text-center">
              <span className="block text-2xl font-black text-sky-400">{diseaseCount}</span>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Diseases</span>
            </div>
            <div className="bg-slate-955/60 border border-slate-800 rounded-2xl p-3.5 text-center">
              <span className="block text-2xl font-black text-purple-400">{bestValAccuracy}%</span>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Best ML Score</span>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center space-x-3 text-red-400 text-sm">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Grid: Checklist Left, Sticky Toolbar Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column - Symptom Checklist (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Search & Selection Control Bar */}
          <div className="glass-panel bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 sticky top-20 z-30 shadow-lg backdrop-blur-md">
            {/* Search Input */}
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search all 131 symptoms (e.g. fever, rash, pain)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-955 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-medical-500 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Selection Status & Clear */}
            <div className="flex items-center space-x-3 w-full sm:w-auto justify-between sm:justify-end">
              <span className="px-3.5 py-1.5 rounded-xl bg-medical-500/20 border border-medical-500/30 text-sky-300 font-bold text-xs">
                {selectedSymptoms.length} Selected
              </span>
              {selectedSymptoms.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="text-xs font-semibold text-slate-400 hover:text-red-400 transition-colors"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>

          {/* Symptom Category Accordions */}
          <form onSubmit={handleSubmitPrediction} className="space-y-4">
            {Object.keys(filteredCategories).length === 0 ? (
              <div className="glass-panel bg-slate-900/50 border border-slate-800 rounded-2xl p-8 text-center text-slate-400 text-sm">
                No symptoms match "{searchQuery}". Try a different keyword.
              </div>
            ) : (
              Object.entries(filteredCategories).map(([category, symptoms]) => {
                // When actively searching, auto-expand matching categories
                const isOpen = searchQuery.trim().length > 0 ? true : openCategories[category];
                const selectedInCat = symptoms.filter((s) => selectedSymptoms.includes(s)).length;

                return (
                  <div
                    key={category}
                    className="glass-panel bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-md transition-all"
                  >
                    {/* Category Header */}
                    <button
                      type="button"
                      onClick={() => toggleCategory(category)}
                      className="w-full px-5 py-4 flex items-center justify-between bg-slate-900/90 hover:bg-slate-800/60 transition-colors text-left"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-2.5 h-2.5 rounded-full bg-medical-500" />
                        <span className="font-bold text-slate-100 text-sm sm:text-base font-heading">
                          {category}
                        </span>
                        <span className="text-xs text-slate-400 font-normal">
                          ({symptoms.length} symptoms)
                        </span>
                      </div>

                      <div className="flex items-center space-x-3">
                        {selectedInCat > 0 && (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[11px] font-bold">
                            {selectedInCat} active
                          </span>
                        )}
                        {isOpen ? (
                          <ChevronUp className="h-4 w-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-slate-400" />
                        )}
                      </div>
                    </button>

                    {/* Category Checkboxes */}
                    {isOpen && (
                      <div className="p-4 sm:p-5 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-slate-955/40">
                        {symptoms.map((symptomId) => {
                          const isChecked = selectedSymptoms.includes(symptomId);
                          const label = labelMap[symptomId] || symptomId;

                          return (
                            <label
                              key={symptomId}
                              onClick={() => toggleSymptom(symptomId)}
                              className={`flex items-center space-x-3 p-3 rounded-xl border transition-all cursor-pointer select-none text-xs sm:text-sm font-medium ${
                                isChecked
                                  ? 'bg-medical-600/20 border-medical-500/50 text-white shadow-md'
                                  : 'bg-slate-900/50 border-slate-800/70 text-slate-300 hover:bg-slate-800/50 hover:text-white'
                              }`}
                            >
                              <div className="shrink-0 text-medical-400">
                                {isChecked ? (
                                  <CheckSquare className="h-4 w-4 text-sky-400" />
                                ) : (
                                  <Square className="h-4 w-4 text-slate-600" />
                                )}
                              </div>
                              <span className="line-clamp-1">{label}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}

            {/* Selected Symptoms Chip Summary List */}
            {selectedSymptoms.length > 0 && (
              <div className="glass-panel bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-2">
                <div className="flex justify-between items-center text-xs font-bold text-slate-300">
                  <span>Selected Symptoms Summary ({selectedSymptoms.length})</span>
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="text-slate-400 hover:text-red-400 text-[11px] font-semibold transition-colors"
                  >
                    Clear All
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {selectedSymptoms.map((symId) => (
                    <span
                      key={symId}
                      className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-medical-500/20 border border-medical-500/30 text-sky-200 text-xs font-semibold shadow-sm"
                    >
                      <span>{labelMap[symId] || symId}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSymptom(symId);
                        }}
                        className="text-slate-400 hover:text-red-400 transition-colors p-0.5"
                        title="Remove symptom"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Bottom Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={submitting || selectedSymptoms.length === 0}
                className={`w-full py-4 px-6 rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center space-x-3 shadow-xl transition-all ${
                  selectedSymptoms.length > 0 && !submitting
                    ? 'bg-gradient-to-r from-medical-600 via-sky-600 to-emerald-600 hover:from-medical-500 hover:to-emerald-500 text-white shadow-medical-500/25 hover:scale-[1.01]'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                }`}
              >
                {submitting ? (
                  <>
                    <RefreshCw className="h-5 w-5 animate-spin" />
                    <span>Analyzing Merged ML Model...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 text-emerald-300" />
                    <span>Run ML Disease Prediction ({selectedSymptoms.length} Symptoms Selected)</span>
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column - Overview Card & Prediction Report (4 cols) */}
        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-20">
          {/* Quick Summary Card */}
          <div className="glass-panel bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white font-heading flex items-center space-x-2">
              <Activity className="h-4 w-4 text-emerald-400" />
              <span>Model Architecture Specs</span>
            </h3>

            <div className="space-y-2.5 text-xs text-slate-300 border-t border-slate-800 pt-3">
              <div className="flex justify-between py-1 border-b border-slate-800/50">
                <span className="text-slate-400">Classifier:</span>
                <span className="font-semibold text-white">Random Forest (100 Trees)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/50">
                <span className="text-slate-400">Merged Sources:</span>
                <span className="font-semibold text-sky-400">Kaggle Datasets #1 & #2</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/50">
                <span className="text-slate-400">Total Features:</span>
                <span className="font-semibold text-emerald-400">131 Binary Symptoms</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Target Classes:</span>
                <span className="font-semibold text-purple-400">41 Disease Categories</span>
              </div>
            </div>

            <div className="bg-slate-955/70 border border-slate-800/80 rounded-xl p-3 text-[11px] text-slate-400 flex items-start space-x-2">
              <Info className="h-4 w-4 text-sky-400 shrink-0 mt-0.5" />
              <span>
                Tick any symptoms experienced from the 9 medical categories on the left and submit to view ranked ML disease matches.
              </span>
            </div>
          </div>

          {/* Results Report Display */}
          {predictionReport && (
            <div
              id="prediction-report-section"
              className="glass-panel bg-gradient-to-b from-slate-900 to-slate-955 border-2 border-emerald-500/40 rounded-3xl p-6 space-y-6 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

              {/* Report Header */}
              <div className="border-b border-slate-800 pb-4 flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
                    <Award className="h-4 w-4" />
                    <span>ML Symptom Analysis Report</span>
                  </div>
                  <h2 className="text-xl font-black text-white font-heading">
                    Prediction Results
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Based on {predictionReport.selectedCount} selected symptom(s)
                  </p>
                </div>

                {/* Standalone PDF Download Button */}
                <button
                  onClick={handleDownloadPDF}
                  disabled={downloadingPdf}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center space-x-1.5 shadow-lg shadow-emerald-600/20 transition-all shrink-0"
                >
                  {downloadingPdf ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Download className="h-3.5 w-3.5" />
                  )}
                  <span>{downloadingPdf ? 'Exporting...' : 'PDF Report'}</span>
                </button>
              </div>

              {/* Ranked Top 3 Matches */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Top 2-3 Ranked ML Disease Matches
                </h3>

                {predictionReport.topMatches.map((match, idx) => {
                  const isPrimary = idx === 0;

                  return (
                    <div
                      key={idx}
                      className={`rounded-2xl p-4 border transition-all ${
                        isPrimary
                          ? 'bg-emerald-955/30 border-emerald-500/50 shadow-lg shadow-emerald-500/10'
                          : 'bg-slate-900/60 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                              isPrimary ? 'bg-emerald-500 text-slate-955' : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            #{idx + 1}
                          </span>
                          <span
                            className={`font-extrabold text-sm sm:text-base ${
                              isPrimary ? 'text-white font-heading' : 'text-slate-200'
                            }`}
                          >
                            {match.disease}
                          </span>
                        </div>

                        <span
                          className={`px-2.5 py-1 rounded-xl text-xs font-black ${
                            isPrimary
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {match.confidence}% confidence
                        </span>
                      </div>

                      {/* Confidence Progress Bar */}
                      <div className="w-full bg-slate-955 rounded-full h-2 overflow-hidden border border-slate-800">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            isPrimary
                              ? 'bg-gradient-to-r from-sky-400 to-emerald-400'
                              : 'bg-slate-600'
                          }`}
                          style={{ width: `${Math.max(match.confidence, 4)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Recommended Precautions for Top Match */}
              {predictionReport.topMatches[0] && (
                <div className="bg-slate-955/80 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-sky-400" />
                    <span>Recommended Clinical Precautions</span>
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {predictionReport.topMatches[0].precautions.map((prec, i) => (
                      <li key={i} className="flex items-start space-x-2">
                        <span className="text-sky-400 font-bold">•</span>
                        <span>{prec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Compare with Physiological Risk Predictor Note */}
              <div className="bg-slate-900/90 border border-sky-500/30 rounded-2xl p-4 flex items-center justify-between gap-3">
                <div className="flex items-center space-x-2.5">
                  <Heart className="h-5 w-5 text-sky-400 shrink-0" />
                  <p className="text-xs text-slate-300">
                    For a full organ-system clinical breakdown and vital signs risk analysis, try the <strong className="text-white font-bold">Physiological Risk Predictor</strong>.
                  </p>
                </div>
                <Link
                  to="/predict"
                  className="bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-colors"
                >
                  Try Predictor ↗
                </Link>
              </div>

              {/* Standard Disclaimer Notice */}
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 space-y-2">
                <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs">
                  <ShieldAlert className="h-4 w-4 shrink-0" />
                  <span>Important Medical Disclaimer</span>
                </div>
                <p className="text-[11px] text-amber-200/80 leading-relaxed">
                  {predictionReport.disclaimer}
                </p>
              </div>

              {/* Cross-Linking CTAs */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Next Steps & Doctor Consultation
                </span>

                <Link
                  to="/telemedicine"
                  className="w-full p-3.5 bg-medical-600 hover:bg-medical-500 text-white rounded-xl text-xs font-bold flex items-center justify-between shadow-lg shadow-medical-500/20 transition-all group"
                >
                  <div className="flex items-center space-x-2.5">
                    <Stethoscope className="h-4 w-4" />
                    <span>Book Telemedicine Doctor</span>
                  </div>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  to="/find-care"
                  className="w-full p-3.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 hover:text-white rounded-xl text-xs font-bold flex items-center justify-between transition-all group"
                >
                  <div className="flex items-center space-x-2.5">
                    <MapPin className="h-4 w-4 text-emerald-400" />
                    <span>Find Care & Hospitals Nearby</span>
                  </div>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
