import { useEffect, useRef, useState } from 'react'

const MONTHS = [
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

const FULL_MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

export function formatMonthLabel(value) {
  if (!value || !/^\d{4}-\d{2}$/.test(value)) return ''
  const [year, month] = value.split('-')
  return `${FULL_MONTHS[Number(month) - 1]}, ${year}`
}

export function currentMonthValue() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export default function MonthPicker({
  value,
  onChange,
  buttonClassName,
  labelFormatter,
}) {
  const [open, setOpen] = useState(false)
  const [viewYear, setViewYear] = useState(() => {
    if (value) return Number(value.split('-')[0])
    return new Date().getFullYear()
  })
  const rootRef = useRef(null)

  useEffect(() => {
    if (value) setViewYear(Number(value.split('-')[0]))
  }, [value])

  useEffect(() => {
    if (!open) return undefined

    const handleClick = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const selectedMonth = value ? Number(value.split('-')[1]) : null

  const pickMonth = (monthIndex) => {
    const next = `${viewYear}-${String(monthIndex + 1).padStart(2, '0')}`
    onChange(next)
    setOpen(false)
  }

  const pickThisMonth = () => {
    onChange(currentMonthValue())
    setOpen(false)
  }

  const displayLabel = labelFormatter
    ? labelFormatter(value) || 'Select month'
    : formatMonthLabel(value) || 'Select month'

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={
          buttonClassName ||
          'w-full flex items-center justify-between gap-2 px-3.5 py-2.5 border border-gray-300 rounded-lg text-left text-gray-900 bg-white hover:border-navy focus:outline-none focus:ring-2 focus:ring-navy/30 focus:border-navy'
        }
      >
        <span>{displayLabel}</span>
        <svg
          className="w-4 h-4 text-gray-500 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute z-30 mt-2 w-64 rounded-xl border border-gray-200 bg-white shadow-xl p-3">
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={() => setViewYear((y) => y - 1)}
              className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100"
              aria-label="Previous year"
            >
              ‹
            </button>
            <span className="text-sm font-semibold text-gray-900">{viewYear}</span>
            <button
              type="button"
              onClick={() => setViewYear((y) => y + 1)}
              className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100"
              aria-label="Next year"
            >
              ›
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {MONTHS.map((label, index) => {
              const active =
                selectedMonth === index + 1 &&
                value?.startsWith(String(viewYear))
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => pickMonth(index)}
                  className={`px-2 py-2 text-sm rounded-lg transition ${
                    active
                      ? 'bg-navy text-white font-semibold'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {label}
                </button>
              )
            })}
          </div>

          <button
            type="button"
            onClick={pickThisMonth}
            className="mt-3 w-full text-sm font-medium text-navy hover:underline"
          >
            This month
          </button>
        </div>
      )}
    </div>
  )
}
