import { useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import DashboardPage from './pages/DashboardPage'
import RegisterCoursesPage from './pages/RegisterCoursesPage'
import { validateSession } from './data/auth'
import PortalLoading from './components/PortalLoading'
import SharedLoginPage from './pages/SharedLoginPage'
import SharedLoginCallback from './pages/SharedLoginCallback'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'guest'>('loading')
  useEffect(() => {
    let active = true
    void validateSession().then((valid) => {
      if (active) setStatus(valid ? 'authenticated' : 'guest')
    }).catch(() => { if (active) setStatus('guest') })
    return () => { active = false }
  }, [])
  if (status === 'loading') return <PortalLoading />
  return status === 'authenticated' ? <>{children}</> : <Navigate to="/" replace />
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/" element={import.meta.env.VITE_USE_SHARED_LOGIN === 'false' ? <LoginPage /> : <SharedLoginPage />} />
        <Route path="/auth/handoff" element={<SharedLoginCallback />} />
        {(import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEMO_LOGIN === 'true') && <Route path="/demo-login" element={<LoginPage />} />}
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <DashboardPage />
            </RequireAuth>
          }
        />
        <Route
          path="/dashboard/register-courses"
          element={
            <RequireAuth>
              <RegisterCoursesPage />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
