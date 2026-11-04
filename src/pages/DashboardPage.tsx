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

export default function DashboardPage() {
  const navigate = useNavigate()
  const programme = authenticatedUser()?.programme
  const showExamination = isPhdDegree(programme?.degree)
  const sections = SERVICE_SECTIONS.filter((section) => section.id !== 'examination' || showExamination)
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
    const controller = new AbortController()
    void loadCourseLock(controller.signal).then((locked) => {
      if (!controller.signal.aborted && !lockCompleted.current) setInfoLocked(locked)
    }).catch(() => { /* Registration page provides status errors and retry. */ })
    return () => controller.abort()
  }, [])

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

          {/* 2. Simplified, elegant financial summary */}
          <FinancialSummaryCards
            data={financials}
            loading={financialsLoading}
            enhancedStyle={enhancedStyle}
          />

          {/* 3. Modern Service Sections with Cards & Auto Dropdowns */}
          <ServiceSections
            sections={sections}
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
