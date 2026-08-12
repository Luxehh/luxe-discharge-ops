import { useCallback, useEffect, useState } from 'react'
import { apiRequest } from '../utils/api'
import { getTypeBadgeClass } from '../utils/typeColors'
import PageShell from '../components/PageShell'
import PaginationBar from '../components/PaginationBar'
import InsuranceTypeFormModal from '../components/InsuranceTypeFormModal'
import ConfirmDeleteModal from '../components/ConfirmDeleteModal'
import { usePagination } from '../hooks/usePagination'

export default function InsuranceTypes() {
  const [types, setTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState('add')
  const [editingType, setEditingType] = useState(null)

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletingType, setDeletingType] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const pagination = usePagination(types)

  const loadTypes = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await apiRequest('/api/insurance-types')
      setTypes(data.types || [])
    } catch (err) {
      setError(err.message || 'Failed to load insurance types')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTypes()
  }, [loadTypes])

  const openAdd = () => {
    setFormMode('add')
    setEditingType(null)
    setFormOpen(true)
  }

  const openEdit = (type) => {
    setFormMode('edit')
    setEditingType(type)
    setFormOpen(true)
  }

  const openDelete = (type) => {
    setDeletingType(type)
    setDeleteOpen(true)
  }

  const handleSave = async (payload) => {
    if (formMode === 'edit' && editingType) {
      await apiRequest(`/api/insurance-types/${editingType.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      })
    } else {
      await apiRequest('/api/insurance-types', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    }
    await loadTypes()
  }

  const handleDelete = async () => {
    if (!deletingType) return
    setDeleting(true)
    try {
      await apiRequest(`/api/insurance-types/${deletingType.id}`, {
        method: 'DELETE',
      })
      setDeleteOpen(false)
      setDeletingType(null)
      await loadTypes()
    } catch (err) {
      setError(err.message || 'Failed to delete insurance type')
      setDeleteOpen(false)
      setDeletingType(null)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <PageShell
        title="Insurance Types"
        subtitle="Reimbursement type labels and badge colors used when assigning insurances by location."
        actions={
          <button
            type="button"
            onClick={openAdd}
            className="inline-flex items-center justify-center gap-2 self-start px-4 py-2.5 text-sm font-semibold text-white bg-navy hover:bg-navy-dark rounded-lg transition"
          >
            <span className="text-lg leading-none">+</span>
            Add Type
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
          <div className="p-10 text-center text-gray-500">Loading types...</div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-200">
                    {['Type Name', 'Color', 'Actions'].map((col) => (
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
                  {pagination.pageItems.map((type) => (
                    <tr key={type.id} className="hover:bg-gray-50/60">
                      <td className="px-5 py-4 text-sm font-bold text-gray-900">
                        <button
                          type="button"
                          onClick={() => openEdit(type)}
                          className="text-left hover:text-blue-700 hover:underline"
                        >
                          {type.name}
                        </button>
                      </td>
                      <td className="px-5 py-4 text-sm">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium capitalize ${getTypeBadgeClass(
                            type.color
                          )}`}
                        >
                          {type.color}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm whitespace-nowrap">
                        <div className="flex items-center gap-4">
                          <button
                            type="button"
                            onClick={() => openEdit(type)}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => openDelete(type)}
                            className="text-red-600 hover:text-red-700 font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {types.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-5 py-10 text-center text-gray-500">
                        No insurance types found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="md:hidden divide-y divide-gray-100">
              {pagination.pageItems.map((type) => (
                <div key={type.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-gray-900">
                        <button
                          type="button"
                          onClick={() => openEdit(type)}
                          className="text-left hover:text-blue-700 hover:underline"
                        >
                          {type.name}
                        </button>
                      </p>
                      <span
                        className={`inline-flex mt-1 px-2.5 py-1 rounded-full text-xs font-medium capitalize ${getTypeBadgeClass(
                          type.color
                        )}`}
                      >
                        {type.color}
                      </span>
                    </div>
                    <div className="flex gap-3 shrink-0">
                      <button
                        type="button"
                        onClick={() => openEdit(type)}
                        className="text-sm text-blue-600 font-medium"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => openDelete(type)}
                        className="text-sm text-red-600 font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {types.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  No insurance types found.
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

      <InsuranceTypeFormModal
        open={formOpen}
        mode={formMode}
        initialValues={editingType}
        existingItems={types}
        onClose={() => setFormOpen(false)}
        onSave={handleSave}
      />

      <ConfirmDeleteModal
        open={deleteOpen}
        message="Delete this insurance type? Insurances using it must be reassigned first."
        onClose={() => {
          setDeleteOpen(false)
          setDeletingType(null)
        }}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </>
  )
}
