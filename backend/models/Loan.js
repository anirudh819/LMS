const mongoose = require('mongoose');

const loanSchema = new mongoose.Schema({
  loanId: {
    type: String,
    unique: true,
    sparse: true  // Allows null values while maintaining uniqueness
  },
  applicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LoanApplication',
    required: true
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
  // Loan Details
  principalAmount: {
    type: Number,
    required: true
  },
  interestRate: {
    type: Number,
    required: true
  },
  tenureMonths: {
    type: Number,
    required: true
  },
  emiAmount: {
    type: Number,
    required: true
  },
  totalInterest: {
    type: Number,
    required: true
  },
  totalPayable: {
    type: Number,
    required: true
  },
  // Outstanding Details
  outstandingPrincipal: {
    type: Number,
    required: true
  },
  outstandingInterest: {
    type: Number,
    default: 0
  },
  totalOutstanding: {
    type: Number,
    required: true
  },
  // Collateral
  collaterals: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Collateral'
  }],
  totalCollateralValue: {
    type: Number,
    required: true
  },
  currentLtv: {
    type: Number,
    required: true
  },
  // Repayment Schedule
  repaymentSchedule: [{
    installmentNumber: Number,
    dueDate: Date,
    emiAmount: Number,
    principalComponent: Number,
    interestComponent: Number,
    outstandingAfter: Number,
    status: {
      type: String,
      enum: ['PENDING', 'PAID', 'OVERDUE', 'PARTIALLY_PAID'],
      default: 'PENDING'
    },
    paidAmount: { type: Number, default: 0 },
    paidDate: Date,
    paymentReferenceNumber: String
  }],
  // Payment History
  payments: [{
    paymentId: String,
    amount: Number,
    paymentDate: Date,
    paymentMode: {
      type: String,
      enum: ['NACH', 'UPI', 'NETBANKING', 'CHEQUE', 'CASH', 'NEFT', 'RTGS']
    },
    referenceNumber: String,
    installmentsCovered: [Number],
    status: {
      type: String,
      enum: ['SUCCESS', 'FAILED', 'PENDING', 'REVERSED'],
      default: 'SUCCESS'
    }
  }],
  // Loan Status
  status: {
    type: String,
    enum: [
      'ACTIVE',
      'CLOSED',
      'OVERDUE',
      'NPA',
      'WRITTEN_OFF',
      'SETTLED',
      'FORECLOSED'
    ],
    default: 'ACTIVE'
  },
  // Important Dates
  disbursementDate: {
    type: Date,
    required: true
  },
  firstEmiDate: {
    type: Date,
    required: true
  },
  lastEmiDate: {
    type: Date,
    required: true
  },
  closureDate: Date,
  // Overdue Details
  daysOverdue: {
    type: Number,
    default: 0
  },
  overdueAmount: {
    type: Number,
    default: 0
  },
  penaltyAmount: {
    type: Number,
    default: 0
  },
  // NACH Details
  nachMandateId: String,
  nachStatus: {
    type: String,
    enum: ['PENDING', 'ACTIVE', 'CANCELLED', 'FAILED'],
    default: 'PENDING'
  },
  // Margin Call
  marginCallStatus: {
    type: String,
    enum: ['NONE', 'TRIGGERED', 'RESOLVED', 'LIQUIDATED'],
    default: 'NONE'
  },
  lastMarginCallDate: Date,
  // Prepayment
  prepaymentAmount: {
    type: Number,
    default: 0
  },
  prepaymentDate: Date,
  // Notes
  remarks: String,
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

// Generate loan ID before saving
loanSchema.pre('save', async function(next) {
  if (!this.loanId) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const count = await this.constructor.countDocuments();
    this.loanId = `LN${year}${month}${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Calculate EMI
loanSchema.statics.calculateEMI = function(principal, annualRate, tenureMonths) {
  const monthlyRate = annualRate / 12 / 100;
  if (monthlyRate === 0) return principal / tenureMonths;
  
  const emi = principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths) / 
              (Math.pow(1 + monthlyRate, tenureMonths) - 1);
  return Math.round(emi * 100) / 100;
};

// Generate repayment schedule
loanSchema.methods.generateRepaymentSchedule = function() {
  const schedule = [];
  let outstanding = this.principalAmount;
  const monthlyRate = this.interestRate / 12 / 100;
  const emi = this.emiAmount;
  
  let currentDate = new Date(this.firstEmiDate);
  
  for (let i = 1; i <= this.tenureMonths; i++) {
    const interestComponent = Math.round(outstanding * monthlyRate * 100) / 100;
    const principalComponent = Math.round((emi - interestComponent) * 100) / 100;
    outstanding = Math.max(0, Math.round((outstanding - principalComponent) * 100) / 100);
    
    schedule.push({
      installmentNumber: i,
      dueDate: new Date(currentDate),
      emiAmount: emi,
      principalComponent,
      interestComponent,
      outstandingAfter: outstanding,
      status: 'PENDING'
    });
    
    // Move to next month
    currentDate.setMonth(currentDate.getMonth() + 1);
  }
  
  this.repaymentSchedule = schedule;
  return schedule;
};

// Update LTV
loanSchema.methods.updateLtv = function(newCollateralValue) {
  this.totalCollateralValue = newCollateralValue;
  this.currentLtv = (this.totalOutstanding / newCollateralValue) * 100;
  return this.currentLtv;
};

// Indexes
loanSchema.index({ loanId: 1, status: 1 });
loanSchema.index({ customerId: 1 });
loanSchema.index({ status: 1, daysOverdue: -1 });

module.exports = mongoose.model('Loan', loanSchema);

