/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import * as demo from './data/demo'

const KEY = 'aakar-demo-v2'
const Ctx = createContext(null)

const initial = () => ({
  users: demo.seedUsers,
  currentUserId: null,
  startups: demo.startups,
  investors: demo.investors,
  mentors: demo.mentors,
  students: demo.students,
  organizations: demo.organizations,
  sessions: demo.sessions,
  requests: demo.mentorshipRequests,
  challenges: demo.challenges,
  conversations: demo.seedConversations,
  saved: { 'u-inv': ['s4'] },
  readNotifs: {},
})

// TEMPORARY demo shortcut: ?as=student (etc.) signs in as that demo account on load.
const DEMO_AS = { investor: 'u-inv', startup: 'u-sup', student: 'u-stu', professional: 'u-pro', organization: 'u-org', admin: 'u-admin' }
function load() {
  let st = initial()
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) st = { ...st, ...JSON.parse(raw) }
  } catch { /* storage unavailable */ }
  const as = new URLSearchParams(window.location.search).get('as')
  if (DEMO_AS[as]) st = { ...st, currentUserId: DEMO_AS[as] }
  return st
}

const uid = (p) => p + Math.random().toString(36).slice(2, 9)
const nowISO = () => new Date().toISOString()
const notOlderThanADay = (iso) => new Date(iso) > new Date(new Date().getTime() - 864e5)
export const initialsOf = (name = '') => name.replace(/^(Dr\.|Er\.|CA)\s+/i, '').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || 'A'
const pickColor = (s) => demo.COLORS[[...s].reduce((a, c) => a + c.charCodeAt(0), 0) % demo.COLORS.length]

// Turn an approved registration into a platform record (startup listing, mentor profile, ...)
function buildEntity(user) {
  const r = user.raw || {}
  const base = { id: uid(user.role.slice(0, 3) + '-'), name: user.name, initials: user.initials, color: user.color }
  switch (user.role) {
    case 'investor':
      return ['investors', { ...base, type: r.investorType || 'Angel investor', firm: r.firm || 'Independent', location: r.country || user.profile?.Country || 'Abroad', ticket: r.ticket || user.profile?.['Ticket size'] || '—', sectors: r.sectors || [], bio: r.bio || '', visible: !!r.visible, deals: 0 }]
    case 'student':
      return ['students', { ...base, institution: r.institution || user.profile?.Institution || '', level: r.level || user.profile?.Level || '', city: r.city || user.profile?.City || '', interests: r.interests || (user.profile?.Interests || '').split(',').map((s) => s.trim()).filter(Boolean), goal: r.goal || '' }]
    case 'professional':
      return ['mentors', { ...base, title: r.title || user.profile?.Title || '', company: r.company || user.profile?.Company || '', location: r.country || user.profile?.Country || '', years: Number(r.years) || 5, fields: r.fields || (user.profile?.Expertise || '').split(',').map((s) => s.trim()).filter(Boolean), degree: r.degree || '', bio: r.bio || '', rating: 5, mentees: 0, hours: Number(r.hours) || 4 }]
    case 'startup': {
      const name = r.startupName || user.profile?.['Startup name'] || user.name
      const ask = Number(String(r.ask || user.profile?.['Funding ask'] || '50000').replace(/[^\d]/g, '')) || 50000
      return ['startups', { ...base, name, initials: initialsOf(name), color: pickColor(name), tagline: r.tagline || 'A new Nepali startup on Aakar.', sector: r.sector || user.profile?.Sector || 'E-commerce', stage: r.stage || user.profile?.Stage || 'Pre-seed', location: r.location || user.profile?.Location || 'Kathmandu', founded: Number(r.founded) || new Date().getFullYear(), team: Number(r.team) || 3, ask, raised: 0, equity: Number(r.equity) || 10, valuation: '—', founders: [{ name: user.name, role: 'Founder', bg: '' }], traction: [{ k: 'Stage', v: r.stage || 'Pre-seed' }, { k: 'Team', v: String(r.team || 3) }, { k: 'Founded', v: String(r.founded || new Date().getFullYear()) }], tags: [], pitch: { problem: r.problem || '', solution: r.solution || '', market: r.market || '', model: r.model || '' }, useOfFunds: [{ label: 'Product', pct: 50 }, { label: 'Growth', pct: 30 }, { label: 'Operations', pct: 20 }], views: 0, interested: 0 }]
    }
    case 'organization':
      return ['organizations', { ...base, type: r.orgType || user.profile?.['Organization type'] || 'NGO', district: r.district || user.profile?.District || '' }]
    default:
      return [null, null]
  }
}

