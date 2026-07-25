import React, { useState, useEffect } from 'react';
import { Droplet, Plus, RefreshCw } from 'lucide-react';

export default function HydrationTracker() {
  const targetMl = 2500;
  const [intakeMl, setIntakeMl] = useState(() => {
    const savedDate = localStorage.getItem('hydration_date');
    const today = new Date().toISOString().split('T')[0];
    if (savedDate === today) {
      const saved = localStorage.getItem('hydration_ml');
      return saved !== null ? Number(saved) : 0;
    }
    return 0;
  });

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem('hydration_date', today);
    localStorage.setItem('hydration_ml', intakeMl);
  }, [intakeMl]);

  const addIntake = (amount) => {
    setIntakeMl((prev) => Math.min(prev + amount, 4000));
  };

  const resetIntake = () => {
    setIntakeMl(0);
  };

  const percentage = Math.min(Math.round((intakeMl / targetMl) * 100), 100);

  return (
    <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4 w-full bg-slate-900 shadow-xl text-white">
      {/* Header matching Medicine Schedules style */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Droplet className="h-5 w-5 text-sky-400 fill-current" />
          <h3 className="text-sm font-bold text-white">Hydration Tracker</h3>
        </div>

        <div className="flex items-center space-x-2">
          <span className="bg-sky-500/10 text-sky-400 border border-sky-500/20 text-xs font-bold px-2.5 py-1 rounded-xl shadow">
            2.5L Target
          </span>
          <button
            onClick={resetIntake}
            type="button"
            className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            title="Reset Daily Log"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Inner Card matching Medicine Schedule card inner box */}
      <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-850 space-y-3 text-xs">
        <div className="flex items-center justify-between gap-4">
          {/* Activity Ring */}
          <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-800"
                strokeWidth="4"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-sky-400 transition-all duration-500 ease-out"
                strokeDasharray={`${percentage}, 100`}
                strokeWidth="4"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute text-center">
              <span className="text-[11px] font-black text-white">{percentage}%</span>
            </div>
          </div>

          {/* Intake Stats */}
          <div className="flex-1">
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Daily Hydration Log</div>
            <div className="text-base font-extrabold text-white leading-tight">
              {intakeMl} <span className="text-[11px] text-slate-400 font-semibold">/ {targetMl} mL</span>
            </div>
            <div className="text-[10px] text-sky-400 font-bold mt-0.5">
              {intakeMl >= targetMl ? '🎉 Daily Target Achieved!' : `${targetMl - intakeMl} mL remaining today`}
            </div>
          </div>
        </div>

        {/* Quick Log Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={() => addIntake(250)}
            type="button"
            className="flex items-center justify-center gap-1 py-2 px-3 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-300 font-bold text-xs transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> +250 mL Glass
          </button>
          <button
            onClick={() => addIntake(500)}
            type="button"
            className="flex items-center justify-center gap-1 py-2 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> +500 mL Bottle
          </button>
        </div>
      </div>
    </div>
  );
}
