/**
 * API Key Authentication Middleware
 * For fintech partners to access the API
 */

const apiKeyAuth = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  const apiSecret = process.env.API_KEY_SECRET || 'demo-api-key-for-fintech-partners';

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

  // In production, you would validate against a database of partner API keys
  // For demo purposes, we're using a simple check
  if (apiKey !== apiSecret) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'INVALID_API_KEY',
        message: 'Invalid API key provided.'
      }
    });
  }

  // Mark request as API source
  req.source = 'API';
  req.partnerId = req.headers['x-partner-id'] || 'UNKNOWN';
  
  next();
};

module.exports = apiKeyAuth;

