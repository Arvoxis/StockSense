const {
  EMA,
  BollingerBands,
  RSI,
  MACD,
} = require('technicalindicators');

/**
 * Calculate EMA for a given period over close prices.
 */
function calcEMA(closes, period) {
  return EMA.calculate({ period, values: closes });
}

/**
 * Calculate Bollinger Bands (20-period, 2 std dev).
 */
function calcBollingerBands(closes, period = 20, stdDev = 2) {
  return BollingerBands.calculate({ period, stdDev, values: closes });
}

/**
 * Calculate RSI (14-period).
 */
function calcRSI(closes, period = 14) {
  return RSI.calculate({ period, values: closes });
}

/**
 * Calculate MACD (12, 26, 9).
 */
function calcMACD(closes, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
  return MACD.calculate({
    fastPeriod,
    slowPeriod,
    signalPeriod,
    values: closes,
    SimpleMAOscillator: false,
    SimpleMASignal: false,
  });
}

/**
 * Build full indicators object from candle data.
 * All arrays are right-aligned to the candle length (shorter arrays have nulls prepended).
 */
function buildIndicators(candles) {
  const closes = candles.map((c) => c.close);
  const n = closes.length;

  function padLeft(arr, targetLen) {
    const pad = Array(targetLen - arr.length).fill(null);
    return [...pad, ...arr];
  }

  const ema20 = padLeft(calcEMA(closes, 20), n);
  const ema50 = padLeft(calcEMA(closes, 50), n);
  const ema200 = padLeft(calcEMA(closes, 200), n);
  const bb = padLeft(calcBollingerBands(closes), n);
  const rsi = padLeft(calcRSI(closes), n);
  const macd = padLeft(calcMACD(closes), n);

  return {
    ema20,
    ema50,
    ema200,
    bollingerBands: bb,
    rsi,
    macd,
  };
}

/**
 * Returns the latest RSI value (for quick AI use).
 */
function latestRSI(closes) {
  const vals = calcRSI(closes, 14);
  return vals.length > 0 ? vals[vals.length - 1] : null;
}

module.exports = { buildIndicators, latestRSI, calcRSI, calcEMA, calcMACD };
