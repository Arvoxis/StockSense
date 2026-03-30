/**
 * Curated universe of 100 popular tickers used by the screener and cron pre-cache job.
 */
const TICKER_UNIVERSE = [
  // Mega-cap tech
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'AVGO', 'ORCL', 'CRM',
  // Large-cap tech
  'AMD', 'INTC', 'QCOM', 'TXN', 'MU', 'AMAT', 'LRCX', 'KLAC', 'NOW', 'SNOW',
  // Finance
  'JPM', 'BAC', 'WFC', 'GS', 'MS', 'C', 'BLK', 'AXP', 'V', 'MA',
  // Healthcare
  'JNJ', 'PFE', 'MRK', 'ABBV', 'LLY', 'BMY', 'UNH', 'CVS', 'AMGN', 'GILD',
  // Consumer / Retail
  'WMT', 'TGT', 'COST', 'HD', 'LOW', 'MCD', 'SBUX', 'NKE', 'TJX', 'DG',
  // Energy
  'XOM', 'CVX', 'COP', 'SLB', 'EOG', 'MPC', 'PSX', 'VLO', 'OXY', 'HAL',
  // Industrials
  'CAT', 'DE', 'HON', 'GE', 'BA', 'LMT', 'RTX', 'UPS', 'FDX', 'EMR',
  // Communication
  'NFLX', 'DIS', 'CMCSA', 'T', 'VZ', 'TMUS', 'ATVI', 'EA', 'TTWO', 'WBD',
  // ETFs (for index exposure)
  'SPY', 'QQQ', 'IWM', 'GLD', 'TLT', 'XLF', 'XLE', 'XLK', 'XLV', 'ARKK',
  // High-momentum / popular
  'PLTR', 'SOFI', 'RIVN', 'LCID', 'COIN', 'RBLX', 'HOOD', 'AMC', 'GME', 'MSTR',
];

module.exports = TICKER_UNIVERSE;
