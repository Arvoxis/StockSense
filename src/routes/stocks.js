const router = require('express').Router();
const asyncHandler = require('../utils/asyncHandler');
const finnhub = require('../services/finnhubService');
const yahooFinance = require('../services/yahooFinanceService');
const { cacheGet, cacheSet, QUOTE_TTL, CHART_TTL, STATS_TTL, SEARCH_TTL } = require('../services/cacheService');
const { buildIndicators } = require('../services/indicatorService');

// GET /api/stocks/search?q=:query
router.get(
  '/search',
  asyncHandler(async (req, res) => {
    const q = req.query.q || '';
    if (!q) return res.json([]);

    const key = `search:${q.toLowerCase()}`;
    const cached = cacheGet(key);
    if (cached) return res.json(cached);

    const results = await finnhub.searchSymbols(q);
    cacheSet(key, results, SEARCH_TTL);
    res.json(results);
  })
);

// GET /api/stocks/:ticker/quote
router.get(
  '/:ticker/quote',
  asyncHandler(async (req, res) => {
    const ticker = req.params.ticker.toUpperCase();
    const key = `quote:${ticker}`;
    const cached = cacheGet(key);
    if (cached) return res.json(cached);

    let quote;
    try {
      quote = await finnhub.getQuote(ticker);
    } catch (err) {
      return res.status(404).json({ error: `Ticker ${ticker} not found or not supported` });
    }
    if (!quote.price || quote.price === 0) {
      return res.status(404).json({ error: `No data found for ticker ${ticker} — may be invalid or delisted` });
    }
    cacheSet(key, quote, QUOTE_TTL);
    res.json(quote);
  })
);

// GET /api/stocks/:ticker/chart?range=1M
router.get(
  '/:ticker/chart',
  asyncHandler(async (req, res) => {
    const ticker = req.params.ticker.toUpperCase();
    const range = req.query.range || '1M';
    const key = `chart:${ticker}:${range}`;
    const cached = cacheGet(key);
    if (cached) return res.json(cached);

    const candles = await yahooFinance.getCandles(ticker, range);

    if (!candles || candles.length === 0) {
      return res.status(404).json({ error: `No chart data found for ${ticker}` });
    }

    cacheSet(key, candles, CHART_TTL);
    res.json(candles);
  })
);

// GET /api/stocks/:ticker/stats
router.get(
  '/:ticker/stats',
  asyncHandler(async (req, res) => {
    const ticker = req.params.ticker.toUpperCase();
    const key = `stats:${ticker}`;
    const cached = cacheGet(key);
    if (cached) return res.json(cached);

    let stats;
    try {
      stats = await finnhub.getBasicFinancials(ticker);
    } catch (err) {
      return res.status(404).json({ error: `No stats available for ${ticker}` });
    }
    cacheSet(key, stats, STATS_TTL);
    res.json(stats);
  })
);

// GET /api/stocks/:ticker/indicators
router.get(
  '/:ticker/indicators',
  asyncHandler(async (req, res) => {
    const ticker = req.params.ticker.toUpperCase();
    const key = `indicators:${ticker}`;
    const cached = cacheGet(key);
    if (cached) return res.json(cached);

    // Use cached 1Y chart data if available, otherwise fetch fresh
    let candles = cacheGet(`chart:${ticker}:1Y`);
    if (!candles || candles.length < 20) {
      candles = await yahooFinance.getDailyCandles(ticker);
    }

    if (!candles || candles.length < 20) {
      return res.status(422).json({ error: 'Not enough historical data to compute indicators' });
    }

    const raw = buildIndicators(candles);

    const merged = candles.map((c, i) => ({
      time: c.time,
      ema20: raw.ema20[i],
      ema50: raw.ema50[i],
      ema200: raw.ema200[i],
      bbUpper: raw.bollingerBands[i]?.upper ?? null,
      bbMiddle: raw.bollingerBands[i]?.middle ?? null,
      bbLower: raw.bollingerBands[i]?.lower ?? null,
      rsi: raw.rsi[i],
      macd: raw.macd[i]?.MACD ?? null,
      macdSignal: raw.macd[i]?.signal ?? null,
      macdHistogram: raw.macd[i]?.histogram ?? null,
    }));

    cacheSet(key, merged, CHART_TTL);
    res.json(merged);
  })
);

module.exports = router;
