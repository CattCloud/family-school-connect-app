
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/auth/LoginPage.jsx'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage.jsx'
import ResetPasswordPage from './pages/auth/ResetPasswordPage.jsx'
import ChangePasswordPage from './pages/auth/ChangePasswordPage.jsx'
import ProtectedRoute from './components/auth/ProtectedRoute.jsx'

function DashboardPage() {
  return (
    <div className="min-h-screen bg-bg-app">
      <header className="sticky top-0 bg-bg-header border-b border-border-primary px-4 py-3">
        <h1 className="text-xl font-semibold text-primary-700">Dashboard</h1>
      </header>
      <main className="p-6">
        <p className="text-text-secondary">Bienvenido al Dashboard (placeholder)</p>
      </main>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/change-password-required" element={<ChangePasswordPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
