import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Heart, Sparkles, Activity, ShieldCheck, MapPin, Video, Flame, Clock, 
  ArrowRight, Users, CheckCircle2, PhoneCall, Award, HardDrive, Smartphone,
  Mail, Shield, FileText, HelpCircle, Phone, Lock, ExternalLink
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function LandingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const isLoggedIn = !!token;

  return (
    <div className="space-y-16 py-8 px-4 sm:px-6 lg:px-8 max-w-[1536px] w-full mx-auto animate-fade-in selection:bg-medical-500 selection:text-white flex flex-col justify-between min-h-[calc(100vh-5rem)]">
      
      <div className="space-y-16">
        {/* ── HERO SECTION ────────────────────────────────────────────────────────── */}
        <section className="relative glass-panel rounded-3xl p-8 sm:p-14 border border-slate-800/80 text-center space-y-8 overflow-hidden bg-gradient-to-b from-slate-900 via-slate-955 to-slate-900 shadow-2xl w-full">
          
          {/* Ambient Glow Orbs & Visual Mesh */}
          <div className="absolute -top-32 -left-32 w-[30rem] h-[30rem] bg-medical-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -right-32 w-[30rem] h-[30rem] bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-sky-900/10 via-transparent to-transparent pointer-events-none" />

          <div className="inline-flex items-center space-x-2 bg-medical-500/10 border border-medical-500/20 text-medical-400 text-xs font-extrabold px-4 py-1.5 rounded-full uppercase tracking-wider relative z-10">
            <Sparkles className="h-4 w-4" />
            <span>Next-Generation Preventive Healthcare Platform</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight font-heading leading-tight max-w-5xl mx-auto relative z-10">
            AI-Powered Physiological <br />
            <span className="bg-gradient-to-r from-medical-400 via-sky-400 to-emerald-400 bg-clip-text text-transparent">
              Health Risk Prediction
            </span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-base lg:text-lg max-w-3xl mx-auto font-medium leading-relaxed relative z-10">
            Assess your cardiovascular, metabolic, liver, kidney, thyroid, and blood organ health systems in under 2 minutes. Sync smartwatch vitals, locate nearest hospitals with GPS auto-expansion, and consult verified doctors.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2 relative z-10">
            {isLoggedIn ? (
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full sm:w-auto bg-medical-600 hover:bg-medical-500 text-white font-extrabold text-sm px-8 py-4 rounded-2xl shadow-xl shadow-medical-500/20 flex items-center justify-center space-x-2 transition-all hover:scale-105"
              >
                <span>Go to My Clinical Dashboard</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <>
                <button
                  onClick={() => navigate('/predict')}
                  className="w-full sm:w-auto bg-medical-600 hover:bg-medical-500 text-white font-extrabold text-sm px-8 py-4 rounded-2xl shadow-xl shadow-medical-500/20 flex items-center justify-center space-x-2 transition-all hover:scale-105"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Start Free AI Health Assessment</span>
                </button>

                <button
                  onClick={() => navigate('/login')}
                  className="w-full sm:w-auto bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 hover:text-white font-bold text-sm px-8 py-4 rounded-2xl transition-all"
                >
                  Patient Sign In / Register
                </button>
              </>
            )}
          </div>

          {/* Live Metrics Strip — Stretches Evenly Across Full Width */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 pt-8 border-t border-slate-800/80 w-full max-w-6xl mx-auto text-left relative z-10">
            <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800/80 hover:border-medical-500/40 transition-all">
              <span className="text-2xl sm:text-3xl font-black text-white block">98.4%</span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Clinical Accuracy</span>
            </div>
            <div className="p-4 bg-slate-955/60 rounded-2xl border border-slate-800/80 hover:border-sky-500/40 transition-all">
              <span className="text-2xl sm:text-3xl font-black text-sky-400 block">50,000+</span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Checkups Processed</span>
            </div>
            <div className="p-4 bg-slate-955/60 rounded-2xl border border-slate-800/80 hover:border-emerald-500/40 transition-all">
              <span className="text-2xl sm:text-3xl font-black text-emerald-400 block">24 / 7</span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Telemedicine Care</span>
            </div>
            <div className="p-4 bg-slate-955/60 rounded-2xl border border-slate-800/80 hover:border-amber-500/40 transition-all">
              <span className="text-2xl sm:text-3xl font-black text-amber-400 block">20 - 100 km</span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">GPS Hospital Radius</span>
            </div>
          </div>
        </section>

        {/* ── CORE FEATURES GRID ────────────────────────────────────────────────── */}
        <section className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-wide">
              Comprehensive Clinical Capabilities
            </h2>
            <p className="text-xs text-slate-400 max-w-lg mx-auto">
              Integrated multi-organ risk prediction, wearable IoT synchronization, and instant emergency response.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Feature 1: Organ System Scoring */}
            <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-3 hover:border-medical-500/50 transition-all">
              <div className="bg-medical-600/20 p-3 rounded-2xl text-medical-400 w-fit border border-medical-500/30">
                <Heart className="h-6 w-6" />
              </div>
              <h3 className="text-base font-extrabold text-white">6-Organ System Scoring</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Calculates numerical health scores (0–100) for Cardiovascular, Liver, Kidney, Thyroid, Metabolic, and Blood systems with South Indian dietary guidance (*ragi, moringa*).
              </p>
            </div>

            {/* Feature 2: GPS Hospital Radius Fallback */}
            <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-3 hover:border-sky-500/50 transition-all">
              <div className="bg-sky-500/20 p-3 rounded-2xl text-sky-400 w-fit border border-sky-500/30">
                <MapPin className="h-6 w-6" />
              </div>
              <h3 className="text-base font-extrabold text-white">GPS 20km Auto-Expansion</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Detects nearby facilities within 20 km. If none are found, auto-expands to 50 km and 100 km with exact distance labels (`34 km away`), Directions, and travel advisory cards.
              </p>
            </div>

            {/* Feature 3: Real Telemedicine & Wallet */}
            <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-3 hover:border-emerald-500/50 transition-all">
              <div className="bg-emerald-500/20 p-3 rounded-2xl text-emerald-400 w-fit border border-emerald-500/30">
                <Video className="h-6 w-6" />
              </div>
              <h3 className="text-base font-extrabold text-white">Telemedicine & Health Wallet</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                In-app WebRTC video calls, direct mobile dialing, offline booking, dynamic UPI QR code payments with PhonePe deep links, and downloadable PDF receipts.
              </p>
            </div>

            {/* Feature 4: Multilingual Voice Chatbot */}
            <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-3 hover:border-purple-500/50 transition-all">
              <div className="bg-purple-500/20 p-3 rounded-2xl text-purple-400 w-fit border border-purple-500/30">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="text-base font-extrabold text-white">Multilingual Voice Chatbot</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Voice speech-to-text and text-to-speech support across English, Tamil, Telugu, Kannada, Malayalam, and Hindi with working mute controls and national `108` emergency escalation.
              </p>
            </div>

            {/* Feature 5: Smartwatch Bluetooth Vitals */}
            <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-3 hover:border-amber-500/50 transition-all">
              <div className="bg-amber-500/20 p-3 rounded-2xl text-amber-400 w-fit border border-amber-500/30">
                <Smartphone className="h-6 w-6" />
              </div>
              <h3 className="text-base font-extrabold text-white">Smartwatch Bluetooth Sync</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Pairs with Web Bluetooth wearables to stream Heart Rate, Blood Pressure, SpO2, and step counts directly into patient health risk calculations.
              </p>
            </div>

            {/* Feature 6: Full A4 PDF Reports */}
            <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-3 hover:border-red-500/50 transition-all">
              <div className="bg-red-500/20 p-3 rounded-2xl text-red-400 w-fit border border-red-500/30">
                <HardDrive className="h-6 w-6" />
              </div>
              <h3 className="text-base font-extrabold text-white">Downloadable A4 PDF Reports</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Consolidates patient details, organ scores, vitals assessment, specialist recommendations, and clinical disclaimers into print-ready A4 PDF documents.
              </p>
            </div>

          </div>
        </section>

        {/* ── EMERGENCY HOTLINE & CALL TO ACTION BANNER ─────────────────────────── */}
        <section className="glass-panel rounded-3xl p-8 border border-red-900/40 bg-gradient-to-r from-red-955 via-slate-900 to-slate-950 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-red-400 font-extrabold text-xs uppercase tracking-wider">
              <PhoneCall className="h-4 w-4 animate-pulse" />
              <span>National Emergency Medical Response</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white">
              Experiencing Urgent Chest Discomfort or Fainting?
            </h3>
            <p className="text-xs text-slate-300 max-w-xl">
              Do not delay or self-drive. Call the National Ambulance Service immediately or visit your nearest Primary Health Center (PHC).
            </p>
          </div>

          <a
            href="tel:108"
            className="bg-red-600 hover:bg-red-500 text-white font-black text-sm px-6 py-3.5 rounded-2xl shadow-xl shadow-red-600/30 flex items-center space-x-2 shrink-0 transition-all hover:scale-105"
          >
            <PhoneCall className="h-5 w-5" />
            <span>Call 108 Ambulance</span>
          </a>
        </section>
      </div>

      {/* ── EXCLUSIVE HOME PAGE FOOTER (FLIPKART STYLE - TEXT/LINK BASED, NO LOGO) ──── */}
      <footer className="mt-16 pt-12 pb-8 border-t border-slate-800/80 bg-slate-955/60 rounded-3xl px-6 sm:px-10 space-y-10 text-xs text-slate-400">
        
        {/* Main Footer Links Columns */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          
          {/* Column 1: ABOUT */}
          <div className="space-y-3">
            <h4 className="text-slate-200 font-extrabold text-xs uppercase tracking-wider">ABOUT US</h4>
            <ul className="space-y-2 text-slate-400 font-medium">
              <li><Link to="/predict" className="hover:text-sky-400 transition-colors">Risk Predictor Platform</Link></li>
              <li><Link to="/advance" className="hover:text-sky-400 transition-colors">Advance ML Biomarkers</Link></li>
              <li><Link to="/telemedicine" className="hover:text-sky-400 transition-colors">Verified Doctors Network</Link></li>
              <li><Link to="/find-care" className="hover:text-sky-400 transition-colors">GPS Hospital Discovery</Link></li>
              <li><span className="text-slate-500 cursor-default">Clinical AI Algorithms</span></li>
            </ul>
          </div>

          {/* Column 2: HELP & SUPPORT */}
          <div className="space-y-3">
            <h4 className="text-slate-200 font-extrabold text-xs uppercase tracking-wider">HELP & SUPPORT</h4>
            <ul className="space-y-2 text-slate-400 font-medium">
              <li><Link to="/telemedicine" className="hover:text-sky-400 transition-colors">Telemedicine Guide</Link></li>
              <li><Link to="/dashboard" className="hover:text-sky-400 transition-colors">Wallet & Payment Status</Link></li>
              <li><Link to="/dashboard" className="hover:text-sky-400 transition-colors">Medicine Schedule Help</Link></li>
              <li><a href="tel:108" className="hover:text-red-400 transition-colors flex items-center space-x-1"><span>Emergency Ambulance 108</span></a></li>
              <li><span className="text-slate-500 cursor-default">PDF Report Assistance</span></li>
            </ul>
          </div>

          {/* Column 3: CONSUMER POLICY */}
          <div className="space-y-3">
            <h4 className="text-slate-200 font-extrabold text-xs uppercase tracking-wider">CONSUMER POLICY</h4>
            <ul className="space-y-2 text-slate-400 font-medium">
              <li><span className="hover:text-sky-400 cursor-pointer">Privacy Policy</span></li>
              <li><span className="hover:text-sky-400 cursor-pointer">Terms of Service</span></li>
              <li><span className="hover:text-sky-400 cursor-pointer">Clinical Guardrails & Disclaimer</span></li>
              <li><span className="hover:text-sky-400 cursor-pointer">Patient Data Security</span></li>
              <li><span className="hover:text-sky-400 cursor-pointer">HIPAA & Consent Norms</span></li>
            </ul>
          </div>

          {/* Column 4: CONTACT & REGISTERED OFFICE */}
          <div className="space-y-3">
            <h4 className="text-slate-200 font-extrabold text-xs uppercase tracking-wider">CONTACT & OFFICE</h4>
            <div className="space-y-1.5 text-slate-400 leading-relaxed font-medium">
              <p className="text-white font-bold">Smart Health Prediction Ltd.</p>
              <p>Biometric Clinical AI Wing, Healthcare Tech Park,</p>
              <p>Chennai, Tamil Nadu — 600001, India.</p>
              <p className="pt-1 flex items-center space-x-1">
                <Mail className="h-3.5 w-3.5 text-sky-400 inline shrink-0" />
                <span className="text-slate-300">support@smarthealthpredictor.in</span>
              </p>
              <p className="flex items-center space-x-1">
                <Phone className="h-3.5 w-3.5 text-emerald-400 inline shrink-0" />
                <span className="text-slate-300">+91 (044) 2829-0200 / 108 Emergency</span>
              </p>
            </div>
          </div>

        </div>

        {/* Payment Methods & Social Text Strip */}
        <div className="pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row justify-between items-center gap-4 text-[11px]">
          <div className="flex flex-wrap items-center gap-2 text-slate-400">
            <span className="font-bold text-slate-300 uppercase tracking-wider">Accepted Payment Modes:</span>
            <span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-slate-300 font-mono">UPI QR</span>
            <span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-slate-300 font-mono">PhonePe</span>
            <span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-slate-300 font-mono">Debit/Credit Card</span>
            <span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-slate-300 font-mono">Health Wallet</span>
          </div>

          <div className="flex items-center space-x-4 text-slate-400 font-medium">
            <span className="hover:text-white cursor-pointer transition-colors">Twitter / X</span>
            <span className="hover:text-white cursor-pointer transition-colors">LinkedIn</span>
            <span className="hover:text-white cursor-pointer transition-colors">YouTube</span>
          </div>
        </div>

        {/* Bottom Copyright & Disclaimer Line */}
        <div className="pt-4 border-t border-slate-800/80 text-center space-y-1 text-[10px] text-slate-500">
          <p>© 2026 Smart Health Prediction. All Rights Reserved.</p>
          <p className="max-w-4xl mx-auto leading-normal">
            Disclaimer: Smart Health Prediction is an AI-assisted biometrics and clinical decision support platform. Reports and predictions do not substitute professional medical advice, clinical diagnosis, or hospital emergency treatment.
          </p>
        </div>

      </footer>

    </div>
  );
}
