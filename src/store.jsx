/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import * as demo from './data/demo'
import { supabase } from './lib/supabase'
import { DEMO_ENABLED } from './lib/flags'
import { normPrize, validateMeetingLink } from './lib/validation'

const KEY = 'aakar-demo-v2'

// Sample contacts (people from demo.js) have no account behind them.
// false = they stay silent. true = they send made-up replies like before.
const FAKE_REPLIES = false

const Ctx = createContext(null)

// Sample data is used in demo mode only. A real (production) build starts empty,
// so real members never see made-up startups, mentors, sessions or accounts.
const seed = (list) => (DEMO_ENABLED ? list : [])

const initial = () => ({
  users: seed(demo.seedUsers),
  currentUserId: null,

  startups: seed(demo.startups),
  investors: seed(demo.investors),
  mentors: seed(demo.mentors),
  students: seed(demo.students),
  sessions: seed(demo.sessions),
  requests: seed(demo.mentorshipRequests),
  challenges: seed(demo.challenges),
  conversations: seed(demo.seedConversations),
  saved: DEMO_ENABLED ? { 'u-inv': ['s4'] } : {},

  readNotifs: {},
  readMessages: {}, // { [userId]: [ids of demo messages already read] }
  blocked: {}, // { [userId]: [peer refIds (demo) or user ids] }
  seededAt: new Date().toISOString(), // when the sample dates were generated (demo mode only)
})


// Sample session dates are made when the demo first loads. Move them forward by the whole days
// that have passed since, so the demo never ends up with only past sessions.
function shiftDemoDates(st) {
  if (!st.seededAt) return { ...st, seededAt: new Date().toISOString() }
  const days = Math.floor((Date.now() - new Date(st.seededAt).getTime()) / 864e5)
  if (!(days > 0)) return st
  const shift = (iso) => new Date(new Date(iso).getTime() + days * 864e5).toISOString()
  return {
    ...st,
    seededAt: shift(st.seededAt),
    sessions: st.sessions.map((se) => (se.remote ? se : { ...se, date: shift(se.date) })),
  }
}

// TEMPORARY demo shortcut: ?as=student (etc.) signs in as that demo account on load.
const DEMO_AS = { investor: 'u-inv', startup: 'u-sup', student: 'u-stu', professional: 'u-pro', admin: 'u-admin' }

function load() {
  let st = initial()
  if (!DEMO_ENABLED) {
    // Production keeps nothing about members in this browser. Remove what older versions saved.
    try { localStorage.removeItem(KEY) } catch { /* ignore */ }
    return st
  }
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) st = shiftDemoDates({ ...st, ...JSON.parse(raw) })
  } catch { /* storage unavailable */ }
  const as = new URLSearchParams(window.location.search).get('as')
  if (DEMO_AS[as]) st = { ...st, currentUserId: DEMO_AS[as] }
  return st
}

const uid = (p) => p + Math.random().toString(36).slice(2, 9)
const nowISO = () => new Date().toISOString()
const notOlderThanADay = (iso) => new Date(iso) > new Date(new Date().getTime() - 864e5)
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const initialsOf = (name = '') => name.replace(/^(Dr\.|Er\.|CA)\s+/i, '').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || 'A'

const pickColor = (s) => demo.COLORS[[...s].reduce((a, c) => a + c.charCodeAt(0), 0) % demo.COLORS.length]

// How many messages from the other person I have not seen yet.
// Real messages have a rid. Demo messages that have an id are counted unless they are in `read` (a Set).
// Old seed messages without an id are treated as already read.
export const unreadOf = (c, read) => c.messages.filter((m) => m.from === 'peer' && !m.seenAt && (m.rid || (read && m.id && !read.has(m.id)))).length

// Simulated online status for sample contacts: about one in three is "Online",
// the others get a stable "Last seen" time (it moves in 10 minute steps).
export function demoPresence(peer) {
  const key = String(peer?.refId || peer?.name || '')
  const h = [...key].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 100003, 7)
  const bucket = Math.floor(Date.now() / 600000) * 600000
  return { online: h % 3 === 0, lastSeenAt: new Date(bucket - ((h % 170) + 10) * 60000).toISOString() }
}

// Meeting link validation moved to lib/validation.js (so it can be tested). Re-exported for the pages.
export { validateMeetingLink }

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
  lastSeenAt: row.last_seen_at || null,
  rejectReason: row.reject_reason || undefined,
  profile: row.details?.profile,
  raw: row.details?.raw,
  docs: row.details?.docs || [],
  files: row.details?.files || [],
  remote: true,
})

