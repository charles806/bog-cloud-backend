const mongoose = require('mongoose');

const storageFolderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: [true, 'Folder name is required'],
    trim: true
  },
  parentFolderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StorageFolder',
    default: null,
    index: true
  },
  path: {
    type: String,
    default: ''
  }
}, { timestamps: true });

// Auto-generate folder path before saving
storageFolderSchema.pre('save', async function(next) {
  if (this.parentFolderId) {
    const parent = await this.constructor.findById(this.parentFolderId);
    if (parent) {
      this.path = parent.path ? `${parent.path}/${parent.name}` : parent.name;
    }
  } else {
    this.path = '';
  }
  next();
});

// Method to get full folder path
storageFolderSchema.methods.getFullPath = async function() {
  if (!this.parentFolderId) {
    return this.name;
  }
  const parent = await this.constructor.findById(this.parentFolderId);
  if (parent) {
    const parentPath = await parent.getFullPath();
    return `${parentPath}/${this.name}`;
  }
  return this.name;
};

// Method to check if folder has children
storageFolderSchema.methods.hasChildren = async function() {
  const count = await this.constructor.countDocuments({
    parentFolderId: this._id
  });
  return count > 0;
};

// Method to get all sub-folders
storageFolderSchema.methods.getSubFolders = async function() {
  return await this.constructor.find({
    parentFolderId: this._id
  }).sort({ name: 1 });
};

module.exports = mongoose.model('StorageFolder', storageFolderSchema);