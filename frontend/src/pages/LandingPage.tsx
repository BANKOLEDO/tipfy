import Nav from '~/components/landing/Nav'
import HeroSection from '~/components/landing/HeroSection'
import TickerSection from '~/components/landing/TickerSection'
import FlowSection from '~/components/landing/FlowSection'
import EditorialSection from '~/components/landing/EditorialSection'
import StatsSection from '~/components/landing/StatsSection'
import UseCasesSection from '~/components/landing/UseCasesSection'
import FeaturesSection from '~/components/landing/FeaturesSection'
import TestimonialsSection from '~/components/landing/TestimonialsSection'
import CtaSection from '~/components/landing/CtaSection'
import Footer from '~/components/landing/Footer'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg text-text">
      <Nav />
      <HeroSection />
      <TickerSection />
      <FlowSection />
      <EditorialSection />
      <StatsSection />
      <UseCasesSection />
      <FeaturesSection />
      <TestimonialsSection />
      <CtaSection />
      <Footer />
    </div>
  )
}