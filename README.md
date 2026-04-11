# 📈 StockSense

<div align="center">

![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Claude AI](https://img.shields.io/badge/Claude_AI-Anthropic-CC785C?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

**An AI-powered stock dashboard that gives you real-time prices, interactive charts, and Claude AI buy/sell/hold calls — all in one place.**

> Stop juggling tabs. StockSense fuses technicals, news, and sentiment into one clean interface.

</div>

---

## ✨ Features

- 📊 **Real-time stock prices** via Finnhub API
- 🤖 **Claude AI analysis** — get buy/sell/hold recommendations with reasoning
- 💬 **"Why Is It Moving?"** — one-click AI explainer for any price movement
- 📰 **News + Sentiment fusion** — market and company news aggregated in real time
- 📉 **Technical indicators** — EMA, Bollinger Bands, RSI, MACD
- ⭐ **Watchlist** — track your favourite tickers with AI scores
- 🔍 **Stock Screener** — filter stocks by criteria, get AI top picks
- 🔐 **JWT Authentication** — secure login with access/refresh token flow

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js, Express |
| Database | MongoDB (Atlas) |
| Auth | JWT (access + refresh tokens) |
| AI | Anthropic Claude API |
| Market Data | Finnhub (primary), Alpha Vantage (charts fallback) |
| News | NewsAPI |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (free tier works)
- API keys: Anthropic, Finnhub, Alpha Vantage, NewsAPI

### Installation

```bash
# Clone the repo
git clone https://github.com/Arvoxis/StockSense.git
cd StockSense

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Fill in your API keys in .env
```

### Environment Variables

| Variable | Description |
|---|---|
| `PORT` | Server port (default: 5000) |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret for access tokens (15 min expiry) |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens (7 day expiry) |
| `ANTHROPIC_API_KEY` | Claude API key |
| `FINNHUB_API_KEY` | Finnhub — primary market data source |
| `ALPHA_VANTAGE_KEY` | Alpha Vantage — chart data fallback |
| `NEWS_API_KEY` | NewsAPI — optional secondary news source |

### Run

```bash
# Development (hot reload)
npm run dev

# Production
npm start
```

---

## 📡 API Reference

### Auth
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/signup` | — | Register new user |
| POST | `/api/auth/login` | — | Login |
| POST | `/api/auth/refresh` | — | Refresh access token |
| POST | `/api/auth/logout` | — | Logout |
| GET | `/api/auth/me` | ✅ | Get current user |

### Stocks
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/stocks/search` | Search tickers |
| GET | `/api/stocks/:ticker/quote` | Live quote |
| GET | `/api/stocks/:ticker/chart` | OHLCV candlestick data |
| GET | `/api/stocks/:ticker/stats` | Fundamental data |
| GET | `/api/stocks/:ticker/indicators` | EMA / BB / RSI / MACD |

### AI Endpoints
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/ai/analyze` | Claude buy/sell/hold analysis |
| GET | `/api/ai/whymoving/:ticker` | Explain why a stock is moving |
| POST | `/api/ai/sentiment` | Sentiment scoring |
| GET | `/api/ai/screener-picks` | Top 3 AI stock picks |

### Market & More
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/market/indices` | S&P 500, NASDAQ, DOW, VIX |
| GET | `/api/market/topmovers` | Top gainers/losers |
| GET | `/api/news` | Market and company news |
| GET | `/api/screener` | Filter stocks by criteria |

### Health Check
```
GET /health → { status: 'ok', time: '...' }
```

---

## 📁 Project Structure

```
StockSense/
├── server.js              # Express app entry point
├── src/
│   ├── routes/            # API route handlers
│   ├── controllers/       # Business logic
│   ├── models/            # MongoDB schemas
│   └── middleware/        # Auth, error handling
├── client/                # Frontend
├── .env.example           # Environment variable template
├── package.json
└── README.md
```

---

## 🗺️ Roadmap

- [ ] Portfolio tracking with P&L
- [ ] Price alerts via email/SMS
- [ ] Options chain data
- [ ] Mobile responsive frontend
- [ ] WebSocket live price streaming

---

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "feat: add your feature"`
4. Push and open a PR

---

## ⚠️ Disclaimer

StockSense is for **educational purposes only**. AI analysis is not financial advice. Always do your own research before making investment decisions.

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">
Built with ☕ and Claude AI by <a href="https://github.com/Arvoxis">Arvoxis</a>
</div>
