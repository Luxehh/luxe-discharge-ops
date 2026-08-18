import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import OverviewToolbar, {
  defaultOverviewMonth,
  overviewPeriodLabel,
} from '../components/OverviewToolbar'
import PageShell from '../components/PageShell'
import { apiRequest } from '../utils/api'
import { homePathForUser } from '../utils/roles'
import {
  pctLabel,
  sumAbleAcceptedNotAdmitted,
} from '../utils/funnelStats'

function buildQuery(period, month, year) {
  const params = new URLSearchParams()
  params.set('period', period)
  if (period === 'Yearly') params.set('year', String(year))
  else params.set('month', month)
  return params.toString()
}

export default function Overview() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()

  const period = searchParams.get('period') === 'Yearly' ? 'Yearly' : 'Monthly'
  const month = searchParams.get('month') || defaultOverviewMonth()
  const year = Number(searchParams.get('year')) || new Date().getFullYear()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [houses, setHouses] = useState([])
  const [referrals, setReferrals] = useState([])

  const isSuperAdmin = user?.role === 'super_admin'
  const query = buildQuery(period, month, year)

  const updateParams = useCallback(
    (next) => {
      const params = new URLSearchParams(searchParams)
      Object.entries(next).forEach(([key, value]) => {
        if (value == null || value === '') params.delete(key)
        else params.set(key, String(value))
      })
      setSearchParams(params, { replace: true })
    },
    [searchParams, setSearchParams]
  )

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const referralsPath =
        period === 'Yearly'
          ? `/api/referrals?year=${encodeURIComponent(year)}`
          : `/api/referrals?month=${encodeURIComponent(month)}`

      const [housesData, referralsData] = await Promise.all([
        apiRequest('/api/houses'),
        apiRequest(referralsPath),
      ])

      setHouses(housesData.houses || [])
      setReferrals(referralsData.referrals || [])
    } catch (err) {
      setError(err.message || 'Failed to load overview')
      setHouses([])
      setReferrals([])
    } finally {
      setLoading(false)
    }
  }, [period, month, year])

  useEffect(() => {
    load()
  }, [load])

  const locations = useMemo(() => {
    const map = new Map()

    houses.forEach((house) => {
      if (!isSuperAdmin && house.location !== user?.location) return
      if (!map.has(house.location)) {
        map.set(house.location, {
          name: house.location,
          houses: 0,
          able: 0,
          accepted: 0,
          notAdmitted: 0,
        })
      }
      const entry = map.get(house.location)
      entry.houses += 1
    })

    referrals.forEach((ref) => {
      if (!isSuperAdmin && ref.location !== user?.location) return
      if (!map.has(ref.location)) {
        map.set(ref.location, {
          name: ref.location,
          houses: 0,
          able: 0,
          accepted: 0,
          notAdmitted: 0,
        })
      }
      const entry = map.get(ref.location)
      const sums = sumAbleAcceptedNotAdmitted(ref)
      entry.able += sums.able
      entry.accepted += sums.accepted
      entry.notAdmitted += sums.notAdmitted
    })

    return Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    )
  }, [houses, referrals, isSuperAdmin, user?.location])

  const periodLabel = overviewPeriodLabel(period, month, year)

  if (!isSuperAdmin && user?.location) {
    return <Navigate to={homePathForUser(user, query)} replace />
  }

  return (
    <PageShell
      title="Overview"
      subtitle="Discharge funnel — not able to accept, able to accept, received/accepted and not admitted, broken out by insurance."
      bare
      fullWidth
      actions={
        <OverviewToolbar
          period={period}
          onPeriodChange={(next) => updateParams({ period: next })}
          month={month}
          onMonthChange={(next) =>
            updateParams({ month: next, period: 'Monthly' })
          }
          year={year}
          onYearChange={(next) =>
            updateParams({ year: next, period: 'Yearly' })
          }
          onDownloadPdf={() => window.print()}
        />
      }
    >
      <nav className="mb-5 text-sm">
        <span className="text-blue-600 font-medium">All Locations</span>
      </nav>

      {loading && (
        <div className="py-10 text-center text-gray-500">Loading locations...</div>
      )}

      {!loading && error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {!loading && !error && locations.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {locations.map((loc) => (
            <Link
              key={loc.name}
              to={`/overview/${encodeURIComponent(loc.name)}?${query}`}
              className="rounded-xl overflow-hidden bg-white shadow-md hover:shadow-lg transition block min-w-0"
            >
              <div
                className="px-4 py-3 text-white"
                style={{
                  background: 'linear-gradient(135deg, #5a5539, #6e6847)',
                }}
              >
                <h3 className="font-bold text-[17px] leading-tight">{loc.name}</h3>
                <p className="text-[13px] text-white/90 mt-0.5">
                  {loc.houses} {loc.houses === 1 ? 'Facility' : 'Facilities'}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 px-3 py-3.5">
                <div className="text-center min-w-0">
                  <p className="text-[22px] font-bold text-gray-900 leading-none">
                    {loc.accepted}
                  </p>
                  <p className="text-[11px] text-gray-500 mt-1.5 whitespace-nowrap">
                    Received/Accepted · {pctLabel(loc.accepted, loc.able)}
                  </p>
                </div>
                <div className="text-center min-w-0">
                  <p className="text-[22px] font-bold text-gray-900 leading-none">
                    {loc.notAdmitted}
                  </p>
                  <p className="text-[11px] text-gray-500 mt-1.5 whitespace-nowrap">
                    Not Admitted · {pctLabel(loc.notAdmitted, loc.accepted)}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {!loading && !error && locations.length === 0 && (
        <div className="py-10 text-center text-gray-500">
          No location data available for {periodLabel}.
        </div>
      )}
    </PageShell>
  )
}
