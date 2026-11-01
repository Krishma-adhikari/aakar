// All data here is fictional demo data for the hackathon prototype.

export const KEYWORDS = [
  'Computer Science', 'AI / ML', 'Data Science', 'Software Engineering', 'Medicine', 'Nursing',
  'Civil Engineering', 'Business / MBA', 'Finance', 'Product Design', 'Public Health', 'Agriculture',
  'Renewable Energy', 'Law', 'Research / PhD', 'Scholarships', 'Study in USA', 'Study in UK',
  'Study in Australia', 'Study in Japan', 'Job Hunting', 'Startups',
]

export const SECTORS = ['Agritech', 'Fintech', 'Healthtech', 'Edtech', 'Clean Energy', 'Tourism', 'E-commerce', 'Food & Beverage']
export const STAGES = ['Idea', 'Pre-seed', 'Seed', 'Series A']

export const COLORS = ['#e11d48', '#2152d9', '#0f9f6e', '#e8961e', '#6d4ae6', '#0891b2', '#d9542b', '#334155']

export const startups = [
  {
    id: 's1', name: 'Krishi Sathi', initials: 'KS', color: '#0f9f6e',
    tagline: 'A farmer’s co-pilot: crop advice, weather and fair market prices over SMS and app.',
    sector: 'Agritech', stage: 'Seed', location: 'Chitwan', founded: 2023, team: 14,
    ask: 250000, raised: 140000, equity: 12, valuation: '2.1M',
    founders: [{ name: 'Anisha Thapa', role: 'CEO', bg: 'Ex-ICIMOD agronomist' }, { name: 'Rohan K.C.', role: 'CTO', bg: 'Ex-Fusemachines engineer' }],
    traction: [{ k: 'Farmers', v: '38,000' }, { k: 'MoM growth', v: '18%' }, { k: 'Districts', v: '22' }],
    tags: ['B2C', 'SMS-first', 'Rural'],
    pitch: {
      problem: 'Over 60% of Nepali households farm, yet most smallholders sell at prices set by middlemen and lose up to 30% of yield to preventable pests and weather events.',
      solution: 'Krishi Sathi sends hyperlocal weather alerts, pest diagnosis from a photo, and live mandi prices in Nepali — via SMS for feature phones and an app for smartphones.',
      market: '3.8M farming households in Nepal; expansion to Bihar and Uttar Pradesh (40M+ farmers) in year 3.',
      model: 'Freemium for farmers, paid input-marketplace commissions (8%), and data partnerships with cooperatives and banks.',
    },
    useOfFunds: [{ label: 'Product & AI', pct: 40 }, { label: 'Field agents', pct: 30 }, { label: 'Marketing', pct: 20 }, { label: 'Operations', pct: 10 }],
    views: 1240, interested: 9,
  },
  {
    id: 's2', name: 'PahadPay', initials: 'PP', color: '#2152d9',
    tagline: 'Low-cost remittances from the Gulf, Malaysia and Korea straight to a family wallet.',
    sector: 'Fintech', stage: 'Series A', location: 'Kathmandu', founded: 2021, team: 42,
    ask: 1500000, raised: 900000, equity: 10, valuation: '15M',
    founders: [{ name: 'Bikash Shrestha', role: 'CEO', bg: 'Ex-Standard Chartered' }, { name: 'Sita Gurung', role: 'COO', bg: 'Remittance ops, Doha' }],
    traction: [{ k: 'Monthly volume', v: '$4.2M' }, { k: 'Users', v: '120k' }, { k: 'Fee', v: '1.2%' }],
    tags: ['Remittance', 'Licensed', 'B2C'],
    pitch: {
      problem: 'Remittances are ~25% of Nepal’s GDP, but migrant workers pay 4–7% in fees and families wait days in line at agents.',
      solution: 'A licensed digital remittance rail with partner exchange houses abroad and instant payout to wallets, banks or 3,000 agent points.',
      market: '$11B annual inbound remittance to Nepal.',
      model: 'FX spread + flat fee; cross-selling micro-insurance and savings products.',
    },
    useOfFunds: [{ label: 'Licensing & compliance', pct: 25 }, { label: 'Corridor expansion', pct: 35 }, { label: 'Engineering', pct: 25 }, { label: 'Marketing', pct: 15 }],
    views: 3410, interested: 21,
  },
  {
    id: 's3', name: 'Dhaka Threads', initials: 'DT', color: '#e11d48',
    tagline: 'Handwoven Nepali dhaka textiles, sold direct-to-diaspora worldwide.',
    sector: 'E-commerce', stage: 'Pre-seed', location: 'Palpa', founded: 2024, team: 6,
    ask: 80000, raised: 22000, equity: 15, valuation: '450k',
    founders: [{ name: 'Pratiksha Rana', role: 'Founder', bg: 'Textile designer, NID' }],
    traction: [{ k: 'Weavers', v: '64' }, { k: 'Orders', v: '2,300' }, { k: 'Repeat', v: '41%' }],
    tags: ['D2C', 'Women-led', 'Export'],
    pitch: {
      problem: 'Palpa’s weavers earn under $3/day while diaspora buyers can’t find authentic dhaka outside Nepal.',
      solution: 'A curated D2C brand that pays weavers 3x market rates and ships globally in 7 days.',
      market: '3M+ Nepali diaspora; ethnic-fashion market growing 11% yearly.',
      model: '55% gross margin on D2C sales; wedding and festival collections.',
    },
    useOfFunds: [{ label: 'Inventory', pct: 45 }, { label: 'Logistics', pct: 25 }, { label: 'Brand', pct: 30 }],
    views: 860, interested: 5,
  },
  {
    id: 's4', name: 'Sherpa Grid', initials: 'SG', color: '#e8961e',
    tagline: 'Pay-as-you-go micro-hydro and solar mini-grids for off-grid mountain villages.',
    sector: 'Clean Energy', stage: 'Seed', location: 'Solukhumbu', founded: 2022, team: 19,
    ask: 600000, raised: 310000, equity: 14, valuation: '4M',
    founders: [{ name: 'Tenzing Sherpa', role: 'CEO', bg: 'Hydropower engineer, NTNU' }, { name: 'Maya Lama', role: 'CFO', bg: 'Ex-IFC' }],
    traction: [{ k: 'Villages', v: '31' }, { k: 'Households', v: '4,800' }, { k: 'Uptime', v: '99.1%' }],
    tags: ['Climate', 'Hardware', 'IoT'],
    pitch: {
      problem: 'Thousands of high-altitude households still rely on kerosene and diesel, and national grid extension costs 10x more per household.',
      solution: 'Modular mini-grids with smart meters and mobile payments, maintained by locally trained technicians.',
      market: '~450k off-grid households in Nepal’s hill and mountain districts.',
      model: 'Energy sales via prepaid meters + carbon credits.',
    },
    useOfFunds: [{ label: 'Hardware deployment', pct: 55 }, { label: 'Technician training', pct: 20 }, { label: 'Software', pct: 15 }, { label: 'Ops', pct: 10 }],
    views: 1980, interested: 14,
  },
  {
    id: 's5', name: 'SwasthyaLink', initials: 'SL', color: '#0891b2',
    tagline: 'Telemedicine kiosks connecting rural health posts to specialists in Kathmandu and abroad.',
    sector: 'Healthtech', stage: 'Seed', location: 'Pokhara', founded: 2022, team: 23,
    ask: 400000, raised: 120000, equity: 11, valuation: '3.2M',
    founders: [{ name: 'Dr. Suman Adhikari', role: 'CEO', bg: 'MD, ex-TUTH' }, { name: 'Nima Tamang', role: 'CTO', bg: 'Ex-Leapfrog' }],
    traction: [{ k: 'Health posts', v: '58' }, { k: 'Consults', v: '46k' }, { k: 'NPS', v: '72' }],
    tags: ['B2G', 'Diaspora doctors', 'Rural'],
    pitch: {
      problem: 'A patient in Humla may travel 3 days to see a specialist. Nepal has fewer than 1 doctor per 1,000 people.',
      solution: 'Kiosks with diagnostic devices at health posts, plus a network of Nepali doctors abroad who volunteer consult hours.',
      market: '4,000+ public health posts; municipal health budgets growing yearly.',
      model: 'SaaS + per-consult fees paid by municipalities and insurers.',
    },
    useOfFunds: [{ label: 'Kiosk rollout', pct: 50 }, { label: 'Doctor network', pct: 20 }, { label: 'Engineering', pct: 20 }, { label: 'Ops', pct: 10 }],
    views: 1520, interested: 11,
  },
  {
    id: 's6', name: 'PathShala AI', initials: 'PA', color: '#6d4ae6',
    tagline: 'An AI tutor in Nepali for grades 6–12, aligned to the national curriculum.',
    sector: 'Edtech', stage: 'Pre-seed', location: 'Lalitpur', founded: 2024, team: 8,
    ask: 150000, raised: 40000, equity: 12, valuation: '1.1M',
    founders: [{ name: 'Aayush Poudel', role: 'CEO', bg: 'Ex-Teach For Nepal' }, { name: 'Riya Maharjan', role: 'CTO', bg: 'MS CS, Georgia Tech' }],
    traction: [{ k: 'Students', v: '9,400' }, { k: 'Schools', v: '37' }, { k: 'DAU', v: '3,100' }],
    tags: ['AI', 'K-12', 'Nepali language'],
    pitch: {
      problem: 'Over 50% of SEE students fail math or science; private tuition costs more than many families can pay.',
      solution: 'A WhatsApp and web tutor that explains concepts in Nepali, generates practice and reports to teachers.',
      market: '2.2M secondary students across 30,000 schools.',
      model: 'Free for students; school licenses at NPR 150/student/year.',
    },
    useOfFunds: [{ label: 'AI & content', pct: 50 }, { label: 'School partnerships', pct: 30 }, { label: 'Team', pct: 20 }],
    views: 1105, interested: 8,
  },
  {
    id: 's7', name: 'Yatra Trails', initials: 'YT', color: '#d9542b',
    tagline: 'Book verified homestays and local guides on Nepal’s lesser-known trekking routes.',
    sector: 'Tourism', stage: 'Seed', location: 'Pokhara', founded: 2023, team: 11,
    ask: 200000, raised: 95000, equity: 13, valuation: '1.5M',
    founders: [{ name: 'Kiran Bhandari', role: 'CEO', bg: 'Trek guide turned PM' }],
    traction: [{ k: 'Homestays', v: '410' }, { k: 'Bookings', v: '6,800' }, { k: 'GMV', v: '$520k' }],
    tags: ['Marketplace', 'Community', 'Travel'],
    pitch: {
      problem: '90% of trekkers crowd 3 routes; mountain communities elsewhere miss out on tourism income.',
      solution: 'A marketplace of verified homestays and guides with offline maps and trip packages.',
      market: '1M+ annual international arrivals, plus a growing domestic travel market.',
      model: '12% booking commission; premium listings.',
    },
    useOfFunds: [{ label: 'Supply onboarding', pct: 35 }, { label: 'Marketing', pct: 40 }, { label: 'Product', pct: 25 }],
    views: 940, interested: 6,
  },
  {
    id: 's8', name: 'Himal Brew', initials: 'HB', color: '#334155',
    tagline: 'Specialty single-origin coffee from Gulmi and Nuwakot, roasted for export.',
    sector: 'Food & Beverage', stage: 'Pre-seed', location: 'Gulmi', founded: 2023, team: 9,
    ask: 120000, raised: 30000, equity: 15, valuation: '700k',
    founders: [{ name: 'Sanjay Pandey', role: 'Founder', bg: 'Q-grader, ex-barista in Melbourne' }],
    traction: [{ k: 'Farmers', v: '210' }, { k: 'Export kg', v: '8,500' }, { k: 'Cafes', v: '26' }],
    tags: ['Export', 'Farm-to-cup', 'Sustainable'],
    pitch: {
      problem: 'Nepali coffee scores 84+ but farmers sell green beans at commodity prices with no brand.',
      solution: 'Direct trade with farmers, an in-house roastery, and subscription sales to diaspora and cafes abroad.',
      market: 'Specialty coffee is a $80B global market; strong demand from Japan and Korea.',
      model: 'Wholesale to cafes + D2C subscriptions.',
    },
    useOfFunds: [{ label: 'Roastery equipment', pct: 40 }, { label: 'Farmer training', pct: 25 }, { label: 'Export market', pct: 35 }],
    views: 720, interested: 4,
  },
]

