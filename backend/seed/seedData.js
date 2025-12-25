require('dotenv').config();
const mongoose = require('mongoose');
const { LoanProduct, Customer, Collateral, LoanApplication, Loan } = require('../models');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lms_db');
    console.log('MongoDB connected for seeding...');
  } catch (error) {
    console.error('Connection error:', error);
    process.exit(1);
  }
};

// Sample Loan Products
const loanProducts = [
  {
    productCode: 'LAMF-EQUITY',
    productName: 'Loan Against Equity Mutual Funds',
    description: 'Quick loans against your equity mutual fund investments with attractive interest rates',
    interestRate: 10.5,
    interestType: 'REDUCING_BALANCE',
    minLoanAmount: 50000,
    maxLoanAmount: 10000000,
    minTenureMonths: 6,
    maxTenureMonths: 36,
    processingFeePercent: 1,
    ltv: 50,
    eligibleMutualFundTypes: ['EQUITY', 'INDEX', 'ELSS'],
    prepaymentChargePercent: 0,
    latePaymentChargePercent: 2,
    status: 'ACTIVE'
  },
  {
    productCode: 'LAMF-DEBT',
    productName: 'Loan Against Debt Mutual Funds',
    description: 'Secure loans against debt mutual funds with higher LTV ratio',
    interestRate: 9.5,
    interestType: 'REDUCING_BALANCE',
    minLoanAmount: 25000,
    maxLoanAmount: 5000000,
    minTenureMonths: 3,
    maxTenureMonths: 24,
    processingFeePercent: 0.5,
    ltv: 70,
    eligibleMutualFundTypes: ['DEBT', 'LIQUID'],
    prepaymentChargePercent: 0,
    latePaymentChargePercent: 1.5,
    status: 'ACTIVE'
  },
  {
    productCode: 'LAMF-HYBRID',
    productName: 'Loan Against Hybrid Mutual Funds',
    description: 'Balanced loans against hybrid mutual fund holdings',
    interestRate: 10,
    interestType: 'REDUCING_BALANCE',
    minLoanAmount: 30000,
    maxLoanAmount: 7500000,
    minTenureMonths: 6,
    maxTenureMonths: 30,
    processingFeePercent: 0.75,
    ltv: 60,
    eligibleMutualFundTypes: ['HYBRID'],
    prepaymentChargePercent: 0,
    latePaymentChargePercent: 2,
    status: 'ACTIVE'
  },
  {
    productCode: 'LAMF-FLEXI',
    productName: 'Flexi Loan Against MF',
    description: 'Flexible overdraft facility against mutual funds - withdraw as needed',
    interestRate: 11,
    interestType: 'FLOATING',
    minLoanAmount: 100000,
    maxLoanAmount: 50000000,
    minTenureMonths: 12,
    maxTenureMonths: 60,
    processingFeePercent: 1.5,
    ltv: 50,
    eligibleMutualFundTypes: ['EQUITY', 'DEBT', 'HYBRID', 'LIQUID', 'INDEX'],
    prepaymentChargePercent: 0,
    latePaymentChargePercent: 2.5,
    status: 'ACTIVE'
  }
];

// Sample Customers
const customers = [
  {
    firstName: 'Rahul',
    lastName: 'Sharma',
    email: 'rahul.sharma@example.com',
    phone: '9876543210',
    dateOfBirth: new Date('1985-05-15'),
    panNumber: 'ABCDE1234F',
    aadharNumber: '1234-5678-9012',
    address: {
      street: '123 MG Road',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      country: 'India'
    },
    employmentType: 'SALARIED',
    monthlyIncome: 150000,
    bankDetails: {
      bankName: 'HDFC Bank',
      accountNumber: '1234567890123',
      ifscCode: 'HDFC0001234',
      accountType: 'SAVINGS'
    },
    kycStatus: 'VERIFIED',
    riskProfile: 'MODERATE',
    status: 'ACTIVE'
  },
  {
    firstName: 'Priya',
    lastName: 'Patel',
    email: 'priya.patel@example.com',
    phone: '9876543211',
    dateOfBirth: new Date('1990-08-22'),
    panNumber: 'FGHIJ5678K',
    aadharNumber: '2345-6789-0123',
    address: {
      street: '456 Anna Salai',
      city: 'Chennai',
      state: 'Tamil Nadu',
      pincode: '600001',
      country: 'India'
    },
    employmentType: 'BUSINESS',
    monthlyIncome: 300000,
    bankDetails: {
      bankName: 'ICICI Bank',
      accountNumber: '2345678901234',
      ifscCode: 'ICIC0002345',
      accountType: 'CURRENT'
    },
    kycStatus: 'VERIFIED',
    riskProfile: 'HIGH',
    status: 'ACTIVE'
  },
  {
    firstName: 'Amit',
    lastName: 'Kumar',
    email: 'amit.kumar@example.com',
    phone: '9876543212',
    dateOfBirth: new Date('1982-12-10'),
    panNumber: 'KLMNO9012P',
    aadharNumber: '3456-7890-1234',
    address: {
      street: '789 Connaught Place',
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110001',
      country: 'India'
    },
    employmentType: 'PROFESSIONAL',
    monthlyIncome: 500000,
    bankDetails: {
      bankName: 'Axis Bank',
      accountNumber: '3456789012345',
      ifscCode: 'UTIB0003456',
      accountType: 'SAVINGS'
    },
    kycStatus: 'VERIFIED',
    riskProfile: 'LOW',
    status: 'ACTIVE'
  }
];

