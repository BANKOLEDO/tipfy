import Nav from '~/components/landing/Nav'
import Footer from '~/components/landing/Footer'

const sections = [
  { title: 'Acceptance of Terms', content: 'By using tipfy, you agree to these Terms of Service. If you do not agree, please do not use our platform.' },
  { title: 'Description of Service', content: 'tipfy is a digital tipping platform that allows users to receive tips via a personal link and withdraw funds to their bank accounts. We facilitate payment processing through authorized third-party providers.' },
  { title: 'Eligibility', content: 'You must be at least 18 years old and a resident of Nigeria to use tipfy.' },
  { title: 'Account Registration', content: 'You must provide accurate information when creating your account. You are responsible for maintaining the security of your credentials and must notify us immediately of any unauthorized use.' },
  { title: 'Transactions and Fees', content: 'tipfy charges a 2.5% processing fee on each tip received. Withdrawals to bank accounts are processed within 30 seconds. We may modify fees with 30 days\' notice.' },
  { title: 'Prohibited Activities', content: 'You may not use tipfy for illegal purposes, to solicit tips for illegal goods or services, to impersonate others, or to defraud other users. We reserve the right to suspend violating accounts.' },
  { title: 'Intellectual Property', content: 'All content and intellectual property on tipfy are owned by or licensed to us. You may not copy, modify, or reverse-engineer any part of our platform without written consent.' },
  { title: 'Limitation of Liability', content: 'tipfy is provided "as is" without warranties. We are not liable for indirect, incidental, or consequential damages. Our total liability shall not exceed fees paid in the 12 months preceding the claim.' },
  { title: 'Termination', content: 'We may suspend or terminate your account for violation of these terms. You may delete your account at any time through your settings.' },
  { title: 'Governing Law', content: 'These terms are governed by the laws of the Federal Republic of Nigeria. Disputes shall be resolved in the courts of Lagos, Nigeria.' },
  { title: 'Contact', content: 'For questions about these terms, contact us at legal@tipfy.com.' },
]

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-light text-dark-text pattern-wallet">
      <Nav />

      <div className="pt-28 sm:pt-32 pb-16 sm:pb-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <p className="text-accent text-[10px] sm:text-xs font-medium uppercase tracking-widest mb-2">Legal</p>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">Terms of Service</h1>
          <p className="text-sm text-gray-400 mb-10">Last updated: July 21, 2026</p>

          <p className="text-sm text-gray-500 leading-relaxed mb-8">
            These terms govern your use of tipfy. Please read them carefully before using our services.
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
