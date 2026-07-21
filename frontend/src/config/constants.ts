export const SITE = {
  name: 'tipfy',
  title: 'tipfy - Digital Tipping Platform',
  description: 'Turn appreciation into action. Send and receive tips effortlessly.',
}

export const PRESET_AMOUNTS = [100, 200, 500, 1000, 2000, 5000]

export const BUSINESS_CATEGORIES = [
  'Content Creator', 'Restaurant', 'Hotel', 'Salon', 'Barbershop',
  'Logistics', 'Freelancer', 'Musician', 'Artist', 'Photographer', 'NGO', 'Other',
] as const

export const BANKS = [
  { code: '044', name: 'Access Bank' },
  { code: '033', name: 'United Bank for Africa' },
  { code: '057', name: 'Zenith Bank' },
  { code: '011', name: 'First Bank of Nigeria' },
  { code: '070', name: 'Guaranty Trust Bank' },
  { code: '214', name: 'First City Monument Bank' },
  { code: '032', name: 'Union Bank' },
  { code: '035', name: 'Wema Bank' },
  { code: '069', name: 'Heritage Bank' },
  { code: '076', name: 'Polaris Bank' },
  { code: '090', name: 'Keystone Bank' },
  { code: '101', name: 'Providus Bank' },
  { code: '221', name: 'Stanbic IBTC Bank' },
  { code: '068', name: 'Standard Chartered Bank' },
] as const
