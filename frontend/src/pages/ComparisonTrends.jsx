import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  LabelList,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import PageShell from '../components/PageShell'
import { useAuth } from '../context/AuthContext'
import { apiRequest } from '../utils/api'
import {
  PERIOD_TYPES,
  RANGE_OPTIONS,
  buildPeriodKeys,
  chartRangeLabel,
  formatMonthShort,
  monthKeyFromDate,
} from '../utils/comparisonPeriods'
import { pctLabel } from '../utils/funnelStats'

const FUNNEL_COLORS = ['#D4B483', '#B8860B', '#8B6914', '#6B4F0A']
const ACCEPT_COLORS = ['#A7C4A0', '#2F6B4F', '#1E4D38', '#0F3324']
const NOT_ADMIT_COLORS = ['#7DB8B0', '#2A7A72', '#1A5A54', '#0F3D39']
const TYPE_COLORS = {
  green: '#2F6B4F',
  yellow: '#B8860B',
  red: '#B4534A',
}

const FUNNEL_METRICS = [
  { key: 'totalDischarge', label: 'DC Total' },
  { key: 'dischargeWithHomeHealth', label: 'DC w/ HH' },
  { key: 'notAble', label: 'Not Accept' },
  { key: 'able', label: 'Able Accept' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'notAdmitted', label: 'Not Admitted' },
]

function emptyMetrics() {
  return {
    totalDischarge: 0,
    dischargeWithHomeHealth: 0,
    notAble: 0,
    able: 0,
    accepted: 0,
    notAdmitted: 0,
    byInsurance: {},
    byType: {},
  }
}

function accumulateReferral(metrics, referral, insuranceTypeById) {
  metrics.totalDischarge += Number(referral.totalDischarge) || 0
  metrics.dischargeWithHomeHealth +=
    Number(referral.dischargeWithHomeHealth) || 0

  ;(referral.notAbleToAccept || []).forEach((row) => {
    metrics.notAble += Number(row.count) || 0
  })

  ;(referral.ableToAccept || []).forEach((row) => {
    const able = Number(row.count) || 0
    const accepted = Number(row.accepted) || 0
    const notAdmitted = Number(row.notAdmitted) || 0
    metrics.able += able
    metrics.accepted += accepted
    metrics.notAdmitted += notAdmitted

    const name = row.insuranceName || 'Other'
    if (!metrics.byInsurance[name]) {
      metrics.byInsurance[name] = { able: 0, accepted: 0, notAdmitted: 0 }
    }
    metrics.byInsurance[name].able += able
    metrics.byInsurance[name].accepted += accepted
    metrics.byInsurance[name].notAdmitted += notAdmitted

    const typeId = row.typeId || insuranceTypeById[row.insuranceId] || ''
    const typeKey = typeId || 'unknown'
    if (!metrics.byType[typeKey]) {
      metrics.byType[typeKey] = { accepted: 0, able: 0 }
    }
    metrics.byType[typeKey].accepted += accepted
    metrics.byType[typeKey].able += able
  })
}

