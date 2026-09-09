const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema(
  {
    complaintId: {
      type: String,
      unique: true,
      sparse: true,
      index: true
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },

    category: {
      type: String,
      required: true,
      trim: true,
      index: true
    },

    wasteType: {
      type: String,
      trim: true
    },

    description: {
      type: String,
      trim: true
    },

    zone: {
      type: String,
      default: 'Unassigned',
      trim: true
    },

    location: {
      type: String,
      trim: true
    },

    latitude: {
      type: Number,
      min: -90,
      max: 90
    },

    longitude: {
      type: Number,
      min: -180,
      max: 180
    },

    photoUrl: {
      type: String,
      trim: true
    },

    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium',
      index: true
    },

    status: {
      type: String,
      enum: ['Pending', 'Assigned', 'In Progress', 'Resolved'],
      default: 'Pending',
      index: true
    },

    assignedTo: {
      type: String,
      trim: true
    },

    reportedBy: {
      type: String,
      default: 'citizen_anonymous',
      trim: true
    },

    resolvedAt: {
      type: Date
    }
  },
  { timestamps: true }
);

complaintSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Complaint', complaintSchema);
