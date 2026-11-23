/* eslint-disable react-refresh/only-export-components */
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Bell, CalendarDays, Check, Clock, ExternalLink, FileText, Link2, MapPin, MessageCircle, Sparkles, Star, Users, Video } from 'lucide-react'
import { Avatar, Empty, Modal, fmtTime, nptParts } from '../components/ui'
import { useStore, validateMeetingLink } from '../store'
import { recommendMentors, recommendSessions } from '../lib/recommend'

export const overlap = (a = [], b = []) => {
  const set = new Set(b.map((x) => String(x).toLowerCase().trim()))
  return a.filter((x) => set.has(String(x).toLowerCase().trim()))
}

const PAY_LABEL = { esewa: 'eSewa', khalti: 'Khalti', imepay: 'IME Pay', bank: 'Bank transfer' }

const hostOf = (link) => { try { return new URL(link).hostname } catch { return 'link' } }

// "Recommended because: ..." line shown under a recommended session.
const Why = ({ reasons }) => (reasons?.length
  ? <div className="xs muted row mt-3" style={{ gap: 4 }}><Sparkles size={11} /> Recommended because: {reasons.join(', ')}</div>
  : null)

// Host only (used on the mentor's "My sessions" cards): add or change the private meeting link.
export function MeetingLinkEditor({ se }) {
  const { setMeetingLink } = useStore()
  const [open, setOpen] = useState(false)
  const [val, setVal] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  if (!se.remote) return null

  const start = () => { setVal(se.meetingLink || ''); setErr(''); setOpen(true) }

  const save = async () => {
    const v = validateMeetingLink(val)
    if (!v.ok) { setErr(v.error); return }
    if (!v.url) { setErr('Paste a meeting link first.'); return }
    setBusy(true)
    setErr('')
    const ok = await setMeetingLink(se.id, v.url)
    setBusy(false)
    if (ok) setOpen(false)
  }

  if (!open) {
    return (
      <div className="row wrap mt-3 small" style={{ gap: 8 }}>
        <Video size={14} />
        {se.meetingLink
          ? <span>Meeting link added <span className="muted">({hostOf(se.meetingLink)})</span></span>
          : <span className="muted">No meeting link yet. Students can’t join until you add one.</span>}
        <button className="btn btn-ghost btn-sm" onClick={start}>{se.meetingLink ? 'Edit link' : 'Add link'}</button>
      </div>
    )
  }

  return (
    <div className="mt-3" style={{ background: 'var(--paper)', padding: 12, borderRadius: 12 }}>
      <div className="xs faint bold">MEETING LINK</div>
      <input className="input mt-2" value={val} onChange={(e) => { setVal(e.target.value); setErr('') }} placeholder="https://meet.google.com/abc-defg-hij" />
      {err && <div className="xs mt-1" style={{ color: '#dc2626' }}>{err}</div>}
      <p className="xs muted mt-1">Zoom, Google Meet or Microsoft Teams links only. Only registered students see it{se.isPaid ? ', after you confirm their payment' : ''}.</p>
      <div className="row mt-2" style={{ justifyContent: 'flex-end' }}>
        <button className="btn btn-ghost btn-sm" onClick={() => setOpen(false)}>Cancel</button>
        <button className="btn btn-primary btn-sm" disabled={!val.trim() || busy} onClick={save}>{busy ? 'Saving…' : 'Save link'}</button>
      </div>
    </div>
  )
}

