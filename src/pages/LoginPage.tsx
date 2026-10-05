import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, CircleAlert, Eye, EyeOff, LifeBuoy, LoaderCircle, X } from 'lucide-react'
import type { AuthError } from '../data/auth'
import { rememberedMatric, signIn } from '../data/auth'
import { COLLEGE, CURRENT_SESSION } from '../data/portal'

function FieldError({ id, message }: { id: string; message: string }) {
  return (
    <p id={id} className="mt-1.5 flex items-center gap-1 text-2xs font-medium text-red-600" role="alert">
      <CircleAlert className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      {message}
    </p>
  )
}

/* Four answers the Information Unit is asked most before sign-in. Kept
   short on purpose — the portal is a tool, not a noticeboard. */
const FAQS: ReadonlyArray<{ question: string; answer: string }> = [
  {
    question: 'What do I use to sign in?',
    answer:
      'Use the application number on your application slip — once matriculated you can sign in with your matriculation number. Your password is the one created with that record.',
  },
  {
    question: "I've forgotten my password. What should I do?",
    answer:
      'Choose Forgot password? to send a reset request to the Information Unit. Include your full name, application number and programme so it can be handled quickly.',
  },
  {
    question: 'Is registration open for the current session?',
    answer: `Registration for the ${CURRENT_SESSION} session is open. Payment and course-registration deadlines are announced on the portal noticeboard, so sign in and check for updates.`,
  },
  {
    question: 'Who do I contact if a payment or course is missing?',
    answer: `Contact the Information Unit with your application number and payment reference — use the Contact Help Desk link above or email ${COLLEGE.email}.`,
  },
]

