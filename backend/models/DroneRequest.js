const mongoose = require('mongoose');

const droneRequestSchema = new mongoose.Schema(
  {
    requestId: {
      type: String,
      unique: true,
      required: true,
      index: true
    },
    location: {
      type: String,
      required: true,
      trim: true
    },
    radius: {
      type: String,
      default: '2 km',
      trim: true
    },
    purpose: {
      type: String,
      default: 'General Inspection',
      trim: true
    },
    description: {
      type: String,
      default: '',
      trim: true
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium',
      index: true
    },
    preferredTime: {
      type: String,
      default: 'Flexible / Next Available',
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
    status: {
      type: String,
      enum: ['Submitted', 'Pending Review', 'Scheduled', 'In Progress', 'Completed', 'Rejected'],
      default: 'Submitted',
      index: true
    },
    requestedAt: {
      type: String,
      trim: true
    },
    notes: {
      type: String,
      default: '',
      trim: true
    }
  },
  {
    timestamps: true
  }
);

droneRequestSchema.index({ createdAt: -1 });

module.exports = mongoose.model('DroneRequest', droneRequestSchema);
