import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { CircleCheck, LoaderCircle, X } from 'lucide-react'
import { STUDENT } from '../data/portal'
import FlashToast from './FlashToast'
import { useFlashToast } from './useFlashToast'

const SESSIONS = Array.from({ length: 10 }, (_, index) => {
  const year = 2026 - index
  return `${year}/${String(year + 1).slice(-2)}`
})
const STORAGE_KEY = `pgc.suspension-draft.${STUDENT.applicationNumber}`
const inputClass = 'mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-ink transition-colors focus:border-navy disabled:bg-slate-50'
const primaryClass = 'inline-flex items-center justify-center gap-2 rounded-xl bg-navy px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-navy-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50'
const secondaryClass = 'rounded-xl border border-navy/20 bg-navy/5 px-4 py-2.5 text-sm font-semibold text-navy transition-colors hover:bg-navy/10 disabled:opacity-50'

type Values = Record<string, string>
const INITIAL: Values = {
  matric: STUDENT.matric, fullName: STUDENT.name, faculty: STUDENT.faculty,
  department: STUDENT.department, degree: STUDENT.degree, modeOfStudy: STUDENT.modeOfStudy,
}

function loadDraft(): Values {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')
    if (saved?.values && typeof saved.values === 'object' && !Array.isArray(saved.values) &&
        Object.values(saved.values).every((value) => typeof value === 'string')) {
      return { ...INITIAL, ...saved.values }
    }
  } catch { /* A draft is optional; the form remains usable without browser storage. */ }
  return INITIAL
}

function sessionYear(value: string): number | null {
  const match = /^(\d{4})\/(\d{2}|\d{4})$/.exec(value.trim())
  if (!match) return null
  const year = Number(match[1])
  return match[2] === String(year + 1).slice(-match[2].length) ? year : null
}

