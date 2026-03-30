const router = require('express').Router();
const asyncHandler = require('../utils/asyncHandler');
const finnhub = require('../services/finnhubService');
const { cacheGet, cacheSet, QUOTE_TTL } = require('../services/cacheService');
const TICKER_UNIVERSE = require('../utils/tickerUniverse');

// ETF proxies for indices (Finnhub free tier doesn't support ^GSPC etc.)
const INDICES = [
  { ticker: 'SPY', name: 'S&P 500' },
  { ticker: 'QQQ', name: 'NASDAQ' },
  { ticker: 'DIA', name: 'DOW JONES' },
  { ticker: 'VIXY', name: 'VIX' },
];

// GET /api/market/indices
router.get(
  '/indices',
  asyncHandler(async (_req, res) => {
    const key = 'market:indices';
    const cached = cacheGet(key);
    if (cached) return res.json(cached);

    const results = await Promise.allSettled(
      INDICES.map(async (idx) => {
        const q = await finnhub.getQuote(idx.ticker);
        return { name: idx.name, ticker: idx.ticker, value: q.price, change: q.change, changePercent: q.changePercent };
      })
    );

    const indices = results
      .filter((r) => r.status === 'fulfilled')
      .map((r) => r.value);

    cacheSet(key, indices, QUOTE_TTL);
    res.json(indices);
  })
);

// GET /api/market/topmovers
// Checks a subset of 50 popular tickers, finds the one with highest absolute changePercent
router.get(
  '/topmovers',
  asyncHandler(async (_req, res) => {
    const key = 'market:topmovers';
    const cached = cacheGet(key);
    if (cached) return res.json(cached);

    const subset = TICKER_UNIVERSE.slice(0, 50);

    // Batch in groups of 10 to respect rate limits
    const results = [];
    for (let i = 0; i < subset.length; i += 10) {
      const batch = subset.slice(i, i + 10);
      const settled = await Promise.allSettled(
        batch.map(async (ticker) => {
          const q = await finnhub.getQuote(ticker);
          return { ticker, change: q.change, changePercent: q.changePercent, price: q.price };
        })
      );
      settled.forEach((r) => {
        if (r.status === 'fulfilled') results.push(r.value);
      });
    }

    // Top gainer (highest positive changePercent)
    const gainer = results
      .filter((r) => r.changePercent != null)
      .sort((a, b) => b.changePercent - a.changePercent)[0];

    // Try to fetch company name
    let companyName = gainer?.ticker || '';
    if (gainer) {
      try {
        const profile = await finnhub.getCompanyProfile(gainer.ticker);
        companyName = profile.companyName;
      } catch {/* best-effort */}
    }

    const mover = gainer ? { ...gainer, companyName } : null;
    cacheSet(key, mover, QUOTE_TTL);
    res.json(mover);
  })
);

module.exports = router;
