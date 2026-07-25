import React, { useState } from 'react';
import { Search, Tag, TrendingDown, ShieldCheck, ArrowRight, X, ExternalLink, Percent } from 'lucide-react';

const MEDICINE_DATABASE = [
  {
    brandName: 'Crocin Pain Relief 500mg',
    brandPrice: 42.0,
    genericName: 'Paracetamol 500mg IP (Generic)',
    genericPrice: 9.5,
    savings: 77,
    manufacturer: 'Jan Aushadhi / CIPLA Generic',
    activeIngredient: 'Paracetamol',
    category: 'Pain Relief / Antipyretic',
  },
  {
    brandName: 'Lipitor 10mg',
    brandPrice: 285.0,
    genericName: 'Atorvastatin 10mg (Generic)',
    genericPrice: 48.0,
    savings: 83,
    manufacturer: 'Sun Pharma / Jan Aushadhi',
    activeIngredient: 'Atorvastatin',
    category: 'Cholesterol Control',
  },
  {
    brandName: 'Glycomet SR 500mg',
    brandPrice: 68.0,
    genericName: 'Metformin Hydrochloride 500mg (Generic)',
    genericPrice: 14.0,
    savings: 79,
    manufacturer: 'Jan Aushadhi Kendra',
    activeIngredient: 'Metformin',
    category: 'Diabetes Care',
  },
  {
    brandName: 'Telma 40mg',
    brandPrice: 145.0,
    genericName: 'Telmisartan 40mg (Generic)',
    genericPrice: 32.0,
    savings: 78,
    manufacturer: 'Alkem / Jan Aushadhi',
    activeIngredient: 'Telmisartan',
    category: 'Blood Pressure Control',
  },
  {
    brandName: 'Pantocid 40mg',
    brandPrice: 162.0,
    genericName: 'Pantoprazole 40mg (Generic)',
    genericPrice: 35.0,
    savings: 78,
    manufacturer: 'Zydus / Jan Aushadhi',
    activeIngredient: 'Pantoprazole',
    category: 'Antacid / GERD',
  },
];

export default function PharmacyPriceComparator({ isOpen, onClose }) {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filteredMeds = MEDICINE_DATABASE.filter(
    (m) =>
      m.brandName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.genericName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.activeIngredient.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border-2 border-emerald-500/40 rounded-3xl max-w-3xl w-full p-6 shadow-2xl space-y-5 text-white max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-emerald-500/30">
              <Tag className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white">Pharmacy Price Comparator & Generic Finder</h2>
              <p className="text-xs text-slate-300">
                Compare branded prescription costs against WHO-GMP certified bio-equivalent generics.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            type="button"
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input Bar */}
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by brand name (e.g. Crocin, Lipitor, Telma) or salt..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-800/90 border border-slate-700/80 rounded-2xl pl-12 pr-4 py-3 text-sm text-white placeholder-slate-400 outline-none focus:border-emerald-500 transition-all"
          />
        </div>

        {/* Medicine Comparison Cards */}
        <div className="space-y-3.5">
          {filteredMeds.map((med, index) => (
            <div
              key={index}
              className="bg-slate-800/90 rounded-2xl p-4 border border-slate-700/80 hover:border-emerald-500/50 transition-all space-y-3"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-700/60 pb-2.5">
                <div>
                  <span className="text-[10px] bg-slate-700 text-slate-300 font-bold px-2 py-0.5 rounded-md uppercase">
                    {med.category}
                  </span>
                  <h3 className="text-base font-extrabold text-white mt-1">{med.brandName}</h3>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 line-through">MRP ₹{med.brandPrice.toFixed(2)}</span>
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-black px-2.5 py-1 rounded-xl flex items-center gap-1">
                    <Percent className="w-3.5 h-3.5" /> Save {med.savings}%
                  </span>
                </div>
              </div>

              {/* Generic Substitute Banner */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-3">
                <div>
                  <div className="text-xs font-black text-emerald-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" /> Bio-Equivalent Generic: {med.genericName}
                  </div>
                  <div className="text-[11px] text-slate-300 mt-0.5">
                    Manufacturer: {med.manufacturer} (Same active API ingredient)
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 font-bold">GENERIC PRICE</div>
                    <div className="text-lg font-black text-emerald-400">₹{med.genericPrice.toFixed(2)}</div>
                  </div>

                  <a
                    href="https://janaushadhi.gov.in/"
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs shadow-md flex items-center gap-1 transition-all"
                  >
                    Locate Jan Aushadhi <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