export default function SuspensionDialog({ onClose }: { onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const mounted = useRef(false)
  const busy = useRef(false)
  const [values, setValues] = useState<Values>(loadDraft)
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
      mounted.current = false
      dialog.close()
      document.body.style.overflow = previousOverflow
    }
  }, [])

  function change(name: string, value: string) {
    setValues((previous) => ({ ...previous, [name]: value }))
    setSaved(false)
  }

  function field(name: string, label: string, options: {
    type?: 'text' | 'email' | 'tel' | 'number'; required?: boolean; multiline?: boolean; placeholder?: string
  } = {}) {
    const { type = 'text', required = true, multiline = false, placeholder } = options
    const props = {
      id: `suspension-${name}`, name, required, value: values[name] ?? '', placeholder,
      className: inputClass,
      onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => change(name, event.target.value),
    }
    return <div key={name} className={multiline ? 'sm:col-span-2' : ''}>
      <label htmlFor={props.id} className="text-xs font-semibold text-ink">{label}{required && <span className="ml-1 text-red-600" aria-hidden="true">*</span>}</label>
      {multiline ? <textarea {...props} rows={3} maxLength={2000} /> : <input {...props} type={type} min={type === 'number' ? 0 : undefined} step={type === 'number' ? 1 : undefined} maxLength={type !== 'number' ? 200 : undefined} />}
    </div>
  }

  async function save() {
    if (busy.current) return
    const required = ['session', 'matric', 'fullName', 'faculty', 'department', 'degree', 'modeOfStudy', 'firstRegistration', 'semesters', 'address', 'reason', 'period', 'resume']
    if (required.some((name) => !values[name]?.trim())) {
      showToast('error', 'Complete all required fields. Fields cannot contain only spaces.')
      return
    }
    const first = sessionYear(values.firstRegistration)
    const resume = sessionYear(values.resume)
    const suspension = sessionYear(values.session)
    if (first === null || resume === null || suspension === null) {
      showToast('error', 'Enter a valid academic session, such as 2025/26 or 2025/2026.')
      return
    }
    if (first > suspension || resume < suspension) {
      showToast('error', 'First registration must be on or before the suspension session. Resumption must be in or after the suspension session.')
      return
    }
    busy.current = true
    setSaving(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 600))
      if (!mounted.current) return
      const cleaned = Object.fromEntries(Object.entries(values).map(([key, value]) => [key, value.trim()]))
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ values: cleaned, savedAt: new Date().toISOString(), status: 'draft' }))
      setSaved(true)
      showToast('success', 'Suspension request saved on this browser. It has not been submitted for approval.')
    } catch {
      if (mounted.current) showToast('error', 'Unable to save your request. Enable browser storage and try again.')
    } finally {
      busy.current = false
      if (mounted.current) setSaving(false)
    }
  }

  return createPortal(
    <dialog ref={dialogRef} onCancel={onClose} aria-labelledby="suspension-title" className="suspension-dialog fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-3xl overflow-hidden rounded-2xl bg-white p-0 text-ink shadow-2xl backdrop:bg-[#071D36]/60">
      <FlashToast toast={toast} onDismiss={dismissToast} />
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 p-5">
        <div><h2 id="suspension-title" className="text-lg font-bold">Suspension of Registration</h2><p className="mt-1 text-xs text-slate-500">Complete your registration, sponsor and employer details.</p></div>
        <button type="button" onClick={onClose} aria-label="Close suspension form" className="rounded-lg p-2 hover:bg-slate-100"><X className="h-5 w-5" /></button>
      </div>
      <form ref={formRef} onSubmit={(event) => { event.preventDefault(); void save() }} className="flex min-h-0 flex-1 flex-col" onInvalid={() => showToast('error', 'Check the highlighted field and complete all required information.')}>
        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-5">
          {/* <p className="rounded-xl bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">Demo preview: requests are saved on this browser only. Your programme status will change only after submission and approval through the college.</p> */}
          <p className="text-xs text-slate-500">Fields marked * are required. Enter your full name with your surname first.</p>
          <fieldset disabled={saving}>
            <legend className="mb-4 text-sm font-bold text-navy">Registration details</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label htmlFor="suspension-session" className="text-xs font-semibold">Session <span className="text-red-600">*</span></label>
                <select id="suspension-session" required value={values.session ?? ''} onChange={(event) => change('session', event.target.value)} className={inputClass}><option value="">Select Session</option>{SESSIONS.map((session) => <option key={session}>{session}</option>)}</select>
              </div>
              {field('matric', 'Matric No')}
              {field('fullName', 'Full Name (Surname First)')}
              {field('faculty', 'Faculty')}
              {field('department', 'Department')}
              {field('degree', 'Degree in View')}
              {field('modeOfStudy', 'Mode of Study')}
              {field('firstRegistration', 'Session/Date of First Registration', { placeholder: 'e.g. 2016/17' })}
              {field('semesters', 'Total No of Semesters Already Completed', { type: 'number' })}
              <div><label htmlFor="suspension-period" className="text-xs font-semibold">Suspension Period <span className="text-red-600">*</span></label>
                <select id="suspension-period" required value={values.period ?? ''} onChange={(event) => change('period', event.target.value)} className={inputClass}><option value="">Select suspension period</option><option value="1">1 Semester</option><option value="2">2 Semesters</option></select>
              </div>
              {field('address', 'Permanent Address', { multiline: true })}
              {field('reason', 'Reason(s) for Suspension', { multiline: true })}
              {field('resume', 'When do you hope to resume your studies?', { placeholder: 'e.g. 2026/27' })}
            </div>
          </fieldset>
          <fieldset disabled={saving} className="border-t border-slate-200 pt-4">
            <legend className="px-1 text-sm font-bold text-navy">Sponsor’s Details</legend>
            <p className="mb-4 text-xs text-slate-500">Complete where applicable.</p>
            <div className="grid gap-4 sm:grid-cols-2">{field('sponsor', 'Sponsor', { required: false })}{field('sponsorPhone', 'Sponsor’s Telephone Number', { type: 'tel', required: false })}{field('sponsorEmail', 'Sponsor’s Email', { type: 'email', required: false })}{field('sponsorAddress', 'Sponsor’s Address', { multiline: true, required: false })}</div>
          </fieldset>
          <fieldset disabled={saving} className="border-t border-slate-200 pt-4">
            <legend className="px-1 text-sm font-bold text-navy">Employer’s Details</legend>
            <p className="mb-4 text-xs text-slate-500">Complete if you are employed.</p>
            <div className="grid gap-4 sm:grid-cols-2">{field('employer', 'Employer Name', { required: false })}{field('employerPhone', 'Employer Phone', { type: 'tel', required: false })}{field('employerEmail', 'Employer Email', { type: 'email', required: false })}{field('employerAddress', 'Employer Address', { multiline: true, required: false })}</div>
          </fieldset>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-3 border-t border-slate-200 p-4">
          {saved && <span className="mr-auto inline-flex items-center gap-2 text-xs text-emerald-700"><CircleCheck className="h-4 w-4" />Saved on this browser</span>}
          <button type="button" onClick={onClose} className={secondaryClass}>Close</button>
          <button type="submit" disabled={saving || saved} aria-busy={saving} className={primaryClass}>{saving && <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />}{saving ? 'Saving…' : saved ? 'Request Saved' : 'Submit Suspension Request'}</button>
        </div>
      </form>
    </dialog>, document.body,
  )
}
