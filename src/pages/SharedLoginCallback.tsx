import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { acceptSharedLogin } from '../data/auth'
import { APPLICATION_LOGIN_URL, validHandoffMessage } from '../data/sharedLogin'
import PortalLoading from '../components/PortalLoading'
import { ArrowLeft, ShieldAlert } from 'lucide-react'

export default function SharedLoginCallback() {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [nonce] = useState(() => new URLSearchParams(window.location.hash.slice(1)).get('handoff') || '')
  useEffect(() => {
    const embedded = window.parent !== window
    const opener = (embedded ? window.parent : window.opener) as Window | null
    const origin = new URL(APPLICATION_LOGIN_URL).origin
    const controller = new AbortController()
    let receiving = false
    window.history.replaceState(window.history.state, '', window.location.pathname)
    const timeout = window.setTimeout(() => {
      controller.abort()
      setError('This sign-in handoff has expired. Please sign in again.')
    }, 60000)
    const receive = async (event: MessageEvent) => {
      if (receiving || controller.signal.aborted || !/^[a-f0-9]{64}$/.test(nonce) || !validHandoffMessage(event, opener, nonce)) return
      receiving = true
      try {
        await acceptSharedLogin(event.data.token, controller.signal)
        if (controller.signal.aborted) return
        opener?.postMessage({ type: 'pgc:registration-complete', nonce }, origin)
        if (!embedded) {
          window.opener = null
          navigate('/dashboard', { replace: true, state: { flashSuccess: 'Signed in successfully.' } })
        }
      } catch (failure) {
        if (!controller.signal.aborted) {
          const message = failure && typeof failure === 'object' && 'message' in failure ? String(failure.message) : 'Unable to complete sign-in.'
          setError(message)
          opener?.postMessage({ type: 'pgc:registration-failed', nonce, message }, origin)
        }
      } finally { window.clearTimeout(timeout) }
    }
    const ready = () => {
      if (!receiving && !controller.signal.aborted) opener?.postMessage({ type: 'pgc:registration-ready', nonce }, origin)
    }
    window.addEventListener('message', receive)
    ready()
    const interval = window.setInterval(ready, 500)
    return () => { controller.abort(); window.clearTimeout(timeout); window.clearInterval(interval); window.removeEventListener('message', receive) }
  }, [navigate, nonce])
  return error ? <main className="flex min-h-dvh items-center justify-center bg-slate-50 px-5 py-12 text-navy">
    <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl shadow-navy/5 sm:p-10">
      <img src={`${import.meta.env.BASE_URL}brand/pgc-logo.png`} alt="The Postgraduate College" className="mx-auto mb-5 h-20 w-20 object-contain" />
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">University of Ibadan</p>
      <h1 className="mt-2 text-2xl font-bold">Registration Portal</h1>
      <div className="mx-auto mb-4 mt-8 flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-700"><ShieldAlert className="h-6 w-6" aria-hidden="true" /></div>
      <h2 className="text-lg font-semibold">We couldn’t complete your sign-in</h2>
      <p role="alert" className="mb-7 mt-3 text-sm leading-6 text-slate-600">{error}</p>
      <a href={APPLICATION_LOGIN_URL} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-navy px-5 py-3 text-sm font-semibold text-white hover:bg-navy-700"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Back to Sign In</a>
    </section>
  </main> : <PortalLoading />
}
