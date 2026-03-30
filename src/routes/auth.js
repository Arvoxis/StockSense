const router = require('express').Router();
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/tokenHelpers');
const authMiddleware = require('../middleware/authMiddleware');

// POST /api/auth/signup
router.post(
  '/signup',
  asyncHandler(async (req, res) => {
    const { email, password, displayName } = req.body;
    if (!email || !password || !displayName) {
      return res.status(400).json({ error: 'email, password and displayName are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ error: 'Email already in use' });

    // passwordHash field triggers bcrypt pre-save hook
    const user = new User({ email, passwordHash: password, displayName });
    const refreshToken = signRefreshToken({ id: user._id, email: user.email });
    user.refreshToken = refreshToken;
    await user.save();

    const accessToken = signAccessToken({ id: user._id, email: user.email });

    res.status(201).json({
      accessToken,
      refreshToken,
      user: user.toSafeObject(),
    });
  })
);

// POST /api/auth/login
router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await user.comparePassword(password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const accessToken = signAccessToken({ id: user._id, email: user.email });
    const refreshToken = signRefreshToken({ id: user._id, email: user.email });

    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save();

    res.json({ accessToken, refreshToken, user: user.toSafeObject() });
  })
);

// POST /api/auth/refresh
router.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: 'refreshToken required' });

    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ error: 'Refresh token reuse or revoked' });
    }

    // Token rotation
    const newAccess = signAccessToken({ id: user._id, email: user.email });
    const newRefresh = signRefreshToken({ id: user._id, email: user.email });
    user.refreshToken = newRefresh;
    await user.save();

    res.json({ accessToken: newAccess, refreshToken: newRefresh });
  })
);

// POST /api/auth/logout
router.post(
  '/logout',
  asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await User.findOneAndUpdate({ refreshToken }, { $set: { refreshToken: null } });
    }
    res.json({ message: 'Logged out' });
  })
);

// GET /api/auth/me (protected)
router.get('/me', authMiddleware, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user: user.toSafeObject() });
}));

module.exports = router;
