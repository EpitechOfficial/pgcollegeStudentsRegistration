import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { CircleCheck, LoaderCircle, X } from 'lucide-react'
import { currentStudent } from '../data/portal'
import { isDemoSession } from '../data/auth'
import { loadSuspension, submitSuspension, updateSuspension, SuspensionApiError } from '../data/suspension'
import FlashToast from './FlashToast'
import { useFlashToast } from './useFlashToast'

const SESSIONS = Array.from({ length: 10 }, (_, index) => {
  const year = new Date().getFullYear() - index
  return `${year}/${String(year + 1).slice(-2)}`
})
const storageKey = () => `pgc.suspension-draft.${currentStudent().applicationNumber}`
const inputClass = 'mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-ink transition-colors focus:border-navy disabled:bg-slate-50'
const primaryClass = 'inline-flex items-center justify-center gap-2 rounded-xl bg-navy px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-navy-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50'
const secondaryClass = 'rounded-xl border border-navy/20 bg-navy/5 px-4 py-2.5 text-sm font-semibold text-navy transition-colors hover:bg-navy/10 disabled:opacity-50'

type Values = Record<string, string>
function initialValues(): Values {
  const student = currentStudent()
  return {
    matric: student.matric, fullName: student.nameForForms, faculty: student.faculty,
    department: student.department, degree: student.degree, modeOfStudy: student.modeOfStudy,
  }
}

function loadDraft(): Values {
  const initial = initialValues()
  if (!isDemoSession()) return initial
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey()) ?? 'null')
    if (saved?.values && typeof saved.values === 'object' && !Array.isArray(saved.values) &&
        Object.values(saved.values).every((value) => typeof value === 'string')) {
      return { ...initial, ...saved.values }
    }
  } catch { /* A draft is optional; the form remains usable without browser storage. */ }
  return initial
}

function sessionYear(value: string): number | null {
  const match = /^(\d{4})\/(\d{2}|\d{4})$/.exec(value.trim())
  if (!match) return null
  const year = Number(match[1])
  return match[2] === String(year + 1).slice(-match[2].length) ? year : null
}

