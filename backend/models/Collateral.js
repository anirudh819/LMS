const mongoose = require('mongoose');

const collateralSchema = new mongoose.Schema({
  collateralId: {
    type: String,
    required: true,
    unique: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  loanApplicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LoanApplication'
  },
  loanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Loan'
  },
  // Mutual Fund Details
  mutualFund: {
    fundName: {
      type: String,
      required: true
    },
    fundHouse: {
      type: String,
      required: true
    },
    schemeCode: {
      type: String,
      required: true
    },
    folioNumber: {
      type: String,
      required: true
    },
    isin: {
      type: String,
      required: true
    },
    fundType: {
      type: String,
      enum: ['EQUITY', 'DEBT', 'HYBRID', 'LIQUID', 'ELSS', 'INDEX'],
      required: true
    },
    units: {
      type: Number,
      required: true,
      min: 0
    },
    navAtPledge: {
      type: Number,
      required: true
    },
    currentNav: {
      type: Number,
      required: true
    },
    valueAtPledge: {
      type: Number,
      required: true
    },
    currentValue: {
      type: Number,
      required: true
    }
  },
  lienStatus: {
    type: String,
    enum: ['PENDING', 'MARKED', 'RELEASED', 'INVOKED'],
    default: 'PENDING'
  },
  lienMarkDate: {
    type: Date
  },
  lienReferenceNumber: {
    type: String
  },
  pledgePercentage: {
    type: Number,
    default: 100,
    min: 0,
    max: 100
  },
  ltv: {
    type: Number,
    required: true
  },
  eligibleLoanAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'RELEASED', 'LIQUIDATED', 'PARTIALLY_RELEASED'],
    default: 'ACTIVE'
  },
  // Audit trail
  navHistory: [{
    nav: Number,
    value: Number,
    recordedAt: { type: Date, default: Date.now }
  }],
  marginCallTriggered: {
    type: Boolean,
    default: false
  },
  marginCallDate: Date,
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Generate collateral ID before saving
collateralSchema.pre('save', async function(next) {
  if (!this.collateralId) {
    const count = await this.constructor.countDocuments();
    this.collateralId = `COL${String(count + 1).padStart(8, '0')}`;
  }
  next();
});

// Calculate current value and eligible loan amount
collateralSchema.methods.updateValuation = function(newNav) {
  this.mutualFund.currentNav = newNav;
  this.mutualFund.currentValue = this.mutualFund.units * newNav;
  this.eligibleLoanAmount = this.mutualFund.currentValue * (this.ltv / 100);
  
  // Add to nav history
  this.navHistory.push({
    nav: newNav,
    value: this.mutualFund.currentValue,
    recordedAt: new Date()
  });
  
  return this;
};

// Check if margin call is needed (if value drops below threshold)
collateralSchema.methods.checkMarginCall = function(loanOutstanding, marginThreshold = 0.8) {
  const coverageRatio = this.mutualFund.currentValue / loanOutstanding;
  if (coverageRatio < marginThreshold) {
    this.marginCallTriggered = true;
    this.marginCallDate = new Date();
    return true;
  }
  return false;
};

// Indexes
collateralSchema.index({ customerId: 1, status: 1 });
collateralSchema.index({ loanId: 1 });
collateralSchema.index({ 'mutualFund.folioNumber': 1 });

module.exports = mongoose.model('Collateral', collateralSchema);