export default function LoginPage() {
  const navigate = useNavigate()
  // const [matric, setMatric] = useState(rememberedMatric())
  const [matric, setMatric] = useState('PG123')
  const [password, setPassword] = useState('pg@123')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [authError, setAuthError] = useState<AuthError | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [faqOpen, setFaqOpen] = useState(false)

  // Close the FAQ dialog with Escape and lock page scrolling while it is open
  useEffect(() => {
    if (!faqOpen) return
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setFaqOpen(false)
    }
    document.addEventListener('keydown', handleKeydown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeydown)
      document.body.style.overflow = previousOverflow
    }
  }, [faqOpen])

  function validate(): boolean {
    const next: Record<string, string> = {}
    if (!matric.trim()) next.matric = 'Enter your application number.'
    if (!password) next.password = 'Enter your password.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setAuthError(null)
    if (!validate()) return

    setSubmitting(true)
    try {
      await signIn({ matric, password, remember })
      navigate('/dashboard', { replace: true })
    } catch (error) {
      setAuthError(error as AuthError)
      setSubmitting(false)
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center bg-[#3D5A80] sm:justify-center sm:px-6 sm:py-12 lg:px-8">
      {/* Outer Card Container (white card wraps everything on sm+; mobile holds only the form) */}
      <main className="w-full max-w-5xl bg-transparent p-0 sm:rounded-[36px] sm:bg-white sm:p-5 sm:shadow-2xl lg:p-6">
        <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-2 lg:gap-8">
          
          {/* ==================== LEFT: School Image ==================== */}
          <section
            aria-label="Institution campus preview"
            className="relative flex h-56 w-full flex-col justify-end overflow-hidden bg-transparent p-6 sm:h-auto sm:min-h-[400px] sm:rounded-[28px] sm:bg-[#0A2B4F] sm:p-8 lg:min-h-[600px]"
          >
            <img
              src="/campus/pg-school.jpg"
              alt="The Postgraduate College, University of Ibadan Campus"
              className="absolute inset-0 h-full w-full object-cover object-center opacity-75"
            />
            {/* Mobile: fade the image into the page background (no card edges) */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#3D5A80] via-[#3D5A80]/20 to-[#3D5A80] sm:hidden" />
            {/* sm+: dim the image inside the rounded card */}
            <div className="absolute inset-0 hidden bg-[#0A2B4F]/50 sm:block" />
            <div className="absolute inset-0 hidden bg-gradient-to-t from-[#0A2B4F]/95 via-[#0A2B4F]/40 to-transparent sm:block" />

            {/* FAQ trigger — sits at the top of the campus image */}
            <div className="absolute inset-x-0 top-0 z-10 p-6 sm:p-8">
              <button
                type="button"
                onClick={() => setFaqOpen(true)}
                className="group inline-flex items-center gap-2 rounded-full bg-white/10 py-2 pl-3 pr-4 text-xs font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20 focus-visible:outline-[#FFBB00]"
              >
                <span
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-[#FFBB00] text-[#0A2B4F]"
                  aria-hidden="true"
                >
                  <LifeBuoy className="h-3.5 w-3.5" />
                </span>
                FAQs
                <ChevronDown
                  className="h-3.5 w-3.5 text-white/70 transition-transform duration-200 group-hover:translate-y-0.5"
                  aria-hidden="true"
                />
              </button>
            </div>

            {/* University caption — back at the bottom of the campus image */}
            <div className="relative z-10 text-white">
              <h2 className="text-xl font-bold leading-tight tracking-tight text-white sm:text-2xl">
                {COLLEGE.shortName}
              </h2>
              <p className="mt-1 text-xs font-medium text-[#FFBB00] sm:text-sm">
                {COLLEGE.university}
              </p>
            </div>
          </section>

          {/* ==================== RIGHT: Sign In Card ==================== */}
          <section
            aria-label="Sign in"
            className="mx-4 flex flex-col justify-center rounded-[32px] bg-white p-6 shadow-2xl sm:mx-0 sm:rounded-none sm:bg-transparent sm:p-0 sm:px-8 sm:py-8 sm:shadow-none lg:px-12"
          >
            {/* Header: Logo, Title & Subtitle */}
            <div className="mb-6 text-center">
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center">
                <img
                  src="/brand/pgc-logo.png"
                  alt="University Crest"
                  className="h-full w-full object-contain drop-shadow-sm"
                />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-[#FFBB00] sm:text-3xl">
                Registration Portal
              </h1>
              <p className="mt-1 text-sm text-[#495057]">
                Sign in to access your Student portal
              </p>
            </div>

            {/* Auth error notification */}
            {authError && (
              <div
                className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5"
                role="alert"
              >
                <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-red-600" aria-hidden="true" />
                <div className="text-sm">
                  <p className="font-semibold text-red-800">Sign-in failed</p>
                  <p className="mt-0.5 text-xs text-red-700">{authError.message}</p>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              {/* Application Number field */}
              <div>
                <input
                  id="application-number"
                  name="application-number"
                  type="text"
                  autoComplete="username"
                  autoCapitalize="characters"
                  spellCheck={false}
                  placeholder="Application Number"
                  value={matric}
                  onChange={(event) => {
                    setMatric(event.target.value)
                    if (errors.matric) setErrors((prev) => ({ ...prev, matric: '' }))
                    if (authError) setAuthError(null)
                  }}
                  aria-invalid={Boolean(errors.matric)}
                  aria-describedby={errors.matric ? 'application-number-error' : undefined}
                  disabled={submitting}
                  className={`block w-full rounded-xl border bg-white px-4 py-3.5 text-sm text-[#212529] placeholder:text-[#CCCCCC] transition-all focus:outline-none focus:ring-2 focus:ring-[#FFBB00]/30 ${
                    errors.matric ? 'border-red-400 focus:border-red-600' : 'border-[#E5E7EB] focus:border-[#FFBB00]'
                  }`}
                />
                {errors.matric && (
                  <FieldError id="application-number-error" message={errors.matric} />
                )}
              </div>

              {/* Password field */}
              <div>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Password"
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value)
                      if (errors.password) setErrors((prev) => ({ ...prev, password: '' }))
                      if (authError) setAuthError(null)
                    }}
                    aria-invalid={Boolean(errors.password)}
                    aria-describedby={errors.password ? 'password-error' : undefined}
                    disabled={submitting}
                    className={`block w-full rounded-xl border bg-white px-4 py-3.5 pr-11 text-sm text-[#212529] placeholder:text-[#CCCCCC] transition-all focus:outline-none focus:ring-2 focus:ring-[#FFBB00]/30 ${
                      errors.password ? 'border-red-400 focus:border-red-600' : 'border-[#E5E7EB] focus:border-[#FFBB00]'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showPassword}
                    disabled={submitting}
                    className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-[#495057] transition-colors hover:text-[#212529]"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Eye className="h-4 w-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <FieldError id="password-error" message={errors.password} />
                )}
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between pt-1 text-xs sm:text-sm">
                <label className="flex cursor-pointer items-center gap-2 text-[#495057] select-none">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(event) => setRemember(event.target.checked)}
                    className="h-4 w-4 rounded border-[#CCCCCC] text-[#0A2B4F] focus:ring-[#0A2B4F]/20"
                  />
                  <span>Remember for 30 days</span>
                </label>
                <a
                  href={`mailto:${COLLEGE.email}?subject=Portal%20Password%20Reset%20Request`}
                  className="font-medium text-[#495057] transition-colors hover:text-[#0A2B4F] hover:underline"
                >
                  Forgot password?
                </a>
              </div>

              {/* Primary Sign In Button */}
              <button
                type="submit"
                disabled={submitting}
                aria-busy={submitting}
                className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0A2B4F] text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#12335A] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-75"
              >
                {submitting ? (
                  <>
                    <LoaderCircle className="h-4 w-4 animate-spin text-[#FFBB00]" aria-hidden="true" />
                    <span>Signing in…</span>
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            {/* Subtle helpdesk tip */}
            <p className="mt-8 text-center text-xs text-[#495057]">
              Need assistance?{' '}
              <a
                href={`mailto:${COLLEGE.email}`}
                className="font-medium text-[#0A2B4F] underline-offset-2 hover:underline"
              >
                Contact Help Desk
              </a>
            </p>
          </section>
        </div>
      </main>
      {/* FAQ dialog — glass card over a dimmed, blurred page */}
      {faqOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <button
            type="button"
            aria-label="Close frequently asked questions"
            onClick={() => setFaqOpen(false)}
            className="absolute inset-0 cursor-default bg-[#212529]/40 backdrop-blur-md"
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="login-faq-heading"
            className="relative flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-white/60 bg-white/90 shadow-overlay backdrop-blur-xl"
          >
            {/* Dialog header */}
            <div className="flex items-center justify-between border-b border-[#E5E7EB] px-5 py-4">
              <div className="flex items-center gap-2.5">
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FFBB00]/15 text-[#B98400]"
                  aria-hidden="true"
                >
                  <LifeBuoy className="h-4 w-4" />
                </span>
                <div>
                  <h2
                    id="login-faq-heading"
                    className="text-sm font-semibold tracking-tight text-[#0A2B4F]"
                  >
                    Frequently asked questions
                  </h2>
                  <p className="text-2xs text-[#6C757D]">Quick answers before you sign in</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFaqOpen(false)}
                aria-label="Close frequently asked questions"
                className="rounded-lg p-1.5 text-[#6C757D] transition-colors hover:bg-[#0A2B4F]/5 hover:text-[#212529]"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            {/* FAQ list */}
            <div className="no-scrollbar space-y-2.5 overflow-y-auto px-5 py-4">
              {FAQS.map((faq) => (
                <details
                  key={faq.question}
                  className="group rounded-2xl border border-[#E5E7EB] bg-[#F5F7F9] px-4 transition-colors open:border-[#0A2B4F]/20 open:bg-white hover:border-[#0A2B4F]/20"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-3.5 text-sm font-medium text-[#212529] [&::-webkit-details-marker]:hidden">
                    <span>{faq.question}</span>
                    <ChevronDown
                      className="h-4 w-4 shrink-0 text-[#6C757D] transition-transform duration-200 group-open:rotate-180"
                      aria-hidden="true"
                    />
                  </summary>
                  <p className="pb-3.5 pr-5 text-xs leading-relaxed text-[#495057]">
                    {faq.answer}
                  </p>
                </details>
              ))}

              <p className="pt-1 text-center text-2xs text-[#6C757D]">
                Still need help?{' '}
                <a
                  href={`mailto:${COLLEGE.email}`}
                  className="font-medium text-[#0A2B4F] underline-offset-2 hover:underline"
                >
                  Contact the Information Unit
                </a>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-6 pb-8 text-center text-xs text-white/85 sm:pb-0">
        <p>
          © {new Date().getFullYear()} {COLLEGE.shortName}, {COLLEGE.university}. All rights reserved.
        </p>
      </footer>
    </div>
  )
}
