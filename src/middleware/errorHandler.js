// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Axios errors from upstream API calls (Finnhub, Alpha Vantage, etc.)
  if (err.response) {
    const upstreamStatus = err.response.status;
    const upstreamData = err.response.data;
    console.error(`[ERROR] Upstream API error ${upstreamStatus} for ${req.url}:`, upstreamData);

    if (upstreamStatus === 401 || upstreamStatus === 403) {
      return res.status(502).json({ error: 'External API authentication failed — check API key' });
    }
    if (upstreamStatus === 429) {
      return res.status(429).json({ error: 'External API rate limit exceeded — please wait and retry' });
    }
    return res.status(502).json({ error: `External API error: ${upstreamStatus}` });
  }

  console.error(`[ERROR] ${req.method} ${req.url} — ${err.message}`);
  const status = err.statusCode || err.status || 500;
  res.status(status).json({ error: err.message || 'Internal server error' });
}

module.exports = errorHandler;
