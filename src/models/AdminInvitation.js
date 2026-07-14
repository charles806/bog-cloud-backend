const mongoose = require('mongoose');

const adminInvitationSchema = new mongoose.Schema({
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  invitedByEmail: {
    type: String,
    required: true
  },
  invitedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  invitedUserEmail: {
    type: String,
    required: true
  },
  token: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'expired', 'revoked'],
    default: 'pending'
  },
  expiresAt: {
    type: Date,
    required: true
  },
  respondedAt: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Auto delete expired invitations
adminInvitationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('AdminInvitation', adminInvitationSchema);