import PageShell from './PageShell'

export default function PlaceholderPage({ title, description }) {
  return (
    <PageShell title={title} subtitle={description}>
      <div className="py-8 sm:py-10 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-cream mb-4">
          <svg
            className="w-7 h-7 text-gold"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
            />
          </svg>
        </div>
        <p className="text-gray-700 font-medium">{title}</p>
        <p className="text-sm text-gray-400 mt-2">
          Page scaffold ready — design and functionality will be added next.
        </p>
      </div>
    </PageShell>
  )
}
