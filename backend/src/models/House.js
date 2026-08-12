const mongoose = require('mongoose')

const houseSchema = new mongoose.Schema(
  {
    location: {
      type: String,
      required: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['Active', 'Coming Soon'],
      default: 'Active',
      required: true,
    },
  },
  { timestamps: true }
)

module.exports = mongoose.model('House', houseSchema)
