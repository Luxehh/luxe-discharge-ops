import { useEffect, useState } from 'react'
import Modal from './Modal'
import PasswordInput from './PasswordInput'

const EMPTY = {
  name: '',
  location: 'Illinois',
  email: '',
  password: '',
}

export default function LoginFormModal({
  open,
  mode = 'add',
  initialValues,
  locations = [],
  onClose,
  onSave,
}) {
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const isEdit = mode === 'edit'
  const isSuperAdmin = initialValues?.roleKey === 'super_admin'

  useEffect(() => {
    if (open) {
      setForm(
        initialValues
          ? {
              name: initialValues.name || '',
              location: initialValues.location || locations[0] || 'Illinois',
              email: initialValues.email || '',
              password: initialValues.password || '',
            }
          : { ...EMPTY, location: locations[0] || 'Illinois' }
      )
      setError('')
      setSaving(false)
    }
  }, [open, initialValues, locations])

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      await onSave({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        location: isSuperAdmin ? null : form.location,
      })
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit login' : 'Add location login'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Full name
          </label>
          <input
            type="text"
            value={form.name}
            onChange={handleChange('name')}
            required
            className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-navy/30 focus:border-navy"
          />
        </div>

        {!isSuperAdmin && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Location
            </label>
            <select
              value={form.location}
              onChange={handleChange('location')}
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
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Email
          </label>
          <input
            type="email"
            value={form.email}
            onChange={handleChange('email')}
            required
            className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-navy/30 focus:border-navy"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Password
          </label>
          <PasswordInput
            value={form.password}
            onChange={handleChange('password')}
            required
            autoComplete="new-password"
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
