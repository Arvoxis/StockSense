const router = require('express').Router();
const asyncHandler = require('../utils/asyncHandler');
const finnhub = require('../services/finnhubService');
const { cacheGet, cacheSet } = require('../services/cacheService');

const NEWS_TTL = 120; // 2 min cache for news

// GET /api/news?ticker=AAPL&sentiment=Bullish
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { ticker, sentiment } = req.query;
    const key = `news:${ticker || 'general'}`;
    let articles = cacheGet(key);

    if (!articles) {
      try {
        if (ticker) {
          articles = await finnhub.getCompanyNews(ticker.toUpperCase());
        } else {
          articles = await finnhub.getMarketNews();
        }
      } catch (err) {
        console.warn(`[news] Finnhub news failed: ${err.message}`);
        articles = [];
      }
      articles = articles || [];
      cacheSet(key, articles, NEWS_TTL);
    }

    // Apply optional sentiment filter (relies on articles already having .sentiment populated)
    let filtered = articles;
    if (sentiment) {
      filtered = articles.filter(
        (a) => a.sentiment && a.sentiment.toLowerCase() === sentiment.toLowerCase()
      );
    }

    res.json(filtered);
  })
);

module.exports = router;
