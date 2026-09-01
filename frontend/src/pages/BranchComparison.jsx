import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import PageShell from '../components/PageShell'
import MonthPicker, { formatMonthLabel } from '../components/MonthPicker'
import { useAuth } from '../context/AuthContext'
import { apiRequest } from '../utils/api'
import {
  RANGE_OPTIONS,
  buildPeriodKeys,
  formatMonthShort,
  monthKeyFromDate,
  shiftMonth,
} from '../utils/comparisonPeriods'
import { pctLabel } from '../utils/funnelStats'

const ABLE_COLOR = '#A7C4A0'
const ACCEPTED_COLOR = '#2F6B4F'
const TREND_ABLE = '#E09A2B'
const TREND_ACCEPTED = '#2F6B4F'
const TREND_NOT_ADMITTED = '#5B8A8A'

function emptyMetrics() {
  return {
    totalDischarge: 0,
    dischargeWithHomeHealth: 0,
    notAble: 0,
    able: 0,
    accepted: 0,
    notAdmitted: 0,
    byInsurance: {},
  }
}

function accumulateReferral(metrics, referral, insuranceFilter) {
  if (!insuranceFilter) {
    metrics.totalDischarge += Number(referral.totalDischarge) || 0
    metrics.dischargeWithHomeHealth +=
      Number(referral.dischargeWithHomeHealth) || 0

    ;(referral.notAbleToAccept || []).forEach((row) => {
      metrics.notAble += Number(row.count) || 0
    })
  } else {
    ;(referral.notAbleToAccept || []).forEach((row) => {
      const name = row.insuranceName || 'Other'
      if (!insuranceFilter(name)) return
      metrics.notAble += Number(row.count) || 0
    })
  }

  ;(referral.ableToAccept || []).forEach((row) => {
    const name = row.insuranceName || 'Other'
    if (insuranceFilter && !insuranceFilter(name)) return

    const able = Number(row.count) || 0
    const accepted = Number(row.accepted) || 0
    const notAdmitted = Number(row.notAdmitted) || 0
    metrics.able += able
    metrics.accepted += accepted
    metrics.notAdmitted += notAdmitted

    if (!metrics.byInsurance[name]) {
      metrics.byInsurance[name] = { able: 0, accepted: 0, notAdmitted: 0 }
    }
    metrics.byInsurance[name].able += able
    metrics.byInsurance[name].accepted += accepted
    metrics.byInsurance[name].notAdmitted += notAdmitted
  })
}

function aggregateReferrals(referrals, monthSet, insuranceFilter) {
  const metrics = emptyMetrics()
  referrals.forEach((ref) => {
    if (monthSet && !monthSet.has(ref.month)) return
    accumulateReferral(metrics, ref, insuranceFilter)
  })
  return metrics
}

/** True Medicare only — not Medicare Advantage. */
function isMedicareInsurance(name) {
  return String(name || '').trim().toLowerCase() === 'medicare'
}

function deltaLabel(current, previous) {
  const diff = current - previous
  const sign = diff > 0 ? '+' : ''
  return `${sign}${diff}`
}

function Trend({ current, previous, compareLabel, pctCurrent, pctPrevious }) {
  const diff = current - previous
  const up = diff >= 0
  const color = up ? 'text-emerald-700' : 'text-red-600'
  const arrow = up ? '▲' : '▼'
  const pctPart =
    pctCurrent != null && pctPrevious != null
      ? ` (${pctLabel(pctCurrent.part, pctCurrent.whole)} vs ${pctLabel(
          pctPrevious.part,
          pctPrevious.whole
        )})`
      : ''

  return (
    <p className={`text-[11px] mt-2 font-medium ${color}`}>
      <span className="mr-1">{arrow}</span>
      {deltaLabel(current, previous)}
      {pctPart} vs {compareLabel}
    </p>
  )
}

