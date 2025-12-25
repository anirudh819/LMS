const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validateRequest = require('../middleware/validateRequest');
const apiKeyAuth = require('../middleware/apiKeyAuth');
const {
  getAllLoanApplications,
  getLoanApplicationById,
  createLoanApplication,
  updateApplicationStatus,
  disburseLoan,
  addCollateralToApplication,
  getByApiRequestId
} = require('../controllers/loanApplicationController');

// Validation rules for creating application
const applicationValidation = [
  body('customerId').notEmpty().withMessage('Customer ID is required'),
  body('loanProductId').notEmpty().withMessage('Loan product ID is required'),
  body('requestedAmount').isFloat({ min: 1 }).withMessage('Requested amount must be positive'),
  body('requestedTenureMonths').isInt({ min: 1 }).withMessage('Tenure must be at least 1 month'),
  body('purpose').notEmpty().withMessage('Loan purpose is required')
];

// Validation for collateral
const collateralValidation = [
  body('fundName').notEmpty().withMessage('Fund name is required'),
  body('fundHouse').notEmpty().withMessage('Fund house is required'),
  body('schemeCode').notEmpty().withMessage('Scheme code is required'),
  body('folioNumber').notEmpty().withMessage('Folio number is required'),
  body('isin').notEmpty().withMessage('ISIN is required'),
  body('fundType').isIn(['EQUITY', 'DEBT', 'HYBRID', 'LIQUID', 'ELSS', 'INDEX'])
    .withMessage('Valid fund type is required'),
  body('units').isFloat({ min: 0.001 }).withMessage('Units must be positive'),
  body('navAtPledge').isFloat({ min: 0.01 }).withMessage('NAV must be positive')
];

// Routes
router.get('/', getAllLoanApplications);
router.get('/api-request/:requestId', apiKeyAuth, getByApiRequestId);
router.get('/:id', getLoanApplicationById);

// Create application - supports both web and API (important for fintech partners)
router.post('/', apiKeyAuth, applicationValidation, validateRequest, createLoanApplication);

router.patch('/:id/status', updateApplicationStatus);
router.post('/:id/disburse', disburseLoan);
router.post('/:id/collaterals', collateralValidation, validateRequest, addCollateralToApplication);

module.exports = router;

