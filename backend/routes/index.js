const express = require('express');
const router = express.Router();

const loanProductRoutes = require('./loanProductRoutes');
const customerRoutes = require('./customerRoutes');
const collateralRoutes = require('./collateralRoutes');
const loanApplicationRoutes = require('./loanApplicationRoutes');
const loanRoutes = require('./loanRoutes');

// Mount routes
router.use('/loan-products', loanProductRoutes);
router.use('/customers', customerRoutes);
router.use('/collaterals', collateralRoutes);
router.use('/loan-applications', loanApplicationRoutes);
router.use('/loans', loanRoutes);

// API Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'LMS API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

module.exports = router;

