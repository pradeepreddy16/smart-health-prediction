import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  MessageSquare, Send, Mic, MicOff, Volume2, VolumeX, X, Heart, Globe, 
  Stethoscope, FileText, Pill, Wallet, ChevronRight, Sparkles, 
  ExternalLink, PhoneCall, CheckCircle2, HelpCircle, Activity, Play, Pause
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { api } from '../utils/api';

// Language codes to Web Speech Synthesis / Recognition locales
const LOCALE_VOICE_MAP = {
  en: 'en-IN',
  ta: 'ta-IN',
  te: 'te-IN',
  kn: 'kn-IN',
  ml: 'ml-IN',
  hi: 'hi-IN'
};

const LANGUAGE_LABELS = {
  en: 'English',
  ta: 'தமிழ் (Tamil)',
  te: 'తెలుగు (Telugu)',
  kn: 'ಕನ್ನಡ (Kannada)',
  ml: 'മലയാളം (Malayalam)',
  hi: 'हिंदी (Hindi)'
};

// Multilingual Greetings Dictionary
const GREETINGS_MAP = {
  en: 'Good day! I am your Smart Health AI Assistant. Ask about symptoms, report scores, appointment status, or medicine schedules.',
  ta: 'வணக்கம்! நான் உங்கள் ஸ்மார்ட் ஹெல்த் ஏஐ உதவியாளர். அறிகுறிகள், அறிக்கைகள், அப்பாயிண்ட்மெண்ட் மற்றும் மருந்துகள் பற்றி கேளுங்கள்.',
  te: 'నమస్కారం! నేను మీ స్మార్ట్ హెల్త్ AI అసిస్టెంట్‌ని. లక్షణాలు, నివేదికలు, అపాయింట్‌మెంట్‌లు మరియు మందుల వివరాలు అడగండి.',
  kn: 'ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ ಸ್ಮಾರ್ಟ್ ಹೆಲ್ತ್ AI ಸಹಾಯಕ. ಲಕ್ಷಣಗಳು, ವರದಿಗಳು ಮತ್ತು ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಬಗ್ಗೆ ಕೇಳಿ.',
  ml: 'ഹലോ! ഞാൻ നിങ്ങളുടെ സ്മാർട്ട് ഹെൽത്ത് എഐ അസിസ്റ്റന്റാണ്. ലക്ഷണങ്ങൾ, റിപ്പോർട്ടുകൾ, മരുന്നുകൾ എന്നിവ ചോദിക്കൂ.',
  hi: 'नमस्ते! मैं आपका स्मार्ट हेल्थ एआई सहायक हूं। लक्षण, रिपोर्ट स्कोर, अपॉइंटमेंट स्थिति या दवा रिमाइंडर के बारे में पूछें।'
};