// Sample Mutual Fund data for collaterals
const mutualFunds = [
  {
    fundName: 'HDFC Top 100 Fund',
    fundHouse: 'HDFC Mutual Fund',
    schemeCode: 'HDFC100',
    isin: 'INF179K01234',
    fundType: 'EQUITY',
    nav: 850.25
  },
  {
    fundName: 'ICICI Prudential Bluechip Fund',
    fundHouse: 'ICICI Prudential Mutual Fund',
    schemeCode: 'ICICIBC',
    isin: 'INF109K05678',
    fundType: 'EQUITY',
    nav: 72.50
  },
  {
    fundName: 'SBI Liquid Fund',
    fundHouse: 'SBI Mutual Fund',
    schemeCode: 'SBILIQ',
    isin: 'INF200K09012',
    fundType: 'LIQUID',
    nav: 3250.75
  },
  {
    fundName: 'Axis Bluechip Fund',
    fundHouse: 'Axis Mutual Fund',
    schemeCode: 'AXISBC',
    isin: 'INF846K03456',
    fundType: 'EQUITY',
    nav: 48.35
  },
  {
    fundName: 'HDFC Balanced Advantage Fund',
    fundHouse: 'HDFC Mutual Fund',
    schemeCode: 'HDFCBAL',
    isin: 'INF179K07890',
    fundType: 'HYBRID',
    nav: 325.60
  }
];

