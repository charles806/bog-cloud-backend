const mongoose = require('mongoose');

const passwordHistorySchema = new mongoose.Schema({
  password: { type: String, required: true },
  changedAt: { type: Date, default: Date.now }
});

const vaultEntrySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  folderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VaultFolder',
    default: null,
    index: true
  },
  siteName: {
    type: String,
    required: [true, 'Site name is required'],
    trim: true,
    index: true
  },
  username: {
    type: String,
    trim: true,
    index: true
  },
  password: {
    type: String,
    required: [true, 'Password is required']
  },
  url: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    default: ''
  },
  tags: {
    type: [String],
    default: [],
    index: true
  },
  isFavorite: {
    type: Boolean,
    default: false,
    index: true
  },
  strength: {
    type: Number,
    min: 0,
    max: 4,
    default: 0
  },
  passwordHistory: {
    type: [passwordHistorySchema],
    default: [],
    max: 10
  }
}, { timestamps: true });

module.exports = mongoose.model('VaultEntry', vaultEntrySchema);