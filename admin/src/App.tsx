import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '~/lib/store'
import ToastContainer from '~/components/ToastContainer'

const AdminLayout = lazy(() => import('~/layouts/AdminLayout'))
const LoginPage = lazy(() => import('~/pages/LoginPage'))
const DashboardPage = lazy(() => import('~/pages/DashboardPage'))
const UsersPage = lazy(() => import('~/pages/UsersPage'))
const TipsPage = lazy(() => import('~/pages/TipsPage'))
const WithdrawalsPage = lazy(() => import('~/pages/WithdrawalsPage'))
const FraudPage = lazy(() => import('~/pages/FraudPage'))
const AuditPage = lazy(() => import('~/pages/AuditPage'))
const SystemPage = lazy(() => import('~/pages/SystemPage'))

function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg">
      <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center animate-pulse">
        <span className="text-white font-bold text-xs">TF</span>
      </div>
    </div>
  )
}

export default function App() {
  const hydrateAuth = useAuthStore((s) => s.hydrateAuth)

  useEffect(() => {
    hydrateAuth()
  }, [hydrateAuth])

  return (
    <BrowserRouter>
      <ToastContainer />
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/" element={<Navigate to="/admin/login" replace />} />
          <Route path="/admin/login" element={<LoginPage />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="tips" element={<TipsPage />} />
            <Route path="withdrawals" element={<WithdrawalsPage />} />
            <Route path="fraud" element={<FraudPage />} />
            <Route path="audit" element={<AuditPage />} />
            <Route path="system" element={<SystemPage />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
