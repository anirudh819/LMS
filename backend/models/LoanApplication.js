const mongoose = require('mongoose');

const loanApplicationSchema = new mongoose.Schema({
  applicationId: {
    type: String,
    unique: true,
    sparse: true  // Allows null values while maintaining uniqueness
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  loanProductId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LoanProduct',
    required: true
  },
  // Application Details
  requestedAmount: {
    type: Number,
    required: true,
    min: 0
  },
  approvedAmount: {
    type: Number,
    min: 0
  },
  requestedTenureMonths: {
    type: Number,
    required: true,
    min: 1
  },
  approvedTenureMonths: {
    type: Number,
    min: 1
  },
  interestRate: {
    type: Number
  },
  purpose: {
    type: String,
    required: true
  },
  // Collateral Information
  collaterals: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Collateral'
  }],
  totalCollateralValue: {
    type: Number,
    default: 0
  },
  eligibleLoanAmount: {
    type: Number,
    default: 0
  },
  // Application Status
  status: {
    type: String,
    enum: [
      'DRAFT',
      'SUBMITTED',
      'UNDER_REVIEW',
      'DOCUMENTS_PENDING',
      'COLLATERAL_VERIFICATION',
      'CREDIT_CHECK',
      'APPROVED',
      'REJECTED',
      'DISBURSED',
      'CANCELLED',
      'EXPIRED'
    ],
    default: 'DRAFT'
  },
  // Status History
  statusHistory: [{
    status: String,
    changedAt: { type: Date, default: Date.now },
    changedBy: String,
    remarks: String
  }],
  // Document Verification
  documents: [{
    documentType: {
      type: String,
      enum: ['PAN', 'AADHAR', 'ADDRESS_PROOF', 'BANK_STATEMENT', 'MF_STATEMENT', 'OTHER']
    },
    documentUrl: String,
    verificationStatus: {
      type: String,
      enum: ['PENDING', 'VERIFIED', 'REJECTED'],
      default: 'PENDING'
    },
    uploadedAt: { type: Date, default: Date.now }
  }],
  // Credit Assessment
  creditScore: {
    type: Number
  },
  creditCheckStatus: {
    type: String,
    enum: ['PENDING', 'COMPLETED', 'FAILED'],
    default: 'PENDING'
  },
  creditCheckRemarks: String,
  // Approval Details
  approvalDate: Date,
  approvedBy: String,
  rejectionReason: String,
  // Disbursement Details
  disbursementDate: Date,
  disbursementAmount: Number,
  disbursementAccountNumber: String,
  disbursementIfsc: String,
  disbursementReferenceNumber: String,
  // Processing Fee
  processingFee: {
    type: Number,
    default: 0
  },
  processingFeeStatus: {
    type: String,
    enum: ['PENDING', 'PAID', 'WAIVED'],
    default: 'PENDING'
  },
  // API Source (for fintech partners)
  source: {
    type: String,
    enum: ['WEB', 'MOBILE', 'API'],
    default: 'WEB'
  },
  sourcePartnerId: String,
  apiRequestId: String,
  // Timestamps
  submittedAt: Date,
  expiresAt: Date,
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

// Generate application ID before saving
loanApplicationSchema.pre('save', async function(next) {
  if (!this.applicationId) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const count = await this.constructor.countDocuments();
    this.applicationId = `LA${year}${month}${String(count + 1).padStart(6, '0')}`;
  }
  
  // Add to status history if status changed
  if (this.isModified('status')) {
    this.statusHistory.push({
      status: this.status,
      changedAt: new Date(),
      remarks: 'Status updated'
    });
  }
  
  next();
});

// Calculate eligible loan amount based on collaterals
loanApplicationSchema.methods.calculateEligibility = async function() {
  await this.populate('collaterals');
  
  let totalValue = 0;
  let eligibleAmount = 0;
  
  for (const collateral of this.collaterals) {
    totalValue += collateral.mutualFund.currentValue;
    eligibleAmount += collateral.eligibleLoanAmount;
  }
  
  this.totalCollateralValue = totalValue;
  this.eligibleLoanAmount = eligibleAmount;
  
  return { totalValue, eligibleAmount };
};

// Indexes
loanApplicationSchema.index({ applicationId: 1, status: 1 });
loanApplicationSchema.index({ customerId: 1, createdAt: -1 });
loanApplicationSchema.index({ source: 1, sourcePartnerId: 1 });

module.exports = mongoose.model('LoanApplication', loanApplicationSchema);

