const express = require('express');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
const mongoose = require('mongoose');
const requestLogger = require('./middleware/requestLogger');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth');
const stockRoutes = require('./routes/stocks');
const marketRoutes = require('./routes/market');
const newsRoutes = require('./routes/news');
const aiRoutes = require('./routes/ai');
const watchlistRoutes = require('./routes/watchlist');
const screenerRoutes = require('./routes/screener');
const userRoutes = require('./routes/user');

const app = express();

// CORS — must be before all routes
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
  : ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:3001'];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(requestLogger);

// Static uploads
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/stocks', stockRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/watchlist', watchlistRoutes);
app.use('/api/screener', screenerRoutes);
app.use('/api/user', userRoutes);

// Health check — live service status
app.get('/api/health', async (_req, res) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

  let finnhubStatus = 'error';
  try {
    await axios.get('https://finnhub.io/api/v1/quote', {
      params: { symbol: 'AAPL', token: process.env.FINNHUB_API_KEY },
      timeout: 5000,
    });
    finnhubStatus = 'ok';
  } catch { /* stay error */ }

  let llmStatus = 'error';
  try {
    const Groq = require('groq-sdk');
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 10,
      messages: [{ role: 'user', content: 'ping' }],
    });
    llmStatus = 'ok';
  } catch { /* stay error */ }

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      mongodb: mongoStatus,
      finnhub: finnhubStatus,
      llm: llmStatus,   // Groq - see services/anthropicService.js (misnamed)
    },
    env: {
      FINNHUB_API_KEY: process.env.FINNHUB_API_KEY ? '✅ loaded' : '❌ missing',
      GROQ_API_KEY: process.env.GROQ_API_KEY ? '✅ loaded' : '❌ missing',
      ALPHA_VANTAGE_API_KEY: process.env.ALPHA_VANTAGE_API_KEY ? '✅ loaded' : '❌ missing',
      MONGO_URI: process.env.MONGO_URI ? '✅ loaded' : '❌ missing',
      JWT_SECRET: process.env.JWT_SECRET ? '✅ loaded' : '❌ missing',
      JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET ? '✅ loaded' : '❌ missing',
    },
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.url} not found` });
});

// Global error handler (must be last)
app.use(errorHandler);

module.exports = app;
