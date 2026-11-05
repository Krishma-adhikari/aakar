/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import * as demo from './data/demo'
import { supabase } from './lib/supabase'

const KEY = 'aakar-demo-v2'

// Sample contacts (people from demo.js) have no account behind them.
// false = they stay silent. true = they send made-up replies like before.
const FAKE_REPLIES = false
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

/* ---------- Supabase helpers ---------- */

// Turn a row from the Supabase "profiles" table into the user object the app already uses.
const fromRow = (row, prev = {}) => ({
  id: row.id,
  email: row.email || prev.email || '',
  role: row.is_admin ? 'admin' : row.role,
  status: row.status,
  name: row.full_name,
  initials: initialsOf(row.full_name),
  color: pickColor(row.full_name),
  submittedAt: row.created_at,
  rejectReason: row.reject_reason || undefined,
  profile: row.details?.profile,
  raw: row.details?.raw,
  docs: row.details?.docs || [],
  remote: true,
})

// Merge Supabase rows into local state. Approved members also get their platform record
// (startup listing, mentor profile, ...) created if it is not there yet.
function withRemote(s, rows) {
  const byId = new Map(s.users.map((u) => [u.id, u]))
  rows.forEach((r) => byId.set(r.id, { ...byId.get(r.id), ...fromRow(r, byId.get(r.id)) }))
  const next = { ...s, users: [...byId.values()] }
  rows.forEach((r) => {
    if (r.status !== 'approved' || r.is_admin) return
    const u = next.users.find((x) => x.id === r.id)
    if (!u || u.refId) return
    const [listKey, entity] = buildEntity(u)
    if (!listKey) return
    if (!next[listKey].some((x) => x.id === entity.id)) next[listKey] = [entity, ...next[listKey]]
    next.users = next.users.map((x) => (x.id === u.id ? { ...x, refId: entity.id } : x))
  })
  return next
}

// Used only if Supabase cannot be reached, so the demo never breaks.
function registerLocal(setState, { role, name, email, password, profile, raw, docs }) {
  const u = { id: uid('u-'), role, name, email, password, status: 'pending', initials: initialsOf(name), color: pickColor(name), submittedAt: nowISO(), profile, raw, docs }
  setState((s) => ({ ...s, users: [...s.users, u], currentUserId: u.id }))
  return { user: u }
}

/* ---------- Real chat helpers ---------- */

const KIND = { investor: 'investor', startup: 'startup', student: 'student', professional: 'mentor', organization: 'organization' }
const ROLE_LABEL = { investor: 'Investor', startup: 'Startup founder', student: 'Student', professional: 'Professional', organization: 'Organization' }

// Describe a real person (a profiles row) the way the Messages page expects a chat peer.
const peerFromRow = (row) => {
  const u = fromRow(row)
  return { name: u.name, initials: u.initials, color: u.color, subtitle: ROLE_LABEL[row.role] || 'Member', kind: KIND[row.role] || 'professional', refId: 'r-' + row.id.slice(0, 8), userId: row.id }
}

// If the person you are messaging is a real account, return their Supabase user id.
const peerUserId = (s, peer) => peer.userId
  || [...s.startups, ...s.investors, ...s.mentors, ...s.students, ...s.organizations].find((e) => e.id === peer.refId)?.userId

// A real member's platform record id (matches buildEntity), so existing pages can find them.
const eid = (userId) => 'r-' + userId.slice(0, 8)

const reqFromRow = (r) => ({ id: r.id, studentId: eid(r.student_id), mentorId: eid(r.mentor_id), message: r.message, status: r.status, at: r.created_at, remote: true })

const challFromRow = (c, responses = [], profileById = {}) => ({
  id: c.id, remote: true, posterType: c.poster_type, posterId: eid(c.poster_id), title: c.title, category: c.category, urgency: c.urgency,
  tags: c.tags || [], desc: c.description, at: c.created_at,
  responses: responses.map((r) => {
    const p = profileById[r.responder_id]
    const u = p ? fromRow(p) : { name: 'Member', initials: 'M', color: '#334155' }
    return { rid: r.id, name: u.name, initials: u.initials, color: u.color, text: r.body, at: r.created_at }
  }),
})

