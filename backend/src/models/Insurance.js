const mongoose = require('mongoose')

const insuranceSchema = new mongoose.Schema(
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
    type: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InsuranceType',
      required: true,
    },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Insurance', insuranceSchema)
