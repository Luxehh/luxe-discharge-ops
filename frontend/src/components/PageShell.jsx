export default function PageShell({
  title,
  subtitle,
  actions,
  children,
  bare = false,
  fullWidth = false,
  contentClassName = '',
}) {
  const widthClass = fullWidth ? 'w-full' : 'w-full max-w-5xl'

  return (
    <div className={`flex flex-col ${fullWidth ? '' : 'items-center'}`}>
      <div className={`${widthClass} mb-6`}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">{title}</h2>
            {subtitle ? (
              <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
            ) : null}
          </div>
          {actions ? <div className="shrink-0">{actions}</div> : null}
        </div>
      </div>

      {bare ? (
        <div className={widthClass}>{children}</div>
      ) : (
        <div
          className={`${widthClass} bg-white rounded-xl border border-gray-200 shadow-sm ${
            contentClassName || 'p-5 sm:p-6 lg:p-8'
          }`}
        >
          {children}
        </div>
      )}
    </div>
  )
}
