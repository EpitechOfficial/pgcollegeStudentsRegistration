import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import FlashToast from './FlashToast'
import { useFlashToast } from './useFlashToast'

/** Consume a success notification once, after its destination page mounts. */
export default function NavigationToast() {
  const location = useLocation()
  const navigate = useNavigate()
  const consumed = useRef<string | null>(null)
  const { toast, showToast, dismissToast } = useFlashToast()

  useEffect(() => {
    const message = location.state?.flashSuccess
    if (typeof message !== 'string' || !message || consumed.current === location.key) return
    consumed.current = location.key
    showToast('success', message)
    const state = { ...location.state }
    delete state.flashSuccess
    navigate(`${location.pathname}${location.search}${location.hash}`, { replace: true, state })
  }, [location, navigate, showToast])

  return <FlashToast toast={toast} onDismiss={dismissToast} />
}
