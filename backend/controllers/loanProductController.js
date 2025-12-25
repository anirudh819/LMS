const { LoanProduct } = require('../models');

/**
 * @desc    Get all loan products
 * @route   GET /api/loan-products
 * @access  Public
 */
const getAllLoanProducts = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    const query = {};
    if (status) query.status = status;

    const products = await LoanProduct.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await LoanProduct.countDocuments(query);

    res.json({
      success: true,
      data: {
        products,
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
 * @desc    Get loan product by ID
 * @route   GET /api/loan-products/:id
 * @access  Public
 */
const getLoanProductById = async (req, res, next) => {
  try {
    const product = await LoanProduct.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Loan product not found'
        }
      });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new loan product
 * @route   POST /api/loan-products
 * @access  Private
 */
const createLoanProduct = async (req, res, next) => {
  try {
    const product = await LoanProduct.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Loan product created successfully',
      data: product
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update loan product
 * @route   PUT /api/loan-products/:id
 * @access  Private
 */
const updateLoanProduct = async (req, res, next) => {
  try {
    const product = await LoanProduct.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Loan product not found'
        }
      });
    }

    res.json({
      success: true,
      message: 'Loan product updated successfully',
      data: product
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete loan product (soft delete - set status to DISCONTINUED)
 * @route   DELETE /api/loan-products/:id
 * @access  Private
 */
const deleteLoanProduct = async (req, res, next) => {
  try {
    const product = await LoanProduct.findByIdAndUpdate(
      req.params.id,
      { status: 'DISCONTINUED', updatedAt: Date.now() },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Loan product not found'
        }
      });
    }

    res.json({
      success: true,
      message: 'Loan product discontinued successfully',
      data: product
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllLoanProducts,
  getLoanProductById,
  createLoanProduct,
  updateLoanProduct,
  deleteLoanProduct
};

