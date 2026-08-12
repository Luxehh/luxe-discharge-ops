import { useEffect, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { apiRequest } from '../utils/api'
import Header from '../components/Header'
import Sidebar from '../components/Sidebar'

export default function DashboardLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [allowDeleteAll, setAllowDeleteAll] = useState(false)

  useEffect(() => {
    if (user?.role !== 'super_admin') {
      setAllowDeleteAll(false)
      return
    }

    let cancelled = false
    apiRequest('/api/admin/config')
      .then((data) => {
        if (!cancelled) setAllowDeleteAll(!!data.allowDeleteAll)
      })
      .catch(() => {
        if (!cancelled) setAllowDeleteAll(false)
      })

    return () => {
      cancelled = true
    }
  }, [user])

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="dashboard-shell h-screen flex flex-col bg-gray-100 overflow-hidden print:h-auto print:overflow-visible print:bg-white">
      <Header
        user={user}
        onLogout={handleLogout}
        onMenuToggle={() => setSidebarOpen(true)}
      />

      <div className="dashboard-body flex flex-1 min-h-0 print:block print:min-h-0">
        <Sidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          isSuperAdmin={user?.role === 'super_admin'}
          allowDeleteAll={allowDeleteAll}
        />

        <main className="dashboard-main flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 print:overflow-visible print:p-0">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
