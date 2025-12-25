const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validateRequest = require('../middleware/validateRequest');
const {
  getAllLoanProducts,
  getLoanProductById,
  createLoanProduct,
  updateLoanProduct,
  deleteLoanProduct
} = require('../controllers/loanProductController');

// Validation rules
const productValidation = [
  body('productCode').notEmpty().withMessage('Product code is required'),
  body('productName').notEmpty().withMessage('Product name is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('interestRate').isFloat({ min: 0, max: 100 }).withMessage('Interest rate must be between 0 and 100'),
  body('minLoanAmount').isFloat({ min: 0 }).withMessage('Min loan amount must be positive'),
  body('maxLoanAmount').isFloat({ min: 0 }).withMessage('Max loan amount must be positive'),
  body('minTenureMonths').isInt({ min: 1 }).withMessage('Min tenure must be at least 1 month'),
  body('maxTenureMonths').isInt({ min: 1 }).withMessage('Max tenure must be at least 1 month'),
  body('ltv').isFloat({ min: 0, max: 100 }).withMessage('LTV must be between 0 and 100')
];

// Routes
router.get('/', getAllLoanProducts);
router.get('/:id', getLoanProductById);
router.post('/', productValidation, validateRequest, createLoanProduct);
router.put('/:id', updateLoanProduct);
router.delete('/:id', deleteLoanProduct);

module.exports = router;

