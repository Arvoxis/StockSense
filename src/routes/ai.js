const router = require('express').Router();
const asyncHandler = require('../utils/asyncHandler');
const authMiddleware = require('../middleware/authMiddleware');
const { aiRateLimiter } = require('../middleware/rateLimiter');
const { claudeChat, parseClaudeJSON } = require('../services/anthropicService');
const finnhub = require('../services/finnhubService');
const avService = require('../services/alphaVantageService');
const { latestRSI } = require('../services/indicatorService');
const Watchlist = require('../models/Watchlist');
const { cacheGet } = require('../services/cacheService');

// Apply rate limiter to all AI routes
router.use(aiRateLimiter);

// ─── POST /api/ai/analyze ─────────────────────────────────────────────────────
router.post(
  '/analyze',
  asyncHandler(async (req, res) => {
    const { ticker, price, rsi, macd, headlines = [], trend } = req.body;
    if (!ticker) return res.status(400).json({ error: 'ticker is required' });

    const headlineList = headlines.map((h, i) => `${i + 1}. ${h}`).join('\n');

    const system = 'You are a professional stock analyst. Respond ONLY with valid JSON — no markdown, no extra text.';
    const user = `Analyze $${ticker} with the following data:
Current Price: $${price} | RSI(14): ${rsi} | MACD Signal: ${macd} | 30-day trend: ${trend}
Recent headlines:
${headlineList}

Respond ONLY in this JSON format:
{
  "verdict": "BUY" | "HOLD" | "SELL",
  "confidence": <number 0-100>,
  "reasoning": [<3-5 bullet point strings combining technical + fundamental + sentiment>],
  "risks": [<2-3 key risk strings>],
  "priceLevels": { "support": <number>, "resistance": <number> },
  "summary": "<2-3 sentence plain-English explanation for a beginner>"
}`;

    let result;
    try {
      const raw = await claudeChat(system, user);
      result = parseClaudeJSON(raw);
    } catch (err) {
      console.error('[ai/analyze] Claude failed:', err.message);
      result = {
        verdict: 'HOLD',
        confidence: 50,
        reasoning: ['AI analysis temporarily unavailable'],
        risks: ['Unable to assess risks at this time'],
        priceLevels: { support: 0, resistance: 0 },
        summary: 'AI analysis is currently unavailable. Please try again.',
      };
    }
    res.json(result);
  })
);

// ─── GET /api/ai/whymoving/:ticker ────────────────────────────────────────────
router.get(
  '/whymoving/:ticker',
  asyncHandler(async (req, res) => {
    const ticker = req.params.ticker.toUpperCase();

    const [quote, news] = await Promise.all([
      finnhub.getQuote(ticker),
      finnhub.getCompanyNews(ticker),
    ]);

    // Get RSI from cached candles if available
    const chartKey = `chart:${ticker}:1M`;
    let rsiVal = null;
    const cachedCandles = cacheGet(chartKey);
    if (cachedCandles && cachedCandles.length >= 14) {
      rsiVal = latestRSI(cachedCandles.map((c) => c.close));
    }

    const headlineSnippets = news
      .slice(0, 5)
      .map((n) => `- ${n.headline}`)
      .join('\n');

    const system = 'You are a financial analyst writing for retail investors. Be concise, specific, and factual.';
    const user = `In 3-4 sentences, explain why $${ticker} is moving today (currently ${quote.changePercent?.toFixed(2)}% ${quote.changePercent >= 0 ? 'up' : 'down'}).
${rsiVal ? `RSI(14): ${rsiVal.toFixed(1)}` : ''}
Today's headlines:
${headlineSnippets || 'No headlines available.'}

Write for a retail investor. Be specific about what's driving the move.`;

    let explanation;
    try {
      explanation = (await claudeChat(system, user)).trim();
    } catch (err) {
      console.error('[ai/whymoving] Claude failed:', err.message);
      explanation = 'AI explanation temporarily unavailable. Please try again.';
    }
    res.json({ ticker, explanation });
  })
);

// ─── POST /api/ai/sentiment ────────────────────────────────────────────────────
router.post(
  '/sentiment',
  asyncHandler(async (req, res) => {
    const { headlines } = req.body;
    if (!Array.isArray(headlines) || headlines.length === 0) {
      return res.status(400).json({ error: 'headlines array required' });
    }

    const list = headlines.map((h, i) => `${i + 1}. ${h}`).join('\n');
    const system = 'You are a financial sentiment analyst. Respond ONLY with a valid JSON array — no markdown, no extra text.';
    const user = `For each headline below, return a JSON array with:
{ "headline": string, "sentiment": "Bullish" | "Bearish" | "Neutral", "reason": string (max 10 words) }

Headlines:
${list}

Return ONLY the JSON array.`;

    let result;
    try {
      const raw = await claudeChat(system, user);
      result = parseClaudeJSON(raw);
    } catch (err) {
      console.error('[ai/sentiment] Claude failed:', err.message);
      result = headlines.map((h) => ({ headline: h, sentiment: 'Neutral', reason: 'AI unavailable' }));
    }
    res.json(result);
  })
);

