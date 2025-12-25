const mongoose = require('mongoose');

const loanProductSchema = new mongoose.Schema({
  productCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  productName: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  interestRate: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  interestType: {
    type: String,
    enum: ['FIXED', 'FLOATING', 'REDUCING_BALANCE'],
    default: 'REDUCING_BALANCE'
  },
  minLoanAmount: {
    type: Number,
    required: true,
    min: 0
  },
  maxLoanAmount: {
    type: Number,
    required: true
  },
  minTenureMonths: {
    type: Number,
    required: true,
    min: 1
  },
  maxTenureMonths: {
    type: Number,
    required: true
  },
  processingFeePercent: {
    type: Number,
    default: 1,
    min: 0,
    max: 10
  },
  ltv: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    default: 50
  },
  eligibleMutualFundTypes: [{
    type: String,
    enum: ['EQUITY', 'DEBT', 'HYBRID', 'LIQUID', 'ELSS', 'INDEX']
  }],
  prepaymentChargePercent: {
    type: Number,
    default: 0,
    min: 0
  },
  latePaymentChargePercent: {
    type: Number,
    default: 2,
    min: 0
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE', 'DISCONTINUED'],
    default: 'ACTIVE'
  },
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

// Index for faster queries
loanProductSchema.index({ status: 1, productCode: 1 });

module.exports = mongoose.model('LoanProduct', loanProductSchema);

