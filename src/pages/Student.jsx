/* eslint-disable react-refresh/only-export-components */
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Bell, CalendarDays, Check, Clock, MapPin, MessageCircle, Sparkles, Star, Users, Video } from 'lucide-react'
import { Avatar, Empty, Modal, fmtTime } from '../components/ui'
import { useStore } from '../store'

export const overlap = (a = [], b = []) => a.filter((x) => b.includes(x))

export function SessionCard({ se, host, studentId, onToggle, matched, footer }) {
  const d = new Date(se.date)
  const reg = studentId && se.registered.includes(studentId)
  const left = se.seats - se.registered.length
  return (
    <div className="card session-card">
      <div className="date-tile"><div className="m">{d.toLocaleString('en-US', { month: 'short' })}</div><div className="d">{d.getDate()}</div><div className="xs muted">{d.toLocaleString('en-US', { weekday: 'short' })}</div></div>
      <div className="grow">
        <div className="row wrap" style={{ gap: 6 }}>
          <span className="chip chip-match">{se.keyword}</span>
          {matched && <span className="badge badge-amber"><Sparkles size={11} /> Matches your interests</span>}
        </div>
        <div className="bold mt-2" style={{ fontSize: 16 }}>{se.title}</div>
        <p className="small muted mt-1">{se.desc}</p>
        <div className="row wrap mt-3 xs muted" style={{ gap: 14 }}>
          <span className="row" style={{ gap: 4 }}><Clock size={13} /> {fmtTime(se.date)} NPT · {se.duration} min</span>
          <span className="row" style={{ gap: 4 }}><Video size={13} /> {se.mode}</span>
          <span className="row" style={{ gap: 4 }}><Users size={13} /> {se.registered.length} going · {left} seats left</span>
        </div>
        {host && <div className="row mt-3 small"><Avatar p={host} size="sm" /><span><b>{host.name}</b> <span className="muted">· {host.title}, {host.company} · {host.location}</span></span></div>}
        {footer}
      </div>
      {onToggle && (
        <div style={{ flexShrink: 0 }}>
          <button className={`btn btn-sm ${reg ? 'btn-success' : 'btn-dark'}`} disabled={!reg && left <= 0} onClick={() => onToggle(se.id)}>{reg ? <><Check size={14} /> Registered</> : 'Reserve seat'}</button>
        </div>
      )}
    </div>
  )
}

export function StudentHome() {
  const { state, entity, toggleRegister, toast } = useStore()
  const upcoming = state.sessions.filter((s) => new Date(s.date) > new Date()).sort((a, b) => new Date(a.date) - new Date(b.date))
  const forMe = upcoming.filter((s) => entity.interests.includes(s.keyword))
  const matches = state.mentors.map((m) => ({ m, common: overlap(m.fields, entity.interests) })).filter((x) => x.common.length).sort((a, b) => b.common.length - a.common.length)
  const myReqs = state.requests.filter((r) => r.studentId === entity.id)
  const toggle = (id) => { const se = state.sessions.find((s) => s.id === id); toggleRegister(id, entity.id); toast(se.registered.includes(entity.id) ? 'Seat released' : 'Seat reserved. The link will be in your email.') }

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
          <svg viewBox="0 0 300 100" style={{ position: 'absolute', right: 0, bottom: 0, width: 300, opacity: .08 }}><path d="M0 100 L60 40 L100 70 L160 10 L220 60 L260 35 L300 70 L300 100Z" fill="#fff" /></svg>
        </div>
      )}

      <div className="detail-grid mt-6">
        <div>
          <div className="row-between"><h3 style={{ fontSize: 22 }}>Sessions for you</h3><Link to="/app/sessions" className="small link">See all</Link></div>
          <div className="stack mt-4">
            {forMe.length ? forMe.slice(0, 3).map((se) => <SessionCard key={se.id} se={se} host={state.mentors.find((m) => m.id === se.hostId)} studentId={entity.id} onToggle={toggle} matched />)
              : <div className="card"><Empty icon={CalendarDays} title="No sessions for your interests yet" text="You’ll get a notification as soon as a mentor schedules one." /></div>}
          </div>

          <div className="row-between mt-8"><h3 style={{ fontSize: 22 }}>Mentors matched to you</h3><Link to="/app/mentors" className="small link">See all</Link></div>
          <div className="grid-2 mt-4">
            {matches.slice(0, 4).map(({ m, common }) => <MentorMini key={m.id} m={m} common={common} />)}
          </div>
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

