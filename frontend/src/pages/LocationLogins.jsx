import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { apiRequest } from '../utils/api'
import PageShell from '../components/PageShell'
import PaginationBar from '../components/PaginationBar'
import LoginFormModal from '../components/LoginFormModal'
import ConfirmDeleteModal from '../components/ConfirmDeleteModal'
import { PasswordEyeButton } from '../components/PasswordInput'
import { usePagination } from '../hooks/usePagination'

export default function LocationLogins() {
  const { user } = useAuth()
  const [logins, setLogins] = useState([])
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [visiblePasswords, setVisiblePasswords] = useState({})

  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState('add')
  const [editingLogin, setEditingLogin] = useState(null)

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletingLogin, setDeletingLogin] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const pagination = usePagination(logins)

  const loadLogins = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await apiRequest('/api/logins')
      setLogins(data.logins || [])
      setLocations(data.locations || [])
    } catch (err) {
      setError(err.message || 'Failed to load logins')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (user?.role === 'super_admin') {
      loadLogins()
    } else {
      setLoading(false)
      setError('Only Super Admin can manage location logins')
    }
  }, [user, loadLogins])

  const togglePassword = (id) => {
    setVisiblePasswords((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const openAdd = () => {
    setFormMode('add')
    setEditingLogin(null)
    setFormOpen(true)
  }

  const openEdit = (login) => {
    setFormMode('edit')
    setEditingLogin(login)
    setFormOpen(true)
  }

  const openDelete = (login) => {
    setDeletingLogin(login)
    setDeleteOpen(true)
  }

  const handleSave = async (payload) => {
    if (formMode === 'edit' && editingLogin) {
      await apiRequest(`/api/logins/${editingLogin.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      })
    } else {
      await apiRequest('/api/logins', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    }
    await loadLogins()
  }

  const handleDelete = async () => {
    if (!deletingLogin) return
    setDeleting(true)
    try {
      await apiRequest(`/api/logins/${deletingLogin.id}`, { method: 'DELETE' })
      setDeleteOpen(false)
      setDeletingLogin(null)
      await loadLogins()
    } catch (err) {
      setError(err.message || 'Failed to delete login')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <PageShell
        title="Location Logins"
        subtitle="Credentials sub admins use to sign in and manage their own location."
        actions={
          user?.role === 'super_admin' ? (
            <button
              type="button"
              onClick={openAdd}
              className="inline-flex items-center justify-center gap-2 self-start px-4 py-2.5 text-sm font-semibold text-white bg-navy hover:bg-navy-dark rounded-lg transition"
            >
              <span className="text-lg leading-none">+</span>
              Add Login
            </button>
          ) : null
        }
        contentClassName="p-0 overflow-hidden"
      >
        {error && (
          <div className="m-4 mb-0 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        {loading ? (
          <div className="p-10 text-center text-gray-500">Loading logins...</div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-200">
                    {['Name', 'Role', 'Location', 'Email', 'Password', 'Actions'].map(
                      (col) => (
                        <th
                          key={col}
                          className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500"
                        >
                          {col}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pagination.pageItems.map((login) => (
                    <tr key={login.id} className="hover:bg-gray-50/60">
                      <td className="px-5 py-4 text-sm font-bold text-gray-900 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => openEdit(login)}
                          className="text-left hover:text-blue-700 hover:underline"
                        >
                          {login.name}
                        </button>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-700 whitespace-nowrap">
                        {login.role}
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-700 whitespace-nowrap">
                        {login.location || '—'}
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-700 whitespace-nowrap">
                        {login.email}
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-700 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="font-mono tracking-wider">
                            {visiblePasswords[login.id] ? login.password : '••••••••'}
                          </span>
                          <PasswordEyeButton
                            visible={!!visiblePasswords[login.id]}
                            onToggle={() => togglePassword(login.id)}
                          />
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm whitespace-nowrap">
                        <div className="flex items-center gap-4">
                          <button
                            type="button"
                            onClick={() => openEdit(login)}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            Edit
                          </button>
                          {login.roleKey !== 'super_admin' && (
                            <button
                              type="button"
                              onClick={() => openDelete(login)}
                              className="text-red-600 hover:text-red-700 font-medium"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {logins.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-5 py-10 text-center text-gray-500">
                        No logins found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-gray-100">
              {pagination.pageItems.map((login) => (
                <div key={login.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-gray-900">
                        <button
                          type="button"
                          onClick={() => openEdit(login)}
                          className="text-left hover:text-blue-700 hover:underline"
                        >
                          {login.name}
                        </button>
                      </p>
                      <p className="text-sm text-gray-500">
                        {login.role}
                        {login.location ? ` · ${login.location}` : ''}
                      </p>
                    </div>
                    <div className="flex gap-3 shrink-0">
                      <button
                        type="button"
                        onClick={() => openEdit(login)}
                        className="text-sm text-blue-600 font-medium"
                      >
                        Edit
                      </button>
                      {login.roleKey !== 'super_admin' && (
                        <button
                          type="button"
                          onClick={() => openDelete(login)}
                          className="text-sm text-red-600 font-medium"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-700">{login.email}</p>
                  <p className="text-sm text-gray-700 flex items-center gap-1.5">
                    <span className="font-mono tracking-wider">
                      {visiblePasswords[login.id] ? login.password : '••••••••'}
                    </span>
                    <PasswordEyeButton
                      visible={!!visiblePasswords[login.id]}
                      onToggle={() => togglePassword(login.id)}
                    />
                  </p>
                </div>
              ))}
              {logins.length === 0 && (
                <div className="p-8 text-center text-gray-500">No logins found.</div>
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

      <LoginFormModal
        open={formOpen}
        mode={formMode}
        initialValues={editingLogin}
        locations={locations}
        onClose={() => setFormOpen(false)}
        onSave={handleSave}
      />

      <ConfirmDeleteModal
        open={deleteOpen}
        onClose={() => {
          setDeleteOpen(false)
          setDeletingLogin(null)
        }}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </>
  )
}
