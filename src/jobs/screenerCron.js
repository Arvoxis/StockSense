const cron = require('node-cron');
const { fetchBatch, SCREENER_CACHE_KEY } = require('../routes/screener');
const { cacheSet } = require('../services/cacheService');
const TICKER_UNIVERSE = require('../utils/tickerUniverse');

// Pre-cache screener universe every 5 minutes
cron.schedule('*/5 * * * *', async () => {
  console.log('[cron] Pre-caching screener universe...');
  try {
    const universe = await fetchBatch(TICKER_UNIVERSE, 10);
    cacheSet(SCREENER_CACHE_KEY, universe, 300);
    console.log(`[cron] Cached ${universe.length} tickers`);
  } catch (err) {
    console.error('[cron] Screener pre-cache failed:', err.message);
  }
});

console.log('⏰ Screener cron job scheduled (every 5 minutes)');
