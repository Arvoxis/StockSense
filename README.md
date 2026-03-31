<div align="center">

# StockSense

**AI-Powered Stock Dashboard for Smarter Retail Investing**

![JavaScript](https://img.shields.io/badge/JavaScript-95.2%25-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=flat-square&logo=node.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat-square&logo=mongodb&logoColor=white)
![Claude AI](https://img.shields.io/badge/Claude_AI-Anthropic-D4A574?style=flat-square)

</div>

---

## What is StockSense?

StockSense is a full-stack stock dashboard that combines real-time market data with Claude AI analysis to help retail investors make informed decisions without juggling ten different tabs.

**Key features:**
- **Live Quotes & Charts** — Real-time prices and interactive OHLCV candlestick charts
- **AI Analysis** — Claude-powered buy/sell/hold recommendations fusing technicals, news, and sentiment
- **Why Is It Moving?** — AI-generated plain-English explanations for stock movements
- **Smart Screener** — Filter stocks with AI-ranked top 3 picks
- **Watchlist** — Track favorites with AI sentiment scores
- **User Accounts** — Full auth system with JWT, profile management, and avatar uploads

---

## Architecture
```
StockSense/
├── client/              # Frontend (HTML/CSS/JS)
├── src/
│   ├── routes/          # Express API routes
│   ├── middleware/       # Auth, error handling
│   ├── models/          # MongoDB/Mongoose schemas
│   └── services/        # External API integrations
├── server.js            # Entry point
├── .env.example         # Environment variable template
└── package.json
```

---

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB instance (local or Atlas)
- API keys: Anthropic (Claude), Finnhub, Alpha Vantage (optional), NewsAPI (optional)

### Setup
```bash
# Clone the repo
git clone https://github.com/Arvoxis/StockSense.git
cd StockSense

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Fill in your API keys in .env

# Start development server (hot reload)
npm run dev

# Or start production server
npm start
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| MONGO_URI | Yes | MongoDB connection string |
| JWT_SECRET | Yes | Secret for access tokens |
| JWT_REFRESH_SECRET | Yes | Secret for refresh tokens |
| ANTHROPIC_API_KEY | Yes | Claude API key for AI features |
| FINNHUB_API_KEY | Yes | Primary market data source |
| ALPHA_VANTAGE_KEY | Optional | Chart data fallback |
| NEWS_API_KEY | Optional | Secondary news source |

---

## API Overview

The backend exposes RESTful endpoints across five domains:

- **Auth** — Signup, login, JWT refresh, logout
- **Stocks** — Search, live quotes, charts, fundamentals, technical indicators (EMA/BB/RSI/MACD)
- **Market** — Index tracking (S&P 500, NASDAQ, DOW, VIX), top movers
- **AI** — Claude analysis, movement explainer, sentiment scoring, screener picks
- **User** — Watchlist CRUD, profile updates, avatar upload

Health check available at GET /health.

---

## Built With

- **Backend:** Node.js, Express
- **Database:** MongoDB, Mongoose
- **AI:** Anthropic Claude API
- **Market Data:** Finnhub, Alpha Vantage
- **Auth:** JWT (access + refresh tokens)
- **Frontend:** Vanilla JS, CSS

---

## Roadmap

- [ ] Add WebSocket for real-time price streaming
- [ ] Portfolio tracking with P&L calculations
- [ ] Mobile-responsive redesign
- [ ] Deploy to production (Render/Railway)

---

## License

This project is open source and available under the MIT License.

---

<div align="center">

**Built by [Rakshit Sinha](https://github.com/Arvoxis)**

</div>
