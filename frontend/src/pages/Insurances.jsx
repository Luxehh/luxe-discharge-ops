import { useCallback, useEffect, useState } from 'react'
import { apiRequest } from '../utils/api'
import { getTypeBadgeClass } from '../utils/typeColors'
import PageShell from '../components/PageShell'
import PaginationBar from '../components/PaginationBar'
import InsuranceFormModal from '../components/InsuranceFormModal'
import ConfirmDeleteModal from '../components/ConfirmDeleteModal'
import { usePagination } from '../hooks/usePagination'
import { useAuth } from '../context/AuthContext'
import { isLocationAdmin } from '../utils/roles'

export default function Insurances() {
  const { user } = useAuth()
  const [insurances, setInsurances] = useState([])
  const [types, setTypes] = useState([])
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState('add')
  const [editingInsurance, setEditingInsurance] = useState(null)

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletingInsurance, setDeletingInsurance] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const pagination = usePagination(insurances)

  const loadInsurances = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await apiRequest('/api/insurances')
      let list = data.insurances || []
      let locs = data.locations || []
      if (isLocationAdmin(user) && user?.location) {
        list = list.filter((item) => item.location === user.location)
        locs = locs.filter((loc) => loc === user.location)
      }
      setInsurances(list)
      setTypes(data.types || [])
      setLocations(locs)
    } catch (err) {
      setError(err.message || 'Failed to load insurances')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadInsurances()
  }, [loadInsurances])

  const openAdd = () => {
    setFormMode('add')
    setEditingInsurance(null)
    setFormOpen(true)
  }

  const openEdit = (insurance) => {
    setFormMode('edit')
    setEditingInsurance(insurance)
    setFormOpen(true)
  }

  const openDelete = (insurance) => {
    setDeletingInsurance(insurance)
    setDeleteOpen(true)
  }

  const handleSave = async (payload) => {
    if (formMode === 'edit' && editingInsurance) {
      await apiRequest(`/api/insurances/${editingInsurance.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      })
    } else {
      await apiRequest('/api/insurances', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    }
    await loadInsurances()
  }

  const handleDelete = async () => {
    if (!deletingInsurance) return
    setDeleting(true)
    try {
      await apiRequest(`/api/insurances/${deletingInsurance.id}`, {
        method: 'DELETE',
      })
      setDeleteOpen(false)
      setDeletingInsurance(null)
      await loadInsurances()
    } catch (err) {
      setError(err.message || 'Failed to delete insurance')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <PageShell
        title="Insurances"
        subtitle="Each location can carry its own set of insurance names, grouped by reimbursement type."
        actions={
          <button
            type="button"
            onClick={openAdd}
            className="inline-flex items-center justify-center gap-2 self-start px-4 py-2.5 text-sm font-semibold text-white bg-navy hover:bg-navy-dark rounded-lg transition"
          >
            <span className="text-lg leading-none">+</span>
            Add Insurance
          </button>
        }
        contentClassName="p-0 overflow-hidden"
      >
        {error && (
          <div className="m-4 mb-0 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        {loading ? (
          <div className="p-10 text-center text-gray-500">Loading insurances...</div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-200">
                    {['Location', 'Insurance', 'Type', 'Actions'].map((col) => (
                      <th
                        key={col}
                        className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pagination.pageItems.map((insurance) => (
                    <tr key={insurance.id} className="hover:bg-gray-50/60">
                      <td className="px-5 py-4 text-sm text-gray-700 whitespace-nowrap">
                        {insurance.location}
                      </td>
                      <td className="px-5 py-4 text-sm font-bold text-gray-900">
                        <button
                          type="button"
                          onClick={() => openEdit(insurance)}
                          className="text-left hover:text-blue-700 hover:underline"
                        >
                          {insurance.name}
                        </button>
                      </td>
                      <td className="px-5 py-4 text-sm">
                        {insurance.typeName ? (
                          <span
                            className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${getTypeBadgeClass(
                              insurance.typeColor
                            )}`}
                          >
                            {insurance.typeName}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-5 py-4 text-sm whitespace-nowrap">
                        <div className="flex items-center gap-4">
                          <button
                            type="button"
                            onClick={() => openEdit(insurance)}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => openDelete(insurance)}
                            className="text-red-600 hover:text-red-700 font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {insurances.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-5 py-10 text-center text-gray-500">
                        No insurances found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="md:hidden divide-y divide-gray-100">
              {pagination.pageItems.map((insurance) => (
                <div key={insurance.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-gray-900">
                        <button
                          type="button"
                          onClick={() => openEdit(insurance)}
                          className="text-left hover:text-blue-700 hover:underline"
                        >
                          {insurance.name}
                        </button>
                      </p>
                      <p className="text-sm text-gray-500">{insurance.location}</p>
                    </div>
                    <div className="flex gap-3 shrink-0">
                      <button
                        type="button"
                        onClick={() => openEdit(insurance)}
                        className="text-sm text-blue-600 font-medium"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => openDelete(insurance)}
                        className="text-sm text-red-600 font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  {insurance.typeName && (
                    <span
                      className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${getTypeBadgeClass(
                        insurance.typeColor
                      )}`}
                    >
                      {insurance.typeName}
                    </span>
                  )}
                </div>
              ))}
              {insurances.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  No insurances found.
                </div>
              )}
            </div>

            <PaginationBar
              page={pagination.page}
              pageSize={pagination.pageSize}
              total={pagination.total}
              totalPages={pagination.totalPages}
              from={pagination.from}
              to={pagination.to}
              canPrev={pagination.canPrev}
              canNext={pagination.canNext}
              onPrev={pagination.prev}
              onNext={pagination.next}
              onPageSizeChange={pagination.setPageSize}
            />
          </>
        )}
      </PageShell>

      <InsuranceFormModal
        open={formOpen}
        mode={formMode}
        initialValues={
          editingInsurance ||
          (isLocationAdmin(user) && user?.location
            ? { location: user.location, name: '', typeId: types[0]?.id || '' }
            : null)
        }
        locations={locations}
        types={types}
        existingItems={insurances}
        lockLocation={isLocationAdmin(user)}
        onClose={() => setFormOpen(false)}
        onSave={handleSave}
        onTypesChange={setTypes}
      />

      <ConfirmDeleteModal
        open={deleteOpen}
        message="Delete this insurance from the location's list?"
        onClose={() => {
          setDeleteOpen(false)
          setDeletingInsurance(null)
        }}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </>
  )
}