export function SessionCard({ se, host, studentId, onToggle, matched, footer }) {
  const { user, claimPayment } = useStore()
  // Date tile and time are always shown in Nepal time, whatever timezone the viewer is in.
  const p = nptParts(se.date)
  const reg = studentId && se.registered.includes(studentId)
  const going = se.taken ?? se.registered.length
  const left = se.seats - going

  // My payment status for a paid session I registered for (real accounts only).
  const myReg = reg && se.remote && se.isPaid ? (se.regs || []).find((r) => r.studentId === user?.id) : null
  const payStatus = myReg?.payStatus
  // Once I have said "I've paid" (or the mentor confirmed), I can no longer release the seat.
  const locked = payStatus === 'claimed' || payStatus === 'confirmed'

  // Meeting link (real accounts only): free session = any registered student; paid session = only after the mentor confirmed.
  const linkAllowed = !!(reg && se.remote) && (!se.isPaid || payStatus === 'confirmed')
  const safeLink = se.meetingLink && validateMeetingLink(se.meetingLink).ok ? se.meetingLink : null

  return (
    <div className="card session-card">
      <div className="date-tile"><div className="m">{p.month}</div><div className="d">{p.day}</div><div className="xs muted">{p.weekday}</div></div>
      <div className="grow">
        <div className="row wrap" style={{ gap: 6 }}>
          <span className="chip chip-match">{se.keyword}</span>
          <span className={`chip ${se.isPaid ? '' : 'chip-match'}`}>{se.isPaid ? `NPR ${se.price}` : 'Free'}</span>
          {matched && <span className="badge badge-amber"><Sparkles size={11} /> Matches your interests</span>}
        </div>
        <div className="bold mt-2" style={{ fontSize: 16 }}>{se.title}</div>
        <p className="small muted mt-1">{se.desc}</p>
        <div className="row wrap mt-3 xs muted" style={{ gap: 14 }}>
          <span className="row" style={{ gap: 4 }}><Clock size={13} /> {fmtTime(se.date)} NPT · {se.duration} min</span>
          <span className="row" style={{ gap: 4 }}><Video size={13} /> {se.mode}</span>
          <span className="row" style={{ gap: 4 }}><Users size={13} /> {going} going · {left} seats left</span>
        </div>
        {host && <div className="row mt-3 small"><Avatar p={host} size="sm" /><span><b>{host.name}</b> <span className="muted">· {host.title}, {host.company} · {host.location}</span></span></div>}

        {myReg && (
          <div className="mt-3" style={{ background: 'var(--paper)', padding: 12, borderRadius: 12 }}>
            {payStatus === 'confirmed' ? (
              <div className="small row" style={{ gap: 6 }}><Check size={14} color="var(--green, #16a34a)" /> Payment confirmed. See you in the session.</div>
            ) : payStatus === 'claimed' ? (
              <div className="small">Waiting for the mentor to confirm your payment.</div>
            ) : (
              <>
                <div className="small"><b>Pay NPR {se.price}</b> via {PAY_LABEL[se.payMethod] || se.payMethod}: <b>{se.payAccount}</b></div>
                <p className="xs muted mt-1">After paying, tap the button so the mentor can confirm it.</p>
                <button className="btn btn-dark btn-sm mt-2" onClick={() => claimPayment(se.id)}>I’ve paid</button>
              </>
            )}
          </div>
        )}

        {reg && se.remote && (
          <div className="mt-3">
            {linkAllowed ? (
              safeLink
                ? <a className="btn btn-primary btn-sm" href={safeLink} target="_blank" rel="noopener noreferrer"><ExternalLink size={14} /> Join session</a>
                : <p className="small muted">The mentor will add the link soon.</p>
            ) : (
              <p className="small muted">The meeting link will appear here after the mentor confirms your payment.</p>
            )}
          </div>
        )}

        {footer}
      </div>
      {onToggle && (
        <div style={{ flexShrink: 0 }}>
          <button
            className={`btn btn-sm ${reg ? 'btn-success' : 'btn-dark'}`}
            disabled={(!reg && left <= 0) || locked}
            title={locked ? 'Payment already sent. Message the mentor to cancel.' : undefined}
            onClick={() => onToggle(se.id)}
          >
            {reg ? <><Check size={14} /> Registered</> : 'Reserve seat'}
          </button>
        </div>
      )}
    </div>
  )
}

