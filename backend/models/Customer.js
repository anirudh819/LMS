const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
    customerId: {
        type: String,
        unique: true,
        sparse: true // Allows null values while maintaining uniqueness
    },
    firstName: {
        type: String,
        required: true,
        trim: true
    },
    lastName: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    phone: {
        type: String,
        required: true
    },
    dateOfBirth: {
        type: Date,
        required: true
    },
    panNumber: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        match: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/
    },
    aadharNumber: {
        type: String,
        required: true
    },
    address: {
        street: String,
        city: String,
        state: String,
        pincode: String,
        country: { type: String, default: 'India' }
    },
    employmentType: {
        type: String,
        enum: ['SALARIED', 'SELF_EMPLOYED', 'BUSINESS', 'PROFESSIONAL', 'RETIRED', 'OTHER'],
        required: true
    },
    monthlyIncome: {
        type: Number,
        required: true
    },
    bankDetails: {
        bankName: String,
        accountNumber: String,
        ifscCode: String,
        accountType: {
            type: String,
            enum: ['SAVINGS', 'CURRENT']
        }
    },
    kycStatus: {
        type: String,
        enum: ['PENDING', 'IN_PROGRESS', 'VERIFIED', 'REJECTED'],
        default: 'PENDING'
    },
    riskProfile: {
        type: String,
        enum: ['LOW', 'MODERATE', 'HIGH'],
        default: 'MODERATE'
    },
    status: {
        type: String,
        enum: ['ACTIVE', 'INACTIVE', 'BLOCKED'],
        default: 'ACTIVE'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Generate customer ID before saving
customerSchema.pre('save', async function(next) {
    if (!this.customerId) {
        const count = await this.constructor.countDocuments();
        this.customerId = `CUST${String(count + 1).padStart(6, '0')}`;
    }
    next();
});

// Index for faster queries
customerSchema.index({ panNumber: 1, email: 1, customerId: 1 });

module.exports = mongoose.model('Customer', customerSchema);