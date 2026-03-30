const router = require('express').Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const asyncHandler = require('../utils/asyncHandler');
const authMiddleware = require('../middleware/authMiddleware');
const User = require('../models/User');
const Watchlist = require('../models/Watchlist');

// All user routes are protected
router.use(authMiddleware);

// Multer setup — save to /uploads with original extension
const uploadDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `avatar-${req.user.id}-${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

// PUT /api/user/profile
router.put(
  '/profile',
  asyncHandler(async (req, res) => {
    const { displayName, email } = req.body;
    const userId = req.user.id;

    const update = {};
    if (displayName) update.displayName = displayName.trim();
    if (email) update.email = email.toLowerCase().trim();

    const user = await User.findByIdAndUpdate(userId, update, { new: true, runValidators: true });
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({ user: user.toSafeObject() });
  })
);

// POST /api/user/avatar
router.post(
  '/avatar',
  upload.single('avatar'),
  asyncHandler(async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const avatarUrl = `/uploads/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { avatarUrl },
      { new: true }
    );

    res.json({ avatarUrl: user.avatarUrl });
  })
);

// DELETE /api/user/account
router.delete(
  '/account',
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    await Promise.all([
      User.findByIdAndDelete(userId),
      Watchlist.deleteMany({ userId }),
    ]);
    res.json({ message: 'Account deleted' });
  })
);

module.exports = router;
