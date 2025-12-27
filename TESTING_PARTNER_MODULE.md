# Testing the Partner Management Module

## 🧪 Step-by-Step Testing Guide

Follow these steps to test the newly implemented Partner Management module.

---

## Prerequisites

1. ✅ MongoDB running
2. ✅ Backend server running (`npm run dev` in backend folder)
3. ✅ Frontend server running (`npm run dev` in frontend folder)
4. ✅ Database seeded with sample data

---

## Step 1: Seed the Database

Run the seed script to create sample partners with API keys:

```bash
cd backend
node seed/seedData.js
```

**Expected Output:**
```
Created partner: QuickFinance (PARTNER0001)
  API Key: PARTNER0001_abc123...
  API Secret: xyz789...
Created partner: LoanAggregator (PARTNER0002)
  API Key: PARTNER0002_def456...
  API Secret: uvw123...
Created partner: TestPartner (PARTNER0003)
  API Key: PARTNER0003_ghi789...
  API Secret: rst456...
```

**📝 Note:** Save these API keys! You'll need them for testing.

---

## Step 2: Test Partner Management UI

### 2.1 Access Partner Management Page

1. Open frontend: `http://localhost:5173`
2. Navigate to **"API Partners"** in the sidebar
3. You should see the list of 3 partners

**✅ Verify:**
- Partner list displays correctly
- Status badges show correct colors
- Statistics are visible

### 2.2 Create New Partner

1. Click **"+ Add New Partner"** button
2. Fill in the form:
   ```
   Partner Name: TestFintech
   Company Name: TestFintech Solutions Pvt Ltd
   Contact Name: Jane Smith
   Contact Email: jane@testfintech.com
   Contact Phone: 9999888877
   Business Type: FINTECH
   ```
3. Click **"Create Partner"**

**✅ Verify:**
- Success notification appears
- Credentials modal shows API Key and Secret
- New partner appears in the list with status "PENDING_APPROVAL"

**📝 Important:** Copy the API Secret - it won't be shown again!

### 2.3 Approve Partner

1. Find the newly created partner in the list
2. Click **"Approve"** button
3. Status should change to **"ACTIVE"**

**✅ Verify:**
- Status badge turns green
- Partner can now use the API

### 2.4 Test Partner Actions

**Suspend Partner:**
1. Click **"Suspend"** on an active partner
2. Status changes to "SUSPENDED"

**Regenerate Credentials:**
1. Click **"Regenerate Key"** button
2. Confirm the action
3. New credentials are displayed
4. Old credentials are now invalid

**View Statistics:**
1. Click **"Stats"** button
2. View partner's usage statistics

---

## Step 3: Test API Authentication

### 3.1 Test with Valid API Key

Using the API key from QuickFinance (PARTNER0001):

```bash
curl -X GET http://localhost:5000/api/loan-products \
  -H "X-API-Key: PARTNER0001_[your-api-key]" \
  -H "X-Partner-Id: PARTNER0001" \
  -H "Content-Type: application/json"
```

**✅ Expected:** 200 OK with list of loan products

### 3.2 Test with Missing API Key

```bash
curl -X GET http://localhost:5000/api/loan-products \
  -H "Content-Type: application/json"
```

**✅ Expected:** 401 Error
```json
{
  "success": false,
  "error": {
    "code": "MISSING_API_KEY",
    "message": "API key is required. Please provide X-API-Key header."
  }
}
```

### 3.3 Test with Invalid API Key

```bash
curl -X GET http://localhost:5000/api/loan-products \
  -H "X-API-Key: INVALID_KEY_123" \
  -H "Content-Type: application/json"
```

**✅ Expected:** 403 Error
```json
{
  "success": false,
  "error": {
    "code": "INVALID_API_KEY",
    "message": "Invalid API key provided."
  }
}
```

### 3.4 Test with Suspended Partner

1. Suspend a partner via UI
2. Try to make API call with their key

**✅ Expected:** 403 Error
```json
{
  "success": false,
  "error": {
    "code": "PARTNER_INACTIVE",
    "message": "Partner account is SUSPENDED. Please contact administrator."
  }
}
```

---

## Step 4: Test Loan Application Creation via API

### 4.1 Get Customer ID

First, get a customer ID from the database:

```bash
curl -X GET http://localhost:5000/api/customers \
  -H "X-API-Key: PARTNER0001_[your-api-key]" \
  -H "X-Partner-Id: PARTNER0001"
```

Copy a `customerId` from the response.

### 4.2 Get Loan Product ID

```bash
curl -X GET http://localhost:5000/api/loan-products?status=ACTIVE \
  -H "X-API-Key: PARTNER0001_[your-api-key]" \
  -H "X-Partner-Id: PARTNER0001"
```

Copy a `_id` from the response.

### 4.3 Create Loan Application

```bash
curl -X POST http://localhost:5000/api/loan-applications \
  -H "X-API-Key: PARTNER0001_[your-api-key]" \
  -H "X-Partner-Id: PARTNER0001" \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "[customer-id-from-step-4.1]",
    "loanProductId": "[product-id-from-step-4.2]",
    "requestedAmount": 100000,
    "requestedTenureMonths": 12,
    "purpose": "Business expansion via API",
    "collaterals": [{
      "fundName": "HDFC Top 100 Fund",
      "fundHouse": "HDFC Mutual Fund",
      "schemeCode": "HDFC100",
      "folioNumber": "FOL123456",
      "isin": "INF179K01234",
      "fundType": "EQUITY",
      "units": 100,
      "navAtPledge": 850.25,
      "currentNav": 850.25
    }],
    "source": "API"
  }'
```

