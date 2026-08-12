const express = require('express')
const { authMiddleware, requireSuperAdmin } = require('../middleware/auth')

const router = express.Router()

function allowDeleteAllEnabled() {
  return String(process.env.ALLOW_DELETE_ALL || '').toLowerCase() === 'true'
}

function seedDummyEnabled() {
  return String(process.env.SEED_DUMMY_DATA || '').toLowerCase() === 'true'
}

function getDbFlag() {
  return !!require('../db').isConnected()
}

router.use(authMiddleware)

/** Public (auth) feature flags for UI — delete-all button visibility, etc. */
router.get('/config', async (req, res) => {
  try {
    let dummySeedDisabled = false

    if (getDbFlag()) {
      const SystemSetting = require('../models/SystemSetting')
      const skip = await SystemSetting.findOne({ key: 'skipDummySeed' })
      dummySeedDisabled = skip?.value === true
    }

    res.json({
      allowDeleteAll: allowDeleteAllEnabled(),
      seedDummyData: seedDummyEnabled(),
      dummySeedDisabled,
      database: getDbFlag() ? 'connected' : 'demo-mode',
    })
  } catch (error) {
    console.error('Admin config error:', error)
    res.status(500).json({ message: 'Failed to load admin config' })
  }
})

/**
 * Wipe operational data for a live fresh start.
 * Keeps location logins (users). Sets skipDummySeed so dummy referrals
 * are never auto-added again, even if SEED_DUMMY_DATA=true.
 * Only available when ALLOW_DELETE_ALL=true.
 */
router.delete('/delete-all', requireSuperAdmin, async (req, res) => {
  try {
    if (!allowDeleteAllEnabled()) {
      return res.status(403).json({
        message: 'Delete all is disabled. Set ALLOW_DELETE_ALL=true to enable.',
      })
    }

    if (!getDbFlag()) {
      return res.status(503).json({
        message: 'Delete all requires a connected MongoDB database',
      })
    }

    const Referral = require('../models/Referral')
    const House = require('../models/House')
    const Category = require('../models/Category')
    const NotAcceptReason = require('../models/NotAcceptReason')
    const Insurance = require('../models/Insurance')
    const InsuranceType = require('../models/InsuranceType')
    const SystemSetting = require('../models/SystemSetting')

    const [referrals, houses, categories, reasons, insurances, insuranceTypes] =
      await Promise.all([
        Referral.deleteMany({}),
        House.deleteMany({}),
        Category.deleteMany({}),
        NotAcceptReason.deleteMany({}),
        Insurance.deleteMany({}),
        InsuranceType.deleteMany({}),
      ])

    await SystemSetting.findOneAndUpdate(
      { key: 'skipDummySeed' },
      { key: 'skipDummySeed', value: true },
      { upsert: true, new: true }
    )

    // Re-seed master/reference data only (no dummy referrals)
    const { reseedMasterData } = require('../seedMasterData')
    await reseedMasterData()

    res.json({
      message:
        'All records deleted. Master data restored. Dummy data will not be seeded again.',
      deleted: {
        referrals: referrals.deletedCount,
        houses: houses.deletedCount,
        categories: categories.deletedCount,
        reasons: reasons.deletedCount,
        insurances: insurances.deletedCount,
        insuranceTypes: insuranceTypes.deletedCount,
      },
      usersPreserved: true,
      dummySeedDisabled: true,
    })
  } catch (error) {
    console.error('Delete all error:', error)
    res.status(500).json({ message: 'Failed to delete all records' })
  }
})

module.exports = router
