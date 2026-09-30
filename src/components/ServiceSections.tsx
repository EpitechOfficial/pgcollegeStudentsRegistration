import { useEffect, useRef, useState } from 'react'
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  CircleCheckBig,
  CreditCard,
  FileText,
  GraduationCap,
  HeartPulse,
  Lock,
  LockOpen,
  Sparkles,
  Wallet,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ServiceSection } from '../types'

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
}

export default function ServiceSections({
  sections,
  infoLocked,
  onToggleInfoLock,
}: ServiceSectionsProps) {
  // All sections start collapsed — the user opens each one manually
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    for (const section of sections) {
      initial[section.id] = false
    }
    return initial
  })

  const [activeService, setActiveService] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
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

  function openService(label: string) {
    setActiveService(label)
    window.setTimeout(() => setActiveService(null), 2000)
  }

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

      {/* Services Grid of Cards */}
      <div className="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sections.map((section) => {
          const SectionIcon = SECTION_ICONS[section.id] ?? FileText
          const isExpanded = expandedSections[section.id] ?? true

          return (
            <article
              id={`section-${section.id}`}
              key={section.id}
              className="group overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-sm transition-all hover:border-[#1B3764]/30 hover:shadow-md"
            >
              {/* Card Header with Auto-Dropdown toggle */}
              <button
                type="button"
                onClick={() => toggleSection(section.id)}
                aria-expanded={isExpanded}
                aria-controls={`content-${section.id}`}
                className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-slate-50/70"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0A2B4F]/5 text-[#0A2B4F] transition-colors group-hover:bg-[#0A2B4F] group-hover:text-white"
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
                            onClick={isLockAction ? handleLockUpClick : () => openService(service.label)}
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

      {/* Floating Feedback Notification */}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4"
      >
        {activeService && (
          <div className="flex items-center gap-2 rounded-xl bg-[#0A2B4F] px-4 py-3 text-xs font-semibold text-white shadow-2xl animate-in fade-in slide-in-from-bottom-2">
            <Sparkles className="h-4 w-4 text-[#FFBB00]" aria-hidden="true" />
            <CircleCheckBig className="h-4 w-4 text-emerald-400" aria-hidden="true" />
            <span>Opening “{activeService}”…</span>
          </div>
        )}
        {!activeService && feedback && (
          <div className="flex items-center gap-2 rounded-xl bg-[#0A2B4F] px-4 py-3 text-xs font-semibold text-white shadow-2xl animate-in fade-in slide-in-from-bottom-2">
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
