import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'ta', label: 'தமிழ் (Tamil)' },
  { code: 'te', label: 'తెలుగు (Telugu)' },
  { code: 'kn', label: 'ಕನ್ನಡ (Kannada)' },
  { code: 'ml', label: 'മലയാളം (Malayalam)' }
];

export default function LanguageSwitcher({ light = false }) {
  const { i18n } = useTranslation();

  const handleLanguageChange = (e) => {
    i18n.changeLanguage(e.target.value);
  };

  return (
    <div className="flex items-center space-x-2">
      <Globe className={`h-4 w-4 ${light ? 'text-slate-400' : 'text-medical-500'}`} />
      <select
        value={i18n.language}
        onChange={handleLanguageChange}
        className={`bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg focus:ring-medical-500 focus:border-medical-500 block p-1.5 cursor-pointer outline-none transition-colors ${
          light ? 'bg-slate-800 border-slate-600' : ''
        }`}
      >
        {LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.label}
          </option>
        ))}
      </select>
    </div>
  );
}
