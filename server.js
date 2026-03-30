require('dotenv').config();
const axios = require('axios');
const app = require('./src/app');
const connectDB = require('./src/config/db');
require('./src/jobs/screenerCron');

const PORT = process.env.PORT || 5000;

// ─── Startup Checklist ──────────────────────────────────────────────────────
function checkEnv() {
  const required = [
    'FINNHUB_API_KEY',
    'GROQ_API_KEY',
    'ALPHA_VANTAGE_API_KEY',
    'MONGO_URI',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
  ];
  console.log('\n📋 ENV CHECKLIST:');
  required.forEach((key) => {
    const val = process.env[key];
    console.log(`  ${val ? '✅' : '❌'} ${key}${val ? ' loaded' : ' — MISSING'}`);
  });
}

async function testAPIs() {
  console.log('\n🔌 API CONNECTIVITY:');

  // Finnhub
  try {
    const { data } = await axios.get('https://finnhub.io/api/v1/quote', {
      params: { symbol: 'AAPL', token: process.env.FINNHUB_API_KEY },
      timeout: 8000,
    });
    console.log(`  ✅ Finnhub — AAPL price: $${data.c}`);
  } catch (err) {
    console.log(`  ❌ Finnhub — ${err.response?.status || err.message}`);
  }

  // Alpha Vantage
  try {
    const { data } = await axios.get('https://www.alphavantage.co/query', {
      params: {
        function: 'GLOBAL_QUOTE',
        symbol: 'AAPL',
        apikey: process.env.ALPHA_VANTAGE_API_KEY,
      },
      timeout: 8000,
    });
    const price = data['Global Quote']?.['05. price'];
    console.log(`  ✅ Alpha Vantage — AAPL price: $${price || 'N/A'}`);
  } catch (err) {
    console.log(`  ❌ Alpha Vantage — ${err.response?.status || err.message}`);
  }

  // Groq
  try {
    const Groq = require('groq-sdk');
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 10,
      messages: [{ role: 'user', content: 'ping' }],
    });
    console.log('  ✅ Groq — connected');
  } catch (err) {
    console.log(`  ❌ Groq — ${err.message}`);
  }
}

function printRouteMap() {
  console.log('\n🗺️  ROUTE MAP:');
  const routes = [
    'GET  /api/health',
    'POST /api/auth/signup',
    'POST /api/auth/login',
    'POST /api/auth/refresh',
    'POST /api/auth/logout',
    'GET  /api/auth/me',
    'GET  /api/stocks/search?q=',
    'GET  /api/stocks/:ticker/quote',
    'GET  /api/stocks/:ticker/chart?range=',
    'GET  /api/stocks/:ticker/stats',
    'GET  /api/stocks/:ticker/indicators',
    'GET  /api/market/indices',
    'GET  /api/market/topmovers',
    'GET  /api/news?ticker=&sentiment=',
    'POST /api/ai/analyze',
    'GET  /api/ai/whymoving/:ticker',
    'POST /api/ai/sentiment',
    'GET  /api/ai/watchlist-scores',
    'GET  /api/ai/screener-picks',
    'GET  /api/watchlist',
    'POST /api/watchlist/:ticker',
    'DELETE /api/watchlist/:ticker',
    'GET  /api/screener',
    'PUT  /api/user/profile',
    'POST /api/user/avatar',
    'DELETE /api/user/account',
  ];
  routes.forEach((r) => console.log(`  ✅ ${r}`));
}

// ─── Unhandled Rejections ───────────────────────────────────────────────────
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err.message);
  console.error(err.stack);
});

// ─── Boot ────────────────────────────────────────────────────────────────────
checkEnv();

connectDB()
  .then(async () => {
    console.log('\n✅ MongoDB connected');
    await testAPIs();
    printRouteMap();

    app.listen(PORT, () => {
      console.log(`\n🚀 StockSense server running on http://localhost:${PORT}\n`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB error:', err.message);
    process.exit(1);
  });
