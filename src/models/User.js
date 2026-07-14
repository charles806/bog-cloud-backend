const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address'
      ]
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 8
    },
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      maxlength: 50
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      maxlength: 50
    },
    accountType: {
      type: String,
      enum: ['individual', 'enterprise', 'trial'],
      default: 'trial'
    },
    role: {
      type: String,
      enum: ['user', 'admin', 'super_admin'],
      default: 'user'
    },
    resetToken: {
      type: String,
  default: null
},
resetTokenExpires: {
  type: Date,
  default: null
},
    mfaEnabled: {
      type: Boolean,
      default: false
    },
    mfaSecret: {
      type: String,
      default: null
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    isActive: {
      type: Boolean,
      default: true
    },
    suspendedAt: {
      type: Date,
      default: null
    },
    biometricKey: {
  type: String,
  default: null
},
pushTokens: {
  type: [{
    token: { type: String, required: true },
    deviceType: { type: String, enum: ['ios', 'android', 'web'], default: 'mobile' },
    createdAt: { type: Date, default: Date.now }
  }],
  default: []
},
    suspendedReason: {
      type: String,
      default: ''
    },
    deletedAt: {
      type: Date,
      default: null
    },
    isEmailVerified: {
      type: Boolean,
      default: false
    },
    storageQuota: {
      type: Number,
      default: 2 * 1024 * 1024 * 1024 // 2GB
    },
    storageUsed: {
      type: Number,
      default: 0
    },
    devices: {
      type: [{
        deviceId: { type: String, required: true },
        deviceName: { type: String, required: true },
        lastActive: { type: Date, default: Date.now },
        refreshToken: { type: String }
      }],
      default: []
    },
    refreshTokens: {
      type: [{
        token: { type: String, required: true },
        expiresAt: { type: Date, required: true },
        deviceId: { type: String }
      }],
      default: []
    },
    lastLogin: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

// Pre-save hook to hash password
userSchema.pre('save', async function () {
  if (!this.isModified('passwordHash')) return;
  const salt = await bcrypt.genSalt(parseInt(process.env.SALT_ROUNDS) || 12);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.passwordHash);
};

userSchema.methods.addDevice = function (deviceId, deviceName, refreshToken) {
  if (!this.devices) this.devices = [];
  const existingDevice = this.devices.find(d => d.deviceId === deviceId);
  if (existingDevice) {
    existingDevice.lastActive = Date.now();
    existingDevice.refreshToken = refreshToken;
  } else {
    this.devices.push({ deviceId, deviceName, refreshToken });
  }
  return this.save();
};

userSchema.methods.removeDevice = function (deviceId) {
  if (!this.devices) this.devices = [];
  if (!this.refreshTokens) this.refreshTokens = [];
  this.devices = this.devices.filter(d => d.deviceId !== deviceId);
  this.refreshTokens = this.refreshTokens.filter(t => t.deviceId !== deviceId);
  return this.save();
};

userSchema.methods.addRefreshToken = function (token, expiresAt, deviceId) {
  if (!this.refreshTokens) this.refreshTokens = [];
  this.refreshTokens.push({ token, expiresAt, deviceId });
  return this.save();
};

userSchema.methods.toPublicJSON = function () {
  return {
    id: this._id,
    email: this.email,
    firstName: this.firstName,
    lastName: this.lastName,
    accountType: this.accountType,
    role: this.role,
    mfaEnabled: this.mfaEnabled,
    isActive: this.isActive,
    isEmailVerified: this.isEmailVerified,  
    suspendedAt: this.suspendedAt,
    assignedBy: this.assignedBy,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

module.exports = mongoose.model('User', userSchema);