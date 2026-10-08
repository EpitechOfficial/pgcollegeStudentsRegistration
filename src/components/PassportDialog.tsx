import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ImagePlus, LoaderCircle, Upload, User, X } from 'lucide-react'
import { STUDENT } from '../data/portal'
import { loadPassport, uploadPassport } from '../data/passport'
import FlashToast from './FlashToast'
import { useFlashToast } from './useFlashToast'

const primary = 'inline-flex items-center justify-center gap-2 rounded-xl bg-navy px-4 py-2.5 text-xs font-semibold text-white hover:bg-navy-700 disabled:cursor-not-allowed disabled:opacity-50'
export default function PassportDialog({ onClose, locked }: { onClose: () => void; locked: boolean }) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const controllerRef = useRef<AbortController | null>(null)
  const version = useRef(0)
  const busy = useRef(false)
  const [current, setCurrent] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const preview = useMemo(() => file ? URL.createObjectURL(file) : '', [file])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [validating, setValidating] = useState(false)
  const [saving, setSaving] = useState(false)
  const { toast, showToast, dismissToast } = useFlashToast()
  useEffect(() => {
    const dialog = dialogRef.current!
    const overflow = document.body.style.overflow
    dialog.showModal(); document.body.style.overflow = 'hidden'
    return () => { controllerRef.current?.abort(); dialog.close(); document.body.style.overflow = overflow }
  }, [])
  useEffect(() => {
    const controller = new AbortController()
    void loadPassport(controller.signal).then((url) => { if (!controller.signal.aborted) setCurrent(url) })
      .catch(() => { if (!controller.signal.aborted) { setError(true); showToast('error', 'Unable to load your passport. Please try again.') } })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [attempt, showToast])
  useEffect(() => {
    return () => { if (preview) URL.revokeObjectURL(preview) }
  }, [preview])
  async function choose(candidate?: File) {
    if (!candidate || busy.current || locked) return
    const request = ++version.current
    setFile(null)
    if (!['image/jpeg', 'image/png'].includes(candidate.type) || candidate.size > 2 * 1024 * 1024 || candidate.size === 0) {
      showToast('error', 'Choose a JPG or PNG image up to 2 MB.'); return
    }
    setValidating(true)
    const url = URL.createObjectURL(candidate)
    try {
      const image = new Image(); image.src = url
      await image.decode()
      if (request === version.current && dialogRef.current?.open) setFile(candidate)
    } catch { if (request === version.current && dialogRef.current?.open) showToast('error', 'This image could not be opened. Choose another JPG or PNG.') }
    finally { URL.revokeObjectURL(url); if (request === version.current && dialogRef.current?.open) setValidating(false) }
  }
  async function save() {
    if (!file || busy.current || locked || validating) return
    busy.current = true; setSaving(true)
    const controller = new AbortController(); controllerRef.current = controller
    try {
      const url = await uploadPassport(file, controller.signal)
      if (!controller.signal.aborted) { setCurrent(url); setFile(null); showToast('success', import.meta.env.VITE_PASSPORT_URL ? 'Passport uploaded successfully.' : 'Passport draft saved for this visit.') }
    } catch { if (!controller.signal.aborted) showToast('error', 'Unable to upload your passport. Please try again.') }
    finally { busy.current = false; if (!controller.signal.aborted) setSaving(false) }
  }
  return createPortal(<dialog ref={dialogRef} onCancel={onClose} aria-labelledby="passport-title" className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-2xl bg-white p-0 text-ink shadow-2xl backdrop:bg-[#071D36]/60">
    <FlashToast toast={toast} onDismiss={dismissToast} />
    <div className="flex items-center justify-between border-b p-5"><div><h2 id="passport-title" className="text-lg font-bold">Upload Passport</h2><p className="mt-1 text-xs text-slate-500">{STUDENT.name} · {STUDENT.applicationNumber}</p></div><button onClick={onClose} type="button" aria-label="Close passport upload" className="rounded-lg p-2 hover:bg-slate-100"><X className="h-5 w-5" /></button></div>
    <div className="p-5">{loading ? <p role="status" className="flex justify-center gap-2 py-10"><LoaderCircle className="h-5 w-5 animate-spin" />Loading passport…</p> : error ? <div className="text-center"><p role="alert" className="mb-4 text-sm">Unable to load your passport.</p><button className={primary} onClick={() => { setError(false); setLoading(true); setAttempt((value) => value + 1) }}>Retry</button></div> : <>
      <div className="mx-auto flex h-48 w-40 items-center justify-center overflow-hidden rounded-xl border bg-slate-50">{preview || current ? <img src={preview || current!} alt={file ? 'Selected passport preview' : 'Current passport'} className="h-full w-full object-contain" /> : <User className="h-16 w-16 text-slate-300" />}</div>
      <p className="mt-3 text-center text-xs text-slate-500">{file ? file.name : current ? 'Current passport' : 'No passport uploaded'}</p>
      <p className="mt-5 text-xs leading-5 text-slate-600">Choose a recent passport photograph with your face clearly visible against a plain background. JPG or PNG, up to 2 MB.</p>
      {/* {!import.meta.env.VITE_PASSPORT_URL && <p className="mt-3 rounded-xl bg-amber-50 p-3 text-xs text-amber-900">Backend is not connected. Draft photos remain available during this visit only.</p>} */}
      {locked && <p className="mt-3 text-xs text-amber-800">Student information is locked. Unlock it to change your passport.</p>}
      <input ref={inputRef} type="file" accept="image/jpeg,image/png" aria-label="Choose passport photograph" className="sr-only" disabled={locked || saving || validating} onChange={(event) => { void choose(event.target.files?.[0]); event.target.value = '' }} />
      <div className="mt-4 flex justify-center"><button type="button" disabled={locked || saving || validating} className="inline-flex items-center gap-2 rounded-xl border border-navy/20 px-4 py-2.5 text-xs font-semibold text-navy disabled:opacity-50" onClick={() => inputRef.current?.click()}>{validating ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}{validating ? 'Checking image…' : 'Choose Photo'}</button></div>
    </>}</div>
    <div className="flex justify-end gap-3 border-t p-4"><button type="button" onClick={onClose} className="rounded-xl border px-4 py-2.5 text-xs font-semibold">Close</button><button type="button" disabled={loading || error || !file || validating || saving || locked} aria-busy={saving} className={primary} onClick={() => void save()}>{saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}{saving ? 'Uploading…' : import.meta.env.VITE_PASSPORT_URL ? 'Upload Passport' : 'Save Draft'}</button></div>
  </dialog>, document.body)
}
