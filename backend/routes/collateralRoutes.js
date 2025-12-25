const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validateRequest = require('../middleware/validateRequest');
const {
  getAllCollaterals,
  getCollateralById,
  createCollateral,
  updateCollateralNav,
  updateLienStatus,
  releaseCollateral,
  getCollateralSummaryByFundType,
  bulkNavUpdate
} = require('../controllers/collateralController');

// Validation rules
const collateralValidation = [
  body('customerId').notEmpty().withMessage('Customer ID is required'),
  body('mutualFund.fundName').notEmpty().withMessage('Fund name is required'),
  body('mutualFund.fundHouse').notEmpty().withMessage('Fund house is required'),
  body('mutualFund.schemeCode').notEmpty().withMessage('Scheme code is required'),
  body('mutualFund.folioNumber').notEmpty().withMessage('Folio number is required'),
  body('mutualFund.isin').notEmpty().withMessage('ISIN is required'),
  body('mutualFund.fundType').isIn(['EQUITY', 'DEBT', 'HYBRID', 'LIQUID', 'ELSS', 'INDEX'])
    .withMessage('Valid fund type is required'),
  body('mutualFund.units').isFloat({ min: 0.001 }).withMessage('Units must be positive'),
  body('mutualFund.navAtPledge').isFloat({ min: 0.01 }).withMessage('NAV must be positive'),
  body('ltv').isFloat({ min: 0, max: 100 }).withMessage('LTV must be between 0 and 100')
];

// Routes
router.get('/', getAllCollaterals);
router.get('/summary/by-fund-type', getCollateralSummaryByFundType);
router.get('/:id', getCollateralById);
router.post('/', collateralValidation, validateRequest, createCollateral);
router.post('/bulk-nav-update', bulkNavUpdate);
router.patch('/:id/nav', updateCollateralNav);
router.patch('/:id/lien', updateLienStatus);
router.patch('/:id/release', releaseCollateral);

module.exports = router;