export const investors = [
  { id: 'i1', name: 'Rajesh Karki', initials: 'RK', color: '#2152d9', type: 'Angel investor', firm: 'Independent', location: 'San Francisco, USA', ticket: '$25k – $100k', sectors: ['Fintech', 'Edtech', 'Agritech'], bio: 'Engineering director at a Bay Area SaaS company. Has backed 7 South Asian startups; wants to help Nepali founders reach global markets.', visible: true, deals: 7 },
  { id: 'i2', name: 'Himalayan Diaspora Fund', initials: 'HD', color: '#0f9f6e', type: 'Diaspora fund', firm: 'HDF Partners', location: 'London, UK', ticket: '$100k – $500k', sectors: ['Clean Energy', 'Healthtech', 'Agritech'], bio: 'A pooled fund of 140 Nepali professionals in Europe investing in impact-first companies back home.', visible: true, deals: 12 },
  { id: 'i3', name: 'Dr. Meera Joshi', initials: 'MJ', color: '#6d4ae6', type: 'Angel investor', firm: 'Independent', location: 'Sydney, Australia', ticket: '$10k – $50k', sectors: ['Healthtech', 'Edtech'], bio: 'Consultant cardiologist. Interested in rural health and women-led startups.', visible: true, deals: 3 },
  { id: 'i4', name: 'Everest Ventures', initials: 'EV', color: '#e11d48', type: 'Venture capital', firm: 'Everest Ventures', location: 'Tokyo, Japan', ticket: '$250k – $1.5M', sectors: ['Fintech', 'E-commerce', 'Tourism'], bio: 'Early-stage VC with LPs across Japan and Korea, focused on the Himalayan region.', visible: false, deals: 9 },
]

