const Partner = require('../models/Partner');

/**
 * @desc    Get all partners
 * @route   GET /api/partners
 * @access  Admin
 */
const getAllPartners = async (req, res, next) => {
  try {
    const { 
      status, 
      businessType,
      page = 1, 
      limit = 10,
      search 
    } = req.query;

    // Build query
    const query = {};
    
    if (status) {
      query.status = status;
    }
    
    if (businessType) {
      query.businessType = businessType;
    }
    
    if (search) {
      query.$or = [
        { partnerName: { $regex: search, $options: 'i' } },
        { companyName: { $regex: search, $options: 'i' } },
        { partnerId: { $regex: search, $options: 'i' } }
      ];
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const partners = await Partner.find(query)
      .select('-apiSecret') // Don't send API secret
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Partner.countDocuments(query);

    res.json({
      success: true,
      data: {
        partners,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit),
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get partner by ID
 * @route   GET /api/partners/:id
 * @access  Admin
 */
const getPartnerById = async (req, res, next) => {
  try {
    const partner = await Partner.findById(req.params.id)
      .select('-apiSecret'); // Don't send full API secret

    if (!partner) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PARTNER_NOT_FOUND',
          message: 'Partner not found'
        }
      });
    }

    res.json({
      success: true,
      data: partner
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new partner
 * @route   POST /api/partners
 * @access  Admin
 */
const createPartner = async (req, res, next) => {
  try {
    const {
      partnerName,
      companyName,
      contactPerson,
      address,
      businessType,
      gstNumber,
      panNumber,
      permissions,
      rateLimit,
      commission,
      contractStartDate,
      contractEndDate,
      webhookUrl,
      webhookEvents,
      ipWhitelist,
      notes
    } = req.body;

    // Check if partner with same company name already exists
    const existingPartner = await Partner.findOne({ 
      companyName: { $regex: new RegExp(`^${companyName}$`, 'i') }
    });

    if (existingPartner) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'PARTNER_EXISTS',
          message: 'A partner with this company name already exists'
        }
      });
    }

    // Create partner
    const partner = new Partner({
      partnerName,
      companyName,
      contactPerson,
      address,
      businessType,
      gstNumber,
      panNumber,
      permissions,
      rateLimit,
      commission,
      contractStartDate,
      contractEndDate,
      webhookUrl,
      webhookEvents,
      ipWhitelist,
      notes,
      createdBy: req.user?.email || 'admin' // Assuming you have user auth
    });

    // Generate API credentials
    const credentials = partner.generateApiCredentials();

    await partner.save();

    res.status(201).json({
      success: true,
      message: 'Partner created successfully',
      data: {
        partner,
        credentials: {
          apiKey: credentials.apiKey,
          apiSecret: credentials.apiSecret,
          note: 'Please save the API Secret securely. It will not be shown again.'
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update partner
 * @route   PUT /api/partners/:id
 * @access  Admin
 */
const updatePartner = async (req, res, next) => {
  try {
    const partner = await Partner.findById(req.params.id);

    if (!partner) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PARTNER_NOT_FOUND',
          message: 'Partner not found'
        }
      });
    }

    // Update allowed fields
    const allowedUpdates = [
      'partnerName',
      'companyName',
      'contactPerson',
      'address',
      'businessType',
      'gstNumber',
      'panNumber',
      'permissions',
      'rateLimit',
      'commission',
      'contractStartDate',
      'contractEndDate',
      'webhookUrl',
      'webhookEvents',
      'ipWhitelist',
      'notes'
    ];

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        partner[field] = req.body[field];
      }
    });

    partner.updatedBy = req.user?.email || 'admin';
    await partner.save();

    res.json({
      success: true,
      message: 'Partner updated successfully',
      data: partner
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update partner status
 * @route   PATCH /api/partners/:id/status
 * @access  Admin
 */
const updatePartnerStatus = async (req, res, next) => {
  try {
    const { status, reason } = req.body;

    const partner = await Partner.findById(req.params.id);

    if (!partner) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PARTNER_NOT_FOUND',
          message: 'Partner not found'
        }
      });
    }

    const oldStatus = partner.status;
    partner.status = status;

    // If approving, set approval details
    if (status === 'ACTIVE' && oldStatus === 'PENDING_APPROVAL') {
      partner.approvedBy = req.user?.email || 'admin';
      partner.approvedAt = new Date();
    }

    if (reason) {
      partner.notes = (partner.notes || '') + `\n[${new Date().toISOString()}] Status changed from ${oldStatus} to ${status}: ${reason}`;
    }

    await partner.save();

    res.json({
      success: true,
      message: `Partner status updated to ${status}`,
      data: partner
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Regenerate partner API credentials
 * @route   POST /api/partners/:id/regenerate-credentials
 * @access  Admin
 */
const regenerateCredentials = async (req, res, next) => {
  try {
    const partner = await Partner.findById(req.params.id);

    if (!partner) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PARTNER_NOT_FOUND',
          message: 'Partner not found'
        }
      });
    }

    // Generate new credentials
    const credentials = partner.regenerateCredentials();
    partner.notes = (partner.notes || '') + `\n[${new Date().toISOString()}] API credentials regenerated by ${req.user?.email || 'admin'}`;
    
    await partner.save();

    res.json({
      success: true,
      message: 'API credentials regenerated successfully',
      data: {
        apiKey: credentials.apiKey,
        apiSecret: credentials.apiSecret,
        warning: 'Old credentials are now invalid. Please update your integration immediately.'
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get partner statistics
 * @route   GET /api/partners/:id/statistics
 * @access  Admin
 */
const getPartnerStatistics = async (req, res, next) => {
  try {
    const partner = await Partner.findById(req.params.id);

    if (!partner) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PARTNER_NOT_FOUND',
          message: 'Partner not found'
        }
      });
    }

    // Get detailed statistics from loan applications
    const LoanApplication = require('../models/LoanApplication');
    
    const applicationStats = await LoanApplication.aggregate([
      { $match: { sourcePartnerId: partner.partnerId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$requestedAmount' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        partner: {
          partnerId: partner.partnerId,
          partnerName: partner.partnerName,
          status: partner.status
        },
        statistics: partner.statistics,
        applicationBreakdown: applicationStats,
        commission: partner.commission
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete partner (soft delete by setting status to INACTIVE)
 * @route   DELETE /api/partners/:id
 * @access  Admin
 */
const deletePartner = async (req, res, next) => {
  try {
    const partner = await Partner.findById(req.params.id);

    if (!partner) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PARTNER_NOT_FOUND',
          message: 'Partner not found'
        }
      });
    }

    // Soft delete - set status to INACTIVE
    partner.status = 'INACTIVE';
    partner.notes = (partner.notes || '') + `\n[${new Date().toISOString()}] Partner deleted by ${req.user?.email || 'admin'}`;
    await partner.save();

    res.json({
      success: true,
      message: 'Partner deactivated successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get partner dashboard summary
 * @route   GET /api/partners/dashboard
 * @access  Admin
 */
const getPartnerDashboard = async (req, res, next) => {
  try {
    // Get counts by status
    const statusCounts = await Partner.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get top performing partners
    const topPartners = await Partner.find({ status: 'ACTIVE' })
      .sort({ 'statistics.totalDisbursed': -1 })
      .limit(5)
      .select('partnerId partnerName statistics');

    // Get recent partners
    const recentPartners = await Partner.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('partnerId partnerName status createdAt');

    const totalPartners = await Partner.countDocuments();
    const activePartners = await Partner.countDocuments({ status: 'ACTIVE' });

    res.json({
      success: true,
      data: {
        summary: {
          total: totalPartners,
          active: activePartners,
          byStatus: statusCounts
        },
        topPartners,
        recentPartners
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllPartners,
  getPartnerById,
  createPartner,
  updatePartner,
  updatePartnerStatus,
  regenerateCredentials,
  getPartnerStatistics,
  deletePartner,
  getPartnerDashboard
};