// ─── GET /api/ai/watchlist-scores (protected) ─────────────────────────────────
router.get(
  '/watchlist-scores',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const items = await Watchlist.find({ userId });
    if (items.length === 0) return res.json([]);

    // Gather data for each ticker
    const tickerData = await Promise.allSettled(
      items.map(async (item) => {
        const ticker = item.ticker;
        let changePercent = null, rsiVal = null, avgVolume = null, volume = null;

        try {
          const q = await finnhub.getQuote(ticker);
          changePercent = q.changePercent;
        } catch { /* best-effort */ }

        try {
          const stats = await finnhub.getBasicFinancials(ticker);
          avgVolume = stats.avgVolume;
        } catch { /* best-effort */ }

        // Try cached candles for RSI
        const chartKey = `chart:${ticker}:1M`;
        const candles = cacheGet(chartKey);
        if (candles && candles.length >= 14) {
          rsiVal = latestRSI(candles.map((c) => c.close));
        }

        return { ticker, changePercent, rsi: rsiVal, avgVolume, sentiment: item.sentiment };
      })
    );

    const dataList = tickerData
      .filter((r) => r.status === 'fulfilled')
      .map((r) => r.value);

    const summary = dataList
      .map(
        (d) =>
          `${d.ticker}: RSI=${d.rsi?.toFixed(1) ?? 'N/A'}, change=${d.changePercent?.toFixed(2) ?? 'N/A'}%, sentiment=${d.sentiment ?? 'N/A'}`
      )
      .join('\n');

    const system = 'You are a quantitative stock analyst. Respond ONLY with valid JSON — no markdown, no extra text.';
    const user = `Score each stock 1-10 for short-term trading opportunity based on: RSI, price momentum, volume anomaly, and sentiment.
Return JSON: [{ "ticker": string, "score": number, "reason": string (1 sentence) }]

Data:
${summary}`;

    let scored;
    try {
      const raw = await claudeChat(system, user);
      scored = parseClaudeJSON(raw);
    } catch (err) {
      console.error('[ai/watchlist-scores] Claude failed:', err.message);
      scored = dataList.map((d) => ({ ticker: d.ticker, score: 5, reason: 'AI scoring temporarily unavailable' }));
    }

    // Update DB scores
    await Promise.allSettled(
      scored.map((s) =>
        Watchlist.findOneAndUpdate(
          { userId, ticker: s.ticker },
          { aiPriorityScore: s.score }
        )
      )
    );

    res.json(scored);
  })
);

// ─── GET /api/ai/screener-picks ───────────────────────────────────────────────
router.get(
  '/screener-picks',
  asyncHandler(async (req, res) => {
    const { results } = req.query;
    // Accept as query param (JSON stringified) or request body via GET workaround
    let screenerResults;
    try {
      screenerResults = JSON.parse(results || '[]');
    } catch {
      return res.status(400).json({ error: 'results must be valid JSON array' });
    }

    if (!screenerResults || screenerResults.length === 0) {
      return res.status(400).json({ error: 'No screener results provided' });
    }

    const dataStr = screenerResults
      .map((r) => `${r.ticker}: RSI=${r.rsi?.toFixed?.(1) ?? 'N/A'}, change=${r.changePercent?.toFixed?.(2) ?? 'N/A'}%`)
      .join('\n');

    const system = 'You are a stock trading analyst. Respond ONLY with a valid JSON array — no markdown, no extra text.';
    const user = `From these screener results, pick the top 3 most interesting stocks for a short-term trade.
Return JSON: [{ "ticker": string, "reason": string (1-2 sentences) }]

Screener results:
${dataStr}`;

    let picks;
    try {
      const raw = await claudeChat(system, user);
      picks = parseClaudeJSON(raw);
    } catch (err) {
      console.error('[ai/screener-picks] Claude failed:', err.message);
      picks = screenerResults.slice(0, 3).map((r) => ({ ticker: r.ticker, reason: 'AI picks temporarily unavailable' }));
    }
    res.json(picks);
  })
);

module.exports = router;
