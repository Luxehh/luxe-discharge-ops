const SHORT_MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

export const PERIOD_TYPES = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
]

export const RANGE_OPTIONS = {
  monthly: [
    { value: 1, label: 'Last 1 Month' },
    { value: 2, label: 'Last 2 Months' },
    { value: 3, label: 'Last 3 Months' },
    { value: 4, label: 'Last 4 Months' },
  ],
  quarterly: [
    { value: 1, label: '1 Quarter Comparison' },
    { value: 2, label: '2 Quarters Comparison' },
    { value: 3, label: '3 Quarters Comparison' },
    { value: 4, label: '4 Quarters Comparison' },
  ],
  yearly: [
    { value: 1, label: 'Last 1 Year' },
    { value: 2, label: 'Last 2 Years' },
    { value: 3, label: 'Last 3 Years' },
    { value: 4, label: 'Last 4 Years' },
  ],
}

export function monthKeyFromDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export function parseMonthKey(key) {
  const [y, m] = String(key).split('-').map(Number)
  return { year: y, month: m }
}

export function shiftMonth(key, delta) {
  const { year, month } = parseMonthKey(key)
  const d = new Date(year, month - 1 + delta, 1)
  return monthKeyFromDate(d)
}

export function formatMonthShort(key) {
  if (!key || !/^\d{4}-\d{2}$/.test(key)) return key
  const { year, month } = parseMonthKey(key)
  return `${SHORT_MONTHS[month - 1]} ${year}`
}

export function quarterKeyFromDate(date) {
  const q = Math.floor(date.getMonth() / 3) + 1
  return `${date.getFullYear()}-Q${q}`
}

export function shiftQuarter(key, delta) {
  const [yearStr, qStr] = key.split('-Q')
  let year = Number(yearStr)
  let q = Number(qStr) + delta
  while (q < 1) {
    q += 4
    year -= 1
  }
  while (q > 4) {
    q -= 4
    year += 1
  }
  return `${year}-Q${q}`
}

export function formatQuarterLabel(key) {
  const [year, q] = key.split('-Q')
  return `Q${q} ${year}`
}

export function monthsInQuarter(quarterKey) {
  const [yearStr, qStr] = quarterKey.split('-Q')
  const year = Number(yearStr)
  const q = Number(qStr)
  const start = (q - 1) * 3 + 1
  return [0, 1, 2].map(
    (i) => `${year}-${String(start + i).padStart(2, '0')}`
  )
}

export function monthsInYear(year) {
  return Array.from({ length: 12 }, (_, i) =>
    `${year}-${String(i + 1).padStart(2, '0')}`
  )
}

/** Build last N period keys ending at "now" (or latest data month). */
export function buildPeriodKeys(periodType, count, endMonthKey) {
  const end = endMonthKey || monthKeyFromDate(new Date())

  if (periodType === 'monthly') {
    const keys = []
    for (let i = count - 1; i >= 0; i -= 1) {
      keys.push(shiftMonth(end, -i))
    }
    return keys.map((key) => ({
      key,
      label: formatMonthShort(key),
      months: [key],
    }))
  }

  if (periodType === 'quarterly') {
    const endQ = quarterKeyFromDate(
      new Date(...(() => {
        const { year, month } = parseMonthKey(end)
        return [year, month - 1, 1]
      })())
    )
    const keys = []
    for (let i = count - 1; i >= 0; i -= 1) {
      keys.push(shiftQuarter(endQ, -i))
    }
    return keys.map((key) => ({
      key,
      label: formatQuarterLabel(key),
      months: monthsInQuarter(key),
    }))
  }

  // yearly
  const endYear = Number(end.split('-')[0])
  const keys = []
  for (let i = count - 1; i >= 0; i -= 1) {
    keys.push(String(endYear - i))
  }
  return keys.map((key) => ({
    key,
    label: key,
    months: monthsInYear(Number(key)),
  }))
}

export function chartRangeLabel(periodType, count) {
  if (periodType === 'monthly') return `${count} Months`
  if (periodType === 'quarterly') return `${count} Quarters`
  return `${count} Years`
}
