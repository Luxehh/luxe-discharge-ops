import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { apiRequest } from '../utils/api'
import { formatMonthLabel } from '../components/MonthPicker'
import PageShell from '../components/PageShell'
import ReferralFunnelSummary from '../components/ReferralFunnelSummary'

const PERIODS = ['Monthly', 'Yearly']

function shortMonthLabel(value) {
  if (!value || !/^\d{4}-\d{2}$/.test(value)) return '—'
  const [year, month] = value.split('-')
  const names = [
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
  return `${names[Number(month) - 1]} ${year}`
}

export default function ReferralView() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const houseId = searchParams.get('houseId') || ''
  const month = searchParams.get('month') || ''

  const [period, setPeriod] = useState('Monthly')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [referral, setReferral] = useState(null)
  const [reasons, setReasons] = useState([])

  const backToForm = `/add-referral?houseId=${encodeURIComponent(houseId)}&month=${encodeURIComponent(month)}`

  const load = useCallback(async () => {
    if (!houseId || !month) {
      setError('House and month are required')
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')
    try {
      const [referralData, reasonsData] = await Promise.all([
        apiRequest(
          `/api/referrals?houseId=${encodeURIComponent(houseId)}&month=${encodeURIComponent(month)}`
        ),
        apiRequest('/api/reasons'),
      ])

      if (!referralData.referral) {
        setError('No discharge details found for this house and month.')
        setReferral(null)
      } else {
        setReferral(referralData.referral)
      }
      setReasons(reasonsData.reasons || [])
    } catch (err) {
      setError(err.message || 'Failed to load discharge view')
      setReferral(null)
    } finally {
      setLoading(false)
    }
  }, [houseId, month])

  useEffect(() => {
    load()
  }, [load])

  const handleDownloadPdf = () => {
    window.print()
  }

  return (
    <PageShell
      title="Overview"
      subtitle="Discharge funnel — not able to accept, able to accept, accepted and not admitted, broken out by insurance."
      actions={
        <button
          type="button"
          onClick={() => navigate(backToForm)}
          className="inline-flex items-center gap-2 self-start px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 print:hidden"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Form
        </button>
      }
    >
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-5 print:hidden">
        <div className="inline-flex rounded-lg overflow-hidden border border-gray-300 bg-white">
          {PERIODS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setPeriod(item)}
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

        <button
          type="button"
          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg text-gray-700"
        >
          {shortMonthLabel(month)}
          <svg
            className="w-4 h-4 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <button
          type="button"
          onClick={handleDownloadPdf}
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

      {referral && (
        <nav className="mb-5 text-sm text-gray-600">
          <Link to="/overview" className="text-blue-600 hover:text-blue-800">
            All Locations
          </Link>
          <span className="mx-1.5 text-gray-400">/</span>
          <Link
            to={`/overview/${encodeURIComponent(referral.location)}?month=${encodeURIComponent(month)}&period=Monthly`}
            className="text-blue-600 hover:text-blue-800"
          >
            {referral.location}
          </Link>
          <span className="mx-1.5 text-gray-400">/</span>
          <span className="font-bold text-gray-900">{referral.houseName}</span>
        </nav>
      )}

      {loading && (
        <div className="py-10 text-center text-gray-500">
          Loading discharge view...
        </div>
      )}

      {!loading && error && (
        <div className="space-y-4">
          <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {error}
          </div>
          <Link
            to={backToForm}
            className="inline-flex text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            Return to Add Referral Details
          </Link>
        </div>
      )}

      {!loading && !error && referral && (
        <ReferralFunnelSummary
          houseName={referral.houseName}
          location={referral.location}
          monthLabel={formatMonthLabel(referral.month)}
          totalDischarge={Number(referral.totalDischarge) || 0}
          dischargeWithHomeHealth={Number(referral.dischargeWithHomeHealth) || 0}
          notAbleRows={(referral.notAbleToAccept || []).map((row) => ({
            reasonId: row.reasonId || '',
            reasonName: row.reasonName || '',
            categoryId: row.categoryId || '',
            categoryName: row.categoryName || '',
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
