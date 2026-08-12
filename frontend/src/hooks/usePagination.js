import { useEffect, useMemo, useState } from 'react'

export const PAGE_SIZE_OPTIONS = [20, 40, 60, 80, 100]
export const DEFAULT_PAGE_SIZE = 20

export function usePagination(items, initialPageSize = DEFAULT_PAGE_SIZE) {
  const [pageSize, setPageSize] = useState(initialPageSize)
  const [page, setPage] = useState(1)

  const total = items?.length || 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1)

  useEffect(() => {
    setPage(1)
  }, [pageSize, total])

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  const pageItems = useMemo(() => {
    const list = items || []
    const start = (page - 1) * pageSize
    return list.slice(start, start + pageSize)
  }, [items, page, pageSize])

  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  return {
    page,
    setPage,
    pageSize,
    setPageSize,
    pageItems,
    total,
    totalPages,
    from,
    to,
    canPrev: page > 1,
    canNext: page < totalPages,
    prev: () => setPage((p) => Math.max(1, p - 1)),
    next: () => setPage((p) => Math.min(totalPages, p + 1)),
  }
}
