import { useEffect, useState } from 'react'
import Modal from './Modal'
import { isDuplicateName } from '../utils/duplicates'

const STATUS_OPTIONS = ['Active', 'Coming Soon']

export default function HouseFormModal({
  open,
  mode = 'add',
  initialValues,
  locations = [],
  existingItems = [],
  onClose,
  onSave,
}) {
  const [location, setLocation] = useState('')
  const [name, setName] = useState('')
  const [status, setStatus] = useState('Active')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const isEdit = mode === 'edit'

  useEffect(() => {
    if (open) {
      setLocation(initialValues?.location || locations[0] || '')
      setName(initialValues?.name || '')
      setStatus(initialValues?.status || 'Active')
      setError('')
      setSaving(false)
    }
  }, [open, initialValues, locations])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const trimmed = name.trim()
    if (!trimmed) {
      setError('House name is required')
      return
    }

    if (!location) {
      setError('Location is required')
      return
    }

    if (
      isDuplicateName(trimmed, existingItems, {
        excludeId: isEdit ? initialValues?.id : null,
        matchFields: { location },
      })
    ) {
      setError('House already exists for this location')
      return
    }

    setSaving(true)
    try {
      await onSave({
        location,
        name: trimmed,
        status,
      })
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit house' : 'Add house'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Location
          </label>
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
            className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-navy/30 focus:border-navy"
          >
            {locations.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            House name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. McHenry"
            required
            className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-navy/30 focus:border-navy"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            required
            className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-navy/30 focus:border-navy"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
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
            disabled={saving || !location}
            className="px-4 py-2 text-sm font-semibold text-white bg-navy hover:bg-navy-dark rounded-lg disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
