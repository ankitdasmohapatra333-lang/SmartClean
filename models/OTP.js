const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema(
  {
    mobile: {
      type: String,
      required: true,
      trim: true,
      index: true
    },

    otpHash: {
      type: String,
      required: true
    },

    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }
    },

    attempts: {
      type: Number,
      default: 0
    },

    verified: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('OTP', otpSchema);
