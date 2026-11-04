import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signOut } from '../data/auth'

export function useLogout() {
  const navigate = useNavigate()
  const busy = useRef(false)
  const [loggingOut, setLoggingOut] = useState(false)
  async function logout() {
    if (busy.current) return
    busy.current = true
    setLoggingOut(true)
    const revoked = await signOut()
    navigate('/', { replace: true, state: { flashSuccess: revoked ? 'Signed out successfully.' : undefined, logoutWarning: revoked ? undefined : 'You are signed out on this device, but the server could not confirm token revocation. Please sign in and log out again when your connection is restored.' } })
  }
  return { logout, loggingOut }
}