export const mentors = [
  { id: 'm1', name: 'Er. Sujan Basnet', initials: 'SB', color: '#2152d9', title: 'Senior Software Engineer', company: 'Google', location: 'Seattle, USA', years: 9, fields: ['Computer Science', 'Software Engineering', 'Study in USA', 'Job Hunting'], degree: 'MS CS, Texas A&M', bio: 'Went from Pulchowk to Google. Helps students with US grad applications, DSA prep and landing a first tech job.', rating: 4.9, mentees: 46, hours: 6 },
  { id: 'm2', name: 'Dr. Asmita Koirala', initials: 'AK', color: '#0891b2', title: 'Research Scientist', company: 'University of Oxford', location: 'Oxford, UK', years: 11, fields: ['Public Health', 'Research / PhD', 'Scholarships', 'Study in UK'], degree: 'DPhil, Oxford (Rhodes Scholar)', bio: 'Epidemiologist. Mentors on fully-funded PhDs, Chevening and Commonwealth scholarships.', rating: 5.0, mentees: 31, hours: 4 },
  { id: 'm3', name: 'Prakash Neupane', initials: 'PN', color: '#e8961e', title: 'Data Science Manager', company: 'Atlassian', location: 'Sydney, Australia', years: 8, fields: ['Data Science', 'AI / ML', 'Study in Australia', 'Computer Science'], degree: 'MIT (Master of IT), UNSW', bio: 'Leads an analytics team. Happy to review portfolios and talk about the Australian student visa path.', rating: 4.8, mentees: 28, hours: 5 },
  { id: 'm4', name: 'Nisha Shakya', initials: 'NS', color: '#e11d48', title: 'Product Designer', company: 'Spotify', location: 'Stockholm, Sweden', years: 7, fields: ['Product Design', 'Job Hunting', 'Startups'], degree: 'BFA, KU', bio: 'Self-taught designer who moved from Kathmandu agencies to big tech. Portfolio reviews every week.', rating: 4.9, mentees: 52, hours: 8 },
  { id: 'm5', name: 'CA Deepak Bhattarai', initials: 'DB', color: '#0f9f6e', title: 'VP, Investment Banking', company: 'Barclays', location: 'New York, USA', years: 12, fields: ['Finance', 'Business / MBA', 'Study in USA'], degree: 'MBA, Wharton', bio: 'Guides students on MBA applications, CFA and breaking into finance in the US.', rating: 4.7, mentees: 19, hours: 3 },
  { id: 'm6', name: 'Dr. Rina Tamang', initials: 'RT', color: '#6d4ae6', title: 'Resident Physician', company: 'Johns Hopkins Hospital', location: 'Baltimore, USA', years: 6, fields: ['Medicine', 'Nursing', 'Study in USA', 'Research / PhD'], degree: 'MBBS, BPKIHS', bio: 'Went through USMLE and residency match. Helps medical students plan the US pathway.', rating: 4.9, mentees: 24, hours: 4 },
  { id: 'm7', name: 'Er. Kamal Oli', initials: 'KO', color: '#d9542b', title: 'Structural Engineer', company: 'Arup', location: 'Tokyo, Japan', years: 10, fields: ['Civil Engineering', 'Study in Japan', 'Scholarships'], degree: 'PhD, University of Tokyo (MEXT)', bio: 'MEXT scholar. Mentors on Japanese scholarships and earthquake engineering careers.', rating: 4.8, mentees: 17, hours: 3 },
]

