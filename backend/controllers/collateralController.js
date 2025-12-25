const { Collateral, Loan } = require('../models');

/**
 * @desc    Get all collaterals
 * @route   GET /api/collaterals
 * @access  Private
 */
const getAllCollaterals = async (req, res, next) => {
  try {
    const { status, lienStatus, customerId, loanId, page = 1, limit = 10 } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (lienStatus) query.lienStatus = lienStatus;
    if (customerId) query.customerId = customerId;
    if (loanId) query.loanId = loanId;

    const collaterals = await Collateral.find(query)
      .populate('customerId', 'customerId firstName lastName email')
      .populate('loanId', 'loanId status totalOutstanding')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Collateral.countDocuments(query);

    // Calculate summary
    const summary = await Collateral.aggregate([
      { $match: query.status ? { status: query.status } : {} },
      {
        $group: {
          _id: null,
          totalCollaterals: { $sum: 1 },
          totalValue: { $sum: '$mutualFund.currentValue' },
          totalEligibleAmount: { $sum: '$eligibleLoanAmount' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        collaterals,
        summary: summary[0] || { totalCollaterals: 0, totalValue: 0, totalEligibleAmount: 0 },
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
 * @desc    Get collateral by ID
 * @route   GET /api/collaterals/:id
 * @access  Private
 */
const getCollateralById = async (req, res, next) => {
  try {
    const collateral = await Collateral.findById(req.params.id)
      .populate('customerId')
      .populate('loanId')
      .populate('loanApplicationId');

    if (!collateral) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Collateral not found'
        }
      });
    }

    res.json({
      success: true,
      data: collateral
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create/Add new collateral
 * @route   POST /api/collaterals
 * @access  Private/API
 */
const createCollateral = async (req, res, next) => {
  try {
    const {
      customerId,
      loanApplicationId,
      mutualFund,
      ltv
    } = req.body;

    // Calculate values
    const valueAtPledge = mutualFund.units * mutualFund.navAtPledge;
    const currentValue = mutualFund.units * mutualFund.currentNav;
    const eligibleLoanAmount = currentValue * (ltv / 100);

    const collateral = await Collateral.create({
      customerId,
      loanApplicationId,
      mutualFund: {
        ...mutualFund,
        valueAtPledge,
        currentValue
      },
      ltv,
      eligibleLoanAmount,
      navHistory: [{
        nav: mutualFund.currentNav,
        value: currentValue,
        recordedAt: new Date()
      }]
    });

    res.status(201).json({
      success: true,
      message: 'Collateral added successfully',
      data: collateral
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update collateral NAV (for daily valuation updates)
 * @route   PATCH /api/collaterals/:id/nav
 * @access  Private
 */
const updateCollateralNav = async (req, res, next) => {
  try {
    const { newNav } = req.body;

    const collateral = await Collateral.findById(req.params.id);

    if (!collateral) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Collateral not found'
        }
      });
    }

    // Update valuation
    collateral.updateValuation(newNav);

    // Check for margin call if loan is active
    if (collateral.loanId) {
      const loan = await Loan.findById(collateral.loanId);
      if (loan && loan.status === 'ACTIVE') {
        const marginCallNeeded = collateral.checkMarginCall(loan.totalOutstanding);
        if (marginCallNeeded) {
          loan.marginCallStatus = 'TRIGGERED';
          loan.lastMarginCallDate = new Date();
          await loan.save();
        }
      }
    }

    await collateral.save();

    res.json({
      success: true,
      message: 'NAV updated successfully',
      data: collateral
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update lien status
 * @route   PATCH /api/collaterals/:id/lien
 * @access  Private
 */
const updateLienStatus = async (req, res, next) => {
  try {
    const { lienStatus, lienReferenceNumber } = req.body;

    const updateData = {
      lienStatus,
      updatedAt: Date.now()
    };

    if (lienStatus === 'MARKED') {
      updateData.lienMarkDate = new Date();
      updateData.lienReferenceNumber = lienReferenceNumber;
    }

    const collateral = await Collateral.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!collateral) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Collateral not found'
        }
      });
    }

    res.json({
      success: true,
      message: 'Lien status updated successfully',
      data: collateral
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Release collateral
 * @route   PATCH /api/collaterals/:id/release
 * @access  Private
 */
const releaseCollateral = async (req, res, next) => {
  try {
    const collateral = await Collateral.findById(req.params.id);

    if (!collateral) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Collateral not found'
        }
      });
    }

    // Check if loan is closed
    if (collateral.loanId) {
      const loan = await Loan.findById(collateral.loanId);
      if (loan && !['CLOSED', 'SETTLED', 'FORECLOSED'].includes(loan.status)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'LOAN_ACTIVE',
            message: 'Cannot release collateral while loan is active'
          }
        });
      }
    }

    collateral.status = 'RELEASED';
    collateral.lienStatus = 'RELEASED';
    await collateral.save();

    res.json({
      success: true,
      message: 'Collateral released successfully',
      data: collateral
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get collateral summary by fund type
 * @route   GET /api/collaterals/summary/by-fund-type
 * @access  Private
 */
const getCollateralSummaryByFundType = async (req, res, next) => {
  try {
    const summary = await Collateral.aggregate([
      { $match: { status: 'ACTIVE' } },
      {
        $group: {
          _id: '$mutualFund.fundType',
          count: { $sum: 1 },
          totalUnits: { $sum: '$mutualFund.units' },
          totalValue: { $sum: '$mutualFund.currentValue' },
          totalEligibleAmount: { $sum: '$eligibleLoanAmount' }
        }
      },
      { $sort: { totalValue: -1 } }
    ]);

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Bulk update NAV for multiple collaterals
 * @route   POST /api/collaterals/bulk-nav-update
 * @access  Private
 */
const bulkNavUpdate = async (req, res, next) => {
  try {
    const { updates } = req.body; // Array of { isin, newNav }

    const results = [];

    for (const update of updates) {
      const collaterals = await Collateral.find({
        'mutualFund.isin': update.isin,
        status: 'ACTIVE'
      });

      for (const collateral of collaterals) {
        collateral.updateValuation(update.newNav);
        await collateral.save();
        results.push({
          collateralId: collateral.collateralId,
          isin: update.isin,
          newValue: collateral.mutualFund.currentValue
        });
      }
    }

    res.json({
      success: true,
      message: `Updated ${results.length} collaterals`,
      data: results
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllCollaterals,
  getCollateralById,
  createCollateral,
  updateCollateralNav,
  updateLienStatus,
  releaseCollateral,
  getCollateralSummaryByFundType,
  bulkNavUpdate
};

