const express = require('express');
const cors = require('cors');
const flightsRouter = require('./routes/flights');
const bookingsRouter = require('./routes/bookings');
const hotelsRouter = require('./routes/hotels');
const dealsRouter = require('./routes/deals');
const paymentsRouter = require('./routes/payments');
const authRouter = require('./routes/auth');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/flights', flightsRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/hotels', hotelsRouter);
app.use('/api/deals', dealsRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/auth', authRouter);
app.use('/uploads', require('express').static(path.join(__dirname, 'uploads')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`✈  SkyWay API running on http://localhost:${PORT}`);
});
