// Aakar recommendation engine (no server, no API, no cost).

/* ---------- text understanding ---------- */

const STOP = new Set((
  'a an the and or of to in on for with at by from is are was were be been as it its this that these those ' +
  'i my me we our you your their they he she his her who whom what which how will would can could should ' +
  'about into over under more most also have has had do does did not but if so than then just very want ' +
  'like get got am im ive id etc via per independent'
).split(' '))

// Words that mean (nearly) the same thing in Aakar's world. Add your own freely.
// A label that is spelled exactly like a KEYWORD / SECTOR (e.g. "Computer Science") is merged with the
// exact-match reason, so the user never sees the same thing twice.
const CONCEPTS = [
  { label: 'AI & data', terms: ['ai', 'ml', 'artificial intelligence', 'machine learning', 'deep learning', 'data science', 'data', 'nlp', 'analytics', 'analyst'] },
  { label: 'Computer Science', terms: ['computer science', 'computing', 'cs', 'algorithms', 'dsa', 'data structures', 'tech', 'technology'] },
  { label: 'software', terms: ['software', 'programming', 'coding', 'developer', 'development', 'web', 'frontend', 'backend', 'engineering', 'devops'] },
  { label: 'fintech', terms: ['fintech', 'finance', 'financial', 'banking', 'bank', 'payments', 'payment', 'remittance', 'remittances', 'wallet', 'esewa', 'khalti', 'insurance', 'investment banking', 'cfa'] },
  { label: 'education', terms: ['education', 'edtech', 'e-learning', 'elearning', 'teaching', 'teacher', 'school', 'schools', 'university', 'curriculum', 'tutoring', 'tutor'] },
  { label: 'agriculture', terms: ['agriculture', 'agritech', 'farming', 'farm', 'farmer', 'farmers', 'crops', 'agro', 'coffee'] },
  { label: 'health', terms: ['health', 'healthtech', 'healthcare', 'medical', 'medicine', 'hospital', 'clinic', 'wellness', 'nursing', 'nurse', 'physician', 'doctor', 'doctors', 'mbbs', 'usmle', 'residency', 'telemedicine', 'epidemiology', 'epidemiologist', 'mph', 'public health'] },
  { label: 'e-commerce', terms: ['ecommerce', 'e-commerce', 'retail', 'marketplace', 'shopping', 'online store', 'delivery', 'logistics', 'd2c'] },
  { label: 'study abroad', terms: ['study abroad', 'abroad', 'study in usa', 'study in uk', 'study in australia', 'study in japan', 'scholarship', 'scholarships', 'chevening', 'commonwealth', 'mext', 'masters', 'ms', 'phd', 'graduate school', 'fully funded', 'visa', 'gre', 'ielts', 'toefl', 'admission', 'admissions'] },
  { label: 'research', terms: ['research', 'phd', 'dphil', 'doctoral', 'scientist', 'lab', 'labs', 'laboratory'] },
  { label: 'career', terms: ['career', 'job', 'jobs', 'job hunting', 'interview', 'interviews', 'resume', 'cv', 'internship', 'internships', 'hiring', 'employment', 'portfolio'] },
  { label: 'startups', terms: ['startup', 'startups', 'entrepreneurship', 'entrepreneur', 'founder', 'founders', 'fundraising', 'venture', 'pitch'] },
  { label: 'business', terms: ['business', 'mba', 'management', 'strategy', 'consulting'] },
  { label: 'tourism', terms: ['tourism', 'travel', 'hospitality', 'trekking', 'trek', 'homestay', 'homestays', 'hotel', 'hotels'] },
  { label: 'energy & climate', terms: ['energy', 'clean energy', 'hydropower', 'hydro', 'solar', 'renewable', 'climate', 'sustainability', 'sustainable', 'cleantech', 'environment', 'mini-grid', 'mini-grids'] },
  { label: 'food & beverage', terms: ['food', 'beverage', 'food & beverage', 'cafe', 'cafes', 'restaurant', 'roastery', 'brewing'] },
  { label: 'civil engineering', terms: ['civil engineering', 'civil', 'structural', 'construction', 'earthquake'] },
  { label: 'law & policy', terms: ['law', 'legal', 'policy', 'regulation', 'compliance', 'govtech'] },
  { label: 'design & product', terms: ['design', 'designer', 'ux', 'ui', 'product management', 'product design', 'product', 'prototype'] },
  { label: 'marketing & sales', terms: ['marketing', 'branding', 'brand', 'sales', 'growth', 'seo', 'advertising'] },
  { label: 'security', terms: ['security', 'cybersecurity', 'privacy', 'encryption'] },
]

