import { useEffect, useState } from 'react'
import Modal from './Modal'
import { TYPE_COLOR_OPTIONS } from '../utils/typeColors'
import { isDuplicateName } from '../utils/duplicates'

export default function InsuranceTypeFormModal({
  open,
  mode = 'add',
  initialValues,
  existingItems = [],
  onClose,
  onSave,
  nested = false,
}) {
  const [name, setName] = useState('')
  const [color, setColor] = useState('green')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const isEdit = mode === 'edit'

  useEffect(() => {
    if (open) {
      setName(initialValues?.name || '')
      setColor(initialValues?.color || 'green')
      setError('')
      setSaving(false)
    }
  }, [open, initialValues])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const trimmed = name.trim()
    if (!trimmed) {
      setError('Insurance type name is required')
      return
    }

    if (
      isDuplicateName(trimmed, existingItems, {
        excludeId: isEdit ? initialValues?.id : null,
      })
    ) {
      setError('Insurance type already exists')
      return
    }

    setSaving(true)
    try {
      await onSave({ name: trimmed, color })
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit insurance type' : 'Add insurance type'}
      nested={nested}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
            New Insurance Type — Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Medicaid HMO"
            required
            autoFocus
            className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-navy/30 focus:border-navy"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
            New Insurance Type — Color
          </label>
          <div className="flex flex-wrap items-center gap-4">
            {TYPE_COLOR_OPTIONS.map((option) => (
              <label
                key={option.value}
                className="inline-flex items-center gap-2 cursor-pointer text-sm text-gray-700"
              >
                <input
                  type="radio"
                  name="insurance-type-color"
                  value={option.value}
                  checked={color === option.value}
                  onChange={() => setColor(option.value)}
                  className="accent-navy"
                />
                <span
                  className={`w-3.5 h-3.5 rounded-sm ${option.chip}`}
                  aria-hidden="true"
                />
                <span>{option.label}</span>
              </label>
            ))}
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
            disabled={saving}
            className="px-4 py-2 text-sm font-semibold text-white bg-navy hover:bg-navy-dark rounded-lg disabled:opacity-60"
          >
            {saving ? 'Saving...' : isEdit ? 'Save' : 'Add Type'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
