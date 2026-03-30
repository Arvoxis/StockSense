# StockSense Backend

Node.js/Express backend for the AI-powered stock trading dashboard.

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy and fill in your API keys
cp .env.example .env

# 3. Start dev server (hot reload)
npm run dev

# 4. Start production server
npm start
```

## Environment Variables

See `.env.example` for all required variables.

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default 5000) |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret for access tokens (15 min) |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens (7 days) |
| `ANTHROPIC_API_KEY` | Claude API key |
| `FINNHUB_API_KEY` | Finnhub key — primary data source |
| `ALPHA_VANTAGE_KEY` | Alpha Vantage — chart fallback only |
| `NEWS_API_KEY` | NewsAPI — optional secondary source |

## API Routes

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/auth/signup` | — | Register |
| POST | `/api/auth/login` | — | Login |
| POST | `/api/auth/refresh` | — | Refresh token |
| POST | `/api/auth/logout` | — | Logout |
| GET | `/api/auth/me` | ✅ | Current user |
| GET | `/api/stocks/search` | — | Search tickers |
| GET | `/api/stocks/:ticker/quote` | — | Live quote |
| GET | `/api/stocks/:ticker/chart` | — | OHLCV candles |
| GET | `/api/stocks/:ticker/stats` | — | Fundamentals |
| GET | `/api/stocks/:ticker/indicators` | — | EMA/BB/RSI/MACD |
| GET | `/api/market/indices` | — | S&P/NASDAQ/DOW/VIX |
| GET | `/api/market/topmovers` | — | Top gainer |
| GET | `/api/news` | — | Market/company news |
| POST | `/api/ai/analyze` | — | Claude analysis |
| GET | `/api/ai/whymoving/:ticker` | — | Explain movement |
| POST | `/api/ai/sentiment` | — | Sentiment scoring |
| GET | `/api/ai/watchlist-scores` | ✅ | AI watchlist scores |
| GET | `/api/ai/screener-picks` | — | Top 3 AI picks |
| GET | `/api/watchlist` | ✅ | Get watchlist |
| POST | `/api/watchlist/:ticker` | ✅ | Add ticker |
| DELETE | `/api/watchlist/:ticker` | ✅ | Remove ticker |
| GET | `/api/screener` | — | Filter stocks |
| PUT | `/api/user/profile` | ✅ | Update profile |
| POST | `/api/user/avatar` | ✅ | Upload avatar |
| DELETE | `/api/user/account` | ✅ | Delete account |

## Health Check

```
GET /health → { status: 'ok', time: '...' }
```