export const students = [
  { id: 'st1', name: 'Aarati Pokharel', initials: 'AP', color: '#e11d48', institution: 'Pulchowk Campus, IOE', level: 'Bachelor (3rd year)', city: 'Lalitpur', interests: ['Computer Science', 'AI / ML', 'Study in USA'], goal: 'MS in Computer Science in the USA with funding.' },
  { id: 'st2', name: 'Bibek Rai', initials: 'BR', color: '#2152d9', institution: 'Kathmandu University', level: 'Bachelor (final year)', city: 'Dhulikhel', interests: ['Data Science', 'Study in Australia', 'Job Hunting'], goal: 'Data analyst role, then Masters in Australia.' },
  { id: 'st3', name: 'Sabina Magar', initials: 'SM', color: '#0f9f6e', institution: 'BPKIHS', level: 'MBBS (4th year)', city: 'Dharan', interests: ['Medicine', 'Research / PhD', 'Study in USA'], goal: 'USMLE and US residency.' },
  { id: 'st4', name: 'Nabin Chaudhary', initials: 'NC', color: '#e8961e', institution: 'St. Xavier’s College', level: '+2 Science', city: 'Kathmandu', interests: ['Computer Science', 'Scholarships', 'Study in Japan'], goal: 'Fully funded undergrad abroad.' },
  { id: 'st5', name: 'Prerana Dahal', initials: 'PD', color: '#6d4ae6', institution: 'Tribhuvan University', level: 'Master (1st year)', city: 'Kirtipur', interests: ['Public Health', 'Scholarships', 'Study in UK'], goal: 'Chevening scholarship for MPH.' },
]

