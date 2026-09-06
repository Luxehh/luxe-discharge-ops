import { useCallback, useEffect, useMemo, useState } from 'react'
import PageShell from '../components/PageShell'
import MonthPicker, { formatMonthLabel } from '../components/MonthPicker'
import { useAuth } from '../context/AuthContext'
import { apiRequest } from '../utils/api'
import {
  formatMonthShort,
  monthKeyFromDate,
  shiftMonth,
} from '../utils/comparisonPeriods'
import { pctLabel } from '../utils/funnelStats'

function emptyMetrics() {
  return {
    totalDischarge: 0,
    dischargeWithHomeHealth: 0,
    notAble: 0,
    able: 0,
    accepted: 0,
    notAdmitted: 0,
  }
}

function accumulateReferral(metrics, referral) {
  metrics.totalDischarge += Number(referral.totalDischarge) || 0
  metrics.dischargeWithHomeHealth +=
    Number(referral.dischargeWithHomeHealth) || 0

  ;(referral.notAbleToAccept || []).forEach((row) => {
    metrics.notAble += Number(row.count) || 0
  })

  ;(referral.ableToAccept || []).forEach((row) => {
    metrics.able += Number(row.count) || 0
    metrics.accepted += Number(row.accepted) || 0
    metrics.notAdmitted += Number(row.notAdmitted) || 0
  })
}

function aggregateReferrals(referrals, monthSet) {
  const metrics = emptyMetrics()
  referrals.forEach((ref) => {
    if (monthSet && !monthSet.has(ref.month)) return
    accumulateReferral(metrics, ref)
  })
  return metrics
}

function aggregateNotAbleReasons(referrals, monthSet, reasons) {
  const map = new Map()

  ;(reasons || []).forEach((reason) => {
    map.set(String(reason.id), {
      key: String(reason.id),
      label: reason.name || 'Unknown',
      count: 0,
    })
  })

  referrals.forEach((ref) => {
    if (monthSet && !monthSet.has(ref.month)) return
    ;(ref.notAbleToAccept || []).forEach((row) => {
      const key = String(row.reasonId || row.reasonName || 'unknown')
      const existing = map.get(key)
      if (existing) {
        existing.count += Number(row.count) || 0
        if (!existing.label && row.reasonName) existing.label = row.reasonName
      } else {
        map.set(key, {
          key,
          label: row.reasonName || 'Unknown',
          count: Number(row.count) || 0,
        })
      }
    })
  })

  return Array.from(map.values()).sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count
    return a.label.localeCompare(b.label)
  })
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

function DetailList({ title, rows, emptyLabel }) {
  const total = rows.reduce((sum, row) => sum + (Number(row.count) || 0), 0)

  return (
    <section className="bg-white rounded-xl border border-gray-200 shadow-md overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-gray-100">
        <h3 className="text-sm font-bold uppercase tracking-wide text-gray-900">
          {title}
        </h3>
        <span className="text-sm font-bold text-gray-700">{total}</span>
      </div>
      <ul className="divide-y divide-gray-100">
        {rows.length === 0 ? (
          <li className="px-4 py-3 text-sm text-gray-500">{emptyLabel}</li>
        ) : (
          rows.map((row) => (
            <li
              key={row.key}
              className="flex items-center justify-between gap-4 px-4 py-3"
            >
              <span className="text-sm font-medium text-gray-900">
                {row.label}
              </span>
              <span className="text-sm font-semibold text-gray-800 tabular-nums">
                {row.count}
              </span>
            </li>
          ))
        )}
      </ul>
    </section>
  )
}

function HouseBlock({ house, location, monthLabel, compareLabel }) {
  return (
    <div className="data-analytics-house-page space-y-5 break-after-page">
      <div>
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

      <DetailList
        title="Not Able to Accept"
        rows={house.notAbleRows}
        emptyLabel="No not-able reasons recorded"
      />
    </div>
  )
}

export default function DataAnalytics() {
  const { user } = useAuth()
  const isSuperAdmin = user?.role === 'super_admin'

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [houses, setHouses] = useState([])
  const [referrals, setReferrals] = useState([])
  const [reasons, setReasons] = useState([])

  const [selectedLocation, setSelectedLocation] = useState('')
  const [selectedMonth, setSelectedMonth] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [housesData, referralsData, reasonsData] = await Promise.all([
        apiRequest('/api/houses'),
        apiRequest('/api/referrals?all=1'),
        apiRequest('/api/reasons'),
      ])
      setHouses(housesData.houses || [])
      setReferrals(referralsData.referrals || [])
      setReasons(reasonsData.reasons || [])
    } catch (err) {
      setError(err.message || 'Failed to load data analytics')
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

  const printMonthLabel = useMemo(() => {
    if (!selectedMonth) return ''
    const label = formatMonthLabel(selectedMonth)
    return label || formatMonthShort(selectedMonth)
  }, [selectedMonth])

  const houseBlocks = useMemo(() => {
    if (!selectedMonth || !locationHouses.length) return []

    const currentSet = new Set([selectedMonth])
    const previousSet = previousMonth ? new Set([previousMonth]) : new Set()

    return locationHouses.map((house) => {
      const houseRefs = referrals.filter((r) => r.houseId === String(house.id))

      return {
        id: house.id,
        name: house.name,
        current: aggregateReferrals(houseRefs, currentSet),
        previous: aggregateReferrals(houseRefs, previousSet),
        notAbleRows: aggregateNotAbleReasons(houseRefs, currentSet, reasons),
      }
    })
  }, [
    locationHouses,
    referrals,
    reasons,
    selectedMonth,
    previousMonth,
  ])

  function handleDownloadPdf() {
    window.print()
  }

  return (
    <PageShell
      title="Data Analytics"
      subtitle="Select a location and month — KPIs with Not Able details, one facility at a time."
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
          Loading data analytics...
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
            : 'Select a location to view data analytics.'}
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
            />
          ))}
        </div>
      )}
    </PageShell>
  )
}
