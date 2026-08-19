import { useEffect, useState } from 'react'
import Modal from './Modal'
import { isDuplicateName } from '../utils/duplicates'

export default function ReasonFormModal({
  open,
  mode = 'add',
  initialValues,
  existingItems = [],
  onClose,
  onSave,
}) {
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const isEdit = mode === 'edit'

  useEffect(() => {
    if (open) {
      setName(initialValues?.name || '')
      setError('')
      setSaving(false)
    }
  }, [open, initialValues])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const trimmed = name.trim()
    if (!trimmed) {
      setError('Reason name is required')
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
      await onSave({ name: trimmed })
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
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
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