export const organizations = [
  { id: 'o1', name: 'Shree Janajyoti Secondary School', initials: 'JS', color: '#2152d9', type: 'School', district: 'Sindhupalchok' },
  { id: 'o2', name: 'Women for Green Hills', initials: 'WG', color: '#0f9f6e', type: 'NGO', district: 'Kaski' },
  { id: 'o3', name: 'Sahara Youth Club', initials: 'SY', color: '#e8961e', type: 'Community org', district: 'Dang' },
  { id: 'o4', name: 'Bagmati Rural Municipality', initials: 'BM', color: '#0891b2', type: 'Local government', district: 'Lalitpur' },
]

const day = (offset, h = 19, m = 0) => {
  const d = new Date(); d.setDate(d.getDate() + offset); d.setHours(h, m, 0, 0); return d.toISOString()
}

export const sessions = [
  { id: 'se1', hostId: 'm1', title: 'Cracking US Grad School for CS: SOP, GRE and funding', keyword: 'Computer Science', date: day(2, 20, 30), duration: 90, seats: 60, registered: ['st4'], mode: 'Zoom', desc: 'How to shortlist universities, write a strong SOP, find RA/TA funding and avoid common mistakes. Live Q&A at the end.' },
  { id: 'se2', hostId: 'm2', title: 'Fully-funded PhDs and Chevening: an honest guide', keyword: 'Scholarships', date: day(4, 18, 0), duration: 75, seats: 100, registered: ['st5', 'st4'], mode: 'Google Meet', desc: 'What scholarship committees actually look for, how to approach supervisors, and a timeline for 2027 intakes.' },
  { id: 'se3', hostId: 'm3', title: 'Breaking into Data Science from Nepal', keyword: 'Data Science', date: day(6, 19, 0), duration: 60, seats: 80, registered: ['st2'], mode: 'Zoom', desc: 'Portfolio projects that get interviews, remote internships, and the skills hiring managers in Australia test for.' },
  { id: 'se4', hostId: 'm4', title: 'Live portfolio review: design jobs abroad', keyword: 'Product Design', date: day(8, 21, 0), duration: 60, seats: 25, registered: [], mode: 'Zoom', desc: 'Bring your portfolio; get direct feedback in a small group.' },
  { id: 'se5', hostId: 'm6', title: 'USMLE roadmap for Nepali medical students', keyword: 'Medicine', date: day(10, 20, 0), duration: 90, seats: 120, registered: ['st3'], mode: 'Zoom', desc: 'Step 1 to the Match: budget, timeline, observerships, and visa options.' },
  { id: 'se6', hostId: 'm1', title: 'AI / ML careers: what to learn in 2027', keyword: 'AI / ML', date: day(12, 20, 0), duration: 60, seats: 80, registered: [], mode: 'Zoom', desc: 'A practical learning path, research vs industry roles, and building projects that stand out.' },
]

