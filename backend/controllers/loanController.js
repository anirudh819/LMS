const { Loan, Collateral } = require('../models');

/**
 * @desc    Get all active/ongoing loans
 * @route   GET /api/loans
 * @access  Private
 */
const getAllLoans = async (req, res, next) => {
  try {
    const { 
      status, 
      customerId,
      marginCallStatus,
      page = 1, 
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    const query = {};
    if (status) {
      if (status.includes(',')) {
        query.status = { $in: status.split(',') };
      } else {
        query.status = status;
      }
    }
    if (customerId) query.customerId = customerId;
    if (marginCallStatus) query.marginCallStatus = marginCallStatus;

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const loans = await Loan.find(query)
      .populate('customerId', 'customerId firstName lastName email phone')
      .populate('loanProductId', 'productCode productName')
      .populate('applicationId', 'applicationId')
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Loan.countDocuments(query);

    // Get summary statistics
    const summary = await Loan.aggregate([
      { $match: { status: 'ACTIVE' } },
      {
        $group: {
          _id: null,
          totalLoans: { $sum: 1 },
          totalDisbursed: { $sum: '$principalAmount' },
          totalOutstanding: { $sum: '$totalOutstanding' },
          totalCollateralValue: { $sum: '$totalCollateralValue' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        loans,
        summary: summary[0] || {
          totalLoans: 0,
          totalDisbursed: 0,
          totalOutstanding: 0,
          totalCollateralValue: 0
        },
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get loan by ID with full details
 * @route   GET /api/loans/:id
 * @access  Private
 */
const getLoanById = async (req, res, next) => {
  try {
    const loan = await Loan.findById(req.params.id)
      .populate('customerId')
      .populate('loanProductId')
      .populate('applicationId')
      .populate('collaterals');

    if (!loan) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Loan not found'
        }
      });
    }

    res.json({
      success: true,
      data: loan
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get loan repayment schedule
 * @route   GET /api/loans/:id/schedule
 * @access  Private
 */
const getRepaymentSchedule = async (req, res, next) => {
  try {
    const loan = await Loan.findById(req.params.id);

    if (!loan) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Loan not found'
        }
      });
    }

    const { status } = req.query;
    let schedule = loan.repaymentSchedule;

    if (status) {
      schedule = schedule.filter(s => s.status === status);
    }

    res.json({
      success: true,
      data: {
        loanId: loan.loanId,
        schedule,
        summary: {
          totalInstallments: loan.repaymentSchedule.length,
          paidInstallments: loan.repaymentSchedule.filter(s => s.status === 'PAID').length,
          pendingInstallments: loan.repaymentSchedule.filter(s => s.status === 'PENDING').length,
          overdueInstallments: loan.repaymentSchedule.filter(s => s.status === 'OVERDUE').length
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Record payment for a loan
 * @route   POST /api/loans/:id/payments
 * @access  Private
 */
const recordPayment = async (req, res, next) => {
  try {
    const { amount, paymentMode, referenceNumber, paymentDate } = req.body;

    const loan = await Loan.findById(req.params.id);

    if (!loan) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Loan not found'
        }
      });
    }

    if (loan.status !== 'ACTIVE' && loan.status !== 'OVERDUE') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATUS',
          message: 'Cannot record payment for this loan status'
        }
      });
    }

    // Find pending/overdue installments
    let remainingAmount = amount;
    const installmentsCovered = [];

    for (const installment of loan.repaymentSchedule) {
      if (remainingAmount <= 0) break;
      if (installment.status === 'PAID') continue;

      const dueAmount = installment.emiAmount - installment.paidAmount;

      if (remainingAmount >= dueAmount) {
        installment.paidAmount = installment.emiAmount;
        installment.status = 'PAID';
        installment.paidDate = paymentDate || new Date();
        installment.paymentReferenceNumber = referenceNumber;
        remainingAmount -= dueAmount;
        installmentsCovered.push(installment.installmentNumber);
      } else {
        installment.paidAmount += remainingAmount;
        installment.status = 'PARTIALLY_PAID';
        remainingAmount = 0;
        installmentsCovered.push(installment.installmentNumber);
      }
    }

    // Add payment record
    const payment = {
      paymentId: `PAY${Date.now()}`,
      amount,
      paymentDate: paymentDate || new Date(),
      paymentMode,
      referenceNumber,
      installmentsCovered,
      status: 'SUCCESS'
    };
    loan.payments.push(payment);

    // Update outstanding amounts
    const totalPaid = loan.payments
      .filter(p => p.status === 'SUCCESS')
      .reduce((sum, p) => sum + p.amount, 0);
    
    loan.outstandingPrincipal = Math.max(0, loan.principalAmount - (totalPaid - loan.totalInterest * (totalPaid / loan.totalPayable)));
    loan.totalOutstanding = loan.totalPayable - totalPaid;

    // Update LTV
    if (loan.totalCollateralValue > 0) {
      loan.currentLtv = (loan.totalOutstanding / loan.totalCollateralValue) * 100;
    }

    // Check if loan is fully paid
    if (loan.totalOutstanding <= 0) {
      loan.status = 'CLOSED';
      loan.closureDate = new Date();
    }

    // Update overdue status
    const hasOverdue = loan.repaymentSchedule.some(s => s.status === 'OVERDUE');
    if (!hasOverdue && loan.status === 'OVERDUE') {
      loan.status = 'ACTIVE';
      loan.daysOverdue = 0;
      loan.overdueAmount = 0;
    }

    await loan.save();

    res.json({
      success: true,
      message: 'Payment recorded successfully',
      data: {
        payment,
        updatedLoan: {
          totalOutstanding: loan.totalOutstanding,
          outstandingPrincipal: loan.outstandingPrincipal,
          currentLtv: loan.currentLtv,
          status: loan.status
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get payment history
 * @route   GET /api/loans/:id/payments
 * @access  Private
 */
const getPaymentHistory = async (req, res, next) => {
  try {
    const loan = await Loan.findById(req.params.id);

    if (!loan) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Loan not found'
        }
      });
    }

    const totalPaid = loan.payments
      .filter(p => p.status === 'SUCCESS')
      .reduce((sum, p) => sum + p.amount, 0);

    res.json({
      success: true,
      data: {
        loanId: loan.loanId,
        payments: loan.payments,
        summary: {
          totalPayments: loan.payments.length,
          totalAmountPaid: totalPaid,
          totalOutstanding: loan.totalOutstanding
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Prepay loan
 * @route   POST /api/loans/:id/prepay
 * @access  Private
 */
const prepayLoan = async (req, res, next) => {
  try {
    const { amount, paymentMode, referenceNumber } = req.body;

    const loan = await Loan.findById(req.params.id)
      .populate('loanProductId');

    if (!loan) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Loan not found'
        }
      });
    }

    if (loan.status !== 'ACTIVE') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATUS',
          message: 'Loan must be active for prepayment'
        }
      });
    }

    // Calculate prepayment charges
    const prepaymentCharge = (amount * loan.loanProductId.prepaymentChargePercent) / 100;
    const effectivePrepayment = amount - prepaymentCharge;

    // Update outstanding
    loan.outstandingPrincipal = Math.max(0, loan.outstandingPrincipal - effectivePrepayment);
    loan.totalOutstanding = Math.max(0, loan.totalOutstanding - effectivePrepayment);
    loan.prepaymentAmount = (loan.prepaymentAmount || 0) + amount;
    loan.prepaymentDate = new Date();

    // Add payment record
    loan.payments.push({
      paymentId: `PREP${Date.now()}`,
      amount,
      paymentDate: new Date(),
      paymentMode,
      referenceNumber,
      installmentsCovered: [],
      status: 'SUCCESS'
    });

    // Check for foreclosure
    if (loan.totalOutstanding <= 0) {
      loan.status = 'FORECLOSED';
      loan.closureDate = new Date();
    }

    await loan.save();

    res.json({
      success: true,
      message: 'Prepayment processed successfully',
      data: {
        prepaymentAmount: amount,
        prepaymentCharge,
        effectivePrepayment,
        newOutstanding: loan.totalOutstanding,
        status: loan.status
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update loan overdue status (typically called by a scheduled job)
 * @route   PATCH /api/loans/:id/overdue
 * @access  Private
 */
const updateOverdueStatus = async (req, res, next) => {
  try {
    const loan = await Loan.findById(req.params.id);

    if (!loan) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Loan not found'
        }
      });
    }

    const today = new Date();
    let daysOverdue = 0;
    let overdueAmount = 0;

    // Check each installment
    for (const installment of loan.repaymentSchedule) {
      if (installment.status === 'PAID') continue;
      
      const dueDate = new Date(installment.dueDate);
      if (today > dueDate) {
        installment.status = 'OVERDUE';
        const daysDiff = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
        daysOverdue = Math.max(daysOverdue, daysDiff);
        overdueAmount += installment.emiAmount - installment.paidAmount;
      }
    }

    loan.daysOverdue = daysOverdue;
    loan.overdueAmount = overdueAmount;

    if (daysOverdue > 0) {
      loan.status = daysOverdue > 90 ? 'NPA' : 'OVERDUE';
    }

    await loan.save();

    res.json({
      success: true,
      data: {
        loanId: loan.loanId,
        daysOverdue,
        overdueAmount,
        status: loan.status
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get loans with margin call triggered
 * @route   GET /api/loans/margin-calls
 * @access  Private
 */
const getLoansWithMarginCalls = async (req, res, next) => {
  try {
    const loans = await Loan.find({
      status: 'ACTIVE',
      marginCallStatus: 'TRIGGERED'
    })
      .populate('customerId', 'customerId firstName lastName email phone')
      .populate('collaterals')
      .sort({ lastMarginCallDate: -1 });

    res.json({
      success: true,
      data: {
        count: loans.length,
        loans
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get loan portfolio summary
 * @route   GET /api/loans/summary
 * @access  Private
 */
const getPortfolioSummary = async (req, res, next) => {
  try {
    const statusSummary = await Loan.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalDisbursed: { $sum: '$principalAmount' },
          totalOutstanding: { $sum: '$totalOutstanding' }
        }
      }
    ]);

    const productSummary = await Loan.aggregate([
      {
        $group: {
          _id: '$loanProductId',
          count: { $sum: 1 },
          totalDisbursed: { $sum: '$principalAmount' },
          totalOutstanding: { $sum: '$totalOutstanding' }
        }
      },
      {
        $lookup: {
          from: 'loanproducts',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' }
    ]);

    const monthlyDisbursement = await Loan.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$disbursementDate' },
            month: { $month: '$disbursementDate' }
          },
          count: { $sum: 1 },
          totalDisbursed: { $sum: '$principalAmount' }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);

    res.json({
      success: true,
      data: {
        byStatus: statusSummary,
        byProduct: productSummary,
        monthlyTrend: monthlyDisbursement.reverse()
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllLoans,
  getLoanById,
  getRepaymentSchedule,
  recordPayment,
  getPaymentHistory,
  prepayLoan,
  updateOverdueStatus,
  getLoansWithMarginCalls,
  getPortfolioSummary
};