function KpiCard({ label, value, suffix, trend }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-md px-3 py-3.5">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p className="mt-1.5 text-2xl font-bold text-gray-900 leading-none">
        {value}
        {suffix ? (
          <span className="text-sm font-semibold text-gray-500 ml-1">
            {suffix}
          </span>
        ) : null}
      </p>
      {trend}
    </div>
  )
}

function KpiRow({ current, previous, compareLabel }) {
  return (
    <div className="branch-kpi-grid grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
      <KpiCard
        label="DC Total"
        value={current.totalDischarge}
        trend={
          <Trend
            current={current.totalDischarge}
            previous={previous.totalDischarge}
            compareLabel={compareLabel}
          />
        }
      />
      <KpiCard
        label="DC with HH"
        value={current.dischargeWithHomeHealth}
        trend={
          <Trend
            current={current.dischargeWithHomeHealth}
            previous={previous.dischargeWithHomeHealth}
            compareLabel={compareLabel}
          />
        }
      />
      <KpiCard
        label="Not Able to Accept"
        value={current.notAble}
        trend={
          <Trend
            current={current.notAble}
            previous={previous.notAble}
            compareLabel={compareLabel}
          />
        }
      />
      <KpiCard
        label="Able to Accept"
        value={current.able}
        trend={
          <Trend
            current={current.able}
            previous={previous.able}
            compareLabel={compareLabel}
          />
        }
      />
      <KpiCard
        label="Received/Accepted"
        value={current.accepted}
        suffix={`(${pctLabel(current.accepted, current.able)})`}
        trend={
          <Trend
            current={current.accepted}
            previous={previous.accepted}
            compareLabel={compareLabel}
            pctCurrent={{ part: current.accepted, whole: current.able }}
            pctPrevious={{ part: previous.accepted, whole: previous.able }}
          />
        }
      />
      <KpiCard
        label="Not Admitted"
        value={current.notAdmitted}
        suffix={`(${pctLabel(current.notAdmitted, current.accepted)})`}
        trend={
          <Trend
            current={current.notAdmitted}
            previous={previous.notAdmitted}
            compareLabel={compareLabel}
            pctCurrent={{ part: current.notAdmitted, whole: current.accepted }}
            pctPrevious={{
              part: previous.notAdmitted,
              whole: previous.accepted,
            }}
          />
        }
      />
    </div>
  )
}

const PRINT_CHART_WIDTH = 720
const PRINT_CHART_HEIGHT = 200
const PRINT_CIRCLE_HEIGHT = 168
const PRINT_CIRCLE_WIDTH = 280

function ChartCard({ title, filter, children, compact }) {
  return (
    <section className="branch-print-chart-card bg-white rounded-xl border border-gray-200 shadow-md p-4 sm:p-5">
      <div
        className={`flex flex-wrap items-center justify-between gap-3 ${
          compact ? 'mb-1' : 'mb-4'
        }`}
      >
        <h3 className="text-base font-bold text-gray-900">{title}</h3>
        {filter ? (
          <div className="print:hidden" data-print-hide>
            {filter}
          </div>
        ) : null}
      </div>
      <div
        className={`branch-print-chart w-full ${
          compact ? '' : 'h-72 sm:h-80'
        }`}
        style={
          compact
            ? { height: PRINT_CHART_HEIGHT, width: '100%' }
            : undefined
        }
      >
        {children}
      </div>
    </section>
  )
}

function buildTrendRows(referrals, months, insuranceFilter) {
  return months.map((month) => {
    const metrics = aggregateReferrals(
      referrals,
      new Set([month]),
      insuranceFilter
    )
    const { able, accepted, notAdmitted } = metrics
    return {
      name: formatMonthShort(month),
      able,
      accepted,
      notAdmitted,
      ableLabel: `${able} (${pctLabel(able, able)})`,
      acceptedLabel: `${accepted} (${pctLabel(accepted, able)})`,
      notAdmittedLabel: `${notAdmitted} (${pctLabel(notAdmitted, accepted)})`,
    }
  })
}