function MentorMini({ m, common }) {
  return (
    <Link to="/app/mentors" className="card card-hover" style={{ padding: 16, display: 'block' }}>
      <div className="row"><Avatar p={m} /><div className="grow"><div className="small bold">{m.name}</div><div className="xs muted">{m.title}, {m.company}</div></div></div>
      <div className="row wrap mt-3" style={{ gap: 6 }}>{common.map((c) => <span key={c} className="chip chip-match">{c}</span>)}</div>
    </Link>
  )
}

export function StudentSessions() {
  const { state, entity, toggleRegister, toast } = useStore()
  const [filter, setFilter] = useState('mine')
  const upcoming = state.sessions.filter((s) => new Date(s.date) > new Date()).sort((a, b) => new Date(a.date) - new Date(b.date))
  const list = filter === 'mine' ? upcoming.filter((s) => entity.interests.includes(s.keyword)) : filter === 'going' ? upcoming.filter((s) => s.registered.includes(entity.id)) : upcoming
  const toggle = (id) => { const se = state.sessions.find((s) => s.id === id); toggleRegister(id, entity.id); toast(se.registered.includes(entity.id) ? 'Seat released' : 'Seat reserved!') }
  return (
    <div className="page">
      <div className="page-head"><div><h1>Mentorship sessions</h1><p>Free group sessions hosted by Nepali professionals around the world.</p></div></div>
      <div className="filters">
        {[['mine', 'For my interests'], ['all', 'All sessions'], ['going', 'I’m going']].map(([k, l]) => <button key={k} className={`chip chip-btn ${filter === k ? 'active' : ''}`} onClick={() => setFilter(k)}>{l}</button>)}
      </div>
      <div className="stack">
        {list.length ? list.map((se) => <SessionCard key={se.id} se={se} host={state.mentors.find((m) => m.id === se.hostId)} studentId={entity.id} onToggle={toggle} matched={entity.interests.includes(se.keyword)} />)
          : <div className="card"><Empty icon={CalendarDays} title="Nothing here yet" text="Try “All sessions”, or add more interests to your profile." /></div>}
      </div>
    </div>
  )
}

export function Mentors() {
  const { state, user, entity, requestMentorship, toast } = useStore()
  const nav = useNavigate()
  const [only, setOnly] = useState(true)
  const [asking, setAsking] = useState(null)
  const [msg, setMsg] = useState('')
  const list = state.mentors.map((m) => ({ m, common: overlap(m.fields, entity.interests) }))
    .filter((x) => !only || x.common.length).sort((a, b) => b.common.length - a.common.length || b.m.rating - a.m.rating)
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
        {list.map(({ m, common }) => {
          const req = reqFor(m.id)
          const conv = convFor(m.id)
          const score = Math.round((common.length / Math.max(1, entity.interests.length)) * 100)
          return (
            <div key={m.id} className="card card-pad stack" style={{ gap: 14 }}>
              <div className="row" style={{ alignItems: 'flex-start' }}>
                <Avatar p={m} size="lg" />
                <div className="grow"><div className="bold" style={{ fontSize: 16 }}>{m.name}</div><div className="small muted">{m.title} · {m.company}</div><div className="xs muted row mt-1" style={{ gap: 4 }}><MapPin size={11} /> {m.location}</div></div>
                {common.length > 0 && <div style={{ textAlign: 'center' }}><div className="serif" style={{ fontSize: 22, fontWeight: 600, color: 'var(--amber)' }}>{score}%</div><div className="xs faint">match</div></div>}
              </div>
              <p className="small" style={{ color: 'var(--ink-2)' }}>{m.bio}</p>
              <div className="row wrap" style={{ gap: 6 }}>{m.fields.map((f) => <span key={f} className={`chip ${common.includes(f) ? 'chip-match' : ''}`}>{common.includes(f) && <Check size={12} />} {f}</span>)}</div>
              <div className="row xs muted" style={{ gap: 14 }}><span className="row" style={{ gap: 4 }}><Star size={13} color="var(--gold)" fill="var(--gold)" /> {m.rating}</span><span>{m.mentees} mentees</span><span>{m.hours} hrs/month</span></div>
              {req?.status === 'accepted' ? <button className="btn btn-success btn-block" onClick={() => nav(conv ? '/app/messages?c=' + conv.id : '/app/messages')}><MessageCircle size={16} /> Accepted · Open chat</button>
                : req ? <button className="btn btn-soft btn-block" disabled><Clock size={16} /> Request {req.status}</button>
                  : <button className="btn btn-dark btn-block" onClick={() => { setAsking(m); setMsg(`Namaste ${m.name.replace(/^(Dr\.|Er\.|CA)\s+/, '').split(' ')[0]}, I’m ${entity.name.split(' ')[0]} from ${entity.institution}. ${entity.goal || ''} I’d be grateful for your guidance.`) }}>Request mentorship</button>}
            </div>
          )
        })}
      </div>
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