export const mentorshipRequests = [
  { id: 'r1', studentId: 'st4', mentorId: 'm1', message: 'Namaste dai! I’m in +2 and want to study CS abroad with a scholarship. Could you guide me on where to start?', status: 'pending', at: day(-1, 10) },
  { id: 'r2', studentId: 'st2', mentorId: 'm1', message: 'Hi! Could you review my resume for software roles? I have 2 internship projects.', status: 'pending', at: day(-2, 15) },
  { id: 'r3', studentId: 'st1', mentorId: 'm3', message: 'Hello sir, I’d love advice on ML research labs that accept Nepali students.', status: 'accepted', at: day(-5, 9) },
]

export const challenges = [
  { id: 'c1', posterType: 'organization', posterId: 'o1', title: 'Our computer lab of 20 PCs is too slow to use', category: 'Hardware / IT', urgency: 'High', tags: ['Linux', 'Old hardware', 'Education'],
    desc: 'We received 20 donated desktops (2012 era, 2GB RAM, Windows 7). They take 5 minutes to boot and students cannot use a browser. We have unreliable internet (4 Mbps shared). What can we do with no budget?',
    at: day(-3, 11), responses: [{ name: 'Er. Sujan Basnet', initials: 'SB', color: '#2152d9', text: 'Install a lightweight Linux like Linux Mint XFCE or Lubuntu, and set up Kolibri for offline learning content. I can share a step-by-step guide.', at: day(-2, 8) }] },
  { id: 'c2', posterType: 'organization', posterId: 'o2', title: 'Need a simple way to track 600 women’s savings group members', category: 'Software / Data', urgency: 'Medium', tags: ['Database', 'Mobile', 'Offline'],
    desc: 'We manage 24 savings groups using paper registers. Field staff visit monthly. We need something that works offline on cheap Android phones and gives us monthly reports.',
    at: day(-5, 14), responses: [{ name: 'Prakash Neupane', initials: 'PN', color: '#e8961e', text: 'KoboToolbox or ODK Collect would work offline and are free for NGOs. Pair it with a Google Sheet dashboard.', at: day(-4, 10) }, { name: 'Nisha Shakya', initials: 'NS', color: '#e11d48', text: 'Happy to help design the form flow so it is easy for field staff with low digital literacy.', at: day(-4, 18) }] },
  { id: 'c3', posterType: 'startup', posterId: 's7', title: 'Our booking site is slow for users in Europe', category: 'Cloud / DevOps', urgency: 'Medium', tags: ['Performance', 'CDN', 'React'],
    desc: 'Our servers are in Kathmandu. Page load from Germany is ~9s. We’re a small team and not sure whether to move hosting or add a CDN, and what it would cost.',
    at: day(-1, 9), responses: [] },
  { id: 'c4', posterType: 'organization', posterId: 'o3', title: 'Website for a youth club got hacked', category: 'Cybersecurity', urgency: 'High', tags: ['WordPress', 'Security'],
    desc: 'Our WordPress site now redirects to spam pages. A volunteer built it 4 years ago and left. How do we clean it and keep it safe?',
    at: day(-2, 16), responses: [] },
  { id: 'c5', posterType: 'organization', posterId: 'o4', title: 'Digitizing ward-level birth and death records', category: 'Software / Data', urgency: 'Low', tags: ['Govtech', 'Data entry', 'Privacy'],
    desc: 'We have 15 years of handwritten records. Looking for advice on a safe, affordable way to digitize and store them in line with privacy rules.',
    at: day(-7, 12), responses: [{ name: 'Dr. Asmita Koirala', initials: 'AK', color: '#0891b2', text: 'Happy to connect you with a team that did similar vital-registration work in Rwanda. Key first step: a data protection plan.', at: day(-6, 9) }] },
]