// Save one message to Supabase (and create the conversation first if needed).
async function sendRemote({ setState, toast, convId, remoteId, remoteUserId, meId, text }) {
  try {
    let rid = remoteId
    if (!rid) {
      const { data, error } = await supabase.rpc('start_conversation', { peer_id: remoteUserId })
      if (error) { toast(error.message); return }
      rid = data
      setState((s) => ({ ...s, conversations: s.conversations.map((c) => (c.id === convId ? { ...c, remoteId: rid } : c)) }))
    }
    const { error } = await supabase.from('messages').insert({ conversation_id: rid, sender_id: meId, body: text })
    if (error) toast('Message not sent: ' + error.message)
  } catch {
    toast('Message not sent. Check your connection.')
  }
}

// Turn an approved registration into a platform record (startup listing, mentor profile, ...)
function buildEntity(user) {
  const r = user.raw || {}
  const base = { id: user.remote ? 'r-' + user.id.slice(0, 8) : uid(user.role.slice(0, 3) + '-'), userId: user.remote ? user.id : undefined, name: user.name, initials: user.initials, color: user.color }
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
  const stateRef = useRef(state)
  stateRef.current = state
  const pending = useRef({}) // conversations created in this same tick, before state updates
  const syncRef = useRef(null) // reloads shared data from Supabase (set while a real user is signed in)

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

  // For real (Supabase) accounts: load other members and past chats, then listen for new messages live.
  const meId = user?.remote ? user.id : null
  useEffect(() => {
    if (!meId) return undefined
    let alive = true

    const toLocal = (conv, profile, msgs) => ({
      id: 'rc-' + conv.id,
      remoteId: conv.id,
      remoteUserId: profile.id,
      ownerId: meId,
      peer: peerFromRow(profile),
      messages: msgs.map((m) => ({ rid: m.id, from: m.sender_id === meId ? 'me' : 'peer', text: m.body, at: m.created_at })),
    })

    // Replace local copies with the server's version, but keep each chat's existing id
    // (and its local "context" lines) so an open chat does not disappear.
    const mergeConvs = (list) => setState((s) => {
      const matched = new Set()
      const merged = list.map((n) => {
        const old = s.conversations.find((c) => c.ownerId === meId && ((c.remoteId && c.remoteId === n.remoteId) || (!c.remoteId && c.remoteUserId && c.remoteUserId === n.remoteUserId)))
        if (!old) return n
        matched.add(old.id)
        return { ...n, id: old.id, messages: [...old.messages.filter((m) => m.from === 'system'), ...n.messages] }
      })
      return { ...s, conversations: [...merged, ...s.conversations.filter((c) => !matched.has(c.id))] }
    })

    const loadAll = async () => {
      try {
        const { data: profs } = await supabase.from('profiles').select('*').eq('status', 'approved')
        if (alive && profs) setState((s) => withRemote(s, profs))

        // Mentorship requests and help-desk challenges shared between real members
        const profileById = Object.fromEntries((profs || []).map((p) => [p.id, p]))
        const { data: reqs } = await supabase.from('mentorship_requests').select('*').order('created_at', { ascending: false })
        const { data: chs } = await supabase.from('challenges').select('*').order('created_at', { ascending: false })
        const { data: resps } = await supabase.from('challenge_responses').select('*').order('created_at', { ascending: true })
        if (alive && (reqs || chs)) {
          setState((s) => {
            const reqIds = new Set((reqs || []).map((r) => r.id))
            const chIds = new Set((chs || []).map((c) => c.id))
            return {
              ...s,
              requests: [...(reqs || []).map(reqFromRow), ...s.requests.filter((r) => !reqIds.has(r.id))],
              challenges: [...(chs || []).map((c) => challFromRow(c, (resps || []).filter((r) => r.challenge_id === c.id), profileById)), ...s.challenges.filter((c) => !chIds.has(c.id))],
            }
          })
        }

        const { data: convs } = await supabase.from('conversations').select('*')
        if (!alive || !convs?.length) return
        const { data: msgs } = await supabase.from('messages').select('*').in('conversation_id', convs.map((c) => c.id)).order('created_at', { ascending: true })
        const otherIds = convs.map((c) => (c.user_a === meId ? c.user_b : c.user_a))
        const { data: others } = await supabase.from('profiles').select('*').in('id', otherIds)
        if (!alive) return
        const list = convs.map((c) => {
          const profile = (others || []).find((p) => p.id === (c.user_a === meId ? c.user_b : c.user_a))
          return profile ? toLocal(c, profile, (msgs || []).filter((m) => m.conversation_id === c.id)) : null
        }).filter(Boolean)
        mergeConvs(list)
      } catch { /* offline: keep what we already have */ }
    }

    const receive = async (m) => {
      if (m.sender_id === meId) return // my own messages are already on screen
      const known = stateRef.current.conversations.find((c) => c.remoteId === m.conversation_id)
      if (known) {
        setState((s) => ({
          ...s,
          conversations: s.conversations.map((c) => (c.remoteId !== m.conversation_id || c.messages.some((x) => x.rid === m.id)
            ? c
            : { ...c, messages: [...c.messages, { rid: m.id, from: 'peer', text: m.body, at: m.created_at }] })),
        }))
        return
      }
      try {
        const { data: conv } = await supabase.from('conversations').select('*').eq('id', m.conversation_id).single()
        if (!conv) return
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', conv.user_a === meId ? conv.user_b : conv.user_a).single()
        const { data: msgs } = await supabase.from('messages').select('*').eq('conversation_id', conv.id).order('created_at', { ascending: true })
        if (!profile || !alive) return
        setState((s) => withRemote(s, [profile]))
        mergeConvs([toLocal(conv, profile, msgs || [m])])
      } catch { /* ignore */ }
    }

    // Requests, challenges and responses: any change simply triggers a (debounced) reload.
    let timer = null
    const reloadSoon = () => {
      clearTimeout(timer)
      timer = setTimeout(loadAll, 300)
    }

    loadAll()
    syncRef.current = loadAll
    const channel = supabase
      .channel('live-' + meId)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => receive(payload.new))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mentorship_requests' }, reloadSoon)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'challenges' }, reloadSoon)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'challenge_responses' }, reloadSoon)
      .subscribe()
    window.addEventListener('focus', loadAll)
    return () => {
      alive = false
      clearTimeout(timer)
      syncRef.current = null
      window.removeEventListener('focus', loadAll)
      supabase.removeChannel(channel)
    }
  }, [meId])

  const entityOf = useCallback((u) => {
    if (!u?.refId) return null
    const list = { investor: state.investors, student: state.students, startup: state.startups, professional: state.mentors, organization: state.organizations }[u.role]
    return list?.find((x) => x.id === u.refId) || null
  }, [state])

  const api = useMemo(() => ({
    // Demo accounts are checked first (works offline). Everything else goes to Supabase.
    async login(email, password) {
      const em = email.trim().toLowerCase()
      const local = state.users.find((x) => x.password && x.email.toLowerCase() === em)
      if (local) {
        if (local.password !== password) return { error: 'Incorrect password.' }
        return { user: local }
      }
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email: em, password })
        if (error) return { error: error.message === 'Invalid login credentials' ? 'Incorrect email or password.' : error.message }
        const { data: row, error: pErr } = await supabase.from('profiles').select('*').eq('id', data.user.id).single()
        if (pErr || !row) {
          await supabase.auth.signOut()
          return { error: 'This account has no profile yet. Ask an admin to check the profiles table.' }
        }
        const withEmail = { ...row, email: row.email || data.user.email }
        setState((s) => withRemote(s, [withEmail]))
        return { user: fromRow(withEmail) }
      } catch {
        return { error: 'Could not reach the server. Use a demo account instead.' }
      }
    },
    setCurrent(id) { setState((s) => ({ ...s, currentUserId: id })) },
    logout() {
      supabase.auth.signOut().catch(() => {})
      setState((s) => ({ ...s, currentUserId: null }))
    },

    async register(data) {
      const { role, name, password, profile, raw, docs } = data
      const email = data.email.trim()
      if (state.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) return { error: 'An account with this email already exists.' }
      try {
        const { data: res, error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        if (!res.session) return { error: 'Supabase is asking for email confirmation. Turn off "Confirm email" in Supabase (Authentication, Sign In / Providers, Email).' }
        const row = {
          id: res.user.id, full_name: name, role, email,
          country: raw?.country ?? null, bio: raw?.bio ?? null,
          keywords: raw?.interests || raw?.fields || raw?.sectors || [],
          details: { profile, raw, docs },
        }
        const { error: pErr } = await supabase.from('profiles').insert(row)
        if (pErr) { await supabase.auth.signOut(); return { error: pErr.message } }
        const u = fromRow({ ...row, status: 'pending', is_admin: false, created_at: nowISO() })
        setState((s) => ({ ...s, users: [...s.users.filter((x) => x.id !== u.id), u], currentUserId: u.id }))
        return { user: u }
      } catch (err) {
        if (err?.name === 'AuthRetryableFetchError' || err instanceof TypeError) return registerLocal(setState, { ...data, email })
        return { error: err?.message || 'Could not create the account.' }
      }
    },

    // Admin only: load every application from Supabase into the queue.
    async refreshApplications() {
      try {
        const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
        if (error) return { error: error.message }
        setState((s) => withRemote(s, data))
        return {}
      } catch {
        return { error: 'Could not reach the server.' }
      }
    },

    async approve(userId) {
      const target = state.users.find((x) => x.id === userId)
      if (target?.remote) {
        const { error } = await supabase.rpc('set_profile_status', { target: userId, new_status: 'approved', reason: null })
        if (error) return { error: error.message }
      }
      setState((s) => {
        const u = s.users.find((x) => x.id === userId)
        if (!u) return s
        let next = { ...s }
        let refId = u.refId
        if (!refId) {
          const [listKey, entity] = buildEntity(u)
          if (listKey) {
            if (!s[listKey].some((x) => x.id === entity.id)) next[listKey] = [entity, ...s[listKey]]
            refId = entity.id
          }
        }
        next.users = s.users.map((x) => (x.id === userId ? { ...x, status: 'approved', refId, reviewedAt: nowISO(), rejectReason: undefined } : x))
        return next
      })
      return {}
    },
    async reject(userId, reason) {
      const target = state.users.find((x) => x.id === userId)
      if (target?.remote) {
        const { error } = await supabase.rpc('set_profile_status', { target: userId, new_status: 'rejected', reason })
        if (error) return { error: error.message }
      }
      setState((s) => ({ ...s, users: s.users.map((x) => (x.id === userId ? { ...x, status: 'rejected', rejectReason: reason, reviewedAt: nowISO() } : x)) }))
      return {}
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
      const me = state.users.find((u) => u.id === state.currentUserId)
      const found = me?.remote ? peerUserId(state, peer) : undefined
      const targetId = found && found !== me.id ? found : undefined
      const existing = state.conversations.find((c) => c.ownerId === state.currentUserId && (targetId ? c.remoteUserId === targetId : c.peer.refId === peer.refId && c.peer.name === peer.name))
      if (existing) return existing.id
      const id = uid('cv')
      const conv = { id, ownerId: state.currentUserId, peer, remoteUserId: targetId, messages: opener ? [{ from: 'system', text: opener, at: nowISO() }] : [] }
      pending.current[id] = conv
      setState((s) => ({ ...s, conversations: [conv, ...s.conversations] }))
      return id
    },
    // kindHint is used when the conversation was created in this same tick.
    sendMessage(convId, text, kindHint) {
      const conv = state.conversations.find((c) => c.id === convId) || pending.current[convId]
      const me = state.users.find((u) => u.id === state.currentUserId)
      setState((s) => ({ ...s, conversations: s.conversations.map((c) => (c.id === convId ? { ...c, messages: [...c.messages, { from: 'me', text, at: nowISO() }] } : c)) }))
      if (conv?.remoteUserId && me?.remote) {
        // Real person on the other side: save to Supabase, no fake reply.
        sendRemote({ setState, toast, convId, remoteId: conv.remoteId, remoteUserId: conv.remoteUserId, meId: me.id, text })
        return
      }
      // Two demo accounts talking in this browser: the other person finds the message in their chat
      // when they log in, and can answer it from there.
      if (conv && me && !me.remote && me.refId) {
        setState((s) => {
          const other = s.users.find((u) => !u.remote && u.id !== me.id && u.refId && u.refId === conv.peer.refId)
          if (!other) return s
          const lists = { investor: s.investors, student: s.students, startup: s.startups, professional: s.mentors, organization: s.organizations }
          const mine = lists[me.role]?.find((x) => x.id === me.refId)
          const subtitle = me.role === 'student' ? `Mentee · ${mine?.institution || ''}`
            : me.role === 'professional' ? `${mine?.title || ''}, ${mine?.company || ''}`
              : ROLE_LABEL[me.role] || 'Member'
          const incoming = { from: 'peer', text, at: nowISO() }
          const theirs = s.conversations.find((c) => c.ownerId === other.id && c.peer.refId === me.refId)
          if (theirs) {
            return { ...s, conversations: s.conversations.map((c) => (c.id === theirs.id ? { ...c, messages: [...c.messages, incoming] } : c)) }
          }
          const peer = { name: me.name, initials: me.initials, color: me.color, subtitle, kind: KIND[me.role] || 'professional', refId: me.refId }
          return { ...s, conversations: [{ id: uid('cv'), ownerId: other.id, peer, messages: [incoming] }, ...s.conversations] }
        })
      }
      const kind = conv?.peer.kind || kindHint
      if (!kind || !FAKE_REPLIES) return
      const pool = demo.autoReplies[kind] || demo.autoReplies.professional
      const reply = pool[(conv?.messages.filter((m) => m.from === 'peer').length || 0) % pool.length]
      timers.current.push(setTimeout(() => setTyping((t) => ({ ...t, [convId]: true })), 600))
      timers.current.push(setTimeout(() => {
        setTyping((t) => ({ ...t, [convId]: false }))
        setState((s) => ({ ...s, conversations: s.conversations.map((c) => (c.id === convId ? { ...c, messages: [...c.messages, { from: 'peer', text: reply, at: nowISO() }] } : c)) }))
      }, 2200))
    },

    requestMentorship(studentId, mentorId, message) {
      const me = state.users.find((u) => u.id === state.currentUserId)
      const mentorUserId = state.mentors.find((m) => m.id === mentorId)?.userId
      if (me?.remote && mentorUserId) {
        // Real student and real mentor: the request is saved so the mentor receives it.
        ;(async () => {
          try {
            const { data, error } = await supabase.from('mentorship_requests').insert({ student_id: me.id, mentor_id: mentorUserId, message }).select().single()
            if (error) { toast(error.code === '23505' ? 'You already have a pending request with this mentor.' : error.message); return }
            setState((s) => ({ ...s, requests: [reqFromRow(data), ...s.requests.filter((r) => r.id !== data.id)] }))
          } catch { toast('Request not sent. Check your connection.') }
        })()
        return
      }
      setState((s) => ({ ...s, requests: [{ id: uid('r'), studentId, mentorId, message, status: 'pending', at: nowISO() }, ...s.requests] }))
    },
    respondRequest(reqId, status) {
      const real = state.requests.find((r) => r.id === reqId)
      if (real?.remote) {
        // The database function marks it, opens the chat and sends the student their welcome message.
        ;(async () => {
          try {
            const { error } = await supabase.rpc('respond_mentorship', { request_id: reqId, do_accept: status === 'accepted' })
            if (error) { toast(error.message); return }
            setState((s) => ({ ...s, requests: s.requests.map((r) => (r.id === reqId ? { ...r, status } : r)) }))
            if (syncRef.current) syncRef.current()
          } catch { toast('Could not reach the server.') }
        })()
        return
      }
      setState((s) => {
        const req = s.requests.find((r) => r.id === reqId)
        let conversations = s.conversations
        if (req && status === 'accepted') {
          const st = s.students.find((x) => x.id === req.studentId)
          const m = s.mentors.find((x) => x.id === req.mentorId)
          const proUser = s.users.find((u) => u.role === 'professional' && u.refId === req.mentorId)
          const stuUser = s.users.find((u) => u.role === 'student' && u.refId === req.studentId)
          const add = []
          // Message the mentor "sends" automatically the moment they accept.
          const welcome = `Hi ${(st?.name || 'there').split(' ')[0]}, I've accepted your mentorship request. Let's plan your first session.`
          if (proUser && st) add.push({ id: uid('cv'), ownerId: proUser.id, peer: { name: st.name, initials: st.initials, color: st.color, subtitle: `Mentee · ${st.institution}`, kind: 'student', refId: st.id }, messages: [{ from: 'peer', text: req.message, at: req.at }, { from: 'me', text: welcome, at: nowISO() }] })
          if (stuUser && m) add.push({ id: uid('cv'), ownerId: stuUser.id, peer: { name: m.name, initials: m.initials, color: m.color, subtitle: `${m.title}, ${m.company}`, kind: 'mentor', refId: m.id }, messages: [{ from: 'me', text: req.message, at: req.at }, { from: 'system', text: `${m.name} accepted your mentorship request.`, at: nowISO() }, { from: 'peer', text: welcome, at: nowISO() }] })
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
      const me = state.users.find((u) => u.id === state.currentUserId)
      if (me?.remote) {
        // Saved to Supabase so every member (mentors included) sees it.
        ;(async () => {
          try {
            const { data: row, error } = await supabase.from('challenges').insert({
              poster_id: me.id, poster_type: me.role === 'startup' ? 'startup' : 'organization',
              title: data.title, category: data.category, urgency: data.urgency, tags: data.tags || [], description: data.desc || '',
            }).select().single()
            if (error) { toast(error.message); return }
            setState((s) => ({ ...s, challenges: [challFromRow(row), ...s.challenges.filter((c) => c.id !== row.id)] }))
          } catch { toast('Could not post. Check your connection.') }
        })()
        return
      }
      setState((s) => ({ ...s, challenges: [{ id: uid('c'), at: nowISO(), responses: [], ...data }, ...s.challenges] }))
    },
    respondChallenge(challengeId, responder, text, posterPeer) {
      const ch = state.challenges.find((c) => c.id === challengeId)
      const me = state.users.find((u) => u.id === state.currentUserId)
      if (ch?.remote && me?.remote) {
        // The database function saves the idea and delivers it to the poster as a chat message.
        ;(async () => {
          try {
            const { data: rid, error } = await supabase.rpc('respond_challenge', { challenge_id: challengeId, response_body: text })
            if (error) { toast(error.message); return }
            setState((s) => ({ ...s, challenges: s.challenges.map((c) => (c.id === challengeId && !c.responses.some((x) => x.rid === rid) ? { ...c, responses: [...c.responses, { rid, ...responder, text, at: nowISO() }] } : c)) }))
            if (syncRef.current) syncRef.current()
          } catch { toast('Could not send. Check your connection.') }
        })()
        return
      }
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
  }), [state, toast])

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