const jwt = require('jsonwebtoken');

/**
 * Signs a short-lived access token (15 min).
 */
function signAccessToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' });
}

/**
 * Signs a long-lived refresh token (7 days).
 */
function signRefreshToken(payload) {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
}

/**
 * Verifies a refresh token and returns the decoded payload.
 * Throws if invalid.
 */
function verifyRefreshToken(token) {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
}

module.exports = { signAccessToken, signRefreshToken, verifyRefreshToken };
