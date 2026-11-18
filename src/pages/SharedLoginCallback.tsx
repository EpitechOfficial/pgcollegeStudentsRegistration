import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { acceptSharedLogin } from '../data/auth'
import { APPLICATION_LOGIN_URL } from '../data/sharedLogin'
import PortalLoading from '../components/PortalLoading'
import { ArrowLeft, ShieldAlert } from 'lucide-react'

export default function SharedLoginCallback() {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [token] = useState(() => new URLSearchParams(window.location.hash.slice(1)).get('token')?.trim() || '')
  useEffect(() => {
    const controller = new AbortController()
    window.history.replaceState(window.history.state, '', window.location.pathname)
    if (!token) {
      setError('This sign-in link is incomplete. Please sign in again.')
      return () => controller.abort()
    }
    void acceptSharedLogin(token, controller.signal)
      .then(() => {
        if (!controller.signal.aborted) navigate('/dashboard', { replace: true, state: { flashSuccess: 'Signed in successfully.' } })
      })
      .catch((failure: unknown) => {
        if (!controller.signal.aborted) setError(failure && typeof failure === 'object' && 'message' in failure ? String(failure.message) : 'Unable to complete sign-in.')
      })
    return () => controller.abort()
  }, [navigate, token])
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