export function StudentHome() {
  const { state, entity, toggleRegister, toast } = useStore()
  const upcoming = state.sessions.filter((s) => new Date(s.date) > new Date()).sort((a, b) => new Date(a.date) - new Date(b.date))
  const forMe = upcoming.filter((s) => entity.interests.includes(s.keyword))
  // Recommendations: text matching (interests, goal, bios, descriptions), not only identical keywords.
  const recSessions = recommendSessions(entity, upcoming, state.mentors, { minRelevance: 0.1 })
  const matches = recommendMentors(entity, state.mentors, { minRelevance: 0.1 }).map((r) => ({ m: r.item, common: r.reasons }))
  const myReqs = state.requests.filter((r) => r.studentId === entity.id)
  const [openMentor, setOpenMentor] = useState(null)

  // toggleRegister returns false when it failed (it already showed the error), so only celebrate real successes.
  const toggle = async (id) => {
    const se = state.sessions.find((s) => s.id === id)
    const was = se.registered.includes(entity.id)
    const ok = await toggleRegister(id, entity.id)
    if (ok) toast(was ? 'Seat released' : se.isPaid ? 'Seat reserved. Pay the mentor to confirm it.' : 'Seat reserved!')
  }

  return (
    <div className="page">
      <div className="page-head"><div><h1>Namaste, {entity.name.split(' ')[0]}</h1><p>{entity.institution} · {entity.level}</p></div></div>

      {forMe.length > 0 && (
        <div className="highlight-banner">
          <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(255,255,255,.16)', display: 'grid', placeItems: 'center', flexShrink: 0 }}><Bell size={22} /></div>
          <div className="grow">
            <div className="bold" style={{ fontSize: 17 }}>{forMe.length} upcoming session{forMe.length > 1 ? 's' : ''} match your interests</div>
            <div className="small" style={{ color: '#cdd2e4' }}>{state.mentors.find((m) => m.id === forMe[0].hostId)?.name} is hosting “{forMe[0].title}”</div>
          </div>
          <Link to="/app/sessions" className="btn btn-white">View sessions <ArrowRight size={16} /></Link>
          <svg viewBox="0 0 300 100" style={{ position: 'absolute', right: 0, bottom: 0, width: 300, opacity: .08, pointerEvents: 'none' }}><path d="M0 100 L60 40 L100 70 L160 10 L220 60 L260 35 L300 70 L300 100Z" fill="#fff" /></svg>
        </div>
      )}

      <div className="detail-grid mt-6">
        <div>
          <div className="row-between"><h3 style={{ fontSize: 22 }}>Sessions for you</h3><Link to="/app/sessions" className="small link">See all</Link></div>
          <div className="stack mt-4">
            {recSessions.length ? recSessions.slice(0, 3).map(({ item: se, reasons }) => <SessionCard key={se.id} se={se} host={state.mentors.find((m) => m.id === se.hostId)} studentId={entity.id} onToggle={toggle} matched={entity.interests.includes(se.keyword)} footer={<Why reasons={reasons} />} />)
              : <div className="card"><Empty icon={CalendarDays} title="No sessions for your interests yet" text="You’ll get a notification as soon as a mentor schedules one." /></div>}
          </div>

          <div className="row-between mt-8"><h3 style={{ fontSize: 22 }}>Mentors matched to you</h3><Link to="/app/mentors" className="small link">See all</Link></div>
          <div className="grid-2 mt-4">
            {matches.slice(0, 4).map(({ m, common }) => <MentorMini key={m.id} m={m} common={common} onOpen={(x) => setOpenMentor({ m: x, common })} />)}
          </div>
          {openMentor && <MentorDetails m={openMentor.m} common={openMentor.common} onClose={() => setOpenMentor(null)} />}
        </div>
        <div className="stack">
          <div className="card card-pad">
            <div className="xs faint bold">YOUR INTERESTS</div>
            <div className="row wrap mt-3" style={{ gap: 6 }}>{entity.interests.map((i) => <span key={i} className="chip chip-match">{i}</span>)}</div>
            <p className="xs muted mt-3">We match you with mentors and notify you about sessions using these keywords.</p>
            <Link to="/app/profile" className="btn btn-ghost btn-sm mt-3">Edit interests</Link>
          </div>
          <div className="card card-pad">
            <div className="xs faint bold">MY MENTORSHIP REQUESTS</div>
            {myReqs.length === 0 && <p className="small muted mt-3">No requests yet.</p>}
            {myReqs.map((r) => {
              const m = state.mentors.find((x) => x.id === r.mentorId)
              return (
                <div key={r.id} className="list-row">
                  <Avatar p={m} size="sm" />
                  <div className="grow"><div className="small bold">{m.name}</div><div className="xs muted">{m.company}</div></div>
                  <span className={`badge ${r.status === 'accepted' ? 'badge-green' : r.status === 'declined' ? 'badge-red' : 'badge-amber'}`}>{r.status}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

function MentorMini({ m, common, onOpen }) {
  return (
    <button type="button" onClick={() => onOpen(m)} className="card card-hover" style={{ padding: 16, display: 'block', width: '100%', textAlign: 'left', font: 'inherit', color: 'inherit', cursor: 'pointer' }}>
      <div className="row"><Avatar p={m} /><div className="grow"><div className="small bold">{m.name}</div><div className="xs muted">{m.title}, {m.company}</div></div></div>
      <div className="row wrap mt-3" style={{ gap: 6 }}>{common.map((c) => <span key={c} className="chip chip-match">{c}</span>)}</div>
    </button>
  )
}

const safeUrl = (u) => (/^https?:\/\//i.test(u || '') ? u : null)

// LinkedIn, portfolio and CV of a mentor, so students can get to know them.
function MentorLinks({ m }) {
  const { docUrl } = useStore()
  const [opening, setOpening] = useState(false)
  const openCv = async () => {
    setOpening(true)
    const url = await docUrl(m.cv.path)
    setOpening(false)
    if (url) window.open(url, '_blank', 'noopener,noreferrer')
  }
  const linkedin = safeUrl(m.linkedin)
  const portfolio = safeUrl(m.portfolio)
  if (!linkedin && !portfolio && !m.cv?.path) return null
  return (
    <div>
      <div className="xs faint bold">GET TO KNOW THEM</div>
      <div className="row wrap mt-2" style={{ gap: 8 }}>
        {linkedin && <a className="btn btn-soft btn-sm" href={linkedin} target="_blank" rel="noopener noreferrer"><Link2 size={14} /> LinkedIn</a>}
        {portfolio && <a className="btn btn-soft btn-sm" href={portfolio} target="_blank" rel="noopener noreferrer"><ExternalLink size={14} /> Portfolio</a>}
        {m.cv?.path && <button type="button" className="btn btn-soft btn-sm" onClick={openCv} disabled={opening}><FileText size={14} /> {opening ? 'Opening…' : 'View CV'}</button>}
      </div>
    </div>
  )
}

function MentorDetails({ m, common, onClose }) {
  const hasRating = typeof m.rating === 'number' && m.rating > 0
  return (
    <Modal title={m.name} sub={`${m.title}, ${m.company}`} onClose={onClose} width={560}>
      <div className="stack" style={{ gap: 14 }}>
        <div className="row"><Avatar p={m} size="lg" /><div className="small muted">{m.location && <div className="row" style={{ gap: 4 }}><MapPin size={13} /> {m.location}</div>}{m.years ? <div>{m.years} years of experience</div> : null}{m.degree && <div>{m.degree}</div>}</div></div>
        {m.bio && <p className="small" style={{ color: 'var(--ink-2)' }}>{m.bio}</p>}
        <div>
          <div className="xs faint bold">EXPERTISE</div>
          <div className="row wrap mt-2" style={{ gap: 6 }}>{(m.fields || []).map((f) => <span key={f} className={`chip ${common.includes(f) ? 'chip-match' : ''}`}>{common.includes(f) && <Check size={12} />} {f}</span>)}</div>
        </div>
        <MentorLinks m={m} />
        <div className="row xs muted" style={{ gap: 14 }}>
          {hasRating ? <span className="row" style={{ gap: 4 }}><Star size={13} color="var(--gold)" fill="var(--gold)" /> {m.rating}</span> : <span className="badge badge-amber">New</span>}
          <span>{m.mentees} mentees</span><span>{m.hours} hrs/month</span>
        </div>
        <div className="row" style={{ justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={onClose}>Close</button>
          <Link to="/app/mentors" className="btn btn-primary">Request mentorship <ArrowRight size={16} /></Link>
        </div>
      </div>
    </Modal>
  )
}

export function StudentSessions() {
  const { state, entity, toggleRegister, toast } = useStore()
  const [filter, setFilter] = useState('mine')
  const upcoming = state.sessions.filter((s) => new Date(s.date) > new Date()).sort((a, b) => new Date(a.date) - new Date(b.date))
  const recs = recommendSessions(entity, upcoming, state.mentors, { minRelevance: 0.1 })
  const reasonsOf = Object.fromEntries(recs.map((r) => [r.item.id, r.reasons]))
  const list = filter === 'mine' ? recs.map((r) => r.item) : filter === 'going' ? upcoming.filter((s) => s.registered.includes(entity.id)) : upcoming

  const toggle = async (id) => {
    const se = state.sessions.find((s) => s.id === id)
    const was = se.registered.includes(entity.id)
    const ok = await toggleRegister(id, entity.id)
    if (ok) toast(was ? 'Seat released' : se.isPaid ? 'Seat reserved. Pay the mentor to confirm it.' : 'Seat reserved!')
  }

  return (
    <div className="page">
      <div className="page-head"><div><h1>Mentorship sessions</h1><p>Group sessions hosted by Nepali professionals around the world. Some are free, some are paid. All times are in Nepal time (NPT).</p></div></div>
      <div className="filters">
        {[['mine', 'For my interests'], ['all', 'All sessions'], ['going', 'I’m going']].map(([k, l]) => <button key={k} className={`chip chip-btn ${filter === k ? 'active' : ''}`} onClick={() => setFilter(k)}>{l}</button>)}
      </div>
      <div className="stack">
        {list.length ? list.map((se) => <SessionCard key={se.id} se={se} host={state.mentors.find((m) => m.id === se.hostId)} studentId={entity.id} onToggle={toggle} matched={entity.interests.includes(se.keyword)} footer={<Why reasons={reasonsOf[se.id]} />} />)
          : <div className="card"><Empty icon={CalendarDays} title="Nothing here yet" text="Try “All sessions”, or add more interests to your profile." /></div>}
      </div>
    </div>
  )
}

export function Mentors() {
  const { state, user, entity, startChat, requestMentorship, toast } = useStore()
  const nav = useNavigate()
  const [only, setOnly] = useState(true)
  const [asking, setAsking] = useState(null)
  const [viewing, setViewing] = useState(null)
  const [msg, setMsg] = useState('')
  const list = recommendMentors(entity, state.mentors)
    .filter((r) => !only || r.relevance >= 0.1)
    .map((r) => ({ m: r.item, common: overlap(r.item.fields, entity.interests), reasons: r.reasons }))
  const reqFor = (id) => state.requests.find((r) => r.mentorId === id && r.studentId === entity.id)
  const convFor = (id) => state.conversations.find((c) => c.ownerId === user.id && c.peer.refId === id && c.peer.kind === 'mentor')

  return (
    <div className="page">
      <div className="page-head"><div><h1>Find a mentor</h1><p>Matched on your interests: {entity.interests.join(', ')}.</p></div></div>
      <div className="filters">
        <button className={`chip chip-btn ${only ? 'active' : ''}`} onClick={() => setOnly(true)}>Best matches</button>
        <button className={`chip chip-btn ${!only ? 'active' : ''}`} onClick={() => setOnly(false)}>All mentors</button>
      </div>
      <div className="startup-grid">
        {list.map(({ m, common, reasons }) => {
          const req = reqFor(m.id)
          const conv = convFor(m.id)
          // New mentors have no rating yet: show "New" instead of an empty gold star.
          const hasRating = typeof m.rating === 'number' && m.rating > 0
          return (
            <div key={m.id} className="card card-pad stack" style={{ gap: 14 }}>
              <div className="row" style={{ alignItems: 'flex-start' }}>
                <Avatar p={m} size="lg" />
                <div className="grow"><div className="bold" style={{ fontSize: 16 }}>{m.name}</div><div className="small muted">{m.title} · {m.company}</div><div className="xs muted row mt-1" style={{ gap: 4 }}><MapPin size={11} /> {m.location}</div></div>
              </div>
              <p className="small" style={{ color: 'var(--ink-2)' }}>{m.bio}</p>
              <div className="row wrap" style={{ gap: 6 }}>{m.fields.map((f) => <span key={f} className={`chip ${common.includes(f) ? 'chip-match' : ''}`}>{common.includes(f) && <Check size={12} />} {f}</span>)}</div>
              {reasons.length > 0 && <div className="xs muted row" style={{ gap: 4 }}><Sparkles size={11} /> Why this mentor: {reasons.join(', ')}</div>}
              <button type="button" className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => setViewing({ m, common })}>View full profile</button>
              <div className="row xs muted" style={{ gap: 14 }}>
                {hasRating
                  ? <span className="row" style={{ gap: 4 }}><Star size={13} color="var(--gold)" fill="var(--gold)" /> {m.rating}</span>
                  : <span className="badge badge-amber">New</span>}
                <span>{m.mentees} mentees</span><span>{m.hours} hrs/month</span>
              </div>
              {req?.status === 'accepted' ? <button className="btn btn-success btn-block" onClick={() => {
                const id = conv ? conv.id : startChat({ name: m.name, initials: m.initials, color: m.color, subtitle: `${m.title}, ${m.company}`, kind: 'mentor', refId: m.id, userId: m.userId })
                nav('/app/messages?c=' + id)
              }}><MessageCircle size={16} /> Accepted · Open chat</button>
                : req ? <button className="btn btn-soft btn-block" disabled><Clock size={16} /> Request {req.status}</button>
                  : <button className="btn btn-dark btn-block" onClick={() => { setAsking(m); setMsg(`Namaste ${m.name.replace(/^(Dr\.|Er\.|CA)\s+/, '').split(' ')[0]}, I’m ${entity.name.split(' ')[0]} from ${entity.institution}. ${entity.goal || ''} I’d be grateful for your guidance.`) }}>Request mentorship</button>}
            </div>
          )
        })}
      </div>
      {viewing && <MentorDetails m={viewing.m} common={viewing.common} onClose={() => setViewing(null)} />}
      {asking && (
        <Modal title={`Request mentorship from ${asking.name}`} sub="Mentors are volunteers. A short, specific message gets the best response." onClose={() => setAsking(null)}>
          <textarea className="textarea" rows={5} value={msg} onChange={(e) => setMsg(e.target.value)} />
          <div className="row mt-4" style={{ justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost" onClick={() => setAsking(null)}>Cancel</button>
            <button className="btn btn-primary" disabled={!msg.trim()} onClick={() => { requestMentorship(entity.id, asking.id, msg); toast(`Request sent to ${asking.name}`); setAsking(null) }}>Send request</button>
          </div>
        </Modal>
      )}
    </div>
  )
}