import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Download, LoaderCircle, Printer, X } from 'lucide-react'
import { STUDENT } from '../data/portal'
import { buildReactivationDocument, REACTIVATION_FIELDS, REACTIVATION_FORM_URL, type ReactivationValues } from '../data/reactivation'
import FlashToast from './FlashToast'
import { useFlashToast } from './useFlashToast'

const KEY = `pgc.reactivation-draft.${STUDENT.applicationNumber}`
const primary = 'inline-flex items-center justify-center gap-2 rounded-xl bg-navy px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-700 disabled:cursor-not-allowed disabled:opacity-50'
const secondary = 'inline-flex items-center justify-center gap-2 rounded-xl border border-navy/20 bg-navy/5 px-4 py-2.5 text-sm font-semibold text-navy hover:bg-navy/10 disabled:opacity-50'
const input = 'mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm'

function initialValues(): ReactivationValues {
  const initial = { kind: 'suspended', matric: STUDENT.matric, fullName: STUDENT.name, faculty: STUDENT.faculty, department: STUDENT.department, degree: STUDENT.degree, modeOfStudy: STUDENT.modeOfStudy }
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? 'null')
    if (saved && typeof saved === 'object' && !Array.isArray(saved) && Object.values(saved).every((value) => typeof value === 'string')) return { ...initial, ...saved }
    const suspension = JSON.parse(localStorage.getItem(`pgc.suspension-draft.${STUDENT.applicationNumber}`) ?? 'null')?.values
    if (suspension) return {
      ...initial, address: suspension.address ?? '', semesters: suspension.semesters ?? '',
      sponsor: [suspension.sponsor, suspension.sponsorAddress].filter(Boolean).join('\n'),
      employer: [suspension.employer, suspension.employerAddress].filter(Boolean).join('\n'),
    }
  } catch { /* Start with student details when no usable draft is available. */ }
  return initial
}