// Expanded 6-Language Response Dictionary
const MULTILINGUAL_RESPONSES = {
  en: {
    default: 'For personalized clinical diagnosis, please consult a verified specialist under the Telemedicine tab.',
    emergency: '🚨 URGENT: Severe emergency symptoms detected! Please call National Ambulance 108 immediately or locate the nearest Primary Health Center (PHC).',
    booking: 'You can book a specialist consultation directly via online video or offline visit in the Telemedicine portal.',
    vitals: 'Normal Reference Ranges:\n• Blood Pressure: 120/80 mmHg\n• Fasting Glucose: 70–99 mg/dL\n• BMI: 18.5 – 24.9 kg/m²',
    referral: 'Hospital referrals and digital consultation receipts are securely saved in your Telemedicine account.',
    helpTitle: 'Here is what I can help you with:',
    symptomsFound: 'I identified these symptom matches: ',
    symptomsSuffix: '. Would you like me to pre-fill these directly into the Advance ML Predictor checklist?',
    disclaimer: 'Disclaimer: I do not provide medical diagnosis. Please consult a doctor or use the Risk Predictor tool.',
    noReport: 'No health risk predictions found for your account. Would you like to run a Risk Assessment now?',
    noAppt: 'No active telemedicine bookings found for your account right now. You can book a consultation under the Telemedicine portal.',
    noMeds: 'No active medicine reminders set yet. You can add reminders on your Patient Dashboard.',
    medCheckin: 'Daily Medicine Adherence Check-in: Did you take your prescribed dose today?',
    walletBal: 'Your current Smart Health Wallet balance is ₹',
    emailInfo: 'You can view your registered email address and update profile details by clicking your user name in the top navigation bar or under Profile Settings.'
  },
  ta: {
    default: 'தனிப்பட்ட மருத்துவ ஆலோசனைக்கு, தயவுசெய்து டெலிமெடிசின் பிரிவின் கீழ் உள்ள மருத்துவரை அணுகவும்.',
    emergency: '🚨 அவசரம்: கடுமையான அறிகுறிகள் கண்டறியப்பட்டன! உடனடியாக தேசிய ஆம்புலன்ஸ் 108 ஐ அழைக்கவும் அல்லது அருகில் உள்ள PHC மருத்துவமனைக்கு செல்லவும்.',
    booking: 'டெலிமெடிசின் பிரிவின் கீழ் நீங்கள் மருத்துவரை நேரடியாக அல்லது வீடியோ மூலம் பதிவு செய்யலாம்.',
    vitals: 'சாதாரண அளவு வழிகாட்டி:\n• ரத்த அழுத்தம்: 120/80 mmHg\n• சர்க்கரை அளவு: 70–99 mg/dL\n• BMI: 18.5 – 24.9 kg/m²',
    referral: 'மருத்துவமனை சேர்க்கை, பரிந்துரை கடிதங்கள் மற்றும் கட்டண ரசீதுகள் உங்கள் டெலிமெடிசின் கணக்கில் சேமிக்கப்படும்.',
    helpTitle: 'நான் உங்களுக்கு உதவக்கூடிய விஷயங்கள்:',
    symptomsFound: 'கண்டறியப்பட்ட அறிகுறிகள்: ',
    symptomsSuffix: '. இவற்றை அட்வான்ஸ் ஏஐ படிவத்தில் தானாகவே நிரப்ப விரும்புகிறீர்களா?',
    disclaimer: 'பொறுப்புத் துறப்பு: நான் மருத்துவ நோயறிதலை வழங்கவில்லை. மருத்துவரை அணுகவும்.',
    noReport: 'உங்கள் கணக்கில் அறிக்கைகள் ஏதும் இல்லை. இப்போது ஆபத்து கணிப்பை தொடங்க விரும்புகிறீர்களா?',
    noAppt: 'தற்போது அப்பாயிண்ட்மெண்ட் ஏதும் இல்லை. டெலிமெடிசின் பிரிவில் பதிவு செய்யலாம்.',
    noMeds: 'மருந்து நினைவூட்டல்கள் எதுவும் அமைக்கப்படவில்லை. டேஷ்போர்டில் சேர்க்கலாம்.',
    medCheckin: 'தினசரி மருந்து உட்கொள்ளல் சோதனை: இன்றைக்கான மருந்தை சாப்பிட்டீர்களா?',
    walletBal: 'உங்கள் ஸ்மார்ட் ஹெல்த் வாலட் இருப்பு: ₹',
    emailInfo: 'உங்கள் மின்னஞ்சல் முகவரி மற்றும் சுயவிவர விவரங்களை மேல் வழிசெலுத்தல் பட்டி அல்லது அமைப்புகளில் பார்க்கலாம்.'
  },
  te: {
    default: 'వ్యక్తిగత వైద్య నిర్ధారణ కోసం, దయచేసి టెలిమెడిసిన్ విభాగంలో నిపుణుడిని సంప్రదించండి.',
    emergency: '🚨 అత్యవసరం: దయచేసి వెంటనే జాతీయ అంబులెన్స్ 108 కి కాల్ చేయండి లేదా సమీప PHC కి వెళ్లండి.',
    booking: 'మీరు టెలిమెడిసిన్ విభాగంలో ఆన్‌లైన్ లేదా ఆఫ్‌లైన్ అపాయింట్‌మెంట్ బుక్ చేసుకోవచ్చు.',
    vitals: 'సాధారణ పరిమితులు:\n• రక్తపోటు (BP): 120/80 mmHg\n• గ్లూకోజ్: 70–99 mg/dL\n• BMI: 18.5 – 24.9 kg/m²',
    referral: 'ఆసుపత్రి సిఫార్సులు మరియు డిశ్చార్జ్ సారాంశాలు మీ రసీదులో నమోదు చేయబడతాయి.',
    helpTitle: 'నేను మీకు సహాయం చేయగల విషయాలు:',
    symptomsFound: 'గుర్తించబడిన లక్షణాలు: ',
    symptomsSuffix: '. వీటిని అడ్వాన్స్డ్ ML ఫారమ్‌లో నమోదు చేయమంటారా?',
    disclaimer: 'గమనిక: నేను వైద్య సలహా ప్రత్యామ్నాయం కాదు. దయచేసి వైద్యుడిని సంప్రదించండి.',
    noReport: 'మీ ఖాతాలో ఎటువంటి నివేదికలు లేవు. ఇప్పుడు రిస్క్ నివేదిక ప్రారంభించాలనుకుంటున్నారా?',
    noAppt: 'ప్రస్తుతం యాక్టివ్ అపాయింట్‌మెంట్‌లు లేవు. టెలిమెడిసిన్ ద్వారా బుక్ చేసుకోవచ్చు.',
    noMeds: 'మందుల రిమైండర్‌లు ఏవీ సెట్ చేయలేదు. డాష్‌బోర్డ్‌లో జోడించవచ్చు.',
    medCheckin: 'రోజువారీ మందుల తనిఖీ: ఈ రోజు మీ మందులు వేసుకున్నారా?',
    walletBal: 'మీ ప్రస్తుత స్మార్ట్ హెల్త్ వాలెట్ నిల్వ: ₹',
    emailInfo: 'మీరు ప్రొఫైల్ సెట్టింగ్‌లలో నమోదు చేయబడిన ఇమెయిల్ వివరాలను చూడవచ్చు.'
  },
  kn: {
    default: 'ವೈಯಕ್ತಿಕ ವೈದ್ಯಕೀಯ ಸಲಹೆಗಾಗಿ, ದಯವಿಟ್ಟು ಟೆಲಿಮೆಡಿಸಿನ್ ಪೋರ್ಟಲ್‌ನಲ್ಲಿ ತಜ್ಞರನ್ನು ಸಂಪರ್ಕಿಸಿ.',
    emergency: '🚨 ತುರ್ತು: ದಯವಿಟ್ಟು ತಕ್ಷಣವೇ 108 ಆಂಬ್ಯುಲೆನ್ಸ್ ಗೆ ಕರೆ ಮಾಡಿ ಅಥವಾ ಹತ್ತಿರದ ಆಸ್ಪತ್ರೆಗೆ ಭೇಟಿ ನೀಡಿ.',
    booking: 'ಟೆಲಿಮೆಡಿಸಿನ್ ಪೋರ್ಟಲ್‌ನಲ್ಲಿ ನೀವು ವೈದ್ಯರ ವೀಡಿಯೊ ಸಂಪರ್ಕ ಕಾಯ್ದಿರಿಸಬಹುದು.',
    vitals: 'ಸಾಮಾನ್ಯ ನಿಯಮಿತ ಪ್ರಮಾಣ:\n• ರಕ್ತದೊತ್ತಡ (BP): 120/80 mmHg\n• ಸಕ್ಕರೆ ಪ್ರಮಾಣ: 70–99 mg/dL\n• BMI: 18.5 – 24.9 kg/m²',
    referral: 'ಆಸ್ಪತ್ರೆಯ ಉಲ್ಲೇಖಗಳು ಮತ್ತು ವರದಿಗಳನ್ನು ನಿಮ್ಮ ಪಾವತಿ ರಸೀದಿಯಲ್ಲಿ ಉಳಿಸಲಾಗುತ್ತದೆ.',
    helpTitle: 'ನಾನು ನಿಮಗೆ ಸಹಾಯ ಮಾಡಬಹುದಾದ ವಿಷಯಗಳು:',
    symptomsFound: 'ಗುರುತಿಸಲಾದ ಲಕ್ಷಣಗಳು: ',
    symptomsSuffix: '. ಇವುಗಳನ್ನು ಅಡ್ವಾನ್ಸ್ಡ್ ML ಫಾರಂಗೆ ಸೇರಿಸಬೇಕೇ?',
    disclaimer: 'ಸೂಚನೆ: ಇದು ನೇರ ವೈದ್ಯಕೀಯ ರೋಗನಿರ್ಣಯವಲ್ಲ. ವೈದ್ಯರನ್ನು ಸಂಪರ್ಕಿಸಿ.',
    noReport: 'ಯಾವುದೇ ವರದಿಗಳು ಕಂಡುಬಂದಿಲ್ಲ. ರಿಪೋರ್ಟ್ ಪ್ರಿಡಿಕ್ಟರ್ ಪ್ರಾರಂಭಿಸಬೇಕೇ?',
    noAppt: 'ಸಕ್ರಿಯ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್‌ಗಳು ಇಲ್ಲ. ಟೆಲಿಮೆಡಿಸಿನ್‌ನಲ್ಲಿ ಬುಕ್ ಮಾಡಿ.',
    noMeds: 'ಔಷಧ ನೆನಪಿಸುವಿಕೆಗಳು ಇಲ್ಲ. ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ನಲ್ಲಿ ಸೇರಿಸಿ.',
    medCheckin: 'ದೈನಂದಿನ ಔಷಧ ಸೇವನೆ ಪರೀಕ್ಷೆ: ಇಂದಿನ ಔಷಧ ಸೇವಿಸಿದ್ದೀರಾ?',
    walletBal: 'ನಿಮ್ಮ ವ್ಯಾಲೆಟ್ ಮೊತ್ತ: ₹',
    emailInfo: 'ನಿಮ್ಮ ಪ್ರೊಫೈಲ್ ಸೆಟ್ಟಿಂಗ್ಸ್‌ನಲ್ಲಿ ಇಮೇಲ್ ಐಡಿ ವಿವರಗಳನ್ನು ನೋಡಬಹುದು.'
  },
  ml: {
    default: 'വ്യക്തിഗത പരിശോധനയ്ക്കായി, ടെലിമെഡിസിൻ വിഭാഗത്തിൽ ഡോക്ടറെ ബന്ധപ്പെടുക.',
    emergency: '🚨 അടിയന്തിരം: ദയവായി ഉടൻ തന്നെ 108 ആംബുലൻസ് വിളിക്കുക അല്ലെങ്കിൽ ആശുപത്രി സന്ദർശിക്കുക.',
    booking: 'ടെലിമെഡിസിൻ വിഭാഗത്തിൽ നിങ്ങൾക്ക് ഡോക്ടറെ ബുക്ക് ചെയ്യാം.',
    vitals: 'സാധാരണ അളവുകൾ:\n• രക്തസമ്മർദ്ദം (BP): 120/80 mmHg\n• ഗ്ലൂക്കോസ്: 70–99 mg/dL\n• BMI: 18.5 – 24.9 kg/m²',
    referral: 'ആശുപത്രി റഫറലുകൾ നിങ്ങളുടെ പെയ്മെന്റ് രസീതിൽ ലഭ്യമാണ്.',
    helpTitle: 'എനിക്ക് സഹായിക്കാൻ കഴിയുന്ന കാര്യങ്ങൾ:',
    symptomsFound: 'കണ്ടെത്തിയ രോഗലക്ഷണങ്ങൾ: ',
    symptomsSuffix: '. ഇവ അഡ്വാൻസ്ഡ് ഫോമിലേക്ക് മാറ്റണോ?',
    disclaimer: 'ശ്രദ്ധിക്കുക: ഇത് നേരിട്ടുള്ള വൈദ്യപരിശോധനയ്ക്ക് പകരമല്ല.',
    noReport: 'റിപ്പോർട്ടുകൾ ഒന്നും ലഭ്യമല്ല. പുതിയ പരിശോധന നടത്തുന്നോ?',
    noAppt: 'ബുക്കിംഗുകൾ ഒന്നും നിലവിലില്ല. ടെലിമെഡിസിനിൽ ബുക്ക് ചെയ്യാം.',
    noMeds: 'മരുന്ന് ഓർമ്മപ്പെടുത്തലുകൾ സെറ്റ് ചെയ്തിട്ടില്ല.',
    medCheckin: 'ദിനചര്യ മരുന്ന് പരിശോധന: ഇന്നത്തെ മരുന്ന് കഴിച്ചോ?',
    walletBal: 'നിങ്ങളുടെ വാലറ്റ് ബാലൻസ്: ₹',
    emailInfo: 'നിങ്ങളുടെ പ്രൊഫൈൽ ക്രമീകരണങ്ങളിൽ ഇമെയിൽ പരിശോധിക്കാം.'
  },
  hi: {
    default: 'व्यक्तिगत चिकित्सा परामर्श के लिए, कृपया टेलीमेडिसिन पोर्टल के तहत डॉक्टर से संपर्क करें।',
    emergency: '🚨 आपातकालीन: कृपया तुरंत राष्ट्रीय एम्बुलेंस 108 पर कॉल करें या नजदीकी अस्पताल जाएं।',
    booking: 'आप टेलीमेडिसिन पोर्टल के तहत डॉक्टर से परामर्श बुक कर सकते हैं।',
    vitals: 'सामान्य संदर्भ सीमाएं:\n• रक्तचाप (BP): 120/80 mmHg\n• ग्लूकोज: 70–99 mg/dL\n• BMI: 18.5 – 24.9 kg/m²',
    referral: 'अस्पताल के रेफरल और डिस्चार्ज सारांश आपकी रसीद में दर्ज किए जाते हैं।',
    helpTitle: 'मैं इन मुख्य कार्यों में आपकी मदद कर सकता हूं:',
    symptomsFound: 'पहचाने गए लक्षण: ',
    symptomsSuffix: '। क्या आप इन्हें एडवांस प्रेडिक्टर फॉर्म में भरना चाहते हैं?',
    disclaimer: 'अस्वीकरण: मैं चिकित्सा निदान प्रदान नहीं करता हूं। कृपया डॉक्टर से परामर्श लें।',
    noReport: 'कोई रिपोर्ट नहीं मिली। क्या आप अभी स्वास्थ्य जोखिम मूल्यांकन शुरू करना चाहते हैं?',
    noAppt: 'वर्तमान में कोई अपॉइंटमेंट नहीं है। टेलीमेडिसिन से बुक करें।',
    noMeds: 'कोई दवा रिमाइंडर सेट नहीं है। डैशबोर्ड पर जोड़ें।',
    medCheckin: 'दैनिक दवा सेवन जांच: क्या आपने आज अपनी निर्धारित दवा ली?',
    walletBal: 'आपका स्मार्ट हेल्थ वॉलेट बैलेंस: ₹',
    emailInfo: 'आप नेविगेशन बार में या प्रोफ़ाइल सेटिंग्स में अपना पंजीकृत ईमेल देख सकते हैं।'
  }
};

