import { useEffect, useRef, useState } from 'react'
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  CreditCard,
  ExternalLink,
  FileText,
  GraduationCap,
  HeartPulse,
  Lock,
  LockOpen,
  Wallet,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ServiceSection } from '../types'
import SchoolFeesDialog from './SchoolFeesDialog'
import SuspensionDialog from './SuspensionDialog'
import ReactivationDialog from './ReactivationDialog'
import AdmissionClearanceDialog from './AdmissionClearanceDialog'
import NotificationResultDialog from './NotificationResultDialog'
import FeeScheduleDialog from './FeeScheduleDialog'
import ReceiptPaymentsDialog from './ReceiptPaymentsDialog'
import FinancialClearanceDialog from './FinancialClearanceDialog'
import MedicalRecordDialog from './MedicalRecordDialog'
import PassportDialog from './PassportDialog'
import WalletDepositDialog from './WalletDepositDialog'
import WalletPaymentDialog from './WalletPaymentDialog'
import WalletHistoryDialog from './WalletHistoryDialog'
import CourseFormsDialog from './CourseFormsDialog'
import { REACTIVATION_FORM_URL } from '../data/reactivation'

const SECTION_ICONS: Record<string, LucideIcon> = {
  process: FileText,
  payments: CreditCard,
  'course-form': BookOpen,
  medicals: HeartPulse,
  examination: GraduationCap,
  wallet: Wallet,
}

interface ServiceSectionsProps {
  sections: ServiceSection[]
  /** Whether the student's info is currently locked via the Lock Up service */
  infoLocked: boolean
  onToggleInfoLock: () => void
  /** Opens the course registration screen (Register Courses service) */
  onOpenRegisterCourses: () => void
}

/** Column count for the current viewport — mirrors the 1 / 2 / 3 column breakpoints. */
function detectColumns() {
  if (typeof window === 'undefined') return 3
  if (window.matchMedia('(min-width: 1024px)').matches) return 3
  if (window.matchMedia('(min-width: 640px)').matches) return 2
  return 1
}

function useColumnCount() {
  const [count, setCount] = useState(detectColumns)

  useEffect(() => {
    const queryLg = window.matchMedia('(min-width: 1024px)')
    const querySm = window.matchMedia('(min-width: 640px)')
    const sync = () => setCount(detectColumns())

    sync()
    queryLg.addEventListener('change', sync)
    querySm.addEventListener('change', sync)
    return () => {
      queryLg.removeEventListener('change', sync)
      querySm.removeEventListener('change', sync)
    }
  }, [])

  return count
}

/**
 * Assign each section to its own column once (round robin), so every card keeps
 * its place: an expanded section only lengthens its own column instead of leaving
 * empty space beside its neighbours, and opening a dropdown never shuffles the
 * other cards around.
 */
function buildColumns(sections: ServiceSection[], columnCount: number): ServiceSection[][] {
  const columns: ServiceSection[][] = Array.from({ length: columnCount }, () => [])

  sections.forEach((section, index) => {
    columns[index % columnCount].push(section)
  })

  return columns
}

