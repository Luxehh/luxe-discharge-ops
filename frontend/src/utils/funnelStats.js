export function pctValue(part, whole) {
  if (!whole || whole <= 0) return 0
  return (part / whole) * 100
}

export function pctLabel(part, whole, digits = 1) {
  const value = pctValue(part, whole)
  if (Number.isInteger(value) || digits === 0) return `${Math.round(value)}%`
  return `${value.toFixed(digits)}%`
}

export function sumAbleAcceptedNotAdmitted(referral) {
  const rows = referral?.ableToAccept || []
  return rows.reduce(
    (acc, row) => {
      acc.able += Number(row.count) || 0
      acc.accepted += Number(row.accepted) || 0
      acc.notAdmitted += Number(row.notAdmitted) || 0
      return acc
    },
    { able: 0, accepted: 0, notAdmitted: 0 }
  )
}

/** Merge multiple referrals for the same house (yearly). */
export function mergeReferrals(referrals) {
  if (!referrals?.length) return null

  const base = referrals[0]
  const notAbleMap = new Map()
  const ableMap = new Map()

  let totalDischarge = 0
  let dischargeWithHomeHealth = 0

  referrals.forEach((ref) => {
    totalDischarge += Number(ref.totalDischarge) || 0
    dischargeWithHomeHealth += Number(ref.dischargeWithHomeHealth) || 0

    ;(ref.notAbleToAccept || []).forEach((row) => {
      const key = row.reasonId || row.reasonName
      const existing = notAbleMap.get(key)
      if (existing) {
        existing.count += Number(row.count) || 0
      } else {
        notAbleMap.set(key, {
          reasonId: row.reasonId || '',
          reasonName: row.reasonName || '',
          categoryId: row.categoryId || '',
          categoryName: row.categoryName || '',
          count: Number(row.count) || 0,
        })
      }
    })

    ;(ref.ableToAccept || []).forEach((row) => {
      const key = row.insuranceId || row.insuranceName
      const existing = ableMap.get(key)
      if (existing) {
        existing.count += Number(row.count) || 0
        existing.accepted += Number(row.accepted) || 0
        existing.notAdmitted += Number(row.notAdmitted) || 0
      } else {
        ableMap.set(key, {
          insuranceId: row.insuranceId || '',
          insuranceName: row.insuranceName || '',
          count: Number(row.count) || 0,
          accepted: Number(row.accepted) || 0,
          notAdmitted: Number(row.notAdmitted) || 0,
        })
      }
    })
  })

  return {
    ...base,
    month: base.month,
    totalDischarge,
    dischargeWithHomeHealth,
    notAbleToAccept: Array.from(notAbleMap.values()),
    ableToAccept: Array.from(ableMap.values()),
  }
}