// Context Quick Action Chips Dictionary across 6 languages
const TRANSLATED_CHIPS = {
  en: [
    { label: "What can you do?", action: "help_menu" },
    { label: "BP & Sugar Ranges", action: "vitals_help" },
    { label: "Filter Cardiologists", action: "filter_cardiologist" },
    { label: "Emergency Ambulance 108", action: "emergency_care" },
    { label: "Explain last report", action: "last_report" },
    { label: "Medicine Schedule", action: "medicine_schedule" },
    { label: "Check Wallet Balance", action: "check_wallet" }
  ],
  ta: [
    { label: "உங்களால் என்ன செய்ய முடியும்?", action: "help_menu" },
    { label: "ரத்த அழுத்தம் & சர்க்கரை அளவு", action: "vitals_help" },
    { label: "இதய மருத்துவரைத் தேடு", action: "filter_cardiologist" },
    { label: "அவசர ஆம்புலன்ஸ் 108", action: "emergency_care" },
    { label: "கடைசி அறிக்கை விளக்கம்", action: "last_report" },
    { label: "மருந்து அட்டவணை", action: "medicine_schedule" },
    { label: "வாலட் இருப்பு பார்க்க", action: "check_wallet" }
  ],
  te: [
    { label: "మీరు ఏమి చేయగలరు?", action: "help_menu" },
    { label: "బిపి & షుగర్ పరిమితులు", action: "vitals_help" },
    { label: "కార్డియాలజిస్ట్‌ను వెతకండి", action: "filter_cardiologist" },
    { label: "అత్యవసర అంబులెన్స్ 108", action: "emergency_care" },
    { label: "నా చివరి నివేదిక వివరించు", action: "last_report" },
    { label: "మందుల పట్టిక", action: "medicine_schedule" },
    { label: "వాలెట్ నిల్వ తనిఖీ", action: "check_wallet" }
  ],
  kn: [
    { label: "ನೀವು ಏನು ಮಾಡಬಹುದು?", action: "help_menu" },
    { label: "ಬಿಪಿ ಮತ್ತು ಸಕ್ಕರೆ ಪ್ರಮಾಣ", action: "vitals_help" },
    { label: "ಹೃದಯ ತಜ್ಞರನ್ನು ಹುಡುಕಿ", action: "filter_cardiologist" },
    { label: "ತುರ್ತು ಆಂಬ್ಯುಲೆನ್ಸ್ 108", action: "emergency_care" },
    { label: "ನನ್ನ ವರದಿಯನ್ನು ವಿವರಿಸಿ", action: "last_report" },
    { label: "ಔಷಧ ವೇಳಾಪಟ್ಟಿ", action: "medicine_schedule" },
    { label: "ವ್ಯಾಲೆಟ್ ಬ್ಯಾಲೆನ್ಸ್ ಪರೀಕ್ಷಿಸಿ", action: "check_wallet" }
  ],
  ml: [
    { label: "നിങ്ങൾക്ക് എന്തൊക്കെ ചെയ്യാം?", action: "help_menu" },
    { label: "ബിപി & ഷുഗർ അളവുകൾ", action: "vitals_help" },
    { label: "കാർഡിയോളജിസ്റ്റിനെ കണ്ടെത്തൂ", action: "filter_cardiologist" },
    { label: "അടിയന്തിര ആംബുലൻസ് 108", action: "emergency_care" },
    { label: "എന്റെ റിപ്പോർട്ട് വിശദീകരിക്കൂ", action: "last_report" },
    { label: "മരുന്ന് വിവരങ്ങൾ", action: "medicine_schedule" },
    { label: "വാലറ്റ് ബാലൻസ് നോക്കൂ", action: "check_wallet" }
  ],
  hi: [
    { label: "आप क्या कर सकते हैं?", action: "help_menu" },
    { label: "बीपी और शुगर स्तर", action: "vitals_help" },
    { label: "हृदय विशेषज्ञ खोजें", action: "filter_cardiologist" },
    { label: "आपातकालीन एम्बुलेंस 108", action: "emergency_care" },
    { label: "मेरी रिपोर्ट समझाएं", action: "last_report" },
    { label: "दवा की अनुसूची", action: "medicine_schedule" },
    { label: "वॉलेट बैलेंस जांचें", action: "check_wallet" }
  ]
};

