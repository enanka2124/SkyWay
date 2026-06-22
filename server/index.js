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

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.CLIENT_URL,           // live frontend URL from .env
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // allow server-to-server / curl (no origin) and listed origins
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked: ${origin}`));
    }
  },
  credentials: true
}));
app.use(express.json());

app.use('/api/flights', flightsRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/hotels', hotelsRouter);
app.use('/api/deals', dealsRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/auth', authRouter);

// serve uploaded files (Aadhaar PDFs, etc.)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/health', (req, res) => {
  res.json({
    status: 'Operational',
    service: 'SkyWay API',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// ── Serve React frontend in production ───────────────────────────────────────
if (process.env.NODE_ENV === 'production') {
  const clientBuild = path.join(__dirname, '..', 'client', 'dist');
  app.use(express.static(clientBuild));

  // Catch-all: send any non-API request to React's index.html
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuild, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`SkyWay server running on port ${PORT}`);
});