// Demo accounts (seed data). Password for all demo accounts: demo123
export const seedUsers = [
  { id: 'u-admin', email: 'admin@aakar.demo', password: 'demo123', role: 'admin', status: 'approved', name: 'Aakar Admin', initials: 'AA', color: '#0d1b45' },
  { id: 'u-inv', email: 'investor@aakar.demo', password: 'demo123', role: 'investor', status: 'approved', refId: 'i1', name: 'Rajesh Karki', initials: 'RK', color: '#2152d9', submittedAt: day(-20), docs: ['Passport.pdf', 'Accreditation_letter.pdf'] },
  { id: 'u-stu', email: 'student@aakar.demo', password: 'demo123', role: 'student', status: 'approved', refId: 'st1', name: 'Aarati Pokharel', initials: 'AP', color: '#e11d48', submittedAt: day(-15), docs: ['Student_ID.jpg', 'Enrollment_letter.pdf'] },
  { id: 'u-sup', email: 'startup@aakar.demo', password: 'demo123', role: 'startup', status: 'approved', refId: 's1', name: 'Anisha Thapa', initials: 'AT', color: '#0f9f6e', submittedAt: day(-30), docs: ['OCR_registration.pdf', 'PAN_certificate.pdf', 'Founder_citizenship.jpg'] },
  { id: 'u-pro', email: 'mentor@aakar.demo', password: 'demo123', role: 'professional', status: 'approved', refId: 'm1', name: 'Er. Sujan Basnet', initials: 'SB', color: '#2152d9', submittedAt: day(-40), docs: ['Passport.pdf', 'Employment_letter.pdf'] },
  { id: 'u-org', email: 'org@aakar.demo', password: 'demo123', role: 'organization', status: 'approved', refId: 'o1', name: 'Shree Janajyoti Secondary School', initials: 'JS', color: '#2152d9', submittedAt: day(-10), docs: ['School_registration.pdf', 'Authorization_letter.pdf'] },
  // Applications waiting for admin review
  { id: 'u-p1', email: 'pending@aakar.demo', password: 'demo123', role: 'investor', status: 'pending', name: 'Suresh Adhikari', initials: 'SA', color: '#6d4ae6', submittedAt: day(-1, 9),
    profile: { 'Investor type': 'Angel investor', Firm: 'Independent', Country: 'Canada', 'Ticket size': '$20k – $75k', Sectors: 'Agritech, Clean Energy', LinkedIn: 'linkedin.com/in/suresh-adhikari' }, docs: ['Passport.pdf', 'Bank_reference.pdf'] },
  { id: 'u-p2', email: 'sanjeev@demo.np', password: 'demo123', role: 'startup', status: 'pending', name: 'Sanjeev Lama', initials: 'SL', color: '#0891b2', submittedAt: day(-1, 14),
    profile: { 'Startup name': 'BhojanBox', Sector: 'Food & Beverage', Stage: 'Pre-seed', Location: 'Kathmandu', 'Funding ask': '$60,000', 'Registration no.': 'OCR-2081-44721' }, docs: ['OCR_registration.pdf', 'PAN_certificate.pdf', 'Founder_citizenship.jpg'] },
  { id: 'u-p3', email: 'kabita@demo.np', password: 'demo123', role: 'student', status: 'pending', name: 'Kabita Shahi', initials: 'KS', color: '#e8961e', submittedAt: day(0, 8),
    profile: { Institution: 'Mid-Western University', Level: 'Bachelor (2nd year)', Interests: 'Civil Engineering, Study in Japan', City: 'Surkhet' }, docs: ['Student_ID.jpg', 'Enrollment_letter.pdf'] },
  { id: 'u-p4', email: 'roshan@demo.com', password: 'demo123', role: 'professional', status: 'pending', name: 'Dr. Roshan Gautam', initials: 'RG', color: '#0f9f6e', submittedAt: day(0, 7),
    profile: { Title: 'Postdoctoral Fellow', Company: 'ETH Zurich', Country: 'Switzerland', Experience: '6 years', Expertise: 'Renewable Energy, Research / PhD, Scholarships' }, docs: ['Passport.pdf', 'Employment_letter.pdf'] },
  { id: 'u-p5', email: 'info@greenvalley.np', password: 'demo123', role: 'organization', status: 'pending', name: 'Green Valley Community School', initials: 'GV', color: '#e11d48', submittedAt: day(-2, 16),
    profile: { 'Organization type': 'School', 'Registration no.': 'DEO-RS-2079-118', District: 'Rasuwa', 'Contact person': 'Hari Prasad Nepal (Principal)' }, docs: ['School_registration.pdf', 'Authorization_letter.pdf'] },
  { id: 'u-p6', email: 'fakeinvestor@demo.com', password: 'demo123', role: 'investor', status: 'rejected', name: 'Quick Returns Ltd', initials: 'QR', color: '#334155', submittedAt: day(-6, 12), rejectReason: 'Could not verify identity documents.',
    profile: { 'Investor type': 'Venture capital', Country: 'Unknown', 'Ticket size': '$1M+' }, docs: ['document.jpg'] },
]

