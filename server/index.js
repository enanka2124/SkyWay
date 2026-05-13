// --- Dependencies ---
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// --- Modules ---
const connectDB = require('./db');
const flightsRouter = require('./routes/flights');
const bookingsRouter = require('./routes/bookings');
const hotelsRouter = require('./routes/hotels');
const dealsRouter = require('./routes/deals');
const paymentsRouter = require('./routes/payments');
const authRouter = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Database Connection
connectDB();

// --- Global Middleware ---
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

// --- API Routes ---
app.use('/api/flights', flightsRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/hotels', hotelsRouter);
app.use('/api/deals', dealsRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/auth', authRouter);

// Static assets (Aadhaar uploads, etc.)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'Operational', 
    service: 'SkyWay API',
    uptime: process.uptime(),
    timestamp: new Date().toISOString() 
  });
});

// Start Server
app.listen(PORT, () => {
  console.log('\n----------------------------------------');
  console.log(`✈  SkyWay API is now LIVE on port ${PORT}`);
  console.log(`📡 Local Access: http://localhost:${PORT}`);
  console.log('----------------------------------------\n');
});
