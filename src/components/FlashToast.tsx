import { CircleCheck, CircleAlert, X } from 'lucide-react'
import type { ToastMessage } from './useFlashToast'

// Render inside an open native dialog so the toast stays above its backdrop.
export default function FlashToast({ toast, onDismiss }: {
  toast: ToastMessage | null
  onDismiss: () => void
}) {
  if (!toast) return null
  const isError = toast.type === 'error'
  const Icon = isError ? CircleAlert : CircleCheck
  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex justify-center px-4 sm:top-6">
      <div key={toast.id} className={`flash-toast ${toast.exiting ? 'flash-toast--exiting pointer-events-none' : 'pointer-events-auto'} flex w-full max-w-md items-start gap-3 rounded-xl border bg-white p-4 shadow-xl ${isError ? 'border-red-200' : 'border-emerald-200'}`}>
        <Icon aria-hidden="true" className={`mt-0.5 h-5 w-5 shrink-0 ${isError ? 'text-red-600' : 'text-emerald-600'}`} />
        <div className="min-w-0 flex-1" role={isError ? 'alert' : 'status'} aria-atomic="true">
          <p className="text-sm font-semibold text-navy">{isError ? 'Error' : 'Success'}</p>
          <p className="mt-1 break-words text-xs leading-relaxed text-slate-600">{toast.message}</p>
        </div>
        <button type="button" disabled={toast.exiting} onClick={onDismiss} aria-label="Dismiss notification" className="rounded-lg p-1 text-slate-500 transition-colors hover:bg-slate-100 hover:text-navy"><X className="h-4 w-4" /></button>
      </div>
    </div>
  )
}