const escapeRx = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
// Longest terms first so "study in usa" wins over "study" and so on.
const CONCEPT_RX = CONCEPTS.map(({ terms }) => new RegExp(
  `(?<![\\p{L}\\p{N}])(?:${[...terms].sort((a, b) => b.length - a.length).map(escapeRx).join('|')})(?![\\p{L}\\p{N}])`, 'iu'))

const tokenize = (text) => String(text || '').toLowerCase().match(/[\p{L}\p{M}\p{N}]+/gu) || []

// Very light stemmer: learning/learned/learns -> learn, startups -> startup.
function stem(w) {
  if (w.length <= 3 || /^\d+$/.test(w)) return w
  if (w.endsWith('ies') && w.length > 4) return w.slice(0, -3) + 'y'
  if (w.endsWith('ing') && w.length > 5) return w.slice(0, -3)
  if (w.endsWith('ed') && w.length > 4) return w.slice(0, -2)
  if (w.endsWith('s') && !w.endsWith('ss') && w.length > 3) return w.slice(0, -1)
  return w
}

const newBag = () => ({ counts: new Map(), words: new Map() })

function addText(bag, text, weight = 1) {
  const s = String(text || '')
  if (!s.trim()) return
  for (const raw of tokenize(s)) {
    if (STOP.has(raw)) continue
    const t = stem(raw)
    bag.counts.set(t, (bag.counts.get(t) || 0) + weight)
    if (!bag.words.has(t)) bag.words.set(t, raw)
  }
  CONCEPT_RX.forEach((rx, i) => {
    if (!rx.test(s)) return
    const t = 'c#' + i
    bag.counts.set(t, (bag.counts.get(t) || 0) + weight * 2)
    bag.words.set(t, CONCEPTS[i].label)
  })
}

// strong = fields that define what something is about (counted 3x); weak = descriptive text.
function bagOf({ strong = [], weak = [] }) {
  const bag = newBag()
  strong.forEach((x) => addText(bag, x, 3))
  weak.forEach((x) => addText(bag, x, 1))
  return bag
}

// TF-IDF cosine similarity of one query against many candidates.
// Returns [{ sim, shared }] where shared = the terms that contributed most ({ word, concept }).
function similarities(query, bags) {
  const all = [query, ...bags]
  const df = new Map()
  all.forEach((b) => b.counts.forEach((_, t) => df.set(t, (df.get(t) || 0) + 1)))
  const n = all.length

  const vectorize = (b) => {
    const v = new Map()
    let sq = 0
    b.counts.forEach((c, t) => {
      const w = (1 + Math.log(c)) * (Math.log((n + 1) / df.get(t)) + 1)
      v.set(t, w)
      sq += w * w
    })
    return { v, norm: Math.sqrt(sq) || 1 }
  }

  const q = vectorize(query)
  return bags.map((b) => {
    const d = vectorize(b)
    let dot = 0
    const parts = []
    q.v.forEach((w, t) => {
      const o = d.v.get(t)
      if (!o) return
      dot += w * o
      parts.push([t, w * o])
    })
    parts.sort((a, c) => c[1] - a[1])
    const seen = new Set()
    const shared = []
    for (const [t] of parts) {
      const word = query.words.get(t) || b.words.get(t)
      if (!word || seen.has(word)) continue
      seen.add(word)
      shared.push({ word, concept: t.startsWith('c#') })
      if (shared.length === 4) break
    }
    return { sim: dot / (q.norm * d.norm), shared }
  })
}

const lc = (x) => String(x || '').toLowerCase().trim()
const clamp01 = (x) => Math.max(0, Math.min(1, x))

// Exact matches first, then shared concepts (e.g. "AI & data"); raw words only when there is no concept,
// and never a raw word that is already part of an exact reason ("Computer Science" + "science").
function reasonsFrom(exact, shared) {
  const concepts = shared.filter((x) => x.concept).map((x) => x.word)
  const inExact = new Set(exact.flatMap((e) => tokenize(e)).map(stem))
  const words = concepts.length ? [] : shared.map((x) => x.word).filter((w) => !inExact.has(stem(lc(w))))
  const seen = new Set()
  return [...exact, ...concepts, ...words].filter((r) => {
    const k = lc(r)
    if (!k || seen.has(k)) return false
    seen.add(k)
    return true
  }).slice(0, 3)
}

