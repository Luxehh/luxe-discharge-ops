import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import MonthPicker, { formatMonthLabel } from '../components/MonthPicker'
import PageShell from '../components/PageShell'
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

function isMedicareInsurance(name) {
  return String(name || '')
    .toLowerCase()
    .includes('medicare')
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

function TripleTrendChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 28, right: 16, left: 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
        <Tooltip
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
        <Legend
          verticalAlign="top"
          align="center"
          wrapperStyle={{ paddingBottom: 12, fontSize: 12 }}
        />
        <Line
          type="monotone"
          dataKey="able"
          name="Able to Accept (% of total able)"
          stroke={TREND_ABLE}
          strokeWidth={2}
          dot={{ r: 3, fill: TREND_ABLE }}
          activeDot={{ r: 5 }}
        >
          <LabelList
            dataKey="ableLabel"
            position="top"
            style={{ fill: TREND_ABLE, fontSize: 10, fontWeight: 600 }}
          />
        </Line>
        <Line
          type="monotone"
          dataKey="accepted"
          name="Received/Accepted (% of able)"
          stroke={TREND_ACCEPTED}
          strokeWidth={2}
          dot={{ r: 3, fill: TREND_ACCEPTED }}
          activeDot={{ r: 5 }}
        >
          <LabelList
            dataKey="acceptedLabel"
            position="top"
            style={{ fill: TREND_ACCEPTED, fontSize: 10, fontWeight: 600 }}
          />
        </Line>
        <Line
          type="monotone"
          dataKey="notAdmitted"
          name="Not Admitted (% of accepted)"
          stroke={TREND_NOT_ADMITTED}
          strokeWidth={2}
          dot={{ r: 3, fill: TREND_NOT_ADMITTED }}
          activeDot={{ r: 5 }}
        >
          <LabelList
            dataKey="notAdmittedLabel"
            position="top"
            style={{ fill: TREND_NOT_ADMITTED, fontSize: 10, fontWeight: 600 }}
          />
        </Line>
      </LineChart>
    </ResponsiveContainer>
  )
}

