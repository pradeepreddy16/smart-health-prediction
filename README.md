# Smart Health Predictor

An AI-powered health risk prediction and assessment application featuring multilingual support, dynamic organ health score visualizers, custom lifestyle/supplement recommendations with South Indian local food adaptations, GPS-based hospital and specialist recommendations with a 20 km search-radius fallback system, and a conversational symptom-intake chatbot.

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- npm (installed automatically with Node.js)

### Installation & Setup

1. Open a terminal in the project directory:
   ```bash
   cd shp
   ```

2. Install all dependencies across the root, frontend, and backend packages:
   ```bash
   npm run install-all
   ```

3. (Optional) Configure Environment Variables:
   Create a `.env` file in the `backend/` folder to add environment keys:
   ```env
   PORT=5000
   JWT_SECRET=your-custom-secret-key
   GEMINI_API_KEY=your-google-gemini-api-key
   ```
   *Note: If no Gemini API Key is provided, the application runs on a robust, deterministic local rules engine, guaranteeing offline reliability and out-of-the-box functionality.*

### Running the Application

To run both the Express backend API server and the React frontend Vite server concurrently in development mode:
```bash
npm run dev
```

- **Frontend client**: `http://localhost:5173`
- **Backend API server**: `http://localhost:5000`

---

## 🔑 Default Credentials

- **Admin Account**: `admin@health.com` / `admin123`
- **User Account**: Create a new account using the **Sign Up** toggle on the login page.

---

## 🌟 Key Features

1. **Multilingual Interface (i18n)**
   - Fully switchable between English, Tamil (தமிழ்), Telugu (తెలుగు), Kannada (ಕನ್ನಡ), and Malayalam (മലയാളം).
   - Food recommendations display regional equivalents (e.g. *ragi*, *moringa*, *curry leaves* for South Indian locales).

2. **Organ Health Scores Visualizer**
   - Displays animated progress bars upon report loading.
   - Dynamic ratings (Optimal, Good, Caution, At Risk) for Heart, Liver, Kidney, Thyroid, Metabolic, and Blood systems.
   - Interactive rows expand to show detailed explanations.

3. **GPS Radius Fallback Protocol**
   - Consents GPS input and checks for specialist clinics within a 20 km radius.
   - If no clinics are close, automatically expands search to 50 km → 100 km, displaying closest matches with actual distances labeled.
   - Surfaces a **Travel Advisory** panel showing emergency 108 calls, nearest Primary Health Center (PHC) options, warnings against driving, and telemedicine consultation quick-links.

4. **Conversational Symptom Chatbot**
   - Floating chat widget that enables users to list symptoms conversationally, check options, and prefill the Intake Form.

5. **Compliance Audit Logging**
   - Saves a record of administrator actions (changing user statuses, deactivating accounts, updating clinics database) to comply with health data privacy norms.

6. **Dynamic PDF Generation**
   - Streams printable health assessment reports (complete with patient details, vital metrics, system scores, and disclaimers) on-the-fly.

---

## 📁 Project Structure

```
shp/
├── package.json               # Root scripts (install-all, dev)
├── backend/                   # Express API
│   ├── db.js                  # Lightweight JSON database manager
│   ├── server.js              # Server entry point
│   ├── routes/                # API controllers
│   │   ├── auth.js            # JWT login/signup & auth middleware
│   │   ├── predict.js         # Report history & PDF triggers
│   │   ├── doctors.js         # Haversine geolocation & fallback advisories
│   │   └── admin.js           # Admin stats, account toggles & audit registries
│   └── services/              # Logic engines
│       ├── aiService.js       # Organ score math & food suggestions
│       └── pdfService.js      # PDFKit report designer
└── frontend/                  # React Vite Client
    ├── tailwind.config.js     # Tailwind CSS settings
    ├── src/
    │   ├── App.jsx            # Routing & guards
    │   ├── main.jsx           # App mount + translation loading
    │   ├── index.css          # Styling layers & keyframes
    │   ├── components/        # Shared elements (Chatbot, MapViewer, Navbar)
    │   └── pages/             # Portal panels (Dashboard, PredictForm, Report, Admin)
```
