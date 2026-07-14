const mongoose = require('mongoose');

const deploymentSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  appName: {
    type: String,
    required: true,
    trim: true
  },
  version: {
    type: String,
    default: '1.0.0'
  },
  status: {
    type: String,
    enum: ['pending', 'building', 'deploying', 'running', 'failed', 'stopped', 'rolled_back'],
    default: 'pending'
  },
  dockerImage: {
    type: String,
    default: null
  },
  gitRepo: {
    type: String,
    default: null
  },
  gitBranch: {
    type: String,
    default: 'main'
  },
  gitCommit: {
    type: String,
    default: null
  },
  environment: {
    type: String,
    enum: ['development', 'staging', 'production'],
    default: 'development'
  },
  runtime: {
    type: String,
    enum: ['nodejs', 'python', 'go', 'java', 'php', 'ruby', 'static'],
    default: 'nodejs'
  },
  port: {
    type: Number,
    default: 3000
  },
  customDomain: {
    type: String,
    default: null
  },
  sslEnabled: {
    type: Boolean,
    default: false
  },
  sslCertificate: {
    type: String,
    default: null
  },
  environmentVariables: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  resources: {
    cpu: { type: String, default: '0.5' },
    memory: { type: String, default: '512Mi' },
    replicas: { type: Number, default: 1 }
  },
  autoScaling: {
    enabled: { type: Boolean, default: false },
    minReplicas: { type: Number, default: 1 },
    maxReplicas: { type: Number, default: 5 },
    cpuThreshold: { type: Number, default: 70 },
    memoryThreshold: { type: Number, default: 80 }
  },
  buildLogs: {
    type: [String],
    default: []
  },
  runtimeLogs: {
    type: [String],
    default: []
  },
  deployedAt: {
    type: Date,
    default: null
  },
  lastActivityAt: {
    type: Date,
    default: null
  },
  deployedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  previousVersion: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Deployment',
    default: null
  }
}, { timestamps: true });

deploymentSchema.index({ projectId: 1, createdAt: -1 });
deploymentSchema.index({ status: 1 });

deploymentSchema.methods.addBuildLog = function(log) {
  this.buildLogs.push(`[${new Date().toISOString()}] ${log}`);
  if (this.buildLogs.length > 500) {
    this.buildLogs = this.buildLogs.slice(-500);
  }
  return this.save();
};

deploymentSchema.methods.addRuntimeLog = function(log) {
  this.runtimeLogs.push(`[${new Date().toISOString()}] ${log}`);
  if (this.runtimeLogs.length > 500) {
    this.runtimeLogs = this.runtimeLogs.slice(-500);
  }
  return this.save();
};

module.exports = mongoose.model('Deployment', deploymentSchema);