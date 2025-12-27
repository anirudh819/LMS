# LAMF - Loan Management System

A full-stack Loan Management System (LMS) for an NBFC (Non-Banking Financial Company) specializing in LAMF (Lending Against Mutual Funds).

![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![React](https://img.shields.io/badge/React-18-blue)
![MongoDB](https://img.shields.io/badge/MongoDB-6+-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [System Architecture](#-system-architecture)
- [Database Schema](#-database-schema)
- [Setup Instructions](#-setup-instructions)
- [API Documentation](#-api-documentation)
- [Screenshots](#-screenshots)

---

## ✨ Features

### 1. Loan Products Module
- Define and manage multiple loan products
- Configure interest rates, LTV ratios, tenure ranges
- Set eligible mutual fund types for each product
- Manage processing fees and charges

### 2. Loan Applications Module
- View all loan applications (completed and ongoing)
- Filter by status, date range, and source
- Track application status history
- Support for both web and API-based applications

### 3. Create New Loan Application
- Step-by-step application wizard
- Customer selection with search
- Add multiple mutual fund collaterals
- Real-time eligibility calculation
- **REST APIs for fintech partners** (Important feature)

### 4. Ongoing Loans Module
- Monitor active loans with key metrics
- Track repayment schedules
- Record payments
- Prepayment processing
- Overdue and NPA management

### 5. Collateral Management Module
- Track all pledged mutual fund units
- Real-time NAV updates
- Lien marking and release
- Margin call monitoring
- Fund-type wise distribution analytics

---

## 🛠 Tech Stack

### Backend
| Technology | Purpose |
|------------|---------|
| **Node.js** | Runtime environment |
| **Express.js** | Web framework |
| **MongoDB** | NoSQL database |
| **Mongoose** | ODM for MongoDB |
| **express-validator** | Request validation |
| **Helmet** | Security middleware |
| **CORS** | Cross-origin resource sharing |
| **Morgan** | HTTP request logger |

### Frontend
| Technology | Purpose |
|------------|---------|
| **React 18** | UI library |
| **Vite** | Build tool |
| **React Router v6** | Client-side routing |
| **Tailwind CSS** | Utility-first CSS |
| **Axios** | HTTP client |
| **Recharts** | Data visualization |
| **Lucide React** | Icon library |

---

## 🏗 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐│
│  │Dashboard │ │ Products │ │  Loans   │ │   Collaterals    ││
│  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘│
└────────────────────────────┬────────────────────────────────┘
                             │ HTTP/REST
┌────────────────────────────┴────────────────────────────────┐
│                     Backend (Node.js/Express)                │
│  ┌──────────────────────────────────────────────────────────┐│
│  │                      API Routes                          ││
│  │  /loan-products  /loan-applications  /loans  /collaterals││
│  └──────────────────────────────────────────────────────────┘│
│  ┌──────────────────────────────────────────────────────────┐│
│  │                     Controllers                          ││
│  └──────────────────────────────────────────────────────────┘│
│  ┌──────────────────────────────────────────────────────────┐│
│  │                    Mongoose Models                       ││
│  └──────────────────────────────────────────────────────────┘│
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────┴────────────────────────────────┐
│                        MongoDB Database                      │
│  ┌──────────┐ ┌───────────┐ ┌──────┐ ┌────────────────────┐ │
│  │ Products │ │ Customers │ │Loans │ │ LoanApplications   │ │
│  └──────────┘ └───────────┘ └──────┘ └────────────────────┘ │
│  ┌──────────────────────────────────────────────────────────┐│
│  │                      Collaterals                         ││
│  └──────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Database Schema

### LoanProduct Schema
```javascript
{
  productCode: String,        // Unique product code (e.g., "LAMF-EQUITY")
  productName: String,        // Display name
  description: String,        // Product description
  interestRate: Number,       // Annual interest rate (%)
  interestType: Enum,         // FIXED, FLOATING, REDUCING_BALANCE
  minLoanAmount: Number,      // Minimum loan amount
  maxLoanAmount: Number,      // Maximum loan amount
  minTenureMonths: Number,    // Minimum tenure
  maxTenureMonths: Number,    // Maximum tenure
  processingFeePercent: Number,
  ltv: Number,                // Loan-to-Value ratio (%)
  eligibleMutualFundTypes: [String],  // EQUITY, DEBT, HYBRID, etc.
  prepaymentChargePercent: Number,
  latePaymentChargePercent: Number,
  status: Enum                // ACTIVE, INACTIVE, DISCONTINUED
}
```

### Customer Schema
```javascript
{
  customerId: String,         // Auto-generated (e.g., "CUST000001")
  firstName: String,
  lastName: String,
  email: String,
  phone: String,
  dateOfBirth: Date,
  panNumber: String,          // Validated format: ABCDE1234F
  aadharNumber: String,
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String
  },
  employmentType: Enum,       // SALARIED, SELF_EMPLOYED, etc.
  monthlyIncome: Number,
  bankDetails: {
    bankName: String,
    accountNumber: String,
    ifscCode: String,
    accountType: Enum         // SAVINGS, CURRENT
  },
  kycStatus: Enum,            // PENDING, VERIFIED, REJECTED
  riskProfile: Enum           // LOW, MODERATE, HIGH
}
```

### Collateral Schema
```javascript
{
  collateralId: String,       // Auto-generated (e.g., "COL00000001")
  customerId: ObjectId,       // Reference to Customer
  loanApplicationId: ObjectId,
  loanId: ObjectId,
  mutualFund: {
    fundName: String,
    fundHouse: String,
    schemeCode: String,
    folioNumber: String,
    isin: String,
    fundType: Enum,           // EQUITY, DEBT, HYBRID, LIQUID, ELSS, INDEX
    units: Number,
    navAtPledge: Number,
    currentNav: Number,
    valueAtPledge: Number,
    currentValue: Number
  },
  lienStatus: Enum,           // PENDING, MARKED, RELEASED, INVOKED
  ltv: Number,
  eligibleLoanAmount: Number,
  marginCallTriggered: Boolean,
  navHistory: [{
    nav: Number,
    value: Number,
    recordedAt: Date
  }]
}
```

### LoanApplication Schema
```javascript
{
  applicationId: String,      // Auto-generated (e.g., "LA2412000001")
  customerId: ObjectId,
  loanProductId: ObjectId,
  requestedAmount: Number,
  approvedAmount: Number,
  requestedTenureMonths: Number,
  approvedTenureMonths: Number,
  interestRate: Number,
  purpose: String,
  collaterals: [ObjectId],    // References to Collateral
  totalCollateralValue: Number,
  eligibleLoanAmount: Number,
  status: Enum,               // DRAFT, SUBMITTED, APPROVED, etc.
  statusHistory: [{
    status: String,
    changedAt: Date,
    remarks: String
  }],
  source: Enum,               // WEB, MOBILE, API
  sourcePartnerId: String,    // For fintech partners
  apiRequestId: String        // For API tracking
}
```

### Loan Schema
```javascript
{
  loanId: String,             // Auto-generated (e.g., "LN2412000001")
  applicationId: ObjectId,
  customerId: ObjectId,
  loanProductId: ObjectId,
  principalAmount: Number,
  interestRate: Number,
  tenureMonths: Number,
  emiAmount: Number,
  totalInterest: Number,
  totalPayable: Number,
  outstandingPrincipal: Number,
  totalOutstanding: Number,
  collaterals: [ObjectId],
  totalCollateralValue: Number,
  currentLtv: Number,
  repaymentSchedule: [{
    installmentNumber: Number,
    dueDate: Date,
    emiAmount: Number,
    principalComponent: Number,
    interestComponent: Number,
    outstandingAfter: Number,
    status: Enum              // PENDING, PAID, OVERDUE
  }],
  payments: [{
    paymentId: String,
    amount: Number,
    paymentDate: Date,
    paymentMode: Enum,
    referenceNumber: String
  }],
  status: Enum,               // ACTIVE, CLOSED, OVERDUE, NPA
  marginCallStatus: Enum      // NONE, TRIGGERED, RESOLVED
}
```

---

## 🚀 Setup Instructions

### Prerequisites
- Node.js >= 18.x
- MongoDB >= 6.x (local or MongoDB Atlas)
- npm or yarn

### 1. Clone the Repository
```bash
git clone <repository-url>
cd LMS
```

### 2. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create environment file
# Copy the example and modify as needed
echo "PORT=5000
MONGODB_URI=mongodb://localhost:27017/lms_db
NODE_ENV=development
API_KEY_SECRET=your-secret-api-key-for-fintech-partners" > .env

# Seed the database with sample data
npm run seed

# Start the server
npm run dev
```

### 3. Frontend Setup
```bash
# Navigate to frontend directory (from project root)
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

### 4. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **API Health Check**: http://localhost:5000/api/health

### Using Docker (Optional)
```bash
# Coming soon - Docker configuration
docker-compose up -d
```

---

## 📡 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication
For API access (fintech partners), include the following headers:
```
X-API-Key: your-api-key
X-Partner-Id: your-partner-id
```

---

### Loan Products API

#### Get All Loan Products
```http
GET /api/loan-products
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| status | string | Filter by status (ACTIVE, INACTIVE) |
| page | number | Page number (default: 1) |
| limit | number | Items per page (default: 10) |

**Response:**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "_id": "...",
        "productCode": "LAMF-EQUITY",
        "productName": "Loan Against Equity Mutual Funds",
        "interestRate": 10.5,
        "ltv": 50,
        "minLoanAmount": 50000,
        "maxLoanAmount": 10000000,
        "status": "ACTIVE"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 4,
      "pages": 1
    }
  }
}
```

#### Create Loan Product
```http
POST /api/loan-products
```

**Request Body:**
```json
{
  "productCode": "LAMF-NEW",
  "productName": "New Loan Product",
  "description": "Description here",
  "interestRate": 10.5,
  "interestType": "REDUCING_BALANCE",
  "minLoanAmount": 50000,
  "maxLoanAmount": 10000000,
  "minTenureMonths": 6,
  "maxTenureMonths": 36,
  "processingFeePercent": 1,
  "ltv": 50,
  "eligibleMutualFundTypes": ["EQUITY", "INDEX"]
}
```

---

### Customers API

#### Get All Customers
```http
GET /api/customers
```

#### Create Customer
```http
POST /api/customers
```

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "phone": "9876543210",
  "dateOfBirth": "1990-01-15",
  "panNumber": "ABCDE1234F",
  "aadharNumber": "1234-5678-9012",
  "employmentType": "SALARIED",
  "monthlyIncome": 150000,
  "address": {
    "street": "123 Main St",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001"
  },
  "bankDetails": {
    "bankName": "HDFC Bank",
    "accountNumber": "1234567890123",
    "ifscCode": "HDFC0001234",
    "accountType": "SAVINGS"
  }
}
```

---

### Loan Applications API (Important for Fintech Partners)

#### Get All Applications
```http
GET /api/loan-applications
```

#### Create New Application (API for Fintech Partners)
```http
POST /api/loan-applications
```

**Headers:**
```
Content-Type: application/json
X-API-Key: your-api-key
X-Partner-Id: PARTNER001
```

**Request Body:**
```json
{
  "customerId": "customer_object_id",
  "loanProductId": "product_object_id",
  "requestedAmount": 100000,
  "requestedTenureMonths": 12,
  "purpose": "Business expansion",
  "collaterals": [
    {
      "fundName": "HDFC Top 100 Fund",
      "fundHouse": "HDFC Mutual Fund",
      "schemeCode": "HDFC100",
      "folioNumber": "FOL123456",
      "isin": "INF179K01234",
      "fundType": "EQUITY",
      "units": 100,
      "navAtPledge": 850.25,
      "currentNav": 850.25
    }
  ],
  "source": "API"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Loan application created successfully",
  "data": {
    "application": {
      "_id": "...",
      "applicationId": "LA2412000001",
      "status": "SUBMITTED",
      "apiRequestId": "uuid-for-tracking"
    },
    "eligibility": {
      "totalCollateralValue": 85025,
      "eligibleLoanAmount": 42512.5,
      "ltv": 50,
      "interestRate": 10.5,
      "processingFee": 1000
    }
  }
}
```

#### Update Application Status
```http
PATCH /api/loan-applications/:id/status
```

**Request Body:**
```json
{
  "status": "APPROVED",
  "remarks": "Approved after verification",
  "approvedAmount": 100000,
  "approvedTenureMonths": 12
}
```

#### Disburse Loan
```http
POST /api/loan-applications/:id/disburse
```

**Request Body:**
```json
{
  "disbursementAccountNumber": "1234567890123",
  "disbursementIfsc": "HDFC0001234"
}
```

---

### Loans API

#### Get All Loans
```http
GET /api/loans
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| status | string | Filter by status (ACTIVE, OVERDUE, CLOSED) |
| customerId | string | Filter by customer |
| page | number | Page number |
| limit | number | Items per page |

#### Get Loan Details
```http
GET /api/loans/:id
```

#### Get Repayment Schedule
```http
GET /api/loans/:id/schedule
```

#### Record Payment
```http
POST /api/loans/:id/payments
```

**Request Body:**
```json
{
  "amount": 5000,
  "paymentMode": "UPI",
  "referenceNumber": "UPI123456789"
}
```

#### Get Portfolio Summary
```http
GET /api/loans/summary
```

**Response:**
```json
{
  "success": true,
  "data": {
    "byStatus": [
      { "_id": "ACTIVE", "count": 10, "totalDisbursed": 5000000, "totalOutstanding": 4500000 }
    ],
    "byProduct": [...],
    "monthlyTrend": [...]
  }
}
```

---

### Collaterals API

#### Get All Collaterals
```http
GET /api/collaterals
```

#### Update NAV
```http
PATCH /api/collaterals/:id/nav
```

**Request Body:**
```json
{
  "newNav": 875.50
}
```

#### Update Lien Status
```http
PATCH /api/collaterals/:id/lien
```

**Request Body:**
```json
{
  "lienStatus": "MARKED",
  "lienReferenceNumber": "LIEN123456"
}
```

#### Release Collateral
```http
PATCH /api/collaterals/:id/release
```

#### Get Summary by Fund Type
```http
GET /api/collaterals/summary/by-fund-type
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "EQUITY",
      "count": 5,
      "totalUnits": 500,
      "totalValue": 425125,
      "totalEligibleAmount": 212562.5
    }
  ]
}
```

#### Bulk NAV Update
```http
POST /api/collaterals/bulk-nav-update
```

**Request Body:**
```json
{
  "updates": [
    { "isin": "INF179K01234", "newNav": 860.50 },
    { "isin": "INF109K05678", "newNav": 75.25 }
  ]
}
```

---

### Partners API (Admin Only)

#### Get All Partners
```http
GET /api/partners
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| status | string | Filter by status (ACTIVE, INACTIVE, SUSPENDED, PENDING_APPROVAL) |
| businessType | string | Filter by business type |
| search | string | Search by name or company |
| page | number | Page number |
| limit | number | Items per page |

#### Create New Partner
```http
POST /api/partners
```

**Request Body:**
```json
{
  "partnerName": "QuickFinance",
  "companyName": "QuickFinance Technologies Pvt Ltd",
  "contactPerson": {
    "name": "Rajesh Kumar",
    "email": "rajesh@quickfinance.com",
    "phone": "9876543210",
    "designation": "CTO"
  },
  "businessType": "FINTECH",
  "gstNumber": "29ABCDE1234F1Z5",
  "panNumber": "ABCDE1234F",
  "webhookUrl": "https://quickfinance.com/webhooks/lms"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Partner created successfully",
  "data": {
    "partner": {
      "partnerId": "PARTNER0001",
      "partnerName": "QuickFinance",
      "status": "PENDING_APPROVAL"
    },
    "credentials": {
      "apiKey": "PARTNER0001_abc123def456...",
      "apiSecret": "xyz789uvw456...",
      "note": "Please save the API Secret securely. It will not be shown again."
    }
  }
}
```

#### Update Partner Status
```http
PATCH /api/partners/:id/status
```

**Request Body:**
```json
{
  "status": "ACTIVE",
  "reason": "Partner verification completed"
}
```

#### Regenerate API Credentials
```http
POST /api/partners/:id/regenerate-credentials
```

**Response:**
```json
{
  "success": true,
  "message": "API credentials regenerated successfully",
  "data": {
    "apiKey": "PARTNER0001_new123...",
    "apiSecret": "new456...",
    "warning": "Old credentials are now invalid. Please update your integration immediately."
  }
}
```

#### Get Partner Statistics
```http
GET /api/partners/:id/statistics
```

**Response:**
```json
{
  "success": true,
  "data": {
    "partner": {
      "partnerId": "PARTNER0001",
      "partnerName": "QuickFinance",
      "status": "ACTIVE"
    },
    "statistics": {
      "totalApplications": 150,
      "approvedApplications": 120,
      "totalDisbursed": 15000000,
      "apiCallsToday": 450,
      "apiCallsThisMonth": 12500
    },
    "applicationBreakdown": [
      { "_id": "APPROVED", "count": 120, "totalAmount": 15000000 },
      { "_id": "REJECTED", "count": 20, "totalAmount": 0 },
      { "_id": "PENDING", "count": 10, "totalAmount": 0 }
    ]
  }
}
```

#### Get Partner Dashboard
```http
GET /api/partners/dashboard
```

---

## Error Responses

All API errors follow this format:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": []  // Optional array of validation errors
  }
}
```

Common Error Codes:
| Code | HTTP Status | Description |
|------|-------------|-------------|
| VALIDATION_ERROR | 400 | Request validation failed |
| NOT_FOUND | 404 | Resource not found |
| DUPLICATE_ERROR | 400 | Duplicate entry |
| INVALID_API_KEY | 403 | Invalid API key |
| MISSING_API_KEY | 401 | API key not provided |
| PARTNER_INACTIVE | 403 | Partner account is not active |
| RATE_LIMIT_EXCEEDED | 429 | API rate limit exceeded |
| IP_NOT_WHITELISTED | 403 | IP address not authorized |
| INTERNAL_ERROR | 500 | Server error |

---

## 📸 Screenshots

### Dashboard
The dashboard provides an overview of the loan portfolio with key metrics, disbursement trends, and collateral distribution.

### Loan Products
Manage different loan products with configurable interest rates, LTV ratios, and eligible fund types.

### Create Application
Step-by-step wizard to create new loan applications with customer selection, collateral entry, and eligibility calculation.

### Ongoing Loans
Monitor active loans, track repayments, and manage margin calls.

### Collateral Management
Track pledged mutual fund units, update NAVs, and monitor portfolio health.

---

## 🔒 Security Considerations

1. **API Key Authentication**: Each partner has unique API keys stored securely
2. **Partner Management**: Admin can approve, suspend, or revoke partner access
3. **Rate Limiting**: Per-partner rate limits (requests per minute/day)
4. **IP Whitelisting**: Optional IP-based access control
5. **Input Validation**: All inputs are validated using express-validator
6. **Helmet.js**: Security headers configured
7. **CORS**: Configured for allowed origins
8. **Audit Trail**: All partner actions and credential changes are logged

---

## 📝 License

MIT License - See LICENSE file for details.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📧 Support

For questions or issues, please open a GitHub issue or contact the development team.

