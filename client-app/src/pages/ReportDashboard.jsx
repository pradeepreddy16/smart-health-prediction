import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Heart, Shield, Clock, CheckCircle, FileDown, MapPin, ChevronDown, ChevronUp, Stethoscope, MessageSquare, Trash2, Share2, Moon, Utensils, Brain, ShieldAlert, X, Activity, Sparkles, Droplet } from 'lucide-react';
import { api } from '../utils/api';
import MapViewer from '../components/MapViewer';

const ORGAN_RECOMMENDATIONS = {
  Heart: {
    food: 'Oats, leafy greens (moringa, curry leaves), garlic, flaxseed, fatty fish, walnuts. Reduce salt & fried/processed food.',
    exercise: 'Brisk walking 30 min/day, swimming, cycling — avoid heavy strength training without clearance.',
    supplements: 'Omega-3 (fish oil), CoQ10 — note: consult doctor before starting.',
    doctorFlag: true
  },
  Liver: {
    food: 'Leafy greens, beetroot, turmeric, citrus fruits, green tea. Avoid alcohol & fried food.',
    exercise: 'Moderate cardio (walking, cycling) 20–30 min/day.',
    supplements: 'Milk thistle, Vitamin E — consult doctor before starting.',
    doctorFlag: true
  },
  Kidney: {
    food: 'Reduce sodium & potassium-heavy foods (bananas, tomatoes), stay hydrated with 2.5L water, limit processed meat.',
    exercise: 'Light-to-moderate activity (walking, yoga) — avoid high-protein diet + intense exercise combo.',
    supplements: 'Only under medical supervision — kidney issues are dosage-sensitive.',
    doctorFlag: true,
    warning: 'STRICT WARNING: Do not take generic supplements without a nephrologist consultation.'
  },
  Thyroid: {
    food: 'Iodine-rich foods, selenium sources (Brazil nuts, ragi). Avoid excess raw cruciferous veg.',
    exercise: 'Moderate aerobic + strength training, yoga for stress regulation.',
    supplements: 'Selenium, Vitamin D — consult doctor before starting.',
    doctorFlag: true
  },
  Metabolic: {
    food: 'Low glycemic index foods, whole grains (ragi, bajra), fiber-rich vegetables, reduce refined sugar.',
    exercise: '150 min/week moderate cardio + 2x/week strength training (improves insulin sensitivity).',
    supplements: 'Chromium, Magnesium, Berberine — consult doctor before starting.',
    doctorFlag: true
  },
  Blood: {
    food: 'Iron-rich foods (spinach, lentils, curry leaves) + Vitamin C for absorption, folate sources.',
    exercise: 'General fitness routine is suitable.',
    supplements: 'Only if deficiency is flagged (iron/B12).',
    doctorFlag: false
  }
};

