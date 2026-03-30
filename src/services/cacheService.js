const NodeCache = require('node-cache');

// TTLs in seconds
const QUOTE_TTL = 60;
const CHART_TTL = 300;
const STATS_TTL = 600;
const SEARCH_TTL = 300;

const cache = new NodeCache({ checkperiod: 60 });

function cacheGet(key) {
  return cache.get(key);
}

function cacheSet(key, value, ttl) {
  cache.set(key, value, ttl);
}

function cacheHas(key) {
  return cache.has(key);
}

function cacheDel(key) {
  cache.del(key);
}

module.exports = {
  cache,
  cacheGet,
  cacheSet,
  cacheHas,
  cacheDel,
  QUOTE_TTL,
  CHART_TTL,
  STATS_TTL,
  SEARCH_TTL,
};
