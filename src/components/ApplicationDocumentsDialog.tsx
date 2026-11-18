import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { FileText, LoaderCircle, Printer, RefreshCw, X } from 'lucide-react'
import { loadApplicationDocuments, type ApplicationDocumentData } from '../data/applicationDocuments'
import AcceptanceFormPreview from './application-documents/AcceptanceFormPreview'
import AdmissionLetterPreview from './application-documents/AdmissionLetterPreview'
import ApplicationFormPreview from './application-documents/ApplicationFormPreview'
import ApplicationStatusPreview from './application-documents/ApplicationStatusPreview'
import EligibilityFormPreview from './application-documents/EligibilityFormPreview'
import PhotoCardPreview from './application-documents/PhotoCardPreview'
import TranscriptLabelPreview from './application-documents/TranscriptLabelPreview'

const documents = [
  { label: 'Application Form', slug: 'applicationForm' },
  { label: 'Eligibility Form', slug: 'eligibilityForm' },
  { label: 'Transcript Label Form', slug: 'transcriptLabel' },
  { label: 'Acceptance Form', slug: 'acceptanceForm' },
  { label: 'Application Status', slug: 'applicationStatus' },
  { label: 'Photo Card', slug: 'photoCard' },
  { label: 'Admission Letter', slug: 'admissionLetter' },
] as const

type DocumentSlug = typeof documents[number]['slug']

const previews: Record<DocumentSlug, (props: { data: ApplicationDocumentData }) => React.ReactNode> = {
  applicationForm: ApplicationFormPreview,
  eligibilityForm: EligibilityFormPreview,
  transcriptLabel: TranscriptLabelPreview,
  acceptanceForm: AcceptanceFormPreview,
  applicationStatus: ApplicationStatusPreview,
  photoCard: PhotoCardPreview,
  admissionLetter: AdmissionLetterPreview,
}

export type ApplicationDocumentSlug = DocumentSlug

export default function ApplicationDocumentsDialog({ onClose, initialDocument }: { onClose: () => void; initialDocument?: DocumentSlug | null }) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const [data, setData] = useState<ApplicationDocumentData | null>(null)
  const [selected, setSelected] = useState<(typeof documents)[number] | null>(
    documents.find((item) => item.slug === initialDocument) ?? null,
  )
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const dialog = dialogRef.current!
    const overflow = document.body.style.overflow
    dialog.showModal()
    document.body.style.overflow = 'hidden'
    return () => { dialog.close(); document.body.style.overflow = overflow }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    setError('')
    void loadApplicationDocuments(controller.signal)
      .then(setData)
      .catch((reason: unknown) => {
        if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : 'Unable to load application documents.')
      })
    return () => controller.abort()
  }, [attempt])

  function printDocument() {
    if (!previewRef.current || !selected) return
    const printWindow = window.open('', '_blank', 'width=1200,height=800')
    if (!printWindow) return
    printWindow.document.write(`<!doctype html><html><head><title>${selected.label}</title></head><body style="margin:0;padding:6px">${previewRef.current.innerHTML}<script>Promise.all(Array.from(document.images).map(i=>i.complete?Promise.resolve():new Promise(r=>{i.onload=r;i.onerror=r}))).then(()=>{window.focus();window.print()})<\/script></body></html>`)
    printWindow.document.close()
  }

  const Preview = selected ? previews[selected.slug] : null
  return createPortal(
    <dialog ref={dialogRef} onCancel={(event) => { event.preventDefault(); onClose() }} className="m-auto h-[min(92vh,900px)] w-[min(1180px,calc(100%-1rem))] max-w-none overflow-hidden rounded-2xl border-0 bg-white p-0 shadow-2xl backdrop:bg-navy/70">
      <div className="flex h-full flex-col">
        <header className="flex shrink-0 items-center justify-between border-b border-slate-200 px-5 py-4">
          <div><h2 className="text-lg font-bold text-navy">{selected?.label ?? 'Application Documents'}</h2><p className="text-xs text-slate-500">Your single access payment covers every document in this section.</p></div>
          <button type="button" onClick={selected ? () => setSelected(null) : onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label={selected ? 'Back to documents' : 'Close'}><X className="h-5 w-5" /></button>
        </header>
        <main className={`min-h-0 flex-1 overflow-auto ${selected ? 'bg-slate-100 p-2' : 'p-5'}`}>
          {!data && !error && <div className="flex h-full items-center justify-center gap-2 text-sm text-slate-600"><LoaderCircle className="h-5 w-5 animate-spin" />Loading application documents…</div>}
          {error && <div className="flex h-full flex-col items-center justify-center gap-3 text-center"><p className="text-sm font-medium text-red-700">{error}</p><button type="button" onClick={() => setAttempt((value) => value + 1)} className="inline-flex items-center gap-2 rounded-xl bg-navy px-4 py-2 text-sm font-semibold text-white"><RefreshCw className="h-4 w-4" />Retry</button></div>}
          {data && !selected && <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{documents.map((item) => <button key={item.slug} type="button" onClick={() => setSelected(item)} className="group flex min-h-28 flex-col items-center justify-center gap-3 rounded-xl border border-navy/15 bg-white p-4 text-center text-sm font-semibold text-navy shadow-sm transition hover:-translate-y-0.5 hover:border-gold hover:shadow-md"><span className="rounded-xl bg-navy/5 p-3 group-hover:bg-gold/15"><FileText className="h-6 w-6" /></span>{item.label}</button>)}</div>}
          {data && selected && Preview && <div ref={previewRef} className="mx-auto min-w-[760px] max-w-[1100px] bg-white"><Preview data={data} /></div>}
        </main>
        <footer className="flex shrink-0 items-center justify-between border-t border-slate-200 bg-white px-5 py-3">
          <button type="button" onClick={selected ? () => setSelected(null) : onClose} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">{selected ? 'Back to Documents' : 'Close'}</button>
          {selected && data && <button type="button" onClick={printDocument} className="inline-flex items-center gap-2 rounded-xl bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-700"><Printer className="h-4 w-4" />Print</button>}
        </footer>
      </div>
    </dialog>, document.body,
  )
}
