import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { LoaderCircle, Pencil, Printer, Save, X } from 'lucide-react'
import { STUDENT, COLLEGE } from '../data/portal'
import { FAMILY_CONDITIONS, IMMUNIZATIONS, MEDICAL_CONDITIONS, buildMedicalDocument, loadMedical, saveMedical, type MedicalValues } from '../data/medical'
import FlashToast from './FlashToast'
import { useFlashToast } from './useFlashToast'

const input = 'mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-navy disabled:bg-slate-50'
const button = 'inline-flex items-center justify-center gap-2 rounded-xl bg-navy px-4 py-2.5 text-xs font-semibold text-white hover:bg-navy-700 disabled:opacity-50'
export default function MedicalRecordDialog({ onClose, locked }: { onClose: () => void; locked: boolean }) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [values, setValues] = useState<MedicalValues>({})
  const [savedValues, setSavedValues] = useState<MedicalValues | null>(null)
  const [editing, setEditing] = useState(false)
  const [ready, setReady] = useState(false)
  const [printing, setPrinting] = useState(false)
  const previewRef = useRef<HTMLIFrameElement>(null)
  const html = useMemo(() => savedValues ? buildMedicalDocument({ ...savedValues, studentName: STUDENT.name, applicationNumber: STUDENT.applicationNumber }) : '', [savedValues])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [saving, setSaving] = useState(false)
  const busy = useRef(false)
  const saveController = useRef<AbortController | null>(null)
  const { toast, showToast, dismissToast } = useFlashToast()
  useEffect(() => {
    const dialog = dialogRef.current!
    const overflow = document.body.style.overflow
    dialog.showModal(); document.body.style.overflow = 'hidden'
    return () => { saveController.current?.abort(); dialog.close(); document.body.style.overflow = overflow }
  }, [])
  useEffect(() => {
    const controller = new AbortController()
    void loadMedical(controller.signal).then((data) => { if (!controller.signal.aborted) { setValues(data); const exists = Object.keys(data).length > 0; setSavedValues(exists ? data : null); setEditing(!exists); setReady(false) } })
      .catch(() => { if (!controller.signal.aborted) { setError(true); showToast('error', 'Unable to load medical record. Please try again.') } })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [attempt, showToast])
  function change(key: string, value: string) { setValues((previous) => ({ ...previous, [key]: value })) }
  function field(key: string, label: string, options: { choices?: readonly string[]; multiline?: boolean; required?: boolean; type?: string } = {}) {
    const props = { id: `medical-${key}`, name: key, value: values[key] ?? '', required: options.required ?? true, className: input, onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => change(key, event.target.value) }
    return <div key={key} className={options.multiline ? 'sm:col-span-2' : ''}><label htmlFor={props.id} className="text-xs font-semibold">{label}{props.required && <span className="ml-1 text-red-600">*</span>}</label>{options.choices ? <select {...props}><option value="">Select an answer</option>{options.choices.map((choice) => <option key={choice}>{choice}</option>)}</select> : options.multiline ? <textarea {...props} rows={3} maxLength={3000} /> : <input {...props} type={options.type || 'text'} maxLength={300} />}</div>
  }
  const yesNo = (key: string, label: string) => field(key, label, { choices: ['Yes', 'No'] })
  const hasCondition = MEDICAL_CONDITIONS.some(([key]) => values[`condition_${key}`] === 'Yes')
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy.current || locked) return
    const form = event.currentTarget
    if ([...form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('[required]')].some((element) => !element.value.trim())) { showToast('error', 'Complete all required fields.'); return }
    busy.current = true; setSaving(true)
    const controller = new AbortController(); saveController.current = controller
    const clean = Object.fromEntries(Object.entries(values).map(([key, value]) => [key, value.trim()]))
    if (clean.hospitalAdmission !== 'Yes') delete clean.admissionDetails
    if (clean.medication !== 'Yes') delete clean.medicationDetails
    if (!hasCondition) delete clean.conditionDetails
    if (clean.drugReaction !== 'Yes') delete clean.drugDetails
    try {
      const saved = await saveMedical(clean, controller.signal)
      if (!controller.signal.aborted) { setValues(clean); setSavedValues(clean); setEditing(false); setReady(false); showToast('success', saved ? 'Medical record saved.' : 'Draft saved for this visit. Backend is not connected.') }
    } catch { if (!controller.signal.aborted) showToast('error', 'Unable to save medical record. Please try again.') }
    finally { busy.current = false; if (!controller.signal.aborted) setSaving(false) }
  }
  async function print() {
    if (busy.current || !ready) return
    busy.current = true; setPrinting(true)
    try {
      const frame = previewRef.current?.contentWindow
      if (!frame) throw new Error('Preview unavailable')
      frame.focus(); frame.print()
    } catch { showToast('error', 'Unable to print medical record. Please try again.') }
    finally { busy.current = false; setPrinting(false) }
  }
  return createPortal(<dialog ref={dialogRef} onCancel={onClose} aria-labelledby="medical-title" className="suspension-dialog fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-4xl overflow-hidden rounded-2xl bg-white p-0 text-ink shadow-2xl backdrop:bg-[#071D36]/60">
    <FlashToast toast={toast} onDismiss={dismissToast} />
    <div className="flex items-center justify-between border-b p-5"><h2 id="medical-title" className="text-lg font-bold">Medical Record</h2><button type="button" onClick={onClose} aria-label="Close medical record" className="rounded-lg p-2 hover:bg-slate-100"><X className="h-5 w-5" /></button></div>
    {loading ? <p role="status" className="flex flex-1 items-center justify-center gap-2 p-10"><LoaderCircle className="h-5 w-5 animate-spin" />Loading medical record…</p> : error ? <div className="flex-1 p-10 text-center"><p role="alert">Unable to load medical record.</p><button className={`${button} mt-4`} onClick={() => { setError(false); setLoading(true); setAttempt((value) => value + 1) }}>Retry</button></div> : !editing && savedValues ? <><iframe ref={previewRef} title="Saved medical record" srcDoc={html} onLoad={() => setReady(true)} className="min-h-0 w-full flex-1 border-0 bg-slate-50" /><div className="flex shrink-0 justify-end gap-3 border-t p-4"><button type="button" disabled={locked || printing} className={button} onClick={() => { setValues({ ...savedValues }); setEditing(true) }}><Pencil className="h-4 w-4" />Edit Record</button><button type="button" disabled={!ready || printing} aria-busy={printing} className={button} onClick={() => void print()}>{printing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}{printing ? 'Preparing…' : 'Print / Save PDF'}</button></div></> : <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        <div className="mb-5 flex items-center justify-between gap-4 border-b pb-4"><img src={`${import.meta.env.BASE_URL}brand/pgc-logo.png`} alt="Postgraduate College logo" className="h-14 w-14 object-contain" /><div className="text-center text-navy"><p className="text-sm font-bold">UNIVERSITY OF IBADAN</p><p className="text-xs">{COLLEGE.shortName}</p><p className="mt-2 text-xs font-semibold">Health Record Editing Form</p></div><img src={`${import.meta.env.BASE_URL}brand/ui-logo.png`} alt="University of Ibadan logo" className="h-14 w-14 object-contain" /></div>
        <div className="mb-5 grid gap-3 rounded-xl bg-navy/5 p-4 text-xs sm:grid-cols-2"><p>Name: <b>{STUDENT.name}</b></p><p>Application Number: <b>{STUDENT.applicationNumber}</b></p></div>
        {locked && <p className="mb-4 rounded-xl bg-amber-50 p-3 text-xs text-amber-900">Student information is locked. Unlock it to edit this record.</p>}
        {/* {!import.meta.env.VITE_MEDICAL_RECORD_URL && <p className="mb-4 text-xs text-slate-500">Backend is not connected. Drafts remain available during this visit only.</p>} */}
        <fieldset disabled={locked || saving} className="space-y-6 disabled:opacity-60">
          <section><h3 className="mb-4 font-bold text-navy">Contact Person</h3><div className="grid gap-4 sm:grid-cols-2">{field('contactName', 'Name of Contact Person')}{field('contactTelephone', 'Telephone of Contact Person', { type: 'tel' })}{field('contactAddress', 'Address of Contact Person', { multiline: true })}</div></section>
          <section><h3 className="mb-4 font-bold text-navy">Personal Medical History</h3><div className="grid gap-4 sm:grid-cols-2">{field('healthStatus', 'Health Status', { choices: ['Fair', 'Good', 'Poor'] })}{yesNo('hospitalAdmission', 'Have you ever been admitted as an in-patient in hospital?')}{values.hospitalAdmission === 'Yes' && field('admissionDetails', 'Reason for admission, hospital name and date', { multiline: true })}{yesNo('medication', 'Are you on any medication?')}{values.medication === 'Yes' && field('medicationDetails', 'Drugs and dosage', { multiline: true })}</div></section>
          <section><h3 className="mb-2 font-bold text-navy">Medical Conditions</h3><p className="mb-4 text-xs text-slate-500">Do you suffer from, or have you suffered from, any of these conditions?</p><div className="grid gap-4 sm:grid-cols-2">{MEDICAL_CONDITIONS.map(([key, label]) => yesNo(`condition_${key}`, label))}{hasCondition && field('conditionDetails', 'Give details of the conditions above, including dates', { multiline: true })}{field('otherHistory', 'Other relevant medical history', { multiline: true, required: false })}{field('travelHistory', 'Travel history with dates', { multiline: true, required: false })}</div></section>
          <section><h3 className="mb-4 font-bold text-navy">Family Medical History</h3><div className="grid gap-4 sm:grid-cols-2">{yesNo('familyHealthy', 'Is your family a healthy one?')}{FAMILY_CONDITIONS.map(([key, label]) => yesNo(`family_${key}`, `Family history of ${label.toLowerCase()}`))}</div></section>
          <section><h3 className="mb-4 font-bold text-navy">Drug Reactions & Immunizations</h3><div className="grid gap-4 sm:grid-cols-2">{yesNo('drugReaction', 'Do you react to any drugs?')}{values.drugReaction === 'Yes' && field('drugDetails', 'State the drugs and reactions', { multiline: true })}{IMMUNIZATIONS.map(([key, label]) => yesNo(`immunization_${key}`, `Immunized against ${label}`))}</div></section>
        </fieldset>
      </div>
      <div className="flex shrink-0 justify-end gap-3 border-t p-4"><button type="button" disabled={saving} onClick={() => { if (savedValues) { setValues({ ...savedValues }); setEditing(false); setReady(false) } else onClose() }} className="rounded-xl border px-4 py-2.5 text-xs font-semibold">{savedValues ? 'Cancel Editing' : 'Close'}</button><button type="submit" disabled={locked || saving} aria-busy={saving} className={button}>{saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{saving ? 'Saving…' : import.meta.env.VITE_MEDICAL_RECORD_URL ? 'Save Medical Record' : 'Save Draft'}</button></div>
    </form>}
  </dialog>, document.body)
}