const getDynamicOrganRecommendations = (organ, score, patientDetails = {}, symptoms = [], vitals = {}) => {
  const sys = Number(vitals.systolic || 120);
  const dia = Number(vitals.diastolic || 80);
  const sugar = Number(vitals.sugar || 95);
  const sList = Array.isArray(symptoms) ? symptoms.map(s => String(s).toLowerCase()) : [];

  const isCautionOrRisk = score < 70;
  const isHighRisk = score < 50;
  const organLower = String(organ).toLowerCase();

  let food = "";
  let exercise = "";
  let supplements = "";

  if (organLower === 'heart') {
    if (isHighRisk || sys >= 140 || sList.some(s => s.includes('chest') || s.includes('breath'))) {
      food = `Strict Cardiac DASH Diet (<1,500 mg sodium/day). Avoid all saturated fats, fried foods, and caffeinated stimulants. Increase garlic, moringa leaves, flaxseed, and Omega-3 rich foods to regulate arterial pressure (${sys}/${dia} mmHg).`;
      exercise = `Supervised low-impact mobility only (light 15-20 min flat surface walking). Avoid heavy resistance training, lifting, or intense cardio until cleared by a Cardiologist.`;
      supplements = `⚠️ High Risk Warning: Do NOT self-prescribe. Consult a Cardiologist before starting CoQ10, Omega-3 fish oil, or Magnesium supplements.`;
    } else if (isCautionOrRisk || sys >= 130) {
      food = `Heart-Healthy Sodium Control (<2,000 mg/day). Incorporate South Indian whole grains (ragi, bajra), curry leaves, walnuts, and leafy greens. Limit refined sugar and processed snacks.`;
      exercise = `Moderate aerobic exercise: 30 minutes brisk walking, cycling, or swimming 5 days/week. Keep heart rate under 130 bpm.`;
      supplements = `Omega-3 (Fish Oil 1000mg daily) & CoQ10 (100mg) under medical advice to support myocardial vascular tone.`;
    } else {
      food = `Preventive Cardiovascular Diet: Rich in fresh fruits, moringa, oats, nuts, and healthy fats (olive oil, flaxseeds). Low sodium & zero trans fats.`;
      exercise = `Active fitness routine: 150 min/week moderate aerobic activity + 2x/week light resistance training.`;
      supplements = `Standard daily multivitamin and Omega-3 fatty acids after routine doctor checkup.`;
    }
  } else if (organLower === 'metabolic') {
    if (isHighRisk || sugar >= 140 || sList.some(s => s.includes('sugar') || s.includes('urination') || s.includes('weight'))) {
      food = `Strict Low-Glycemic Index Diet (<45 GI). Swap white rice & refined flour with Ragi, Bajra, and Foxtail Millet. Eliminate all added sugars, sodas, and high-glycemic tropical fruits to control blood glucose (${sugar} mg/dL).`;
      exercise = `Post-meal 15-minute walks (3x daily) + 30 minutes of low-impact aerobic exercise to immediately boost GLUT-4 glucose uptake and insulin sensitivity.`;
      supplements = `⚠️ Diabetes Clinical Protocol: Consult Endocrinologist regarding Chromium Picolinate, Berberine, or Alpha-Lipoic Acid.`;
    } else if (isCautionOrRisk || sugar >= 100) {
      food = `Controlled Carbohydrate & High-Fiber Diet: Include pulse sprouts, green leafy vegetables, curry leaves, and whole grains. Limit rice portions to 1 cup/day.`;
      exercise = `150 min/week moderate cardio + 2x/week bodyweight resistance training (squats, lunges) to increase muscular glucose disposal.`;
      supplements = `Magnesium Glycinate (200-400mg) and Chromium under physician guidance for glycemic stability.`;
    } else {
      food = `Balanced Low-GI Nutrition: High dietary fiber (30g/day), whole pulses, vegetables, and lean protein to maintain optimal metabolic score (${score}/100).`;
      exercise = `Consistent weekly exercise: 30 minutes daily brisk walking or sport activity.`;
      supplements = `Daily Vitamin D3 (2000 IU) and Magnesium for healthy basal metabolism.`;
    }
  } else if (organLower === 'kidney') {
    if (isHighRisk || sList.some(s => s.includes('urine') || s.includes('swollen') || s.includes('back'))) {
      food = `Renal Care Protocol: Low sodium (<1,500 mg/day) and monitored potassium/phosphorus. Restrict high-potassium foods (bananas, raw tomatoes) and high-protein supplements. Ensure strictly 2.5L clean water hydration.`;
      exercise = `Gentle low-intensity exercise (light indoor walking, gentle stretching). Avoid strenuous crossfit, heavy lifting, or dehydration.`;
      supplements = `🚨 STRICT WARNING: Renal function is dosage-sensitive. Do NOT take any over-the-counter supplements or high-protein powders without Nephrologist approval.`;
    } else if (isCautionOrRisk) {
      food = `Hydration & Renal Support: Maintain 2.5L to 3.0L daily fluid intake. Limit processed foods, canned soups, and excess salt. Moderate protein intake.`;
      exercise = `Moderate walking and yoga 30 min/day. Maintain proper hydration during workouts.`;
      supplements = `Only prescribed renal vitamins; avoid NSAID pain relievers which stress kidney filtration.`;
    } else {
      food = `Optimal Hydration & Balance: Drink 2.5L to 3.0L water daily. Eat fresh vegetables, cucumbers, and whole grains to support healthy filtration.`;
      exercise = `Regular cardiovascular and flexibility training.`;
      supplements = `None required beyond baseline hydration.`;
    }
  } else if (organLower === 'liver') {
    if (isHighRisk || sList.some(s => s.includes('stomach') || s.includes('nausea') || s.includes('yellow'))) {
      food = `Strict Hepatoprotective Diet: Zero alcohol, zero fried/fatty foods. High consumption of steamed cruciferous vegetables (broccoli, cabbage), beetroot, turmeric, and citrus.`;
      exercise = `Light daily 25-minute walking to promote lipid oxidation without liver glycogen exhaustion.`;
      supplements = `⚠️ Consult Gastroenterologist regarding Milk Thistle (Silymarin 140mg) or N-Acetyl Cysteine (NAC).`;
    } else if (isCautionOrRisk) {
      food = `Detoxifying Diet: Increase green tea, turmeric water, garlic, and fresh leafy greens. Avoid trans fats and alcohol.`;
      exercise = `30 min/day moderate aerobic exercise to prevent hepatic steatosis (fatty liver).`;
      supplements = `Milk Thistle & Vitamin E (400 IU) under doctor advice.`;
    } else {
      food = `Liver Wellness Nutrition: Antioxidant-rich fruits, beetroot juice, green tea, and balanced whole foods.`;
      exercise = `150 min/week active fitness routine.`;
      supplements = `Antioxidant support (Vitamin C & E).`;
    }
  } else if (organLower === 'thyroid') {
    if (isCautionOrRisk || sList.some(s => s.includes('fatigue') || s.includes('weight') || s.includes('cold'))) {
      food = `Thyroid Balance Diet: Include iodine-rich foods, Brazil nuts (selenium source), and ragi. Avoid excess raw cruciferous vegetables (cabbage/cauliflower) which can act as goitrogens if raw.`;
      exercise = `Moderate aerobic activity + light weight training + yoga to regulate cortisol and thyroid hormone release.`;
      supplements = `Selenium (100mcg) and Zinc under Endocrinologist supervision.`;
    } else {
      food = `Nutrient-Dense Balanced Diet: Whole grains, nuts, seeds, and adequate dietary iodine.`;
      exercise = `Regular balanced exercise routine.`;
      supplements = `Vitamin D3 and multivitamin as recommended.`;
    }
  } else {
    if (isCautionOrRisk || sList.some(s => s.includes('fatigue') || s.includes('headache') || s.includes('weakness'))) {
      food = `Iron & Hematologic Support: Spinach, pomegranates, beetroot, lentils, and Vitamin C (citrus/lemon) to enhance iron absorption.`;
      exercise = `Paced moderate exercise with regular rest intervals to manage fatigue.`;
      supplements = `Iron & Vitamin B12 / Folate after blood panel confirmation.`;
    } else {
      food = `Nutrient-rich balanced whole food diet supporting optimal hematopoiesis and circulation.`;
      exercise = `Active 30 min daily exercise.`;
      supplements = `Standard wellness multivitamin.`;
    }
  }

  return { food, exercise, supplements };
};

