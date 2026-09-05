const mongoose = require('mongoose');

const zoneSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true  // No two zones with same name
    },
    
    latitude: {
      type: Number,
      required: false
    },

    longitude: {
      type: Number,
      required: false
    },

    area: {
      type: Number,  // Square meters
      required: false
    },

    fillLevel: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },

    collectionRequired: {
      type: Boolean,
      default: false
    },

    sanitationStatus: {
      type: String,
      enum: ['pending', 'in-progress', 'completed'],
      default: 'pending'
    },

    assignedTeam: {
      type: String,
      trim: true
    },

    lastBinStatusAt: {
      type: Date
    },

    complaintCount: {
      type: Number,
      default: 0
    },

    unresolvedCount: {
      type: Number,
      default: 0
    },

    lastSanitizedAt: {
      type: Date,
      required: false
    },

  },
  { timestamps: true }
);

const Zone = mongoose.model('Zone', zoneSchema);

module.exports = Zone;