**✅ Expected:** 201 Created
```json
{
  "success": true,
  "message": "Loan application created successfully",
  "data": {
    "application": {
      "applicationId": "LA2412000001",
      "source": "API",
      "sourcePartnerId": "PARTNER0001",
      "apiRequestId": "uuid-here",
      "status": "SUBMITTED"
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

### 4.4 Verify Application in UI

1. Go to **"Applications"** page in frontend
2. Find the newly created application
3. Verify:
   - Source shows "API"
   - Partner ID is "PARTNER0001"
   - Status is "SUBMITTED"

---

## Step 5: Test Partner Statistics

### 5.1 View Statistics in UI

1. Go to **"API Partners"** page
2. Click **"Stats"** button on QuickFinance
3. Verify statistics show the application you just created

### 5.2 View Statistics via API

```bash
curl -X GET http://localhost:5000/api/partners/[partner-id]/statistics \
  -H "Content-Type: application/json"
```

**✅ Expected:** Statistics with application counts

---

## Step 6: Test Rate Limiting (Optional)

### 6.1 Rapid Fire Requests

Create a script to make rapid requests:

```javascript
// test-rate-limit.js
const axios = require('axios');

const apiKey = 'PARTNER0001_your-api-key';
const baseURL = 'http://localhost:5000/api';

async function testRateLimit() {
  for (let i = 0; i < 70; i++) {
    try {
      await axios.get(`${baseURL}/loan-products`, {
        headers: {
          'X-API-Key': apiKey,
          'X-Partner-Id': 'PARTNER0001'
        }
      });
      console.log(`Request ${i + 1}: Success`);
    } catch (error) {
      console.log(`Request ${i + 1}: ${error.response?.status} - ${error.response?.data?.error?.message}`);
    }
  }
}

testRateLimit();
```

Run: `node test-rate-limit.js`

**✅ Expected:** After 60 requests (default limit), you should see 429 errors

---

## Step 7: Test Partner Management APIs

### 7.1 Get All Partners

```bash
curl -X GET http://localhost:5000/api/partners
```

### 7.2 Get Partner Dashboard

```bash
curl -X GET http://localhost:5000/api/partners/dashboard
```

### 7.3 Filter Partners

```bash
curl -X GET "http://localhost:5000/api/partners?status=ACTIVE&businessType=FINTECH"
```

---

## Step 8: Integration Testing

### 8.1 Full Flow Test

1. Create partner via UI → Get API key
2. Approve partner → Status becomes ACTIVE
3. Use API key to create customer
4. Use API key to create loan application
5. Check statistics update
6. Suspend partner
7. Verify API calls fail
8. Reactivate partner
9. Verify API calls work again

---

## 🐛 Common Issues & Solutions

### Issue 1: "MISSING_API_KEY" error

**Solution:** Make sure you're including the `X-API-Key` header in your request.

### Issue 2: "INVALID_API_KEY" error

**Solution:** 
- Check if you copied the full API key
- Verify partner status is ACTIVE
- Check if credentials were regenerated

### Issue 3: Partner not found in database

**Solution:** Run the seed script again: `node seed/seedData.js`

### Issue 4: Frontend not showing partners

**Solution:** 
- Check backend is running
- Check MongoDB is running
- Check browser console for errors
- Verify API endpoint is correct

### Issue 5: Rate limit not working

**Solution:** Rate limit is per-minute. Wait a minute and try again.

---

## ✅ Testing Checklist

### UI Testing
- [ ] Partner list displays correctly
- [ ] Create new partner works
- [ ] API credentials are generated and displayed
- [ ] Approve partner changes status
- [ ] Suspend partner works
- [ ] Regenerate credentials works
- [ ] Statistics display correctly
- [ ] Filters work (status, business type, search)

### API Testing
- [ ] Valid API key allows access
- [ ] Invalid API key is rejected
- [ ] Missing API key is rejected
- [ ] Suspended partner is blocked
- [ ] Loan application creation works
- [ ] Application has correct sourcePartnerId
- [ ] Statistics update correctly

### Security Testing
- [ ] API secret only shown once
- [ ] Old credentials invalid after regeneration
- [ ] Rate limiting works
- [ ] Partner status enforced

### Integration Testing
- [ ] End-to-end flow works
- [ ] Multiple partners can work simultaneously
- [ ] Statistics track correctly per partner

---

## 📊 Test Results Template

```
Date: ___________
Tester: ___________

UI Tests:
- Partner Management Page: ✅/❌
- Create Partner: ✅/❌
- Approve/Suspend: ✅/❌
- Regenerate Credentials: ✅/❌
- Statistics: ✅/❌

API Tests:
- Authentication: ✅/❌
- Create Application: ✅/❌
- Rate Limiting: ✅/❌
- Error Handling: ✅/❌

Integration Tests:
- Full Flow: ✅/❌
- Multi-Partner: ✅/❌

Notes:
_______________________
_______________________
```

---

## 🎉 Success Criteria

All tests should pass with:
- ✅ No console errors
- ✅ Proper error messages
- ✅ Data persists in database
- ✅ UI updates correctly
- ✅ API responses are correct
- ✅ Security measures work

---

**Happy Testing! 🚀**

If you encounter any issues, check the logs in:
- Backend: Terminal where backend is running
- Frontend: Browser console (F12)
- MongoDB: Check database directly using MongoDB Compass