export default function ReactivationDialog({ onClose }: { onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const previewRef = useRef<HTMLIFrameElement>(null)
  const mounted = useRef(false)
  const busy = useRef(false)
  const [values, setValues] = useState<ReactivationValues>(initialValues)
  const [preview, setPreview] = useState(false)
  const [ready, setReady] = useState(false)
  const [loading, setLoading] = useState<'generate' | 'download' | 'print' | null>(null)
  const { toast, showToast, dismissToast } = useFlashToast()
  const html = useMemo(() => buildReactivationDocument(values), [values])

  useEffect(() => {
    mounted.current = true
    const dialog = dialogRef.current!
    const overflow = document.body.style.overflow
    dialog.showModal()
    document.body.style.overflow = 'hidden'
    return () => { mounted.current = false; dialog.close(); document.body.style.overflow = overflow }
  }, [])

  function change(name: string, value: string) { setValues((previous) => ({ ...previous, [name]: value })) }

  async function run(action: NonNullable<typeof loading>, work: () => void) {
    if (busy.current) return
    busy.current = true
    setLoading(action)
    try {
      await new Promise((resolve) => setTimeout(resolve, action === 'generate' ? 400 : 40))
      if (mounted.current) work()
    } catch {
      if (mounted.current) showToast('error', 'Unable to complete this action. Please try again.')
    } finally { busy.current = false; if (mounted.current) setLoading(null) }
  }

  function generate() {
    const required = REACTIVATION_FIELDS.filter((field) => !('optional' in field && field.optional)).map((field) => field.name as string)
    required.push('modeOfStudy', 'ready', ...(values.kind === 'lapsed' ? ['missedSessions'] : ['suspensionDuration', 'finance']))
    if (required.some((name) => !values[name]?.trim())) { showToast('error', 'Complete all required fields. Fields cannot contain only spaces.'); return }
    const session = /^(\d{4})\/(\d{2}|\d{4})$/.exec(values.session.trim())
    if (!session || session[2] !== String(Number(session[1]) + 1).slice(-session[2].length)) { showToast('error', 'Enter a valid session, such as 2026/27.'); return }
    if (values.lastRegistration < values.firstRegistration) { showToast('error', 'Last registration cannot be before first registration.'); return }
    const cleaned = Object.fromEntries(Object.entries(values).map(([name, value]) => [name, value.trim()]))
    let draftSaved = true
    try { localStorage.setItem(KEY, JSON.stringify(cleaned)) } catch { draftSaved = false }
    setValues(cleaned)
    setReady(false)
    setPreview(true)
    showToast(draftSaved ? 'success' : 'error', draftSaved ? 'Your filled reactivation form is ready to download or print.' : 'Your form is ready, but its draft could not be saved in this browser. Download it before closing.')
  }

  function download() {
    const url = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url; link.download = `filled-reactivation-${values.kind}.html`; link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    showToast('success', 'Filled form download started.')
  }

  const select = (name: string, label: string, choices: { value: string; label: string }[]) => <div>
    <label htmlFor={`reactivation-${name}`} className="text-xs font-semibold">{label} <span className="text-red-600">*</span></label>
    <select id={`reactivation-${name}`} required value={values[name] ?? ''} onChange={(event) => change(name, event.target.value)} className={input}><option value="">Select an option</option>{choices.map((choice) => <option key={choice.value} value={choice.value}>{choice.label}</option>)}</select>
  </div>
  const text = (name: string, label: string, multiline = false, optional = false, type = 'text', placeholder?: string) => {
    const props = { id: `reactivation-${name}`, name, required: !optional, value: values[name] ?? '', onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => change(name, event.target.value), className: input, placeholder }
    return <div key={name} className={multiline ? 'sm:col-span-2' : ''}><label htmlFor={props.id} className="text-xs font-semibold">{label}{!optional && <span className="ml-1 text-red-600">*</span>}</label>{multiline ? <textarea {...props} rows={3} maxLength={2000} /> : <input {...props} type={type} min={type === 'number' ? 0 : undefined} step={type === 'number' ? 1 : undefined} />}</div>
  }

  return createPortal(<dialog ref={dialogRef} onCancel={onClose} aria-labelledby="reactivation-title" className="suspension-dialog fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-3xl overflow-hidden rounded-2xl bg-white p-0 text-ink shadow-2xl backdrop:bg-[#071D36]/60">
    <FlashToast toast={toast} onDismiss={dismissToast} />
    <div className="flex shrink-0 items-center justify-between border-b border-slate-200 p-5"><h2 id="reactivation-title" className="text-lg font-bold">{preview ? 'Reactivation Form Preview' : 'Fill Reactivation Form'}</h2><button type="button" onClick={onClose} aria-label="Close reactivation form" className="rounded-lg p-2 hover:bg-slate-100"><X className="h-5 w-5" /></button></div>
    {preview ? <div className="flex min-h-0 flex-1 flex-col"><iframe ref={previewRef} onLoad={() => setReady(true)} title="Filled reactivation form" srcDoc={html} className="min-h-0 w-full flex-1 border-0" /><div className="flex shrink-0 flex-wrap justify-end gap-2 border-t p-4"><button type="button" disabled={!!loading} className={secondary} onClick={() => setPreview(false)}>Edit Details</button><button type="button" disabled={!!loading} className={secondary} onClick={() => void run('download', download)}>{loading === 'download' ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}{loading === 'download' ? 'Preparing…' : 'Download Filled Form'}</button><button type="button" disabled={!!loading || !ready} className={primary} onClick={() => void run('print', () => { const frame = previewRef.current?.contentWindow; if (!frame) throw new Error('Preview unavailable'); frame.focus(); frame.print() })}>{loading === 'print' ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}{loading === 'print' ? 'Preparing…' : 'Print / Save PDF'}</button></div></div> :
    <form onSubmit={(event) => { event.preventDefault(); void run('generate', generate) }} onInvalid={() => showToast('error', 'Check the highlighted field and complete the required details.')} className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5"><p className="rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">Fill the selected form, then download or print it for signatures and college processing. This does not submit a reactivation request. <a href={REACTIVATION_FORM_URL} download="reactivation-form.doc" className="font-semibold text-navy underline">Download original Word form</a></p>
        <fieldset disabled={!!loading} className="grid gap-4 sm:grid-cols-2"><legend className="mb-3 text-sm font-bold text-navy">Student and registration details</legend>
          {select('kind', 'Reactivation Type', [{ value: 'lapsed', label: 'Lapsed Registration' }, { value: 'suspended', label: 'Suspended Registration' }])}
          {REACTIVATION_FIELDS.map((field) => text(field.name, field.label, 'multiline' in field, 'optional' in field, 'type' in field ? field.type : 'text', 'placeholder' in field ? field.placeholder : undefined))}
          {select('modeOfStudy', 'Mode of Study', [{ value: 'Part-time', label: 'Part-time' }, { value: 'Full-time', label: 'Full-time' }])}
          {values.kind === 'lapsed' ? select('missedSessions', 'For how many sessions did you fail to register?', [{ value: '1', label: '1 Session' }, { value: '2', label: '2 Sessions' }]) : text('suspensionDuration', 'For how long did you suspend your registration?', false, false, 'text', 'e.g. 2 semesters')}
          <div className="sm:col-span-2">{select('ready', 'Are you prepared to continue and complete your programme without further interruption?', [{ value: 'Yes', label: 'Yes' }, { value: 'No', label: 'No' }])}</div>
          {values.kind === 'suspended' && text('finance', 'How do you intend to finance the course?', true)}
        </fieldset><p className="text-xs text-slate-500">Fields marked * are required. Sponsor and employer details are optional where applicable. Signatures and college comments remain blank in the generated form.</p>
      </div><div className="flex shrink-0 justify-end gap-3 border-t p-4"><button type="button" onClick={onClose} className={secondary}>Close</button><button type="submit" disabled={!!loading} aria-busy={loading === 'generate'} className={primary}>{loading === 'generate' && <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />}{loading === 'generate' ? 'Generating…' : 'Generate Filled Form'}</button></div>
    </form>}
  </dialog>, document.body)
}