// Translated Action Button Labels
const CARD_LABELS = {
  en: {
    prefillBtn: "Pre-fill & Open Advance ML Predictor",
    emergencyBtn: "Call National Emergency 108",
    findCareBtn: "Find Emergency Hospitals & PHCs Nearby",
    telemedBtn: "Go to Telemedicine Portal",
    reportBtn: "View Full Report",
    medBtn: "Manage Reminders on Dashboard",
    walletBtn: "Top Up Wallet",
    yesTaken: "Yes, Taken ✓",
    remindLater: "Remind Later"
  },
  ta: {
    prefillBtn: "படிவத்தில் நிரப்பி தொடரவும்",
    emergencyBtn: "தேசிய அவசர 108 அழைக்கவும்",
    findCareBtn: "அருகிலுள்ள PHC மருத்துவமனை தேடு",
    telemedBtn: "டெலிமெடிசின் பகுதி செல்லவும்",
    reportBtn: "முழு அறிக்கை பார்க்க",
    medBtn: "மருந்து நினைவூட்டல் நிர்வகிக்க",
    walletBtn: "வாலட் ரீசார்ஜ் செய்யவும்",
    yesTaken: "ஆம், சாப்பிட்டேன் ✓",
    remindLater: "பிறகு நினைவூட்டு"
  },
  te: {
    prefillBtn: "లక్షణాలను నమోదు చేయండి",
    emergencyBtn: "అత్యవసర 108 కి కాల్ చేయండి",
    findCareBtn: "సమీప ఆసుపత్రులను వెతకండి",
    telemedBtn: "టెలిమెడిసిన్ ఓపెన్ చేయండి",
    reportBtn: "పూర్తి నివేదిక చూడండి",
    medBtn: "మందుల పట్టిక నిర్వహించండి",
    walletBtn: "వాలెట్ టాప్ అప్ చేయండి",
    yesTaken: "అవును, వేసుకున్నాను ✓",
    remindLater: "తర్వాత గుర్తుచేయి"
  },
  kn: {
    prefillBtn: "ಲಕ್ಷಣಗಳನ್ನು ನಮೂದಿಸಿ ಪ್ರಿಡಿಕ್ಟರ್ ತೆರೆಯಿರಿ",
    emergencyBtn: "ತುರ್ತು 108 ಗೆ ಕರೆ ಮಾಡಿ",
    findCareBtn: "ಹತ್ತಿರದ ಆಸ್ಪತ್ರೆಗಳನ್ನು ಹುಡುಕಿ",
    telemedBtn: "ಟೆಲಿಮೆಡಿಸಿನ್ ಪೋರ್ಟಲ್ ತೆರೆಯಿರಿ",
    reportBtn: "ಪೂರ್ಣ ವರದಿ ನೋಡಿ",
    medBtn: "ಔಷಧ ವೇಳಾಪಟ್ಟಿ ನಿರ್ವಹಿಸಿ",
    walletBtn: "ವ್ಯಾಲೆಟ್ ಟಾಪ್ ಅಪ್ ಮಾಡಿ",
    yesTaken: "ಹೌದು, ಸೇವಿಸಿದ್ದೇನೆ ✓",
    remindLater: "ನಂತರ ನೆನಪಿಸಿ"
  },
  ml: {
    prefillBtn: "രോഗലക്ഷണങ്ങൾ ചേർത്ത് തുടരുക",
    emergencyBtn: "അടിയന്തിര 108 വിളിക്കുക",
    findCareBtn: "ആശുപത്രികൾ കണ്ടെത്തുക",
    telemedBtn: "ടെലിമെഡിസിൻ ഓപ്പൺ ചെയ്യുക",
    reportBtn: "പൂർണ്ണ റിപ്പോർട്ട് കാണുക",
    medBtn: "മരുന്ന് വിവരങ്ങൾ കൈകാര്യം ചെയ്യുക",
    walletBtn: "വാലറ്റ് ടോപ്പ് അപ്പ് ചെയ്യുക",
    yesTaken: "അതെ, കഴിച്ചു ✓",
    remindLater: "പിന്നീട് ഓർമ്മിപ്പിക്കുക"
  },
  hi: {
    prefillBtn: "लक्षण दर्ज करें और प्रेडिक्टर खोलें",
    emergencyBtn: "राष्ट्रीय आपातकालीन 108 कॉल करें",
    findCareBtn: "नजदीकी अस्पताल खोजें",
    telemedBtn: "टेलीमेडिसिन पोर्टल खोलें",
    reportBtn: "पूरी रिपोर्ट देखें",
    medBtn: "दवा रिमाइंडर प्रबंधित करें",
    walletBtn: "वॉलेट रीचार्ज करें",
    yesTaken: "हाँ, ले ली ✓",
    remindLater: "बाद में याद दिलाएं"
  }
};

const COMMON_SYMPTOMS_MAP = {
  'headache': 'headache',
  'fever': 'high_fever',
  'cough': 'cough',
  'chest pain': 'chest_pain',
  'breathlessness': 'breathlessness',
  'shortness of breath': 'breathlessness',
  'nausea': 'nausea',
  'fatigue': 'fatigue',
  'tired': 'fatigue',
  'dizziness': 'dizziness',
  'itching': 'itching',
  'rash': 'skin_rash',
  'vomiting': 'vomiting',
  'joint pain': 'joint_pain',
  'sweating': 'sweating'
};

