const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    filename: {
        type: String,
        required: true
    },
    filePath: {
        type: String,
        required: true
    },
    tenantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tenant',
        required: true // Data segregation check
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Processing', 'Completed', 'Failed'],
        default: 'Pending'
    },
    sensitivityStatus: {
        type: String,
        enum: ['Safe', 'Flagged', 'Unreviewed'],
        default: 'Unreviewed' // Updated dynamically during pipeline screening
    },
    processingProgress: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Video', videoSchema);