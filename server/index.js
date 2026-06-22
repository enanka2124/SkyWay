require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const connectDB = require('./db');
const flightsRouter = require('./routes/flights');
const bookingsRouter = require('./routes/bookings');
const hotelsRouter = require('./routes/hotels');
const dealsRouter = require('./routes/deals');
const paymentsRouter = require('./routes/payments');
const authRouter = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 5000;

connectDB();

// ── CORS ──────────────────────────────────────────────────────────────────────
// In production (single Render service) the React build is served by Express
// itself, so browser requests have NO cross-origin and CORS is never triggered.
// CLIENT_URL is still listed so Razorpay redirect / webhook callbacks work.
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.CLIENT_URL,           // e.g. https://skyway.onrender.com
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // allow server-to-server / curl (no origin header) and whitelisted origins
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked: ${origin}`));
    }
  },
  credentials: true,
}));

app.use(express.json());

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/flights',  flightsRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/hotels',   hotelsRouter);
app.use('/api/deals',    dealsRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/auth',     authRouter);

// serve uploaded files (Aadhaar PDFs, etc.)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// health-check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'Operational',
    service: 'SkyWay API',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// ── Serve React frontend in production ───────────────────────────────────────
// The React dist is built into client/dist by the Render build command.
// __dirname here is /opt/render/project/src/server, so go one level up.
if (process.env.NODE_ENV === 'production') {
  const clientBuild = path.join(__dirname, '..', 'client', 'dist');
  app.use(express.static(clientBuild));

  // Catch-all: any non-API route → React's index.html (client-side routing)
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuild, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`✈  SkyWay server running on port ${PORT}`);
  console.log(`   NODE_ENV : ${process.env.NODE_ENV}`);
  console.log(`   CLIENT_URL: ${process.env.CLIENT_URL || '(not set)'}`);
});
