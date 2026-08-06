import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, X } from 'lucide-react'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'danger' | 'default'
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'danger',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => { if (!loading) onCancel() }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="w-full max-w-sm bg-white rounded-3xl border border-gray-200/60 shadow-[0_20px_60px_rgba(0,0,0,0.15)] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className={`h-11 w-11 rounded-2xl flex items-center justify-center mb-4 ${
                tone === 'danger' ? 'bg-red-50 text-red-500' : 'bg-amber-50 text-amber-500'
              }`}>
                <AlertTriangle className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-dark-text">{title}</h3>
              <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">{message}</p>
            </div>
            <div className="px-6 pb-6 flex gap-2.5">
              <button
                onClick={onCancel}
                disabled={loading}
                className="flex-1 h-11 rounded-2xl text-sm font-bold bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 transition-all"
              >
                {cancelLabel}
              </button>
              <button
                onClick={onConfirm}
                disabled={loading}
                className={`flex-1 h-11 rounded-2xl text-sm font-bold text-white disabled:opacity-50 transition-all shadow-md ${
                  tone === 'danger'
                    ? 'bg-red-500 hover:bg-red-600 shadow-red-500/25'
                    : 'bg-accent hover:bg-accent-hover shadow-blue-500/25'
                }`}
              >
                {loading ? 'Working...' : confirmLabel}
              </button>
            </div>
            <button onClick={() => { if (!loading) onCancel() }} className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-dark-text transition-all">
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