export const seedConversations = [
  { id: 'cv1', ownerId: 'u-inv', peer: { name: 'Bikash Shrestha', initials: 'BS', color: '#2152d9', subtitle: 'CEO, PahadPay', kind: 'startup', refId: 's2' },
    messages: [
      { from: 'me', text: 'Hi Bikash, I saw PahadPay’s pitch. Your take rate is impressive. What does the Korea corridor look like?', at: day(-2, 9) },
      { from: 'peer', text: 'Thanks Rajesh ji! Korea goes live in Q1. We already have the partner bank signed. Happy to share our data room.', at: day(-2, 11) },
      { from: 'me', text: 'Please do. Could we do a call this weekend?', at: day(-1, 8) },
    ] },
  { id: 'cv2', ownerId: 'u-sup', peer: { name: 'Himalayan Diaspora Fund', initials: 'HD', color: '#0f9f6e', subtitle: 'Diaspora fund · London', kind: 'investor', refId: 'i2' },
    messages: [
      { from: 'peer', text: 'Namaste Anisha, our agritech committee loved Krishi Sathi. Are you open to a lead investor for this round?', at: day(-1, 15) },
      { from: 'me', text: 'Namaste! Yes, absolutely. We have $140k committed and are looking for a lead for the remaining $110k.', at: day(-1, 17) },
    ] },
  { id: 'cv3', ownerId: 'u-stu', peer: { name: 'Prakash Neupane', initials: 'PN', color: '#e8961e', subtitle: 'Data Science Manager, Atlassian', kind: 'mentor', refId: 'm3' },
    messages: [
      { from: 'peer', text: 'Hi Aarati, happy to mentor you! Send me 2–3 labs you’re interested in and your current projects.', at: day(-4, 10) },
      { from: 'me', text: 'Thank you so much sir! I’ll send them tonight.', at: day(-4, 12) },
    ] },
  { id: 'cv4', ownerId: 'u-org', peer: { name: 'Er. Sujan Basnet', initials: 'SB', color: '#2152d9', subtitle: 'Re: computer lab', kind: 'professional', refId: 'm1' },
    messages: [
      { from: 'peer', text: 'Namaste! About your computer lab: Lubuntu will make those PCs usable again. I can join a video call with your IT teacher on Saturday.', at: day(-2, 8) },
    ] },
]

export const autoReplies = {
  startup: ['Thank you for reaching out! I’d be happy to share our deck and financials.', 'Great question. Let me put together the numbers and get back to you today.', 'Would a 30-minute call this week work for you?'],
  investor: ['Thanks! Could you share your latest monthly metrics?', 'Interesting. Let’s schedule a call with our team.', 'We’ll review internally and get back to you this week.'],
  mentor: ['Happy to help! Let’s set up a 30-minute call this weekend.', 'Great progress. Send me your draft and I’ll review it.', 'Feel free to message me anytime with questions.'],
  student: ['Thank you so much! That really helps.', 'Okay, I’ll prepare that and send it to you.', 'Would Saturday evening Nepal time work?'],
  professional: ['Happy to help. Can you share more details?', 'Let’s get on a quick call to look at it together.'],
  organization: ['Thank you so much for helping us!', 'Our IT teacher can join a call on Saturday. Would that work?', 'Dhanyabad! We’ll try this and let you know.'],
}