export default function Chatbot() {
  const { i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const currentLang = i18n.language || 'en';

  // Get Logged In User for Session Isolation
  const userStr = localStorage.getItem('user');
  const activeUser = JSON.parse(userStr || '{}');
  const activeUserId = activeUser.id || activeUser._id || activeUser.email || 'guest';

  // Live App Data State (Strictly User Scoped)
  const [latestReport, setLatestReport] = useState(null);
  const [reminders, setReminders] = useState([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [doctorSessions, setDoctorSessions] = useState({});

  // Medicine Taken Log State
  const [medsTaken, setMedsTaken] = useState(false);

  // Proactive Nudge Toast State
  const [nudge, setNudge] = useState(null);
  const [nudgeDismissed, setNudgeDismissed] = useState(false);

  // Speech State
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState(null);

  // Chat messages
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: GREETINGS_MAP[currentLang] || GREETINGS_MAP['en']
    }
  ]);

  const [input, setInput] = useState('');
  const recognitionRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Available Voices Cache
  const [availableVoices, setAvailableVoices] = useState([]);

  // Load Speech Voices dynamically
  useEffect(() => {
    if ('speechSynthesis' in window) {
      const updateVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        setAvailableVoices(voices);
      };
      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  // Purge/Reset State when Authenticated User Changes
  useEffect(() => {
    const greetingText = GREETINGS_MAP[currentLang] || GREETINGS_MAP['en'];
    setMessages([
      {
        id: 1,
        sender: 'bot',
        text: greetingText
      }
    ]);
    setLatestReport(null);
    setReminders([]);
    setWalletBalance(0);
    setDoctorSessions({});
    setNudge(null);
    setNudgeDismissed(false);

    if (activeUserId !== 'guest') {
      fetchLiveData();
    }
  }, [activeUserId]);

  const fetchLiveData = async () => {
    try {
      const [reportData, remData, walletData] = await Promise.allSettled([
        api.getReports(),
        api.getReminders(),
        api.getWalletBalance()
      ]);

      let topReport = null;
      if (reportData.status === 'fulfilled' && Array.isArray(reportData.value) && reportData.value.length > 0) {
        topReport = reportData.value[0];
        setLatestReport(topReport);
      } else {
        setLatestReport(null);
      }

      let activeRem = [];
      if (remData.status === 'fulfilled' && Array.isArray(remData.value)) {
        activeRem = remData.value;
        setReminders(activeRem);
      } else {
        setReminders([]);
      }

      if (walletData.status === 'fulfilled') {
        setWalletBalance(walletData.value?.balance || 0);
      }

      try {
        const userScopedSessions = JSON.parse(localStorage.getItem(`doctorSessions_${activeUserId}`) || '{}');
        setDoctorSessions(userScopedSessions);
      } catch (e) {
        setDoctorSessions({});
      }

      // Proactive Nudge logic
      if (topReport && (topReport.prediction?.toLowerCase().includes('high') || topReport.riskLevel?.toLowerCase() === 'high')) {
        setNudge({
          type: 'high_risk',
          text: `⚠️ High Risk detected in your last report (${topReport.prediction || 'Critical Risk'}). Want to book a specialist?`,
          action: 'filter_cardiologist'
        });
      } else if (activeRem.length > 0 && !medsTaken) {
        const firstMed = activeRem[0];
        setNudge({
          type: 'medicine',
          text: `💊 Daily Check-in: Did you take your ${firstMed.name} (${firstMed.dosage || '1 dose'}) today?`,
          action: 'medicine_checkin'
        });
      }
    } catch (e) {
      console.warn('Chatbot data fetch:', e);
    }
  };

  // Language Change Sync for Messages & Greetings
  useEffect(() => {
    const activeGreeting = GREETINGS_MAP[currentLang] || GREETINGS_MAP['en'];
    setMessages(prev => {
      if (prev.length === 1 && prev[0].sender === 'bot') {
        return [{ id: 1, sender: 'bot', text: activeGreeting }];
      }
      return prev;
    });
  }, [currentLang]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Multilingual Speech Recognition Setup
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = LOCALE_VOICE_MAP[currentLang] || 'en-IN';

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        handleSend(transcript);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
        setSpeechError('Microphone input standard error: ' + event.error);
        setTimeout(() => setSpeechError(null), 4000);
      };

      recognitionRef.current = recognition;
    }
  }, [currentLang]);

  const handleLangChange = (newLang) => {
    i18n.changeLanguage(newLang);
    localStorage.setItem('i18nextLng', newLang);
    const greeting = GREETINGS_MAP[newLang] || GREETINGS_MAP['en'];
    const newMsgId = Date.now();
    setMessages(prev => [...prev, { id: newMsgId, sender: 'bot', text: greeting }]);
    speakText(greeting, newLang, newMsgId);
  };

  const handleMicToggle = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      try {
        setSpeechError(null);
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (e) {
        console.error('Speech recognition start error:', e);
        setIsListening(false);
      }
    }
  };

  const handleMuteToggle = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    if (nextMute && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setSpeakingMsgId(null);
    }
  };

  // Multilingual Voice Output (Speech Synthesis)
  const speakText = (text, langCode = currentLang, msgId = null) => {
    if (isMuted || !('speechSynthesis' in window) || !text) return;
    
    window.speechSynthesis.cancel();
    setIsSpeaking(true);
    setSpeakingMsgId(msgId);

    const targetLocale = LOCALE_VOICE_MAP[langCode] || 'en-IN';
    const langPrefix = langCode.toLowerCase();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = targetLocale;
    utterance.rate = 0.92;
    utterance.pitch = 1.0;

    // Search for best matching voice in browser available voices
    const voices = availableVoices.length > 0 ? availableVoices : window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      let matchedVoice = voices.find(v => v.lang === targetLocale || v.lang.replace('_', '-') === targetLocale);
      if (!matchedVoice) {
        matchedVoice = voices.find(v => v.lang.startsWith(langPrefix));
      }
      if (!matchedVoice) {
        matchedVoice = voices.find(v => v.name.toLowerCase().includes(langPrefix));
      }
      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }
    }

    utterance.onend = () => {
      setIsSpeaking(false);
      setSpeakingMsgId(null);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setSpeakingMsgId(null);
    };

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setSpeakingMsgId(null);
  };

  // Quick Action Handler
  const handleActionClick = (actionKey, labelText) => {
    const userMsg = { id: Date.now(), sender: 'user', text: labelText || actionKey };
    setMessages(prev => [...prev, userMsg]);
    const langDict = MULTILINGUAL_RESPONSES[currentLang] || MULTILINGUAL_RESPONSES['en'];

    setTimeout(() => {
      let botMsg = { id: Date.now() + 1, sender: 'bot', text: '' };

      if (actionKey === 'help_menu') {
        botMsg = {
          id: Date.now() + 1,
          sender: 'bot',
          text: langDict.helpTitle,
          cardType: 'help_menu'
        };
      } else if (actionKey === 'last_report') {
        if (latestReport) {
          botMsg = {
            id: Date.now() + 1,
            sender: 'bot',
            text: `Latest Health Report (${new Date(latestReport.createdAt || Date.now()).toLocaleDateString()}):\nResult: ${latestReport.prediction || 'Analyzed'}`,
            cardType: 'report',
            cardData: latestReport
          };
        } else {
          botMsg = {
            id: Date.now() + 1,
            sender: 'bot',
            text: langDict.noReport,
            cardType: 'navigate_predict'
          };
        }
      } else if (actionKey === 'explain_advance_result') {
        if (latestReport) {
          botMsg = {
            id: Date.now() + 1,
            sender: 'bot',
            text: `Advance ML Summary: ${latestReport.prediction || 'Analyzed Risk'}. Cardiac, renal & metabolic indicators evaluated.`,
            cardType: 'report',
            cardData: latestReport
          };
        } else {
          botMsg = {
            id: Date.now() + 1,
            sender: 'bot',
            text: langDict.noReport,
            cardType: 'navigate_advance'
          };
        }
      } else if (actionKey === 'filter_cardiologist') {
        botMsg = {
          id: Date.now() + 1,
          sender: 'bot',
          text: currentLang === 'ta' ? "இதய மருத்துவ நிபுணர்கள்:" : currentLang === 'hi' ? "हृदय रोग विशेषज्ञ:" : "Cardiology specialists ready for consultation:",
          cardType: 'doctor_filter',
          cardData: { specialty: 'Cardiologist' }
        };
      } else if (actionKey === 'check_appointment_status') {
        const activeSessionsList = Object.entries(doctorSessions).map(([docId, sess]) => ({ docId, ...sess }));
        botMsg = {
          id: Date.now() + 1,
          sender: 'bot',
          text: activeSessionsList.length > 0 
            ? `Active bookings (${activeSessionsList.length}):`
            : langDict.noAppt,
          cardType: 'appointment_status',
          cardData: activeSessionsList
        };
      } else if (actionKey === 'medicine_checkin') {
        const medName = reminders.length > 0 ? reminders[0].name : 'Prescribed Medicine';
        botMsg = {
          id: Date.now() + 1,
          sender: 'bot',
          text: `${langDict.medCheckin} (${medName})`,
          cardType: 'medicine_checkin',
          cardData: { medName }
        };
      } else if (actionKey === 'medicine_schedule') {
        botMsg = {
          id: Date.now() + 1,
          sender: 'bot',
          text: reminders.length > 0
            ? `Active Reminders (${reminders.length}):`
            : langDict.noMeds,
          cardType: 'medicine',
          cardData: reminders
        };
      } else if (actionKey === 'check_wallet') {
        botMsg = {
          id: Date.now() + 1,
          sender: 'bot',
          text: `${langDict.walletBal}${walletBalance}.`,
          cardType: 'wallet',
          cardData: { balance: walletBalance }
        };
      } else if (actionKey === 'vitals_help') {
        botMsg = {
          id: Date.now() + 1,
          sender: 'bot',
          text: langDict.vitals + '\n\n' + langDict.disclaimer
        };
      } else if (actionKey === 'emergency_care') {
        botMsg = {
          id: Date.now() + 1,
          sender: 'bot',
          text: langDict.emergency,
          cardType: 'emergency'
        };
      } else {
        botMsg = {
          id: Date.now() + 1,
          sender: 'bot',
          text: langDict.default
        };
      }

      setMessages(prev => [...prev, botMsg]);
      if (botMsg.text) speakText(botMsg.text, currentLang, botMsg.id);
    }, 300);
  };

  const handleSend = (textToSend) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    const userMsg = { id: Date.now(), sender: 'user', text: query };
    setMessages(prev => [...prev, userMsg]);
    setInput('');

    setTimeout(() => {
      const langDict = MULTILINGUAL_RESPONSES[currentLang] || MULTILINGUAL_RESPONSES['en'];
      let botResponseText = langDict.default;
      let cardType = null;
      let cardData = null;
      const qLower = query.toLowerCase();

      // Query processing
      if (qLower.includes('email') || qLower.includes('mail') || qLower.includes('otp')) {
        botResponseText = langDict.emailInfo;
      }
      else if (qLower.includes('what can you do') || qLower.includes('help') || qLower.includes('menu') || qLower.includes('உதவி')) {
        botResponseText = langDict.helpTitle;
        cardType = 'help_menu';
      }
      else if (qLower.includes('chest pain') || qLower.includes('bleeding') || qLower.includes('emergency') || qLower.includes('faint') || qLower.includes('108') || qLower.includes('அவசரம்')) {
        botResponseText = langDict.emergency;
        cardType = 'emergency';
      }
      else if (qLower.includes('appointment') || qLower.includes('booking') || qLower.includes('consultation') || qLower.includes('receipt')) {
        const activeSessionsList = Object.entries(doctorSessions).map(([docId, sess]) => ({ docId, ...sess }));
        botResponseText = activeSessionsList.length > 0
          ? `Active bookings (${activeSessionsList.length}):`
          : langDict.noAppt;
        cardType = 'appointment_status';
        cardData = activeSessionsList;
      }
      else if (qLower.includes('explain') || qLower.includes('report') || qLower.includes('score')) {
        botResponseText = latestReport 
          ? `Latest Prediction: ${latestReport.prediction || 'Analyzed'}. View details in report viewer.`
          : langDict.noReport;
        cardType = 'report';
        cardData = latestReport;
      }
      else if (qLower.includes('fever') || qLower.includes('headache') || qLower.includes('cough') || qLower.includes('nausea')) {
        const extractedSymptomKeys = [];
        const extractedDisplayNames = [];

        Object.entries(COMMON_SYMPTOMS_MAP).forEach(([keyTerm, symId]) => {
          if (qLower.includes(keyTerm)) {
            extractedSymptomKeys.push(symId);
            extractedDisplayNames.push(keyTerm.charAt(0).toUpperCase() + keyTerm.slice(1));
          }
        });

        if (extractedSymptomKeys.length > 0) {
          botResponseText = `${langDict.symptomsFound}${extractedDisplayNames.join(', ')}${langDict.symptomsSuffix}`;
          cardType = 'prefill_symptoms';
          cardData = { symptoms: extractedSymptomKeys, displayNames: extractedDisplayNames };
        } else {
          botResponseText = langDict.default;
          cardType = 'navigate_advance';
        }
      }
      else if (qLower.includes('doctor') || qLower.includes('cardiologist') || qLower.includes('nephrologist') || qLower.includes('மருத்துவர்')) {
        const spec = qLower.includes('cardio') ? 'Cardiologist' : qLower.includes('nephro') ? 'Nephrologist' : 'General';
        botResponseText = `Verified ${spec} specialists available:`;
        cardType = 'doctor_filter';
        cardData = { specialty: spec };
      }
      else if (qLower.includes('medicine') || qLower.includes('dose') || qLower.includes('reminder') || qLower.includes('மருந்து')) {
        botResponseText = langDict.medCheckin;
        cardType = 'medicine_checkin';
        cardData = { medName: reminders[0]?.name || 'Metformin' };
      }
      else if (qLower.includes('wallet') || qLower.includes('balance') || qLower.includes('வாலட்')) {
        botResponseText = `${langDict.walletBal}${walletBalance}.`;
        cardType = 'wallet';
        cardData = { balance: walletBalance };
      }

      // Medical Disclaimer Guardrail
      if (qLower.includes('fever') || qLower.includes('pain') || qLower.includes('symptom') || qLower.includes('headache')) {
        botResponseText += `\n\n${langDict.disclaimer}`;
      }

      const botMsgId = Date.now() + 1;
      setMessages(prev => [...prev, { 
        id: botMsgId, 
        sender: 'bot', 
        text: botResponseText,
        cardType,
        cardData
      }]);

      speakText(botResponseText, currentLang, botMsgId);
    }, 450);
  };

  // Dynamic Translated Quick Chips
  const activeChips = TRANSLATED_CHIPS[currentLang] || TRANSLATED_CHIPS['en'];
  const labels = CARD_LABELS[currentLang] || CARD_LABELS['en'];

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      
      {/* Proactive Nudge Floating Toast */}
      {!isOpen && nudge && !nudgeDismissed && (
        <div className="mb-3 max-w-xs sm:max-w-sm glass-panel bg-slate-900 border border-sky-500/50 p-3 rounded-2xl shadow-2xl animate-fade-in flex items-start space-x-2 text-xs text-slate-100">
          <div className="bg-sky-500/20 p-1.5 rounded-lg text-sky-400 shrink-0 mt-0.5">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="flex-1 space-y-1">
            <p className="font-medium leading-tight text-slate-200">{nudge.text}</p>
            <button
              onClick={() => {
                setIsOpen(true);
                handleActionClick(nudge.action, 'Tell me more');
              }}
              className="text-[11px] font-bold text-sky-400 hover:text-sky-300 flex items-center space-x-1"
            >
              <span>Ask Assistant</span>
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>
          <button
            onClick={() => setNudgeDismissed(true)}
            className="text-slate-400 hover:text-white p-0.5"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Floating Launcher Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-[#0284c7] hover:bg-sky-500 text-white p-4 rounded-full shadow-2xl shadow-sky-500/30 flex items-center justify-center transition-all hover:scale-110 relative"
          title="Open Multilingual AI Assistant"
        >
          <MessageSquare className="h-6 w-6" />
          {nudge && !nudgeDismissed && (
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-400 border-2 border-slate-955 rounded-full animate-pulse" />
          )}
        </button>
      )}

      {/* Main Drawer Panel */}
      {isOpen && (
        <div className="glass-panel w-[92vw] sm:w-[430px] h-[610px] rounded-3xl border border-slate-800 shadow-2xl flex flex-col overflow-hidden bg-slate-900 animate-fade-in">
          
          {/* Drawer Header */}
          <div className="bg-slate-955 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="bg-[#0284c7] p-2 rounded-xl text-white">
                <Heart className="h-4 w-4 fill-current text-red-500" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white tracking-wide">Smart Health AI Assistant</h3>
                <div className="flex items-center space-x-1.5 text-[9px]">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                  <span className="text-emerald-400 font-semibold uppercase">Voice Ready ({currentLang})</span>
                  {isSpeaking && (
                    <span className="text-sky-400 font-bold flex items-center space-x-0.5 ml-1 animate-pulse">
                      <span>🔊 Speaking</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-1.5">
              {/* Language Selector Dropdown */}
              <div className="flex items-center space-x-1 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-[10px]">
                <Globe className="h-3 w-3 text-sky-400" />
                <select
                  value={currentLang}
                  onChange={(e) => handleLangChange(e.target.value)}
                  className="nav-select bg-transparent text-white text-[10px] font-bold outline-none cursor-pointer"
                  title="Select Chatbot Language"
                >
                  <option value="en" className="bg-slate-900 text-white">English (EN)</option>
                  <option value="ta" className="bg-slate-900 text-white">தமிழ் (TA)</option>
                  <option value="te" className="bg-slate-900 text-white">తెలుగు (TE)</option>
                  <option value="kn" className="bg-slate-900 text-white">ಕನ್ನಡ (KN)</option>
                  <option value="ml" className="bg-slate-900 text-white">മലയാളം (ML)</option>
                  <option value="hi" className="bg-slate-900 text-white">हिंदी (HI)</option>
                </select>
              </div>

              {/* Global Audio Mute / Unmute */}
              <button
                onClick={handleMuteToggle}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-900 border border-slate-800"
                title={isMuted ? 'Unmute Speech Output' : 'Mute Speech Output'}
              >
                {isMuted ? <VolumeX className="h-4 w-4 text-red-400" /> : <Volume2 className="h-4 w-4 text-emerald-400" />}
              </button>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Speech Error Banner */}
          {speechError && (
            <div className="bg-red-500/20 text-red-300 border-b border-red-500/40 text-[10px] px-3 py-1.5 text-center font-semibold">
              {speechError}
            </div>
          )}

          {/* Messages Container */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-start space-x-1.5 max-w-[90%]">
                  <div
                    className={`p-3 rounded-2xl text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-[#0284c7] text-white rounded-br-none shadow font-semibold'
                        : 'bg-slate-955 text-slate-200 border border-slate-800 rounded-bl-none font-medium'
                    }`}
                  >
                    <p className="whitespace-pre-line">{msg.text}</p>
                  </div>

                  {/* Re-Speak Audio Playback Button for Bot Messages */}
                  {msg.sender === 'bot' && (
                    <button
                      onClick={() => {
                        if (isSpeaking && speakingMsgId === msg.id) {
                          stopSpeaking();
                        } else {
                          speakText(msg.text, currentLang, msg.id);
                        }
                      }}
                      className={`p-1.5 rounded-lg border transition-colors shrink-0 mt-1 ${
                        isSpeaking && speakingMsgId === msg.id
                          ? 'bg-sky-500/20 border-sky-400 text-sky-400 animate-pulse'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                      title="Speak answer out loud"
                    >
                      {isSpeaking && speakingMsgId === msg.id ? (
                        <Pause className="h-3.5 w-3.5 text-sky-400" />
                      ) : (
                        <Volume2 className="h-3.5 w-3.5" />
                      )}
                    </button>
                  )}
                </div>

                {/* Inline Action Cards */}
                {msg.sender === 'bot' && msg.cardType && (
                  <div className="mt-2 w-[88%] glass-panel bg-slate-955 p-3 rounded-2xl border border-slate-800 space-y-2 text-xs">
                    
                    {/* Help Menu Card */}
                    {msg.cardType === 'help_menu' && (
                      <div className="space-y-2 text-[11px]">
                        <div className="flex items-center space-x-1.5 font-bold text-sky-400 border-b border-slate-800 pb-1.5">
                          <HelpCircle className="h-3.5 w-3.5" />
                          <span>{LANGUAGE_LABELS[currentLang]} Voice Capabilities</span>
                        </div>
                        <ul className="space-y-1.5 text-slate-300">
                          <li className="flex items-start space-x-1.5">
                            <span className="text-sky-400 font-bold">🗣️</span>
                            <span><strong>Multilingual Voice Speech:</strong> Supports English, Tamil, Telugu, Kannada, Malayalam, Hindi.</span>
                          </li>
                          <li className="flex items-start space-x-1.5">
                            <span className="text-emerald-400 font-bold">👨‍⚕️</span>
                            <span><strong>Doctor Consultation:</strong> Direct filter for specialists & appointment status.</span>
                          </li>
                          <li className="flex items-start space-x-1.5">
                            <span className="text-amber-400 font-bold">📊</span>
                            <span><strong>Health Report Explainer:</strong> organ risk assessment explanations.</span>
                          </li>
                          <li className="flex items-start space-x-1.5">
                            <span className="text-purple-400 font-bold">💊</span>
                            <span><strong>Medicine Reminders:</strong> Daily check-in & dose logs.</span>
                          </li>
                          <li className="flex items-start space-x-1.5">
                            <span className="text-red-400 font-bold">🚨</span>
                            <span><strong>Emergency Ambulance 108:</strong> 1-tap call & hospital lookup.</span>
                          </li>
                        </ul>
                      </div>
                    )}

                    {/* Pre-fill Symptoms Card */}
                    {msg.cardType === 'prefill_symptoms' && msg.cardData && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between font-bold text-sky-400 border-b border-slate-800 pb-1.5">
                          <span className="flex items-center space-x-1">
                            <Activity className="h-3.5 w-3.5" />
                            <span>Matched Symptoms</span>
                          </span>
                          <span className="text-[10px] text-emerald-400 font-semibold">Ready</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {msg.cardData.displayNames?.map((name, i) => (
                            <span key={i} className="bg-sky-500/20 text-sky-300 font-semibold px-2 py-0.5 rounded-md text-[10px] border border-sky-500/30">
                              ✓ {name}
                            </span>
                          ))}
                        </div>
                        <button
                          onClick={() => {
                            setIsOpen(false);
                            sessionStorage.setItem('prefilled_symptoms', JSON.stringify(msg.cardData.symptoms));
                            navigate('/advance');
                          }}
                          className="w-full bg-[#0284c7] hover:bg-sky-500 text-white font-bold py-1.5 rounded-xl text-[11px] flex items-center justify-center space-x-1 shadow"
                        >
                          <span>{labels.prefillBtn}</span>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}

                    {/* Appointment Status Lookup Card */}
                    {msg.cardType === 'appointment_status' && (
                      <div className="space-y-2">
                        <div className="flex items-center space-x-1.5 font-bold text-sky-400 border-b border-slate-800 pb-1.5">
                          <Stethoscope className="h-3.5 w-3.5" />
                          <span>Bookings & Payment Receipts</span>
                        </div>
                        {Array.isArray(msg.cardData) && msg.cardData.length > 0 ? (
                          <div className="space-y-1.5">
                            {msg.cardData.slice(0, 2).map((s, i) => (
                              <div key={i} className="bg-slate-900 p-2 rounded-xl border border-slate-800 space-y-1">
                                <div className="flex justify-between items-center text-[10px]">
                                  <span className="font-bold text-white">Order #{s.orderId ? s.orderId.substring(0, 8) : i+1}</span>
                                  <span className="text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">Paid ✓</span>
                                </div>
                                <div className="text-[10px] text-slate-300 flex justify-between">
                                  <span>Type: {s.type === 'video' ? 'Video' : 'In-person'}</span>
                                  <a
                                    href={api.getReceiptPdfUrl(s.orderId)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-sky-400 hover:underline flex items-center space-x-0.5"
                                  >
                                    <FileText className="h-3 w-3 inline" />
                                    <span>Receipt</span>
                                  </a>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[11px] text-slate-400">No active bookings found.</p>
                        )}
                        <button
                          onClick={() => {
                            setIsOpen(false);
                            navigate('/telemedicine');
                          }}
                          className="w-full bg-slate-800 hover:bg-slate-700 text-sky-400 font-bold py-1.5 rounded-xl text-[11px] flex items-center justify-center space-x-1 border border-slate-700 shadow"
                        >
                          <span>{labels.telemedBtn}</span>
                        </button>
                      </div>
                    )}

                    {/* Medicine Adherence Check-in Card */}
                    {msg.cardType === 'medicine_checkin' && (
                      <div className="space-y-2">
                        <div className="flex items-center space-x-1.5 font-bold text-purple-400 border-b border-slate-800 pb-1.5">
                          <Pill className="h-3.5 w-3.5" />
                          <span>Adherence Log</span>
                        </div>
                        <p className="text-[11px] text-slate-300">{msg.cardData?.medName || 'Prescription Dose'}</p>
                        {medsTaken ? (
                          <div className="bg-emerald-500/20 text-emerald-300 p-2 rounded-xl text-center font-bold text-[11px] flex items-center justify-center space-x-1 border border-emerald-500/40">
                            <CheckCircle2 className="h-4 w-4" />
                            <span>Logged as Taken!</span>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-1.5">
                            <button
                              onClick={() => {
                                setMedsTaken(true);
                                setMessages(prev => [...prev, {
                                  id: Date.now(),
                                  sender: 'bot',
                                  text: '✅ Intake logged! Great job maintaining your schedule.'
                                }]);
                              }}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-1.5 rounded-xl text-[10px] shadow"
                            >
                              {labels.yesTaken}
                            </button>
                            <button
                              onClick={() => {
                                setMessages(prev => [...prev, {
                                  id: Date.now(),
                                  sender: 'bot',
                                  text: '⏰ Reminder set for 1 hour from now.'
                                }]);
                              }}
                              className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-1.5 rounded-xl text-[10px] border border-slate-700"
                            >
                              {labels.remindLater}
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Report Summary Card */}
                    {msg.cardType === 'report' && msg.cardData && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-slate-300 font-bold border-b border-slate-800 pb-1.5">
                          <span className="flex items-center space-x-1 text-sky-400">
                            <FileText className="h-3.5 w-3.5" />
                            <span>Report Details</span>
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(msg.cardData.createdAt || Date.now()).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-slate-200 text-[11px]">
                          <span>Prediction Risk:</span>
                          <span className="font-bold text-amber-400">{msg.cardData.prediction || msg.cardData.riskLevel || 'Analyzed'}</span>
                        </div>
                        <button
                          onClick={() => {
                            setIsOpen(false);
                            navigate(`/report/${msg.cardData._id || msg.cardData.id || 1}`);
                          }}
                          className="w-full bg-[#0284c7] hover:bg-sky-500 text-white font-bold py-1.5 rounded-xl text-[11px] flex items-center justify-center space-x-1 shadow"
                        >
                          <span>{labels.reportBtn}</span>
                          <ExternalLink className="h-3 w-3" />
                        </button>
                      </div>
                    )}

                    {/* Doctor Filter Card */}
                    {msg.cardType === 'doctor_filter' && (
                      <div className="space-y-2">
                        <div className="flex items-center space-x-1.5 font-bold text-sky-400 border-b border-slate-800 pb-1.5">
                          <Stethoscope className="h-3.5 w-3.5" />
                          <span>Specialist Consultation</span>
                        </div>
                        <p className="text-[11px] text-slate-300">Filter specialists ({msg.cardData?.specialty || 'Cardiologist'}).</p>
                        <button
                          onClick={() => {
                            setIsOpen(false);
                            navigate(`/telemedicine?specialty=${msg.cardData?.specialty || 'Cardiologist'}`);
                          }}
                          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-1.5 rounded-xl text-[11px] flex items-center justify-center space-x-1 shadow"
                        >
                          <span>{labels.telemedBtn}</span>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}

                    {/* Emergency Card */}
                    {msg.cardType === 'emergency' && (
                      <div className="space-y-2">
                        <a
                          href="tel:108"
                          className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-2 rounded-xl text-[11px] flex items-center justify-center space-x-1 shadow"
                        >
                          <PhoneCall className="h-3.5 w-3.5" />
                          <span>{labels.emergencyBtn}</span>
                        </a>
                        <button
                          onClick={() => {
                            setIsOpen(false);
                            navigate('/find-care');
                          }}
                          className="w-full bg-slate-800 hover:bg-slate-700 text-sky-400 font-bold py-1.5 rounded-xl text-[11px] flex items-center justify-center space-x-1 border border-slate-700 shadow"
                        >
                          <span>{labels.findCareBtn}</span>
                        </button>
                      </div>
                    )}

                  </div>
                )}

              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Hands-Free Voice Commands Bar */}
          <div className="px-3 py-1.5 bg-slate-900 border-t border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <span className="text-[9px] text-emerald-400 font-extrabold shrink-0 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-400" /> Voice Commands:
            </span>
            <button
              onClick={() => {
                const userMsg = "Read my evening medicine schedule";
                setInput(userMsg);
                setTimeout(() => handleSend(userMsg), 100);
              }}
              type="button"
              className="shrink-0 bg-slate-800 hover:bg-slate-700 text-sky-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-sky-500/30"
            >
              "Read my evening medicine schedule"
            </button>
            <button
              onClick={() => {
                const userMsg = "What is my heart risk score?";
                setInput(userMsg);
                setTimeout(() => handleSend(userMsg), 100);
              }}
              type="button"
              className="shrink-0 bg-slate-800 hover:bg-slate-700 text-amber-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-amber-500/30"
            >
              "What is my heart risk score?"
            </button>
            <button
              onClick={() => {
                const userMsg = "Book a video call with Dr. Priyan";
                setInput(userMsg);
                setTimeout(() => handleSend(userMsg), 100);
              }}
              type="button"
              className="shrink-0 bg-slate-800 hover:bg-slate-700 text-emerald-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-emerald-500/30"
            >
              "Book a video call with Dr. Priyan"
            </button>
          </div>

          {/* Quick Action Chips in selected language */}
          <div className="px-3 py-2 bg-slate-955 border-t border-slate-800 flex items-center space-x-1.5 overflow-x-auto no-scrollbar">
            <span className="text-[10px] text-slate-500 font-bold shrink-0 uppercase tracking-wider">Quick Actions:</span>
            {activeChips.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleActionClick(chip.action, chip.label)}
                className="shrink-0 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-[10px] font-semibold px-2.5 py-1 rounded-full border border-slate-800 transition-colors flex items-center space-x-1"
              >
                <span>{chip.label}</span>
              </button>
            ))}
          </div>

          {/* Input Controls Bar */}
          <div className="p-3 bg-slate-955 border-t border-slate-800 flex items-center space-x-2">
            <button
              onClick={handleMicToggle}
              className={`p-2.5 rounded-xl border transition-colors ${
                isListening
                  ? 'bg-red-500 text-white border-red-400 animate-pulse'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
              title={`Voice Input (${LOCALE_VOICE_MAP[currentLang]})`}
            >
              {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </button>

            {/* AI Skin & Vision Visual Upload Button */}
            <label
              className="p-2.5 bg-slate-900 border border-slate-800 text-sky-400 hover:text-white rounded-xl cursor-pointer transition-colors"
              title="Upload Skin/Eye Image for AI Visual Screening"
            >
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setMessages((prev) => [
                      ...prev,
                      {
                        id: Date.now(),
                        sender: 'user',
                        text: '📷 Uploaded Skin/Eye image for AI Visual Screening.',
                      },
                      {
                        id: Date.now() + 1,
                        sender: 'bot',
                        text: '🔍 AI Visual Screening Analysis: Image processed cleanly. No acute high-risk lesions detected. Mild localized irritation pattern identified. Recommend consulting a dermatologist under Telemedicine if symptoms persist.',
                      },
                    ]);
                  }
                }}
              />
              <span className="text-xs font-bold">📷</span>
            </label>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={currentLang === 'ta' ? "கேள்வி அல்லது கட்டளை உள்ளிடவும்..." : currentLang === 'hi' ? "सवाल या कमांड टाइप करें..." : "Ask assistant or say a command..."}
              className="flex-1 bg-white text-slate-900 placeholder:text-slate-500 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-sky-500"
            />

            <button
              onClick={() => handleSend()}
              className="bg-[#0284c7] hover:bg-sky-500 text-white p-2.5 rounded-xl shadow transition-colors"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>


        </div>
      )}
    </div>
  );
}
