import { useCallback, useEffect, useState } from 'react'
import { apiRequest } from '../utils/api'
import PageShell from '../components/PageShell'
import PaginationBar from '../components/PaginationBar'
import CategoryFormModal from '../components/CategoryFormModal'
import ConfirmDeleteModal from '../components/ConfirmDeleteModal'
import { usePagination } from '../hooks/usePagination'

export default function Categories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState('add')
  const [editingCategory, setEditingCategory] = useState(null)

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletingCategory, setDeletingCategory] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const pagination = usePagination(categories)

  const loadCategories = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await apiRequest('/api/categories')
      setCategories(data.categories || [])
    } catch (err) {
      setError(err.message || 'Failed to load categories')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  const openAdd = () => {
    setFormMode('add')
    setEditingCategory(null)
    setFormOpen(true)
  }

  const openEdit = (category) => {
    setFormMode('edit')
    setEditingCategory(category)
    setFormOpen(true)
  }

  const openDelete = (category) => {
    setDeletingCategory(category)
    setDeleteOpen(true)
  }

  const handleSave = async (payload) => {
    if (formMode === 'edit' && editingCategory) {
      await apiRequest(`/api/categories/${editingCategory.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      })
    } else {
      await apiRequest('/api/categories', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    }
    await loadCategories()
  }

  const handleDelete = async () => {
    if (!deletingCategory) return
    setDeleting(true)
    try {
      await apiRequest(`/api/categories/${deletingCategory.id}`, {
        method: 'DELETE',
      })
      setDeleteOpen(false)
      setDeletingCategory(null)
      await loadCategories()
    } catch (err) {
      setError(err.message || 'Failed to delete category')
      setDeleteOpen(false)
      setDeletingCategory(null)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <PageShell
        title="Category"
        subtitle="Report categories used when assigning not-accept reasons across all locations."
        actions={
          <button
            type="button"
            onClick={openAdd}
            className="inline-flex items-center justify-center gap-2 self-start px-4 py-2.5 text-sm font-semibold text-white bg-navy hover:bg-navy-dark rounded-lg transition"
          >
            <span className="text-lg leading-none">+</span>
            Add Category
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
          <div className="p-10 text-center text-gray-500">Loading categories...</div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-200">
                    {['Category Name', 'Actions'].map((col) => (
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
                  {pagination.pageItems.map((category) => (
                    <tr key={category.id} className="hover:bg-gray-50/60">
                      <td className="px-5 py-4 text-sm font-bold text-gray-900">
                        <button
                          type="button"
                          onClick={() => openEdit(category)}
                          className="text-left hover:text-blue-700 hover:underline"
                        >
                          {category.name}
                        </button>
                      </td>
                      <td className="px-5 py-4 text-sm whitespace-nowrap">
                        <div className="flex items-center gap-4">
                          <button
                            type="button"
                            onClick={() => openEdit(category)}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => openDelete(category)}
                            className="text-red-600 hover:text-red-700 font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {categories.length === 0 && (
                    <tr>
                      <td colSpan={2} className="px-5 py-10 text-center text-gray-500">
                        No categories found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="md:hidden divide-y divide-gray-100">
              {pagination.pageItems.map((category) => (
                <div key={category.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-bold text-gray-900">
                      <button
                        type="button"
                        onClick={() => openEdit(category)}
                        className="text-left hover:text-blue-700 hover:underline"
                      >
                        {category.name}
                      </button>
                    </p>
                    <div className="flex gap-3 shrink-0">
                      <button
                        type="button"
                        onClick={() => openEdit(category)}
                        className="text-sm text-blue-600 font-medium"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => openDelete(category)}
                        className="text-sm text-red-600 font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {categories.length === 0 && (
                <div className="p-8 text-center text-gray-500">No categories found.</div>
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

      <CategoryFormModal
        open={formOpen}
        mode={formMode}
        initialValues={editingCategory}
        existingItems={categories}
        onClose={() => setFormOpen(false)}
        onSave={handleSave}
      />

      <ConfirmDeleteModal
        open={deleteOpen}
        message="Delete this category? Reasons using it must be reassigned first."
        onClose={() => {
          setDeleteOpen(false)
          setDeletingCategory(null)
        }}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </>
  )
}
