const mongoose = require('mongoose')

const notAcceptReasonSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
)

module.exports = mongoose.model('NotAcceptReason', notAcceptReasonSchema)
