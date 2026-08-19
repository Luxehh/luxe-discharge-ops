import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { homePathForUser, LOCATION_ADMIN_MENU } from '../utils/roles'

const iconClass = 'w-4 h-4 shrink-0'

function OverviewIcon() {
  return (
    <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  )
}

function ReferralIcon() {
  return (
    <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9" />
    </svg>
  )
}

function TrendsIcon() {
  return (
    <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4v16" />
    </svg>
  )
}

function BranchIcon() {
  return (
    <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18h18M7 16V9m5 7V5m5 11v-4" />
    </svg>
  )
}

function LocationsIcon() {
  return (
    <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  )
}

function InsurancesIcon() {
  return (
    <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  )
}

function InsuranceTypesIcon() {
  return (
    <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
    </svg>
  )
}

function NotAcceptIcon() {
  return (
    <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
    </svg>
  )
}

function LoginsIcon() {
  return (
    <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
    </svg>
  )
}

function DataIcon() {
  return (
    <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  )
}

const MENU_ITEMS = [
  { to: '/overview', label: 'Overview', icon: OverviewIcon },
  { to: '/add-referral', label: 'Add Referral Details', icon: ReferralIcon },
  { to: '/comparison-trends', label: 'Comparison & Trends', icon: TrendsIcon },
  { to: '/branch-comparison', label: 'Branch Comparison', icon: BranchIcon },
  { to: '/locations', label: 'Locations', icon: LocationsIcon, superAdminOnly: true },
  { to: '/insurances', label: 'Insurances', icon: InsurancesIcon },
  {
    to: '/insurance-types',
    label: 'Insurance Types',
    icon: InsuranceTypesIcon,
    superAdminOnly: true,
  },
  {
    to: '/not-accept-reasons',
    label: 'Not-Accept Reasons',
    icon: NotAcceptIcon,
    superAdminOnly: true,
  },
  {
    to: '/location-logins',
    label: 'Location Logins',
    icon: LoginsIcon,
    superAdminOnly: true,
  },
  {
    to: '/data-management',
    label: 'Data Management',
    icon: DataIcon,
    superAdminOnly: true,
    requiresAllowDeleteAll: true,
  },
]

export default function Sidebar({ open, onClose, isSuperAdmin, allowDeleteAll = false }) {
  const { user } = useAuth()
  const location = useLocation()
  const overviewTo = homePathForUser(user)

  const items = MENU_ITEMS.filter((item) => {
    if (item.requiresAllowDeleteAll && !allowDeleteAll) return false
    if (item.superAdminOnly) return isSuperAdmin
    if (!isSuperAdmin) return LOCATION_ADMIN_MENU.includes(item.to)
    return true
  }).map((item) =>
    item.to === '/overview' ? { ...item, to: overviewTo } : item
  )

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden print:hidden"
          onClick={onClose}
          aria-hidden="true"
          data-print-hide
        />
      )}

      <aside
        data-print-hide
        className={`
          print:hidden
          fixed lg:static inset-y-0 left-0 z-50
          w-64 bg-white border-r border-luxe-border
          transform transition-transform duration-200 ease-in-out
          ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          flex flex-col
        `}
      >
        <div className="flex items-center justify-between px-4 py-3 lg:hidden border-b border-luxe-border">
          <span className="text-sm font-semibold text-luxe-text">Menu</span>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-md text-luxe-muted hover:bg-luxe-beige"
            aria-label="Close menu"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 px-3 py-5 overflow-y-auto">
          <p className="px-3 mb-3 text-[11px] font-semibold tracking-wider text-luxe-muted uppercase">
            Menu
          </p>
          <ul className="space-y-1">
            {items.map(({ to, label, icon: Icon }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  onClick={onClose}
                  className={({ isActive }) => {
                    const active =
                      to.startsWith('/overview')
                        ? location.pathname.startsWith('/overview')
                        : isActive
                    return `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                      active
                        ? 'bg-luxe-beige text-luxe-olive'
                        : 'text-luxe-text hover:bg-luxe-page'
                    }`
                  }}
                >
                  <Icon />
                  <span>{label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </>
  )
}
