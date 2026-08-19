import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { apiRequest } from '../utils/api'
import PageShell from '../components/PageShell'
import ConfirmDeleteModal from '../components/ConfirmDeleteModal'

export default function DataManagement() {
  const { user } = useAuth()
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const loadConfig = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await apiRequest('/api/admin/config')
      setConfig(data)
    } catch (err) {
      setError(err.message || 'Failed to load settings')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (user?.role === 'super_admin') {
      loadConfig()
    } else {
      setLoading(false)
      setError('Only Super Admin can manage data')
    }
  }, [user, loadConfig])

  const handleDeleteAll = async () => {
    setDeleting(true)
    setError('')
    setSuccess('')
    try {
      const data = await apiRequest('/api/admin/delete-all', { method: 'DELETE' })
      setSuccess(data.message || 'All records deleted successfully')
      setDeleteOpen(false)
      await loadConfig()
    } catch (err) {
      setError(err.message || 'Failed to delete all records')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <PageShell title="Data Management" subtitle="Fresh start and admin tools">
        <p className="text-sm text-gray-500">Loading...</p>
      </PageShell>
    )
  }

  if (!config?.allowDeleteAll) {
    return (
      <PageShell title="Data Management" subtitle="Fresh start and admin tools">
        <p className="text-sm text-gray-600">
          Delete All is hidden because{' '}
          <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">ALLOW_DELETE_ALL</code>{' '}
          is not set to <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">true</code> on
          the server.
        </p>
      </PageShell>
    )
  }

  return (
    <>
      <PageShell
        title="Data Management"
        subtitle="Wipe all operational data for a live fresh start"
      >
        {error ? (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}
        {success ? (
          <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {success}
          </div>
        ) : null}

        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            This permanently deletes all referrals, houses, reasons, and insurances.
            Location logins are kept so you can still sign in. After delete, default master lists
            are restored empty of referral data, and dummy referrals will never auto-seed again.
          </p>

          {config.dummySeedDisabled ? (
            <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
              Fresh-start flag is active — dummy referral data will not be added on server restart.
            </p>
          ) : null}

          <button
            type="button"
            onClick={() => setDeleteOpen(true)}
            className="px-4 py-2.5 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700"
          >
            Delete All Records
          </button>
        </div>
      </PageShell>

      <ConfirmDeleteModal
        open={deleteOpen}
        onClose={() => !deleting && setDeleteOpen(false)}
        onConfirm={handleDeleteAll}
        loading={deleting}
        title="Delete all records?"
        message="This will erase all referrals and master data, then restore empty defaults. Dummy data will never be seeded again. Location logins are preserved. This cannot be undone."
      />
    </>
  )
}