function finish(rows, { limit, minRelevance = 0 } = {}) {
  const out = rows.filter((r) => r.relevance >= minRelevance).sort((a, b) => b.score - a.score)
  return limit ? out.slice(0, limit) : out
}

/* ---------- students: mentors ---------- */

export function recommendMentors(student, mentors = [], opts = {}) {
  if (!student) return []
  const interests = student.interests || []
  const q = bagOf({ strong: interests, weak: [student.goal, student.level, student.institution] })
  const bags = mentors.map((m) => bagOf({ strong: m.fields || [], weak: [m.title, m.company, m.bio, m.degree] }))
  const sims = similarities(q, bags)
  const mine = new Set(interests.map(lc))

  return finish(mentors.map((m, i) => {
    const exact = (m.fields || []).filter((f) => mine.has(lc(f)))
    const overlapRatio = interests.length ? exact.length / interests.length : 0
    const relevance = clamp01(0.6 * Math.min(1, sims[i].sim * 1.6) + 0.4 * overlapRatio)
    const quality = 0.7 * clamp01((Number(m.rating) || 0) / 5) + 0.3 * clamp01((Number(m.hours) || 0) / 10)
    const reasons = reasonsFrom(exact, sims[i].shared)
    return { item: m, relevance, score: relevance * (0.85 + 0.15 * quality), reasons }
  }), opts)
}

/* ---------- mentors: students ---------- */

export function recommendStudents(mentor, students = [], opts = {}) {
  if (!mentor) return []
  const fields = mentor.fields || []
  const q = bagOf({ strong: fields, weak: [mentor.bio, mentor.title, mentor.company, mentor.degree] })
  const bags = students.map((st) => bagOf({ strong: st.interests || [], weak: [st.goal, st.level, st.institution] }))
  const sims = similarities(q, bags)
  const mine = new Set(fields.map(lc))

  return finish(students.map((st, i) => {
    const exact = (st.interests || []).filter((x) => mine.has(lc(x)))
    const denom = Math.max(1, Math.min(fields.length, (st.interests || []).length))
    const relevance = clamp01(0.6 * Math.min(1, sims[i].sim * 1.6) + 0.4 * Math.min(1, exact.length / denom))
    return { item: st, relevance, score: relevance, reasons: reasonsFrom(exact, sims[i].shared) }
  }), opts)
}

/* ---------- students: sessions ---------- */

export function recommendSessions(student, sessions = [], mentors = [], opts = {}) {
  if (!student) return []
  const interests = student.interests || []
  const mine = new Set(interests.map(lc))
  const now = Date.now()

  const usable = sessions.filter((se) => {
    if (new Date(se.date).getTime() <= now) return false
    const taken = se.taken ?? (se.registered || []).length
    const mineAlready = (se.registered || []).includes(student.id)
    if (opts.excludeRegistered && mineAlready) return false
    return mineAlready || (se.seats || 0) - taken > 0
  })

  const q = bagOf({ strong: interests, weak: [student.goal, student.level] })
  const bags = usable.map((se) => {
    const host = mentors.find((m) => m.id === se.hostId)
    return bagOf({ strong: [se.keyword, se.title], weak: [se.desc, (host?.fields || []).join(' '), host?.title] })
  })
  const sims = similarities(q, bags)

  return finish(usable.map((se, i) => {
    const kw = mine.has(lc(se.keyword)) ? 1 : 0
    const relevance = clamp01(0.55 * Math.min(1, sims[i].sim * 1.6) + 0.45 * kw)
    const days = Math.max(0, (new Date(se.date).getTime() - now) / 864e5)
    const soon = 1 / (1 + days / 14)
    const reasons = reasonsFrom(kw ? [se.keyword] : [], sims[i].shared)
    return { item: se, relevance, score: relevance * (0.8 + 0.2 * soon), reasons }
  }), opts)
}

/* ---------- investors: startups ---------- */

const NPR_PER_USD = 135 // rough; only used so an "NPR 5 lakh" ticket is compared with a USD ask fairly

