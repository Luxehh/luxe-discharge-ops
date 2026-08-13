import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import DashboardLayout from './layouts/DashboardLayout'
import Overview from './pages/Overview'
import OverviewLocation from './pages/OverviewLocation'
import OverviewHouse from './pages/OverviewHouse'
import AddReferral from './pages/AddReferral'
import ComparisonTrends from './pages/ComparisonTrends'
import Locations from './pages/Locations'
import Insurances from './pages/Insurances'
import InsuranceTypes from './pages/InsuranceTypes'
import NotAcceptReasons from './pages/NotAcceptReasons'
import Categories from './pages/Categories'
import LocationLogins from './pages/LocationLogins'
import DataManagement from './pages/DataManagement'
import ReferralView from './pages/ReferralView'
import { homePathForUser, isSuperAdmin } from './utils/roles'

function SuperAdminOnly({ children }) {
  const { user } = useAuth()
  if (!isSuperAdmin(user)) {
    return <Navigate to={homePathForUser(user)} replace />
  }
  return children
}

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-luxe-page flex items-center justify-center">
        <div className="text-luxe-muted text-lg">Loading...</div>
      </div>
    )
  }

  const homePath = homePathForUser(user)

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to={homePath} replace /> : <Login />}
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to={homePath} replace />} />
        <Route path="overview" element={<Overview />} />
        <Route path="overview/:location" element={<OverviewLocation />} />
        <Route path="overview/:location/:houseId" element={<OverviewHouse />} />
        <Route path="add-referral" element={<AddReferral />} />
        <Route path="referral-view" element={<ReferralView />} />
        <Route path="comparison-trends" element={<ComparisonTrends />} />
        <Route
          path="locations"
          element={
            <SuperAdminOnly>
              <Locations />
            </SuperAdminOnly>
          }
        />
        <Route path="insurances" element={<Insurances />} />
        <Route
          path="insurance-types"
          element={
            <SuperAdminOnly>
              <InsuranceTypes />
            </SuperAdminOnly>
          }
        />
        <Route
          path="not-accept-reasons"
          element={
            <SuperAdminOnly>
              <NotAcceptReasons />
            </SuperAdminOnly>
          }
        />
        <Route
          path="categories"
          element={
            <SuperAdminOnly>
              <Categories />
            </SuperAdminOnly>
          }
        />
        <Route
          path="location-logins"
          element={
            <SuperAdminOnly>
              <LocationLogins />
            </SuperAdminOnly>
          }
        />
        <Route
          path="data-management"
          element={
            <SuperAdminOnly>
              <DataManagement />
            </SuperAdminOnly>
          }
        />
      </Route>
      <Route
        path="*"
        element={<Navigate to={user ? homePath : '/login'} replace />}
      />
    </Routes>
  )
}

export default App
