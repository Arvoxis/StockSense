# StockSense — AI stock dashboard

Real-time prices, interactive charts, and LLM-generated buy/sell/hold calls fusing
technicals, news and sentiment.

Repo: `github.com/Arvoxis/StockSense` · deploys to Render (`render.yaml`)

## Important

This project outputs things that **look like financial advice**. Keep the existing framing —
it is an analysis tool, not a recommendation engine. Don't remove disclaimers, and don't add
features that place trades or move money.

## Layout

```
server.js            Express 5 entry point
src/
  routes/            HTTP routes
  services/          Business logic: market data, indicators, LLM calls
  models/            Mongoose schemas
  middleware/        auth (JWT), rate limiting, morgan logging
  jobs/              node-cron scheduled tasks
  config/ utils/
client/src/          React 19 + Vite
  pages/ components/ hooks/ stores/ api/
```

Routes stay thin — logic belongs in `src/services/`.

## Stack notes

- **Express 5**, not 4. Error-handling and async middleware semantics differ; check before
  copying a v4 snippet off the internet.
- MongoDB Atlas via Mongoose. Auth is JWT + bcryptjs.
- Market data: **Finnhub is primary** (`finnhubService.js`, used by `ai`, `market`, `news`,
  `screener`, `stocks`, `watchlist` routes). `yahooFinanceService.js` serves candles for
  `stocks` and `screener`; `alphaVantageService.js` is the chart fallback in `ai`.
  Indicators: `technicalindicators`. Don't hand-roll either.
- **LLM is Groq, not Anthropic.** `src/services/anthropicService.js` is a misnomer — it
  constructs `new Groq(...)` and calls `llama-3.3-70b-versatile`; its exported function is
  named `claudeChat()`. `@anthropic-ai/sdk` is in `package.json` but **imported nowhere**.
  Only `GROQ_API_KEY` is needed; `render.yaml` is correct to omit `ANTHROPIC_API_KEY`.
- `node-cache` fronts the market data calls — Yahoo will rate-limit without it. Keep caching
  in place when adding new data fetches.
- `express-rate-limit` guards the public endpoints.
- `uploads/` is runtime data, not commit material.

## Rules

- **Never commit `.env`** (Mongo URI, JWT secrets, Groq, Finnhub and Alpha Vantage keys).
  Keep `.env.example` current.
- Deployment is split: `render.yaml` deploys **only the API**. The client has its own
  `client/vercel.json` and is deployed separately on Vercel.
- `npm test` is still a stub. If you add tests, wire the script up properly rather than
  leaving the placeholder.

## Running

```bash
npm run dev:all      # server + client together
npm run dev          # server only (nodemon)
npm run client       # client only
```
