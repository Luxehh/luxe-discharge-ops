const mongoose = require('mongoose')

const reasonRowSchema = new mongoose.Schema(
  {
    reasonId: { type: String, default: '' },
    reasonName: { type: String, default: '' },
    categoryId: { type: String, default: '' },
    categoryName: { type: String, default: '' },
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
    month: { type: String, required: true },
    totalDischarge: { type: Number, default: 0 },
    dischargeWithHomeHealth: { type: Number, default: 0 },
    notAbleToAccept: { type: [reasonRowSchema], default: [] },
    ableToAccept: { type: [insuranceRowSchema], default: [] },
  },
  { timestamps: true }
)

referralSchema.index({ houseId: 1, month: 1 }, { unique: true })

module.exports = mongoose.model('Referral', referralSchema)
