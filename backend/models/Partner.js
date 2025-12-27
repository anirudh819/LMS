const mongoose = require('mongoose');
const crypto = require('crypto');

const partnerSchema = new mongoose.Schema({
  partnerId: {
    type: String,
    unique: true,
    sparse: true,
    uppercase: true
  },
  partnerName: {
    type: String,
    required: true,
    trim: true
  },
  companyName: {
    type: String,
    required: true
  },
  // Contact Information
  contactPerson: {
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    phone: {
      type: String,
      required: true
    },
    designation: String
  },
  // Address
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: {
      type: String,
      default: 'India'
    }
  },
  // API Credentials
  apiKey: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  apiSecret: {
    type: String,
    required: true
  },
  // Business Details
  businessType: {
    type: String,
    enum: ['NBFC', 'FINTECH', 'BANK', 'AGGREGATOR', 'BROKER', 'OTHER'],
    required: true
  },
  gstNumber: String,
  panNumber: String,
  // API Access Configuration
  status: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING_APPROVAL'],
    default: 'PENDING_APPROVAL'
  },
  permissions: {
    canCreateApplications: {
      type: Boolean,
      default: true
    },
    canViewApplications: {
      type: Boolean,
      default: true
    },
    canUpdateApplications: {
      type: Boolean,
      default: false
    },
    canViewCustomers: {
      type: Boolean,
      default: true
    },
    canCreateCustomers: {
      type: Boolean,
      default: true
    }
  },
  // Rate Limits
  rateLimit: {
    requestsPerMinute: {
      type: Number,
      default: 60
    },
    requestsPerDay: {
      type: Number,
      default: 10000
    }
  },
  // Commission Structure
  commission: {
    type: {
      type: String,
      enum: ['PERCENTAGE', 'FLAT', 'TIERED'],
      default: 'PERCENTAGE'
    },
    value: {
      type: Number,
      default: 0
    },
    currency: {
      type: String,
      default: 'INR'
    }
  },
  // Usage Statistics
  statistics: {
    totalApplications: {
      type: Number,
      default: 0
    },
    approvedApplications: {
      type: Number,
      default: 0
    },
    totalDisbursed: {
      type: Number,
      default: 0
    },
    lastApiCall: Date,
    apiCallsToday: {
      type: Number,
      default: 0
    },
    apiCallsThisMonth: {
      type: Number,
      default: 0
    }
  },
  // Contract Details
  contractStartDate: Date,
  contractEndDate: Date,
  // IP Whitelist (optional security feature)
  ipWhitelist: [{
    type: String
  }],
  // Webhook Configuration
  webhookUrl: {
    type: String,
    trim: true
  },
  webhookEvents: [{
    type: String,
    enum: [
      'APPLICATION_CREATED',
      'APPLICATION_APPROVED',
      'APPLICATION_REJECTED',
      'LOAN_DISBURSED',
      'PAYMENT_RECEIVED'
    ]
  }],
  // Notes and Remarks
  notes: String,
  // Audit Fields
  createdBy: String,
  updatedBy: String,
  approvedBy: String,
  approvedAt: Date
}, {
  timestamps: true
});

// Generate unique Partner ID before validation
partnerSchema.pre('validate', async function(next) {
  if (this.isNew && !this.partnerId) {
    try {
      const count = await mongoose.model('Partner').countDocuments();
      this.partnerId = `PARTNER${String(count + 1).padStart(4, '0')}`;
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

// Method to generate API credentials
partnerSchema.methods.generateApiCredentials = function() {
  // Generate API Key: PARTNER{ID}_random32chars
  const randomKey = crypto.randomBytes(16).toString('hex');
  this.apiKey = `${this.partnerId}_${randomKey}`;
  
  // Generate API Secret: 64 character random string
  this.apiSecret = crypto.randomBytes(32).toString('hex');
  
  return {
    apiKey: this.apiKey,
    apiSecret: this.apiSecret
  };
};

// Method to verify API secret
partnerSchema.methods.verifyApiSecret = function(secret) {
  return this.apiSecret === secret;
};

// Method to check if partner can make API call (rate limiting check)
partnerSchema.methods.canMakeApiCall = function() {
  if (this.status !== 'ACTIVE') {
    return { allowed: false, reason: 'Partner is not active' };
  }
  
  if (this.rateLimit.requestsPerDay && this.statistics.apiCallsToday >= this.rateLimit.requestsPerDay) {
    return { allowed: false, reason: 'Daily rate limit exceeded' };
  }
  
  return { allowed: true };
};

// Method to increment API usage statistics
partnerSchema.methods.incrementApiUsage = async function() {
  this.statistics.apiCallsToday += 1;
  this.statistics.apiCallsThisMonth += 1;
  this.statistics.lastApiCall = new Date();
  await this.save();
};

// Method to regenerate API credentials (for security)
partnerSchema.methods.regenerateCredentials = function() {
  return this.generateApiCredentials();
};

// Hide sensitive fields from JSON response
partnerSchema.methods.toJSON = function() {
  const partner = this.toObject();
  
  // Only show partial API secret for security
  if (partner.apiSecret) {
    partner.apiSecret = `${partner.apiSecret.substring(0, 8)}...`;
  }
  
  return partner;
};

// Indexes for performance
partnerSchema.index({ apiKey: 1 });
partnerSchema.index({ status: 1 });
partnerSchema.index({ 'contactPerson.email': 1 });
partnerSchema.index({ createdAt: -1 });

const Partner = mongoose.model('Partner', partnerSchema);

module.exports = Partner;

