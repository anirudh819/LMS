const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validateRequest = require('../middleware/validateRequest');
const {
  getAllPartners,
  getPartnerById,
  createPartner,
  updatePartner,
  updatePartnerStatus,
  regenerateCredentials,
  getPartnerStatistics,
  deletePartner,
  getPartnerDashboard
} = require('../controllers/partnerController');

// Validation rules for creating partner
const partnerValidation = [
  body('partnerName').notEmpty().withMessage('Partner name is required'),
  body('companyName').notEmpty().withMessage('Company name is required'),
  body('contactPerson.name').notEmpty().withMessage('Contact person name is required'),
  body('contactPerson.email').isEmail().withMessage('Valid email is required'),
  body('contactPerson.phone').notEmpty().withMessage('Contact phone is required'),
  body('businessType')
    .isIn(['NBFC', 'FINTECH', 'BANK', 'AGGREGATOR', 'BROKER', 'OTHER'])
    .withMessage('Valid business type is required')
];

// Validation for status update
const statusValidation = [
  body('status')
    .isIn(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING_APPROVAL'])
    .withMessage('Valid status is required')
];

// Routes

// Dashboard summary
router.get('/dashboard', getPartnerDashboard);

// Get all partners
router.get('/', getAllPartners);

// Get partner by ID
router.get('/:id', getPartnerById);

// Create new partner
router.post('/', partnerValidation, validateRequest, createPartner);

// Update partner
router.put('/:id', updatePartner);

// Update partner status
router.patch('/:id/status', statusValidation, validateRequest, updatePartnerStatus);

// Regenerate API credentials
router.post('/:id/regenerate-credentials', regenerateCredentials);

// Get partner statistics
router.get('/:id/statistics', getPartnerStatistics);

// Delete partner (soft delete)
router.delete('/:id', deletePartner);

module.exports = router;

