export interface BlogPost {
  slug: string
  title: string
  excerpt: string
  date: string
  category: string
  readTime: string
  image: string
  author: { name: string; role: string; avatar: string }
  content: string[]
}

export const blogPosts: BlogPost[] = [
  {
    slug: 'why-tipping-is-growing-in-nigeria',
    title: 'Why tipping culture is exploding in Nigeria — and what it means for workers',
    excerpt: 'The shift from cash to digital is fundamentally changing how Nigerians show appreciation for good service. Here\'s what we\'re seeing on the ground.',
    date: 'Jan 15, 2026',
    category: 'Industry',
    readTime: '6 min read',
    image: 'https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=900&q=80&auto=format&fit=crop',
    author: { name: 'Tolu Akindele', role: 'Head of Product', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80&auto=format&fit=crop' },
    content: [
      'Something shifted in Lagos around mid-2024. The "send me account number" messages slowed down. QR codes started appearing in barbershops. A waitress in Victoria Island told us her tips tripled after her restaurant put up a tipfy sticker at the counter.',
      'This isn\'t a Lagos thing alone. In Abuja, hotel staff are sharing their tip links on WhatsApp groups. In Port Harcourt, dispatch riders are printing QR codes on their delivery bags. The digital tipping wave is real, and it\'s accelerating.',
      'Three forces are driving this. First, smartphone penetration in Nigeria crossed 55% in 2025. More people have the tools to tip digitally. Second, the naira\'s volatility made cash feel riskier — holding physical money became less appealing. Third, a generation of Nigerians who grew up with GTBank apps and PalmPay just expects things to work digitally.',
      'What surprised us most is who\'s tipping. It\'s not just the wealthy. Our data shows the average tip on tipfy is ₦1,800 — roughly the price of a decent lunch in Lagos. People tip for good service, not for showing off. The median tipper age is 25-34, which tracks with the demographic that drives most consumer behavior in Nigeria.',
      'For workers, this changes the economics. A hairstylist in Lekki told us she now earns an extra ₦80,000-120,000 per month from tips alone. That\'s not a side hustle — that\'s a salary boost. A bartender in Ikeja uses his tip history to negotiate better shifts with his manager. Data creates leverage.',
      'The businesses that get it are winning too. Restaurants with visible tipping options report higher staff retention and better customer satisfaction scores. It turns out, making it easy for customers to say "thank you" with money creates a positive feedback loop that benefits everyone.',
      'We think this is just the beginning. As more Nigerians get comfortable with digital payments, tipping will become as natural as tapping to pay for fuel. The question isn\'t whether digital tipping will take off — it\'s how fast.',
    ],
  },
  {
    slug: 'how-restaurants-are-boosting-staff-income',
    title: 'How 3 Lagos restaurants increased staff income by 40% with digital tipping',
    excerpt: 'We talked to three restaurant owners in Lagos who implemented tipfy. The results were better than anyone expected.',
    date: 'Jan 8, 2026',
    category: 'Case Study',
    readTime: '5 min read',
    image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=900&q=80&auto=format&fit=crop',
    author: { name: 'Nkechi Obi', role: 'Head of Growth', avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&q=80&auto=format&fit=crop' },
    content: [
      'The stereotype in Nigeria is that tipping is a "oyibo thing." But every restaurant owner we spoke to said the same thing: their customers wanted to tip. They just didn\'t have a clean way to do it.',
      'Mama Ashanti, a Ghanaian restaurant in Lekki, was one of our earliest adopters. Owner Ama Mensah put a tipfy QR code on every table and trained her staff to mention it naturally: "If you enjoyed your meal, you can scan to leave a tip for your server."',
      'Within the first month, the restaurant was processing an average of ₦45,000 in tips per day. That split across an average team of 8 staff members meant roughly ₦17,000 extra per person per month. "My waitresses stopped looking for other jobs," Ama told us.',
      'The second restaurant, a suya spot in Ikeja called Smoke & Spice, took a different approach. Owner Bello Abdullahi put a large tipfy QR code on the counter with the tagline: "Your server worked hard. Show them." He also added a tip option to his delivery packaging.',
      'The results were striking. Smoke & Spice saw an average tip of ₦800 per transaction — lower than the fancy restaurants, but the volume was massive. With 200+ daily customers tipping at a 35% rate, the staff earning pool grew by over ₦160,000 daily.',
      'Perhaps the most interesting case was The Nook, a co-working cafe in Yaba. Founder Chidi Eze created a "tip pool" system where tips were split based on hours worked that week. Using tipfy\'s team split feature, the calculation became automatic.',
      '"I used to spend two hours every Sunday counting cash tips and figuring out splits," Chidi said. "Now it\'s just... done. The staff can see exactly what they earned in real-time. There\'s no drama anymore."',
      'The pattern across all three businesses was clear: when you make tipping easy, transparent, and digital, everyone wins. Customers feel good, staff earn more, and owners spend less time managing cash.',
    ],
  },
  {
    slug: 'complete-guide-to-team-tip-splitting',
    title: 'The complete guide to splitting tips fairly with your team',
    excerpt: 'Setting up tip splits shouldn\'t cause drama. Here\'s every model we\'ve seen work, with real examples from Nigerian businesses.',
    date: 'Dec 20, 2025',
    category: 'Guide',
    readTime: '8 min read',
    image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=900&q=80&auto=format&fit=crop',
    author: { name: 'Tolu Akindele', role: 'Head of Product', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80&auto=format&fit=crop' },
    content: [
      'The number one question we get from businesses isn\'t "how do I accept tips?" — it\'s "how do I split them fairly?" It\'s a real problem. Get it wrong and you lose staff. Get it right and your team becomes unstoppable.',
      'We\'ve analyzed tip splitting patterns across 500+ businesses on tipfy. Here are the models that actually work in practice.',
      'Model 1: The Equal Split. Everyone who worked that shift gets an equal share. This works best for small teams (2-4 people) where roles are similar. A small barbershop in Surulere uses this — four barbers, equal split, zero arguments.',
      'Model 2: The Percentage Split. Different roles get different percentages. A common setup in restaurants: 60% to front-of-house (waiters, hosts), 30% to back-of-house (cooks, prep), 10% to cleaning staff. This rewards customer-facing roles while still acknowledging the team.',
      'Model 3: The Role-Based Split. Each position has a fixed percentage. Your head chef might get 25%, line cooks 15% each, and waiters 10% each. This is more complex but fairer when there\'s a clear hierarchy.',
      'Model 4: The Hybrid. Base equal split plus a performance bonus. Everyone gets 70% of the pool equally, and the remaining 30% is distributed based on hours worked or customer ratings. A spa in Victoria Island uses this model and reports the highest staff satisfaction scores.',
      'Whatever model you choose, three rules always apply: (1) Be transparent — every team member should see the total and their share. (2) Be consistent — change the rules only with team input and advance notice. (3) Be digital — cash splits create disputes; digital splits create trust.',
      'Setting up splits on tipfy takes 30 seconds. Go to your team settings, add members, assign percentages, and you\'re done. Every tip that comes in is automatically divided and credited to each person\'s earnings dashboard.',
    ],
  },
  {
    slug: '5-ways-to-encourage-more-tips',
    title: '5 psychological triggers that make customers tip more',
    excerpt: 'Small changes to how you present your tip option can dramatically increase how much people leave. Here\'s the science.',
    date: 'Dec 12, 2025',
    category: 'Tips',
    readTime: '4 min read',
    image: 'https://images.unsplash.com/photo-1553729459-uj0gfqcewkfd?w=900&q=80&auto=format&fit=crop',
    author: { name: 'Nkechi Obi', role: 'Head of Growth', avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&q=80&auto=format&fit=crop' },
    content: [
      'Tipping isn\'t purely rational. It\'s emotional. The same customer might tip ₦500 one day and ₦5,000 the next — depending on how they feel, what they see, and how the experience is framed.',
      'We dug into the data from millions of tips on our platform and identified five patterns that consistently drive higher tips.',
      'Trigger 1: Suggested amounts. When you show preset amounts (₦500, ₦1,000, ₦2,000), people tend to pick the middle option. The average tip increases by 40% compared to an open field with no suggestions. Anchoring works.',
      'Trigger 2: Personalization. Tips with a name or photo of the server increase average tips by 25%. "Tip Adaeze who served you today" performs dramatically better than "Leave a tip." People tip people, not businesses.',
      'Trigger 3: Social proof. Showing "142 people tipped today" or "Your server has a 4.8 rating" triggers herd behavior. People want to be part of the positive crowd.',
      'Trigger 4: Gratitude messaging. A simple "Thank you for tipping" after the transaction makes people 30% more likely to tip again next time. The positive reinforcement loop is powerful.',
      'Trigger 5: Timing. The highest tips happen within 2 minutes of the service experience. If you\'re in a restaurant, the check presentation moment is golden. For delivery riders, the moment of handoff is when generosity peaks.',
      'None of these require manipulation. They just reduce friction between wanting to tip and actually doing it. The best tips happen when the system makes it easy and the heart wants to say thank you.',
    ],
  },
  {
    slug: 'tipfy-raises-funding',
    title: 'tipfy raises pre-seed to make digital tipping the standard in Nigeria',
    excerpt: 'We\'re excited to announce our funding round as we work to make tipping seamless for millions of Nigerian workers.',
    date: 'Nov 28, 2025',
    category: 'News',
    readTime: '3 min read',
    image: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=900&q=80&auto=format&fit=crop',
    author: { name: 'Tolu Akindele', role: 'CEO & Co-founder', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80&auto=format&fit=crop' },
    content: [
      'When we started tipfy eighteen months ago, people told us Nigerians don\'t tip. "It\'s not our culture," they said. "Cash is king." We disagreed, and today\'s announcement proves we were right.',
      'We\'re thrilled to announce that tipfy has raised a pre-seed round led by [Investor Name], with participation from [Other Investors]. The funding will be used to expand our team, improve our product, and bring digital tipping to every city in Nigeria.',
      'In just 18 months, we\'ve grown from 50 beta users in a single barbershop in Surulere to over 10,000 active users across Lagos, Abuja, Port Harcourt, and Ibadan. We\'ve processed over ₦250 million in tips. And our average user earns 35% more income from tips than they did with cash.',
      'But the numbers don\'t tell the full story. They don\'t capture the hairstylist who told us she can finally save for her own shop. Or the restaurant owner who said staff turnover dropped by half. Or the dispatch rider who prints his QR code on every delivery bag.',
      'This funding lets us build what comes next: deeper integrations with Nigerian banks, a merchant API for large businesses, and tools that help workers understand and grow their tip income over time.',
      'We\'re also hiring. If you believe that every worker deserves a simple way to earn more, come join us. We\'re a small team doing outsized work, and we\'re just getting started.',
    ],
  },
  {
    slug: 'security-at-tipfy',
    title: 'How we protect your money: a deep dive into tipfy\'s security',
    excerpt: 'Your earnings deserve bank-grade protection. Here\'s exactly how we keep your money and data safe.',
    date: 'Nov 15, 2025',
    category: 'Engineering',
    readTime: '7 min read',
    image: 'https://images.unsplash.com/photo-1563986768609-322da13575f2?w=900&q=80&auto=format&fit=crop',
    author: { name: 'Kunle Adewale', role: 'CTO', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80&auto=format&fit=crop' },
    content: [
      'When people ask me what keeps me up at night, the answer is always the same: security. Not because we have problems — we don\'t — but because the stakes are too high to ever be complacent.',
      'tipfy processes millions of naira in tips every month. That money belongs to real people — waiters, barbers, drivers, creators. Our job isn\'t just to move money. It\'s to move it safely, every single time.',
      'Here\'s how we do it. Every transaction on tipfy is encrypted with 256-bit TLS — the same standard used by major banks. Your data is encrypted at rest and in transit. We never store full card numbers or bank account details on our servers.',
      'We partner with Monnify for payment processing, which means your money moves through PCI DSS-compliant infrastructure. We chose Monnify specifically because they\'re the most trusted payment processor in Nigeria, and we never wanted to handle raw payment data ourselves.',
      'On the application side, we run automated security scans on every code deployment. Every API endpoint is rate-limited and authenticated. We use JWT tokens with short expiry times and automatic refresh. Session management is handled server-side with secure httpOnly cookies.',
      'We also built a real-time fraud detection system that flags unusual patterns — like a sudden spike in tips from the same IP address, or withdrawal attempts from new devices. When something looks wrong, we pause the transaction and verify.',
      'Our infrastructure runs on AWS with automated backups, failover, and monitoring. We\'ve never had a data breach, and we intend to keep it that way.',
      'Security isn\'t a feature — it\'s a promise. And we take it as seriously as you take your earnings.',
    ],
  },
]

export function getPostBySlug(slug: string): BlogPost | undefined {
  return blogPosts.find((p) => p.slug === slug)
}
