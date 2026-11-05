import { CircleCheck, CircleAlert, TriangleAlert, X } from 'lucide-react'
import type { ToastMessage } from './useFlashToast'

// Render inside an open native dialog so the toast stays above its backdrop.
export default function FlashToast({ toast, onDismiss }: {
  toast: ToastMessage | null
  onDismiss: () => void
}) {
  if (!toast) return null
  const isError = toast.type === 'error'
  const isWarning = toast.type === 'warning'
  const Icon = isError ? CircleAlert : isWarning ? TriangleAlert : CircleCheck
  const borderClass = isError ? 'border-red-200' : isWarning ? 'border-amber-200' : 'border-emerald-200'
  const iconClass = isError ? 'text-red-600' : isWarning ? 'text-amber-600' : 'text-emerald-600'
  const title = isError ? 'Error' : isWarning ? 'Notice' : 'Success'
  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex justify-center px-4 sm:top-6">
      <div key={toast.id} className={`flash-toast ${toast.exiting ? 'flash-toast--exiting pointer-events-none' : 'pointer-events-auto'} flex w-full max-w-md items-start gap-3 rounded-xl border bg-white p-4 shadow-xl ${borderClass}`}>
        <Icon aria-hidden="true" className={`mt-0.5 h-5 w-5 shrink-0 ${iconClass}`} />
        <div className="min-w-0 flex-1" role={isError ? 'alert' : 'status'} aria-atomic="true">
          <p className="text-sm font-semibold text-navy">{title}</p>
          <p className="mt-1 break-words text-xs leading-relaxed text-slate-600">{toast.message}</p>
        </div>
        <button type="button" disabled={toast.exiting} onClick={onDismiss} aria-label="Dismiss notification" className="rounded-lg p-1 text-slate-500 transition-colors hover:bg-slate-100 hover:text-navy"><X className="h-4 w-4" /></button>
      </div>
    </div>
  )
}