function aggregateReferrals(referrals, monthSet, insuranceTypeById) {
  const metrics = emptyMetrics()
  referrals.forEach((ref) => {
    if (monthSet && !monthSet.has(ref.month)) return
    accumulateReferral(metrics, ref, insuranceTypeById)
  })
  return metrics
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

function ChartCard({ title, filter, children }) {
  return (
    <section className="bg-white rounded-xl border border-gray-200 shadow-md p-4 sm:p-5 break-inside-avoid">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h3 className="text-base font-bold text-gray-900">{title}</h3>
        {filter ? (
          <div className="print:hidden" data-print-hide>
            {filter}
          </div>
        ) : null}
      </div>
      <div className="w-full h-72 sm:h-80 print:h-72">{children}</div>
    </section>
  )
}

function RangeSelect({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-navy/30"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  )
}

export default function ComparisonTrends() {
  const { user } = useAuth()
  const isSuperAdmin = user?.role === 'super_admin'

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [houses, setHouses] = useState([])
  const [referrals, setReferrals] = useState([])
  const [insurances, setInsurances] = useState([])
  const [types, setTypes] = useState([])

  const [scope, setScope] = useState('all')
  const [periodType, setPeriodType] = useState('monthly')
  const [rangeCount, setRangeCount] = useState(2)
  const [chartRange, setChartRange] = useState(2)
  const [typeMixMonth, setTypeMixMonth] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [housesData, referralsData, insurancesData] = await Promise.all([
        apiRequest('/api/houses'),
        apiRequest('/api/referrals?all=1'),
        apiRequest('/api/insurances'),
      ])
      setHouses(housesData.houses || [])
      setReferrals(referralsData.referrals || [])
      setInsurances(insurancesData.insurances || [])
      setTypes(insurancesData.types || [])
    } catch (err) {
      setError(err.message || 'Failed to load comparison data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    const allowed = RANGE_OPTIONS[periodType] || RANGE_OPTIONS.monthly
    if (!allowed.some((o) => o.value === rangeCount)) {
      setRangeCount(allowed[0].value)
    }
    if (!allowed.some((o) => o.value === chartRange)) {
      setChartRange(allowed[0].value)
    }
  }, [periodType, rangeCount, chartRange])

  const visibleHouses = useMemo(() => {
    if (isSuperAdmin) return houses
    return houses.filter((h) => h.location === user?.location)
  }, [houses, isSuperAdmin, user?.location])

  const housesByLocation = useMemo(() => {
    const map = {}
    visibleHouses.forEach((house) => {
      if (!map[house.location]) map[house.location] = []
      map[house.location].push(house)
    })
    Object.values(map).forEach((list) =>
      list.sort((a, b) => a.name.localeCompare(b.name))
    )
    return map
  }, [visibleHouses])

  const insuranceTypeById = useMemo(() => {
    const map = {}
    insurances.forEach((ins) => {
      map[ins.id] = ins.typeId
    })
    return map
  }, [insurances])

  const typeNameById = useMemo(() => {
    const map = {}
    types.forEach((t) => {
      map[t.id] = t
    })
    return map
  }, [types])

  const filteredReferrals = useMemo(() => {
    let list = referrals
    if (!isSuperAdmin && user?.location) {
      list = list.filter((r) => r.location === user.location)
    }
    if (scope === 'all') return list
    if (scope.startsWith('loc:')) {
      const loc = scope.slice(4)
      return list.filter((r) => r.location === loc)
    }
    if (scope.startsWith('house:')) {
      const id = scope.slice(6)
      return list.filter((r) => r.houseId === id)
    }
    return list
  }, [referrals, scope, isSuperAdmin, user?.location])

  const latestDataMonth = useMemo(() => {
    if (!filteredReferrals.length) return monthKeyFromDate(new Date())
    return filteredReferrals
      .map((r) => r.month)
      .filter(Boolean)
      .sort()
      .at(-1)
  }, [filteredReferrals])

  const typeMixMonthOptions = useMemo(() => {
    const months = Array.from(
      new Set(filteredReferrals.map((r) => r.month).filter(Boolean))
    ).sort()
    // newest first for dropdown
    return [...months].reverse()
  }, [filteredReferrals])

  useEffect(() => {
    if (!typeMixMonthOptions.length) {
      setTypeMixMonth(latestDataMonth)
      return
    }
    if (!typeMixMonth || !typeMixMonthOptions.includes(typeMixMonth)) {
      setTypeMixMonth(typeMixMonthOptions[0])
    }
  }, [typeMixMonthOptions, typeMixMonth, latestDataMonth])

  const periods = useMemo(
    () => buildPeriodKeys(periodType, rangeCount, latestDataMonth),
    [periodType, rangeCount, latestDataMonth]
  )

  // KPI "vs prior" always needs a previous period, even when range is 1
  const comparisonPeriods = useMemo(
    () =>
      rangeCount >= 2
        ? periods
        : buildPeriodKeys(periodType, 2, latestDataMonth),
    [rangeCount, periods, periodType, latestDataMonth]
  )

  const chartPeriods = useMemo(
    () => buildPeriodKeys(periodType, chartRange, latestDataMonth),
    [periodType, chartRange, latestDataMonth]
  )

  const periodMetrics = useMemo(
    () =>
      comparisonPeriods.map((period) => ({
        ...period,
        metrics: aggregateReferrals(
          filteredReferrals,
          new Set(period.months),
          insuranceTypeById
        ),
      })),
    [comparisonPeriods, filteredReferrals, insuranceTypeById]
  )

  const chartPeriodMetrics = useMemo(
    () =>
      chartPeriods.map((period) => ({
        ...period,
        metrics: aggregateReferrals(
          filteredReferrals,
          new Set(period.months),
          insuranceTypeById
        ),
      })),
    [chartPeriods, filteredReferrals, insuranceTypeById]
  )

  const current = periodMetrics[periodMetrics.length - 1]?.metrics || emptyMetrics()
  const previous =
    periodMetrics[periodMetrics.length - 2]?.metrics || emptyMetrics()
  const compareLabel =
    periodMetrics[periodMetrics.length - 2]?.label || 'prior period'

  const funnelData = useMemo(() => {
    return FUNNEL_METRICS.map((metric) => {
      const row = { name: metric.label }
      chartPeriodMetrics.forEach((period) => {
        row[period.key] = period.metrics[metric.key] || 0
      })
      return row
    })
  }, [chartPeriodMetrics])

  const insuranceNames = useMemo(() => {
    const set = new Set()
    chartPeriodMetrics.forEach((period) => {
      Object.keys(period.metrics.byInsurance).forEach((name) => set.add(name))
    })
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [chartPeriodMetrics])

  const acceptedByInsurance = useMemo(() => {
    return insuranceNames.map((name) => {
      const row = { name }
      chartPeriodMetrics.forEach((period) => {
        row[period.key] = period.metrics.byInsurance[name]?.accepted || 0
      })
      return row
    })
  }, [insuranceNames, chartPeriodMetrics])

  const notAdmittedByInsurance = useMemo(() => {
    return insuranceNames.map((name) => {
      const row = { name }
      chartPeriodMetrics.forEach((period) => {
        row[period.key] = period.metrics.byInsurance[name]?.notAdmitted || 0
      })
      return row
    })
  }, [insuranceNames, chartPeriodMetrics])

  const trendData = useMemo(() => {
    // Always show monthly points across the selected chart window months
    const monthSet = new Set()
    chartPeriods.forEach((p) => p.months.forEach((m) => monthSet.add(m)))
    const months = Array.from(monthSet).sort()
    return months.map((month) => {
      const metrics = aggregateReferrals(
        filteredReferrals,
        new Set([month]),
        insuranceTypeById
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
  }, [chartPeriods, filteredReferrals, insuranceTypeById])

  const medicareTrendData = useMemo(() => {
    const monthSet = new Set()
    chartPeriods.forEach((p) => p.months.forEach((m) => monthSet.add(m)))
    const months = Array.from(monthSet).sort()

    return months.map((month) => {
      let totalAble = 0
      let able = 0
      let accepted = 0
      let notAdmitted = 0

      filteredReferrals.forEach((ref) => {
        if (ref.month !== month) return
        ;(ref.ableToAccept || []).forEach((row) => {
          const count = Number(row.count) || 0
          totalAble += count
          const name = (row.insuranceName || '').toLowerCase()
          if (!name.includes('medicare')) return
          able += count
          accepted += Number(row.accepted) || 0
          notAdmitted += Number(row.notAdmitted) || 0
        })
      })

      return {
        name: formatMonthShort(month),
        able,
        accepted,
        notAdmitted,
        ableLabel: `${able} (${pctLabel(able, totalAble)})`,
        acceptedLabel: `${accepted} (${pctLabel(accepted, able)})`,
        notAdmittedLabel: `${notAdmitted} (${pctLabel(notAdmitted, accepted)})`,
      }
    })
  }, [chartPeriods, filteredReferrals])

  const typeMixData = useMemo(() => {
    const monthKey = typeMixMonth || latestDataMonth
    const metrics = aggregateReferrals(
      filteredReferrals,
      new Set([monthKey]),
      insuranceTypeById
    )
    const rows = Object.entries(metrics.byType).map(([typeId, vals]) => {
      const type = typeNameById[typeId]
      return {
        name: type?.name || 'Other',
        value: vals.accepted,
        color: TYPE_COLORS[type?.color] || '#9CA3AF',
      }
    })
    return rows.filter((r) => r.value > 0)
  }, [
    typeMixMonth,
    latestDataMonth,
    filteredReferrals,
    insuranceTypeById,
    typeNameById,
  ])

  const typeMixTotal = typeMixData.reduce((sum, row) => sum + row.value, 0)

  const scopeLabel = useMemo(() => {
    if (scope === 'all') return 'All Locations (All Houses)'
    if (scope.startsWith('loc:')) return `${scope.slice(4)} (All Houses)`
    if (scope.startsWith('house:')) {
      const house = visibleHouses.find((h) => h.id === scope.slice(6))
      return house ? `${house.name}, ${house.location}` : 'House'
    }
    return 'All Locations (All Houses)'
  }, [scope, visibleHouses])

  const rangeOptions = RANGE_OPTIONS[periodType] || RANGE_OPTIONS.monthly

  return (
    <PageShell
      title="Comparison & Trends"
      subtitle="Compare the latest period against the one before it — company-wide or for a single house."
      bare
      actions={
        <div className="flex flex-wrap items-center gap-2 print:hidden" data-print-hide>
          <select
            value={scope}
            onChange={(e) => setScope(e.target.value)}
            className="min-w-[12rem] px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-navy/30"
            title={scopeLabel}
          >
            <option value="all">All Locations (All Houses)</option>
            {Object.entries(housesByLocation).map(([location, list]) => (
              <optgroup key={location} label={location}>
                <option value={`loc:${location}`}>{location} (All Houses)</option>
                {list.map((house) => (
                  <option key={house.id} value={`house:${house.id}`}>
                    {house.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>

          <select
            value={periodType}
            onChange={(e) => setPeriodType(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-navy/30"
          >
            {PERIOD_TYPES.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>

          <select
            value={rangeCount}
            onChange={(e) => {
              const next = Number(e.target.value)
              setRangeCount(next)
              setChartRange(next)
            }}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-navy/30"
          >
            {rangeOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-[#B8860B] hover:bg-[#9a7209] text-white rounded-lg transition"
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
          Loading comparison data...
        </div>
      )}

      {!loading && error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
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
              label="Accepted"
              value={current.accepted}
              suffix={`(${pctLabel(current.accepted, current.able)})`}
              trend={
                <Trend
                  current={current.accepted}
                  previous={previous.accepted}
                  compareLabel={compareLabel}
                  pctCurrent={{ part: current.accepted, whole: current.able }}
                  pctPrevious={{
                    part: previous.accepted,
                    whole: previous.able,
                  }}
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
                  pctCurrent={{
                    part: current.notAdmitted,
                    whole: current.accepted,
                  }}
                  pctPrevious={{
                    part: previous.notAdmitted,
                    whole: previous.accepted,
                  }}
                />
              }
            />
          </div>

          <ChartCard
            title="Funnel"
            filter={
              <RangeSelect
                value={chartRange}
                onChange={setChartRange}
                options={rangeOptions.map((o) => ({
                  value: o.value,
                  label: chartRangeLabel(periodType, o.value),
                }))}
              />
            }
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelData} barGap={4} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Legend />
                {chartPeriodMetrics.map((period, index) => (
                  <Bar
                    key={period.key}
                    dataKey={period.key}
                    name={period.label}
                    fill={FUNNEL_COLORS[index % FUNNEL_COLORS.length]}
                    radius={[4, 4, 0, 0]}
                    label={{ position: 'top', fontSize: 10 }}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            title="Accepted by insurance"
            filter={
              <RangeSelect
                value={chartRange}
                onChange={setChartRange}
                options={rangeOptions.map((o) => ({
                  value: o.value,
                  label: chartRangeLabel(periodType, o.value),
                }))}
              />
            }
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={acceptedByInsurance}
                barGap={4}
                barCategoryGap="18%"
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Legend />
                {chartPeriodMetrics.map((period, index) => (
                  <Bar
                    key={period.key}
                    dataKey={period.key}
                    name={period.label}
                    fill={ACCEPT_COLORS[index % ACCEPT_COLORS.length]}
                    radius={[4, 4, 0, 0]}
                    label={{ position: 'top', fontSize: 10 }}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            title="Not Admitted by insurance"
            filter={
              <RangeSelect
                value={chartRange}
                onChange={setChartRange}
                options={rangeOptions.map((o) => ({
                  value: o.value,
                  label: chartRangeLabel(periodType, o.value),
                }))}
              />
            }
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={notAdmittedByInsurance}
                barGap={4}
                barCategoryGap="18%"
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Legend />
                {chartPeriodMetrics.map((period, index) => (
                  <Bar
                    key={period.key}
                    dataKey={period.key}
                    name={period.label}
                    fill={NOT_ADMIT_COLORS[index % NOT_ADMIT_COLORS.length]}
                    radius={[4, 4, 0, 0]}
                    label={{ position: 'top', fontSize: 10 }}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Able to Accept, Accepted & Not Admitted — Trend">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={trendData}
                margin={{ top: 28, right: 16, left: 0, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  formatter={(value, name, item) => {
                    const row = item?.payload
                    if (!row) return [value, name]
                    if (name?.includes('Able to Accept')) return [row.ableLabel, name]
                    if (name?.includes('Accepted (%')) return [row.acceptedLabel, name]
                    if (name?.includes('Not Admitted')) return [row.notAdmittedLabel, name]
                    return [value, name]
                  }}
                />
                <Legend
                  verticalAlign="top"
                  align="center"
                  wrapperStyle={{ paddingBottom: 12, fontSize: 12 }}
                />
                <Line
                  type="monotone"
                  dataKey="able"
                  name="Able to Accept (% of total able)"
                  stroke="#E09A2B"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#E09A2B' }}
                  activeDot={{ r: 5 }}
                >
                  <LabelList
                    dataKey="ableLabel"
                    position="top"
                    style={{ fill: '#E09A2B', fontSize: 10, fontWeight: 600 }}
                  />
                </Line>
                <Line
                  type="monotone"
                  dataKey="accepted"
                  name="Accepted (% of able)"
                  stroke="#2F6B4F"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#2F6B4F' }}
                  activeDot={{ r: 5 }}
                >
                  <LabelList
                    dataKey="acceptedLabel"
                    position="top"
                    style={{ fill: '#2F6B4F', fontSize: 10, fontWeight: 600 }}
                  />
                </Line>
                <Line
                  type="monotone"
                  dataKey="notAdmitted"
                  name="Not Admitted (% of accepted)"
                  stroke="#2A7A72"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#2A7A72' }}
                  activeDot={{ r: 5 }}
                >
                  <LabelList
                    dataKey="notAdmittedLabel"
                    position="top"
                    style={{ fill: '#2A7A72', fontSize: 10, fontWeight: 600 }}
                  />
                </Line>
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Medicare — Able to Accept, Accepted & Not Admitted">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={medicareTrendData}
                margin={{ top: 28, right: 16, left: 0, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  formatter={(value, name, item) => {
                    const row = item?.payload
                    if (!row) return [value, name]
                    if (name?.includes('Able to Accept')) return [row.ableLabel, name]
                    if (name?.includes('Accepted (%')) return [row.acceptedLabel, name]
                    if (name?.includes('Not Admitted')) return [row.notAdmittedLabel, name]
                    return [value, name]
                  }}
                />
                <Legend
                  verticalAlign="top"
                  align="center"
                  wrapperStyle={{ paddingBottom: 12, fontSize: 12 }}
                />
                <Line
                  type="monotone"
                  dataKey="able"
                  name="Able to Accept (% of total able)"
                  stroke="#E09A2B"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#E09A2B' }}
                  activeDot={{ r: 5 }}
                >
                  <LabelList
                    dataKey="ableLabel"
                    position="top"
                    style={{ fill: '#E09A2B', fontSize: 10, fontWeight: 600 }}
                  />
                </Line>
                <Line
                  type="monotone"
                  dataKey="accepted"
                  name="Accepted (% of able)"
                  stroke="#2F6B4F"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#2F6B4F' }}
                  activeDot={{ r: 5 }}
                >
                  <LabelList
                    dataKey="acceptedLabel"
                    position="top"
                    style={{ fill: '#2F6B4F', fontSize: 10, fontWeight: 600 }}
                  />
                </Line>
                <Line
                  type="monotone"
                  dataKey="notAdmitted"
                  name="Not Admitted (% of accepted)"
                  stroke="#2A7A72"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#2A7A72' }}
                  activeDot={{ r: 5 }}
                >
                  <LabelList
                    dataKey="notAdmittedLabel"
                    position="top"
                    style={{ fill: '#2A7A72', fontSize: 10, fontWeight: 600 }}
                  />
                </Line>
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            title="Insurance Type Mix"
            filter={
              <select
                value={typeMixMonth || latestDataMonth}
                onChange={(e) => setTypeMixMonth(e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-navy/30"
              >
                {(typeMixMonthOptions.length
                  ? typeMixMonthOptions
                  : [latestDataMonth]
                ).map((month) => (
                  <option key={month} value={month}>
                    {formatMonthShort(month)}
                  </option>
                ))}
              </select>
            }
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={typeMixData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={2}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {typeMixData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
                <text
                  x="50%"
                  y="50%"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-gray-700 text-sm font-semibold"
                >
                  {typeMixTotal} Total accepted
                </text>
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          {!filteredReferrals.length && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-md p-6 text-center text-gray-500 text-sm">
              No referral data yet for this scope. Add monthly entries in Add
              Referral Details to populate these charts.
            </div>
          )}
        </div>
      )}
    </PageShell>
  )
}
