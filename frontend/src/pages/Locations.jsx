import { useCallback, useEffect, useState } from 'react'
import { apiRequest } from '../utils/api'
import PageShell from '../components/PageShell'
import PaginationBar from '../components/PaginationBar'
import HouseFormModal from '../components/HouseFormModal'
import ConfirmDeleteModal from '../components/ConfirmDeleteModal'
import { usePagination } from '../hooks/usePagination'

function statusBadgeClass(status) {
  if (status === 'Active') {
    return 'bg-green-100 text-green-800'
  }
  return 'bg-gray-100 text-gray-600'
}

export default function Locations() {
  const [houses, setHouses] = useState([])
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState('add')
  const [editingHouse, setEditingHouse] = useState(null)

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletingHouse, setDeletingHouse] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const pagination = usePagination(houses)

  const loadHouses = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await apiRequest('/api/houses')
      setHouses(data.houses || [])
      setLocations(data.locations || [])
    } catch (err) {
      setError(err.message || 'Failed to load houses')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadHouses()
  }, [loadHouses])

  const openAdd = () => {
    setFormMode('add')
    setEditingHouse(null)
    setFormOpen(true)
  }

  const openEdit = (house) => {
    setFormMode('edit')
    setEditingHouse(house)
    setFormOpen(true)
  }

  const openDelete = (house) => {
    setDeletingHouse(house)
    setDeleteOpen(true)
  }

  const handleSave = async (payload) => {
    if (formMode === 'edit' && editingHouse) {
      await apiRequest(`/api/houses/${editingHouse.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      })
    } else {
      await apiRequest('/api/houses', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    }
    await loadHouses()
  }

  const handleDelete = async () => {
    if (!deletingHouse) return
    setDeleting(true)
    try {
      await apiRequest(`/api/houses/${deletingHouse.id}`, { method: 'DELETE' })
      setDeleteOpen(false)
      setDeletingHouse(null)
      await loadHouses()
    } catch (err) {
      setError(err.message || 'Failed to delete house')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <PageShell
        title="Locations"
        subtitle="Manage the branches under each of the 4 company locations."
        actions={
          <button
            type="button"
            onClick={openAdd}
            className="inline-flex items-center justify-center gap-2 self-start px-4 py-2.5 text-sm font-semibold text-white bg-navy hover:bg-navy-dark rounded-lg transition"
          >
            <span className="text-lg leading-none">+</span>
            Add House
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
          <div className="p-10 text-center text-gray-500">Loading houses...</div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-200">
                    {['Location', 'House', 'Status', 'Actions'].map((col) => (
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
                  {pagination.pageItems.map((house) => (
                    <tr key={house.id} className="hover:bg-gray-50/60">
                      <td className="px-5 py-4 text-sm text-gray-700 whitespace-nowrap">
                        {house.location}
                      </td>
                      <td className="px-5 py-4 text-sm font-bold text-gray-900">
                        <button
                          type="button"
                          onClick={() => openEdit(house)}
                          className="text-left hover:text-blue-700 hover:underline"
                        >
                          {house.name}
                        </button>
                      </td>
                      <td className="px-5 py-4 text-sm">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${statusBadgeClass(
                            house.status
                          )}`}
                        >
                          {house.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm whitespace-nowrap">
                        <div className="flex items-center gap-4">
                          <button
                            type="button"
                            onClick={() => openEdit(house)}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => openDelete(house)}
                            className="text-red-600 hover:text-red-700 font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {houses.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-5 py-10 text-center text-gray-500">
                        No houses found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="md:hidden divide-y divide-gray-100">
              {pagination.pageItems.map((house) => (
                <div key={house.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-gray-900">
                        <button
                          type="button"
                          onClick={() => openEdit(house)}
                          className="text-left hover:text-blue-700 hover:underline"
                        >
                          {house.name}
                        </button>
                      </p>
                      <p className="text-sm text-gray-500">{house.location}</p>
                    </div>
                    <div className="flex gap-3 shrink-0">
                      <button
                        type="button"
                        onClick={() => openEdit(house)}
                        className="text-sm text-blue-600 font-medium"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => openDelete(house)}
                        className="text-sm text-red-600 font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <span
                    className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${statusBadgeClass(
                      house.status
                    )}`}
                  >
                    {house.status}
                  </span>
                </div>
              ))}
              {houses.length === 0 && (
                <div className="p-8 text-center text-gray-500">No houses found.</div>
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

      <HouseFormModal
        open={formOpen}
        mode={formMode}
        initialValues={editingHouse}
        locations={locations}
        existingItems={houses}
        onClose={() => setFormOpen(false)}
        onSave={handleSave}
      />

      <ConfirmDeleteModal
        open={deleteOpen}
        message="Delete this house? Its saved discharge records will remain but the house will no longer appear in the list."
        onClose={() => {
          setDeleteOpen(false)
          setDeletingHouse(null)
        }}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </>
  )
}
