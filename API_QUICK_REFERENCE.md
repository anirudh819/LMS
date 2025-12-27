# API Quick Reference Card

## 🔑 Authentication

```http
X-API-Key: YOUR_API_KEY
X-Partner-Id: YOUR_PARTNER_ID
Content-Type: application/json
```

---

## 📡 Base URLs

```
Production: https://your-domain.com/api
Staging: https://staging.your-domain.com/api
```

---

## 🚀 Quick Start

### 1. Create Customer (if new)

```bash
POST /customers
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "9876543210",
  "panNumber": "ABCDE1234F",
  "monthlyIncome": 150000
}
```

### 2. Get Loan Products

```bash
GET /loan-products?status=ACTIVE
```

### 3. Create Loan Application

```bash
POST /loan-applications
{
  "customerId": "customer_id",
  "loanProductId": "product_id",
  "requestedAmount": 100000,
  "requestedTenureMonths": 12,
  "purpose": "Business expansion",
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
}
```

### 4. Check Application Status

```bash
GET /loan-applications/:id
```

---

## ⚠️ Common Errors

| Status | Code | Meaning |
|--------|------|---------|
| 401 | MISSING_API_KEY | Add X-API-Key header |
| 403 | INVALID_API_KEY | Check your API key |
| 403 | PARTNER_INACTIVE | Contact admin |
| 429 | RATE_LIMIT_EXCEEDED | Slow down requests |
| 400 | VALIDATION_ERROR | Check request body |

---

## 📊 Rate Limits

- **Per Minute:** 60 requests (default)
- **Per Day:** 10,000 requests (default)

Check your partner dashboard for your specific limits.

---

## 🔗 Resources

- [Full API Documentation](README.md#api-documentation)
- [Integration Guide](PARTNER_INTEGRATION_GUIDE.md)
- [Partner Dashboard](#) (Login required)

---

## 💡 Tips

✅ Store credentials in environment variables  
✅ Always use HTTPS  
✅ Implement retry logic with exponential backoff  
✅ Log all API calls for debugging  
✅ Test in staging first  

---

## 📞 Support

**Technical:** tech-support@lms.com  
**Business:** partnerships@lms.com  
**Emergency:** +91-XXXX-XXXXXX

---

**Need help?** Check [PARTNER_INTEGRATION_GUIDE.md](PARTNER_INTEGRATION_GUIDE.md) for detailed examples in Node.js, Python, and PHP.

