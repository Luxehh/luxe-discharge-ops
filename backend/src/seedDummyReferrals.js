/**
 * Seeds dummy referral rows for the current year and the previous 3 years.
 * Each month gets 4–5 house entries with realistic funnel numbers.
 * Only runs when SEED_DUMMY_DATA=true and skipDummySeed is not set.
 */

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function hashString(str) {
  let h = 0
  for (let i = 0; i < str.length; i += 1) {
    h = (h << 5) - h + str.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h)
}

/** Deterministic pick of `count` houses for a given month key. */
function pickHousesForMonth(houses, monthKey, count) {
  if (!houses.length) return []
  const start = hashString(monthKey) % houses.length
  const n = Math.min(count, houses.length)
  const picked = []
  for (let i = 0; i < n; i += 1) {
    picked.push(houses[(start + i) % houses.length])
  }
  return picked
}

function buildMonthList(now = new Date()) {
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1
  const months = []

  for (let year = currentYear - 3; year <= currentYear; year += 1) {
    const lastMonth = year === currentYear ? currentMonth : 12
    for (let m = 1; m <= lastMonth; m += 1) {
      months.push(`${year}-${String(m).padStart(2, '0')}`)
    }
  }

  return months
}

function pickUnique(items, count, salt) {
  if (!items.length) return []
  const n = Math.min(count, items.length)
  const order = items
    .map((item, index) => ({
      item,
      score: hashString(`${salt}-${index}-${item.name || item._id}`),
    }))
    .sort((a, b) => a.score - b.score)
  return order.slice(0, n).map((entry) => entry.item)
}

function buildReferralPayload(house, month, reasons, insurancesForLocation) {
  const reasonPool = reasons.length ? reasons : []
  const insurancePool = insurancesForLocation.length
    ? insurancesForLocation
    : []

  const totalDischarge = randInt(80, 220)
  const dischargeWithHomeHealth = randInt(
    Math.floor(totalDischarge * 0.25),
    Math.floor(totalDischarge * 0.55)
  )

  const selectedReasons = pickUnique(
    reasonPool,
    randInt(2, Math.min(4, Math.max(2, reasonPool.length || 1))),
    `${month}-${house.name}-reasons`
  )

  const notAbleToAccept = []
  let notAbleTotal = 0
  for (const reason of selectedReasons) {
    const count = randInt(1, 12)
    notAbleTotal += count
    notAbleToAccept.push({
      reasonId: String(reason._id || reason.id),
      reasonName: reason.name,
      categoryId: String(reason.category?._id || reason.category || ''),
      categoryName: reason.categoryName || reason.category?.name || '',
      count,
    })
  }

  const remaining = Math.max(0, dischargeWithHomeHealth - notAbleTotal)
  const selectedInsurances = pickUnique(
    insurancePool,
    randInt(2, Math.min(4, Math.max(2, insurancePool.length || 1))),
    `${month}-${house.name}-ins`
  )

  const ableToAccept = []
  let assigned = 0
  selectedInsurances.forEach((insurance, i) => {
    const isLast = i === selectedInsurances.length - 1
    const count = isLast
      ? Math.max(0, remaining - assigned)
      : randInt(
          0,
          Math.max(0, remaining - assigned - (selectedInsurances.length - i - 1))
        )
    assigned += count
    const accepted = count === 0 ? 0 : randInt(Math.floor(count * 0.5), count)
    const notAdmitted = count - accepted
    ableToAccept.push({
      insuranceId: String(insurance._id || insurance.id),
      insuranceName: insurance.name,
      count,
      accepted,
      notAdmitted,
    })
  })

  const ableTotal = ableToAccept.reduce((s, r) => s + r.count, 0)
  const adjustedHomeHealth = notAbleTotal + ableTotal

  return {
    houseId: String(house._id || house.id),
    houseName: house.name,
    location: house.location,
    month,
    totalDischarge,
    dischargeWithHomeHealth: adjustedHomeHealth || dischargeWithHomeHealth,
    notAbleToAccept,
    ableToAccept,
  }
}

async function ensureSeedDummyReferrals({ force = false } = {}) {
  if (
    !force &&
    String(process.env.SEED_DUMMY_DATA || '').toLowerCase() !== 'true'
  ) {
    return
  }

  const SystemSetting = require('./models/SystemSetting')
  const Referral = require('./models/Referral')
  const House = require('./models/House')
  const NotAcceptReason = require('./models/NotAcceptReason')
  const Category = require('./models/Category')
  const Insurance = require('./models/Insurance')

  const skip = await SystemSetting.findOne({ key: 'skipDummySeed' })
  if (skip?.value === true) {
    console.log('Skipping dummy referral seed (fresh start / wipe flag set)')
    return
  }

  const existing = await Referral.countDocuments()
  if (existing > 0 && !force) return

  if (force && existing > 0) {
    await Referral.deleteMany({})
    console.log(`Cleared ${existing} existing referrals before dummy seed`)
  }

  const houses = await House.find({ status: 'Active' })
  if (!houses.length) {
    console.warn('No active houses — cannot seed dummy referrals')
    return
  }

  const categories = await Category.find()
  const categoryById = Object.fromEntries(
    categories.map((c) => [String(c._id), c.name])
  )

  const reasonsRaw = await NotAcceptReason.find().populate('category')
  const reasons = reasonsRaw.map((r) => ({
    _id: r._id,
    name: r.name,
    category: r.category,
    categoryName: r.category?.name || categoryById[String(r.category)] || '',
  }))

  const insurances = await Insurance.find()
  const insurancesByLocation = insurances.reduce((acc, ins) => {
    if (!acc[ins.location]) acc[ins.location] = []
    acc[ins.location].push(ins)
    return acc
  }, {})

  const months = buildMonthList()
  const docs = []

  for (const month of months) {
    const entriesPerMonth = randInt(4, 5)
    const picked = pickHousesForMonth(houses, month, entriesPerMonth)
    for (const house of picked) {
      docs.push(
        buildReferralPayload(
          house,
          month,
          reasons,
          insurancesByLocation[house.location] || []
        )
      )
    }
  }

  if (!docs.length) return

  await Referral.insertMany(docs, { ordered: false })
  console.log(
    `Seeded ${docs.length} dummy referrals across ${months.length} months (${months[0]} → ${months[months.length - 1]})`
  )
}

module.exports = {
  ensureSeedDummyReferrals,
  buildMonthList,
}

if (require.main === module) {
  require('dotenv').config()
  const mongoose = require('mongoose')

  ;(async () => {
    try {
      if (!process.env.MONGODB_URI) {
        throw new Error('MONGODB_URI is required')
      }
      await mongoose.connect(process.env.MONGODB_URI)
      const force = process.argv.includes('--force')
      process.env.SEED_DUMMY_DATA = 'true'
      await ensureSeedDummyReferrals({ force })
      await mongoose.disconnect()
      process.exit(0)
    } catch (error) {
      console.error('Dummy seed failed:', error.message)
      process.exit(1)
    }
  })()
}
