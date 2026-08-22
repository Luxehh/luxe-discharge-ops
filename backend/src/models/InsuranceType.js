const mongoose = require('mongoose')

const insuranceTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    color: {
      type: String,
      enum: ['green', 'yellow', 'red', 'grey'],
      default: 'green',
      required: true,
    },
  },
  { timestamps: true }
)

module.exports = mongoose.model('InsuranceType', insuranceTypeSchema)