function TripleMetricBarChart({ data, compact }) {
  const margin = compact
    ? { top: 20, right: 10, left: 0, bottom: 2 }
    : { top: 28, right: 16, left: 0, bottom: 4 }
  const tickSize = compact ? 9 : 11
  const labelSize = compact ? 8 : 10

  const content = [
    <CartesianGrid key="grid" strokeDasharray="3 3" vertical={false} />,
    <XAxis key="x" dataKey="name" tick={{ fontSize: tickSize }} />,
    <YAxis key="y" tick={{ fontSize: tickSize }} allowDecimals={false} />,
    !compact ? (
      <Tooltip
        key="tip"
        formatter={(value, name, item) => {
          const row = item?.payload
          if (!row) return [value, name]
          if (name?.includes('Able to Accept')) return [row.ableLabel, name]
          if (
            name?.includes('Received/Accepted') ||
            name?.includes('Accepted')
          ) {
            return [row.acceptedLabel, name]
          }
          if (name?.includes('Not Admitted')) {
            return [row.notAdmittedLabel, name]
          }
          return [value, name]
        }}
      />
    ) : null,
    <Legend
      key="legend"
      verticalAlign="top"
      align="center"
      wrapperStyle={{
        paddingBottom: compact ? 4 : 12,
        fontSize: compact ? 9 : 12,
      }}
    />,
    <Bar
      key="able"
      dataKey="able"
      name="Able to Accept (% of total able)"
      fill={TREND_ABLE}
      radius={[4, 4, 0, 0]}
      isAnimationActive={!compact}
    >
      <LabelList
        dataKey="ableLabel"
        position="top"
        style={{ fill: TREND_ABLE, fontSize: labelSize, fontWeight: 600 }}
      />
    </Bar>,
    <Bar
      key="accepted"
      dataKey="accepted"
      name="Received/Accepted (% of able)"
      fill={TREND_ACCEPTED}
      radius={[4, 4, 0, 0]}
      isAnimationActive={!compact}
    >
      <LabelList
        dataKey="acceptedLabel"
        position="top"
        style={{
          fill: TREND_ACCEPTED,
          fontSize: labelSize,
          fontWeight: 600,
        }}
      />
    </Bar>,
    <Bar
      key="notAdmitted"
      dataKey="notAdmitted"
      name="Not Admitted (% of accepted)"
      fill={TREND_NOT_ADMITTED}
      radius={[4, 4, 0, 0]}
      isAnimationActive={!compact}
    >
      <LabelList
        dataKey="notAdmittedLabel"
        position="top"
        style={{
          fill: TREND_NOT_ADMITTED,
          fontSize: labelSize,
          fontWeight: 600,
        }}
      />
    </Bar>,
  ]

  // Fixed pixel size for print — ResponsiveContainer often measures 0 in print preview
  if (compact) {
    return (
      <div
        style={{
          width: '100%',
          height: PRINT_CHART_HEIGHT,
          overflow: 'hidden',
        }}
      >
        <BarChart
          width={PRINT_CHART_WIDTH}
          height={PRINT_CHART_HEIGHT}
          data={data}
          barGap={4}
          barCategoryGap="22%"
          margin={margin}
        >
          {content}
        </BarChart>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        barGap={4}
        barCategoryGap="22%"
        margin={margin}
      >
        {content}
      </BarChart>
    </ResponsiveContainer>
  )
}

function QuietCircleChart({ title, value, total, color, centerLabel, compact }) {
  const safeTotal = Math.max(Number(total) || 0, Number(value) || 0, 1)
  const filled = Math.max(0, Number(value) || 0)
  const rest = Math.max(0, safeTotal - filled)
  const data = [
    { name: 'filled', value: filled || 0.0001 },
    { name: 'rest', value: rest || 0.0001 },
  ]
  const pct = pctLabel(filled, safeTotal)

  const pie = (
    <Pie
      data={data}
      dataKey="value"
      startAngle={90}
      endAngle={-270}
      innerRadius="45%"
      outerRadius="90%"
      stroke="none"
      paddingAngle={0}
      isAnimationActive={!compact}
    >
      <Cell fill={color} />
      <Cell fill="#e8e4db" />
    </Pie>
  )

  return (
    <div className="flex flex-col items-center">
      <p
        className={`font-semibold text-luxe-text mb-1 ${
          compact ? 'text-[10px]' : 'text-sm mb-2'
        }`}
      >
        {title}
      </p>
      <div
        className={`relative w-full ${compact ? '' : 'max-w-md h-72 sm:h-80'}`}
        style={
          compact
            ? {
                height: PRINT_CIRCLE_HEIGHT,
                width: PRINT_CIRCLE_WIDTH,
                maxWidth: '100%',
              }
            : undefined
        }
      >
        {compact ? (
          <PieChart width={PRINT_CIRCLE_WIDTH} height={PRINT_CIRCLE_HEIGHT}>
            {pie}
          </PieChart>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>{pie}</PieChart>
          </ResponsiveContainer>
        )}
        <div
          className={`pointer-events-none absolute inset-0 flex flex-col items-center justify-center ${
            compact ? 'px-8' : 'px-16 sm:px-20'
          }`}
        >
          <p
            className={`font-bold text-luxe-text leading-none ${
              compact ? 'text-lg' : 'text-3xl sm:text-4xl'
            }`}
          >
            {filled}
          </p>
          <p
            className={`text-luxe-muted mt-1 truncate max-w-full text-center ${
              compact ? 'text-[9px]' : 'text-xs mt-1.5'
            }`}
          >
            {centerLabel || pct}
          </p>
        </div>
      </div>
    </div>
  )
}

function InsuranceBarChart({ data, compact }) {
  if (!data.length) {
    return (
      <div className="h-full flex items-center justify-center text-sm text-gray-500">
        No insurance funnel data for this facility and range.
      </div>
    )
  }

  const margin = compact
    ? { top: 16, right: 12, left: 0, bottom: 4 }
    : { top: 5, right: 5, left: 5, bottom: 5 }
  const labelSize = compact ? 8 : 10

  const content = [
    <CartesianGrid key="grid" strokeDasharray="3 3" vertical={false} />,
    <XAxis
      key="x"
      dataKey="name"
      tick={{ fontSize: compact ? 8 : 10 }}
      interval={0}
    />,
    <YAxis
      key="y"
      tick={{ fontSize: compact ? 9 : 11 }}
      allowDecimals={false}
    />,
    !compact ? <Tooltip key="tip" /> : null,
    <Legend key="legend" wrapperStyle={{ fontSize: compact ? 9 : 12 }} />,
    <Bar
      key="able"
      dataKey="able"
      name="Able to Accept"
      fill={ABLE_COLOR}
      radius={[4, 4, 0, 0]}
      label={{ position: 'top', fontSize: labelSize }}
      isAnimationActive={!compact}
    />,
    <Bar
      key="accepted"
      dataKey="accepted"
      name="Received/Accepted"
      fill={ACCEPTED_COLOR}
      radius={[4, 4, 0, 0]}
      label={{ position: 'top', fontSize: labelSize }}
      isAnimationActive={!compact}
    />,
  ]

  if (compact) {
    return (
      <div
        style={{
          width: '100%',
          height: PRINT_CHART_HEIGHT,
          overflow: 'hidden',
        }}
      >
        <BarChart
          width={PRINT_CHART_WIDTH}
          height={PRINT_CHART_HEIGHT}
          data={data}
          barGap={4}
          barCategoryGap="18%"
          margin={margin}
        >
          {content}
        </BarChart>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        barGap={4}
        barCategoryGap="18%"
        margin={margin}
      >
        {content}
      </BarChart>
    </ResponsiveContainer>
  )
}

function HouseBlock({
  house,
  location,
  monthLabel,
  compareLabel,
  insuranceRange,
  onInsuranceRangeChange,
  monthRangeOptions,
  compact,
}) {
  return (
    <div className="branch-house-print-page space-y-5">
      <div className="branch-print-house-header">
        <h3 className="text-2xl sm:text-[1.65rem] font-serif font-semibold text-luxe-text tracking-tight print:text-xl">
          {house.name}
        </h3>
        <p className="hidden print:block text-xs text-gray-500 mt-0.5">
          {location}
          {monthLabel ? ` · ${monthLabel}` : ''}
        </p>
      </div>

      <KpiRow
        current={house.current}
        previous={house.previous}
        compareLabel={compareLabel}
      />

      <div className="branch-print-charts space-y-5">
        <ChartCard
          title="Able to Accept, Received/Accepted & Not Admitted"
          compact={compact}
        >
          <TripleMetricBarChart
            key={compact ? 'trend-print' : 'trend-screen'}
            data={house.trendData}
            compact={compact}
          />
        </ChartCard>

        <ChartCard
          title="Able to Accept, Received/Accepted by Insurance"
          compact={compact}
          filter={
            <select
              value={insuranceRange}
              onChange={(e) => onInsuranceRangeChange(Number(e.target.value))}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-navy/30"
            >
              {monthRangeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.value === 1 ? '1 Month' : `${opt.value} Months`}
                </option>
              ))}
            </select>
          }
        >
          <InsuranceBarChart
            key={compact ? 'ins-print' : 'ins-screen'}
            data={house.ableAcceptedByInsurance}
            compact={compact}
          />
        </ChartCard>

        <section className="branch-print-chart-card branch-print-medicare bg-white rounded-xl border border-gray-200 shadow-md p-4 sm:p-5">
          <div className={compact ? 'mb-1' : 'mb-3'}>
            <p className="text-xs font-semibold uppercase tracking-wide text-luxe-muted">
              Medicare Referrals
            </p>
            <div className="flex flex-wrap items-center justify-between gap-2 mt-1">
              <h3
                className={`font-bold text-gray-900 ${
                  compact ? 'text-xs' : 'text-base'
                }`}
              >
                Able to Accept & Received/Accepted
              </h3>
              {compact ? (
                <p className="text-[10px] text-luxe-muted">
                  Rate{' '}
                  <span
                    className={`font-semibold ${
                      house.medicare.isGreen
                        ? 'text-emerald-700'
                        : 'text-red-700'
                    }`}
                  >
                    {house.medicare.acceptanceRate.toFixed(1)}%
                  </span>
                </p>
              ) : (
                <p className="text-xs text-luxe-muted">
                  Medicare only · Color: green if Received/Accepted ≥ 70% of Able,
                  otherwise red
                  {' · '}
                  Current rate{' '}
                  <span
                    className={`font-semibold ${
                      house.medicare.isGreen
                        ? 'text-emerald-700'
                        : 'text-red-700'
                    }`}
                  >
                    {house.medicare.acceptanceRate.toFixed(1)}%
                  </span>
                </p>
              )}
            </div>
          </div>
          <div
            className={`branch-print-medicare-grid grid grid-cols-1 sm:grid-cols-2 ${
              compact ? 'gap-1' : 'gap-4 sm:gap-6'
            }`}
          >
            <QuietCircleChart
              title="Able to Accept"
              value={house.medicare.able}
              total={house.medicare.ableTotal}
              color={house.medicare.color}
              centerLabel={pctLabel(house.medicare.able, house.medicare.able)}
              compact={compact}
            />
            <QuietCircleChart
              title="Received/Accepted"
              value={house.medicare.accepted}
              total={Math.max(house.medicare.able, 1)}
              color={house.medicare.color}
              centerLabel={pctLabel(
                house.medicare.accepted,
                house.medicare.able
              )}
              compact={compact}
            />
          </div>
        </section>
      </div>
    </div>
  )
}

