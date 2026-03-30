const axios = require('axios');

const BASE = 'https://finnhub.io/api/v1';

function getHeaders() {
  return { 'X-Finnhub-Token': process.env.FINNHUB_API_KEY };
}

async function finnhubGet(path, params = {}) {
  try {
    const { data } = await axios.get(`${BASE}${path}`, {
      headers: getHeaders(),
      params,
      timeout: 8000,
    });
    return data;
  } catch (err) {
    if (err.response?.status === 401 || err.response?.status === 403) {
      throw new Error(`Finnhub API key invalid or unauthorized (${err.response.status})`);
    }
    if (err.response?.status === 429) {
      throw new Error('Finnhub API rate limit exceeded — free tier allows 60 calls/min');
    }
    if (err.code === 'ECONNABORTED') {
      throw new Error('Finnhub request timed out');
    }
    throw err;
  }
}

// Symbol search
async function searchSymbols(query) {
  const data = await finnhubGet('/search', { q: query });
  return (data.result || []).map((r) => ({
    ticker: r.symbol,
    companyName: r.description,
    exchange: r.primaryExchange || '',
  }));
}

// Real-time quote
async function getQuote(ticker) {
  const data = await finnhubGet('/quote', { symbol: ticker });
  return {
    price: data.c,
    change: data.d,
    changePercent: data.dp,
    high: data.h,
    low: data.l,
    open: data.o,
    prevClose: data.pc,
    volume: null, // Finnhub quote doesn't return volume — populated from profile2 if needed
    marketStatus: data.c > 0 ? 'open' : 'closed',
  };
}

// Candles (OHLCV)
async function getCandles(ticker, resolution, from, to) {
  const data = await finnhubGet('/stock/candle', {
    symbol: ticker,
    resolution,
    from,
    to,
  });
  if (data.s !== 'ok') return [];
  return data.t.map((t, i) => ({
    time: t,
    open: data.o[i],
    high: data.h[i],
    low: data.l[i],
    close: data.c[i],
    volume: data.v[i],
  }));
}

// Basic financials / stats
async function getBasicFinancials(ticker) {
  const data = await finnhubGet('/stock/metric', {
    symbol: ticker,
    metric: 'all',
  });
  const m = data.metric || {};
  return {
    marketCap: m['marketCapitalization'] || null,
    peRatio: m['peNormalizedAnnual'] || null,
    eps: m['epsNormalizedAnnual'] || null,
    high52w: m['52WeekHigh'] || null,
    low52w: m['52WeekLow'] || null,
    avgVolume: m['averageDailyVolume10Day'] || null,
    beta: m['beta'] || null,
    dividendYield: m['dividendYieldIndicatedAnnual'] || null,
  };
}

// Company profile (for company name lookup)
async function getCompanyProfile(ticker) {
  const data = await finnhubGet('/stock/profile2', { symbol: ticker });
  return {
    companyName: data.name || ticker,
    exchange: data.exchange || '',
    industry: data.finnhubIndustry || '',
  };
}

// Company news
async function getCompanyNews(ticker) {
  const today = new Date();
  const to = today.toISOString().split('T')[0];
  const from7 = new Date(today - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const data = await finnhubGet('/company-news', { symbol: ticker, from: from7, to });
  return (Array.isArray(data) ? data : [])
    .filter((n) => n.headline && n.url)
    .map((n) => ({
      id: n.id,
      headline: n.headline,
      source: n.source,
      url: n.url,
      datetime: n.datetime * 1000,
      summary: n.summary || '',
      image: n.image || '',
    }));
}

// General market news
async function getMarketNews() {
  const data = await finnhubGet('/news', { category: 'general', minId: 0 });
  return (Array.isArray(data) ? data : [])
    .filter((n) => n.headline && n.url)
    .map((n) => ({
      id: n.id,
      headline: n.headline,
      source: n.source,
      url: n.url,
      datetime: n.datetime * 1000,
      summary: n.summary || '',
      image: n.image || '',
    }));
}

module.exports = {
  searchSymbols,
  getQuote,
  getCandles,
  getBasicFinancials,
  getCompanyProfile,
  getCompanyNews,
  getMarketNews,
};
