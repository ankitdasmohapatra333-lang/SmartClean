const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true
    },

    mobile: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },

    email: {
      type: String,
      trim: true,
      lowercase: true
    },

    role: {
      type: String,
      enum: ['citizen', 'admin'],
      default: 'citizen'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
