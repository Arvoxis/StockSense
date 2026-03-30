const { default: YahooFinance } = require('yahoo-finance2');
const yahooFinance = new YahooFinance();

// Range → Yahoo Finance interval + period in days
const RANGE_CONFIG = {
  '1D': { interval: '5m',  days: 1   },
  '1W': { interval: '15m', days: 7   },
  '1M': { interval: '1d',  days: 30  },
  '3M': { interval: '1d',  days: 90  },
  '1Y': { interval: '1wk', days: 365 },
};

/**
 * Fetch OHLCV candles from Yahoo Finance (free, no API key).
 * Returns [{time (unix seconds), open, high, low, close, volume}]
 */
async function getCandles(ticker, range = '1M') {
  const conf = RANGE_CONFIG[range] || RANGE_CONFIG['1M'];
  const period1 = new Date(Date.now() - conf.days * 24 * 60 * 60 * 1000);
  const period2 = new Date();

  const result = await yahooFinance.chart(ticker, {
    period1,
    period2,
    interval: conf.interval,
  });

  if (!result?.quotes?.length) return [];

  return result.quotes
    .filter((q) => q.open != null && q.close != null)
    .map((q) => ({
      time: Math.floor(new Date(q.date).getTime() / 1000),
      open: q.open,
      high: q.high,
      low: q.low,
      close: q.adjclose ?? q.close,
      volume: q.volume ?? 0,
    }));
}

/**
 * Fetch 1Y daily candles (used for indicator calculation).
 */
async function getDailyCandles(ticker) {
  return getCandles(ticker, '1Y');
}

module.exports = { getCandles, getDailyCandles, RANGE_CONFIG };
