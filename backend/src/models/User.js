const mongoose = require('mongoose')

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    passwordPlain: {
      type: String,
      default: '',
    },
    name: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['super_admin', 'location_admin'],
      default: 'location_admin',
    },
    location: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
)

module.exports = mongoose.model('User', userSchema)
