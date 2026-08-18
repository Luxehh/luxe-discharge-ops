import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { apiRequest } from '../utils/api'
import MonthPicker, { currentMonthValue } from '../components/MonthPicker'
import PageShell from '../components/PageShell'
import ReasonFormModal from '../components/ReasonFormModal'
import InsuranceFormModal from '../components/InsuranceFormModal'

function newRowId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function emptyReasonRow() {
  return { key: newRowId(), reasonId: '', count: '' }
}

function emptyInsuranceRow() {
  return {
    key: newRowId(),
    insuranceId: '',
    count: '',
    accepted: '',
    notAdmitted: '',
  }
}

function toNumber(value) {
  if (value === '' || value === null || value === undefined) return 0
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

function sumCounts(rows, field = 'count') {
  return rows.reduce((sum, row) => sum + toNumber(row[field]), 0)
}

function RemoveButton({ onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="shrink-0 w-8 h-8 flex items-center justify-center rounded-md text-red-500 hover:bg-red-50 disabled:opacity-40"
      aria-label="Remove row"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  )
}

export default function AddReferral() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [houses, setHouses] = useState([])
  const [reasons, setReasons] = useState([])
  const [categories, setCategories] = useState([])
  const [insurances, setInsurances] = useState([])
  const [insuranceTypes, setInsuranceTypes] = useState([])
  const [locations, setLocations] = useState([])

  const [houseId, setHouseId] = useState(searchParams.get('houseId') || '')
  const [month, setMonth] = useState(searchParams.get('month') || currentMonthValue())
  const [totalDischarge, setTotalDischarge] = useState('')
  const [dischargeWithHomeHealth, setDischargeWithHomeHealth] = useState('')
  const [notAbleRows, setNotAbleRows] = useState([emptyReasonRow()])
  const [ableRows, setAbleRows] = useState([emptyInsuranceRow()])

  const [loadingMeta, setLoadingMeta] = useState(true)
  const [loadingRecord, setLoadingRecord] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [recordId, setRecordId] = useState(null)

  const [reasonModalOpen, setReasonModalOpen] = useState(false)
  const [insuranceModalOpen, setInsuranceModalOpen] = useState(false)

  const selectedHouse = useMemo(
    () => houses.find((h) => h.id === houseId) || null,
    [houses, houseId]
  )

  const housesByLocation = useMemo(() => {
    const groups = {}
    houses.forEach((house) => {
      if (!groups[house.location]) groups[house.location] = []
      groups[house.location].push(house)
    })
    return groups
  }, [houses])

  const locationInsurances = useMemo(() => {
    if (!selectedHouse?.location) return []
    return insurances.filter((item) => item.location === selectedHouse.location)
  }, [insurances, selectedHouse])

  const notAbleTotal = sumCounts(notAbleRows)
  const ableTotal = sumCounts(ableRows)
  const acceptedTotal = sumCounts(ableRows, 'accepted')
  const notAdmittedTotal = sumCounts(ableRows, 'notAdmitted')
  const homeHealth = toNumber(dischargeWithHomeHealth)

  const homeHealthMismatch =
    homeHealth > 0 && notAbleTotal + ableTotal !== homeHealth

  const splitMismatch = ableRows.some((row) => {
    if (!row.insuranceId && toNumber(row.count) === 0) return false
    const total = toNumber(row.count)
    const accepted = toNumber(row.accepted)
    const notAdmitted = toNumber(row.notAdmitted)
    return accepted + notAdmitted !== total
  })

  const canSave =
    !!selectedHouse &&
    !!month &&
    !splitMismatch &&
    ableRows.every((row) => {
      if (!row.insuranceId && toNumber(row.count) === 0) return true
      return !!row.insuranceId
    })

  const loadMeta = useCallback(async () => {
    setLoadingMeta(true)
    setError('')
    try {
      const [housesData, reasonsData, insurancesData] = await Promise.all([
        apiRequest('/api/houses'),
        apiRequest('/api/reasons'),
        apiRequest('/api/insurances'),
      ])

      let nextHouses = housesData.houses || []
      if (user?.role === 'location_admin' && user.location) {
        nextHouses = nextHouses.filter((h) => h.location === user.location)
      }

      setHouses(nextHouses)
      setReasons(reasonsData.reasons || [])
      setCategories(reasonsData.categories || [])
      setInsurances(insurancesData.insurances || [])
      setInsuranceTypes(insurancesData.types || [])
      setLocations(insurancesData.locations || housesData.locations || [])

      setHouseId((current) => current || nextHouses[0]?.id || '')
    } catch (err) {
      setError(err.message || 'Failed to load form data')
    } finally {
      setLoadingMeta(false)
    }
  }, [user])

  useEffect(() => {
    loadMeta()
  }, [loadMeta])

  const applyRecord = useCallback((referral) => {
    if (!referral) {
      setRecordId(null)
      setTotalDischarge('')
      setDischargeWithHomeHealth('')
      setNotAbleRows([emptyReasonRow()])
      setAbleRows([emptyInsuranceRow()])
      return
    }

    setRecordId(referral.id)
    setTotalDischarge(
      referral.totalDischarge === 0 ? '' : String(referral.totalDischarge)
    )
    setDischargeWithHomeHealth(
      referral.dischargeWithHomeHealth === 0
        ? ''
        : String(referral.dischargeWithHomeHealth)
    )

    setNotAbleRows(
      referral.notAbleToAccept?.length
        ? referral.notAbleToAccept.map((row) => ({
            key: newRowId(),
            reasonId: row.reasonId || '',
            count: row.count === 0 ? '' : String(row.count),
          }))
        : [emptyReasonRow()]
    )

    setAbleRows(
      referral.ableToAccept?.length
        ? referral.ableToAccept.map((row) => ({
            key: newRowId(),
            insuranceId: row.insuranceId || '',
            count: row.count === 0 ? '' : String(row.count),
            accepted: row.accepted === 0 ? '' : String(row.accepted),
            notAdmitted: row.notAdmitted === 0 ? '' : String(row.notAdmitted),
          }))
        : [emptyInsuranceRow()]
    )
  }, [])

  const loadRecord = useCallback(async () => {
    if (!houseId || !month) return

    setLoadingRecord(true)
    setError('')
    setSuccess('')
    try {
      const data = await apiRequest(
        `/api/referrals?houseId=${encodeURIComponent(houseId)}&month=${encodeURIComponent(month)}`
      )
      applyRecord(data.referral)
    } catch (err) {
      setError(err.message || 'Failed to load referral record')
      applyRecord(null)
    } finally {
      setLoadingRecord(false)
    }
  }, [houseId, month, applyRecord])

  useEffect(() => {
    loadRecord()
  }, [loadRecord])

  const updateNotAbleRow = (key, field, value) => {
    setNotAbleRows((rows) =>
      rows.map((row) => (row.key === key ? { ...row, [field]: value } : row))
    )
  }

  const updateAbleCount = (key, value) => {
    setAbleRows((rows) =>
      rows.map((row) => {
        if (row.key !== key) return row
        const total = toNumber(value)
        const accepted = toNumber(row.accepted)
        const clampedAccepted = Math.min(accepted, total)
        return {
          ...row,
          count: value,
          accepted: clampedAccepted === 0 && value === '' ? '' : String(clampedAccepted || ''),
          notAdmitted:
            value === '' && row.accepted === ''
              ? ''
              : String(Math.max(0, total - clampedAccepted)),
        }
      })
    )
  }

  const updateAccepted = (key, value) => {
    setAbleRows((rows) =>
      rows.map((row) => {
        if (row.key !== key) return row
        const total = toNumber(row.count)
        const accepted = Math.min(toNumber(value), total)
        return {
          ...row,
          accepted: value === '' ? '' : String(accepted),
          notAdmitted: String(Math.max(0, total - accepted)),
        }
      })
    )
  }

  const updateNotAdmitted = (key, value) => {
    setAbleRows((rows) =>
      rows.map((row) => {
        if (row.key !== key) return row
        const total = toNumber(row.count)
        const notAdmitted = Math.min(toNumber(value), total)
        return {
          ...row,
          notAdmitted: value === '' ? '' : String(notAdmitted),
          accepted: String(Math.max(0, total - notAdmitted)),
        }
      })
    )
  }

  const updateAbleInsurance = (key, insuranceId) => {
    setAbleRows((rows) =>
      rows.map((row) => (row.key === key ? { ...row, insuranceId } : row))
    )
  }

  const handleSaveNewReason = async (payload) => {
    const data = await apiRequest('/api/reasons', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    const created = data.reason
    setReasons((prev) =>
      [...prev, created].sort((a, b) => a.name.localeCompare(b.name))
    )
    setNotAbleRows((rows) => {
      const empty = rows.find((r) => !r.reasonId)
      if (empty) {
        return rows.map((r) =>
          r.key === empty.key ? { ...r, reasonId: created.id } : r
        )
      }
      return [...rows, { key: newRowId(), reasonId: created.id, count: '' }]
    })
  }

  const handleSaveNewInsurance = async (payload) => {
    const data = await apiRequest('/api/insurances', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    const created = data.insurance
    setInsurances((prev) =>
      [...prev, created].sort((a, b) => a.name.localeCompare(b.name))
    )
    setAbleRows((rows) => {
      const empty = rows.find((r) => !r.insuranceId)
      if (empty) {
        return rows.map((r) =>
          r.key === empty.key ? { ...r, insuranceId: created.id } : r
        )
      }
      return [
        ...rows,
        {
          key: newRowId(),
          insuranceId: created.id,
          count: '',
          accepted: '',
          notAdmitted: '',
        },
      ]
    })
  }

  const resetForm = () => {
    applyRecord(null)
    setSuccess('')
    setError('')
  }

  const handleSave = async () => {
    if (!canSave || !selectedHouse) return

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const payload = {
        houseId: selectedHouse.id,
        houseName: selectedHouse.name,
        location: selectedHouse.location,
        month,
        totalDischarge: toNumber(totalDischarge),
        dischargeWithHomeHealth: toNumber(dischargeWithHomeHealth),
        notAbleToAccept: notAbleRows
          .filter((row) => row.reasonId)
          .map((row) => {
            const reason = reasons.find((r) => r.id === row.reasonId)
            return {
              reasonId: row.reasonId,
              reasonName: reason?.name || '',
              categoryId: reason?.categoryId || '',
              categoryName: reason?.categoryName || '',
              count: toNumber(row.count),
            }
          }),
        ableToAccept: ableRows
          .filter((row) => row.insuranceId)
          .map((row) => {
            const insurance = insurances.find((i) => i.id === row.insuranceId)
            return {
              insuranceId: row.insuranceId,
              insuranceName: insurance?.name || '',
              count: toNumber(row.count),
              accepted: toNumber(row.accepted),
              notAdmitted: toNumber(row.notAdmitted),
            }
          }),
      }

      const data = await apiRequest('/api/referrals', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      setRecordId(data.referral?.id || recordId)
      navigate(
        `/overview/${encodeURIComponent(selectedHouse.location)}/${selectedHouse.id}?month=${encodeURIComponent(month)}&period=Monthly`
      )
    } catch (err) {
      setError(err.message || 'Failed to save discharge details')
    } finally {
      setSaving(false)
    }
  }

  if (loadingMeta) {
    return (
      <PageShell
        title="Add Referral Details"
        subtitle="Monthly entry — pick a house and month, then fill in the discharge funnel."
      >
        <div className="py-10 text-center text-gray-500">Loading referral form...</div>
      </PageShell>
    )
  }

  return (
    <>
    <PageShell
      title="Add Referral Details"
      subtitle="Monthly entry — pick a house and month, then fill in the discharge funnel."
    >
      {error && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
          {success}
        </div>
      )}

      <div className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              House
            </label>
            <select
              value={houseId}
              onChange={(e) => setHouseId(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-navy/30 focus:border-navy"
            >
              {Object.entries(housesByLocation).map(([location, list]) => (
                <optgroup key={location} label={location}>
                  {list.map((house) => (
                    <option key={house.id} value={house.id}>
                      {house.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Month
            </label>
            <MonthPicker value={month} onChange={setMonth} />
          </div>
        </div>

        {loadingRecord ? (
          <div className="p-8 text-center text-gray-500 rounded-xl border border-gray-200">
            Loading month record...
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Total Discharge (DC Total)
                </label>
                <input
                  type="number"
                  min="0"
                  value={totalDischarge}
                  onChange={(e) => setTotalDischarge(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-navy/30 focus:border-navy"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Discharge with Home Health
                </label>
                <input
                  type="number"
                  min="0"
                  value={dischargeWithHomeHealth}
                  onChange={(e) => setDischargeWithHomeHealth(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-navy/30 focus:border-navy"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Not Able to Accept */}
              <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-slate-100 border-b border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-800">
                    Not Able to Accept
                  </h3>
                  <span className="text-sm font-semibold text-gray-500">
                    {notAbleTotal}
                  </span>
                </div>
                <div className="p-4 space-y-3">
                  {notAbleRows.map((row) => (
                    <div key={row.key} className="flex items-center gap-2">
                      <select
                        value={row.reasonId}
                        onChange={(e) =>
                          updateNotAbleRow(row.key, 'reasonId', e.target.value)
                        }
                        className="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-navy/30 focus:border-navy"
                      >
                        <option value="">Select reason...</option>
                        {reasons
                          .filter(
                            (reason) =>
                              reason.id === row.reasonId ||
                              !notAbleRows.some(
                                (other) =>
                                  other.key !== row.key &&
                                  other.reasonId === reason.id
                              )
                          )
                          .map((reason) => (
                            <option key={reason.id} value={reason.id}>
                              {reason.name}
                            </option>
                          ))}
                      </select>
                      <input
                        type="number"
                        min="0"
                        value={row.count}
                        onChange={(e) =>
                          updateNotAbleRow(row.key, 'count', e.target.value)
                        }
                        className="w-16 px-2 py-2 border border-gray-300 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-navy/30 focus:border-navy"
                      />
                      <RemoveButton
                        disabled={notAbleRows.length === 1}
                        onClick={() =>
                          setNotAbleRows((rows) =>
                            rows.filter((r) => r.key !== row.key)
                          )
                        }
                      />
                    </div>
                  ))}
                  <div className="flex flex-wrap gap-4 pt-1">
                    <button
                      type="button"
                      onClick={() => setReasonModalOpen(true)}
                      className="text-sm font-medium text-blue-600 hover:text-blue-800"
                    >
                      + New reason
                    </button>
                    {notAbleRows.length < reasons.length && (
                      <button
                        type="button"
                        onClick={() =>
                          setNotAbleRows((rows) => [...rows, emptyReasonRow()])
                        }
                        className="text-sm font-medium text-blue-600 hover:text-blue-800"
                      >
                        + Add reason row
                      </button>
                    )}
                  </div>
                </div>
              </section>

              {/* Able to Accept */}
              <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-slate-100 border-b border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-800">
                    Able to Accept
                  </h3>
                  <span className="text-sm font-semibold text-gray-500">
                    {ableTotal}
                  </span>
                </div>
                <div className="p-4 space-y-3">
                  {ableRows.map((row) => (
                    <div key={row.key} className="flex items-center gap-2">
                      <select
                        value={row.insuranceId}
                        onChange={(e) =>
                          updateAbleInsurance(row.key, e.target.value)
                        }
                        className="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-navy/30 focus:border-navy"
                      >
                        <option value="">Select insurance...</option>
                        {locationInsurances
                          .filter(
                            (insurance) =>
                              insurance.id === row.insuranceId ||
                              !ableRows.some(
                                (other) =>
                                  other.key !== row.key &&
                                  other.insuranceId === insurance.id
                              )
                          )
                          .map((insurance) => (
                            <option key={insurance.id} value={insurance.id}>
                              {insurance.name}
                            </option>
                          ))}
                      </select>
                      <input
                        type="number"
                        min="0"
                        value={row.count}
                        onChange={(e) => updateAbleCount(row.key, e.target.value)}
                        className="w-16 px-2 py-2 border border-gray-300 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-navy/30 focus:border-navy"
                      />
                      <RemoveButton
                        disabled={ableRows.length === 1}
                        onClick={() =>
                          setAbleRows((rows) =>
                            rows.filter((r) => r.key !== row.key)
                          )
                        }
                      />
                    </div>
                  ))}
                  <div className="flex flex-wrap gap-4 pt-1">
                    <button
                      type="button"
                      onClick={() => setInsuranceModalOpen(true)}
                      disabled={!selectedHouse}
                      className="text-sm font-medium text-blue-600 hover:text-blue-800 disabled:opacity-40"
                    >
                      + New insurance
                    </button>
                    {ableRows.length < locationInsurances.length && (
                      <button
                        type="button"
                        onClick={() =>
                          setAbleRows((rows) => [...rows, emptyInsuranceRow()])
                        }
                        className="text-sm font-medium text-blue-600 hover:text-blue-800"
                      >
                        + Add insurance row
                      </button>
                    )}
                  </div>
                </div>
              </section>
            </div>

            {homeHealthMismatch && (
              <div className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                Heads up: Not Able to Accept ({notAbleTotal}) + Able to Accept (
                {ableTotal}) = {notAbleTotal + ableTotal}, which doesn&apos;t match
                Discharge with Home Health ({homeHealth}). You can still save —
                just double-check the numbers.
              </div>
            )}

            {splitMismatch && (
              <div className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                Received/Accepted + Not Admitted must equal Able to Accept for each
                insurance. Fix the counts below before saving.
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Accepted */}
              <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-slate-100 border-b border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-800">Received/Accepted</h3>
                  <span className="text-sm font-semibold text-gray-500">
                    {acceptedTotal}
                  </span>
                </div>
                <div className="p-4 space-y-3">
                  {ableRows.map((row) => {
                    const insurance = locationInsurances.find(
                      (i) => i.id === row.insuranceId
                    )
                    return (
                      <div key={`accepted-${row.key}`} className="flex items-center gap-3">
                        <span className="flex-1 text-sm text-gray-700 truncate">
                          {insurance?.name || 'Select insurance above'}
                        </span>
                        <input
                          type="number"
                          min="0"
                          value={row.accepted}
                          disabled={!row.insuranceId}
                          onChange={(e) => updateAccepted(row.key, e.target.value)}
                          className="w-20 px-2 py-2 border border-gray-300 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-navy/30 focus:border-navy disabled:bg-gray-50"
                        />
                      </div>
                    )
                  })}
                  <p className="text-xs text-gray-500 pt-1">
                    Uses the same insurances listed in Able to Accept above.
                  </p>
                </div>
              </section>

              {/* Not Admitted */}
              <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-slate-100 border-b border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-800">
                    Not Admitted
                  </h3>
                  <span className="text-sm font-semibold text-gray-500">
                    {notAdmittedTotal}
                  </span>
                </div>
                <div className="p-4 space-y-3">
                  {ableRows.map((row) => {
                    const insurance = locationInsurances.find(
                      (i) => i.id === row.insuranceId
                    )
                    return (
                      <div
                        key={`not-admitted-${row.key}`}
                        className="flex items-center gap-3"
                      >
                        <span className="flex-1 text-sm text-gray-700 truncate">
                          {insurance?.name || 'Select insurance above'}
                        </span>
                        <input
                          type="number"
                          min="0"
                          value={row.notAdmitted}
                          disabled={!row.insuranceId}
                          onChange={(e) =>
                            updateNotAdmitted(row.key, e.target.value)
                          }
                          className="w-20 px-2 py-2 border border-gray-300 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-navy/30 focus:border-navy disabled:bg-gray-50"
                        />
                      </div>
                    )
                  })}
                  <p className="text-xs text-gray-500 pt-1">
                    Patients accepted but not admitted into our agency, by
                    insurance.
                  </p>
                </div>
              </section>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={!canSave || saving}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-navy hover:bg-navy-dark rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Discharge Details'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Reset Form
              </button>
            </div>
          </>
        )}
      </div>
    </PageShell>

      <ReasonFormModal
        open={reasonModalOpen}
        mode="add"
        categories={categories}
        existingItems={reasons}
        onClose={() => setReasonModalOpen(false)}
        onSave={handleSaveNewReason}
        onCategoriesChange={setCategories}
      />

      <InsuranceFormModal
        open={insuranceModalOpen}
        mode="add"
        locations={locations}
        types={insuranceTypes}
        existingItems={insurances}
        lockLocation
        initialValues={
          selectedHouse
            ? {
                location: selectedHouse.location,
                name: '',
                typeId: insuranceTypes[0]?.id || '',
              }
            : null
        }
        onClose={() => setInsuranceModalOpen(false)}
        onSave={handleSaveNewInsurance}
        onTypesChange={setInsuranceTypes}
      />
    </>
  )
}
