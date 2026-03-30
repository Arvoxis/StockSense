const router = require('express').Router();
const asyncHandler = require('../utils/asyncHandler');
const authMiddleware = require('../middleware/authMiddleware');
const Watchlist = require('../models/Watchlist');
const finnhub = require('../services/finnhubService');
const { cacheGet, QUOTE_TTL } = require('../services/cacheService');

// All watchlist routes are protected
router.use(authMiddleware);

// GET /api/watchlist
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const items = await Watchlist.find({ userId }).sort({ addedAt: -1 });

    // Enrich with live price data
    const enriched = await Promise.allSettled(
      items.map(async (item) => {
        let quote = cacheGet(`quote:${item.ticker}`);
        if (!quote) {
          try {
            quote = await finnhub.getQuote(item.ticker);
          } catch { quote = {}; }
        }
        return {
          ticker: item.ticker,
          companyName: item.companyName,
          addedAt: item.addedAt,
          aiPriorityScore: item.aiPriorityScore,
          sentiment: item.sentiment,
          price: quote.price,
          change: quote.change,
          changePercent: quote.changePercent,
        };
      })
    );

    res.json(enriched.filter((r) => r.status === 'fulfilled').map((r) => r.value));
  })
);

// POST /api/watchlist/:ticker
router.post(
  '/:ticker',
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const ticker = req.params.ticker.toUpperCase();

    // Check duplicate
    const existing = await Watchlist.findOne({ userId, ticker });
    if (existing) return res.status(409).json({ error: `${ticker} already in watchlist` });

    // Fetch company name from Finnhub
    let companyName = ticker;
    try {
      const profile = await finnhub.getCompanyProfile(ticker);
      companyName = profile.companyName || ticker;
    } catch { /* use ticker as fallback */ }

    const item = await Watchlist.create({ userId, ticker, companyName });
    res.status(201).json({ message: `${ticker} added`, item });
  })
);

// DELETE /api/watchlist/:ticker
router.delete(
  '/:ticker',
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const ticker = req.params.ticker.toUpperCase();
    const deleted = await Watchlist.findOneAndDelete({ userId, ticker });
    if (!deleted) return res.status(404).json({ error: `${ticker} not in watchlist` });
    res.json({ message: `${ticker} removed` });
  })
);

module.exports = router;
