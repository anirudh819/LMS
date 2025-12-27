# Partner Integration Guide

## 🤝 Welcome Fintech Partners!

This guide will help you integrate with our Loan Management System (LMS) API to create loan applications programmatically.

---

## 📋 Table of Contents

1. [Getting Started](#getting-started)
2. [Authentication](#authentication)
3. [API Endpoints](#api-endpoints)
4. [Integration Examples](#integration-examples)
5. [Error Handling](#error-handling)
6. [Best Practices](#best-practices)
7. [Support](#support)

---

## 🚀 Getting Started

### Step 1: Get Your API Credentials

Contact our admin team to get your partner account created. You will receive:

- **Partner ID**: Your unique identifier (e.g., `PARTNER0001`)
- **API Key**: Used for authentication (e.g., `PARTNER0001_abc123...`)
- **API Secret**: Keep this secure! (e.g., `xyz789...`)

⚠️ **Important**: Store your API Secret securely. It will only be shown once during creation.

### Step 2: Set Up Your Environment

Store your credentials as environment variables:

```bash
# .env file
LMS_API_KEY=PARTNER0001_abc123def456...
LMS_API_SECRET=xyz789uvw456...
LMS_API_URL=https://your-lms-domain.com/api
```

### Step 3: Test Your Connection

```bash
curl -X GET https://your-lms-domain.com/api/health \
  -H "X-API-Key: YOUR_API_KEY"
```

---

## 🔐 Authentication

All API requests must include the following headers:

```http
X-API-Key: YOUR_API_KEY
X-Partner-Id: YOUR_PARTNER_ID (optional but recommended)
Content-Type: application/json
```

### Example Request Headers

```javascript
{
  "X-API-Key": "PARTNER0001_abc123def456...",
  "X-Partner-Id": "PARTNER0001",
  "Content-Type": "application/json"
}
```

---

## 📡 API Endpoints

### Base URL

```
Production: https://your-lms-domain.com/api
Staging: https://staging-lms-domain.com/api
```

### 1. Create Loan Application

**Endpoint:** `POST /loan-applications`

**Description:** Create a new loan application on behalf of your customer.

**Request Body:**

```json
{
  "customerId": "675e0123456789abcdef0001",
  "loanProductId": "675e0123456789abcdef0002",
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
      "_id": "675e0123456789abcdef0003",
      "applicationId": "LA2412000001",
      "customerId": {
        "_id": "675e0123456789abcdef0001",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com"
      },
      "status": "SUBMITTED",
      "requestedAmount": 100000,
      "requestedTenureMonths": 12,
      "source": "API",
      "sourcePartnerId": "PARTNER0001",
      "apiRequestId": "uuid-for-tracking",
      "submittedAt": "2024-12-27T10:00:00.000Z"
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

### 2. Get Application Status

**Endpoint:** `GET /loan-applications/:id`

**Description:** Check the status of a loan application.

**Response:**

```json
{
  "success": true,
  "data": {
    "applicationId": "LA2412000001",
    "status": "APPROVED",
    "approvedAmount": 100000,
    "approvedTenureMonths": 12,
    "statusHistory": [
      {
        "status": "SUBMITTED",
        "changedAt": "2024-12-27T10:00:00.000Z"
      },
      {
        "status": "UNDER_REVIEW",
        "changedAt": "2024-12-27T11:00:00.000Z"
      },
      {
        "status": "APPROVED",
        "changedAt": "2024-12-27T14:00:00.000Z",
        "remarks": "Approved after verification"
      }
    ]
  }
}
```

### 3. Get All Your Applications

**Endpoint:** `GET /loan-applications?sourcePartnerId=YOUR_PARTNER_ID`

**Description:** Retrieve all applications created by your organization.

### 4. Get Available Loan Products

**Endpoint:** `GET /loan-products?status=ACTIVE`

**Description:** Get list of active loan products you can offer to customers.

### 5. Create Customer (if needed)

**Endpoint:** `POST /customers`

**Description:** Create a customer record before creating their loan application.

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

## 💻 Integration Examples

### Node.js / Express

```javascript
const axios = require('axios');

class LMSClient {
  constructor(apiKey, partnerId, baseURL) {
    this.apiKey = apiKey;
    this.partnerId = partnerId;
    this.baseURL = baseURL;
  }

  async createLoanApplication(applicationData) {
    try {
      const response = await axios.post(
        `${this.baseURL}/loan-applications`,
        {
          ...applicationData,
          source: 'API'
        },
        {
          headers: {
            'X-API-Key': this.apiKey,
            'X-Partner-Id': this.partnerId,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error creating loan application:', error.response?.data);
      throw error;
    }
  }

  async getApplicationStatus(applicationId) {
    try {
      const response = await axios.get(
        `${this.baseURL}/loan-applications/${applicationId}`,
        {
          headers: {
            'X-API-Key': this.apiKey,
            'X-Partner-Id': this.partnerId
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error fetching application:', error.response?.data);
      throw error;
    }
  }
}

// Usage
const lmsClient = new LMSClient(
  process.env.LMS_API_KEY,
  process.env.LMS_PARTNER_ID,
  process.env.LMS_API_URL
);

// Create application
const application = await lmsClient.createLoanApplication({
  customerId: '675e0123456789abcdef0001',
  loanProductId: '675e0123456789abcdef0002',
  requestedAmount: 100000,
  requestedTenureMonths: 12,
  purpose: 'Business expansion',
  collaterals: [/* ... */]
});

console.log('Application created:', application.data.application.applicationId);
```

### Python

```python
import requests
import os

class LMSClient:
    def __init__(self, api_key, partner_id, base_url):
        self.api_key = api_key
        self.partner_id = partner_id
        self.base_url = base_url
        self.headers = {
            'X-API-Key': api_key,
            'X-Partner-Id': partner_id,
            'Content-Type': 'application/json'
        }

    def create_loan_application(self, application_data):
        application_data['source'] = 'API'
        
        response = requests.post(
            f'{self.base_url}/loan-applications',
            json=application_data,
            headers=self.headers
        )
        
        response.raise_for_status()
        return response.json()

    def get_application_status(self, application_id):
        response = requests.get(
            f'{self.base_url}/loan-applications/{application_id}',
            headers=self.headers
        )
        
        response.raise_for_status()
        return response.json()

# Usage
lms_client = LMSClient(
    api_key=os.getenv('LMS_API_KEY'),
    partner_id=os.getenv('LMS_PARTNER_ID'),
    base_url=os.getenv('LMS_API_URL')
)

# Create application
application = lms_client.create_loan_application({
    'customerId': '675e0123456789abcdef0001',
    'loanProductId': '675e0123456789abcdef0002',
    'requestedAmount': 100000,
    'requestedTenureMonths': 12,
    'purpose': 'Business expansion',
    'collaterals': [
        # ... collateral data
    ]
})

print(f"Application created: {application['data']['application']['applicationId']}")
```

### PHP

```php
<?php

class LMSClient {
    private $apiKey;
    private $partnerId;
    private $baseURL;

    public function __construct($apiKey, $partnerId, $baseURL) {
        $this->apiKey = $apiKey;
        $this->partnerId = $partnerId;
        $this->baseURL = $baseURL;
    }

    public function createLoanApplication($applicationData) {
        $applicationData['source'] = 'API';
        
        $ch = curl_init($this->baseURL . '/loan-applications');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($applicationData));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'X-API-Key: ' . $this->apiKey,
            'X-Partner-Id: ' . $this->partnerId,
            'Content-Type: application/json'
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode !== 201) {
            throw new Exception('API Error: ' . $response);
        }

        return json_decode($response, true);
    }
}

// Usage
$lmsClient = new LMSClient(
    getenv('LMS_API_KEY'),
    getenv('LMS_PARTNER_ID'),
    getenv('LMS_API_URL')
);

$application = $lmsClient->createLoanApplication([
    'customerId' => '675e0123456789abcdef0001',
    'loanProductId' => '675e0123456789abcdef0002',
    'requestedAmount' => 100000,
    'requestedTenureMonths' => 12,
    'purpose' => 'Business expansion',
    'collaterals' => [
        // ... collateral data
    ]
]);

echo "Application created: " . $application['data']['application']['applicationId'];
?>
```

---

## ⚠️ Error Handling

### Common Error Responses

#### 1. Missing API Key (401)

```json
{
  "success": false,
  "error": {
    "code": "MISSING_API_KEY",
    "message": "API key is required. Please provide X-API-Key header."
  }
}
```

#### 2. Invalid API Key (403)

```json
{
  "success": false,
  "error": {
    "code": "INVALID_API_KEY",
    "message": "Invalid API key provided."
  }
}
```

#### 3. Partner Inactive (403)

```json
{
  "success": false,
  "error": {
    "code": "PARTNER_INACTIVE",
    "message": "Partner account is SUSPENDED. Please contact administrator."
  }
}
```

#### 4. Rate Limit Exceeded (429)

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Daily rate limit exceeded"
  }
}
```

#### 5. Validation Error (400)

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "requestedAmount",
        "message": "Requested amount must be positive"
      }
    ]
  }
}
```

### Error Handling Best Practices

```javascript
try {
  const application = await lmsClient.createLoanApplication(data);
  // Success
} catch (error) {
  if (error.response) {
    const { status, data } = error.response;
    
    switch (status) {
      case 401:
      case 403:
        // Authentication/Authorization error
        console.error('Auth error:', data.error.message);
        // Maybe refresh credentials or alert admin
        break;
      
      case 429:
        // Rate limit exceeded
        console.error('Rate limit exceeded, retry later');
        // Implement exponential backoff
        break;
      
      case 400:
        // Validation error
        console.error('Validation error:', data.error.details);
        // Show errors to user
        break;
      
      default:
        console.error('API error:', data.error.message);
    }
  } else {
    // Network error
    console.error('Network error:', error.message);
  }
}
```

---

## ✅ Best Practices

### 1. Security

- ✅ Store API credentials in environment variables, never in code
- ✅ Use HTTPS for all API calls
- ✅ Rotate API keys periodically
- ✅ Implement proper error handling
- ✅ Log API calls for audit purposes

### 2. Rate Limiting

- ✅ Respect rate limits (check your partner dashboard)
- ✅ Implement exponential backoff for retries
- ✅ Cache responses when appropriate
- ✅ Batch requests when possible

### 3. Data Validation

- ✅ Validate data on your side before sending to API
- ✅ Handle validation errors gracefully
- ✅ Provide clear error messages to your users

### 4. Monitoring

- ✅ Monitor API response times
- ✅ Track success/failure rates
- ✅ Set up alerts for API errors
- ✅ Log all API interactions

### 5. Testing

- ✅ Test in staging environment first
- ✅ Test error scenarios
- ✅ Test with various data combinations
- ✅ Implement automated tests

---

## 📊 Webhooks (Optional)

If you've configured a webhook URL, we'll send notifications for important events:

### Webhook Events

- `APPLICATION_CREATED` - When application is created
- `APPLICATION_APPROVED` - When application is approved
- `APPLICATION_REJECTED` - When application is rejected
- `LOAN_DISBURSED` - When loan is disbursed
- `PAYMENT_RECEIVED` - When payment is received

### Webhook Payload Example

```json
{
  "event": "APPLICATION_APPROVED",
  "timestamp": "2024-12-27T14:00:00.000Z",
  "partnerId": "PARTNER0001",
  "data": {
    "applicationId": "LA2412000001",
    "customerId": "675e0123456789abcdef0001",
    "approvedAmount": 100000,
    "approvedTenureMonths": 12,
    "interestRate": 10.5
  }
}
```

---

## 🆘 Support

### Documentation

- API Documentation: [Link to API docs]
- Partner Portal: [Link to partner dashboard]

### Contact

- **Technical Support**: tech-support@lms.com
- **Business Queries**: partnerships@lms.com
- **Emergency**: +91-XXXX-XXXXXX

### SLA

- API Uptime: 99.9%
- Support Response Time: 24 hours
- Critical Issues: 4 hours

---

## 📝 Changelog

### Version 1.0.0 (December 2024)

- Initial release
- Create loan application API
- Partner management system
- Rate limiting
- Webhook support

---

## 🔗 Quick Links

- [Main Documentation](README.md)
- [API Reference](README.md#api-documentation)
- [Partner Dashboard](#) (Login required)
- [Status Page](#)

---

**Happy Integration! 🚀**

For any questions or issues, please reach out to our support team.