export function StoreProvider({ children }) {
  const [state, setState] = useState(load)
  const [typing, setTyping] = useState({})
  const [toasts, setToasts] = useState([])
  const timers = useRef([])

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(state)) } catch { /* ignore */ }
  }, [state])
  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const toast = useCallback((msg) => {
    const id = uid('t')
    setToasts((t) => [...t, { id, msg }])
    timers.current.push(setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200))
  }, [])

  const user = state.users.find((u) => u.id === state.currentUserId) || null

  const entityOf = useCallback((u) => {
    if (!u?.refId) return null
    const list = { investor: state.investors, student: state.students, startup: state.startups, professional: state.mentors, organization: state.organizations }[u.role]
    return list?.find((x) => x.id === u.refId) || null
  }, [state])

  const api = useMemo(() => ({
    login(email, password) {
      const u = state.users.find((x) => x.email.toLowerCase() === email.trim().toLowerCase())
      if (!u) return { error: 'No account found with this email.' }
      if (u.password !== password) return { error: 'Incorrect password.' }
      return { user: u }
    },
    setCurrent(id) { setState((s) => ({ ...s, currentUserId: id })) },
    logout() { setState((s) => ({ ...s, currentUserId: null })) },

    register({ role, name, email, password, profile, raw, docs }) {
      if (state.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) return { error: 'An account with this email already exists.' }
      const u = { id: uid('u-'), role, name, email, password, status: 'pending', initials: initialsOf(name), color: pickColor(name), submittedAt: nowISO(), profile, raw, docs }
      setState((s) => ({ ...s, users: [...s.users, u], currentUserId: u.id }))
      return { user: u }
    },

    approve(userId) {
      setState((s) => {
        const u = s.users.find((x) => x.id === userId)
        if (!u) return s
        let next = { ...s }
        let refId = u.refId
        if (!refId) {
          const [listKey, entity] = buildEntity(u)
          if (listKey) { next[listKey] = [entity, ...s[listKey]]; refId = entity.id }
        }
        next.users = s.users.map((x) => (x.id === userId ? { ...x, status: 'approved', refId, reviewedAt: nowISO(), rejectReason: undefined } : x))
        return next
      })
    },
    reject(userId, reason) {
      setState((s) => ({ ...s, users: s.users.map((x) => (x.id === userId ? { ...x, status: 'rejected', rejectReason: reason, reviewedAt: nowISO() } : x)) }))
    },

    updateEntity(listKey, id, patch) {
      setState((s) => ({ ...s, [listKey]: s[listKey].map((x) => (x.id === id ? { ...x, ...patch } : x)) }))
    },

    toggleSave(startupId) {
      setState((s) => {
        const cur = s.saved[s.currentUserId] || []
        const nextList = cur.includes(startupId) ? cur.filter((x) => x !== startupId) : [...cur, startupId]
        return { ...s, saved: { ...s.saved, [s.currentUserId]: nextList } }
      })
    },

    // Opens (or creates) a conversation for the current user with a peer. Returns its id.
    startChat(peer, opener) {
      const existing = state.conversations.find((c) => c.ownerId === state.currentUserId && c.peer.refId === peer.refId && c.peer.name === peer.name)
      if (existing) return existing.id
      const id = uid('cv')
      const conv = { id, ownerId: state.currentUserId, peer, messages: opener ? [{ from: 'system', text: opener, at: nowISO() }] : [] }
      setState((s) => ({ ...s, conversations: [conv, ...s.conversations] }))
      return id
    },
    // kindHint is used when the conversation was created in this same tick.
    sendMessage(convId, text, kindHint) {
      const conv = state.conversations.find((c) => c.id === convId)
      setState((s) => ({ ...s, conversations: s.conversations.map((c) => (c.id === convId ? { ...c, messages: [...c.messages, { from: 'me', text, at: nowISO() }] } : c)) }))
      const kind = conv?.peer.kind || kindHint
      if (!kind) return
      const pool = demo.autoReplies[kind] || demo.autoReplies.professional
      const reply = pool[(conv?.messages.filter((m) => m.from === 'peer').length || 0) % pool.length]
      timers.current.push(setTimeout(() => setTyping((t) => ({ ...t, [convId]: true })), 600))
      timers.current.push(setTimeout(() => {
        setTyping((t) => ({ ...t, [convId]: false }))
        setState((s) => ({ ...s, conversations: s.conversations.map((c) => (c.id === convId ? { ...c, messages: [...c.messages, { from: 'peer', text: reply, at: nowISO() }] } : c)) }))
      }, 2200))
    },

    requestMentorship(studentId, mentorId, message) {
      setState((s) => ({ ...s, requests: [{ id: uid('r'), studentId, mentorId, message, status: 'pending', at: nowISO() }, ...s.requests] }))
    },
    respondRequest(reqId, status) {
      setState((s) => {
        const req = s.requests.find((r) => r.id === reqId)
        let conversations = s.conversations
        if (req && status === 'accepted') {
          const st = s.students.find((x) => x.id === req.studentId)
          const m = s.mentors.find((x) => x.id === req.mentorId)
          const proUser = s.users.find((u) => u.role === 'professional' && u.refId === req.mentorId)
          const stuUser = s.users.find((u) => u.role === 'student' && u.refId === req.studentId)
          const add = []
          if (proUser && st) add.push({ id: uid('cv'), ownerId: proUser.id, peer: { name: st.name, initials: st.initials, color: st.color, subtitle: `Mentee · ${st.institution}`, kind: 'student', refId: st.id }, messages: [{ from: 'peer', text: req.message, at: req.at }, { from: 'system', text: 'Mentorship accepted. Say hello and plan your first session.', at: nowISO() }] })
          if (stuUser && m) add.push({ id: uid('cv'), ownerId: stuUser.id, peer: { name: m.name, initials: m.initials, color: m.color, subtitle: `${m.title}, ${m.company}`, kind: 'mentor', refId: m.id }, messages: [{ from: 'me', text: req.message, at: req.at }, { from: 'system', text: `${m.name} accepted your mentorship request.`, at: nowISO() }] })
          conversations = [...add, ...conversations]
        }
        return { ...s, conversations, requests: s.requests.map((r) => (r.id === reqId ? { ...r, status } : r)) }
      })
    },

    createSession(data) {
      const se = { id: uid('se'), registered: [], ...data }
      setState((s) => ({ ...s, sessions: [...s.sessions, se] }))
      return se
    },
    toggleRegister(sessionId, studentId) {
      setState((s) => ({ ...s, sessions: s.sessions.map((se) => (se.id !== sessionId ? se : { ...se, registered: se.registered.includes(studentId) ? se.registered.filter((x) => x !== studentId) : [...se.registered, studentId] })) }))
    },

    postChallenge(data) {
      setState((s) => ({ ...s, challenges: [{ id: uid('c'), at: nowISO(), responses: [], ...data }, ...s.challenges] }))
    },
    respondChallenge(challengeId, responder, text, posterPeer) {
      setState((s) => {
        const conv = { id: uid('cv'), ownerId: s.currentUserId, peer: posterPeer, messages: [{ from: 'system', text: `Solution suggested on “${s.challenges.find((c) => c.id === challengeId)?.title}”`, at: nowISO() }, { from: 'me', text, at: nowISO() }] }
        return {
          ...s,
          conversations: [conv, ...s.conversations],
          challenges: s.challenges.map((c) => (c.id === challengeId ? { ...c, responses: [...c.responses, { ...responder, text, at: nowISO() }] } : c)),
        }
      })
    },

    markNotifsRead(ids) {
      setState((s) => ({ ...s, readNotifs: { ...s.readNotifs, [s.currentUserId]: [...new Set([...(s.readNotifs[s.currentUserId] || []), ...ids])] } }))
    },

    resetDemo() {
      try { localStorage.removeItem(KEY) } catch { /* ignore */ }
      setState(initial())
    },
  }), [state])

  const value = { state, user, entity: entityOf(user), entityOf, typing, toast, ...api }
  return (
    <Ctx.Provider value={value}>
      {children}
      <div className="toasts">
        {toasts.map((t) => <div key={t.id} className="toast">{t.msg}</div>)}
      </div>
    </Ctx.Provider>
  )
}

 
export const useStore = () => useContext(Ctx)

