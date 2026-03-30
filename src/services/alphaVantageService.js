const axios = require('axios');

const BASE = 'https://www.alphavantage.co/query';

/**
 * Fetch daily OHLCV candles from Alpha Vantage (fallback for chart data).
 * Alpha Vantage free tier: 25 calls/day — used only when Finnhub fails.
 */
async function getDailyCandles(ticker) {
  const { data } = await axios.get(BASE, {
    params: {
      function: 'TIME_SERIES_DAILY_ADJUSTED',
      symbol: ticker,
      outputsize: 'compact', // last 100 data points
      apikey: process.env.ALPHA_VANTAGE_API_KEY,
    },
    timeout: 10000,
  });

  const series = data['Time Series (Daily)'];
  if (!series) {
    throw new Error(`Alpha Vantage returned no data for ${ticker}`);
  }

  return Object.entries(series)
    .map(([date, v]) => ({
      time: Math.floor(new Date(date).getTime() / 1000),
      open: parseFloat(v['1. open']),
      high: parseFloat(v['2. high']),
      low: parseFloat(v['3. low']),
      close: parseFloat(v['5. adjusted close']),
      volume: parseInt(v['6. volume'], 10),
    }))
    .sort((a, b) => a.time - b.time);
}

/**
 * Fetch intraday OHLCV from Alpha Vantage.
 */
async function getIntradayCandles(ticker, interval = '5min') {
  const { data } = await axios.get(BASE, {
    params: {
      function: 'TIME_SERIES_INTRADAY',
      symbol: ticker,
      interval,
      outputsize: 'compact',
      apikey: process.env.ALPHA_VANTAGE_API_KEY,
    },
    timeout: 10000,
  });

  const key = `Time Series (${interval})`;
  const series = data[key];
  if (!series) throw new Error(`Alpha Vantage intraday returned no data for ${ticker}`);

  return Object.entries(series)
    .map(([dt, v]) => ({
      time: Math.floor(new Date(dt).getTime() / 1000),
      open: parseFloat(v['1. open']),
      high: parseFloat(v['2. high']),
      low: parseFloat(v['3. low']),
      close: parseFloat(v['4. close']),
      volume: parseInt(v['5. volume'], 10),
    }))
    .sort((a, b) => a.time - b.time);
}

module.exports = { getDailyCandles, getIntradayCandles };
