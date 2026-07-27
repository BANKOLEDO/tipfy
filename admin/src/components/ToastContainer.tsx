import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'
import { useUIStore } from '~/lib/store'

export default function ToastContainer() {
  const { toasts, removeToast } = useUIStore()

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div key={t.id} initial={{ opacity: 0, x: 40, scale: 0.95 }} animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, scale: 0.95 }} transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className={`flex items-start gap-3 p-3.5 rounded-xl border shadow-lg backdrop-blur-sm ${
              t.type === 'success' ? 'bg-success/10 border-success/20 text-success' :
              t.type === 'error' ? 'bg-error/10 border-error/20 text-error' :
              'bg-info/10 border-info/20 text-info'
            }`}>
            {t.type === 'success' ? <CheckCircle className="h-4 w-4 mt-0.5 shrink-0" /> :
             t.type === 'error' ? <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" /> :
             <Info className="h-4 w-4 mt-0.5 shrink-0" />}
            <p className="text-sm flex-1">{t.message}</p>
            <button onClick={() => removeToast(t.id)} className="p-0.5 hover:opacity-70 shrink-0">
              <X className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
