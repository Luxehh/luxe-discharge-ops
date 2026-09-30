/** Week helpers — Monday–Sunday weeks, keyed by Monday `YYYY-MM-DD`. */

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

function pad2(n) {
  return String(n).padStart(2, '0')
}

/** Local calendar date as YYYY-MM-DD */
export function toDateKey(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
}

export function parseDateKey(key) {
  if (!key || !/^\d{4}-\d{2}-\d{2}$/.test(key)) return null
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** Monday of the week containing `date` (local). */
export function startOfWeek(date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const day = d.getDay() // 0 Sun … 6 Sat
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d
}

export function endOfWeek(weekStart) {
  const d = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate())
  d.setDate(d.getDate() + 6)
  return d
}

export function formatWeekLabel(weekKey) {
  const start = parseDateKey(weekKey)
  if (!start) return ''
  const end = endOfWeek(start)
  const sameYear = start.getFullYear() === end.getFullYear()
  const startLabel = `${SHORT_MONTHS[start.getMonth()]} ${start.getDate()}`
  const endLabel = `${SHORT_MONTHS[end.getMonth()]} ${end.getDate()}, ${end.getFullYear()}`
  if (sameYear && start.getMonth() === end.getMonth()) {
    return `${SHORT_MONTHS[start.getMonth()]} ${start.getDate()} – ${end.getDate()}, ${end.getFullYear()}`
  }
  if (sameYear) {
    return `${startLabel} – ${endLabel}`
  }
  return `${startLabel}, ${start.getFullYear()} – ${endLabel}`
}

/**
 * Weeks (Mon–Sun) that intersect the calendar month `YYYY-MM`.
 * Newest week first (matches typical week dropdown UX).
 */
export function weeksForMonth(monthKey) {
  if (!monthKey || !/^\d{4}-\d{2}$/.test(monthKey)) return []
  const [year, month] = monthKey.split('-').map(Number)
  const monthStart = new Date(year, month - 1, 1)
  const monthEnd = new Date(year, month, 0)

  let cursor = startOfWeek(monthStart)
  const weeks = []

  while (cursor <= monthEnd) {
    const weekEnd = endOfWeek(cursor)
    if (weekEnd >= monthStart && cursor <= monthEnd) {
      weeks.push({
        value: toDateKey(cursor),
        label: formatWeekLabel(toDateKey(cursor)),
      })
    }
    cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 7)
  }

  return weeks.reverse()
}

/** Prefer the current week if it is in the list; otherwise the first (newest) week. */
export function defaultWeekForMonth(monthKey, preferredWeek = '') {
  const weeks = weeksForMonth(monthKey)
  if (!weeks.length) return ''
  if (preferredWeek && weeks.some((w) => w.value === preferredWeek)) {
    return preferredWeek
  }
  const todayWeek = toDateKey(startOfWeek(new Date()))
  if (weeks.some((w) => w.value === todayWeek)) return todayWeek
  return weeks[0].value
}

export function currentWeekValue() {
  return toDateKey(startOfWeek(new Date()))
}
