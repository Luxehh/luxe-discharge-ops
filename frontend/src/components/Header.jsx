import BrandLogo from './BrandLogo'

export default function Header({ user, onLogout, onMenuToggle }) {
  const displayName = user?.name || 'User'
  const subtitle =
    user?.role === 'super_admin'
      ? 'Super Admin'
      : user?.location || 'Location Admin'

  return (
    <header
      className="bg-white text-luxe-text shrink-0 border-b border-luxe-border print:hidden"
      data-print-hide
    >
      <div className="flex items-center justify-between px-4 sm:px-6 h-14 sm:h-16">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onMenuToggle}
            className="lg:hidden p-2 -ml-1 rounded-md text-luxe-text hover:bg-luxe-beige"
            aria-label="Open menu"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <BrandLogo size="sm" />
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-semibold font-serif leading-tight truncate text-luxe-text">
              Luxe Score Card
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold leading-tight text-luxe-text">{displayName}</p>
            <p className="text-xs text-luxe-muted leading-tight">{subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="bg-white text-luxe-text text-sm font-semibold px-3 sm:px-4 py-1.5 rounded-md border border-luxe-text/80 hover:bg-luxe-beige transition whitespace-nowrap"
          >
            Log Out
          </button>
        </div>
      </div>
    </header>
  )
}
