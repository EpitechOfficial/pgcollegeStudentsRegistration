import { useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import RegisterCoursesPage from './pages/RegisterCoursesPage'
import { restoreSession } from './data/auth'

function RequireAuth({ children }: { children: React.ReactNode }) {
  // localStorage is read once at mount (client-only app) to decide the redirect.
  const [authed] = useState(() => restoreSession() !== null)

  return authed ? <>{children}</> : <Navigate to="/" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
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
