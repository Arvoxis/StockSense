const router = require('express').Router();
const asyncHandler = require('../utils/asyncHandler');
const finnhub = require('../services/finnhubService');
const { buildIndicators } = require('../services/indicatorService');
const yahooFinance = require('../services/yahooFinanceService');
const { cacheGet, cacheSet, QUOTE_TTL, CHART_TTL } = require('../services/cacheService');
const TICKER_UNIVERSE = require('../utils/tickerUniverse');

const SCREENER_CACHE_KEY = 'screener:universe';

/**
 * Fetch data for a single ticker with caching.
 */
async function fetchTickerData(ticker) {
  // Try quote from cache first
  let quote = cacheGet(`quote:${ticker}`);
  if (!quote) {
    quote = await finnhub.getQuote(ticker);
    cacheSet(`quote:${ticker}`, quote, QUOTE_TTL);
  }

  // Try candles from cache first
  let candles = cacheGet(`chart:${ticker}:1Y`);
  if (!candles) {
    candles = await yahooFinance.getDailyCandles(ticker);
    if (candles && candles.length > 0) {
      cacheSet(`chart:${ticker}:1M`, candles, CHART_TTL);
    }
  }

  let rsi = null, ema20 = null;
  if (candles && candles.length >= 20) {
    const indicators = buildIndicators(candles);
    const rsiArr = indicators.rsi.filter((v) => v !== null);
    const ema20Arr = indicators.ema20.filter((v) => v !== null);
    rsi = rsiArr[rsiArr.length - 1] ?? null;
    ema20 = ema20Arr[ema20Arr.length - 1] ?? null;
  }

  return {
    ticker,
    price: quote.price,
    change: quote.change,
    changePercent: quote.changePercent,
    high: quote.high,
    low: quote.low,
    rsi,
    ema20,
  };
}

/**
 * Run fetchTickerData on a batch of tickers with max concurrency.
 */
async function fetchBatch(tickers, concurrency = 10) {
  const results = [];
  for (let i = 0; i < tickers.length; i += concurrency) {
    const batch = tickers.slice(i, i + concurrency);
    const settled = await Promise.allSettled(batch.map((t) => fetchTickerData(t)));
    settled.forEach((r) => {
      if (r.status === 'fulfilled') results.push(r.value);
    });
  }
  return results;
}

// GET /api/screener?rsi_min=&rsi_max=&change_min=&change_max=&volume_spike=&cap=&sector=
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const {
      rsi_min,
      rsi_max,
      change_min,
      change_max,
    } = req.query;

    // Use pre-cached universe if available
    let universe = cacheGet(SCREENER_CACHE_KEY);
    if (!universe) {
      universe = await fetchBatch(TICKER_UNIVERSE, 10);
      cacheSet(SCREENER_CACHE_KEY, universe, 300);
    }

    // Apply filters
    let filtered = universe;

    if (rsi_min !== undefined) {
      filtered = filtered.filter((s) => s.rsi !== null && s.rsi >= parseFloat(rsi_min));
    }
    if (rsi_max !== undefined) {
      filtered = filtered.filter((s) => s.rsi !== null && s.rsi <= parseFloat(rsi_max));
    }
    if (change_min !== undefined) {
      filtered = filtered.filter((s) => s.changePercent !== null && s.changePercent >= parseFloat(change_min));
    }
    if (change_max !== undefined) {
      filtered = filtered.filter((s) => s.changePercent !== null && s.changePercent <= parseFloat(change_max));
    }

    res.json(filtered);
  })
);

module.exports = router;
module.exports.fetchBatch = fetchBatch;
module.exports.SCREENER_CACHE_KEY = SCREENER_CACHE_KEY;
