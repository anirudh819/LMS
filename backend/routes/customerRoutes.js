const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validateRequest = require('../middleware/validateRequest');
const {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  updateKycStatus,
  searchByPan
} = require('../controllers/customerController');

// Validation rules
const customerValidation = [
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').notEmpty().withMessage('Phone number is required'),
  body('dateOfBirth').isISO8601().withMessage('Valid date of birth is required'),
  body('panNumber').matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/).withMessage('Valid PAN number is required'),
  body('aadharNumber').notEmpty().withMessage('Aadhar number is required'),
  body('employmentType').isIn(['SALARIED', 'SELF_EMPLOYED', 'BUSINESS', 'PROFESSIONAL', 'RETIRED', 'OTHER'])
    .withMessage('Valid employment type is required'),
  body('monthlyIncome').isFloat({ min: 0 }).withMessage('Monthly income must be positive')
];

// Routes
router.get('/', getAllCustomers);
router.get('/search/pan/:pan', searchByPan);
router.get('/:id', getCustomerById);
router.post('/', customerValidation, validateRequest, createCustomer);
router.put('/:id', updateCustomer);
router.patch('/:id/kyc', updateKycStatus);

module.exports = router;