export default function BranchComparison() {
  const { user } = useAuth()
  const isSuperAdmin = user?.role === 'super_admin'

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [houses, setHouses] = useState([])
  const [referrals, setReferrals] = useState([])

  const [selectedLocation, setSelectedLocation] = useState('')
  const [selectedMonth, setSelectedMonth] = useState('')
  const [insuranceRange, setInsuranceRange] = useState(2)
  const [printCompact, setPrintCompact] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [housesData, referralsData] = await Promise.all([
        apiRequest('/api/houses'),
        apiRequest('/api/referrals?all=1'),
      ])
      setHouses(housesData.houses || [])
      setReferrals(referralsData.referrals || [])
    } catch (err) {
      setError(err.message || 'Failed to load branch comparison data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const visibleHouses = useMemo(() => {
    if (isSuperAdmin) return houses
    return houses.filter((h) => h.location === user?.location)
  }, [houses, isSuperAdmin, user?.location])

  const locations = useMemo(() => {
    const set = new Set(visibleHouses.map((h) => h.location).filter(Boolean))
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [visibleHouses])

  useEffect(() => {
    if (!locations.length) {
      setSelectedLocation('')
      return
    }
    if (!selectedLocation || !locations.includes(selectedLocation)) {
      setSelectedLocation(
        !isSuperAdmin && user?.location && locations.includes(user.location)
          ? user.location
          : locations[0]
      )
    }
  }, [locations, selectedLocation, isSuperAdmin, user?.location])

  const locationHouses = useMemo(() => {
    if (!selectedLocation) return []
    return visibleHouses
      .filter(
        (h) => h.location === selectedLocation && h.status !== 'Coming Soon'
      )
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [visibleHouses, selectedLocation])

  const locationReferrals = useMemo(() => {
    if (!selectedLocation) return []
    return referrals.filter((r) => r.location === selectedLocation)
  }, [referrals, selectedLocation])

  const monthOptions = useMemo(() => {
    const months = Array.from(
      new Set(locationReferrals.map((r) => r.month).filter(Boolean))
    ).sort()
    return months.length ? months : [monthKeyFromDate(new Date())]
  }, [locationReferrals])

  useEffect(() => {
    if (!selectedMonth || !monthOptions.includes(selectedMonth)) {
      setSelectedMonth(monthOptions[monthOptions.length - 1])
    }
  }, [monthOptions, selectedMonth])

  const previousMonth = useMemo(
    () => (selectedMonth ? shiftMonth(selectedMonth, -1) : ''),
    [selectedMonth]
  )

  const compareLabel = previousMonth
    ? formatMonthShort(previousMonth)
    : 'prior period'

  const chartMonths = useMemo(() => {
    if (!selectedMonth) return []
    return buildPeriodKeys(
      'monthly',
      Math.max(insuranceRange, 1),
      selectedMonth
    ).map((p) => p.key)
  }, [selectedMonth, insuranceRange])

  const houseBlocks = useMemo(() => {
    if (!selectedMonth || !locationHouses.length) return []

    const currentSet = new Set([selectedMonth])
    const previousSet = previousMonth ? new Set([previousMonth]) : new Set()

    return locationHouses.map((house) => {
      const houseRefs = referrals.filter((r) => r.houseId === String(house.id))
      const metrics = aggregateReferrals(houseRefs, new Set(chartMonths))
      const ableAcceptedByInsurance = Object.entries(metrics.byInsurance)
        .map(([name, vals]) => ({
          name,
          able: vals.able || 0,
          accepted: vals.accepted || 0,
        }))
        .filter((row) => row.able > 0 || row.accepted > 0)
        .sort((a, b) => a.name.localeCompare(b.name))

      const medicareCurrent = aggregateReferrals(
        houseRefs,
        currentSet,
        isMedicareInsurance
      )
      const medicareAble = medicareCurrent.able || 0
      const medicareAccepted = medicareCurrent.accepted || 0
      const acceptanceRate =
        medicareAble > 0 ? (medicareAccepted / medicareAble) * 100 : 0
      const isGreen = acceptanceRate >= 70

      return {
        id: house.id,
        name: house.name,
        current: aggregateReferrals(houseRefs, currentSet),
        previous: aggregateReferrals(houseRefs, previousSet),
        trendData: buildTrendRows(houseRefs, chartMonths),
        medicare: {
          able: medicareAble,
          accepted: medicareAccepted,
          ableTotal: Math.max(medicareAble, 1),
          acceptanceRate,
          isGreen,
          color: isGreen ? '#2F6B4F' : '#B42318',
        },
        ableAcceptedByInsurance,
      }
    })
  }, [
    locationHouses,
    referrals,
    selectedMonth,
    previousMonth,
    chartMonths,
  ])

  const monthRangeOptions = RANGE_OPTIONS.monthly

  const printMonthLabel = selectedMonth
    ? formatMonthLabel(selectedMonth) || formatMonthShort(selectedMonth)
    : ''

  const handleDownloadPdf = () => {
    let cleaned = false
    let safetyTimer = null

    const cleanup = () => {
      if (cleaned) return
      cleaned = true
      document.body.classList.remove('branch-comparison-printing')
      setPrintCompact(false)
      window.removeEventListener('afterprint', cleanup)
      mediaQuery?.removeEventListener?.('change', onMediaChange)
      if (safetyTimer) window.clearTimeout(safetyTimer)
    }

    const onMediaChange = (event) => {
      // When leaving print preview / dialog, restore normal screen layout
      if (!event.matches) cleanup()
    }

    const mediaQuery =
      typeof window.matchMedia === 'function'
        ? window.matchMedia('print')
        : null
    mediaQuery?.addEventListener?.('change', onMediaChange)
    window.addEventListener('afterprint', cleanup)

    document.body.classList.add('branch-comparison-printing')
    setPrintCompact(true)

    // Wait for fixed-size charts to mount and paint, then print
    window.setTimeout(() => {
      window.print()
      // Fallback if afterprint never fires (some Windows PDF drivers)
      safetyTimer = window.setTimeout(cleanup, 1500)
    }, 450)
  }

  useEffect(() => {
    return () => {
      document.body.classList.remove('branch-comparison-printing')
    }
  }, [])

  return (
    <PageShell
      title="Branch Comparison"
      subtitle="Select a location to compare each facility — KPIs and charts, one house at a time."
      bare
      fullWidth
      headerClassName="print:hidden"
      actions={
        <div
          className="flex flex-wrap items-center gap-2 print:hidden"
          data-print-hide
        >
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="min-w-[12rem] px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-navy/30"
            disabled={!locations.length}
          >
            {!locations.length && <option value="">No locations</option>}
            {locations.map((location) => (
              <option key={location} value={location}>
                {location}
              </option>
            ))}
          </select>

          <MonthPicker
            value={selectedMonth || monthOptions[monthOptions.length - 1]}
            onChange={setSelectedMonth}
            buttonClassName="min-w-[9rem] flex items-center justify-between gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg text-left text-gray-700 bg-white hover:border-navy focus:outline-none focus:ring-2 focus:ring-navy/30"
            labelFormatter={(value) => {
              const label = formatMonthLabel(value)
              return label ? label.split(',')[0] : formatMonthShort(value)
            }}
          />

          <button
            type="button"
            onClick={handleDownloadPdf}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-luxe-btn hover:bg-luxe-olive-dark text-white rounded-lg transition"
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
      }
    >
      {loading && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-md p-10 text-center text-gray-500">
          Loading branch comparison...
        </div>
      )}

      {!loading && error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {!loading && !error && houseBlocks.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-md p-10 text-center text-gray-500">
          {selectedLocation
            ? `No active facilities found for ${selectedLocation}.`
            : 'Select a location to view facility comparisons.'}
        </div>
      )}

      {!loading && !error && houseBlocks.length > 0 && (
        <div className="space-y-12 print:space-y-0">
          {houseBlocks.map((house) => (
            <HouseBlock
              key={house.id}
              house={house}
              location={selectedLocation}
              monthLabel={printMonthLabel}
              compareLabel={compareLabel}
              insuranceRange={insuranceRange}
              onInsuranceRangeChange={setInsuranceRange}
              monthRangeOptions={monthRangeOptions}
              compact={printCompact}
            />
          ))}
        </div>
      )}
    </PageShell>
  )
}
