const mongoose = require('mongoose')

const reasonRowSchema = new mongoose.Schema(
  {
    reasonId: { type: String, default: '' },
    reasonName: { type: String, default: '' },
    count: { type: Number, default: 0 },
  },
  { _id: false }
)

const insuranceRowSchema = new mongoose.Schema(
  {
    insuranceId: { type: String, default: '' },
    insuranceName: { type: String, default: '' },
    count: { type: Number, default: 0 },
    accepted: { type: Number, default: 0 },
    notAdmitted: { type: Number, default: 0 },
  },
  { _id: false }
)

const referralSchema = new mongoose.Schema(
  {
    houseId: { type: String, required: true },
    houseName: { type: String, required: true },
    location: { type: String, required: true },
    /** Calendar month from the form, YYYY-MM — used for monthly dashboard rollups */
    month: { type: String, required: true },
    /** Week start (Monday) YYYY-MM-DD — unique per house for weekly entry */
    week: { type: String, default: '' },
    totalDischarge: { type: Number, default: 0 },
    dischargeWithHomeHealth: { type: Number, default: 0 },
    notAbleToAccept: { type: [reasonRowSchema], default: [] },
    ableToAccept: { type: [insuranceRowSchema], default: [] },
  },
  { timestamps: true }
)

// Monthly listings / rollups
referralSchema.index({ houseId: 1, month: 1 })
referralSchema.index({ month: 1 })

// One entry per facility per week (weekly add-referral)
referralSchema.index(
  { houseId: 1, week: 1 },
  {
    unique: true,
    partialFilterExpression: { week: { $type: 'string', $gt: '' } },
  }
)

module.exports = mongoose.model('Referral', referralSchema)
