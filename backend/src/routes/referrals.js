const express = require('express')
const Referral = require('../models/Referral')
const referralsStore = require('../data/referralsStore')
const { authMiddleware } = require('../middleware/auth')

const router = express.Router()

router.use(authMiddleware)

function getDbFlag() {
  return !!require('../db').isConnected()
}

function formatReferral(referral) {
  return {
    id: referral.id || String(referral._id),
    houseId: referral.houseId,
    houseName: referral.houseName,
    location: referral.location,
    month: referral.month,
    totalDischarge: Number(referral.totalDischarge) || 0,
    dischargeWithHomeHealth: Number(referral.dischargeWithHomeHealth) || 0,
    notAbleToAccept: (referral.notAbleToAccept || []).map((row) => ({
      reasonId: row.reasonId || '',
      reasonName: row.reasonName || '',
      categoryId: row.categoryId || '',
      categoryName: row.categoryName || '',
      count: Number(row.count) || 0,
    })),
    ableToAccept: (referral.ableToAccept || []).map((row) => ({
      insuranceId: row.insuranceId || '',
      insuranceName: row.insuranceName || '',
      count: Number(row.count) || 0,
      accepted: Number(row.accepted) || 0,
      notAdmitted: Number(row.notAdmitted) || 0,
    })),
  }
}

router.get('/', async (req, res) => {
  try {
    const { houseId, month, year } = req.query

    // Single house + month
    if (houseId && month) {
      if (getDbFlag()) {
        const referral = await Referral.findOne({
          houseId: String(houseId),
          month: String(month),
        })
        return res.json({ referral: referral ? formatReferral(referral) : null })
      }

      return res.json({
        referral: referralsStore.getByHouseAndMonth(houseId, month),
      })
    }

    // List by month (overview aggregation)
    if (month) {
      if (getDbFlag()) {
        const list = await Referral.find({ month: String(month) })
        return res.json({ referrals: list.map(formatReferral) })
      }
      return res.json({ referrals: referralsStore.listByMonth(month) })
    }

    // List by year (yearly overview)
    if (year) {
      const prefix = `${String(year)}-`
      if (getDbFlag()) {
        const list = await Referral.find({ month: { $regex: `^${prefix}` } })
        return res.json({ referrals: list.map(formatReferral) })
      }
      return res.json({ referrals: referralsStore.listByYear(year) })
    }

    // List all referrals (comparison & trends)
    if (req.query.all === '1' || req.query.scope === 'all') {
      if (getDbFlag()) {
        const list = await Referral.find().sort({ month: 1 })
        return res.json({ referrals: list.map(formatReferral) })
      }
      return res.json({ referrals: referralsStore.getAll() })
    }

    return res
      .status(400)
      .json({ message: 'Provide houseId+month, month, year, or all=1' })
  } catch (error) {
    console.error('Get referral error:', error)
    res.status(500).json({ message: 'Failed to load referral details' })
  }
})

router.post('/', async (req, res) => {
  try {
    const {
      houseId,
      houseName,
      location,
      month,
      totalDischarge,
      dischargeWithHomeHealth,
      notAbleToAccept,
      ableToAccept,
    } = req.body

    if (!houseId || !month || !houseName || !location) {
      return res.status(400).json({ message: 'House and month are required' })
    }

    const payload = {
      houseId: String(houseId),
      houseName: String(houseName).trim(),
      location: String(location).trim(),
      month: String(month),
      totalDischarge: Number(totalDischarge) || 0,
      dischargeWithHomeHealth: Number(dischargeWithHomeHealth) || 0,
      notAbleToAccept: Array.isArray(notAbleToAccept) ? notAbleToAccept : [],
      ableToAccept: Array.isArray(ableToAccept) ? ableToAccept : [],
    }

    if (getDbFlag()) {
      const referral = await Referral.findOneAndUpdate(
        { houseId: payload.houseId, month: payload.month },
        payload,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      )
      return res.json({ referral: formatReferral(referral) })
    }

    const referral = referralsStore.upsert(payload)
    res.json({ referral })
  } catch (error) {
    console.error('Save referral error:', error)
    const status = error.status || 500
    res
      .status(status)
      .json({ message: error.message || 'Failed to save referral details' })
  }
})

module.exports = router
