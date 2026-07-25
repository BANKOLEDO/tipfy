import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle, XCircle, Info, X } from 'lucide-react'
import { useUIStore, type Toast } from '~/lib/store'

const icons: Record<Toast['type'], typeof CheckCircle> = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
}

const styles: Record<Toast['type'], string> = {
  success: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  error: 'bg-red-50 border-red-200 text-red-700',
  info: 'bg-blue-50 border-blue-200 text-blue-700',
}

const iconStyles: Record<Toast['type'], string> = {
  success: 'text-emerald-500',
  error: 'text-red-500',
  info: 'text-blue-500',
}

export default function ToastContainer() {
  const toasts = useUIStore((s) => s.toasts)
  const removeToast = useUIStore((s) => s.removeToast)

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col-reverse gap-2 w-[calc(100%-2rem)] max-w-sm pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          const Icon = icons[toast.type]
          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-lg backdrop-blur-sm ${styles[toast.type]}`}
            >
              <Icon className={`h-5 w-5 shrink-0 ${iconStyles[toast.type]}`} />
              <p className="text-sm font-medium flex-1 min-w-0">{toast.message}</p>
              <button
                onClick={() => removeToast(toast.id)}
                className="shrink-0 p-0.5 rounded-lg hover:bg-black/5 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
