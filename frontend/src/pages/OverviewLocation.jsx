import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import OverviewToolbar, {
  defaultOverviewMonth,
  overviewPeriodLabel,
  shortMonthLabel,
} from '../components/OverviewToolbar'
import PageShell from '../components/PageShell'
import { apiRequest } from '../utils/api'
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

export default function OverviewLocation() {
  const { location: locationParam } = useParams()
  const location = decodeURIComponent(locationParam || '')
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
  const emptyLabel =
    period === 'Yearly'
      ? `No entry for ${year} yet.`
      : `No entry for ${shortMonthLabel(month)} yet.`

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
      if (!isSuperAdmin && user?.location && user.location !== location) {
        setError('You do not have access to this location')
        setHouses([])
        setReferrals([])
        return
      }

      const referralsPath =
        period === 'Yearly'
          ? `/api/referrals?year=${encodeURIComponent(year)}`
          : `/api/referrals?month=${encodeURIComponent(month)}`

      const [housesData, referralsData] = await Promise.all([
        apiRequest('/api/houses'),
        apiRequest(referralsPath),
      ])

      setHouses(
        (housesData.houses || []).filter((h) => h.location === location)
      )
      setReferrals(
        (referralsData.referrals || []).filter((r) => r.location === location)
      )
    } catch (err) {
      setError(err.message || 'Failed to load houses')
      setHouses([])
      setReferrals([])
    } finally {
      setLoading(false)
    }
  }, [location, period, month, year, isSuperAdmin, user?.location])

  useEffect(() => {
    load()
  }, [load])

  const houseCards = useMemo(() => {
    const byHouse = new Map()

    houses.forEach((house) => {
      byHouse.set(house.id, {
        id: house.id,
        name: house.name,
        location: house.location,
        status: house.status,
        hasEntry: false,
        able: 0,
        accepted: 0,
        notAdmitted: 0,
      })
    })

    referrals.forEach((ref) => {
      if (!byHouse.has(ref.houseId)) {
        byHouse.set(ref.houseId, {
          id: ref.houseId,
          name: ref.houseName,
          location: ref.location,
          status: 'Active',
          hasEntry: false,
          able: 0,
          accepted: 0,
          notAdmitted: 0,
        })
      }
      const entry = byHouse.get(ref.houseId)
      const sums = sumAbleAcceptedNotAdmitted(ref)
      entry.hasEntry = true
      entry.able += sums.able
      entry.accepted += sums.accepted
      entry.notAdmitted += sums.notAdmitted
    })

    return Array.from(byHouse.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    )
  }, [houses, referrals])

  return (
    <PageShell
      title="Overview"
      subtitle="Discharge funnel — not able to accept, able to accept, accepted and not admitted, broken out by insurance."
      bare
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
      <nav className="mb-5 text-sm text-gray-600">
        {isSuperAdmin ? (
          <>
            <Link
              to={`/overview?${query}`}
              className="text-blue-600 hover:text-blue-800"
            >
              All Locations
            </Link>
            <span className="mx-1.5 text-gray-400">/</span>
            <span className="font-bold text-gray-900">{location}</span>
          </>
        ) : (
          <span className="font-bold text-gray-900">{location}</span>
        )}
      </nav>

      {loading && (
        <div className="py-10 text-center text-gray-500">Loading houses...</div>
      )}

      {!loading && error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {!loading && !error && houseCards.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {houseCards.map((house) => {
            const isComingSoon = house.status === 'Coming Soon'
            const isDisabled = isComingSoon || !house.hasEntry

            if (isDisabled) {
              return (
                <div
                  key={house.id}
                  className="rounded-xl overflow-hidden bg-white shadow-md block cursor-not-allowed opacity-95"
                  aria-disabled="true"
                >
                  <div className="bg-gray-400 px-4 py-3 text-white">
                    <h3 className="font-bold text-[17px] leading-tight">
                      {house.name}
                    </h3>
                    <p className="text-[13px] text-white/90 mt-0.5">
                      {isComingSoon ? 'Coming Soon' : house.location}
                    </p>
                  </div>
                  <div className="px-4 py-8 text-center text-sm text-gray-400">
                    {isComingSoon
                      ? 'Data entry opens once this house is active.'
                      : emptyLabel}
                  </div>
                </div>
              )
            }

            return (
              <Link
                key={house.id}
                to={`/overview/${encodeURIComponent(location)}/${house.id}?${query}`}
                className="rounded-xl overflow-hidden bg-white shadow-md hover:shadow-lg transition block"
              >
                <div className="bg-navy px-4 py-3 text-white">
                  <h3 className="font-bold text-[17px] leading-tight">{house.name}</h3>
                  <p className="text-[13px] text-white/75 mt-0.5">{house.location}</p>
                </div>
                <div className="grid grid-cols-2 px-2 py-3.5">
                  <div className="text-center px-1">
                    <p className="text-[22px] font-bold text-gray-900 leading-none">
                      {house.accepted}
                    </p>
                    <p className="text-[10px] text-gray-500 mt-1.5 uppercase tracking-wide whitespace-nowrap">
                      Accepted · {pctLabel(house.accepted, house.able)}
                    </p>
                  </div>
                  <div className="text-center px-1">
                    <p className="text-[22px] font-bold text-gray-900 leading-none">
                      {house.notAdmitted}
                    </p>
                    <p className="text-[10px] text-gray-500 mt-1.5 uppercase tracking-wide whitespace-nowrap">
                      Not Admitted · {pctLabel(house.notAdmitted, house.accepted)}
                    </p>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {!loading && !error && houseCards.length === 0 && (
        <div className="py-10 text-center text-gray-500">
          No houses found for {location}.
        </div>
      )}
    </PageShell>
  )
}