// Notifications for the signed-in user, derived from shared state.
 
export function useNotifications() {
  const { state, user, entity } = useStore()
  return useMemo(() => {
    if (!user || !entity) return []
    const read = state.readNotifs[user.id] || []
    const out = []
    if (user.role === 'student') {
      state.sessions.filter((se) => entity.interests.includes(se.keyword) && notOlderThanADay(se.date)).forEach((se) => {
        const host = state.mentors.find((m) => m.id === se.hostId)
        out.push({ id: 'n-' + se.id, icon: 'session', text: `${host?.name} is hosting a session on “${se.keyword}”`, sub: se.title, to: '/app/sessions', at: se.date })
      })
      state.requests.filter((r) => r.studentId === entity.id && r.status === 'accepted').forEach((r) => {
        const m = state.mentors.find((x) => x.id === r.mentorId)
        out.push({ id: 'n-' + r.id, icon: 'check', text: `${m?.name} accepted your mentorship request`, sub: 'Start the conversation in Messages', to: '/app/messages', at: r.at })
      })
    }
    if (user.role === 'professional') {
      state.requests.filter((r) => r.mentorId === entity.id && r.status === 'pending').forEach((r) => {
        const st = state.students.find((x) => x.id === r.studentId)
        out.push({ id: 'n-' + r.id, icon: 'user', text: `${st?.name} requested mentorship`, sub: r.message.slice(0, 70) + '…', to: '/app', at: r.at })
      })
    }
    if (user.role === 'organization' || user.role === 'startup') {
      state.challenges.filter((c) => c.posterId === entity.id).forEach((c) => c.responses.forEach((r, i) => {
        out.push({ id: `n-${c.id}-${i}`, icon: 'bulb', text: `${r.name} suggested a solution`, sub: c.title, to: '/app/helpdesk', at: r.at })
      }))
    }
    if (user.role === 'startup') {
      state.conversations.filter((c) => c.ownerId === user.id && c.peer.kind === 'investor').forEach((c) => {
        out.push({ id: 'n-' + c.id, icon: 'chat', text: `${c.peer.name} messaged you`, sub: c.peer.subtitle, to: '/app/messages?c=' + c.id, at: c.messages.at(-1)?.at })
      })
    }
    if (user.role === 'investor') {
      state.startups.slice(0, 2).forEach((s) => out.push({ id: 'n-new-' + s.id, icon: 'rocket', text: `${s.name} matches your sectors`, sub: s.tagline.slice(0, 70), to: '/app/startups/' + s.id, at: nowISO() }))
    }
    return out.sort((a, b) => new Date(b.at) - new Date(a.at)).map((n) => ({ ...n, unread: !read.includes(n.id) }))
  }, [state, user, entity])
}
