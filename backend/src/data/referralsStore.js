let nextId = 1
let referrals = []

function format(referral) {
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

function getByHouseAndMonth(houseId, month) {
  const referral = referrals.find(
    (r) => r.houseId === String(houseId) && r.month === month
  )
  return referral ? format(referral) : null
}

function listByMonth(month) {
  return referrals.filter((r) => r.month === String(month)).map(format)
}

function listByYear(year) {
  const prefix = `${String(year)}-`
  return referrals.filter((r) => String(r.month).startsWith(prefix)).map(format)
}

function getAll() {
  return referrals.map(format)
}

function upsert({
  houseId,
  houseName,
  location,
  month,
  totalDischarge,
  dischargeWithHomeHealth,
  notAbleToAccept,
  ableToAccept,
}) {
  if (!houseId || !month || !houseName || !location) {
    const err = new Error('House and month are required')
    err.status = 400
    throw err
  }

  const payload = {
    houseId: String(houseId),
    houseName,
    location,
    month,
    totalDischarge: Number(totalDischarge) || 0,
    dischargeWithHomeHealth: Number(dischargeWithHomeHealth) || 0,
    notAbleToAccept: notAbleToAccept || [],
    ableToAccept: ableToAccept || [],
  }

  const index = referrals.findIndex(
    (r) => r.houseId === payload.houseId && r.month === payload.month
  )

  if (index === -1) {
    const created = { id: String(nextId++), ...payload }
    referrals.push(created)
    return format(created)
  }

  referrals[index] = { ...referrals[index], ...payload }
  return format(referrals[index])
}

module.exports = {
  getByHouseAndMonth,
  listByMonth,
  listByYear,
  getAll,
  upsert,
  format,
}
