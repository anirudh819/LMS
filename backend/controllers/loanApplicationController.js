const { LoanApplication, LoanProduct, Customer, Collateral, Loan } = require('../models');
const { v4: uuidv4 } = require('uuid');

/**
 * @desc    Get all loan applications
 * @route   GET /api/loan-applications
 * @access  Private
 */
const getAllLoanApplications = async (req, res, next) => {
  try {
    const { 
      status, 
      customerId, 
      source,
      page = 1, 
      limit = 10,
      startDate,
      endDate 
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
    if (source) query.source = source;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const applications = await LoanApplication.find(query)
      .populate('customerId', 'customerId firstName lastName email phone')
      .populate('loanProductId', 'productCode productName interestRate')
      .populate('collaterals')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await LoanApplication.countDocuments(query);

    // Get status counts
    const statusCounts = await LoanApplication.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        applications,
        statusCounts: statusCounts.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
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
 * @desc    Get loan application by ID
 * @route   GET /api/loan-applications/:id
 * @access  Private/API
 */
const getLoanApplicationById = async (req, res, next) => {
  try {
    const application = await LoanApplication.findById(req.params.id)
      .populate('customerId')
      .populate('loanProductId')
      .populate('collaterals');

    if (!application) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Loan application not found'
        }
      });
    }

    res.json({
      success: true,
      data: application
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new loan application
 * @route   POST /api/loan-applications
 * @access  Private/API (Important for fintech partners)
 */
const createLoanApplication = async (req, res, next) => {
  try {
    const {
      customerId,
      loanProductId,
      requestedAmount,
      requestedTenureMonths,
      purpose,
      collaterals: collateralData,
      source = 'WEB'
    } = req.body;

    // Verify customer exists
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'CUSTOMER_NOT_FOUND',
          message: 'Customer not found'
        }
      });
    }

    // Verify loan product exists and is active
    const loanProduct = await LoanProduct.findById(loanProductId);
    if (!loanProduct || loanProduct.status !== 'ACTIVE') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PRODUCT',
          message: 'Loan product not found or inactive'
        }
      });
    }

    // Validate loan amount
    if (requestedAmount < loanProduct.minLoanAmount || requestedAmount > loanProduct.maxLoanAmount) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_AMOUNT',
          message: `Loan amount must be between ${loanProduct.minLoanAmount} and ${loanProduct.maxLoanAmount}`
        }
      });
    }

    // Validate tenure
    if (requestedTenureMonths < loanProduct.minTenureMonths || requestedTenureMonths > loanProduct.maxTenureMonths) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_TENURE',
          message: `Tenure must be between ${loanProduct.minTenureMonths} and ${loanProduct.maxTenureMonths} months`
        }
      });
    }

    // Create collaterals if provided
    let collateralIds = [];
    let totalCollateralValue = 0;
    let eligibleLoanAmount = 0;

    if (collateralData && collateralData.length > 0) {
      for (const col of collateralData) {
        const valueAtPledge = col.units * col.navAtPledge;
        const currentValue = col.units * (col.currentNav || col.navAtPledge);
        const colEligibleAmount = currentValue * (loanProduct.ltv / 100);

        const collateral = await Collateral.create({
          customerId,
          mutualFund: {
            fundName: col.fundName,
            fundHouse: col.fundHouse,
            schemeCode: col.schemeCode,
            folioNumber: col.folioNumber,
            isin: col.isin,
            fundType: col.fundType,
            units: col.units,
            navAtPledge: col.navAtPledge,
            currentNav: col.currentNav || col.navAtPledge,
            valueAtPledge,
            currentValue
          },
          ltv: loanProduct.ltv,
          eligibleLoanAmount: colEligibleAmount
        });

        collateralIds.push(collateral._id);
        totalCollateralValue += currentValue;
        eligibleLoanAmount += colEligibleAmount;
      }
    }

    // Validate requested amount against eligible amount
    if (collateralIds.length > 0 && requestedAmount > eligibleLoanAmount) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_COLLATERAL',
          message: `Requested amount exceeds eligible loan amount of ${eligibleLoanAmount}`
        }
      });
    }

    // Calculate processing fee
    const processingFee = (requestedAmount * loanProduct.processingFeePercent) / 100;

    // Create application
    const application = await LoanApplication.create({
      customerId,
      loanProductId,
      requestedAmount,
      requestedTenureMonths,
      purpose,
      collaterals: collateralIds,
      totalCollateralValue,
      eligibleLoanAmount,
      processingFee,
      interestRate: loanProduct.interestRate,
      source: req.source || source,
      sourcePartnerId: req.partnerId,
      apiRequestId: req.source === 'API' ? uuidv4() : undefined,
      status: 'SUBMITTED',
      submittedAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    });

    // Update collaterals with application ID
    if (collateralIds.length > 0) {
      await Collateral.updateMany(
        { _id: { $in: collateralIds } },
        { loanApplicationId: application._id }
      );
    }

    // Populate response
    await application.populate('customerId', 'customerId firstName lastName email');
    await application.populate('loanProductId', 'productCode productName');
    await application.populate('collaterals');

    res.status(201).json({
      success: true,
      message: 'Loan application created successfully',
      data: {
        application,
        eligibility: {
          totalCollateralValue,
          eligibleLoanAmount,
          ltv: loanProduct.ltv,
          interestRate: loanProduct.interestRate,
          processingFee
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update loan application status
 * @route   PATCH /api/loan-applications/:id/status
 * @access  Private
 */
const updateApplicationStatus = async (req, res, next) => {
  try {
    const { status, remarks, approvedAmount, approvedTenureMonths } = req.body;

    const application = await LoanApplication.findById(req.params.id);

    if (!application) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Loan application not found'
        }
      });
    }

    // Update status
    application.status = status;
    application.statusHistory.push({
      status,
      changedAt: new Date(),
      remarks
    });

    // Handle approval
    if (status === 'APPROVED') {
      application.approvedAmount = approvedAmount || application.requestedAmount;
      application.approvedTenureMonths = approvedTenureMonths || application.requestedTenureMonths;
      application.approvalDate = new Date();
    }

    // Handle rejection
    if (status === 'REJECTED') {
      application.rejectionReason = remarks;
    }

    await application.save();

    // Update collateral lien status if approved
    if (status === 'APPROVED' && application.collaterals.length > 0) {
      await Collateral.updateMany(
        { _id: { $in: application.collaterals } },
        { lienStatus: 'MARKED', lienMarkDate: new Date() }
      );
    }

    res.json({
      success: true,
      message: `Application status updated to ${status}`,
      data: application
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Disburse loan (Create Loan from Application)
 * @route   POST /api/loan-applications/:id/disburse
 * @access  Private
 */
const disburseLoan = async (req, res, next) => {
  try {
    const { disbursementAccountNumber, disbursementIfsc } = req.body;

    const application = await LoanApplication.findById(req.params.id)
      .populate('loanProductId');

    if (!application) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Loan application not found'
        }
      });
    }

    if (application.status !== 'APPROVED') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NOT_APPROVED',
          message: 'Application must be approved before disbursement'
        }
      });
    }

    const principalAmount = application.approvedAmount;
    const interestRate = application.interestRate;
    const tenureMonths = application.approvedTenureMonths;

    // Calculate EMI
    const emi = Loan.calculateEMI(principalAmount, interestRate, tenureMonths);
    const totalPayable = emi * tenureMonths;
    const totalInterest = totalPayable - principalAmount;

    // Calculate dates
    const disbursementDate = new Date();
    const firstEmiDate = new Date(disbursementDate);
    firstEmiDate.setMonth(firstEmiDate.getMonth() + 1);
    const lastEmiDate = new Date(firstEmiDate);
    lastEmiDate.setMonth(lastEmiDate.getMonth() + tenureMonths - 1);

    // Create loan
    const loan = await Loan.create({
      applicationId: application._id,
      customerId: application.customerId,
      loanProductId: application.loanProductId,
      principalAmount,
      interestRate,
      tenureMonths,
      emiAmount: emi,
      totalInterest,
      totalPayable,
      outstandingPrincipal: principalAmount,
      totalOutstanding: principalAmount,
      collaterals: application.collaterals,
      totalCollateralValue: application.totalCollateralValue,
      currentLtv: (principalAmount / application.totalCollateralValue) * 100,
      disbursementDate,
      firstEmiDate,
      lastEmiDate,
      status: 'ACTIVE'
    });

    // Generate repayment schedule
    loan.generateRepaymentSchedule();
    await loan.save();

    // Update application
    application.status = 'DISBURSED';
    application.disbursementDate = disbursementDate;
    application.disbursementAmount = principalAmount;
    application.disbursementAccountNumber = disbursementAccountNumber;
    application.disbursementIfsc = disbursementIfsc;
    application.disbursementReferenceNumber = `DIS${Date.now()}`;
    await application.save();

    // Update collaterals with loan ID
    await Collateral.updateMany(
      { _id: { $in: application.collaterals } },
      { loanId: loan._id }
    );

    await loan.populate('customerId', 'customerId firstName lastName');
    await loan.populate('loanProductId', 'productCode productName');

    res.status(201).json({
      success: true,
      message: 'Loan disbursed successfully',
      data: {
        loan,
        repaymentSchedule: loan.repaymentSchedule
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add collateral to application
 * @route   POST /api/loan-applications/:id/collaterals
 * @access  Private/API
 */
const addCollateralToApplication = async (req, res, next) => {
  try {
    const application = await LoanApplication.findById(req.params.id)
      .populate('loanProductId');

    if (!application) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Loan application not found'
        }
      });
    }

    if (!['DRAFT', 'SUBMITTED', 'DOCUMENTS_PENDING', 'COLLATERAL_VERIFICATION'].includes(application.status)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATUS',
          message: 'Cannot add collateral at this stage'
        }
      });
    }

    const col = req.body;
    const valueAtPledge = col.units * col.navAtPledge;
    const currentValue = col.units * (col.currentNav || col.navAtPledge);
    const eligibleAmount = currentValue * (application.loanProductId.ltv / 100);

    const collateral = await Collateral.create({
      customerId: application.customerId,
      loanApplicationId: application._id,
      mutualFund: {
        fundName: col.fundName,
        fundHouse: col.fundHouse,
        schemeCode: col.schemeCode,
        folioNumber: col.folioNumber,
        isin: col.isin,
        fundType: col.fundType,
        units: col.units,
        navAtPledge: col.navAtPledge,
        currentNav: col.currentNav || col.navAtPledge,
        valueAtPledge,
        currentValue
      },
      ltv: application.loanProductId.ltv,
      eligibleLoanAmount: eligibleAmount
    });

    application.collaterals.push(collateral._id);
    application.totalCollateralValue += currentValue;
    application.eligibleLoanAmount += eligibleAmount;
    await application.save();

    res.status(201).json({
      success: true,
      message: 'Collateral added successfully',
      data: {
        collateral,
        updatedEligibility: {
          totalCollateralValue: application.totalCollateralValue,
          eligibleLoanAmount: application.eligibleLoanAmount
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get application by API request ID (for fintech partners)
 * @route   GET /api/loan-applications/api-request/:requestId
 * @access  API
 */
const getByApiRequestId = async (req, res, next) => {
  try {
    const application = await LoanApplication.findOne({
      apiRequestId: req.params.requestId
    })
      .populate('customerId', 'customerId firstName lastName email')
      .populate('loanProductId', 'productCode productName')
      .populate('collaterals');

    if (!application) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Application not found'
        }
      });
    }

    res.json({
      success: true,
      data: application
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllLoanApplications,
  getLoanApplicationById,
  createLoanApplication,
  updateApplicationStatus,
  disburseLoan,
  addCollateralToApplication,
  getByApiRequestId
};