// Merge Supabase rows into local state. Approved members also get their platform record
// (startup listing, mentor profile, ...) created if it is not there yet.
function withRemote(s, rows) {
  const byId = new Map(s.users.map((u) => [u.id, u]))
  rows.forEach((r) => byId.set(r.id, { ...byId.get(r.id), ...fromRow(r, byId.get(r.id)) }))
  const next = { ...s, users: [...byId.values()] }
  rows.forEach((r) => {
    if (r.status !== 'approved' && !r.is_admin) {
      // Not (or no longer) approved: they must not keep a listing.
      next.users = next.users.map((x) => (x.id === r.id ? { ...x, refId: undefined } : x))
      return
    }
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

const ENTITY_LISTS = ['startups', 'investors', 'mentors', 'students']

// Drop listings of real members who are no longer approved (or that I am no longer allowed to see).
function pruneRemote(s, approvedIds) {
  const next = { ...s }
  ENTITY_LISTS.forEach((k) => { next[k] = s[k].filter((e) => !e.userId || approvedIds.has(e.userId)) })
  return next
}

// Used only in demo mode if Supabase cannot be reached, so the demo never breaks.
function registerLocal(setState, { role, name, email, password, profile, raw, docs }) {
  const u = { id: uid('u-'), role, name, email, password, status: 'pending', initials: initialsOf(name), color: pickColor(name), submittedAt: nowISO(), profile, raw, docs }
  setState((s) => ({ ...s, users: [...s.users, u], currentUserId: u.id }))
  return { user: u }
}

/* ---------- Real chat helpers ---------- */

const KIND = { investor: 'investor', startup: 'startup', student: 'student', professional: 'mentor' }
const ROLE_LABEL = { investor: 'Investor', startup: 'Startup founder', student: 'Student', professional: 'Professional' }

// Describe a real person (a profiles row) the way the Messages page expects a chat peer.
const peerFromRow = (row) => {
  const u = fromRow(row)
  return {
    name: u.name,
    initials: u.initials,
    color: u.color,
    subtitle: ROLE_LABEL[row.role] || 'Member',
    kind: KIND[row.role] || 'professional',
    refId: 'r-' + row.id.slice(0, 8),
    userId: row.id,
    lastSeenAt: row.last_seen_at || null,
  }
}

// If the person you are messaging is a real account, return their Supabase user id.
const peerUserId = (s, peer) => peer.userId
  || [...s.startups, ...s.investors, ...s.mentors, ...s.students].find((e) => e.id === peer.refId)?.userId

// A real member's platform record id (matches buildEntity), so existing pages can find them.
const eid = (userId) => 'r-' + userId.slice(0, 8)

const reqFromRow = (r) => ({ id: r.id, studentId: eid(r.student_id), mentorId: eid(r.mentor_id), message: r.message, status: r.status, at: r.created_at, remote: true })

const challFromRow = (c, responses = [], profileById = {}) => ({
  id: c.id, remote: true, posterType: c.poster_type, posterId: eid(c.poster_id), title: c.title, category: c.category, urgency: c.urgency,
  tags: c.tags || [], desc: c.description, at: c.created_at,
  prize: c.prize_amount ?? null,
  responses: responses.map((r) => {
    const p = profileById[r.responder_id]
    const u = p ? fromRow(p) : { name: 'Member', initials: 'M', color: '#334155' }
    return { rid: r.id, name: u.name, initials: u.initials, color: u.color, text: r.body, at: r.created_at }
  }),
})

// Turn a row from the Supabase "sessions" table into the session object the pages already use.
// regs = the registrations I am allowed to see (my own as a student, everyone's on my own sessions as host).
// taken = total seats taken (from session_seat_counts), so seats left is right for every viewer.
// link = the meeting link, only present when I am allowed to read it (host, or a registered student who may join).
const sessFromRow = (r, regs = [], taken, link = null) => ({
  id: r.id,
  remote: true,
  hostId: eid(r.host_id),
  title: r.title,
  keyword: r.keyword,
  date: r.starts_at,
  duration: r.duration_min,
  seats: r.seats,
  platform: r.platform,
  mode: r.platform,
  desc: r.description,
  isPaid: r.is_paid,
  price: r.price_npr,
  payMethod: r.pay_method,
  payAccount: r.pay_account,
  registered: regs.map((x) => eid(x.student_id)),
  regs: regs.map((x) => ({ studentId: x.student_id, payStatus: x.pay_status })),
  taken: taken ?? regs.length,
  meetingLink: link || null,
})

// Save one message to Supabase (and create the conversation first if needed).
async function sendRemote({ setState, toast, convId, remoteId, remoteUserId, meId, text, localId }) {
  // Mark the bubble as failed (instead of leaving it on "Sending…" forever) and show why.
  const fail = (reason) => {
    console.error('Message not sent:', reason)
    toast('Message not sent: ' + reason)
    setState((s) => ({
      ...s,
      conversations: s.conversations.map((c) => (c.id === convId
        ? { ...c, messages: c.messages.map((m) => (m.localId === localId ? { ...m, status: 'failed' } : m)) }
        : c)),
    }))
  }

  try {
    // The app can think you are signed in while Supabase has no session (or a different account's session).
    // Then every insert is rejected by row-level security, so catch it here with a clear message.
    const { data: sess } = await supabase.auth.getSession()
    if (!sess?.session) { fail('Your login session expired. Log out and log in again.'); return }
    if (sess.session.user.id !== meId) { fail('You are signed in as a different account in another tab. Log out and log in again.'); return }

    let rid = remoteId

    if (!rid) {
      const { data, error } = await supabase.rpc('start_conversation', { peer_id: remoteUserId })
      if (error) { fail(error.message); return }
      rid = data
      setState((s) => ({ ...s, conversations: s.conversations.map((c) => (c.id === convId ? { ...c, remoteId: rid } : c)) }))
    }

    const { data, error } = await supabase
      .from('messages')
      .insert({ conversation_id: rid, sender_id: meId, body: text })
      .select()
      .single()

    if (error) {
      // A blocked person fails the row-level security rule: show a friendly message instead.
      const rls = error.code === '42501' || /row-level security/i.test(error.message || '')
      fail(rls ? 'this person is not accepting messages.' : error.message)
      return
    }

    setState((s) => ({
      ...s,
      conversations: s.conversations.map((c) =>
        c.id === convId
          ? {
            ...c,
            messages: c.messages.map((m) =>
              m.localId === localId
                ? { ...m, rid: data.id, at: data.created_at, status: 'sent', deliveredAt: m.deliveredAt || data.delivered_at, seenAt: m.seenAt || data.seen_at }
                : m
            ),
          }
          : c
      ),
    }))
  } catch (err) {
    fail(err?.message || 'Check your connection.')
  }
}

// Demo to demo: put a message from `me` into the other demo account's chat.
// If they have no chat with me (for example because they deleted it) a new one is created
// that holds only this message. `intro` is an optional system line shown before it.
function demoDeliver(s, me, other, text, srcId, intro) {
  const lists = { investor: s.investors, student: s.students, startup: s.startups, professional: s.mentors }
  const mine = lists[me.role]?.find((x) => x.id === me.refId)
  const subtitle = me.role === 'student' ? `Mentee · ${mine?.institution || ''}`
    : me.role === 'professional' ? `${mine?.title || ''}, ${mine?.company || ''}`
      : ROLE_LABEL[me.role] || 'Member'

  const at = nowISO()
  const incoming = { id: uid('m'), srcId, from: 'peer', text, at }
  const add = intro ? [{ from: 'system', text: intro, at }, incoming] : [incoming]
  // Match by refId, or by name (sample chats may use a different refId for the same person), so no second chat is created.
  const theirs = s.conversations.find((c) =>
    c.ownerId === other.id &&
    (
      c.remoteUserId === me.id ||
      c.peer?.userId === me.id ||
      (c.peer?.refId === me.refId && me.refId) ||
      c.peer?.name === me.name
    )
  )

  if (theirs) {
    return { ...s, conversations: s.conversations.map((c) => (c.id === theirs.id ? { ...c, messages: [...c.messages, ...add] } : c)) }
  }

  const peer = {
    name: me.name,
    initials: me.initials,
    color: me.color,
    subtitle,
    kind: KIND[me.role] || 'professional',
    refId: me.refId,
    userId: me.id
  }
  return { ...s, conversations: [{ id: uid('cv'), ownerId: other.id, peer, messages: add }, ...s.conversations] }
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
      return ['mentors', { ...base, title: r.title || user.profile?.Title || '', company: r.company || user.profile?.Company || '', location: r.country || user.profile?.Country || '', years: Number(r.years) || 5, fields: r.fields || (user.profile?.Expertise || '').split(',').map((s) => s.trim()).filter(Boolean), degree: r.degree || '', bio: r.bio || '', rating:null, mentees: 0, hours: parseInt(r.hours, 10) || 4 }]
    case 'startup': {
      const name = r.startupName || user.profile?.['Startup name'] || user.name
      const ask = Number(String(r.ask || user.profile?.['Funding ask'] || '50000').replace(/[^\d]/g, '')) || 50000
      return ['startups', { ...base, name, initials: initialsOf(name), color: pickColor(name), tagline: r.tagline || 'A new Nepali startup on Aakar.', sector: r.sector || user.profile?.Sector || 'E-commerce', stage: r.stage || user.profile?.Stage || 'Pre-seed', location: r.location || user.profile?.Location || 'Kathmandu', founded: Number(r.founded) || new Date().getFullYear(), team: Number(r.team) || 3, ask, raised: 0, equity: Number(r.equity) || 10, valuation: '—', founders: [{ name: user.name, role: 'Founder', bg: '' }], traction: [{ k: 'Stage', v: r.stage || 'Pre-seed' }, { k: 'Team', v: String(r.team || 3) }, { k: 'Founded', v: String(r.founded || new Date().getFullYear()) }], tags: [], pitch: { problem: r.problem || '', solution: r.solution || '', market: r.market || '', model: r.model || '' }, useOfFunds: [{ label: 'Product', pct: 50 }, { label: 'Growth', pct: 30 }, { label: 'Operations', pct: 20 }], views: 0, interested: 0 }]
    }

    default:
      return [null, null]
  }
}

export function StoreProvider({ children }) {
  const [state, setState] = useState(load)
  const [typing, setTyping] = useState({})
  const [onlineUsers, setOnlineUsers] = useState([])
  const [blockedRemote, setBlockedRemote] = useState([]) // user ids I blocked (from Supabase)
  const [toasts, setToasts] = useState([])
  const [remoteNotifs, setRemoteNotifs] = useState([]) // rows of the Supabase "notifications" table
  const [authReady, setAuthReady] = useState(false) // true once we know whether a Supabase session exists
  const timers = useRef([])
  const stateRef = useRef(state)
  stateRef.current = state
  const pending = useRef({}) // conversations created in this same tick, before state updates
  const syncRef = useRef(null) // reloads shared data from Supabase (set while a real user is signed in)
  const clearsRef = useRef({}) // { [remote conversation id]: cleared_at } for chats I deleted

  // Demo mode only. In production nothing about members is kept in this browser.
  useEffect(() => {
    if (!DEMO_ENABLED) return
    try { localStorage.setItem(KEY, JSON.stringify(state)) } catch { /* ignore */ }
  }, [state])

  // Restore a real login after a page reload. The Supabase session is the single source of truth.
  useEffect(() => {
    let alive = true
    const done = () => { if (alive) setAuthReady(true) }
const safety = setTimeout(done, 3000)

    supabase.auth.getSession().then(async ({ data }) => {
      const sess = data?.session
      if (!sess || stateRef.current.currentUserId) return
      // The reset-password link signs the person in temporarily; do not log them into the app.
      if (window.location.pathname.endsWith('/reset-password')) return
      const { data: row } = await supabase.from('profiles').select('*').eq('id', sess.user.id).maybeSingle()
      if (!alive || !row) return
      setState((s) => ({ ...withRemote(s, [{ ...row, email: row.email || sess.user.email }]), currentUserId: row.id }))
    }).catch(() => { /* offline: stay signed out */ }).finally(done)

    // Signed out somewhere else (another tab, revoked token): sign out here too.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event !== 'SIGNED_OUT') return
      setState((s) => {
        const me = s.users.find((x) => x.id === s.currentUserId)
        if (!me?.remote) return s
        return DEMO_ENABLED ? { ...s, currentUserId: null } : initial()
      })
    })

    return () => { alive = false; clearTimeout(safety); sub.subscription.unsubscribe() }
  }, [])

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const toast = useCallback((msg) => {
    const id = uid('t')
    setToasts((t) => [...t, { id, msg }])
    timers.current.push(setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200))
  }, [])

  // Change one demo message wherever it is. `patch` is an object or a function (message) => object.
  const patchMsg = useCallback((id, patch) => {
    setState((s) => ({
      ...s,
      conversations: s.conversations.map((c) => (c.messages.some((m) => m.id === id)
        ? { ...c, messages: c.messages.map((m) => (m.id === id ? { ...m, ...(typeof patch === 'function' ? patch(m) : patch) } : m)) }
        : c)),
    }))
  }, [])

  const user = state.users.find((u) => u.id === state.currentUserId) || null

  // For real (Supabase) accounts: keep "last seen" fresh.
  const meId = user?.remote ? user.id : null

  useEffect(() => {
    if (!meId) return undefined

    const updateLastSeen = async () => {
      if (document.visibilityState !== 'visible') return
      const { error } = await supabase.rpc('touch_last_seen')
      if (error) console.error('Last-seen update failed:', error.message)
    }

    updateLastSeen()
    const interval = setInterval(updateLastSeen, 60_000)
    window.addEventListener('focus', updateLastSeen)
    document.addEventListener('visibilitychange', updateLastSeen)

    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', updateLastSeen)
      document.removeEventListener('visibilitychange', updateLastSeen)
    }
  }, [meId])

  // Live online status with Supabase Presence (no tables or SQL needed).
  useEffect(() => {
    if (!meId) return undefined

    const channel = supabase.channel('online-users', { config: { presence: { key: meId } } })

    channel
      .on('presence', { event: 'sync' }, () => {
        setOnlineUsers(Object.keys(channel.presenceState()))
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        // The moment someone goes offline, show "Last seen just now" without waiting for a reload.
        setState((s) => ({
          ...s,
          conversations: s.conversations.map((c) => (
            c.remoteUserId === key || c.peer?.userId === key
              ? { ...c, peer: { ...c.peer, lastSeenAt: nowISO() } }
              : c
          )),
        }))
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') await channel.track({ at: nowISO() })
      })

    return () => {
      setOnlineUsers([])
      supabase.removeChannel(channel)
    }
  }, [meId])

  // For real (Supabase) accounts: load other members and past chats, then listen for new messages live.
  useEffect(() => {
    if (!meId) return undefined
    let alive = true

    const toLocal = (conv, profile, msgs) => ({
      id: 'rc-' + conv.id,
      remoteId: conv.id,
      remoteUserId: profile.id,
      ownerId: meId,
      peer: peerFromRow(profile),
      messages: msgs.map((m) => ({ rid: m.id, from: m.sender_id === meId ? 'me' : 'peer', text: m.body, at: m.created_at, deliveredAt: m.delivered_at, seenAt: m.seen_at })),
    })

    // `hidden` = remote conversation ids I deleted that have nothing new since.
    // prune = true (full reload only): also drop my real chats that no longer exist on the server.
    const mergeConvs = (list, hidden = [], prune = false) => setState((s) => {
      const base = s.conversations.filter((c) => !(c.ownerId === meId && c.remoteId && hidden.includes(c.remoteId)))
      const matched = new Set()
      const merged = list.map((n) => {
        const old = base.find((c) => c.ownerId === meId && ((c.remoteId && c.remoteId === n.remoteId) || (!c.remoteId && c.remoteUserId && c.remoteUserId === n.remoteUserId)))
        if (!old) return n
        matched.add(old.id)
        const clr = clearsRef.current[n.remoteId]
        const keepSystem = old.messages.filter((m) => m.from === 'system' && (!clr || new Date(m.at) > new Date(clr)))
        return { ...n, id: old.id, messages: [...keepSystem, ...n.messages] }
      })
      return { ...s, conversations: [...merged, ...base.filter((c) => !matched.has(c.id) && !(prune && c.ownerId === meId && c.remoteId))] }
    })

    let warnedExpired = false
    const loadAll = async () => {
      try {
        // The app can think you are signed in while Supabase has no valid session (expired or revoked refresh token).
        // Then every request runs as "anon" and fails with 401, so say so once instead of failing silently.
        const { data: authNow } = await supabase.auth.getSession()
        if (!authNow?.session) {
          if (!warnedExpired) { warnedExpired = true; toast('Your login session expired. Log out and log in again.') }
          return
        }

        // I am online now, so anything sent to me while I was away counts as delivered.
        supabase.rpc('mark_all_delivered').then(({ error }) => { if (error) console.error('mark_all_delivered failed:', error.message) })

        const { data: profs } = await supabase.from('profiles').select('*').eq('status', 'approved')
        // My own row too, so an approval or rejection that happens while I am online shows up.
        const { data: mine } = await supabase.from('profiles').select('*').eq('id', meId).maybeSingle()
        if (alive && profs) {
          const approvedIds = new Set(profs.map((p) => p.id))
          setState((s) => withRemote(pruneRemote(s, approvedIds), mine && mine.status !== 'approved' ? [...profs, mine] : profs))
        }

        // People I blocked, and chats I deleted (and when).
        const { data: blks } = await supabase.from('blocks').select('blocked_id').eq('blocker_id', meId)
        if (alive && blks) setBlockedRemote(blks.map((b) => b.blocked_id))
        const { data: clrs } = await supabase.from('conversation_clears').select('conversation_id, cleared_at').eq('user_id', meId)
        if (clrs) clearsRef.current = Object.fromEntries(clrs.map((c) => [c.conversation_id, c.cleared_at]))

        // My notifications (created by database triggers)
        const { data: nts, error: ntsErr } = await supabase.from('notifications').select('*').eq('user_id', meId).order('created_at', { ascending: false }).limit(50)
        // An empty list with no error usually means row-level security hides the rows; an error says what is wrong.
        if (ntsErr) console.error('Notifications load failed:', ntsErr.message)
        if (alive && nts) setRemoteNotifs(nts)

        // My watchlist (investors). Row-level security returns only my own rows.
        // Sample startups have no account, so their saves stay local (ids that do not start with "r-").
        const { data: saves } = await supabase.from('saved_startups').select('startup_id').eq('investor_id', meId)
        if (alive && saves) {
          const remoteIds = saves.map((x) => eid(x.startup_id))
          setState((s) => {
            const localOnly = (s.saved[meId] || []).filter((id) => !String(id).startsWith('r-'))
            return { ...s, saved: { ...s.saved, [meId]: [...new Set([...remoteIds, ...localOnly])] } }
          })
        }

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

        // Mentorship sessions, my registrations (hosts also see who registered), and seats taken
        const { data: sess } = await supabase.from('sessions').select('*').order('starts_at', { ascending: true })
        const { data: sessRegs } = await supabase.from('session_registrations').select('*')
        const { data: seatCounts } = await supabase.rpc('session_seat_counts')
        // Meeting links: row-level security returns ONLY the links I am allowed to read
        // (my own sessions as host, or sessions I may join as a student).
        const { data: privRows } = await supabase.from('session_private').select('session_id, meeting_link')

        if (alive && sess) {
          const takenBy = Object.fromEntries((seatCounts || []).map((c) => [c.session_id, Number(c.taken)]))
          const linkBy = Object.fromEntries((privRows || []).map((p) => [p.session_id, p.meeting_link]))
          setState((s) => {
            const sessIds = new Set(sess.map((x) => x.id))
            return {
              ...s,
              sessions: [
                ...sess.map((x) => sessFromRow(x, (sessRegs || []).filter((r) => r.session_id === x.id), takenBy[x.id], linkBy[x.id])),
                // Keep local-only (demo) sessions, but drop real ones that no longer exist on the server.
                ...s.sessions.filter((x) => !sessIds.has(x.id) && !x.remote),
              ],
            }
          })
        }

        const { data: convs, error: convErr } = await supabase.from('conversations').select('*')
        if (!alive || convErr) return
        if (!convs?.length) { mergeConvs([], [], true); return } // no chats on the server: drop any stale cached ones

        const { data: msgs } = await supabase.from('messages').select('*').in('conversation_id', convs.map((c) => c.id)).order('created_at', { ascending: true })
        const otherIds = convs.map((c) => (c.user_a === meId ? c.user_b : c.user_a))
        const { data: others } = await supabase.from('profiles').select('*').in('id', otherIds)
        if (!alive) return

        // Deleted chats: hide messages older than my cleared_at, and hide the chat if nothing is newer.
        const clr = clearsRef.current
        const hidden = []
        const list = convs.map((c) => {
          const profile = (others || []).find((p) => p.id === (c.user_a === meId ? c.user_b : c.user_a))
          if (!profile) return null
          const visible = (msgs || []).filter((m) => m.conversation_id === c.id && (!clr[c.id] || new Date(m.created_at) > new Date(clr[c.id])))
          if (clr[c.id] && visible.length === 0) { hidden.push(c.id); return null }
          return toLocal(c, profile, visible)
        }).filter(Boolean)

        mergeConvs(list, hidden, true)
      } catch { /* offline: keep what we already have */ }
    }

    const receive = async (m) => {
      if (m.sender_id === meId) return // my own messages are already on screen

      const clr = clearsRef.current[m.conversation_id]
      if (clr && new Date(m.created_at) <= new Date(clr)) return // older than my delete

      const known = stateRef.current.conversations.find((c) => c.remoteId === m.conversation_id)
      if (known) {
        setState((s) => ({
          ...s,
          conversations: s.conversations.map((c) => (c.remoteId !== m.conversation_id || c.messages.some((x) => x.rid === m.id)
            ? c
            : { ...c, messages: [...c.messages, { rid: m.id, from: 'peer', text: m.body, at: m.created_at, deliveredAt: m.delivered_at, seenAt: m.seen_at }] })),
        }))
        supabase.rpc('mark_delivered', { conv_id: m.conversation_id }).then(({ error }) => { if (error) console.error('mark_delivered failed:', error.message) })
        return
      }

      // Not in my list (new chat, or one I deleted): load it again. A deleted chat comes back with only the new messages.
      try {
        const { data: conv } = await supabase.from('conversations').select('*').eq('id', m.conversation_id).single()
        if (!conv) return
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', conv.user_a === meId ? conv.user_b : conv.user_a).single()
        const { data: msgs } = await supabase.from('messages').select('*').eq('conversation_id', conv.id).order('created_at', { ascending: true })
        if (!profile || !alive) return
        const visible = (msgs || [m]).filter((x) => !clr || new Date(x.created_at) > new Date(clr))
        setState((s) => withRemote(s, [profile]))
        mergeConvs([toLocal(conv, profile, visible)])
        supabase.rpc('mark_delivered', { conv_id: conv.id }).then(({ error }) => { if (error) console.error('mark_delivered failed:', error.message) })
      } catch { /* ignore */ }
    }

    // The other person received or read a message: update its ticks live.
    const applyReceipt = (row) => {
      if (!row?.id) return
      setState((s) => ({
        ...s,
        conversations: s.conversations.map((c) => (c.remoteId !== row.conversation_id
          ? c
          : { ...c, messages: c.messages.map((m) => (m.rid === row.id ? { ...m, deliveredAt: row.delivered_at, seenAt: row.seen_at } : m)) })),
      }))
    }

    // Requests, challenges, responses and sessions: any change simply triggers a (debounced) reload.
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
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, (payload) => applyReceipt(payload.new))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mentorship_requests' }, reloadSoon)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'challenges' }, reloadSoon)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'challenge_responses' }, reloadSoon)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions' }, reloadSoon)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'session_registrations' }, reloadSoon)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'session_private' }, reloadSoon)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: 'user_id=eq.' + meId }, (payload) => {
        setRemoteNotifs((n) => (n.some((x) => x.id === payload.new.id) ? n : [payload.new, ...n]))
        toast(payload.new.title)
      })
      .subscribe()

    window.addEventListener('focus', loadAll)

    return () => {
      alive = false
      clearTimeout(timer)
      syncRef.current = null
      setBlockedRemote([])
      setRemoteNotifs([])
      clearsRef.current = {}
      window.removeEventListener('focus', loadAll)
      supabase.removeChannel(channel)
    }
  }, [meId])

  const entityOf = useCallback((u) => {
    if (!u?.refId) return null
    const list = { investor: state.investors, student: state.students, startup: state.startups, professional: state.mentors }[u.role]
    return list?.find((x) => x.id === u.refId) || null
  }, [state])

  const refreshChats = useCallback(() => {
    syncRef.current?.()
  }, [])

  // Try sending a failed message again.
  const retryMessage = useCallback((convId, localId) => {
    const s = stateRef.current
    const conv = s.conversations.find((c) => c.id === convId)
    const msg = conv?.messages.find((m) => m.localId === localId)
    const me = s.users.find((u) => u.id === s.currentUserId)
    if (!conv || !msg || !me?.remote || !conv.remoteUserId) return

    setState((st) => ({
      ...st,
      conversations: st.conversations.map((c) => (c.id === convId
        ? { ...c, messages: c.messages.map((m) => (m.localId === localId ? { ...m, status: 'sending' } : m)) }
        : c)),
    }))
    sendRemote({ setState, toast, convId, remoteId: conv.remoteId, remoteUserId: conv.remoteUserId, meId: me.id, text: msg.text, localId })
  }, [toast])

  // Call when the person is looking at a chat: tells the sender their messages were read.
  const markSeen = useCallback(async (convId) => {
    const s0 = stateRef.current
    const conv = s0.conversations.find((c) => c.id === convId)
    if (!conv) return

    // Demo chat: remember what I have read, and show "Seen" on the other demo account's messages.
    if (!conv.remoteId && !conv.remoteUserId) {
      const me = s0.currentUserId
      const read = new Set(s0.readMessages?.[me] || [])
      const fresh = conv.messages.filter((m) => m.from === 'peer' && m.id && !read.has(m.id))
      if (!fresh.length) return
      const at = nowISO()
      const srcIds = new Set(fresh.map((m) => m.srcId).filter(Boolean))
      setState((s) => ({
        ...s,
        readMessages: { ...s.readMessages, [me]: [...new Set([...(s.readMessages?.[me] || []), ...fresh.map((m) => m.id)])] },
        conversations: s.conversations.map((c) => (c.messages.some((m) => m.from === 'me' && srcIds.has(m.id))
          ? { ...c, messages: c.messages.map((m) => (m.from === 'me' && srcIds.has(m.id) ? { ...m, deliveredAt: m.deliveredAt || at, seenAt: at } : m)) }
          : c)),
      }))
      return
    }

    if (!conv.remoteId) return
    const hasUnseen = conv.messages.some((m) => m.from === 'peer' && m.rid && !m.seenAt)
    if (!hasUnseen) return

    const { error } = await supabase.rpc('mark_seen', { conv_id: conv.remoteId })
    if (error) { console.error('mark_seen failed:', error.message); return }

    const at = nowISO()
    setState((s) => ({
      ...s,
      conversations: s.conversations.map((c) => (c.id !== convId
        ? c
        : {
          ...c,
          messages: c.messages.map((m) => (m.from === 'peer' && m.rid && !m.seenAt
            ? { ...m, seenAt: at, deliveredAt: m.deliveredAt || at }
            : m)),
        })),
    }))
  }, [])

  // Unread count for each of my chats (real and demo), and the total for the sidebar badge.
  const unreadByConv = useMemo(() => {
    const out = {}
    const read = new Set(state.readMessages?.[state.currentUserId] || [])
    state.conversations.forEach((c) => {
      if (c.ownerId !== state.currentUserId) return
      const n = unreadOf(c, read)
      if (n > 0) out[c.id] = n
    })
    return out
  }, [state.conversations, state.currentUserId, state.readMessages])

  const unreadTotal = useMemo(() => Object.values(unreadByConv).reduce((a, b) => a + b, 0), [unreadByConv])

  // People I blocked: Supabase user ids (real) plus demo contact refIds saved in local state.
  const blockedIds = useMemo(
    () => [...new Set([...blockedRemote, ...(state.blocked?.[state.currentUserId] || [])])],
    [blockedRemote, state.blocked, state.currentUserId]
  )

  const api = useMemo(() => ({
    // Demo accounts are checked first (works offline). Everything else goes to Supabase.
    async login(email, password) {
      const em = email.trim().toLowerCase()
      const local = DEMO_ENABLED ? state.users.find((x) => x.password && x.email.toLowerCase() === em) : null
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


    async docUrl(path) {
      const { data, error } = await supabase.storage.from('kyc-docs').createSignedUrl(path, 60)
      if (error) { toast(error.message); return null }
      return data.signedUrl
    },

    setCurrent(id) { setState((s) => ({ ...s, currentUserId: id })) },

    logout() {
      supabase.auth.signOut().catch(() => { })
      // Production: forget everything about the previous member (messages, other members' data).
      setState((s) => (DEMO_ENABLED ? { ...s, currentUserId: null } : initial()))
    },

    async register(data) {
      const { role, name, password, profile, raw, docs, files = [] } = data
      const email = data.email.trim()
      if (DEMO_ENABLED && state.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) return { error: 'An account with this email already exists.' }
      try {
        let userId
        let resubmit = false

        const { data: res, error } = await supabase.auth.signUp({ email, password })
        if (error) {
          const exists = error.code === 'user_already_exists' || /already (been )?registered/i.test(error.message || '')
          if (!exists) throw error
          // The email already has an account. Only a REJECTED application may be sent again,
          // and only by someone who knows the password.
          const { data: si, error: siErr } = await supabase.auth.signInWithPassword({ email, password })
          if (siErr) return { error: 'An account with this email already exists. Log in, or use “Forgot password”.' }
          const { data: old } = await supabase.from('profiles').select('status').eq('id', si.user.id).maybeSingle()
          if (old && old.status !== 'rejected') {
            await supabase.auth.signOut()
            return { error: 'An account with this email already exists. Please log in.' }
          }
          userId = si.user.id
          resubmit = !!old // no profile row means an earlier sign-up stopped half way: create it now
        } else {
          if (!res.session) return { error: 'Supabase is asking for email confirmation. Turn off "Confirm email" in Supabase (Authentication, Sign In / Providers, Email).' }
          userId = res.user.id
        }

        // Upload the real files into this user's own folder.
        const uploaded = []
        let failed = 0
        for (const f of files) {
          const ext = (f.file.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '')
          const path = `${userId}/${f.key}-${Date.now()}.${ext}`
          const { error: upErr } = await supabase.storage.from('kyc-docs').upload(path, f.file, { contentType: f.file.type, upsert: false })
          if (upErr) { console.error('Upload failed:', upErr.message); failed++; continue }
          uploaded.push({ key: f.key, label: f.label, name: f.file.name, path })
        }

        const row = {
          id: userId, full_name: name, role, email,
          country: raw?.country ?? null, bio: raw?.bio ?? null,
          keywords: raw?.interests || raw?.fields || raw?.sectors || [],
          details: { profile, raw, docs, files: uploaded },
        }

        if (resubmit) {
          const { error: rErr } = await supabase.rpc('resubmit_application', {
            p_full_name: name, p_role: role, p_country: row.country, p_bio: row.bio, p_keywords: row.keywords, p_details: row.details,
          })
          if (rErr) { await supabase.auth.signOut(); return { error: rErr.message } }
        } else {
          const { error: pErr } = await supabase.from('profiles').insert(row)
          if (pErr) { await supabase.auth.signOut(); return { error: pErr.message } }
        }

        if (failed) toast(`${failed} file(s) could not be uploaded. The admin may ask you to send them again.`)

        const u = fromRow({ ...row, status: 'pending', is_admin: false, created_at: nowISO() })
        setState((s) => ({ ...s, users: [...s.users.filter((x) => x.id !== u.id), u], currentUserId: u.id }))
        return { user: u }
      } catch (err) {
        const offline = err?.name === 'AuthRetryableFetchError' || err instanceof TypeError
        // Only the demo may fall back to a local, in-browser account. A real build must never do this.
        if (DEMO_ENABLED && offline) return registerLocal(setState, { ...data, email })
        return { error: offline ? 'Could not reach the server. Check your connection and try again.' : (err?.message || 'Could not create the account.') }
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
      setState((s) => {
        const u = s.users.find((x) => x.id === userId)
        const next = { ...s }
        // A rejected member must not stay listed (startup card, mentor profile, ...).
        if (u?.remote && u.refId) ENTITY_LISTS.forEach((k) => { next[k] = s[k].filter((e) => e.id !== u.refId) })
        next.users = s.users.map((x) => (x.id === userId ? { ...x, status: 'rejected', rejectReason: reason, reviewedAt: nowISO(), refId: undefined } : x))
        return next
      })
      return {}
    },

    updateEntity(listKey, id, patch) {
      setState((s) => ({ ...s, [listKey]: s[listKey].map((x) => (x.id === id ? { ...x, ...patch } : x)) }))
    },

    // Save / unsave a startup on my watchlist.
    // Demo accounts and sample startups: local state only.
    // Real investor + real startup: also saved in Supabase (saved_startups), with rollback if it fails.
    async toggleSave(startupId) {
      const me = state.users.find((u) => u.id === state.currentUserId)
      const startup = state.startups.find((x) => x.id === startupId)
      const wasSaved = (state.saved[state.currentUserId] || []).includes(startupId)

      const setLocal = (on) => setState((s) => {
        const cur = s.saved[s.currentUserId] || []
        const nextList = on ? (cur.includes(startupId) ? cur : [...cur, startupId]) : cur.filter((x) => x !== startupId)
        return { ...s, saved: { ...s.saved, [s.currentUserId]: nextList } }
      })

      setLocal(!wasSaved) // instant feedback

      if (me?.remote && startup?.userId) {
        const { error } = wasSaved
          ? await supabase.from('saved_startups').delete().eq('investor_id', me.id).eq('startup_id', startup.userId)
          : await supabase.from('saved_startups').insert({ investor_id: me.id, startup_id: startup.userId })
        // 23505 = already saved (for example from another tab): not an error for the person.
        if (error && error.code !== '23505') {
          setLocal(wasSaved) // roll back
          toast(error.message)
        }
      }
    },

    // Opens (or creates) a conversation for the current user with a peer. Returns its id.
    startChat(peer, opener) {
      const me = state.users.find((u) => u.id === state.currentUserId)
      const found = me?.remote ? peerUserId(state, peer) : undefined
      const targetId = found && found !== me.id ? found : undefined
      // A real person needs userId + lastSeenAt on the peer, otherwise the chat shows no online / last seen status.
      const target = targetId ? state.users.find((u) => u.id === targetId) : null
      const realPeer = targetId ? { ...peer, userId: targetId, lastSeenAt: peer.lastSeenAt || target?.lastSeenAt || null } : peer

      const existing = state.conversations.find((c) => c.ownerId === state.currentUserId && (targetId ? c.remoteUserId === targetId : (c.peer.refId === peer.refId || c.peer.name === peer.name)))
      if (existing) {
        // Chats saved before this fix may lack the fields: add them.
        if (targetId && !existing.peer?.userId) {
          setState((s) => ({ ...s, conversations: s.conversations.map((c) => (c.id === existing.id ? { ...c, peer: { ...c.peer, ...realPeer } } : c)) }))
        }
        return existing.id
      }

      const id = uid('cv')
      const conv = { id, ownerId: state.currentUserId, peer: realPeer, remoteUserId: targetId, messages: opener ? [{ from: 'system', text: opener, at: nowISO() }] : [] }
      pending.current[id] = conv
      setState((s) => ({ ...s, conversations: [conv, ...s.conversations] }))
      return id
    },

    // kindHint is used when the conversation was created in this same tick.
    sendMessage(convId, text, kindHint) {
      const conv = state.conversations.find((c) => c.id === convId) || pending.current[convId]
      const me = state.users.find((u) => u.id === state.currentUserId)

      // I blocked this person: ignore the send.
      const myBlocked = [...(state.blocked?.[state.currentUserId] || []), ...blockedRemote]
      const peerKey = conv?.remoteUserId || conv?.peer?.userId || conv?.peer?.refId
      if (conv && peerKey && myBlocked.includes(peerKey)) {
        toast('You blocked this person. Unblock to send messages.')
        return
      }

      const localId = uid('m')
      const isRemote = !!(conv?.remoteUserId && me?.remote)

      setState((s) => ({
        ...s,
        conversations: s.conversations.map((c) =>
          c.id === convId
            ? { ...c, messages: [...c.messages, { localId, ...(isRemote ? {} : { id: localId }), from: 'me', text, at: nowISO(), status: isRemote ? 'sending' : 'sent' }] }
            : c
        ),
      }))

      if (isRemote) {
        // Real person on the other side: save to Supabase, no fake reply.
        sendRemote({ setState, toast, convId, remoteId: conv.remoteId, remoteUserId: conv.remoteUserId, meId: me.id, text, localId })
        return
      }

      const other = conv && me && !me.remote
        ? state.users.find((u) =>
          !u.remote &&
          u.id !== me.id &&
          (
            (conv.remoteUserId && u.id === conv.remoteUserId) ||
            (conv.peer?.userId && u.id === conv.peer.userId) ||
            (me.refId && conv.peer?.refId && u.refId === conv.peer.refId)
          )
        )
        : null
      const blockedByOther = !!other && (state.blocked?.[other.id] || []).includes(me.refId)

      if (other && !blockedByOther) setState((s) => demoDeliver(s, me, other, text, localId))

      // Simulated ticks: sent now, delivered after about 1 second,
      // seen after about 3 seconds for sample contacts when FAKE_REPLIES is on
      // (a real demo account marks it seen when they open the chat).
      if (!blockedByOther) {
        timers.current.push(setTimeout(() => patchMsg(localId, (m) => ({ deliveredAt: m.deliveredAt || nowISO() })), 1000))
        if (FAKE_REPLIES && !other) {
          timers.current.push(setTimeout(() => patchMsg(localId, (m) => ({ deliveredAt: m.deliveredAt || nowISO(), seenAt: nowISO() })), 3000))
        }
      }

      const kind = conv?.peer.kind || kindHint
      if (!kind || !FAKE_REPLIES) return

      const pool = demo.autoReplies[kind] || demo.autoReplies.professional
      const reply = pool[(conv?.messages.filter((m) => m.from === 'peer').length || 0) % pool.length]

      timers.current.push(setTimeout(() => setTyping((t) => ({ ...t, [convId]: true })), 600))
      timers.current.push(setTimeout(() => {
        setTyping((t) => ({ ...t, [convId]: false }))
        setState((s) => ({
          ...s,
          conversations: s.conversations.map((c) =>
            c.id === convId
              ? { ...c, messages: [...c.messages, { id: uid('m'), from: 'peer', text: reply, at: nowISO() }] }
              : c
          ),
        }))
      }, 2200))
    },

    // Block someone. targetId = Supabase user id (real chats) or the contact's refId (demo chats).
    async blockUser(targetId) {
      const me = state.users.find((u) => u.id === state.currentUserId)
      if (!me || !targetId) return false

      if (me.remote && UUID_RE.test(targetId)) {
        const { error } = await supabase.from('blocks').insert({ blocker_id: me.id, blocked_id: targetId })
        if (error && error.code !== '23505') { toast(error.message); return false }
        setBlockedRemote((b) => (b.includes(targetId) ? b : [...b, targetId]))
        toast('Blocked.')
        return true
      }

      // Demo accounts: local state only.
      setState((s) => {
        const cur = s.blocked?.[s.currentUserId] || []
        return cur.includes(targetId) ? s : { ...s, blocked: { ...(s.blocked || {}), [s.currentUserId]: [...cur, targetId] } }
      })
      toast('Blocked.')
      return true
    },

    async unblockUser(targetId) {
      const me = state.users.find((u) => u.id === state.currentUserId)
      if (!me || !targetId) return false

      if (me.remote && UUID_RE.test(targetId)) {
        const { error } = await supabase.from('blocks').delete().eq('blocker_id', me.id).eq('blocked_id', targetId)
        if (error) { toast(error.message); return false }
        setBlockedRemote((b) => b.filter((x) => x !== targetId))
        toast('Unblocked.')
        return true
      }

      setState((s) => ({ ...s, blocked: { ...(s.blocked || {}), [s.currentUserId]: (s.blocked?.[s.currentUserId] || []).filter((x) => x !== targetId) } }))
      toast('Unblocked.')
      return true
    },

    // Delete a chat from MY side only. Real chats record a "cleared at" time in Supabase.
    // If the other person writes again, the chat comes back with only the new messages.
    async deleteChat(convId) {
      const me = state.users.find((u) => u.id === state.currentUserId)
      const conv = state.conversations.find((c) => c.id === convId)
      if (!conv) return false

      if (me?.remote && conv.remoteId) {
        const { error } = await supabase.rpc('clear_conversation', { conv_id: conv.remoteId })
        if (error) { toast(error.message); return false }
        // Use the server's time, so the clock on this device cannot hide new messages.
        const { data: row } = await supabase.from('conversation_clears').select('cleared_at').eq('conversation_id', conv.remoteId).eq('user_id', me.id).maybeSingle()
        clearsRef.current = { ...clearsRef.current, [conv.remoteId]: row?.cleared_at || nowISO() }
      }

      delete pending.current[convId]
      setState((s) => ({ ...s, conversations: s.conversations.filter((c) => c.id !== convId) }))
      toast('Chat deleted.')
      return true
    },

    requestMentorship(studentId, mentorId, message) {
      const me = state.users.find((u) => u.id === state.currentUserId)
      const mentorUserId = state.mentors.find((m) => m.id === mentorId)?.userId

      if (me?.remote && mentorUserId) {
        // Real student and real mentor: the request is saved so the mentor receives it.
        ; (async () => {
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
        ; (async () => {
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

          // Messages from the other person get an id, so they count as unread until the chat is opened.
          if (proUser && st) add.push({ id: uid('cv'), ownerId: proUser.id, peer: { name: st.name, initials: st.initials, color: st.color, subtitle: `Mentee · ${st.institution}`, kind: 'student', refId: st.id }, messages: [{ id: uid('m'), from: 'peer', text: req.message, at: req.at }, { id: uid('m'), from: 'me', text: welcome, at: nowISO(), status: 'sent' }] })

          if (stuUser && m) add.push({ id: uid('cv'), ownerId: stuUser.id, peer: { name: m.name, initials: m.initials, color: m.color, subtitle: `${m.title}, ${m.company}`, kind: 'mentor', refId: m.id }, messages: [{ id: uid('m'), from: 'me', text: req.message, at: req.at, status: 'sent' }, { from: 'system', text: `${m.name} accepted your mentorship request.`, at: nowISO() }, { id: uid('m'), from: 'peer', text: welcome, at: nowISO() }] })

          conversations = [...add, ...conversations]
        }

        return { ...s, conversations, requests: s.requests.map((r) => (r.id === reqId ? { ...r, status } : r)) }
      })
    },

    // Mentors host sessions. Real mentors save to Supabase; demo accounts stay in this browser.
    // data.startsAt must be a real timestamp, e.g. new Date(`${date}T${time}:00+05:45`).toISOString()
    // data.meetingLink is optional (real accounts only). It is saved in the private table, never in "sessions".
    // Returns the new session, or null if it could not be saved.
    async createSession(data) {
      const me = state.users.find((u) => u.id === state.currentUserId)

      if (me?.remote) {
        // Check the link first, so a bad link never creates half a session.
        const v = validateMeetingLink(data.meetingLink)
        if (!v.ok) { toast(v.error); return null }

        const { data: row, error } = await supabase.from('sessions').insert({
          title: data.title,
          keyword: data.keyword,
          starts_at: data.startsAt,
          duration_min: Number(data.duration) || 60,
          seats: Number(data.seats) || 50,
          platform: data.platform ?? data.mode ?? 'Zoom',
          description: data.desc || '',
          is_paid: !!data.isPaid,
          price_npr: data.isPaid ? Number(data.price) : null,
          pay_method: data.isPaid ? data.payMethod : null,
          pay_account: data.isPaid ? data.payAccount : null,
        }).select().single()

        if (error) { toast(error.message); return null }

        let savedLink = null
        if (v.url) {
          const { error: lErr } = await supabase.from('session_private').insert({ session_id: row.id, meeting_link: v.url })
          if (lErr) toast('Session created, but the meeting link was not saved. Add it from the session card.')
          else savedLink = v.url
        }

        const se = sessFromRow(row, [], undefined, savedLink)
        setState((s) => ({ ...s, sessions: [...s.sessions.filter((x) => x.id !== se.id), se] }))
        return se
      }

      // Demo accounts: no private links, everything works as before.
      const rest = { ...data }
      delete rest.meetingLink
      const se = { id: uid('se'), registered: [], ...rest }
      setState((s) => ({ ...s, sessions: [...s.sessions, se] }))
      return se
    },

    // Host: add or change the meeting link of one of my sessions. Returns true when saved.
    async setMeetingLink(sessionId, link) {
      const se = state.sessions.find((x) => x.id === sessionId)
      if (!se?.remote) return false

      const v = validateMeetingLink(link)
      if (!v.ok) { toast(v.error); return false }
      if (!v.url) { toast('Paste a meeting link first.'); return false }

      const { error } = await supabase.from('session_private').upsert({ session_id: sessionId, meeting_link: v.url }, { onConflict: 'session_id' })
      if (error) {
        toast(error.code === '23514' ? 'That link is not accepted. Use a Zoom, Google Meet or Teams link.' : error.message)
        return false
      }

      setState((s) => ({ ...s, sessions: s.sessions.map((x) => (x.id === sessionId ? { ...x, meetingLink: v.url } : x)) }))
      toast('Meeting link saved.')
      return true
    },

    // Register for a session, or cancel the registration. (studentId is the student's platform record id.)
    async toggleRegister(sessionId, studentId) {
      const se = state.sessions.find((x) => x.id === sessionId)

      if (se?.remote) {
        const already = se.registered.includes(studentId)
        const { error } = already
          ? await supabase.from('session_registrations').delete().eq('session_id', sessionId).eq('student_id', meId)
          : await supabase.rpc('register_session', { p_session: sessionId })
        if (error) { toast(error.message); return false }
        syncRef.current?.()
        return true
      }

      setState((s) => ({ ...s, sessions: s.sessions.map((x) => (x.id !== sessionId ? x : { ...x, registered: x.registered.includes(studentId) ? x.registered.filter((y) => y !== studentId) : [...x.registered, studentId] })) }))
      return true
    },

    // Student: "I have paid" for a paid session. The mentor then confirms it.
    async claimPayment(sessionId, proof = null) {
      const { error } = await supabase.rpc('claim_payment', { p_session: sessionId, p_proof: proof })
      if (error) { toast(error.message); return }
      toast('Payment marked. The mentor will confirm it.')
      syncRef.current?.()
    },

    // Mentor: confirm that a student's payment arrived. studentUserId is the student's Supabase user id
    // (it is in session.regs[].studentId).
    async confirmPayment(sessionId, studentUserId) {
      const { error } = await supabase.rpc('confirm_payment', { p_session: sessionId, p_student: studentUserId })
      if (error) { toast(error.message); return }
      toast('Payment confirmed.')
      syncRef.current?.()
    },

    // data.prize is optional: a positive whole number (NPR) or empty. Saved as challenges.prize_amount.
    postChallenge(data) {
      const me = state.users.find((u) => u.id === state.currentUserId)
      const prize = normPrize(data.prize)

      if (me?.remote) {
        // Saved to Supabase so every member (mentors included) sees it.
        ; (async () => {
          try {
            const { data: row, error } = await supabase.from('challenges').insert({
              poster_id: me.id, poster_type: 'startup',
              title: data.title, category: data.category, urgency: data.urgency, tags: data.tags || [], description: data.desc || '',
              prize_amount: prize,
            }).select().single()
            if (error) { toast(error.message); return }
            setState((s) => ({ ...s, challenges: [challFromRow(row), ...s.challenges.filter((c) => c.id !== row.id)] }))
          } catch { toast('Could not post. Check your connection.') }
        })()
        return
      }

      setState((s) => ({ ...s, challenges: [{ id: uid('c'), at: nowISO(), responses: [], ...data, prize }, ...s.challenges] }))
    },

    respondChallenge(challengeId, responder, text, posterPeer) {
      const ch = state.challenges.find((c) => c.id === challengeId)
      const me = state.users.find((u) => u.id === state.currentUserId)

      if (ch?.remote && me?.remote) {
        // The database function saves the idea and delivers it to the poster as a chat message.
        ; (async () => {
          try {
            const { data: rid, error } = await supabase.rpc('respond_challenge', { challenge_id: challengeId, response_body: text })
            if (error) { toast(error.message); return }
            setState((s) => ({ ...s, challenges: s.challenges.map((c) => (c.id === challengeId && !c.responses.some((x) => x.rid === rid) ? { ...c, responses: [...c.responses, { rid, ...responder, text, at: nowISO() }] } : c)) }))
            if (syncRef.current) syncRef.current()
          } catch { toast('Could not send. Check your connection.') }
        })()
        return
      }

      // Demo: the idea shows in the list at once, goes into my chat with the poster,
      // and is delivered to the poster if they are a demo account (unless they blocked me).
      const msgId = uid('m')
      setState((s) => {
        const chal = s.challenges.find((c) => c.id === challengeId)
        const intro = `Solution suggested on “${chal?.title}”`
        const mine = [{ from: 'system', text: intro, at: nowISO() }, { id: msgId, localId: msgId, from: 'me', text, at: nowISO(), status: 'sent' }]
        const existing = posterPeer && s.conversations.find((c) => c.ownerId === s.currentUserId && (c.peer.refId === posterPeer.refId || c.peer.name === posterPeer.name))

        let next = {
          ...s,
          conversations: existing
            ? s.conversations.map((c) => (c.id === existing.id ? { ...c, messages: [...c.messages, ...mine] } : c))
            : [{ id: uid('cv'), ownerId: s.currentUserId, peer: posterPeer, messages: mine }, ...s.conversations],
          challenges: s.challenges.map((c) => (c.id === challengeId ? { ...c, responses: [...c.responses, { ...responder, text, at: nowISO() }] } : c)),
        }

        const poster = me && !me.remote && me.refId
          ? s.users.find((u) => !u.remote && u.id !== me.id && u.refId && u.refId === chal?.posterId)
          : null
        if (poster && !(s.blocked?.[poster.id] || []).includes(me.refId)) next = demoDeliver(next, me, poster, text, msgId, intro)
        return next
      })
      timers.current.push(setTimeout(() => patchMsg(msgId, (m) => ({ deliveredAt: m.deliveredAt || nowISO() })), 1000))
    },

    markNotifsRead(ids) {
      const me = state.users.find((u) => u.id === state.currentUserId)
      if (me?.remote) {
        // Real account: saved in Supabase, so it is the same on every device.
        const at = nowISO()
        setRemoteNotifs((n) => n.map((x) => (ids.includes(x.id) && !x.read_at ? { ...x, read_at: at } : x)))
        const dbIds = ids.filter((id) => UUID_RE.test(id)) // message notifications are calculated, not stored
        if (!dbIds.length) return
        supabase.from('notifications').update({ read_at: at }).in('id', dbIds).is('read_at', null)
          .then(({ error }) => { if (error) console.error('Mark read failed:', error.message) })
        return
      }
      setState((s) => ({ ...s, readNotifs: { ...s.readNotifs, [s.currentUserId]: [...new Set([...(s.readNotifs[s.currentUserId] || []), ...ids])] } }))
    },

    resetDemo() {
      try { localStorage.removeItem(KEY) } catch { /* ignore */ }
      setState(initial())
    },
  }), [state, toast, meId, blockedRemote, patchMsg])

  const value = {
    state,
    user,
    authReady,
    refreshChats,
    markSeen,
    retryMessage,
    unreadByConv,
    unreadTotal,
    blockedIds,
    entity: entityOf(user),
    entityOf,
    typing,
    onlineUsers,
    remoteNotifs,
    toast,
    ...api,
  }

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
  const { state, user, entity, remoteNotifs } = useStore()

  return useMemo(() => {
    // New messages: one notification per chat with unseen messages (real and demo chats), opening that exact chat.
    // These are calculated, not stored. They disappear as soon as the chat is opened and the messages are seen.
    const seenMsgs = new Set(state.readMessages?.[user?.id] || [])
    const isUnseen = (m) => m.from === 'peer' && !m.seenAt && (m.rid || (m.id && !seenMsgs.has(m.id)))
    const msgNotifs = !user ? [] : state.conversations.filter((c) => c.ownerId === user.id).flatMap((c) => {
      const fresh = c.messages.filter(isUnseen)
      if (!fresh.length) return []
      const last = fresh[fresh.length - 1]
      return [{
        id: `n-msg-${c.id}-${last.rid || last.id || last.at}`,
        live: true,
        icon: 'chat',
        text: fresh.length > 1 ? `${c.peer.name} sent you ${fresh.length} messages` : `${c.peer.name} sent you a message`,
        sub: (last.text || '').slice(0, 70),
        to: '/app/messages?c=' + c.id,
        at: last.at,
      }]
    })

    // Real accounts: read the saved notifications. Demo accounts keep the old calculated ones below.
    if (user?.remote) {
      return [
        ...remoteNotifs.map((n) => ({ id: n.id, icon: n.icon, text: n.title, sub: n.body || '', to: n.link || '/app', at: n.created_at, unread: !n.read_at })),
        ...msgNotifs.map((n) => ({ ...n, unread: true })),
      ].sort((a, b) => new Date(b.at) - new Date(a.at))
    }
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
        // Open the actual chat with that mentor when it exists, otherwise the Messages page.
        const chat = state.conversations.find((c) => c.ownerId === user.id && (c.peer?.refId === m?.id || c.peer?.name === m?.name))
        out.push({ id: 'n-' + r.id, icon: 'check', text: `${m?.name} accepted your mentorship request`, sub: 'Start the conversation in Messages', to: chat ? '/app/messages?c=' + chat.id : '/app/messages', at: r.at })
      })
    }

    if (user.role === 'professional') {
      state.requests.filter((r) => r.mentorId === entity.id && r.status === 'pending').forEach((r) => {
        const st = state.students.find((x) => x.id === r.studentId)
        out.push({ id: 'n-' + r.id, icon: 'user', text: `${st?.name} requested mentorship`, sub: r.message.slice(0, 70) + '…', to: '/app', at: r.at })
      })
      // Students who registered for a session I host.
      state.sessions.filter((se) => se.hostId === entity.id && new Date(se.date) > new Date()).forEach((se) => {
        se.registered.forEach((sid) => {
          const st = state.students.find((x) => x.id === sid)
          if (!st) return
          out.push({ id: `n-reg-${se.id}-${sid}`, icon: 'user', text: `${st.name} registered for your session`, sub: se.title, to: '/app/sessions', at: nowISO() })
        })
      })
    }


    if (user.role === 'startup') {

      state.challenges.filter((c) => c.posterId === entity.id).forEach((c) => c.responses.forEach((r, i) => {
        out.push({ id: `n-${c.id}-${i}`, icon: 'bulb', text: `${r.name} suggested a solution`, sub: c.title, to: '/app/helpdesk', at: r.at })
      }))
    }

    if (user.role === 'investor') {
      state.startups.filter((s) => (entity.sectors || []).includes(s.sector)).slice(0, 2).forEach((s) => out.push({ id: 'n-new-' + s.id, icon: 'rocket', text: `${s.name} matches your sectors`, sub: s.tagline.slice(0, 70), to: '/app/startups/' + s.id, at: nowISO() }))
    }

    return [...out, ...msgNotifs].sort((a, b) => new Date(b.at) - new Date(a.at)).map((n) => ({ ...n, unread: n.live || !read.includes(n.id) }))
  }, [state, user, entity, remoteNotifs])
}