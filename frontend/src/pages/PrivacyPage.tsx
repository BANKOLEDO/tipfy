import Nav from '~/components/landing/Nav'
import Footer from '~/components/landing/Footer'

const sections = [
  { title: 'Information We Collect', content: 'We collect information you provide directly: your name, email, phone number, bank account details, and business information when you create an account. We also collect usage data such as tip transactions and device information.' },
  { title: 'How We Use Your Information', content: 'We use your information to process tips and withdrawals, provide customer support, send account updates, improve our services, and comply with legal obligations. We do not sell your personal information to third parties.' },
  { title: 'Information Sharing', content: 'We share information only with payment processors (Monnify) to facilitate transactions, with your consent, as required by law, or to protect the rights and safety of tipfy and its users.' },
  { title: 'Data Security', content: 'We implement bank-grade security measures including 256-bit encryption, secure data storage, and regular security audits. However, no method of transmission over the Internet is 100% secure.' },
  { title: 'Data Retention', content: 'We retain your information for as long as your account is active. If you delete your account, we remove your personal data within 30 days, except where required by law.' },
  { title: 'Your Rights', content: 'You have the right to access, correct, or delete your personal data. You can update most information through your account settings. For other requests, contact us at privacy@tipfy.com.' },
  { title: 'Cookies', content: 'We use essential cookies to maintain your session and preferences. We do not use third-party advertising cookies.' },
  { title: 'Changes to This Policy', content: 'We may update this policy from time to time. We will notify you of significant changes via email or through our platform.' },
  { title: 'Contact', content: 'For questions about this policy, contact us at privacy@tipfy.com.' },
]

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-light text-dark-text pattern-grid">
      <Nav />

      <div className="pt-28 sm:pt-32 pb-16 sm:pb-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <p className="text-accent text-[10px] sm:text-xs font-medium uppercase tracking-widest mb-2">Legal</p>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">Privacy Policy</h1>
          <p className="text-sm text-gray-400 mb-10">Last updated: July 21, 2026</p>

          <p className="text-sm text-gray-500 leading-relaxed mb-8">
            At tipfy, we value your privacy and are committed to protecting your personal information. This policy explains how we collect, use, and safeguard your data.
          </p>

          <div className="space-y-7">
            {sections.map((s) => (
              <div key={s.title}>
                <h2 className="font-bold text-sm sm:text-base mb-1.5">{s.title}</h2>
                <p className="text-sm text-gray-500 leading-relaxed">{s.content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
