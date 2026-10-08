import { useCallback, useEffect, useRef, useState } from 'react'

export type ToastMessage = { id: number; type: 'success' | 'error'; message: string; exiting: boolean }

export function useFlashToast() {
  const [toast, setToast] = useState<ToastMessage | null>(null)
  const nextId = useRef(0)
  const showToast = useCallback((type: ToastMessage['type'], message: string) => {
    setToast({ id: ++nextId.current, type, message, exiting: false })
  }, [])
  const dismissToast = useCallback(() => {
    setToast((current) => current ? { ...current, exiting: true } : null)
  }, [])

  useEffect(() => {
    if (!toast) return
    if (toast.exiting) {
      const timer = window.setTimeout(() => {
        setToast((current) => current?.id === toast.id ? null : current)
      }, 200)
      return () => window.clearTimeout(timer)
    }
    const timer = window.setTimeout(dismissToast, toast.type === 'error' ? 6000 : 4000)
    return () => window.clearTimeout(timer)
  }, [toast, dismissToast])

  return { toast, showToast, dismissToast }
}
