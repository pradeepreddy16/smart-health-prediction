import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Stethoscope, Calendar, Clock, Video, VideoOff, CheckCircle2, User, PhoneCall } from 'lucide-react';

const MOCK_DOCTORS = [
  { id: 'doc-1', name: 'Dr. Rajesh Swaminathan', specialty: 'Cardiologist', hospital: 'Apollo Greams Road, Chennai', rating: 4.8, rate: '₹1200' },
  { id: 'doc-2', name: 'Dr. Priya Ramachandran', specialty: 'Endocrinologist', hospital: 'Manipal Hospital, Bengaluru', rating: 4.7, rate: '₹1000' },
  { id: 'doc-3', name: 'Dr. Vikram Reddy', specialty: 'Nephrologist', hospital: 'NIMS, Hyderabad', rating: 4.6, rate: '₹1100' },
  { id: 'doc-4', name: 'Dr. Ananya Nair', specialty: 'General Physician', hospital: 'Amrita Medical, Kochi', rating: 4.9, rate: '₹800' }
];

export default function Telemedicine() {
  const { t } = useTranslation();
  const [selectedDoc, setSelectedDoc] = useState(MOCK_DOCTORS[0]);
  const [apptDate, setApptDate] = useState('');
  const [apptTime, setApptTime] = useState('');
  const [success, setSuccess] = useState(false);
  const [activeCall, setActiveCall] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const handleBooking = (e) => {
    e.preventDefault();
    if (!apptDate || !apptTime) return;
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
    }, 4000);
  };

  const startVideoCall = () => {
    setConnecting(true);
    setTimeout(() => {
      setConnecting(false);
      setActiveCall(true);
    }, 2000);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-fade-in">
      
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-extrabold text-white flex items-center space-x-2">
          <Stethoscope className="h-6 w-6 text-medical-500" />
          <span>Telemedicine Consultation Portal</span>
        </h1>
        <p className="text-xs text-slate-400">
          Book instant video appointments or start consultations with South India's top certified health specialists.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Specialists List */}
        <div className="lg:col-span-7 space-y-4">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Available Specialists Online</h2>
          <div className="space-y-4">
            {MOCK_DOCTORS.map((doc) => (
              <div
                key={doc.id}
                onClick={() => setSelectedDoc(doc)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0 ${
                  selectedDoc.id === doc.id
                    ? 'bg-slate-900 border-medical-500 shadow-md shadow-medical-500/10'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center space-x-3.5">
                  <div className="bg-slate-800 h-10 w-10 rounded-full flex items-center justify-center text-slate-400">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-200 text-sm">{doc.name}</h3>
                    <p className="text-xs text-slate-400">{doc.specialty} • {doc.hospital}</p>
                    <span className="text-[10px] text-amber-500 font-bold">★ {doc.rating} Rating</span>
                  </div>
                </div>

                <div className="text-right sm:pl-4">
                  <p className="text-xs text-slate-400">Consultation Fee</p>
                  <p className="text-sm font-bold text-white mt-0.5">{doc.rate}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Appointment Booking Form / Video Console */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Appointment Booking */}
          <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-4">
            <h3 className="font-bold text-slate-200 text-sm flex items-center space-x-2">
              <Calendar className="h-4.5 w-4.5 text-medical-500" />
              <span>Schedule Call with {selectedDoc.name.split(' ')[1]}</span>
            </h3>

            {success ? (
              <div className="bg-emerald-950/20 border border-emerald-900/30 text-emerald-400 text-xs rounded-xl p-4.5 flex items-center space-x-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                <p>Appointment requested! You will receive an SMS reminder link 15 minutes before the session starts.</p>
              </div>
            ) : (
              <form onSubmit={handleBooking} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-semibold uppercase tracking-wider">Select Date</label>
                    <input
                      type="date"
                      required
                      value={apptDate}
                      onChange={(e) => setApptDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-200 outline-none focus:border-medical-500 transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-semibold uppercase tracking-wider">Preferred Time</label>
                    <input
                      type="time"
                      required
                      value={apptTime}
                      onChange={(e) => setApptTime(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-200 outline-none focus:border-medical-500 transition-colors"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-medical-600 hover:bg-medical-500 text-white rounded-xl py-3 font-semibold text-xs tracking-wider uppercase transition-colors shadow-lg shadow-medical-500/20"
                >
                  Confirm Appointment Request
                </button>
              </form>
            )}
          </div>

          {/* Instant Video Call Widget */}
          <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-4">
            <h3 className="font-bold text-slate-200 text-sm flex items-center space-x-2">
              <Video className="h-4.5 w-4.5 text-medical-500" />
              <span>Instant consultation</span>
            </h3>
            
            <p className="text-xs text-slate-400 leading-relaxed">
              Facing an emergency or have quick queries about your report? Start an instant video session with a standby doctor.
            </p>

            {connecting ? (
              <div className="bg-slate-950 h-44 rounded-2xl flex items-center justify-center flex-col space-y-2 border border-slate-800 animate-pulse">
                <Video className="h-6 w-6 text-medical-500" />
                <span className="text-xs text-slate-400">Connecting to secure medical server...</span>
              </div>
            ) : activeCall ? (
              <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden relative h-52 flex items-center justify-center">
                {/* Mock Video camera placeholder */}
                <div className="absolute inset-0 bg-slate-900/80 flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <div className="bg-slate-800 h-14 w-14 rounded-full flex items-center justify-center text-slate-400 mx-auto">
                      <User className="h-6 w-6" />
                    </div>
                    <p className="text-xs font-semibold text-slate-200">Video Feed Connected</p>
                    <p className="text-[10px] text-slate-500">{selectedDoc.name} ({selectedDoc.specialty})</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveCall(false)}
                  className="absolute bottom-4 bg-red-600 hover:bg-red-500 text-white rounded-xl px-4 py-2 text-[10px] font-bold tracking-wider uppercase transition-colors shadow"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={startVideoCall}
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl py-3 font-semibold text-xs tracking-wider uppercase transition-colors flex items-center justify-center space-x-2 border border-slate-700"
              >
                <PhoneCall className="h-4 w-4 text-emerald-500" />
                <span>Start Video Consult Now</span>
              </button>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
