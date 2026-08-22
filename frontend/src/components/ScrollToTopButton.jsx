import { useEffect, useState } from 'react'

export default function ScrollToTopButton({ scrollParentSelector = '.dashboard-main' }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = document.querySelector(scrollParentSelector)
    if (!el) return undefined

    const onScroll = () => {
      setVisible(el.scrollTop > 320)
    }

    onScroll()
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [scrollParentSelector])

  const scrollToTop = () => {
    const el = document.querySelector(scrollParentSelector)
    if (!el) return
    el.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (!visible) return null

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Scroll to top"
      title="Scroll to top"
      className="fixed bottom-5 right-5 z-40 print:hidden inline-flex items-center justify-center w-11 h-11 rounded-full bg-luxe-btn text-white shadow-lg hover:bg-luxe-olive-dark transition focus:outline-none focus:ring-2 focus:ring-navy/40"
      data-print-hide
    >
      <svg
        className="w-5 h-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2.5}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
      </svg>
    </button>
  )
}
