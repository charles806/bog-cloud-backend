const mongoose = require('mongoose');

const vaultFolderSchema = new mongoose.Schema({
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
    ref: 'VaultFolder',
    default: null,
    index: true
  },
  path: {
    type: String,
    default: ''
  }
}, { timestamps: true });

vaultFolderSchema.pre('save', async function(next) {
  if (this.parentFolderId) {
    const parent = await this.constructor.findById(this.parentFolderId);
    if (parent) {
      this.path = parent.path ? `${parent.path}/${parent.name}` : parent.name;
    }
  } else {
    this.path = '';
  }
  // next();
});

module.exports = mongoose.model('VaultFolder', vaultFolderSchema);