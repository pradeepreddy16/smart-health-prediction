import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { MessageSquare, X, Send, Bot, CheckSquare, Plus, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SYSTEM_SYMPTOMS = [
  { id: 'chest_pain', en: 'Chest Pain', ta: 'நெஞ்சு வலி', te: 'గుండె నొప్పి', kn: 'ಎದೆ ನೋವು', ml: 'നെഞ്ചുവേദന' },
  { id: 'yellow_skin', en: 'Yellowish Skin/Eyes', ta: 'மஞ்சள் காமாலை/கண்கள்', te: 'పసుపు చర్మం/కళ్ళు', kn: 'ಹಳದಿ ಚರ್ಮ/ಕಣ್ಣುಗಳು', ml: 'മഞ്ഞനിറമുള്ള ചർമ്മം/കണ്ണുകൾ' },
  { id: 'swollen_ankles', en: 'Swollen Ankles/Feet', ta: 'கணுக்கால்/பாத வீக்கம்', te: 'మడమల వాపు', kn: 'ಹಿಮ್ಮಡಿಗಳ ಉತ', ml: 'കണങ്കാലിലെ വീക്കം' },
  { id: 'extreme_fatigue', en: 'Extreme Fatigue', ta: 'அதிகப்படியான சோர்வு', te: 'తీవ్రమైన అలసట', kn: 'ವಿಪರೀತ ಆಯಾಸ', ml: 'കടുത്ത ക്ഷീണം' },
  { id: 'excessive_thirst', en: 'Excessive Thirst', ta: 'அதிகப்படியான தாகம்', te: 'విపరీతమైన దాహం', kn: 'ವಿಪರೀತ ಬಾಯಾರಿಕೆ', ml: 'അമിതമായ ദാഹം' },
  { id: 'dizziness', en: 'Dizziness / Lightheadedness', ta: 'தலைச்சுற்றல்', te: 'కళ్ళు తిరగడం', kn: 'ತಲೆಸುತ್ತು', ml: 'തലകറക്കം' }
];

export default function Chatbot({ onPrefillSymptoms }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [inputText, setInputText] = useState('');
  const chatEndRef = useRef(null);

  const getLanguageLabel = (symptom) => {
    const lang = i18n.language || 'en';
    return symptom[lang] || symptom.en;
  };

  // Set initial welcome message
  useEffect(() => {
    const lang = i18n.language || 'en';
    let welcome = "Hello! I am your AI Symptom Assistant. Check the symptoms you feel below, or type how you feel. I'll help summarize and transfer them to the health predictor.";
    if (lang === 'ta') welcome = "வணக்கம்! நான் உங்கள் AI அறிகுறி உதவியாளர். கீழே உள்ள உங்கள் அறிகுறிகளை தேர்வு செய்யவும் அல்லது தட்டச்சு செய்யவும். அவற்றை சுகாதார கணிப்பு படிவத்திற்கு மாற்ற நான் உதவுகிறேன்.";
    if (lang === 'te') welcome = "నమస్కారం! నేను మీ AI లక్షణాల సహాయకుడిని. మీకు అనిపించే లక్షణాలను కింద సెలెక్ట్ చేయండి లేదా టైప్ చేయండి. వాటిని నేను రిస్క్ ఫారమ్‌కి మారుస్తాను.";
    if (lang === 'kn') welcome = "ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ AI ಲಕ್ಷಣಗಳ ಸಹಾಯಕ. ಕೆಳಗಿರುವ ನಿಮ್ಮ ಲಕ್ಷಣಗಳನ್ನು ಆಯ್ಕೆ ಮಾಡಿ ಅಥವಾ ಟೈಪ್ ಮಾಡಿ. ಅವುಗಳನ್ನು ಫಾರಂಗೆ ವರ್ಗಾಯಿಸಲು ನಾನು ಸಹಾಯ ಮಾಡುತ್ತೇನೆ.";
    if (lang === 'ml') welcome = "നമസ്കാരം! ഞാൻ നിങ്ങളുടെ AI രോഗലക്ഷണ സഹായിയാണ്. താഴെ പറയുന്ന ലക്ഷണങ്ങൾ തിരഞ്ഞെടുക്കുകയോ ടൈപ്പ് ചെയ്യുകയോ ചെയ്യുക. അവ കണക്കുകൂട്ടൽ ഫോമിലേക്ക് മാറ്റാൻ ഞാൻ സഹായിക്കാം.";

    setMessages([
      { id: '1', sender: 'bot', text: welcome, showChecklist: true }
    ]);
  }, [i18n.language, isOpen]);

  // Scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleToggleSymptom = (id) => {
    setSelectedSymptoms(prev => {
      const isExist = prev.includes(id);
      let updated;
      if (isExist) {
        updated = prev.filter(item => item !== id);
      } else {
        updated = [...prev, id];
      }
      return updated;
    });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMsg = { id: Date.now().toString(), sender: 'user', text: inputText };
    setMessages(prev => [...prev, userMsg]);

    const inputLower = inputText.toLowerCase();
    const detected = [];

    // Simple keyword extraction matching English and South Indian strings
    SYSTEM_SYMPTOMS.forEach(s => {
      const enMatch = inputLower.includes(s.en.toLowerCase()) || inputLower.includes(s.id.replace('_', ' '));
      const taMatch = s.ta && inputLower.includes(s.ta);
      const teMatch = s.te && inputLower.includes(s.te);
      const knMatch = s.kn && inputLower.includes(s.kn);
      const mlMatch = s.ml && inputLower.includes(s.ml);
      
      if (enMatch || taMatch || teMatch || knMatch || mlMatch) {
        detected.push(s.id);
      }
    });

    setInputText('');

    // Bot Response Timer
    setTimeout(() => {
      let responseText = "";
      const lang = i18n.language || 'en';

      if (detected.length > 0) {
        // Add to selected list
        setSelectedSymptoms(prev => {
          const combined = new Set([...prev, ...detected]);
          return Array.from(combined);
        });

        if (lang === 'ta') responseText = `மின்னல் வேகத்தில் பகுப்பாய்வு செய்து, ${detected.length} அறிகுறிகளை உங்கள் பட்டியலில் சேர்த்துள்ளேன்! படிவத்திற்கு மாற்ற கீழே உள்ள பட்டனை அழுத்தவும்.`;
        else if (lang === 'te') responseText = `నేను మీ మెసేజ్ ద్వారా ${detected.length} లక్షణాలను గుర్తించాను! వాటిని ఫారంలో నమోదు చేయడానికి కింద క్లిక్ చేయండి.`;
        else if (lang === 'kn') responseText = `ನಿಮ್ಮ ಸಂದೇಶದಿಂದ ನಾನು ${detected.length} ಲಕ್ಷಣಗಳನ್ನು ಗುರುತಿಸಿದ್ದೇನೆ! ಅವುಗಳನ್ನು ಫಾರಂನಲ್ಲಿ ಅಳವಡಿಸಲು ಕೆಳಗೆ ಕ್ಲಿಕ್ ಮಾಡಿ.`;
        else if (lang === 'ml') responseText = `നിങ്ങളുടെ സന്ദേശത്തിൽ നിന്ന് ഞാൻ ${detected.length} ലക്ഷണങ്ങൾ തിരിച്ചറിഞ്ഞു! അവ ഫോമിലേക്ക് മാറ്റാൻ താഴെ ക്ലിക്ക് ചെയ്യുക.`;
        else responseText = `I detected ${detected.length} symptom(s) from your input and added them to your selection! Click the button below to prefill your predictor form.`;
      } else {
        if (lang === 'ta') responseText = "புரிந்துகொண்டேன். தயவுசெய்து உங்கள் அறிகுறிகளை பட்டியலிலிருந்து தேர்வு செய்யவும் அல்லது மேலும் விளக்கமாக குறிப்பிடவும்.";
        else if (lang === 'te') responseText = "అర్థమైంది. దయచేసి కింద ఉన్న లిస్ట్ లోంచి లక్షణాలను ఎంచుకోండి లేదా మరింత వివరంగా టైప్ చేయండి.";
        else if (lang === 'kn') responseText = "ತಿಳಿಯಿತು. ದಯವಿಟ್ಟು ಪಟ್ಟಿಯಿಂದ ನಿಮ್ಮ ಲಕ್ಷಣಗಳನ್ನು ಆಯ್ಕೆಮಾಡಿ ಅಥವಾ ಇನ್ನಷ್ಟು ವಿವರವಾಗಿ ಟೈಪ್ ಮಾಡಿ.";
        else if (lang === 'ml') responseText = "മനസ്സിലായി. ദയവായി താഴെ പറയുന്നവയിൽ നിന്ന് തിരഞ്ഞെടുക്കുക അല്ലെങ്കിൽ കൂടുതൽ വിശദമായി ടೈപ്പ് ചെയ്യുക.";
        else responseText = "I see. Please select your symptoms from the list above or describe them in more detail.";
      }

      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        sender: 'bot',
        text: responseText
      }]);
    }, 800);
  };

  const handlePrefillClick = () => {
    if (onPrefillSymptoms) {
      onPrefillSymptoms(selectedSymptoms);
    }
    setIsOpen(false);
    navigate('/predict', { state: { prefilledSymptoms: selectedSymptoms } });
  };

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-24 right-6 z-40 bg-medical-500 hover:bg-medical-600 text-white rounded-full p-4 shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center border border-medical-400"
      >
        <MessageSquare className="h-6 w-6" />
      </button>

      {/* Floating Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[350px] md:w-[380px] h-[500px] rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl flex flex-col overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="bg-gradient-to-r from-medical-600 to-medical-700 p-4 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <Bot className="h-5 w-5 text-white" />
              <div>
                <h4 className="text-sm font-semibold text-white">Symptom Checker Chat</h4>
                <span className="text-[10px] text-slate-200">Multilingual Assistant</span>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-slate-200 hover:text-white transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs ${
                  msg.sender === 'user'
                    ? 'bg-medical-600 text-white rounded-tr-none'
                    : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-none'
                }`}>
                  <p>{msg.text}</p>
                  
                  {msg.showChecklist && (
                    <div className="mt-3.5 border-t border-slate-700 pt-3.5 space-y-2">
                      <p className="font-semibold text-[10px] text-slate-400 uppercase tracking-wider mb-2">Select Symptoms:</p>
                      {SYSTEM_SYMPTOMS.map((s) => (
                        <label key={s.id} className="flex items-center space-x-2 text-[11px] font-medium text-slate-300 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={selectedSymptoms.includes(s.id)}
                            onChange={() => handleToggleSymptom(s.id)}
                            className="rounded border-slate-700 text-medical-500 focus:ring-0 focus:ring-offset-0 bg-slate-900 h-3.5 w-3.5"
                          />
                          <span>{getLanguageLabel(s)}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Prefill Action Bar */}
          {selectedSymptoms.length > 0 && (
            <div className="bg-slate-950 px-4 py-2 border-t border-slate-800 flex items-center justify-between text-xs animate-fade-in">
              <span className="text-slate-400 font-medium">
                {selectedSymptoms.length} symptom(s) logged
              </span>
              <button
                onClick={handlePrefillClick}
                className="flex items-center space-x-1 font-semibold text-medical-500 hover:text-medical-400 transition-colors"
              >
                <span>Prefill Form</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          )}

          {/* Form input footer */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800 bg-slate-950 flex items-center space-x-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type your symptom here..."
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-200 outline-none focus:border-medical-500 transition-colors placeholder-slate-500"
            />
            <button
              type="submit"
              className="bg-medical-600 hover:bg-medical-500 text-white rounded-xl p-2 transition-colors flex items-center justify-center"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