const seedDatabase = async () => {
  try {
    await connectDB();

    // Clear existing data
    console.log('Clearing existing data...');
    await LoanProduct.deleteMany({});
    await Customer.deleteMany({});
    await Collateral.deleteMany({});
    await LoanApplication.deleteMany({});
    await Loan.deleteMany({});

    // Seed loan products
    console.log('Seeding loan products...');
    const createdProducts = await LoanProduct.insertMany(loanProducts);
    console.log(`Created ${createdProducts.length} loan products`);

    // Seed customers
    console.log('Seeding customers...');
    const createdCustomers = await Customer.create(customers);
    console.log(`Created ${createdCustomers.length} customers`);

    // Create sample collaterals for first customer
    console.log('Creating sample collaterals...');
    const collateralsData = [
      {
        customerId: createdCustomers[0]._id,
        mutualFund: {
          ...mutualFunds[0],
          folioNumber: 'FOL123456',
          units: 100,
          navAtPledge: mutualFunds[0].nav,
          currentNav: mutualFunds[0].nav,
          valueAtPledge: 100 * mutualFunds[0].nav,
          currentValue: 100 * mutualFunds[0].nav
        },
        ltv: 50,
        eligibleLoanAmount: 100 * mutualFunds[0].nav * 0.5,
        lienStatus: 'PENDING'
      },
      {
        customerId: createdCustomers[0]._id,
        mutualFund: {
          ...mutualFunds[1],
          folioNumber: 'FOL234567',
          units: 500,
          navAtPledge: mutualFunds[1].nav,
          currentNav: mutualFunds[1].nav,
          valueAtPledge: 500 * mutualFunds[1].nav,
          currentValue: 500 * mutualFunds[1].nav
        },
        ltv: 50,
        eligibleLoanAmount: 500 * mutualFunds[1].nav * 0.5,
        lienStatus: 'PENDING'
      }
    ];

    const createdCollaterals = await Collateral.create(collateralsData);
    console.log(`Created ${createdCollaterals.length} collaterals`);

    // Create a sample loan application
    console.log('Creating sample loan application...');
    const totalCollateralValue = createdCollaterals.reduce(
      (sum, c) => sum + c.mutualFund.currentValue, 0
    );
    const eligibleLoanAmount = createdCollaterals.reduce(
      (sum, c) => sum + c.eligibleLoanAmount, 0
    );

    const application = await LoanApplication.create({
      customerId: createdCustomers[0]._id,
      loanProductId: createdProducts[0]._id,
      requestedAmount: 50000,
      requestedTenureMonths: 12,
      purpose: 'Business expansion',
      collaterals: createdCollaterals.map(c => c._id),
      totalCollateralValue,
      eligibleLoanAmount,
      interestRate: createdProducts[0].interestRate,
      processingFee: 500,
      status: 'APPROVED',
      approvedAmount: 50000,
      approvedTenureMonths: 12,
      approvalDate: new Date(),
      source: 'WEB',
      submittedAt: new Date()
    });
    console.log(`Created loan application: ${application.applicationId}`);

    // Update collaterals with application ID and mark lien
    await Collateral.updateMany(
      { _id: { $in: createdCollaterals.map(c => c._id) } },
      { 
        loanApplicationId: application._id,
        lienStatus: 'MARKED',
        lienMarkDate: new Date()
      }
    );

    // Create an active loan
    console.log('Creating sample active loan...');
    const principalAmount = application.approvedAmount;
    const interestRate = application.interestRate;
    const tenureMonths = application.approvedTenureMonths;
    
    const monthlyRate = interestRate / 12 / 100;
    const emi = principalAmount * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths) / 
                (Math.pow(1 + monthlyRate, tenureMonths) - 1);
    const totalPayable = Math.round(emi * tenureMonths * 100) / 100;
    const totalInterest = totalPayable - principalAmount;

    const disbursementDate = new Date();
    const firstEmiDate = new Date(disbursementDate);
    firstEmiDate.setMonth(firstEmiDate.getMonth() + 1);
    const lastEmiDate = new Date(firstEmiDate);
    lastEmiDate.setMonth(lastEmiDate.getMonth() + tenureMonths - 1);

    const loan = await Loan.create({
      applicationId: application._id,
      customerId: createdCustomers[0]._id,
      loanProductId: createdProducts[0]._id,
      principalAmount,
      interestRate,
      tenureMonths,
      emiAmount: Math.round(emi * 100) / 100,
      totalInterest: Math.round(totalInterest * 100) / 100,
      totalPayable,
      outstandingPrincipal: principalAmount,
      totalOutstanding: principalAmount,
      collaterals: createdCollaterals.map(c => c._id),
      totalCollateralValue,
      currentLtv: (principalAmount / totalCollateralValue) * 100,
      disbursementDate,
      firstEmiDate,
      lastEmiDate,
      status: 'ACTIVE'
    });

    // Generate repayment schedule
    loan.generateRepaymentSchedule();
    await loan.save();
    console.log(`Created active loan: ${loan.loanId}`);

    // Update collaterals with loan ID
    await Collateral.updateMany(
      { _id: { $in: createdCollaterals.map(c => c._id) } },
      { loanId: loan._id }
    );

    // Update application status to DISBURSED
    application.status = 'DISBURSED';
    application.disbursementDate = disbursementDate;
    application.disbursementAmount = principalAmount;
    await application.save();

    // Create another pending application for second customer
    console.log('Creating pending loan application...');
    const pendingCollateral = await Collateral.create({
      customerId: createdCustomers[1]._id,
      mutualFund: {
        ...mutualFunds[2],
        folioNumber: 'FOL345678',
        units: 50,
        navAtPledge: mutualFunds[2].nav,
        currentNav: mutualFunds[2].nav,
        valueAtPledge: 50 * mutualFunds[2].nav,
        currentValue: 50 * mutualFunds[2].nav
      },
      ltv: 70,
      eligibleLoanAmount: 50 * mutualFunds[2].nav * 0.7,
      lienStatus: 'PENDING'
    });

    const pendingApplication = await LoanApplication.create({
      customerId: createdCustomers[1]._id,
      loanProductId: createdProducts[1]._id,
      requestedAmount: 100000,
      requestedTenureMonths: 18,
      purpose: 'Home renovation',
      collaterals: [pendingCollateral._id],
      totalCollateralValue: pendingCollateral.mutualFund.currentValue,
      eligibleLoanAmount: pendingCollateral.eligibleLoanAmount,
      interestRate: createdProducts[1].interestRate,
      processingFee: 500,
      status: 'UNDER_REVIEW',
      source: 'WEB',
      submittedAt: new Date()
    });
    
    pendingCollateral.loanApplicationId = pendingApplication._id;
    await pendingCollateral.save();
    
    console.log(`Created pending application: ${pendingApplication.applicationId}`);

    console.log('\n✅ Database seeded successfully!');
    console.log('\nSummary:');
    console.log(`- Loan Products: ${createdProducts.length}`);
    console.log(`- Customers: ${createdCustomers.length}`);
    console.log(`- Collaterals: ${createdCollaterals.length + 1}`);
    console.log(`- Loan Applications: 2`);
    console.log(`- Active Loans: 1`);

    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedDatabase();

