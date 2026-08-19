import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import OverviewToolbar, {
  defaultOverviewMonth,
  overviewPeriodLabel,
} from '../components/OverviewToolbar'
import PageShell from '../components/PageShell'
import ReferralFunnelSummary from '../components/ReferralFunnelSummary'
import { apiRequest } from '../utils/api'
import { mergeReferrals } from '../utils/funnelStats'

function buildQuery(period, month, year) {
  const params = new URLSearchParams()
  params.set('period', period)
  if (period === 'Yearly') params.set('year', String(year))
  else params.set('month', month)
  return params.toString()
}

export default function OverviewHouse() {
  const { location: locationParam, houseId } = useParams()
  const location = decodeURIComponent(locationParam || '')
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()

  const period = searchParams.get('period') === 'Yearly' ? 'Yearly' : 'Monthly'
  const month = searchParams.get('month') || defaultOverviewMonth()
  const year = Number(searchParams.get('year')) || new Date().getFullYear()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [house, setHouse] = useState(null)
  const [referral, setReferral] = useState(null)
  const [reasons, setReasons] = useState([])

  const isSuperAdmin = user?.role === 'super_admin'
  const query = buildQuery(period, month, year)
  const periodLabel = overviewPeriodLabel(period, month, year)

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
        setHouse(null)
        setReferral(null)
        return
      }

      const [housesData, reasonsData] = await Promise.all([
        apiRequest('/api/houses'),
        apiRequest('/api/reasons'),
      ])

      const found = (housesData.houses || []).find((h) => h.id === houseId)
      setHouse(found || null)
      setReasons(reasonsData.reasons || [])

      if (period === 'Yearly') {
        const data = await apiRequest(
          `/api/referrals?year=${encodeURIComponent(year)}`
        )
        const houseRefs = (data.referrals || []).filter(
          (r) => r.houseId === String(houseId)
        )
        setReferral(mergeReferrals(houseRefs))
        if (!houseRefs.length) {
          setError(`No discharge details found for this house in ${year}.`)
        }
      } else {
        const data = await apiRequest(
          `/api/referrals?houseId=${encodeURIComponent(houseId)}&month=${encodeURIComponent(month)}`
        )
        setReferral(data.referral || null)
        if (!data.referral) {
          setError(
            `No discharge details found for this house and ${periodLabel}.`
          )
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load house summary')
      setReferral(null)
    } finally {
      setLoading(false)
    }
  }, [
    houseId,
    location,
    period,
    month,
    year,
    isSuperAdmin,
    user?.location,
    periodLabel,
  ])

  useEffect(() => {
    load()
  }, [load])

  const displayLocation = house?.location || referral?.location || location
  const displayName = house?.name || referral?.houseName || 'House'

  const addReferralLink = useMemo(() => {
    const params = new URLSearchParams()
    params.set('houseId', houseId)
    if (period === 'Monthly') params.set('month', month)
    return `/add-referral?${params.toString()}`
  }, [houseId, month, period])

  return (
    <PageShell
      title="Overview"
      subtitle="Discharge funnel — not able to accept, able to accept, received/accepted and not admitted, broken out by insurance."
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
        {isSuperAdmin && (
          <>
            <Link
              to={`/overview?${query}`}
              className="text-blue-600 hover:text-blue-800"
            >
              All Locations
            </Link>
            <span className="mx-1.5 text-gray-400">/</span>
          </>
        )}
        <Link
          to={`/overview/${encodeURIComponent(displayLocation)}?${query}`}
          className="text-blue-600 hover:text-blue-800"
        >
          {displayLocation}
        </Link>
        <span className="mx-1.5 text-gray-400">/</span>
        <span className="font-bold text-gray-900">{displayName}</span>
      </nav>

      {loading && (
        <div className="py-10 text-center text-gray-500">
          Loading discharge view...
        </div>
      )}

      {!loading && error && !referral && (
        <div className="space-y-4">
          <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {error}
          </div>
          {period === 'Monthly' && (
            <Link
              to={addReferralLink}
              className="inline-flex text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              Add referral details for this month
            </Link>
          )}
        </div>
      )}

      {!loading && referral && (
        <ReferralFunnelSummary
          houseName={displayName}
          location={displayLocation}
          monthLabel={periodLabel}
          totalDischarge={Number(referral.totalDischarge) || 0}
          dischargeWithHomeHealth={
            Number(referral.dischargeWithHomeHealth) || 0
          }
          notAbleRows={(referral.notAbleToAccept || []).map((row) => ({
            reasonId: row.reasonId || '',
            reasonName: row.reasonName || '',
            count: Number(row.count) || 0,
          }))}
          ableRows={(referral.ableToAccept || []).map((row) => ({
            insuranceId: row.insuranceId || '',
            insuranceName: row.insuranceName || '',
            count: Number(row.count) || 0,
            accepted: Number(row.accepted) || 0,
            notAdmitted: Number(row.notAdmitted) || 0,
          }))}
          reasons={reasons}
        />
      )}
    </PageShell>
  )
}
