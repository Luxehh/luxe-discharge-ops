import { useCallback, useEffect, useState } from 'react'
import { apiRequest } from '../utils/api'
import PageShell from '../components/PageShell'
import PaginationBar from '../components/PaginationBar'
import ReasonFormModal from '../components/ReasonFormModal'
import ConfirmDeleteModal from '../components/ConfirmDeleteModal'
import { usePagination } from '../hooks/usePagination'

export default function NotAcceptReasons() {
  const [reasons, setReasons] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState('add')
  const [editingReason, setEditingReason] = useState(null)

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletingReason, setDeletingReason] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const pagination = usePagination(reasons)

  const loadReasons = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await apiRequest('/api/reasons')
      setReasons(data.reasons || [])
      setCategories(data.categories || [])
    } catch (err) {
      setError(err.message || 'Failed to load reasons')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadReasons()
  }, [loadReasons])

  const openAdd = () => {
    setFormMode('add')
    setEditingReason(null)
    setFormOpen(true)
  }

  const openEdit = (reason) => {
    setFormMode('edit')
    setEditingReason(reason)
    setFormOpen(true)
  }

  const openDelete = (reason) => {
    setDeletingReason(reason)
    setDeleteOpen(true)
  }

  const handleSave = async (payload) => {
    if (formMode === 'edit' && editingReason) {
      await apiRequest(`/api/reasons/${editingReason.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      })
    } else {
      await apiRequest('/api/reasons', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    }
    await loadReasons()
  }

  const handleDelete = async () => {
    if (!deletingReason) return
    setDeleting(true)
    try {
      await apiRequest(`/api/reasons/${deletingReason.id}`, { method: 'DELETE' })
      setDeleteOpen(false)
      setDeletingReason(null)
      await loadReasons()
    } catch (err) {
      setError(err.message || 'Failed to delete reason')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <PageShell
        title="Not-Accept Reasons"
        subtitle="Shared reason list used across all locations when logging ‘Not Able to Accept.’ Each reason belongs to one of the report categories."
        actions={
          <button
            type="button"
            onClick={openAdd}
            className="inline-flex items-center justify-center gap-2 self-start px-4 py-2.5 text-sm font-semibold text-white bg-navy hover:bg-navy-dark rounded-lg transition"
          >
            <span className="text-lg leading-none">+</span>
            Add Reason
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
          <div className="p-10 text-center text-gray-500">Loading reasons...</div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-200">
                    {['Reason', 'Category', 'Actions'].map((col) => (
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
                  {pagination.pageItems.map((reason) => (
                    <tr key={reason.id} className="hover:bg-gray-50/60">
                      <td className="px-5 py-4 text-sm font-bold text-gray-900">
                        <button
                          type="button"
                          onClick={() => openEdit(reason)}
                          className="text-left hover:text-blue-700 hover:underline"
                        >
                          {reason.name}
                        </button>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-700">
                        {reason.categoryName || '—'}
                      </td>
                      <td className="px-5 py-4 text-sm whitespace-nowrap">
                        <div className="flex items-center gap-4">
                          <button
                            type="button"
                            onClick={() => openEdit(reason)}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => openDelete(reason)}
                            className="text-red-600 hover:text-red-700 font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {reasons.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-5 py-10 text-center text-gray-500">
                        No reasons found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="md:hidden divide-y divide-gray-100">
              {pagination.pageItems.map((reason) => (
                <div key={reason.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-gray-900">
                        <button
                          type="button"
                          onClick={() => openEdit(reason)}
                          className="text-left hover:text-blue-700 hover:underline"
                        >
                          {reason.name}
                        </button>
                      </p>
                      <p className="text-sm text-gray-500">
                        {reason.categoryName || 'No category'}
                      </p>
                    </div>
                    <div className="flex gap-3 shrink-0">
                      <button
                        type="button"
                        onClick={() => openEdit(reason)}
                        className="text-sm text-blue-600 font-medium"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => openDelete(reason)}
                        className="text-sm text-red-600 font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {reasons.length === 0 && (
                <div className="p-8 text-center text-gray-500">No reasons found.</div>
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

      <ReasonFormModal
        open={formOpen}
        mode={formMode}
        initialValues={editingReason}
        categories={categories}
        existingItems={reasons}
        onClose={() => setFormOpen(false)}
        onSave={handleSave}
        onCategoriesChange={setCategories}
      />

      <ConfirmDeleteModal
        open={deleteOpen}
        message="Delete this not-accept reason? It will no longer appear when logging referrals."
        onClose={() => {
          setDeleteOpen(false)
          setDeletingReason(null)
        }}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </>
  )
}