export default function SuspensionDialog({ onClose, onSubmitted }: { onClose: () => void; onSubmitted?: (message: string) => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const mounted = useRef(false)
  const busy = useRef(false)
  const [values, setValues] = useState<Values>(loadDraft)
  const demo = isDemoSession()
  const [loading, setLoading] = useState(!demo)
  const [loadError, setLoadError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [exists, setExists] = useState(false)
  const [locked, setLocked] = useState(false)
  const [status, setStatus] = useState('')
  const baseline = useRef<Values>({})
  const saveController = useRef<AbortController | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const { toast, showToast, dismissToast } = useFlashToast()

  useEffect(() => {
    mounted.current = true
    const dialog = dialogRef.current!
    const previousOverflow = document.body.style.overflow
    dialog.showModal()
    document.body.style.overflow = 'hidden'
    return () => {
      saveController.current?.abort()
      mounted.current = false
      dialog.close()
      document.body.style.overflow = previousOverflow
    }
  }, [])

  useEffect(() => {
    if (demo) return
    const controller = new AbortController()
    void loadSuspension(controller.signal).then((record) => {
      if (controller.signal.aborted) return
      setValues(record.values); baseline.current = record.values
      setExists(record.exists); setLocked(record.locked); setStatus(record.status)
    }).catch((error: unknown) => {
      if (!controller.signal.aborted) setLoadError(error instanceof Error ? error.message : 'Unable to load suspension details.')
    }).finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [demo, attempt])

  function change(name: string, value: string) {
    setValues((previous) => ({ ...previous, [name]: value }))
    setSaved(false)
  }

  function field(name: string, label: string, options: {
    type?: 'text' | 'email' | 'tel' | 'number'; required?: boolean; multiline?: boolean; placeholder?: string
  } = {}) {
    const { type = 'text', required = true, multiline = false, placeholder } = options
    const props = {
      id: `suspension-${name}`, name, required: required && !exists && !['fullName', 'faculty', 'department', 'degree', 'modeOfStudy', 'firstRegistration'].includes(name), readOnly: !demo && ['fullName', 'faculty', 'department', 'degree', 'modeOfStudy', 'firstRegistration'].includes(name), value: values[name] ?? '', placeholder,
      className: inputClass,
      onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => change(name, event.target.value),
    }
    return <div key={name} className={multiline ? 'sm:col-span-2' : ''}>
      <label htmlFor={props.id} className="text-xs font-semibold text-ink">{label}{props.required && <span className="ml-1 text-red-600" aria-hidden="true">*</span>}</label>
      {multiline ? <textarea {...props} rows={3} maxLength={2000} /> : <input {...props} type={type} min={type === 'number' ? 0 : undefined} step={type === 'number' ? 1 : undefined} maxLength={type !== 'number' ? 200 : undefined} />}
    </div>
  }

  async function save() {
    if (busy.current || loading || loadError || locked || saved) return
    const required = ['session', 'semesters', 'address', 'reason', 'period', 'resume']
    if (required.some((name) => (!exists || values[name] !== baseline.current[name]) && !values[name]?.trim())) {
      showToast('error', 'Complete all required fields.'); return
    }
    const changed = (name: string) => !exists || values[name] !== baseline.current[name]
    if ((changed('session') && sessionYear(values.session ?? '') === null) || (changed('resume') && sessionYear(values.resume ?? '') === null)) {
      showToast('error', 'Enter a valid academic session, such as 2025/26.'); return
    }
    const resume = sessionYear(values.resume ?? '')
    const session = sessionYear(values.session ?? '')
    if ((changed('resume') || changed('session')) && resume !== null && session !== null && resume < session) {
      showToast('error', 'Resumption must be in or after the suspension session.'); return
    }
    if (changed('semesters') && !/^(\d+|nil)$/i.test(values.semesters.trim())) {
      showToast('error', 'Enter a whole number of semesters, or Nil.'); return
    }
    busy.current = true
    setSaving(true)
    const controller = new AbortController(); saveController.current = controller
    try {
      const cleaned = Object.fromEntries(Object.entries(values).map(([key, value]) => [key, value.trim()]))
      if (demo) {
        localStorage.setItem(storageKey(), JSON.stringify({ values: cleaned, savedAt: new Date().toISOString(), status: 'draft' }))
      } else {
        const result = exists ? await updateSuspension(cleaned, controller.signal, baseline.current) : await submitSuspension(cleaned, controller.signal)
        if (controller.signal.aborted) return
        const message = typeof result.message === 'string' ? result.message : exists ? 'Suspension request updated.' : 'Suspension request submitted.'
        setExists(true); setStatus('pending'); baseline.current = cleaned
        onSubmitted?.(message)
        onClose()
        return
      }
      if (!mounted.current) return
      setValues(cleaned); setSaved(true)
      if (demo) showToast('success', 'Demo draft saved on this browser. It has not been submitted.')
    } catch (error) {
      if (!controller.signal.aborted && mounted.current) {
        showToast('error', error instanceof Error ? error.message : 'Unable to save suspension request.')
        if (error instanceof SuspensionApiError && error.status === 403) setLocked(true)
        if (error instanceof SuspensionApiError && error.status === 409) { setLoading(true); setLoadError(''); setAttempt(value => value + 1) }
      }
    } finally {
      busy.current = false
      if (mounted.current) setSaving(false)
    }
  }

  return createPortal(
    <dialog ref={dialogRef} onCancel={onClose} aria-labelledby="suspension-title" className="suspension-dialog fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-3xl overflow-hidden rounded-2xl bg-white p-0 text-ink shadow-2xl backdrop:bg-[#071D36]/60">
      <FlashToast toast={toast} onDismiss={dismissToast} />
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 p-5">
        <div><h2 id="suspension-title" className="text-lg font-bold">Suspension of Programme</h2><p className="mt-1 text-xs text-slate-500">Complete your registration, sponsor and employer details.</p></div>
        <button type="button" onClick={onClose} aria-label="Close suspension form" className="rounded-lg p-2 hover:bg-slate-100"><X className="h-5 w-5" /></button>
      </div>
      {loading ? <p role="status" className="flex items-center justify-center gap-2 p-10"><LoaderCircle className="h-5 w-5 animate-spin" />Loading suspension details?</p> : loadError ? <div className="p-8 text-center"><p role="alert">{loadError}</p><button type="button" className={primaryClass} onClick={() => { setLoading(true); setLoadError(''); setAttempt(value => value + 1) }}>Retry</button></div> : <form ref={formRef} onSubmit={(event) => { event.preventDefault(); void save() }} className="flex min-h-0 flex-1 flex-col" onInvalid={() => showToast('error', 'Check the highlighted field and complete all required information.')}>
        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-5">
          {/* <p className="rounded-xl bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">Demo preview: requests are saved on this browser only. Your programme status will change only after submission and approval through the college.</p> */}
          {values.applicationNumber && <p className="text-sm">Application Number: <b>{values.applicationNumber}</b></p>}
          {exists && <p className="rounded-xl bg-navy/5 p-3 text-sm">Status: <b className="capitalize">{status || 'Unavailable'}</b>{locked && ' This request is read-only. Contact the Management for changes.'}</p>}
          <p className="text-xs text-slate-500">Fields marked * are required. Enter your full name with your surname first.</p>
          <fieldset disabled={saving || locked}>
            <legend className="mb-4 text-sm font-bold text-navy">Programme details</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label htmlFor="suspension-session" className="text-xs font-semibold">Session <span className="text-red-600">*</span></label>
                <select id="suspension-session" required value={values.session ?? ''} onChange={(event) => change('session', event.target.value)} className={inputClass}><option value="">Select Session</option>{[...new Set([values.session, ...SESSIONS].filter(Boolean))].map((session) => <option key={session}>{session}</option>)}</select>
              </div>
              {field('matric', 'Matric No', { required: false })}
              {field('fullName', 'Full Name (Surname First)')}
              {field('faculty', 'Faculty')}
              {field('department', 'Department')}
              {field('degree', 'Degree in View')}
              {field('modeOfStudy', 'Mode of Study')}
              {field('firstRegistration', 'Session/Date of First Registration', { required: false, placeholder: 'Not provided' })}
              {field('semesters', 'Total No of Semesters Already Completed', { placeholder: 'e.g. 2 or Nil' })}
              <div><label htmlFor="suspension-period" className="text-xs font-semibold">Suspension Period <span className="text-red-600">*</span></label>
                <select id="suspension-period" required value={values.period ?? ''} onChange={(event) => change('period', event.target.value)} className={inputClass}><option value="">Select suspension period</option><option value="1">1 Semester</option><option value="2">2 Semesters</option></select>
              </div>
              {field('address', 'Permanent Address', { multiline: true })}
              {field('reason', 'Reason(s) for Suspension', { multiline: true })}
              {field('resume', 'When do you hope to resume your studies?', { placeholder: 'e.g. 2026/27' })}
            </div>
          </fieldset>
          <fieldset disabled={saving || locked} className="border-t border-slate-200 pt-4">
            <legend className="px-1 text-sm font-bold text-navy">Sponsor’s Details</legend>
            <p className="mb-4 text-xs text-slate-500">Complete where applicable.</p>
            <div className="grid gap-4 sm:grid-cols-2">{field('sponsor', 'Sponsor', { required: false })}{field('sponsorPhone', 'Sponsor’s Telephone Number', { type: 'tel', required: false })}{field('sponsorEmail', 'Sponsor’s Email', { type: 'email', required: false })}{field('sponsorAddress', 'Sponsor’s Address', { multiline: true, required: false })}</div>
          </fieldset>
          <fieldset disabled={saving || locked} className="border-t border-slate-200 pt-4">
            <legend className="px-1 text-sm font-bold text-navy">Employer’s Details</legend>
            <p className="mb-4 text-xs text-slate-500">Complete if you are employed.</p>
            <div className="grid gap-4 sm:grid-cols-2">{field('employer', 'Employer Name', { required: false })}{field('employerPhone', 'Employer Phone', { type: 'tel', required: false })}{field('employerEmail', 'Employer Email', { type: 'email', required: false })}{field('employerAddress', 'Employer Address', { multiline: true, required: false })}</div>
          </fieldset>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-3 border-t border-slate-200 p-4">
          {saved && <span className="mr-auto inline-flex items-center gap-2 text-xs text-emerald-700"><CircleCheck className="h-4 w-4" />{demo ? 'Draft saved on this browser' : 'Request saved'}</span>}
          <button type="button" onClick={onClose} className={secondaryClass}>Close</button>
          <button type="submit" disabled={saving || saved || locked} aria-busy={saving} className={primaryClass}>{saving && <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />}{saving ? 'Saving…' : locked ? 'Read Only' : saved ? 'Request Saved' : demo ? 'Save Demo Draft' : exists ? 'Update Suspension Request' : 'Submit Suspension Request'}</button>
        </div>
      </form>}
    </dialog>, document.body,
  )
}
