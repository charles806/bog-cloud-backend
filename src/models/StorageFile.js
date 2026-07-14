const mongoose = require('mongoose');

const fileVersionSchema = new mongoose.Schema({
  fileName: { type: String },
  originalName: { type: String },
  fileSize: { type: Number },
  mimeType: { type: String },
  storagePath: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const storageFileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  folderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StorageFolder',
    default: null,
    index: true
  },
  fileName: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  originalName: {
    type: String,
    required: true,
    trim: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  fileHash: {
    type: String,
    index: true
  },
  storagePath: {
    type: String,
    required: true
  },
  previewPath: {
    type: String,
    default: null
  },
  tags: {
    type: [String],
    default: []
  },
  isStarred: {
    type: Boolean,
    default: false
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  shareToken: {
    type: String,
    default: null,
    index: true
  },
  shareExpiry: {
    type: Date,
    default: null
  },
  sharePassword: {
    type: String,
    default: null
  },
  versions: {
    type: [fileVersionSchema],
    default: [],
    max: 10
  }
}, { timestamps: true });

module.exports = mongoose.model('StorageFile', storageFileSchema);