export default function BranchComparison() {
  const { user } = useAuth()
  const isSuperAdmin = user?.role === 'super_admin'

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [houses, setHouses] = useState([])
  const [referrals, setReferrals] = useState([])

  const [scope, setScope] = useState('all')
  const [selectedMonth, setSelectedMonth] = useState('')
  const [insuranceRange, setInsuranceRange] = useState(2)

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

  useEffect(() => {
    if (!isSuperAdmin && user?.location && scope === 'all') {
      setScope(`loc:${user.location}`)
    }
  }, [isSuperAdmin, user?.location, scope])

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

  const filteredReferrals = useMemo(() => {
    let list = referrals
    if (!isSuperAdmin && user?.location) {
      list = list.filter((r) => r.location === user.location)
    }
    if (scope === 'all') return list
    if (scope.startsWith('loc:')) {
      const location = scope.slice(4)
      return list.filter((r) => r.location === location)
    }
    if (scope.startsWith('house:')) {
      const id = scope.slice(6)
      return list.filter((r) => r.houseId === id)
    }
    return list
  }, [referrals, scope, isSuperAdmin, user?.location])

  const monthOptions = useMemo(() => {
    const months = Array.from(
      new Set(filteredReferrals.map((r) => r.month).filter(Boolean))
    ).sort()
    return months.length ? months : [monthKeyFromDate(new Date())]
  }, [filteredReferrals])

  useEffect(() => {
    if (!selectedMonth || !monthOptions.includes(selectedMonth)) {
      setSelectedMonth(monthOptions[monthOptions.length - 1])
    }
  }, [monthOptions, selectedMonth])

  const previousMonth = useMemo(
    () => (selectedMonth ? shiftMonth(selectedMonth, -1) : ''),
    [selectedMonth]
  )

  const current = useMemo(
    () =>
      selectedMonth
        ? aggregateReferrals(filteredReferrals, new Set([selectedMonth]))
        : emptyMetrics(),
    [filteredReferrals, selectedMonth]
  )

  const previous = useMemo(
    () =>
      previousMonth
        ? aggregateReferrals(filteredReferrals, new Set([previousMonth]))
        : emptyMetrics(),
    [filteredReferrals, previousMonth]
  )

  const compareLabel = previousMonth
    ? formatMonthShort(previousMonth)
    : 'prior period'

  const facilitySections = useMemo(() => {
    if (scope === 'all' || !selectedMonth) return []

    let facilities = visibleHouses.filter((h) => h.status !== 'Coming Soon')

    if (scope.startsWith('loc:')) {
      const location = scope.slice(4)
      facilities = facilities.filter((h) => h.location === location)
    } else if (scope.startsWith('house:')) {
      const id = scope.slice(6)
      facilities = facilities.filter((h) => h.id === id)
    } else {
      return []
    }

    const currentSet = new Set([selectedMonth])
    const previousSet = previousMonth ? new Set([previousMonth]) : new Set()

    return facilities.map((house) => {
      const houseRefs = referrals.filter((r) => r.houseId === String(house.id))
      return {
        id: house.id,
        name: house.name,
        current: aggregateReferrals(houseRefs, currentSet),
        previous: aggregateReferrals(houseRefs, previousSet),
      }
    })
  }, [visibleHouses, scope, referrals, selectedMonth, previousMonth])

  const chartMonths = useMemo(() => {
    if (!selectedMonth) return []
    return buildPeriodKeys(
      'monthly',
      Math.max(insuranceRange, 1),
      selectedMonth
    ).map((p) => p.key)
  }, [selectedMonth, insuranceRange])

  const trendData = useMemo(
    () => buildTrendRows(filteredReferrals, chartMonths),
    [filteredReferrals, chartMonths]
  )

  const medicareTrendData = useMemo(
    () => buildTrendRows(filteredReferrals, chartMonths, isMedicareInsurance),
    [filteredReferrals, chartMonths]
  )

  const ableAcceptedByInsurance = useMemo(() => {
    const metrics = aggregateReferrals(
      filteredReferrals,
      new Set(chartMonths)
    )
    return Object.entries(metrics.byInsurance)
      .map(([name, vals]) => ({
        name,
        able: vals.able || 0,
        accepted: vals.accepted || 0,
      }))
      .filter((row) => row.able > 0 || row.accepted > 0)
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [filteredReferrals, chartMonths])

  const scopeLabel = useMemo(() => {
    if (scope === 'all') return 'All Locations (All Facilities)'
    if (scope.startsWith('loc:')) return `${scope.slice(4)} (All Facilities)`
    if (scope.startsWith('house:')) {
      const house = visibleHouses.find((h) => h.id === scope.slice(6))
      return house ? `${house.name}, ${house.location}` : 'Facility'
    }
    return 'All Locations (All Facilities)'
  }, [scope, visibleHouses])

  const monthRangeOptions = RANGE_OPTIONS.monthly

  return (
    <PageShell
      title="Branch Comparison"
      subtitle="Compare the latest period against the one before it — all locations or for a single facility."
      bare
      fullWidth
      actions={
        <div
          className="flex flex-wrap items-center gap-2 print:hidden"
          data-print-hide
        >
          <select
            value={scope}
            onChange={(e) => setScope(e.target.value)}
            className="min-w-[12rem] px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-navy/30"
            title={scopeLabel}
          >
            {isSuperAdmin && (
              <option value="all">All Locations (All Facilities)</option>
            )}
            {Object.entries(housesByLocation).map(([location, list]) => (
              <optgroup key={location} label={location}>
                <option value={`loc:${location}`}>
                  {location} (All Facilities)
                </option>
                {list.map((house) => (
                  <option key={house.id} value={`house:${house.id}`}>
                    {house.name}
                  </option>
                ))}
              </optgroup>
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
            onClick={() => window.print()}
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

      {!loading && !error && (
        <div className="space-y-8">
          <KpiRow
            current={current}
            previous={previous}
            compareLabel={compareLabel}
          />

          {facilitySections.map((facility) => (
            <div key={facility.id} className="space-y-3">
              <h3 className="text-2xl sm:text-[1.65rem] font-serif font-semibold text-luxe-text tracking-tight">
                {facility.name}
              </h3>
              <KpiRow
                current={facility.current}
                previous={facility.previous}
                compareLabel={compareLabel}
              />
            </div>
          ))}

          <ChartCard title="Able to Accept, Received/Accepted & Not Admitted — Trend">
            <TripleTrendChart data={trendData} />
          </ChartCard>

          <ChartCard
            title="Able to Accept, Received/Accepted by Insurance"
            filter={
              <select
                value={insuranceRange}
                onChange={(e) => setInsuranceRange(Number(e.target.value))}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-navy/30"
              >
                {monthRangeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.value === 1
                      ? '1 Month'
                      : `${opt.value} Months`}
                  </option>
                ))}
              </select>
            }
          >
            {ableAcceptedByInsurance.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-gray-500">
                No insurance funnel data for this scope and range.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={ableAcceptedByInsurance}
                  barGap={4}
                  barCategoryGap="18%"
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="able"
                    name="Able to Accept"
                    fill={ABLE_COLOR}
                    radius={[4, 4, 0, 0]}
                    label={{ position: 'top', fontSize: 10 }}
                  />
                  <Bar
                    dataKey="accepted"
                    name="Received/Accepted"
                    fill={ACCEPTED_COLOR}
                    radius={[4, 4, 0, 0]}
                    label={{ position: 'top', fontSize: 10 }}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard title="Medicare — Able to Accept, Received/Accepted & Not Admitted">
            <TripleTrendChart data={medicareTrendData} />
          </ChartCard>
        </div>
      )}
    </PageShell>
  )
}
