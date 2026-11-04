import { useEffect } from 'react'
import { APPLICATION_LOGIN_URL } from '../data/sharedLogin'
import PortalLoading from '../components/PortalLoading'

export default function SharedLoginPage() {
  useEffect(() => { window.location.replace(APPLICATION_LOGIN_URL) }, [])
  return <PortalLoading />
}