// "$10K-50K", "10-50K", "NPR 5 lakh - 20 lakh" -> [min, max] in USD (or null).
function parseMoneyRange(s) {
  if (!s) return null
  const text = String(s).toLowerCase()
  const found = [...text.matchAll(/(\d+(?:[.,]\d+)?)\s*(k|thousand|million|mil|mn|m|lakh|lac|crore|cr)?\b/g)]
  if (!found.length) return null
  const mult = { k: 1e3, thousand: 1e3, m: 1e6, mil: 1e6, mn: 1e6, million: 1e6, lakh: 1e5, lac: 1e5, crore: 1e7, cr: 1e7 }
  let carry = null
  const nums = found.reverse().map((m) => {
    const unit = m[2] || carry
    if (m[2]) carry = m[2]
    return parseFloat(m[1].replace(/,/g, '')) * (mult[unit] || 1)
  })
  const isNpr = /\b(npr|nrs|rs)\b|lakh|lac|crore/.test(text)
  const fx = isNpr ? 1 / NPR_PER_USD : 1
  return [Math.min(...nums) * fx, Math.max(...nums) * fx]
}

// Rough "does this stage suit this kind of investor" (0..1). Unknown = neutral.
function stageFit(investorType, stage) {
  const t = lc(investorType)
  const st = lc(stage)
  if (!st) return 0.6
  const idea = /idea/.test(st)
  const preseed = /pre-?seed/.test(st)
  const seed = /seed/.test(st) && !preseed
  const late = /series|growth|expansion/.test(st)
  if (/angel/.test(t)) return idea || preseed || seed ? 1 : late ? 0.3 : 0.6
  if (/diaspora|impact/.test(t)) return seed ? 1 : preseed ? 0.9 : idea ? 0.6 : late ? 0.8 : 0.6
  if (/vc|venture|fund|firm|institution/.test(t)) return late ? 1 : seed ? 0.9 : preseed || idea ? 0.5 : 0.6
  return 0.6
}

// An investor usually funds a slice of a round, not all of it.
function ticketFit(ticket, ask) {
  const range = parseMoneyRange(ticket)
  const a = Number(ask)
  if (!range || !a) return 0.5
  if (range[1] < a * 0.05) return 0.3 // cheque is tiny compared with the round
  if (range[0] > a) return 0.4 // minimum cheque is bigger than the whole round
  return 1
}

export function recommendStartups(investor, startups = [], opts = {}) {
  if (!investor) return []
  const sectors = investor.sectors || []
  const mine = new Set(sectors.map(lc))
  const q = bagOf({ strong: sectors, weak: [investor.bio, investor.firm, investor.type] })
  const bags = startups.map((s) => bagOf({
    strong: [s.sector, ...(s.tags || [])],
    weak: [s.tagline, s.pitch?.problem, s.pitch?.solution, s.pitch?.market, s.pitch?.model, s.stage, s.location],
  }))
  const sims = similarities(q, bags)

  return finish(startups.map((s, i) => {
    const sector = mine.has(lc(s.sector)) ? 1 : 0
    const relevance = clamp01(0.55 * Math.min(1, sims[i].sim * 1.6) + 0.45 * sector)
    const fit = 0.5 * stageFit(investor.type, s.stage) + 0.5 * ticketFit(investor.ticket, s.ask)
    const reasons = reasonsFrom(sector ? [s.sector] : [], sims[i].shared)
    return { item: s, relevance, score: relevance * (0.7 + 0.3 * fit), reasons }
  }), opts)
}

/* ---------- startups: investors ---------- */

// Mirror of recommendStartups: which investors fit this startup best.
export function recommendInvestors(startup, investors = [], opts = {}) {
  if (!startup) return []
  const q = bagOf({
    strong: [startup.sector, ...(startup.tags || [])],
    weak: [startup.tagline, startup.pitch?.problem, startup.pitch?.solution, startup.pitch?.market, startup.pitch?.model, startup.stage, startup.location],
  })
  const bags = investors.map((inv) => bagOf({ strong: inv.sectors || [], weak: [inv.bio, inv.firm, inv.type] }))
  const sims = similarities(q, bags)

  return finish(investors.map((inv, i) => {
    const sector = (inv.sectors || []).some((x) => lc(x) === lc(startup.sector)) ? 1 : 0
    const relevance = clamp01(0.55 * Math.min(1, sims[i].sim * 1.6) + 0.45 * sector)
    const fit = 0.5 * stageFit(inv.type, startup.stage) + 0.5 * ticketFit(inv.ticket, startup.ask)
    return { item: inv, relevance, score: relevance * (0.7 + 0.3 * fit), reasons: reasonsFrom(sector ? [startup.sector] : [], sims[i].shared) }
  }), opts)
}