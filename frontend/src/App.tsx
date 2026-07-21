import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '~/lib/store'
import ScrollToTop from '~/components/ScrollToTop'

const DashboardLayout = lazy(() => import('~/layouts/DashboardLayout'))
const LandingPage = lazy(() => import('~/pages/LandingPage'))
const LoginPage = lazy(() => import('~/pages/LoginPage'))
const RegisterPage = lazy(() => import('~/pages/RegisterPage'))
const TipPage = lazy(() => import('~/pages/TipPage'))
const PricingPage = lazy(() => import('~/pages/PricingPage'))
const ForTeamsPage = lazy(() => import('~/pages/ForTeamsPage'))
const ForBusinessesPage = lazy(() => import('~/pages/ForBusinessesPage'))
const AboutPage = lazy(() => import('~/pages/AboutPage'))
const BlogPage = lazy(() => import('~/pages/BlogPage'))
const BlogPostPage = lazy(() => import('~/pages/BlogPostPage'))
const ContactPage = lazy(() => import('~/pages/ContactPage'))
const PrivacyPage = lazy(() => import('~/pages/PrivacyPage'))
const TermsPage = lazy(() => import('~/pages/TermsPage'))
const RefundPage = lazy(() => import('~/pages/RefundPage'))
const PaymentCompletePage = lazy(() => import('~/pages/PaymentCompletePage'))
const Dashboard = lazy(() => import('~/pages/dashboard/Dashboard'))
const TipsPage = lazy(() => import('~/pages/dashboard/TipsPage'))
const WithdrawPage = lazy(() => import('~/pages/dashboard/WithdrawPage'))
const TeamPage = lazy(() => import('~/pages/dashboard/TeamPage'))
const SettingsPage = lazy(() => import('~/pages/dashboard/SettingsPage'))

function Loading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-bg gap-3">
      <div className="h-12 w-12 rounded-xl bg-accent flex items-center justify-center shadow-glow">
        <svg className="h-6 w-6 text-white animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      </div>
      <p className="text-sm text-text-muted tracking-wide">tipfy</p>
    </div>
  )
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/for-teams" element={<ForTeamsPage />} />
          <Route path="/for-businesses" element={<ForBusinessesPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:slug" element={<BlogPostPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/refund" element={<RefundPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/tip" element={<TipPage />} />
          <Route path="/tip/:username" element={<TipPage />} />
          <Route path="/tip/payment-complete" element={<PaymentCompletePage />} />
          <Route path="/:username" element={<TipPage />} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="tips" element={<TipsPage />} />
            <Route path="withdraw" element={<WithdrawPage />} />
            <Route path="team" element={<TeamPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
