import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

interface PaginationProps {
  page: number
  totalPages: number
  total: number
  label: string
  onPageChange: (page: number) => void
}

function getPageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: (number | '...')[] = [1]
  if (current > 3) pages.push('...')
  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  for (let i = start; i <= end; i++) pages.push(i)
  if (current < total - 2) pages.push('...')
  pages.push(total)
  return pages
}

export default function Pagination({ page, totalPages, total, label, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null
  const pages = getPageNumbers(page, totalPages)
  const perPage = totalPages > 0 ? Math.ceil(total / totalPages) : 20
  const from = (page - 1) * perPage + 1
  const to = Math.min(page * perPage, total)

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
      <p className="text-xs text-gray-400 font-medium">
        Showing <span className="text-dark-text font-semibold">{from}–{to}</span> of{' '}
        <span className="text-dark-text font-semibold">{total.toLocaleString()}</span> {label}
      </p>
      <div className="flex items-center gap-1">
        <button disabled={page <= 1} onClick={() => onPageChange(1)}
          className="p-2 rounded-lg bg-white border border-gray-200/60 hover:bg-gray-50 disabled:opacity-30 transition-all"
          title="First page">
          <ChevronsLeft className="h-3.5 w-3.5 text-gray-500" />
        </button>
        <button disabled={page <= 1} onClick={() => onPageChange(page - 1)}
          className="p-2 rounded-lg bg-white border border-gray-200/60 hover:bg-gray-50 disabled:opacity-30 transition-all"
          title="Previous page">
          <ChevronLeft className="h-3.5 w-3.5 text-gray-500" />
        </button>

        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`dots-${i}`} className="px-1.5 text-gray-300 text-xs">···</span>
          ) : (
            <button key={p} onClick={() => onPageChange(p)}
              className={`min-w-[32px] h-8 rounded-lg text-xs font-semibold transition-all ${
                p === page
                  ? 'bg-accent text-white shadow-md shadow-blue-500/20'
                  : 'bg-white border border-gray-200/60 text-gray-500 hover:text-dark-text hover:border-gray-300'
              }`}>
              {p}
            </button>
          )
        )}

        <button disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}
          className="p-2 rounded-lg bg-white border border-gray-200/60 hover:bg-gray-50 disabled:opacity-30 transition-all"
          title="Next page">
          <ChevronRight className="h-3.5 w-3.5 text-gray-500" />
        </button>
        <button disabled={page >= totalPages} onClick={() => onPageChange(totalPages)}
          className="p-2 rounded-lg bg-white border border-gray-200/60 hover:bg-gray-50 disabled:opacity-30 transition-all"
          title="Last page">
          <ChevronsRight className="h-3.5 w-3.5 text-gray-500" />
        </button>
      </div>
    </div>
  )
}
