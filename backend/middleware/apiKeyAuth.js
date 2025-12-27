/**
 * API Key Authentication Middleware
 * For fintech partners to access the API
 */

const Partner = require('../models/Partner');

const apiKeyAuth = async (req, res, next) => {
  const apiKey = req.headers['x-api-key'];

  // Skip API key check for web/mobile requests (they use session-based auth)
  if (req.headers['x-source'] === 'WEB' || req.headers['x-source'] === 'MOBILE') {
    return next();
  }

  // For API requests, validate the API key
  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'MISSING_API_KEY',
        message: 'API key is required. Please provide X-API-Key header.'
      }
    });
  }

  try {
    // Find partner by API key
    const partner = await Partner.findOne({ apiKey });

    if (!partner) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'INVALID_API_KEY',
          message: 'Invalid API key provided.'
        }
      });
    }

    // Check if partner is active
    if (partner.status !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'PARTNER_INACTIVE',
          message: `Partner account is ${partner.status}. Please contact administrator.`
        }
      });
    }

    // Check rate limits
    const rateLimitCheck = partner.canMakeApiCall();
    if (!rateLimitCheck.allowed) {
      return res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: rateLimitCheck.reason
        }
      });
    }

    // Optional: Check IP whitelist
    if (partner.ipWhitelist && partner.ipWhitelist.length > 0) {
      const clientIp = req.ip || req.connection.remoteAddress;
      if (!partner.ipWhitelist.includes(clientIp)) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'IP_NOT_WHITELISTED',
            message: 'Your IP address is not authorized to access this API.'
          }
        });
      }
    }

    // Increment API usage statistics (async, don't wait)
    partner.incrementApiUsage().catch(err => {
      console.error('Error incrementing API usage:', err);
    });

    // Attach partner info to request
    req.source = 'API';
    req.partnerId = partner.partnerId;
    req.partner = partner;

    next();
  } catch (error) {
    console.error('API Key Auth Error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'AUTH_ERROR',
        message: 'Error validating API credentials.'
      }
    });
  }
};

module.exports = apiKeyAuth;

