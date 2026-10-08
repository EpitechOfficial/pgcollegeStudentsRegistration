import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PortalHeader from '../components/PortalHeader'
import PortalFooter from '../components/PortalFooter'
import WelcomeBanner from '../components/WelcomeBanner'
import FinancialSummaryCards from '../components/FinancialSummaryCards'
import ServiceSections from '../components/ServiceSections'
import SupportChat from '../components/SupportChat'
import { signOut } from '../data/auth'
import { FINANCIALS, SERVICE_SECTIONS } from '../data/portal'
import { infoIsLocked, setInfoLocked as persistInfoLock } from '../data/courseRegistration'

export default function DashboardPage() {
  const navigate = useNavigate()

  // Student info lock — toggled by the Lock Up service in the Course Form section
  const [infoLocked, setInfoLocked] = useState(infoIsLocked)
  const toggleInfoLock = useCallback(() => setInfoLocked((prev) => { persistInfoLock(!prev); return !prev }), [])

  const handleLogout = useCallback(() => {
    signOut()
    navigate('/', { replace: true })
  }, [navigate])

  const handleOpenRegisterCourses = useCallback(() => {
    navigate('/dashboard/register-courses')
  }, [navigate])

  return (
    <div className="flex min-h-screen flex-col bg-[#F5F7F9]">
      {/* Top Header - No Sidebar */}
        <PortalHeader onLogout={handleLogout} />

      {/* Main Content Area */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="space-y-6">
          {/* 1. Clean, minimalist student banner */}
          <WelcomeBanner />

          {/* 2. Simplified, elegant financial summary */}
          <FinancialSummaryCards data={FINANCIALS} />

          {/* 3. Modern Service Sections with Cards & Auto Dropdowns */}
          <ServiceSections
            sections={SERVICE_SECTIONS}
            infoLocked={infoLocked}
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
