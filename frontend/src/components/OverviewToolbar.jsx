import MonthPicker, {
  currentMonthValue,
  formatMonthLabel,
} from './MonthPicker'

const PERIODS = ['Monthly', 'Yearly']

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

export function shortMonthLabel(value) {
  if (!value || !/^\d{4}-\d{2}$/.test(value)) return '—'
  const [year, month] = value.split('-')
  return `${SHORT_MONTHS[Number(month) - 1]} ${year}`
}

export function defaultOverviewMonth() {
  return currentMonthValue()
}

export default function OverviewToolbar({
  period,
  onPeriodChange,
  month,
  onMonthChange,
  year,
  onYearChange,
  onDownloadPdf,
}) {
  const years = []
  const currentYear = new Date().getFullYear()
  for (let y = currentYear; y >= currentYear - 5; y -= 1) years.push(y)

  const printLabel =
    period === 'Yearly' ? String(year) : shortMonthLabel(month)

  return (
    <>
      <p className="hidden print:block text-sm font-medium text-gray-700">
        Period: {printLabel}
      </p>
      <div
        className="flex flex-wrap items-center gap-2 sm:gap-3 print:hidden"
        data-print-hide
      >
      <div className="inline-flex rounded-lg overflow-hidden border border-gray-300 bg-white">
        {PERIODS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onPeriodChange(item)}
            className={`px-3 sm:px-4 py-2 text-sm font-medium transition ${
              period === item
                ? 'bg-navy text-white'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      {period === 'Monthly' ? (
        <div className="min-w-[9.5rem]">
          <MonthPicker
            value={month}
            onChange={onMonthChange}
            buttonClassName="w-full flex items-center justify-between gap-1.5 px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-navy/30"
            labelFormatter={shortMonthLabel}
          />
        </div>
      ) : (
        <select
          value={year}
          onChange={(e) => onYearChange(Number(e.target.value))}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-navy/30"
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      )}

      <button
        type="button"
        onClick={onDownloadPdf}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-gold hover:bg-gold-dark text-white rounded-lg transition"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
          />
        </svg>
        Download PDF
      </button>
      </div>
    </>
  )
}

export function overviewPeriodLabel(period, month, year) {
  if (period === 'Yearly') return String(year)
  return formatMonthLabel(month) || shortMonthLabel(month)
}
