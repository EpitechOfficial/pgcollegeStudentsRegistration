import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowLeft, LoaderCircle, Printer, X } from 'lucide-react'
import { buildCourseForm, loadCourseForms, type CourseFormRecord } from '../data/courseForms'
import FlashToast from './FlashToast'
import { useFlashToast } from './useFlashToast'

const button = 'inline-flex items-center justify-center gap-2 rounded-xl bg-navy px-4 py-2.5 text-xs font-semibold text-white hover:bg-navy-700 disabled:opacity-50'
const secondary = 'inline-flex items-center justify-center gap-2 rounded-xl border border-navy/20 bg-navy/5 px-4 py-2.5 text-xs font-semibold text-navy hover:bg-navy/10 disabled:opacity-50'

export default function CourseFormsDialog({ onClose, initialRecord }: { onClose: () => void; initialRecord?: CourseFormRecord }) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const frameRef = useRef<HTMLIFrameElement>(null)
  const [records, setRecords] = useState<CourseFormRecord[]>([])
  const [selected, setSelected] = useState<CourseFormRecord | null>(initialRecord ?? null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [ready, setReady] = useState(false)
  const [printing, setPrinting] = useState(false)
  const busy = useRef(false)
  const { toast, showToast, dismissToast } = useFlashToast()
  const html = useMemo(() => selected ? buildCourseForm(selected) : '', [selected])
  useEffect(() => {
    const dialog = dialogRef.current!
    const overflow = document.body.style.overflow
    dialog.showModal(); document.body.style.overflow = 'hidden'
    return () => { dialog.close(); document.body.style.overflow = overflow }
  }, [])
  useEffect(() => {
    const controller = new AbortController()
    void loadCourseForms(controller.signal).then((data) => { if (!controller.signal.aborted) setRecords([...data].sort((a, b) => Date.parse(b.registeredAt) - Date.parse(a.registeredAt))) })
      .catch(() => { if (!controller.signal.aborted) { setError(true); showToast('error', 'Unable to load course forms. Please try again.') } })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [attempt, showToast])
  function print() {
    if (busy.current || !ready) return
    busy.current = true; setPrinting(true)
    try { const frame = frameRef.current?.contentWindow; if (!frame) throw new Error('Preview unavailable'); frame.focus(); frame.print() }
    catch { showToast('error', 'Unable to print course form.') }
    finally { busy.current = false; setPrinting(false) }
  }
  return createPortal(<dialog ref={dialogRef} onCancel={onClose} aria-labelledby="course-forms-title" className="suspension-dialog fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-6xl overflow-hidden rounded-2xl bg-white p-0 text-ink shadow-2xl backdrop:bg-[#071D36]/60">
    <FlashToast toast={toast} onDismiss={dismissToast} />
    <div className="flex items-center justify-between border-b p-5"><h2 id="course-forms-title" className="text-lg font-bold">Print Course Form</h2><button type="button" aria-label="Close course forms" onClick={onClose} className="rounded-lg p-2 hover:bg-slate-100"><X className="h-5 w-5" /></button></div>
    {selected ? <iframe ref={frameRef} title="Course form preview" srcDoc={html} onLoad={() => setReady(true)} className="min-h-0 w-full flex-1 border-0 bg-slate-50" /> : <div className="min-h-0 flex-1 overflow-y-auto p-5">{loading ? <p role="status" className="flex justify-center gap-2 py-12"><LoaderCircle className="h-5 w-5 animate-spin" />Loading course forms…</p> : error ? <div className="text-center"><p role="alert" className="mb-4">Unable to load course forms.</p><button type="button" className={button} onClick={() => { setLoading(true); setError(false); setAttempt((value) => value + 1) }}>Retry</button></div> : <>
      {/* {!import.meta.env.VITE_COURSE_FORMS_URL && <p className="mb-4 rounded-xl bg-amber-50 p-3 text-xs text-amber-900">Backend is not connected. Confirmed selections from this visit are available as previews.</p>} */}
      {records.length ? <div className="overflow-x-auto rounded-xl border"><table className="w-full min-w-[600px] text-left text-xs"><thead className="bg-navy text-white"><tr>{['AppNo', 'Session', 'Date', 'Print'].map((label) => <th scope="col" key={label} className="px-4 py-3">{label}</th>)}</tr></thead><tbody className="divide-y">{records.map((record) => <tr key={record.id} className="hover:bg-slate-50"><td className="px-4 py-4">{record.applicationNumber}</td><td className="px-4 py-4">{record.session}</td><td className="px-4 py-4">{new Date(record.registeredAt).toLocaleDateString('en-NG', { timeZone: 'Africa/Lagos', dateStyle: 'medium' })}</td><td className="px-4 py-4"><button type="button" className={`${secondary} whitespace-nowrap`} onClick={() => { setReady(false); setSelected(record) }}><Printer className="h-4 w-4" />Print Course Form</button></td></tr>)}</tbody></table></div> : <p className="rounded-xl border border-dashed p-10 text-center text-sm text-slate-500">No course forms found. Confirm your course selection in Register Courses first.</p>}
    </>}</div>}
    <div className="flex justify-end gap-3 border-t p-4">{selected ? <><button type="button" className={`${button} mr-auto`} onClick={() => { setSelected(null); setReady(false) }}><ArrowLeft className="h-4 w-4" />Back to Forms</button><button type="button" className={button} disabled={!ready || printing} aria-busy={printing} onClick={print}>{printing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}Print / Save PDF</button></> : <button type="button" className={button} onClick={onClose}>Close</button>}</div>
  </dialog>, document.body)
}