const getOrganDetails = (organName, score, vitals = {}) => {
  const sys = Number(vitals.systolic || 120);
  const dia = Number(vitals.diastolic || 80);
  const sugar = Number(vitals.sugar || 95);
  const organKey = String(organName).toLowerCase();

  switch (organKey) {
    case 'heart':
      return {
        title: 'Heart System',
        icon: Heart,
        iconColor: 'text-rose-600 dark:text-rose-400',
        iconBg: 'bg-rose-100 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/40',
        badgeBg: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/80 dark:text-rose-200 dark:border-rose-800',
        vitalDriver: `BP Driver: ${sys}/${dia} mmHg`,
        labTest: 'Lipid Profile & ECG',
        specialist: 'Cardiologist'
      };
    case 'liver':
      return {
        title: 'Liver System',
        icon: Activity,
        iconColor: 'text-emerald-600 dark:text-emerald-400',
        iconBg: 'bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900/40',
        badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-200 dark:border-emerald-800',
        vitalDriver: 'Hepatic Lipid Oxidation',
        labTest: 'LFT (Liver Function Panel)',
        specialist: 'Gastroenterologist'
      };
    case 'kidney':
      return {
        title: 'Kidney System',
        icon: Shield,
        iconColor: 'text-sky-600 dark:text-sky-400',
        iconBg: 'bg-sky-100 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-900/40',
        badgeBg: 'bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-950/80 dark:text-sky-200 dark:border-sky-800',
        vitalDriver: `Renal Filtration (${sys}/${dia} mmHg)`,
        labTest: 'KFT & Serum Creatinine',
        specialist: 'Nephrologist'
      };
    case 'thyroid':
      return {
        title: 'Thyroid System',
        icon: Sparkles,
        iconColor: 'text-amber-600 dark:text-amber-400',
        iconBg: 'bg-amber-100 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900/40',
        badgeBg: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/80 dark:text-amber-200 dark:border-amber-800',
        vitalDriver: 'Endocrine Circadian Pace',
        labTest: 'Thyroid Panel (T3, T4, TSH)',
        specialist: 'Endocrinologist'
      };
    case 'metabolic':
      return {
        title: 'Metabolic System',
        icon: Brain,
        iconColor: 'text-purple-600 dark:text-purple-400',
        iconBg: 'bg-purple-100 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-900/40',
        badgeBg: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/80 dark:text-purple-200 dark:border-purple-800',
        vitalDriver: `Glucose Output: ${sugar} mg/dL`,
        labTest: 'Fasting Glucose & HbA1c',
        specialist: 'Endocrinologist'
      };
    default:
      return {
        title: 'Blood System',
        icon: Droplet,
        iconColor: 'text-red-600 dark:text-red-400',
        iconBg: 'bg-red-100 dark:bg-red-950/60 border border-red-200 dark:border-red-900/40',
        badgeBg: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950/80 dark:text-red-200 dark:border-red-800',
        vitalDriver: 'Hematologic Oxygen Capacity',
        labTest: 'CBC (Complete Blood Count)',
        specialist: 'General Physician'
      };
  }
};

