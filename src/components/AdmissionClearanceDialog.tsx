import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Download, LoaderCircle, Printer, X } from 'lucide-react'
import { buildAdmissionClearanceDocument, loadAdmissionClearance, type AdmissionClearanceResult } from '../data/admissionClearance'
import FlashToast from './FlashToast'
import { useFlashToast } from './useFlashToast'

const primary = 'inline-flex items-center justify-center gap-2 rounded-xl bg-navy px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy-700 disabled:cursor-not-allowed disabled:opacity-50'
const secondary = 'inline-flex items-center justify-center gap-2 rounded-xl border border-navy/20 bg-navy/5 px-4 py-2.5 text-sm font-semibold text-navy hover:bg-navy/10 disabled:opacity-50'

export default function AdmissionClearanceDialog({ onClose }: { onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const previewRef = useRef<HTMLIFrameElement>(null)
  const mounted = useRef(false)
  const busy = useRef(false)
  const [result, setResult] = useState<AdmissionClearanceResult | null>(null)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [ready, setReady] = useState(false)
  const [action, setAction] = useState<'download' | 'print' | null>(null)
  const { toast, showToast, dismissToast } = useFlashToast()
  const html = useMemo(() => result ? buildAdmissionClearanceDocument(result) : '', [result])

  useEffect(() => {
    mounted.current = true
    const dialog = dialogRef.current!
    const overflow = document.body.style.overflow
    dialog.showModal()
    document.body.style.overflow = 'hidden'
    return () => { mounted.current = false; dialog.close(); document.body.style.overflow = overflow }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    void loadAdmissionClearance(controller.signal).then((data) => {
      if (!controller.signal.aborted) setResult(data)
    }).catch(() => {
      if (!controller.signal.aborted) {
        const message = 'Unable to load admission records. Please try again.'
        setError(message); showToast('error', message)
      }
    }).finally(() => { if (!controller.signal.aborted) setFetching(false) })
    return () => controller.abort()
  }, [attempt, showToast])

  async function run(next: 'download' | 'print') {
    if (busy.current || !result) return
    busy.current = true; setAction(next)
    try {
      await new Promise((resolve) => setTimeout(resolve, 40))
      if (!mounted.current) return
      if (next === 'download') {
        const url = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }))
        const link = document.createElement('a')
        link.href = url; link.download = 'admission-clearance-form.html'; link.click()
        setTimeout(() => URL.revokeObjectURL(url), 1000)
        showToast('success', 'Admission clearance form download started.')
      } else {
        const frame = previewRef.current?.contentWindow
        if (!frame) throw new Error('Preview unavailable')
        frame.focus(); frame.print()
      }
    } catch { if (mounted.current) showToast('error', 'Unable to prepare the document. Please try again.') }
    finally { busy.current = false; if (mounted.current) setAction(null) }
  }

  return createPortal(<dialog ref={dialogRef} onCancel={onClose} aria-labelledby="clearance-title" className="suspension-dialog fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-6xl overflow-hidden rounded-2xl bg-white p-0 text-ink shadow-2xl backdrop:bg-[#071D36]/60">
    <FlashToast toast={toast} onDismiss={dismissToast} />
    <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 p-5"><div><h2 id="clearance-title" className="text-lg font-bold">Admission Clearance Form</h2><p className="mt-1 text-xs text-slate-500">Read-only admission records. No manual filling is required.</p></div><button type="button" onClick={onClose} aria-label="Close admission clearance form" className="rounded-lg p-2 hover:bg-slate-100"><X className="h-5 w-5" /></button></div>
    {fetching ? <div role="status" className="flex min-h-0 flex-1 items-center justify-center gap-3 p-5 text-sm text-navy"><LoaderCircle aria-hidden="true" className="h-5 w-5 animate-spin" />Loading admission records…</div> : error ? <div className="flex flex-1 flex-col items-center justify-center gap-4 p-5"><p role="alert" className="text-sm text-red-700">{error}</p><button type="button" className={primary} onClick={() => { setFetching(true); setError(''); setReady(false); setAttempt((value) => value + 1) }}>Retry</button></div> : <iframe ref={previewRef} onLoad={() => setReady(true)} title="Admission clearance form preview" srcDoc={html} className="min-h-0 w-full flex-1 border-0 bg-slate-50" />}
    <div className="flex shrink-0 flex-wrap items-center justify-end gap-3 border-t border-slate-200 p-4">
      {/* {result?.source === 'demo' && <p className="mr-auto text-xs text-slate-500">Demo preview — backend records are not connected.</p>} */}
      <button type="button" disabled={fetching || !!error || !!action || !result} aria-busy={action === 'download'} className={secondary} onClick={() => void run('download')}>{action === 'download' ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}{action === 'download' ? 'Preparing…' : 'Download Form'}</button>
      <button type="button" disabled={fetching || !!error || !!action || !ready} aria-busy={action === 'print'} className={primary} onClick={() => void run('print')}>{action === 'print' ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}{action === 'print' ? 'Preparing…' : 'Print / Save PDF'}</button>
    </div>
  </dialog>, document.body)
}
