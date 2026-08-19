export function isSuperAdmin(user) {
  return user?.role === 'super_admin'
}

export function isLocationAdmin(user) {
  return user?.role === 'location_admin'
}

/** Default landing path after login / overview root. */
export function homePathForUser(user, search = '') {
  const qs = search ? (search.startsWith('?') ? search : `?${search}`) : ''
  if (isLocationAdmin(user) && user?.location) {
    return `/overview/${encodeURIComponent(user.location)}${qs}`
  }
  return `/overview${qs}`
}

export const LOCATION_ADMIN_MENU = [
  '/overview',
  '/add-referral',
  '/comparison-trends',
  '/branch-comparison',
  '/insurances',
]

export const SUPER_ADMIN_ONLY_PATHS = [
  '/locations',
  '/insurance-types',
  '/not-accept-reasons',
  '/location-logins',
  '/data-management',
]
