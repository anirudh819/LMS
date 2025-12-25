require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/database');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// API Routes
app.use('/api', routes);

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to LAMF Loan Management System API',
    documentation: '/api/health',
    endpoints: {
      loanProducts: '/api/loan-products',
      customers: '/api/customers',
      collaterals: '/api/collaterals',
      loanApplications: '/api/loan-applications',
      loans: '/api/loans'
    }
  });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Route not found'
    }
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════════════════════════╗
  ║                                                           ║
  ║   LAMF Loan Management System API                         ║
  ║   Server running on port ${PORT}                            ║
  ║                                                           ║
  ║   Endpoints:                                              ║
  ║   - GET  /api/health              Health check            ║
  ║   - GET  /api/loan-products       List loan products      ║
  ║   - GET  /api/customers           List customers          ║
  ║   - GET  /api/collaterals         List collaterals        ║
  ║   - GET  /api/loan-applications   List applications       ║
  ║   - GET  /api/loans               List ongoing loans      ║
  ║                                                           ║
  ╚═══════════════════════════════════════════════════════════╝
  `);
});

module.exports = app;

