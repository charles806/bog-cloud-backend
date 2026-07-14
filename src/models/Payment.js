const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  userEmail: {
    type: String,
    required: true,
    index: true
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'NGN',
    enum: ['NGN', 'USD', 'GHS', 'KES', 'ZAR', 'EUR', 'GBP']
  },
  plan: {
    type: String,
    required: true,
    enum: ['individual', 'enterprise', 'pro', 'trial']
  },
  planName: {
    type: String,
    enum: ['Individual', 'Pro', 'Enterprise', 'Trial']
  },
  interval: {
    type: String,
    enum: ['monthly', 'yearly', 'one_time'],
    default: 'monthly'
  },
  paymentMethod: {
    type: String,
    enum: ['card', 'bank_transfer', 'paystack', 'stripe', 'flutterwave', 'bank'],
    default: 'card'
  },
  paymentGateway: {
    type: String,
    enum: ['paystack', 'stripe', 'flutterwave', 'none'],
    default: 'paystack'
  },
  transactionId: {
    type: String,
    unique: true,
    sparse: true,
    index: true
  },
  reference: {
    type: String,
    unique: true,
    sparse: true,
    index: true
  },
  subscriptionId: {
    type: String,
    default: null,
    index: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled', 'expired'],
    default: 'pending'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  gatewayResponse: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  paidAt: {
    type: Date,
    default: null
  },
  expiryDate: {
    type: Date,
    default: null
  },
  billingEmail: {
    type: String,
    default: null
  },
  billingName: {
    type: String,
    default: null
  },
  billingAddress: {
    street: { type: String, default: null },
    city: { type: String, default: null },
    state: { type: String, default: null },
    country: { type: String, default: null },
    postalCode: { type: String, default: null }
  },
  invoiceUrl: {
    type: String,
    default: null
  },
  receiptUrl: {
    type: String,
    default: null
  }
}, { timestamps: true });

// Indexes
paymentSchema.index({ createdAt: -1 });
paymentSchema.index({ userId: 1, createdAt: -1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ plan: 1 });

// Check if user has active subscription
paymentSchema.statics.hasActiveSubscription = async function(userId) {
  const payment = await this.findOne({
    userId,
    status: 'completed',
    expiryDate: { $gt: new Date() }
  }).sort({ createdAt: -1 });
  
  return !!payment;
};

// Get user's current plan
paymentSchema.statics.getUserPlan = async function(userId) {
  const payment = await this.findOne({
    userId,
    status: 'completed',
    expiryDate: { $gt: new Date() }
  }).sort({ createdAt: -1 });
  
  return payment ? payment.plan : 'trial';
};

// Get total revenue
paymentSchema.statics.getTotalRevenue = async function(fromDate, toDate) {
  const match = { status: 'completed' };
  if (fromDate) match.createdAt = { $gte: new Date(fromDate) };
  if (toDate) match.createdAt = { ...match.createdAt, $lte: new Date(toDate) };
  
  const result = await this.aggregate([
    { $match: match },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);
  
  return result[0]?.total || 0;
};

// Get revenue by plan
paymentSchema.statics.getRevenueByPlan = async function() {
  return await this.aggregate([
    { $match: { status: 'completed' } },
    { $group: { _id: '$plan', total: { $sum: '$amount' }, count: { $sum: 1 } } },
    { $sort: { total: -1 } }
  ]);
};

module.exports = mongoose.model('Payment', paymentSchema);