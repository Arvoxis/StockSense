const mongoose = require('mongoose');

const WatchlistSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    ticker: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    companyName: {
      type: String,
      default: '',
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
    aiPriorityScore: {
      type: Number,
      default: null,
    },
    sentiment: {
      type: String,
      enum: ['Bullish', 'Bearish', 'Neutral', null],
      default: null,
    },
  },
  { timestamps: false }
);

// Compound index: one ticker per user
WatchlistSchema.index({ userId: 1, ticker: 1 }, { unique: true });

module.exports = mongoose.model('Watchlist', WatchlistSchema);
