import React, { useState } from 'react';
import { Activity, Sliders, TrendingDown, ArrowRight, ShieldCheck, AlertTriangle, Sparkles, Heart } from 'lucide-react';

export default function WhatIfRiskSimulator({ initialBp = 135, initialGlucose = 140, initialBmi = 26.5 }) {
  const [systolicBp, setSystolicBp] = useState(initialBp);
  const [fastingGlucose, setFastingGlucose] = useState(initialGlucose);
  const [bmi, setBmi] = useState(initialBmi);

  // Baseline risk score formula for interactive demonstration
  const calculateSimulatedRisk = (bp, glucose, bmiVal) => {
    let score = 20;
    
    // BP impact
    if (bp > 140) score += (bp - 140) * 0.6;
    else if (bp > 120) score += (bp - 120) * 0.35;

    // Glucose impact
    if (glucose > 180) score += (glucose - 180) * 0.4;
    else if (glucose > 100) score += (glucose - 100) * 0.3;

    // BMI impact
    if (bmiVal > 30) score += (bmiVal - 30) * 1.5;
    else if (bmiVal > 25) score += (bmiVal - 25) * 0.8;

    const clampedScore = Math.min(Math.max(Math.round(score), 8), 96);
    return clampedScore;
  };

  const currentRiskScore = calculateSimulatedRisk(systolicBp, fastingGlucose, bmi);
  const baselineRiskScore = calculateSimulatedRisk(initialBp, initialGlucose, initialBmi);
  const scoreDifference = baselineRiskScore - currentRiskScore;

  const getRiskStatus = (score) => {
    if (score < 30) return { label: 'Optimal / Low Risk', color: 'text-emerald-400', bg: 'bg-emerald-950/80 border-2 border-emerald-500/60' };
    if (score < 60) return { label: 'Moderate Risk', color: 'text-amber-400', bg: 'bg-amber-950/80 border-2 border-amber-500/60' };
    return { label: 'High Risk', color: 'text-rose-400', bg: 'bg-rose-950/80 border-2 border-rose-500/60' };
  };

  const status = getRiskStatus(currentRiskScore);

  return (
    <div className="rounded-3xl bg-slate-900 border-2 border-emerald-500/50 p-6 shadow-2xl space-y-6 text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center font-extrabold shadow-lg shadow-emerald-500/30 shrink-0">
            <Sliders className="w-6 h-6 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-extrabold text-white tracking-wide">Interactive "What-If" Risk Simulator</h3>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-500/40 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-400" /> LIVE RE-CALCULATION
              </span>
            </div>
            <p className="text-xs text-slate-200 font-bold mt-0.5">
              Adjust your target metrics below to see how lifestyle improvements immediately lower your disease risk.
            </p>
          </div>
        </div>

        {/* Dynamic Risk Gauge Badge */}
        <div className={`px-4 py-2.5 rounded-2xl flex items-center gap-3 shadow-lg shrink-0 ${status.bg}`}>
          <div className="text-right">
            <div className="text-[10px] uppercase font-black tracking-wider text-slate-200">Simulated Risk</div>
            <div className={`text-2xl font-black ${status.color}`}>{currentRiskScore}%</div>
          </div>
          <Heart className={`w-7 h-7 ${status.color} animate-pulse`} />
        </div>
      </div>

      {/* Sliders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Slider 1: Systolic BP */}
        <div className="bg-slate-950 rounded-2xl p-5 border-2 border-slate-800 space-y-4 shadow-md">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black text-white uppercase tracking-wider">
              Systolic BP (mmHg)
            </label>
            <span className={`text-base font-black px-3 py-1 rounded-xl border-2 shadow-md ${
              systolicBp <= 120 ? 'bg-emerald-950 text-emerald-300 border-emerald-500/60' :
              systolicBp <= 140 ? 'bg-amber-950 text-amber-300 border-amber-500/60' :
              'bg-rose-950 text-rose-300 border-rose-500/60'
            }`}>
              {systolicBp} mmHg
            </span>
          </div>

          {/* Black Center Slider Bar */}
          <div className="relative py-2">
            <input
              type="range"
              min="90"
              max="180"
              step="1"
              value={systolicBp}
              onChange={(e) => setSystolicBp(Number(e.target.value))}
              className="w-full h-3 bg-black border border-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-400 shadow-inner"
            />
          </div>

          <div className="flex justify-between text-[11px] text-slate-200 font-extrabold">
            <span className="text-emerald-400">90 (Optimal)</span>
            <span className="text-amber-400">130 (Pre-hypertension)</span>
            <span className="text-rose-400">180 (High)</span>
          </div>
        </div>

        {/* Slider 2: Fasting Glucose */}
        <div className="bg-slate-950 rounded-2xl p-5 border-2 border-slate-800 space-y-4 shadow-md">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black text-white uppercase tracking-wider">
              Fasting Sugar (mg/dL)
            </label>
            <span className={`text-base font-black px-3 py-1 rounded-xl border-2 shadow-md ${
              fastingGlucose <= 100 ? 'bg-emerald-950 text-emerald-300 border-emerald-500/60' :
              fastingGlucose <= 140 ? 'bg-amber-950 text-amber-300 border-amber-500/60' :
              'bg-rose-950 text-rose-300 border-rose-500/60'
            }`}>
              {fastingGlucose} mg/dL
            </span>
          </div>

          {/* Black Center Slider Bar */}
          <div className="relative py-2">
            <input
              type="range"
              min="70"
              max="250"
              step="1"
              value={fastingGlucose}
              onChange={(e) => setFastingGlucose(Number(e.target.value))}
              className="w-full h-3 bg-black border border-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-400 shadow-inner"
            />
          </div>

          <div className="flex justify-between text-[11px] text-slate-200 font-extrabold">
            <span className="text-emerald-400">70 (Normal)</span>
            <span className="text-amber-400">126 (Diabetic)</span>
            <span className="text-rose-400">250 (High)</span>
          </div>
        </div>

        {/* Slider 3: BMI */}
        <div className="bg-slate-950 rounded-2xl p-5 border-2 border-slate-800 space-y-4 shadow-md">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black text-white uppercase tracking-wider">
              Body Mass Index (BMI)
            </label>
            <span className={`text-base font-black px-3 py-1 rounded-xl border-2 shadow-md ${
              bmi <= 24.9 ? 'bg-emerald-950 text-emerald-300 border-emerald-500/60' :
              bmi <= 29.9 ? 'bg-amber-950 text-amber-300 border-amber-500/60' :
              'bg-rose-950 text-rose-300 border-rose-500/60'
            }`}>
              {bmi} kg/m²
            </span>
          </div>

          {/* Black Center Slider Bar */}
          <div className="relative py-2">
            <input
              type="range"
              min="16"
              max="40"
              step="0.5"
              value={bmi}
              onChange={(e) => setBmi(Number(e.target.value))}
              className="w-full h-3 bg-black border border-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-400 shadow-inner"
            />
          </div>

          <div className="flex justify-between text-[11px] text-slate-200 font-extrabold">
            <span className="text-emerald-400">18.5 (Ideal)</span>
            <span className="text-amber-400">25 (Overweight)</span>
            <span className="text-rose-400">40 (Severe)</span>
          </div>
        </div>
      </div>

      {/* Outcome Banner */}
      <div className="rounded-2xl bg-slate-950 border-2 border-slate-800 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shrink-0">
            <TrendingDown className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm font-black text-white">
              {scoreDifference > 0 ? (
                <span className="text-emerald-400 font-black">
                  🎉 Risk Reduction: -{scoreDifference}% drop in clinical risk score!
                </span>
              ) : scoreDifference < 0 ? (
                <span className="text-rose-400 font-black">
                  ⚠️ Risk Increase: +{Math.abs(scoreDifference)}% elevated risk score
                </span>
              ) : (
                <span className="text-slate-100 font-extrabold">
                  Move sliders to see your projected health score improvement.
                </span>
              )}
            </div>
            <p className="text-xs text-slate-300 font-bold mt-0.5">
              Maintaining Blood Pressure ≤120 and Sugar ≤100 significantly decreases cardiovascular risk.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setSystolicBp(118);
            setFastingGlucose(92);
            setBmi(22.5);
          }}
          type="button"
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-lg shrink-0 flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
        >
          Set Optimal Target <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
