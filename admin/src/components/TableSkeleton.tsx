export default function TableSkeleton({ rows = 5, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-2xl bg-white border border-gray-200/60 overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              {Array.from({ length: cols }).map((_, i) => (
                <th key={i} className="text-left px-5 py-3">
                  <div className="h-3 w-16 bg-gray-100 rounded-md animate-pulse" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, r) => (
              <tr key={r} className="border-b border-gray-100">
                {Array.from({ length: cols }).map((_, c) => (
                  <td key={c} className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      {c === 0 && <div className="h-9 w-9 rounded-xl bg-gray-100 animate-pulse shrink-0" />}
                      <div className="h-3 bg-gray-100 rounded-md animate-pulse" style={{ width: c === 0 ? '80px' : `${60 + (c * 17) % 60}px` }} />
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
