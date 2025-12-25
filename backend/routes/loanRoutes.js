const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validateRequest = require('../middleware/validateRequest');
const {
  getAllLoans,
  getLoanById,
  getRepaymentSchedule,
  recordPayment,
  getPaymentHistory,
  prepayLoan,
  updateOverdueStatus,
  getLoansWithMarginCalls,
  getPortfolioSummary
} = require('../controllers/loanController');

// Validation rules
const paymentValidation = [
  body('amount').isFloat({ min: 1 }).withMessage('Amount must be positive'),
  body('paymentMode').isIn(['NACH', 'UPI', 'NETBANKING', 'CHEQUE', 'CASH', 'NEFT', 'RTGS'])
    .withMessage('Valid payment mode is required'),
  body('referenceNumber').notEmpty().withMessage('Reference number is required')
];

// Routes
router.get('/', getAllLoans);
router.get('/summary', getPortfolioSummary);
router.get('/margin-calls', getLoansWithMarginCalls);
router.get('/:id', getLoanById);
router.get('/:id/schedule', getRepaymentSchedule);
router.get('/:id/payments', getPaymentHistory);

router.post('/:id/payments', paymentValidation, validateRequest, recordPayment);
router.post('/:id/prepay', paymentValidation, validateRequest, prepayLoan);

router.patch('/:id/overdue', updateOverdueStatus);

module.exports = router;