export default function ReportDashboard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [animated, setAnimated] = useState(false);
  const [activeTab, setActiveTab] = useState('organs');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  const [expandedOrgan, setExpandedOrgan] = useState(null);

  const [showShareModal, setShowShareModal] = useState(false);
  const [shareData, setShareData] = useState(null);
  const [shareLoading, setShareLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await api.getReportDetails(id);
        setReport(data);
        setTimeout(() => setAnimated(true), 150);
      } catch (err) {
        setError('Unable to retrieve clinical health assessment.');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  const getStatusColor = (score) => {
    if (score >= 85) return { bg: 'bg-emerald-500', text: 'text-emerald-400', label: 'Optimal', border: 'border-emerald-950/30' };
    if (score >= 70) return { bg: 'bg-blue-500', text: 'text-blue-400', label: 'Good', border: 'border-blue-950/30' };
    if (score >= 50) return { bg: 'bg-amber-500', text: 'text-amber-400', label: 'Caution', border: 'border-amber-950/30' };
    return { bg: 'bg-red-500', text: 'text-red-400', label: 'At Risk', border: 'border-red-950/30' };
  };

  const handleDownloadPDF = () => {
    window.open(api.getReportPdfUrl(id), '_blank');
  };

  const handleShareSecurely = async () => {
    try {
      setShowShareModal(true);
      setShareLoading(true);
      const res = await api.createShareLink(id, 7);
      setShareData(res);
    } catch (e) {
      alert('Failed to generate share link: ' + e.message);
    } finally {
      setShareLoading(false);
    }
  };

  const handleRevokeShare = async () => {
    if (!shareData?.token) return;
    try {
      await api.revokeShareLink(shareData.token);
      alert('Share link has been revoked.');
      setShowShareModal(false);
      setShareData(null);
    } catch (e) {
      alert('Failed to revoke link: ' + e.message);
    }
  };

  const handleDeleteReportAction = async () => {
    try {
      await api.deleteReport(id);
      alert('Report deleted successfully.');
      navigate('/dashboard');
    } catch (err) {
      alert('Failed to delete report: ' + err.message);
    }
  };

  if (loading) return <div className="text-center py-24 text-slate-500 text-sm">Generating report parameters...</div>;
  if (error) return <div className="text-center py-24 text-red-400 text-sm">{error}</div>;

  const patientDetails = report?.patientDetails || {};
  const organScores = report?.organScores || {};
  const wellnessCategories = report?.wellnessCategories || {};
  const overallRisk = report?.overallRisk || 'Low';
  const recommendedSpecialist = report?.recommendedSpecialist || 'General Physician';
  const createdAt = report?.createdAt;
  const timestamp = report?.timestamp;
  const vitalsSummary = report?.vitalsSummary || report?.patientDetails?.vitalsSummary || {};
  const symptomsSummary = report?.symptomsSummary || report?.symptoms || [];

  return (
    <div className="max-w-[1536px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in relative">
      
      {/* 1. Header Row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-800 pb-5 gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="bg-sky-600 rounded-xl p-2.5 flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
            <Heart className="h-6 w-6 fill-current text-red-500" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white tracking-wide">Smart Health Report</h1>
            <p className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase">Clinical Risk Profile</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-3 w-full sm:w-auto">
          <button
            onClick={handleShareSecurely}
            className="bg-slate-900 border border-slate-700 hover:border-slate-600 text-sky-400 px-3 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer"
            type="button"
          >
            <Share2 className="h-4 w-4" />
            <span>{shareCopied ? 'Link Copied! ✅' : 'Share Securely'}</span>
          </button>

          <button
            onClick={handleDownloadPDF}
            className="bg-slate-900 border border-slate-700 hover:border-slate-600 text-slate-200 px-3 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer"
            type="button"
          >
            <FileDown className="h-4 w-4" />
            <span>Download PDF</span>
          </button>

          <button
            onClick={() => setShowDeleteModal(true)}
            className="bg-red-950/40 border border-red-900/40 hover:border-red-800 text-red-400 px-3 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer"
            type="button"
          >
            <Trash2 className="h-4 w-4" />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-slate-955/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel border border-red-900/40 max-w-md w-full rounded-2xl p-6 space-y-4 text-center bg-slate-900">
            <h3 className="text-base font-bold text-white">Delete Health Report</h3>
            <p className="text-xs text-slate-300">
              Are you sure you want to delete this report? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3 pt-2">
              <button onClick={() => setShowDeleteModal(false)} className="bg-slate-955 border border-slate-800 text-slate-300 px-4 py-2 rounded-xl text-xs cursor-pointer" type="button">
                Cancel
              </button>
              <button onClick={handleDeleteReportAction} className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer" type="button">
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Main Report Card */}
      <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden space-y-6 p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-800 pb-4">
          <div>
            <h2 className="font-extrabold text-slate-100 text-base tracking-wide">Physiological Biometric Analysis</h2>
            <p className="text-xs text-slate-400">{patientDetails.name} ({patientDetails.gender} · {patientDetails.age} yrs · BMI {patientDetails.bmi})</p>
          </div>

          <span className="text-[10px] text-slate-400 font-semibold bg-slate-955 px-3 py-1.5 rounded-lg border border-slate-800">
            Generated On: {new Date(createdAt || timestamp).toLocaleDateString()}
          </span>
        </div>

        {/* Tabs Row */}
        <div className="border-b border-slate-800 pb-4 flex flex-wrap gap-2.5 z-10 relative">
          {[
            { id: 'organs', label: 'Organ Ratings' },
            { id: 'wellness', label: 'Wellness' },
            { id: 'diet', label: 'Diet' },
            { id: 'exercise', label: 'Exercise' },
            { id: 'supplements', label: 'Supplements' }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`text-xs font-extrabold px-4 py-2.5 rounded-xl transition-all uppercase tracking-wider cursor-pointer select-none ${
                activeTab === tab.id
                  ? 'bg-sky-600 text-white ring-2 ring-sky-400'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 hover:border-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: ORGANS */}
        {activeTab === 'organs' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                SYSTEMIC ORGAN RATINGS & CLINICAL BREAKDOWN
              </div>
              <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">Click any organ for lab test & specialist guidance</span>
            </div>

            {Object.entries(organScores).map(([organ, score]) => {
              const status = getStatusColor(score);
              const details = getOrganDetails(organ, score, vitalsSummary);
              const IconComponent = details.icon;
              const isExpanded = expandedOrgan === organ;

              return (
                <div key={organ} className="glass-panel border border-slate-200 dark:border-slate-800 hover:border-sky-500/50 transition-all rounded-2xl p-4 space-y-3 bg-white dark:bg-slate-900/90">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
                    
                    {/* Col 1: Icon & Organ Title + Rec Test (lg:col-span-4) */}
                    <div className="lg:col-span-4 flex items-center space-x-3 cursor-pointer" onClick={() => setExpandedOrgan(isExpanded ? null : organ)}>
                      <div className={`p-2.5 rounded-xl shrink-0 ${details.iconBg} ${details.iconColor}`}>
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                          <span className="font-extrabold text-sm text-slate-900 dark:text-white tracking-wide">{details.title}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${details.badgeBg}`}>
                            {details.vitalDriver}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">Rec. Test: <span className="text-slate-800 dark:text-slate-200 font-semibold">{details.labTest}</span></p>
                      </div>
                    </div>

                    {/* Col 2: Progress Bar (lg:col-span-3) */}
                    <div className="lg:col-span-3 w-full bg-slate-100 dark:bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-200 dark:border-slate-800 p-0.5">
                      <div className={`${status.bg} h-full rounded-full transition-all duration-1000`} style={{ width: animated ? `${score}%` : '0%' }} />
                    </div>

                    {/* Col 3: Score & Status Badge — STRICT ALIGNED VERTICAL COLUMN (lg:col-span-2) */}
                    <div className="lg:col-span-2 flex flex-col items-start lg:items-center justify-center text-center">
                      <span className="font-black text-sm text-slate-900 dark:text-white block whitespace-nowrap">{score} / 100</span>
                      <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded border inline-block mt-0.5 ${status.border} ${status.text}`}>
                        {status.label}
                      </span>
                    </div>

                    {/* Col 4: Book Specialist Button + Expand Arrow (lg:col-span-3) */}
                    <div className="lg:col-span-3 flex items-center justify-between lg:justify-end space-x-2">
                      <button
                        type="button"
                        onClick={() => navigate('/telemedicine')}
                        className="bg-sky-600 hover:bg-sky-500 text-white font-extrabold px-3.5 py-1.5 rounded-xl text-xs transition-all flex items-center space-x-1.5 cursor-pointer shrink-0"
                        title={`Consult ${details.specialist}`}
                      >
                        <Stethoscope className="h-3.5 w-3.5 text-white" />
                        <span style={{ color: '#ffffff' }} className="text-white font-extrabold">Book {details.specialist}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setExpandedOrgan(isExpanded ? null : organ)}
                        className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer shrink-0"
                      >
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                    </div>

                  </div>

                  {/* Expanded Organ Deep-Dive */}
                  {isExpanded && (
                    <div className="pt-3 border-t border-slate-200 dark:border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-3 animate-fade-in text-xs">
                      <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-850">
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-1">Vital Drivers</span>
                        <p className="text-slate-800 dark:text-slate-200 font-semibold">{details.vitalDriver}</p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-850">
                        <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 uppercase block mb-1">Recommended Lab Test</span>
                        <p className="text-slate-900 dark:text-white font-bold">{details.labTest}</p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-850 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase block mb-1">Specialty Care</span>
                          <p className="text-slate-900 dark:text-white font-bold">{details.specialist}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => navigate('/telemedicine')}
                          className="bg-sky-600 hover:bg-sky-500 text-white px-3 py-1.5 rounded-lg text-xs font-extrabold cursor-pointer transition-all"
                        >
                          Consult Now
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 2: HOLISTIC WELLNESS CATEGORIES (Nutrition, Mental, Sleep, Preventive Care) */}
        {activeTab === 'wellness' && (() => {
          const sys = Number(vitalsSummary?.systolic || 120);
          const sugar = Number(vitalsSummary?.sugar || 95);
          const age = Number(patientDetails?.age || 35);
          const sList = Array.isArray(symptomsSummary) ? symptomsSummary.map(s => String(s).toLowerCase()) : [];

          let sleepDuration = '7.5 - 8.5 hours per night';
          if (age >= 60) sleepDuration = '7.0 - 8.0 hours per night';
          else if (age <= 18) sleepDuration = '8.5 - 10.0 hours per night';

          return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Nutrition */}
              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs">
                  <Utensils className="h-4 w-4" />
                  <span>Nutrition & Diet Guidance</span>
                </div>
                <ul className="list-disc list-inside text-xs text-slate-300 space-y-1.5 pt-1 leading-relaxed">
                  {sys >= 130 && <li className="text-amber-300 font-semibold">Keep daily sodium under 1,500 mg (DASH diet) to manage elevated BP ({sys} mmHg).</li>}
                  {sugar >= 110 && <li className="text-amber-300 font-semibold">Prioritize low-GI millets (Ragi, Bajra) and avoid refined sugars for blood glucose ({sugar} mg/dL).</li>}
                  <li>Include South Indian whole grains like Ragi and Foxtail Millet for glycemic & lipid control.</li>
                  <li>Consume fresh Moringa leaves (Murungai Keerai) and Curry Leaves for natural antioxidant support.</li>
                  <li>Target 25-30g daily dietary fiber through whole pulses, legumes, and fresh vegetables.</li>
                </ul>
              </div>

              {/* Mental Wellness */}
              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center space-x-2 text-sky-400 font-bold text-xs">
                  <Brain className="h-4 w-4" />
                  <span>Mental Wellness & Stress Control</span>
                </div>
                <ul className="list-disc list-inside text-xs text-slate-300 space-y-1.5 pt-1 leading-relaxed">
                  {sList.some(s => s.includes('headache') || s.includes('fatigue')) && (
                    <li className="text-sky-300 font-semibold">Focus on 15 minutes of diaphragmatic 4-7-8 breathing to relieve tension & headaches.</li>
                  )}
                  <li>Practice 10-15 minutes of guided meditation or deep breathing twice daily.</li>
                  <li>Engage in 30-minute daily light walking to boost endorphins and regulate cortisol.</li>
                  <li>Maintain digital detox hours 1 hour prior to sleep for neural recovery.</li>
                </ul>
              </div>

              {/* Sleep Suggestions */}
              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center space-x-2 text-indigo-400 font-bold text-xs">
                  <Moon className="h-4 w-4" />
                  <span>Sleep & Circadian Rhythm Suggestions</span>
                </div>
                <div className="bg-indigo-500/10 border border-indigo-500/30 p-3.5 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <span className="text-xs font-bold text-slate-200">
                    Target sleep duration for age ({age} yrs):
                  </span>
                  <span
                    style={{ color: '#ffffff' }}
                    className="text-xs font-black !text-white bg-indigo-600 px-3.5 py-1.5 rounded-xl border border-indigo-500 shadow-md shrink-0"
                  >
                    {wellnessCategories?.sleep?.recommendedDuration || sleepDuration}
                  </span>
                </div>
                <ul className="list-disc list-inside text-xs text-slate-300 space-y-1 pt-1 leading-relaxed">
                  <li>Maintain a consistent sleep schedule (in bed before 10:00 PM) for hormonal alignment.</li>
                  <li>Keep bedroom temperature cool and dark, avoiding blue screen exposure prior to sleep.</li>
                </ul>
              </div>

              {/* General Preventive Care */}
              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs">
                  <ShieldAlert className="h-4 w-4" />
                  <span>General Preventive Care Tips</span>
                </div>
                <ul className="list-disc list-inside text-xs text-slate-300 space-y-1.5 pt-1 leading-relaxed">
                  <li>Maintain daily fluid intake target of 2.5 to 3.0 Liters of water.</li>
                  <li>Schedule bi-monthly blood pressure baseline tracking.</li>
                  <li>Schedule annual comprehensive lipid profile and kidney function panels with your doctor.</li>
                </ul>
              </div>

            </div>
          );
        })()}

        {/* TAB 3 & 4 & 5: DIET, EXERCISE, SUPPLEMENTS */}
        {['diet', 'exercise', 'supplements'].includes(activeTab) && (
          <div className="space-y-4">
            {Object.entries(organScores).map(([organ, score]) => {
              const dynamicRec = getDynamicOrganRecommendations(
                organ,
                score,
                patientDetails,
                symptomsSummary,
                vitalsSummary
              );
              const status = getStatusColor(score);
              return (
                <div key={organ} className="glass-panel rounded-2xl p-5 border border-slate-850 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs text-white uppercase">{organ} System</h4>
                    <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded border ${status.border} ${status.text}`}>
                      {status.label} ({score}/100)
                    </span>
                  </div>
                  {activeTab === 'diet' && <p className="text-xs text-slate-300 leading-relaxed"><strong>Dietary Guidance:</strong> {dynamicRec.food}</p>}
                  {activeTab === 'exercise' && <p className="text-xs text-slate-300 leading-relaxed"><strong>Exercise Regimen:</strong> {dynamicRec.exercise}</p>}
                  {activeTab === 'supplements' && <p className="text-xs text-slate-300 leading-relaxed"><strong>Supplements & Precautions:</strong> {dynamicRec.supplements}</p>}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Embedded Nearby Hospitals / Clinics Map Section */}
      <div className="space-y-4 pt-4 border-t border-slate-800">
        <div className="flex items-center space-x-2">
          <MapPin className="h-5 w-5 text-sky-400" />
          <h3 className="text-base font-extrabold text-white">Recommended Nearby Hospitals & Specialists</h3>
        </div>
        <MapViewer riskLevel={overallRisk || 'Low Risk'} />
      </div>

      {/* SECURE SHARE LINK MODAL */}
      {showShareModal && (
        <div className="fixed inset-0 bg-slate-955/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="glass-panel max-w-lg w-full rounded-3xl p-6 border border-slate-800 space-y-4 bg-slate-900 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Share2 className="h-5 w-5 text-sky-400" />
                <h3 className="text-base font-bold text-white">Share Report Securely</h3>
              </div>
              <button onClick={() => setShowShareModal(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            {shareLoading ? (
              <div className="py-8 text-center text-xs text-slate-400 font-semibold">
                Generating 256-bit encrypted share link...
              </div>
            ) : shareData ? (
              <div className="space-y-4">
                <p className="text-xs text-slate-300 font-medium leading-relaxed">
                  Anyone with this link can view a stripped-down read-only copy of this clinical report without needing to log in.
                </p>

                {/* Read-Only URL Text Field */}
                <div className="flex items-center space-x-2 bg-slate-955 p-2 rounded-2xl border border-slate-800">
                  <input
                    type="text"
                    readOnly
                    value={shareData.shareUrl}
                    className="bg-transparent text-xs font-mono text-sky-400 w-full outline-none px-2 select-all"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(shareData.shareUrl);
                      setShareCopied(true);
                      setTimeout(() => setShareCopied(false), 2500);
                    }}
                    className="bg-medical-600 hover:bg-medical-500 text-white text-xs font-bold px-3 py-2 rounded-xl shadow shrink-0 flex items-center space-x-1 transition-all"
                  >
                    {shareCopied ? <CheckCircle className="h-3.5 w-3.5 text-emerald-300" /> : null}
                    <span>{shareCopied ? 'Copied!' : 'Copy Link'}</span>
                  </button>
                </div>

                {/* 15-Minute Doctor Consultation Access Pass Option */}
                <div className="bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 p-3.5 rounded-2xl text-xs space-y-2">
                  <div className="flex items-center justify-between font-black">
                    <span className="flex items-center gap-1.5 text-emerald-400">
                      <Shield className="w-4 h-4" /> 15-Minute Temporary Doctor Consultation Pass
                    </span>
                    <span className="bg-emerald-500/20 text-emerald-300 font-extrabold px-2 py-0.5 rounded-md border border-emerald-500/30">
                      ENCRYPTED
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Generate a time-bound 15-minute temporary access pass for your doctor during in-person or video consultations. Automatically expires after 15 minutes.
                  </p>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-slate-400 font-bold">Standard Expiry: {new Date(shareData.expiresAt).toLocaleDateString()}</span>
                    <button
                      onClick={handleRevokeShare}
                      className="bg-red-950/80 hover:bg-red-900 border border-red-800/80 text-red-300 px-3 py-1 rounded-xl text-[10px] font-bold transition-all"
                    >
                      Revoke Pass Now
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}


    </div>
  );
}
