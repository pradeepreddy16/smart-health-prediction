const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { router: authRouter } = require('./routes/auth');
const predictRouter = require('./routes/predict');
const doctorsRouter = require('./routes/doctors');
const adminRouter = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors({
  origin: '*', // For local development simplicity; can restrict to frontend dev URL in prod
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser
app.use(express.json());

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/predict', predictRouter);
app.use('/api/doctors', doctorsRouter);
app.use('/api/admin', adminRouter);

// Basic Health Check Route
app.get('/api/health', (req, res) => {
  res.json({ status: "OK", service: "Smart Health Predictor API", time: new Date() });
});

// Serve frontend in production (optional helper)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  });
}

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong inside the server!' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Smart Health Predictor API server running on port ${PORT}`);
});
