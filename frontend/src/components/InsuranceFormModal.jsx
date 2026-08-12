import { useEffect, useState } from 'react'
import Modal from './Modal'
import InsuranceTypeFormModal from './InsuranceTypeFormModal'
import { apiRequest } from '../utils/api'
import { isDuplicateName } from '../utils/duplicates'

export default function InsuranceFormModal({
  open,
  mode = 'add',
  initialValues,
  locations = [],
  types = [],
  existingItems = [],
  onClose,
  onSave,
  onTypesChange,
  lockLocation = false,
}) {
  const [location, setLocation] = useState('')
  const [name, setName] = useState('')
  const [typeId, setTypeId] = useState('')
  const [localTypes, setLocalTypes] = useState([])
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [typeModalOpen, setTypeModalOpen] = useState(false)

  const isEdit = mode === 'edit'

  useEffect(() => {
    if (open) {
      setLocalTypes(types)
      setLocation(initialValues?.location || locations[0] || '')
      setName(initialValues?.name || '')
      setTypeId(initialValues?.typeId || types[0]?.id || '')
      setError('')
      setSaving(false)
      setTypeModalOpen(false)
    }
  }, [open, initialValues, locations, types])

  const handleAddType = async (payload) => {
    const data = await apiRequest('/api/insurance-types', {
      method: 'POST',
      body: JSON.stringify(payload),
    })

    const created = data.type
    const next = [...localTypes, created].sort((a, b) =>
      a.name.localeCompare(b.name)
    )
    setLocalTypes(next)
    setTypeId(created.id)
    onTypesChange?.(next)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const trimmed = name.trim()
    if (!trimmed) {
      setError('Insurance name is required')
      return
    }

    if (!location) {
      setError('Location is required')
      return
    }

    if (!typeId) {
      setError('Insurance type is required')
      return
    }

    if (
      isDuplicateName(trimmed, existingItems, {
        excludeId: isEdit ? initialValues?.id : null,
        matchFields: { location },
      })
    ) {
      setError('Insurance already exists for this location')
      return
    }

    setSaving(true)
    try {
      await onSave({
        location,
        name: trimmed,
        typeId,
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
      <Modal
        open={open}
        onClose={onClose}
        title={isEdit ? 'Edit insurance' : 'Add insurance'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Location
            </label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
              disabled={lockLocation}
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-navy/30 focus:border-navy disabled:bg-gray-100 disabled:text-gray-600"
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
              Insurance Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Medicare"
              required
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-navy/30 focus:border-navy"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Insurance Type
            </label>
            <div className="flex items-center gap-2">
              <select
                value={typeId}
                onChange={(e) => setTypeId(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-navy/30 focus:border-navy"
              >
                {localTypes.length === 0 && (
                  <option value="">No types yet</option>
                )}
                {localTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setTypeModalOpen(true)}
                title="Add insurance type"
                aria-label="Add insurance type"
                className="shrink-0 w-10 h-10 flex items-center justify-center border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 hover:border-navy"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4v16m8-8H4"
                  />
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
              disabled={saving || !typeId}
              className="px-4 py-2 text-sm font-semibold text-white bg-navy hover:bg-navy-dark rounded-lg disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </Modal>

      <InsuranceTypeFormModal
        open={typeModalOpen}
        mode="add"
        nested
        existingItems={localTypes}
        onClose={() => setTypeModalOpen(false)}
        onSave={handleAddType}
      />
    </>
  )
}
