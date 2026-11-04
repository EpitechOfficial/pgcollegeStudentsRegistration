import { useEffect, useState } from 'react'
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
  enhancedStyle: boolean
  onStyleChange: (enhanced: boolean) => void
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
  enhancedStyle,
  onStyleChange,
  infoLocked,
  onToggleInfoLock,
  onOpenRegisterCourses,
}: ServiceSectionsProps) {
  function toggleStyle() {
    onStyleChange(!enhancedStyle)
  }
  // All sections start collapsed — the user opens each one manually
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    for (const section of sections) {
      initial[section.id] = false
    }
    return initial
  })

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

  const columnCount = useColumnCount()
  const columns = buildColumns(sections, columnCount)

  return (
    <section aria-label="Portal services" className="space-y-4">
      {/* Section Title */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
        <h2 className="text-lg font-bold tracking-tight text-[#212529] sm:text-xl">
          Portal Services
        </h2>
        <p className="text-xs text-[#495057]">
          Tap a section to view the available services. Locked services are not accessible at this time.
        </p>
        </div>
        <div className="flex shrink-0 items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs">
          <span className={enhancedStyle ? 'text-slate-500' : 'font-semibold text-navy'}>Default</span>
          <button type="button" role="switch" aria-checked={enhancedStyle} aria-label="Use enhanced service styling" onClick={toggleStyle} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy ${enhancedStyle ? 'bg-navy' : 'bg-slate-300'}`}>
            <span aria-hidden="true" className={`h-4 w-4 rounded-full bg-white shadow-sm transition-transform motion-reduce:transition-none ${enhancedStyle ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
          <span className={enhancedStyle ? 'font-semibold text-navy' : 'text-slate-500'}>Enhanced</span>
        </div>
      </div>

      {/* Services Cards — one stack per column, so an open dropdown never leaves a gap next to it */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        {columns.map((column, columnIndex) => (
          <div key={columnIndex} className="flex min-w-0 flex-1 flex-col gap-4">
            {column.map((section) => {
              const SectionIcon = SECTION_ICONS[section.id] ?? FileText
              const isExpanded = expandedSections[section.id] ?? true
              const isProcess = enhancedStyle && section.id === 'process'
              const isPayments = enhancedStyle && section.id === 'payments'
              const isCourseForm = enhancedStyle && section.id === 'course-form'
              const isMedicals = enhancedStyle && section.id === 'medicals'
              const isExamination = enhancedStyle && section.id === 'examination'
              const isWallet = enhancedStyle && section.id === 'wallet'
              const isThemed = isProcess || isPayments || isCourseForm || isMedicals || isExamination || isWallet

              return (
                <article
                  id={`section-${section.id}`}
                  key={section.id}
                  className={`group overflow-hidden rounded-2xl border bg-white transition-all ${isProcess
                    ? `hover:border-[#0A2B4F]/40 hover:shadow-lg hover:shadow-[#0A2B4F]/10 ${isExpanded ? 'border-[#0A2B4F]/30 shadow-lg shadow-[#0A2B4F]/10' : 'border-[#0A2B4F]/15 shadow-sm'}`
                    : isPayments ? `hover:border-emerald-700/40 hover:shadow-lg hover:shadow-emerald-900/10 ${isExpanded ? 'border-emerald-700/30 shadow-lg shadow-emerald-900/10' : 'border-emerald-700/15 shadow-sm'}` : isCourseForm ? `hover:border-indigo-700/40 hover:shadow-lg hover:shadow-indigo-900/10 ${isExpanded ? 'border-indigo-700/30 shadow-lg shadow-indigo-900/10' : 'border-indigo-700/15 shadow-sm'}` : isMedicals ? `hover:border-cyan-700/40 hover:shadow-lg hover:shadow-cyan-900/10 ${isExpanded ? 'border-cyan-700/30 shadow-lg shadow-cyan-900/10' : 'border-cyan-700/15 shadow-sm'}` : isExamination ? `hover:border-amber-700/40 hover:shadow-lg hover:shadow-amber-900/10 ${isExpanded ? 'border-amber-700/30 shadow-lg shadow-amber-900/10' : 'border-amber-700/15 shadow-sm'}` : isWallet ? `hover:border-rose-700/40 hover:shadow-lg hover:shadow-rose-900/10 ${isExpanded ? 'border-rose-700/30 shadow-lg shadow-rose-900/10' : 'border-rose-700/15 shadow-sm'}` : `hover:border-[#ffbb00]/70 hover:shadow-md ${isExpanded ? 'border-[#ffbb00]/70 shadow-md' : 'border-[#E5E7EB] shadow-sm'}`}`}
                >
                  {/* Card Header with Auto-Dropdown toggle */}
                  <button
                    type="button"
                    onClick={() => toggleSection(section.id)}
                    aria-expanded={isExpanded}
                    aria-controls={`content-${section.id}`}
                    className={`flex w-full items-center justify-between gap-3 p-4 text-left transition-colors ${isProcess ? 'bg-gradient-to-br from-[#0A2B4F] to-[#16466E] text-white hover:brightness-110 focus-visible:outline-gold' : isPayments ? 'bg-gradient-to-br from-emerald-900 to-teal-700 text-white hover:brightness-110 focus-visible:outline-emerald-700' : isCourseForm ? 'bg-gradient-to-br from-indigo-900 to-violet-700 text-white hover:brightness-110 focus-visible:outline-indigo-700' : isMedicals ? 'bg-gradient-to-br from-cyan-900 to-cyan-700 text-white hover:brightness-110 focus-visible:outline-cyan-700' : isExamination ? 'bg-gradient-to-br from-amber-900 to-amber-700 text-white hover:brightness-110 focus-visible:outline-amber-700' : isWallet ? 'bg-gradient-to-br from-rose-900 to-rose-700 text-white hover:brightness-110 focus-visible:outline-rose-700' : `hover:bg-slate-50/70 ${isExpanded ? 'bg-slate-50/70' : ''}`}`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${isProcess ? 'bg-[#FFBB00]/15 text-[#FFBB00] ring-1 ring-[#FFBB00]/25' : isPayments ? 'bg-emerald-300/15 text-emerald-200 ring-1 ring-emerald-200/25' : isCourseForm ? 'bg-indigo-300/15 text-indigo-200 ring-1 ring-indigo-200/25' : isMedicals ? 'bg-cyan-300/15 text-cyan-200 ring-1 ring-cyan-200/25' : isExamination ? 'bg-amber-300/15 text-amber-200 ring-1 ring-amber-200/25' : isWallet ? 'bg-rose-300/15 text-rose-200 ring-1 ring-rose-200/25' : `group-hover:bg-[#0A2B4F] group-hover:text-white ${isExpanded ? 'bg-[#0A2B4F] text-white' : 'bg-[#0A2B4F]/5 text-[#0A2B4F]'}`}`}
                        aria-hidden="true"
                      >
                        <SectionIcon className="h-5 w-5" />
                      </span>
                      <div>
                        <h3 className={`text-sm font-bold ${isThemed ? 'text-white' : 'text-[#212529]'}`}>
                          {section.title}
                        </h3>
                        <p className={`text-2xs ${isThemed ? 'text-slate-200' : 'text-[#495057]'}`}>{section.note}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-2xs font-semibold ${isProcess ? 'bg-white/10 text-[#FFBB00] ring-1 ring-white/10' : isPayments ? 'bg-white/10 text-emerald-100 ring-1 ring-white/10' : isCourseForm ? 'bg-white/10 text-indigo-100 ring-1 ring-white/10' : isMedicals ? 'bg-white/10 text-cyan-100 ring-1 ring-white/10' : isExamination ? 'bg-white/10 text-amber-100 ring-1 ring-white/10' : isWallet ? 'bg-white/10 text-rose-100 ring-1 ring-white/10' : 'bg-slate-100 text-[#495057]'}`}>
                        {section.services.length}
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 transition-transform duration-200 ${isThemed ? 'text-white/80' : 'text-[#495057]'} ${isExpanded ? 'rotate-180' : ''}`}
                        aria-hidden="true"
                      />
                    </div>
                  </button>

                  {/* Collapsible Dropdown Content */}
                  {isExpanded && (
                    <div
                      id={`content-${section.id}`}
                      className={`border-t p-2 ${isProcess ? 'border-[#FFBB00]/30 bg-gradient-to-b from-[#F3F7FB] to-white' : isPayments ? 'border-emerald-200/60 bg-gradient-to-b from-emerald-50/70 to-white' : isCourseForm ? 'border-indigo-200/60 bg-gradient-to-b from-indigo-50/70 to-white' : isMedicals ? 'border-cyan-200/60 bg-gradient-to-b from-cyan-50/70 to-white' : isExamination ? 'border-amber-200/60 bg-gradient-to-b from-amber-50/70 to-white' : isWallet ? 'border-rose-200/60 bg-gradient-to-b from-rose-50/70 to-white' : 'border-[#E5E7EB]/70 bg-white'}`}
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
                            const content = <><span className="flex items-center gap-2.5"><ServiceIcon className={`h-4 w-4 shrink-0 ${isExamination ? 'box-content rounded-lg bg-amber-700/[0.07] p-2 text-amber-800' : isWallet ? 'box-content rounded-lg bg-rose-700/[0.07] p-2 text-rose-800' : 'text-[#1B3764]'}`} aria-hidden="true" /><span className="font-medium">{service.label}</span></span><ExternalLink className={`h-3.5 w-3.5 shrink-0 ${isExamination ? 'text-amber-700' : isWallet ? 'text-rose-700' : 'text-slate-400'}`} aria-hidden="true" /></>
                            const className = `flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-xs text-[#212529] transition-colors ${isExamination ? 'border border-transparent hover:border-amber-700/10 hover:bg-white hover:text-amber-900 hover:shadow-sm focus-visible:outline-amber-700' : isWallet ? 'border border-transparent hover:border-rose-700/10 hover:bg-white hover:text-rose-900 hover:shadow-sm focus-visible:outline-rose-700' : 'hover:bg-navy/5'}`
                            return <li key={service.id}>{href && !isLocked ? <a href={href} target="_blank" rel="noopener noreferrer" className={className} aria-label={`${service.label} (opens in a new tab)`}>{content}</a> : <button type="button" disabled title={isLocked ? 'Service is locked' : 'Link is not configured yet'} className={`${className} cursor-not-allowed opacity-60`}>{content}</button>}</li>
                          }

                          return (
                            <li key={service.id}>
                              <button
                                type="button"
                                onClick={isLockAction ? onToggleInfoLock : isRegisterAction ? onOpenRegisterCourses : service.id === 'generate-invoice' ? () => setSchoolFeesOpen(true) : service.id === 'suspend-programme' ? () => setSuspensionOpen(true) : service.id === 'reactivation-form' ? () => setReactivationOpen(true) : service.id === 'clearance-form' ? () => setClearanceOpen(true) : service.id === 'result-notification' ? () => setResultOpen(true) : service.id === 'schedule-of-fees' ? () => setFeeScheduleOpen(true) : service.id === 'print-course-form' ? () => setCourseFormsOpen(true) : service.id === 'print-receipt' ? () => setReceiptsOpen(true) : service.id === 'history' ? () => setWalletHistoryOpen(true) : service.id === 'make-payment' ? () => setWalletPaymentOpen(true) : service.id === 'deposit' ? () => setDepositOpen(true) : service.id === 'upload-passport' ? () => setPassportOpen(true) : service.id === 'edit-medical' ? () => setMedicalOpen(true) : service.id === 'payment-record' ? () => setPaymentRecordOpen(true) : service.id === 'financial-clearance' ? () => setFinancialClearanceOpen(true) : undefined}
                                disabled={isLocked}
                                aria-disabled={isLocked}
                                aria-pressed={isLockAction ? infoLocked : undefined}
                                className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-xs transition-all ${
                                  isLocked
                                    ? 'cursor-not-allowed opacity-60'
                                    : isProcess ? 'border border-transparent hover:border-[#0A2B4F]/10 hover:bg-white hover:text-[#0A2B4F] hover:shadow-sm focus-visible:outline-navy' : isPayments ? 'border border-transparent hover:border-emerald-700/10 hover:bg-white hover:text-emerald-900 hover:shadow-sm focus-visible:outline-emerald-700' : isCourseForm ? 'border border-transparent hover:border-indigo-700/10 hover:bg-white hover:text-indigo-900 hover:shadow-sm focus-visible:outline-indigo-700' : isMedicals ? 'border border-transparent hover:border-cyan-700/10 hover:bg-white hover:text-cyan-900 hover:shadow-sm focus-visible:outline-cyan-700' : isExamination ? 'border border-transparent hover:border-amber-700/10 hover:bg-white hover:text-amber-900 hover:shadow-sm focus-visible:outline-amber-700' : isWallet ? 'border border-transparent hover:border-rose-700/10 hover:bg-white hover:text-rose-900 hover:shadow-sm focus-visible:outline-rose-700' : 'hover:bg-[#0A2B4F]/5 hover:text-[#0A2B4F]'
                                }`}
                              >
                                <div className="flex items-center gap-2.5">
                                  <ServiceIcon
                                    className={`h-4 w-4 shrink-0 ${
                                      isLocked ? 'text-slate-400' : isProcess ? 'box-content rounded-lg bg-[#0A2B4F]/[0.07] p-2 text-[#0A2B4F]' : isPayments ? 'box-content rounded-lg bg-emerald-700/[0.07] p-2 text-emerald-800' : isCourseForm ? 'box-content rounded-lg bg-indigo-700/[0.07] p-2 text-indigo-800' : isMedicals ? 'box-content rounded-lg bg-cyan-700/[0.07] p-2 text-cyan-800' : isExamination ? 'box-content rounded-lg bg-amber-700/[0.07] p-2 text-amber-800' : isWallet ? 'box-content rounded-lg bg-rose-700/[0.07] p-2 text-rose-800' : 'text-[#1B3764]'
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
                              {/* {service.id === 'reactivation-form' && !isLocked && (
                                <button type="button" onClick={downloadReactivationForm} className="mb-2 ml-9 rounded-lg px-2 py-1 text-2xs font-semibold text-navy underline decoration-navy/30 underline-offset-4 transition-colors hover:bg-navy/5">Download blank form instead</button>
                              )} */}
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
      {passportOpen && <PassportDialog onClose={() => setPassportOpen(false)} />}
      {medicalOpen && <MedicalRecordDialog onClose={() => setMedicalOpen(false)} />}
      {paymentRecordOpen && <ReceiptPaymentsDialog history onClose={() => setPaymentRecordOpen(false)} />}
      {courseFormsOpen && <CourseFormsDialog onClose={() => setCourseFormsOpen(false)} />}
      {receiptsOpen && <ReceiptPaymentsDialog onClose={() => setReceiptsOpen(false)} />}
      {financialClearanceOpen && <FinancialClearanceDialog onClose={() => setFinancialClearanceOpen(false)} onPayOutstanding={() => { setFinancialClearanceOpen(false); setSchoolFeesOpen(true) }} />}

    </section>
  )
}