export default function ServiceSections({
  sections,
  infoLocked,
  onToggleInfoLock,
  onOpenRegisterCourses,
}: ServiceSectionsProps) {
  // All sections start collapsed — the user opens each one manually
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    for (const section of sections) {
      initial[section.id] = false
    }
    return initial
  })

  const [feedback, setFeedback] = useState<string | null>(null)
  const [schoolFeesOpen, setSchoolFeesOpen] = useState(false)
  const [suspensionOpen, setSuspensionOpen] = useState(false)
  const [reactivationOpen, setReactivationOpen] = useState(false)
  const [clearanceOpen, setClearanceOpen] = useState(false)
  const [resultOpen, setResultOpen] = useState(false)
  const [feeScheduleOpen, setFeeScheduleOpen] = useState(false)
  const [receiptsOpen, setReceiptsOpen] = useState(false)
  const [courseFormsOpen, setCourseFormsOpen] = useState(false)
  const [paymentRecordOpen, setPaymentRecordOpen] = useState(false)
  const [medicalOpen, setMedicalOpen] = useState(false)
  const [passportOpen, setPassportOpen] = useState(false)
  const [depositOpen, setDepositOpen] = useState(false)
  const [walletPaymentOpen, setWalletPaymentOpen] = useState(false)
  const [walletHistoryOpen, setWalletHistoryOpen] = useState(false)
  const [financialClearanceOpen, setFinancialClearanceOpen] = useState(false)
  const feedbackTimer = useRef<number | null>(null)

  // Clear pending feedback timers on unmount
  useEffect(() => {
    return () => {
      if (feedbackTimer.current !== null) {
        window.clearTimeout(feedbackTimer.current)
      }
    }
  }, [])

  function showFeedback(message: string) {
    setFeedback(message)
    if (feedbackTimer.current !== null) {
      window.clearTimeout(feedbackTimer.current)
    }
    feedbackTimer.current = window.setTimeout(() => setFeedback(null), 3000)
  }

  function toggleSection(id: string) {
    setExpandedSections((prev) => {
      // Accordion behaviour: opening one section automatically closes the previous one
      const isOpen = prev[id]
      const next: Record<string, boolean> = {}
      for (const section of sections) {
        next[section.id] = false
      }
      if (!isOpen) {
        next[id] = true
      }
      return next
    })
  }

  function downloadReactivationForm() {
    const link = document.createElement('a')
    link.href = REACTIVATION_FORM_URL
    link.download = 'reactivation-form.doc'
    link.click()
  }

  const columnCount = useColumnCount()
  const columns = buildColumns(sections, columnCount)

  return (
    <section aria-label="Portal services" className="space-y-4">
      {/* Section Title */}
      <div>
        <h2 className="text-lg font-bold tracking-tight text-[#212529] sm:text-xl">
          Portal Services
        </h2>
        <p className="text-xs text-[#495057]">
          Tap a section to view the available services. Locked services are not accessible at this time.
        </p>
      </div>

      {/* Services Cards — one stack per column, so an open dropdown never leaves a gap next to it */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        {columns.map((column, columnIndex) => (
          <div key={columnIndex} className="flex min-w-0 flex-1 flex-col gap-4">
            {column.map((section) => {
              const SectionIcon = SECTION_ICONS[section.id] ?? FileText
              const isExpanded = expandedSections[section.id] ?? true

              return (
                <article
                  id={`section-${section.id}`}
                  key={section.id}
                  className={`group overflow-hidden rounded-2xl border bg-white transition-all hover:border-[#ffbb00]/70 hover:shadow-md ${
                    isExpanded ? 'border-[#ffbb00]/70 shadow-md' : 'border-[#E5E7EB] shadow-sm'
                  }`}
                >
                  {/* Card Header with Auto-Dropdown toggle */}
                  <button
                    type="button"
                    onClick={() => toggleSection(section.id)}
                    aria-expanded={isExpanded}
                    aria-controls={`content-${section.id}`}
                    className={`flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-slate-50/70 ${
                      isExpanded ? 'bg-slate-50/70' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors group-hover:bg-[#0A2B4F] group-hover:text-white ${
                          isExpanded ? 'bg-[#0A2B4F] text-white' : 'bg-[#0A2B4F]/5 text-[#0A2B4F]'
                        }`}
                        aria-hidden="true"
                      >
                        <SectionIcon className="h-5 w-5" />
                      </span>
                      <div>
                        <h3 className="text-sm font-bold text-[#212529]">
                          {section.title}
                        </h3>
                        <p className="text-2xs text-[#495057]">{section.note}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-2xs font-semibold text-[#495057]">
                        {section.services.length}
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 text-[#495057] transition-transform duration-200 ${
                          isExpanded ? 'rotate-180 text-[#0A2B4F]' : ''
                        }`}
                        aria-hidden="true"
                      />
                    </div>
                  </button>

                  {/* Collapsible Dropdown Content */}
                  {isExpanded && (
                    <div
                      id={`content-${section.id}`}
                      className="border-t border-[#E5E7EB]/70 bg-white p-2"
                    >
                      <ul className="space-y-1">
                        {section.services.map((service) => {
                          const ServiceIcon = service.icon
                          const isLocked = service.locked
                          const isLockAction = service.action === 'lock-info'
                          const isRegisterAction = service.action === 'register-courses'
                          if (service.action === 'external-link') {
                            let href = ''
                            try {
                              const url = new URL(service.externalUrl || '')
                              if (['https:', 'http:'].includes(url.protocol)) href = url.href
                            } catch { /* Destination is not configured yet. */ }
                            const content = <><span className="flex items-center gap-2.5"><ServiceIcon className="h-4 w-4 shrink-0 text-[#1B3764]" aria-hidden="true" /><span className="font-medium">{service.label}</span></span><ExternalLink className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" /></>
                            const className = 'flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-xs text-[#212529] transition-colors'
                            return <li key={service.id}>{href && !isLocked ? <a href={href} target="_blank" rel="noopener noreferrer" className={`${className} hover:bg-navy/5`} aria-label={`${service.label} (opens in a new tab)`}>{content}</a> : <button type="button" disabled title={isLocked ? 'Service is locked' : 'Link is not configured yet'} className={`${className} cursor-not-allowed opacity-60`}>{content}</button>}</li>
                          }

                          // Lock Up binds to the shared student-info lock state
                          const handleLockUpClick = () => {
                            onToggleInfoLock()
                            showFeedback(
                              infoLocked
                                ? 'Student info unlocked — editing re-enabled.'
                                : 'Student info locked. Further edits are blocked.',
                            )
                          }

                          return (
                            <li key={service.id}>
                              <button
                                type="button"
                                onClick={isLockAction ? handleLockUpClick : isRegisterAction ? onOpenRegisterCourses : service.id === 'generate-invoice' ? () => setSchoolFeesOpen(true) : service.id === 'suspend-programme' ? () => setSuspensionOpen(true) : service.id === 'reactivation-form' ? downloadReactivationForm : service.id === 'clearance-form' ? () => setClearanceOpen(true) : service.id === 'result-notification' ? () => setResultOpen(true) : service.id === 'schedule-of-fees' ? () => setFeeScheduleOpen(true) : service.id === 'print-course-form' ? () => setCourseFormsOpen(true) : service.id === 'print-receipt' ? () => setReceiptsOpen(true) : service.id === 'history' ? () => setWalletHistoryOpen(true) : service.id === 'make-payment' ? () => setWalletPaymentOpen(true) : service.id === 'deposit' ? () => setDepositOpen(true) : service.id === 'upload-passport' ? () => setPassportOpen(true) : service.id === 'edit-medical' ? () => setMedicalOpen(true) : service.id === 'payment-record' ? () => setPaymentRecordOpen(true) : service.id === 'financial-clearance' ? () => setFinancialClearanceOpen(true) : undefined}
                                disabled={isLocked}
                                aria-disabled={isLocked}
                                aria-pressed={isLockAction ? infoLocked : undefined}
                                className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-xs transition-all ${
                                  isLocked
                                    ? 'cursor-not-allowed opacity-60'
                                    : 'hover:bg-[#0A2B4F]/5 hover:text-[#0A2B4F]'
                                }`}
                              >
                                <div className="flex items-center gap-2.5">
                                  <ServiceIcon
                                    className={`h-4 w-4 shrink-0 ${
                                      isLocked ? 'text-slate-400' : 'text-[#1B3764]'
                                    }`}
                                    aria-hidden="true"
                                  />
                                  <span
                                    className={`font-medium ${
                                      isLocked ? 'text-slate-500' : 'text-[#212529]'
                                    }`}
                                  >
                                    {service.label}
                                  </span>
                                </div>

                                {isLockAction ? (
                                  <span
                                    className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-2xs font-semibold ${
                                      infoLocked
                                        ? 'bg-[#0A2B4F] text-white'
                                        : 'bg-slate-100 text-slate-500'
                                    }`}
                                  >
                                    {infoLocked ? (
                                      <Lock className="h-3 w-3" aria-hidden="true" />
                                    ) : (
                                      <LockOpen className="h-3 w-3" aria-hidden="true" />
                                    )}
                                    {infoLocked ? 'Locked' : 'Unlocked'}
                                  </span>
                                ) : isLocked ? (
                                  <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-1.5 py-0.5 text-2xs font-medium text-slate-500">
                                    <Lock className="h-3 w-3" aria-hidden="true" />
                                    Locked
                                  </span>
                                ) : (
                                  <ChevronRight
                                    className="h-3.5 w-3.5 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-[#0A2B4F]"
                                    aria-hidden="true"
                                  />
                                )}
                              </button>
                              {service.id === 'reactivation-form' && !isLocked && (
                                <button type="button" onClick={() => setReactivationOpen(true)} className="mb-2 ml-9 rounded-lg px-2 py-1 text-2xs font-semibold text-navy underline decoration-navy/30 underline-offset-4 transition-colors hover:bg-navy/5">Fill form online instead</button>
                              )}
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        ))}
      </div>

      {schoolFeesOpen && <SchoolFeesDialog onClose={() => setSchoolFeesOpen(false)} />}
      {suspensionOpen && <SuspensionDialog onClose={() => setSuspensionOpen(false)} />}
      {reactivationOpen && <ReactivationDialog onClose={() => setReactivationOpen(false)} />}
      {clearanceOpen && <AdmissionClearanceDialog onClose={() => setClearanceOpen(false)} />}
      {resultOpen && <NotificationResultDialog onClose={() => setResultOpen(false)} />}
      {feeScheduleOpen && <FeeScheduleDialog onClose={() => setFeeScheduleOpen(false)} />}
      {walletHistoryOpen && <WalletHistoryDialog onClose={() => setWalletHistoryOpen(false)} />}
      {walletPaymentOpen && <WalletPaymentDialog onClose={() => setWalletPaymentOpen(false)} onDeposit={() => { setWalletPaymentOpen(false); setDepositOpen(true) }} />}
      {depositOpen && <WalletDepositDialog onClose={() => setDepositOpen(false)} />}
      {passportOpen && <PassportDialog locked={infoLocked} onClose={() => setPassportOpen(false)} />}
      {medicalOpen && <MedicalRecordDialog locked={infoLocked} onClose={() => setMedicalOpen(false)} />}
      {paymentRecordOpen && <ReceiptPaymentsDialog history onClose={() => setPaymentRecordOpen(false)} />}
      {courseFormsOpen && <CourseFormsDialog onClose={() => setCourseFormsOpen(false)} />}
      {receiptsOpen && <ReceiptPaymentsDialog onClose={() => setReceiptsOpen(false)} />}
      {financialClearanceOpen && <FinancialClearanceDialog onClose={() => setFinancialClearanceOpen(false)} onPayOutstanding={() => { setFinancialClearanceOpen(false); setSchoolFeesOpen(true) }} />}

      {/* Floating Feedback Notification — only for Lock Up, plain service clicks stay silent */}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4"
      >
        {feedback && (
          <div className="flex items-center gap-2 rounded-xl bg-[#0A2B4F] px-4 py-3 text-xs font-semibold text-white shadow-2xl">
            {infoLocked ? (
              <Lock className="h-4 w-4 text-[#FFBB00]" aria-hidden="true" />
            ) : (
              <LockOpen className="h-4 w-4 text-emerald-400" aria-hidden="true" />
            )}
            <span>{feedback}</span>
          </div>
        )}
      </div>
    </section>
  )
}
