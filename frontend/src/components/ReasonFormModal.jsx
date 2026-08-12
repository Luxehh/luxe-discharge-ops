import { useEffect, useState } from 'react'
import Modal from './Modal'
import CategoryFormModal from './CategoryFormModal'
import { apiRequest } from '../utils/api'
import { isDuplicateName } from '../utils/duplicates'

export default function ReasonFormModal({
  open,
  mode = 'add',
  initialValues,
  categories = [],
  existingItems = [],
  onClose,
  onSave,
  onCategoriesChange,
}) {
  const [name, setName] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [localCategories, setLocalCategories] = useState([])
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)

  const isEdit = mode === 'edit'

  useEffect(() => {
    if (open) {
      setLocalCategories(categories)
      setName(initialValues?.name || '')
      setCategoryId(initialValues?.categoryId || categories[0]?.id || '')
      setError('')
      setSaving(false)
      setCategoryModalOpen(false)
    }
  }, [open, initialValues, categories])

  const handleAddCategory = async ({ name: categoryName }) => {
    const data = await apiRequest('/api/categories', {
      method: 'POST',
      body: JSON.stringify({ name: categoryName }),
    })

    const created = data.category
    const next = [...localCategories, created].sort((a, b) =>
      a.name.localeCompare(b.name)
    )
    setLocalCategories(next)
    setCategoryId(created.id)
    onCategoriesChange?.(next)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const trimmed = name.trim()
    if (!trimmed) {
      setError('Reason name is required')
      return
    }

    if (!categoryId) {
      setError('Category is required')
      return
    }

    if (
      isDuplicateName(trimmed, existingItems, {
        excludeId: isEdit ? initialValues?.id : null,
      })
    ) {
      setError('Reason already exists')
      return
    }

    setSaving(true)
    try {
      await onSave({
        name: trimmed,
        categoryId,
      })
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Modal open={open} onClose={onClose} title={isEdit ? 'Edit reason' : 'Add reason'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Reason name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Distance Too Far"
              required
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-navy/30 focus:border-navy"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Category
            </label>
            <div className="flex items-center gap-2">
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-navy/30 focus:border-navy"
              >
                {localCategories.length === 0 && (
                  <option value="">No categories yet</option>
                )}
                {localCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setCategoryModalOpen(true)}
                title="Add category"
                aria-label="Add category"
                className="shrink-0 w-10 h-10 flex items-center justify-center border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 hover:border-navy"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !categoryId}
              className="px-4 py-2 text-sm font-semibold text-white bg-navy hover:bg-navy-dark rounded-lg disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </Modal>

      <CategoryFormModal
        open={categoryModalOpen}
        mode="add"
        nested
        existingItems={localCategories}
        onClose={() => setCategoryModalOpen(false)}
        onSave={handleAddCategory}
      />
    </>
  )
}
