import { useCallback, useEffect, useRef, useState } from 'react'
import Swal from 'sweetalert2'
import { useNavigate } from 'react-router-dom'
import PortalHeader from '../components/PortalHeader'
import PortalFooter from '../components/PortalFooter'
import WelcomeBanner from '../components/WelcomeBanner'
import FinancialSummaryCards from '../components/FinancialSummaryCards'
import ServiceSections from '../components/ServiceSections'
import SupportChat from '../components/SupportChat'
import NavigationToast from '../components/NavigationToast'
import { useLogout } from '../components/useLogout'
import { FINANCIALS, SERVICE_SECTIONS } from '../data/portal'
import { loadDashboardFinancials } from '../data/dashboardFinancials'
import type { FinancialSummary } from '../types'
import { authenticatedUser } from '../data/auth'
import { isDemoSession } from '../data/auth'
import { isPhdDegree } from '../data/degree'
import { confirmCourseRegistration, infoIsLocked, loadCourseLock } from '../data/courseRegistration'
import { TriangleAlert } from 'lucide-react'

export default function DashboardPage() {
  const navigate = useNavigate()
  const user = authenticatedUser()
  const programme = user?.programme
  const paymentLapsed = user?.lapse_status?.payment_lapse === true
  const sessionLapsed = user?.lapse_status?.session_lapse === true
  const showExamination = isPhdDegree(programme?.degree)
  const sections = SERVICE_SECTIONS.filter((section) => {
    if (paymentLapsed) return section.id === 'payments'
    if (sessionLapsed) return section.id === 'payments' || section.id === 'process'
    return section.id !== 'examination' || showExamination
  })
  const [financials, setFinancials] = useState<FinancialSummary | null>(isDemoSession() ? FINANCIALS : null)
  const [financialsLoading, setFinancialsLoading] = useState(true)
  const [enhancedStyle, setEnhancedStyle] = useState(() => {
    try { return localStorage.getItem('pgc.services.style') !== 'default' }
    catch { return true }
  })
  const handleStyleChange = useCallback((enhanced: boolean) => {
    setEnhancedStyle(enhanced)
    try { localStorage.setItem('pgc.services.style', enhanced ? 'enhanced' : 'default') }
    catch { /* The switch still works when browser storage is unavailable. */ }
  }, [])
  useEffect(() => {
    const controller = new AbortController()
    void loadDashboardFinancials(controller.signal).then((summary) => { if (!controller.signal.aborted) setFinancials(summary) }).catch(() => { if (!controller.signal.aborted) setFinancials(null) }).finally(() => { if (!controller.signal.aborted) setFinancialsLoading(false) })
    return () => controller.abort()
  }, [])

  // Lock the saved registration only after the student confirms.
  const [infoLocked, setInfoLocked] = useState(infoIsLocked)
  const lockBusy = useRef(false)
  const lockController = useRef<AbortController | null>(null)
  const lockCompleted = useRef(false)
  useEffect(() => () => {
    lockController.current?.abort()
    if (lockBusy.current) Swal.close()
  }, [])
  const toggleInfoLock = useCallback(async () => {
    if (lockBusy.current) return
    lockBusy.current = true
    const controller = new AbortController()
    lockController.current = controller
    try {
      if (infoLocked) {
        await Swal.fire({ icon: 'info', title: 'Registration is locked', text: 'Contact the Management to request changes to your courses.', confirmButtonColor: '#0A2B4F' })
        return
      }
      const result = await Swal.fire({
        icon: 'warning',
        title: 'Lock your course registration?',
        text: 'Please review your saved courses before proceeding. Locking prevents further changes; only the Management can unlock your registration.',
        showDenyButton: true,
        showCancelButton: true,
        confirmButtonText: 'Proceed to Lock',
        denyButtonText: 'Review Courses',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#0A2B4F',
        denyButtonColor: '#52677d',
        focusCancel: true,
        showLoaderOnConfirm: true,
        allowOutsideClick: () => !Swal.isLoading(),
        allowEscapeKey: () => !Swal.isLoading(),
        preConfirm: async () => {
          try {
            await confirmCourseRegistration(controller.signal)
            if (controller.signal.aborted) return false
            lockCompleted.current = true
            setInfoLocked(true)
            return true
          } catch (error) {
            if (!controller.signal.aborted) {
              // Encode backend messages as text before passing them to SweetAlert.
              const message = document.createElement('span')
              message.textContent = error instanceof Error ? error.message : 'Unable to lock registration. Please try again.'
              Swal.showValidationMessage(message.innerHTML)
            }
            return false
          }
        },
      })
      if (controller.signal.aborted) return
      if (result.isDenied) navigate('/dashboard/register-courses')
      if (result.isConfirmed) await Swal.fire({ icon: 'success', title: 'Registration locked', text: 'Your course registration has been confirmed and locked.', confirmButtonColor: '#0A2B4F' })
    } finally {
      lockBusy.current = false
      lockController.current = null
    }
  }, [infoLocked, navigate])
  useEffect(() => {
    if (paymentLapsed) return
    const controller = new AbortController()
    void loadCourseLock(controller.signal).then((locked) => {
      if (!controller.signal.aborted && !lockCompleted.current) setInfoLocked(locked)
    }).catch(() => { /* Registration page provides status errors and retry. */ })
    return () => controller.abort()
  }, [paymentLapsed])

  const { logout: handleLogout, loggingOut } = useLogout()

  const handleOpenRegisterCourses = useCallback(() => {
    navigate('/dashboard/register-courses')
  }, [navigate])

  return (
    <div className="flex min-h-screen flex-col bg-[#F5F7F9]">
      <NavigationToast />
      {/* Top Header - No Sidebar */}
        <PortalHeader onLogout={() => void handleLogout()} loggingOut={loggingOut} />

      {/* Main Content Area */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="space-y-6">
          {/* 1. Clean, minimalist student banner */}
          <WelcomeBanner />

          {paymentLapsed && (
            <div role="alert" className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-950 shadow-sm">
              <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden="true" />
              <div>
                <p className="text-sm font-bold">Programme access restricted</p>
                <p className="mt-1 text-xs leading-relaxed">Your programme has lapsed because school fees were not paid for two consecutive sessions. Only payment services are available.</p>
              </div>
            </div>
          )}

          {!paymentLapsed && sessionLapsed && (
            <div role="status" className="flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-blue-950 shadow-sm">
              <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" aria-hidden="true" />
              <div>
                <p className="text-sm font-bold">Programme duration exceeded</p>
                <p className="mt-1 text-xs leading-relaxed">You have exceeded the standard duration for your programme. Use Reactivate Lapsed Registration in the Process section to continue.</p>
              </div>
            </div>
          )}

          {/* 2. Simplified, elegant financial summary */}
          <FinancialSummaryCards
            data={financials}
            loading={financialsLoading}
            enhancedStyle={enhancedStyle}
          />

          {/* 3. Modern Service Sections with Cards & Auto Dropdowns */}
          <ServiceSections
            sections={sections}
            sessionLapsed={sessionLapsed}
            infoLocked={infoLocked}
            enhancedStyle={enhancedStyle}
            onStyleChange={handleStyleChange}
            onToggleInfoLock={toggleInfoLock}
            onOpenRegisterCourses={handleOpenRegisterCourses}
          />
        </div>
      </main>

      {/* Clean Footer */}
      <PortalFooter />

      {/* Floating support chat — Information Unit */}
      <SupportChat />
    </div>
  )
}
