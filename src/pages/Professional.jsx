import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bell, CalendarDays, CalendarPlus, Check, ExternalLink, FileText, GraduationCap, Heart, MapPin, MessageCircle, Plus, Star, Users, X } from 'lucide-react'
import { Avatar, Empty, Modal, ago, fmtNPT, sessionWhen } from '../components/ui'
import { KEYWORDS } from '../data/demo'
import { useStore, validateMeetingLink } from '../store'
import { recommendStudents } from '../lib/recommend'
import { SessionCard, MeetingLinkEditor, overlap } from './Student'

const PAY_METHODS = [
  ['esewa', 'eSewa'],
  ['khalti', 'Khalti'],
  ['imepay', 'IME Pay'],
  ['bank', 'Bank transfer'],
]

// Nepali mobile numbers: 10 digits starting with 96, 97 or 98 (the +977 is added separately).
// Also rejects fake-looking ones like 9800000000 (all remaining digits the same).
const isNepaliMobile = (n) => /^(96|97|98)\d{8}$/.test(n) && !/^(\d)\1{7}$/.test(n.slice(2))

// Make any block open the student's details: click or Enter / Space.
const clickable = (onOpen) => ({
  role: 'button', tabIndex: 0, style: { cursor: 'pointer' },
  onClick: onOpen,
  onKeyDown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen() } },
})

function StudentDetails({ st, common = [], req, onClose, actions }) {
  const { docUrl } = useStore()
  const [opening, setOpening] = useState(false)
  const openCv = async () => {
    setOpening(true)
    const url = await docUrl(st.cv.path) // shows its own error toast on failure
    setOpening(false)
    if (url) window.open(url, '_blank', 'noopener,noreferrer')
  }
  const safeLink = /^https?:\/\//i.test(st.portfolio || '') ? st.portfolio : null
  return (
    <Modal title={st.name} sub={[st.level, st.institution].filter(Boolean).join(' · ')} onClose={onClose} width={600}>
      <div className="stack" style={{ gap: 16 }}>
        <div className="row"><Avatar p={st} size="lg" /><div className="small muted">{st.city && <div className="row" style={{ gap: 4 }}><MapPin size={13} /> {st.city}</div>}{st.gapYear && <div>Gap year: {st.gapYear}</div>}</div></div>
        {req && <div><div className="xs faint bold">THEIR MESSAGE TO YOU · {ago(req.at).toUpperCase()}</div><p className="small mt-2" style={{ background: 'var(--paper)', padding: 12, borderRadius: 12, color: 'var(--ink-2)' }}>“{req.message}”</p></div>}
        <div><div className="xs faint bold">GOAL</div><p className="small mt-2" style={{ color: 'var(--ink-2)' }}>{st.goal || 'Not shared yet.'}</p></div>
        <div>
          <div className="xs faint bold">INTERESTS</div>
          <div className="row wrap mt-2" style={{ gap: 6 }}>{(st.interests || []).map((i) => <span key={i} className={`chip ${common.includes(i) ? 'chip-match' : ''}`}>{common.includes(i) && <Check size={12} />} {i}</span>)}</div>
        </div>
        <div className="grid-2" style={{ gap: 12 }}>
          <div className="card card-pad">
            <div className="xs faint bold">CV / RÉSUMÉ</div>
            {st.cv?.path
              ? <button className="btn btn-soft btn-sm mt-2" onClick={openCv} disabled={opening}><FileText size={14} /> {opening ? 'Opening…' : 'View CV'}</button>
              : <p className="small muted mt-2">Not uploaded.</p>}
          </div>
          <div className="card card-pad">
            <div className="xs faint bold">PORTFOLIO</div>
            {safeLink
              ? <a className="btn btn-soft btn-sm mt-2" href={safeLink} target="_blank" rel="noopener noreferrer"><ExternalLink size={14} /> Open portfolio</a>
              : <p className="small muted mt-2">Not shared.</p>}
          </div>
        </div>
        <div className="row" style={{ justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={onClose}>Close</button>
          {actions}
        </div>
      </div>
    </Modal>
  )
}

export function ProHome() {
  const { state, entity, respondRequest, startChat, toast } = useStore()
  const nav = useNavigate()
  const reqs = state.requests.filter((r) => r.mentorId === entity.id)
  const pending = reqs.filter((r) => r.status === 'pending')
  const mySessions = state.sessions.filter((s) => s.hostId === entity.id && new Date(s.date) > new Date()).sort((a, b) => new Date(a.date) - new Date(b.date))
  const [openStudent, setOpenStudent] = useState(null)
  const reached = mySessions.reduce((a, s) => a + s.registered.length, 0)

  return (
    <div className="page">
      <div className="page-head">
        <div><h1>Namaste, {entity.name.replace(/^(Dr\.|Er\.|CA)\s+/, '').split(' ')[0]}</h1><p>{entity.title}, {entity.company} · {entity.location}</p></div>
        <Link to="/app/sessions?new=1" className="btn btn-primary"><CalendarPlus size={17} /> Host a session</Link>
      </div>
      <div className="kpis">
        {[['Students mentored', entity.mentees, Heart, 'var(--crimson)', 'var(--crimson-50)'], ['Pending requests', pending.length, Bell, 'var(--amber)', 'var(--amber-50)'], ['Registered for my sessions', reached, Users, 'var(--blue)', 'var(--blue-50)'],  ['Rating', entity.rating ?? '—', Star, 'var(--gold)', 'var(--gold-50)']].map(([l, v, I, c, bg]) => (
          <div key={l} className="card kpi"><div className="ic" style={{ background: bg, color: c }}><I size={18} /></div><div className="v">{v}</div><div className="small muted">{l}</div></div>
        ))}
      </div>

      <div className="detail-grid mt-6">
        <div>
          <h3 style={{ fontSize: 22 }}>Mentorship requests</h3>
          <div className="stack mt-4">
            {pending.length === 0 && <div className="card"><Empty icon={Check} title="No pending requests" text="Students matched to your expertise can request you anytime." /></div>}
            {pending.map((r) => {
              const st = state.students.find((s) => s.id === r.studentId)
              if (!st) return null
              // Why this student fits me: text matching, not only identical keywords.
              const common = recommendStudents(entity, [st])[0]?.reasons || []
              return (
                <div key={r.id} className="card card-pad">
                  <div className="row" style={{ alignItems: 'flex-start' }}>
                    <div {...clickable(() => setOpenStudent({ st, common }))}><Avatar p={st} /></div>
                    <div className="grow">
                      <div className="row-between"><div {...clickable(() => setOpenStudent({ st, common }))}><div className="bold">{st.name}</div><div className="xs muted">{st.level} · {st.institution}</div></div><span className="xs faint">{ago(r.at)}</span></div>
                      <p className="small mt-3" style={{ background: 'var(--paper)', padding: 12, borderRadius: 12, color: 'var(--ink-2)' }}>“{r.message}”</p>
                      <div className="row wrap mt-3" style={{ gap: 6 }}><span className="xs muted">Matched on</span>{common.map((c) => <span key={c} className="chip chip-match">{c}</span>)}</div>
                      <div className="row mt-4">
                        <button className="btn btn-success btn-sm" onClick={() => { respondRequest(r.id, 'accepted'); toast(`You’re now mentoring ${st.name}. A chat has been opened.`) }}><Check size={15} /> Accept</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => { respondRequest(r.id, 'declined'); toast('Request declined') }}><X size={15} /> Decline</button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          {reqs.some((r) => r.status === 'accepted') && <>
            <h3 className="mt-8" style={{ fontSize: 22 }}>My mentees</h3>
            <div className="card card-pad mt-4">
              {reqs.filter((r) => r.status === 'accepted').map((r) => {
                const st = state.students.find((s) => s.id === r.studentId)
                if (!st) return null
                return (
                  <div key={r.id} className="list-row">
                    <div className="row grow" {...clickable(() => setOpenStudent({ st, common: overlap(st.interests, entity.fields) }))}><Avatar p={st} size="sm" />
                    <div className="grow"><div className="small bold">{st.name}</div><div className="xs muted">{st.goal}</div></div></div>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => {
                        // startChat returns the existing conversation if there is one, otherwise creates it.
                        const id = startChat({ name: st.name, initials: st.initials, color: st.color, subtitle: `Mentee · ${st.institution}`, kind: 'student', refId: st.id, userId: st.userId })
                        nav('/app/messages?c=' + id)
                      }}
                    >
                      <MessageCircle size={14} /> Chat
                    </button>
                  </div>
                )
              })}
            </div>
          </>}
          {openStudent && <StudentDetails st={openStudent.st} common={openStudent.common} onClose={() => setOpenStudent(null)} />}
        </div>
        <div className="stack">
          <div className="card card-pad">
            <div className="row-between"><div className="xs faint bold">MY UPCOMING SESSIONS</div><Link to="/app/sessions" className="xs link">Manage</Link></div>
            {mySessions.length === 0 && <p className="small muted mt-3">No sessions scheduled.</p>}
            {mySessions.map((s) => <div key={s.id} className="list-row"><CalendarDays size={18} color="var(--primary)" /><div className="grow"><div className="small bold">{s.title}</div><div className="xs muted">{fmtNPT(s.date, { weekday: 'short', month: 'short', day: 'numeric' })}, {sessionWhen(s.date)} · {s.registered.length} going</div></div></div>)}
          </div>
        </div>
      </div>
    </div>
  )
}

export function ProSessions() {
  const { state, entity, createSession, confirmPayment, toast } = useStore()
  const [open, setOpen] = useState(() => new URLSearchParams(window.location.search).has('new'))
  const [saving, setSaving] = useState(false)
  const [f, setF] = useState(() => ({
    title: '',
    keyword: entity.fields[0] || KEYWORDS[0],
    date: new Date(Date.now() + 2 * 864e5).toISOString().slice(0, 10),
    time: '20:00',
    duration: 60,
    seats: 50,
    mode: 'Zoom',
    meetingLink: '',
    desc: '',
    isPaid: false,
    price: '',
    payMethod: 'esewa',
    payAccount: '',
  }))
  const mine = state.sessions.filter((s) => s.hostId === entity.id).sort((a, b) => new Date(a.date) - new Date(b.date))
  const reach = state.students.filter((s) => s.interests.includes(f.keyword))
  const linkCheck = validateMeetingLink(f.meetingLink)

  const payLabel = f.payMethod === 'bank'
    ? 'Bank name, account name and number'
    : `Your ${PAY_METHODS.find(([v]) => v === f.payMethod)?.[1]} number`

  const submit = async () => {
    if (!linkCheck.ok) {
      toast(linkCheck.error)
      return
    }

    if (f.isPaid && (!(Number(f.price) > 0) || !f.payAccount.trim())) {
      toast('Enter a price and your payment details, or switch the session to Free.')
      return
    }

    if (f.isPaid && f.payMethod !== 'bank' && !isNepaliMobile(f.payAccount)) {
      toast('Enter a valid Nepali mobile number: 10 digits starting with 96, 97 or 98.')
      return
    }

    // The time field is Nepal time (UTC+05:45), whatever timezone this browser is in.
    const startsAt = new Date(`${f.date}T${f.time}:00+05:45`).toISOString()

    setSaving(true)
    const se = await createSession({
      hostId: entity.id,
      title: f.title,
      keyword: f.keyword,
      date: startsAt,
      startsAt,
      duration: Number(f.duration),
      seats: Number(f.seats),
      mode: f.mode,
      meetingLink: linkCheck.url,
      desc: f.desc,
      isPaid: f.isPaid,
      price: f.isPaid ? Number(f.price) : null,
      payMethod: f.isPaid ? f.payMethod : null,
      payAccount: f.isPaid ? (f.payMethod === 'bank' ? f.payAccount.trim() : `+977 ${f.payAccount}`) : null,
    })
    setSaving(false)

    // createSession already showed the error toast if saving failed. Keep the form open so nothing is lost.
    if (!se) return

    toast(`Session created. ${reach.length} students interested in “${f.keyword}” were notified.`)
    setOpen(false)
    setF({ ...f, title: '', desc: '', meetingLink: '', isPaid: false, price: '', payAccount: '' })
  }

  return (
    <div className="page">
      <div className="page-head">
        <div><h1>My sessions</h1><p>Host a group session and every student interested in that topic gets notified.</p></div>
        <button className="btn btn-primary" onClick={() => setOpen(true)}><Plus size={17} /> New session</button>
      </div>
      <div className="stack">
        {mine.length ? mine.map((se) => {
          const going = se.taken ?? se.registered.length
          const claimed = (se.regs || []).filter((r) => r.payStatus === 'claimed')
          const confirmed = (se.regs || []).filter((r) => r.payStatus === 'confirmed').length
          return (
            <SessionCard key={se.id} se={se} footer={
              <>
                <div className="row mt-3" style={{ gap: 8 }}>
                  <div className="avatar-stack">{se.registered.slice(0, 5).map((id) => <Avatar key={id} p={state.students.find((s) => s.id === id)} size="sm" />)}</div>
                  <span className="xs muted">{going ? `${going} registered` : 'No registrations yet'}</span>
                  {se.isPaid && confirmed > 0 && <span className="xs muted">· {confirmed} paid</span>}
                </div>

                <MeetingLinkEditor se={se} />

                {se.isPaid && claimed.length > 0 && (
                  <div className="mt-3" style={{ background: 'var(--paper)', padding: 12, borderRadius: 12 }}>
                    <div className="xs faint bold">PAYMENTS TO CONFIRM</div>
                    {claimed.map((r) => {
                      const st = state.students.find((x) => x.userId === r.studentId)
                      return (
                        <div key={r.studentId} className="list-row">
                          {st && <Avatar p={st} size="sm" />}
                          <div className="grow small bold">{st?.name || 'Student'}</div>
                          <button className="btn btn-success btn-sm" onClick={() => confirmPayment(se.id, r.studentId)}><Check size={14} /> Confirm payment</button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </>
            } />
          )
        }) : <div className="card"><Empty icon={CalendarDays} title="You haven’t hosted a session yet" action={<button className="btn btn-dark" onClick={() => setOpen(true)}>Host your first session</button>} /></div>}
      </div>

      {open && (
        <Modal title="Host a mentorship session" sub={f.isPaid ? 'Paid session, open to verified students.' : 'Free, voluntary and open to verified students.'} onClose={() => setOpen(false)} width={620}>
          <div className="grid-2">
            <div className="field span-2"><label>Session title</label><input className="input" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="e.g. How to get a fully funded MS in the USA" /></div>
            <div className="field span-2"><label>Topic keyword</label>
              <select className="select" value={f.keyword} onChange={(e) => setF({ ...f, keyword: e.target.value })}>{KEYWORDS.map((k) => <option key={k}>{k}</option>)}</select>
            </div>
            <div className="field"><label>Date</label><input type="date" className="input" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></div>
            <div className="field"><label>Time (Nepal time)</label><input type="time" className="input" value={f.time} onChange={(e) => setF({ ...f, time: e.target.value })} /></div>
            <div className="field"><label>Duration (min)</label><input type="number" className="input" value={f.duration} onChange={(e) => setF({ ...f, duration: e.target.value })} /></div>
            <div className="field"><label>Seats</label><input type="number" className="input" value={f.seats} onChange={(e) => setF({ ...f, seats: e.target.value })} /></div>
            <div className="field span-2"><label>Platform</label><select className="select" value={f.mode} onChange={(e) => setF({ ...f, mode: e.target.value })}><option>Zoom</option><option>Google Meet</option><option>Microsoft Teams</option></select></div>

            <div className="field span-2">
              <label>Meeting link (optional)</label>
              <input
                className="input"
                value={f.meetingLink}
                onChange={(e) => setF({ ...f, meetingLink: e.target.value })}
                placeholder="https://meet.google.com/abc-defg-hij"
              />
              {!linkCheck.ok
                ? <div className="xs mt-1" style={{ color: '#dc2626' }}>{linkCheck.error}</div>
                : <div className="xs muted mt-1">Only registered students see it{f.isPaid ? ', after you confirm their payment' : ''}. You can add it later from the session card.</div>}
            </div>

            <div className="field span-2">
              <label>Session fee</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {[['Free', false], ['Paid', true]].map(([label, val]) => (
                  <button
                    key={label}
                    type="button"
                    className={`btn ${f.isPaid === val ? 'btn-dark' : 'btn-ghost'}`}
                    onClick={() => setF({ ...f, isPaid: val })}
                    style={{ flex: 1 }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {f.isPaid && (
              <>
                <div className="field"><label>Price (NPR)</label><input type="number" min="1" className="input" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} placeholder="e.g. 500" /></div>
                <div className="field"><label>Payment method</label>
                  <select className="select" value={f.payMethod} onChange={(e) => setF({ ...f, payMethod: e.target.value, payAccount: '' })}>
                    {PAY_METHODS.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
                  </select>
                </div>
                <div className="field span-2"><label>{payLabel}</label>
                  {f.payMethod === 'bank' ? (
                    <input
                      className="input"
                      value={f.payAccount}
                      onChange={(e) => setF({ ...f, payAccount: e.target.value })}
                      placeholder="e.g. NIC Asia, Krishma Adhikari, 0123456789"
                    />
                  ) : (
                    <>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span className="input" style={{ width: 'auto', display: 'grid', placeItems: 'center', flexShrink: 0 }}>+977</span>
                        <input
                          className="input"
                          type="tel"
                          inputMode="numeric"
                          maxLength={10}
                          value={f.payAccount}
                          onChange={(e) => setF({ ...f, payAccount: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                          placeholder="98XXXXXXXX"
                        />
                      </div>
                      {f.payAccount.length > 0 && !isNepaliMobile(f.payAccount) && (
                        <div className="xs mt-1" style={{ color: '#dc2626' }}>Must be 10 digits starting with 96, 97 or 98.</div>
                      )}
                    </>
                  )}
                </div>
              </>
            )}

            <div className="field span-2"><label>What will you cover?</label><textarea className="textarea" value={f.desc} onChange={(e) => setF({ ...f, desc: e.target.value })} /></div>
          </div>
          <div className="card mt-4" style={{ padding: 14, background: 'var(--gold-50)', borderColor: 'transparent', display: 'flex', gap: 12, alignItems: 'center' }}>
            <Bell size={18} color="var(--amber)" />
            <div className="grow small"><b>{reach.length} student{reach.length !== 1 && 's'}</b> interested in “{f.keyword}” will be notified.</div>
            <div className="avatar-stack">{reach.slice(0, 4).map((s) => <Avatar key={s.id} p={s} size="sm" />)}</div>
          </div>
          <div className="row mt-4" style={{ justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
            <button className="btn btn-primary" disabled={!f.title.trim() || !f.date || !linkCheck.ok || saving} onClick={submit}>{saving ? 'Publishing…' : 'Publish & notify'}</button>
          </div>
        </Modal>
      )}
    </div>
  )
}

export function ProRequests() {
  const { state, entity, respondRequest, startChat, toast } = useStore()
  const nav = useNavigate()
  const [tab, setTab] = useState('pending')
  const [openId, setOpenId] = useState(null)
  const reqs = state.requests.filter((r) => r.mentorId === entity.id).sort((a, b) => new Date(b.at) - new Date(a.at))
  const count = (k) => reqs.filter((r) => r.status === k).length
  const list = tab === 'all' ? reqs : reqs.filter((r) => r.status === tab)
  const openReq = reqs.find((r) => r.id === openId)
  const openStudent = openReq && state.students.find((s) => s.id === openReq.studentId)
  const badge = (s) => (s === 'accepted' ? 'badge-green' : s === 'declined' ? 'badge-red' : 'badge-amber')
  const chat = (st) => nav('/app/messages?c=' + startChat({ name: st.name, initials: st.initials, color: st.color, subtitle: `Mentee · ${st.institution}`, kind: 'student', refId: st.id, userId: st.userId }))
  const tabs = [['pending', 'Pending'], ['accepted', 'Accepted'], ['declined', 'Declined'], ['all', 'All']]

  return (
    <div className="page">
      <div className="page-head"><div><h1>Mentorship requests</h1><p>Students who asked you for guidance. Open a request to see their full profile.</p></div></div>
      <div className="filters">
        {tabs.map(([k, l]) => <button key={k} className={`chip chip-btn ${tab === k ? 'active' : ''}`} onClick={() => setTab(k)}>{l}{k !== 'all' ? ` (${count(k)})` : ` (${reqs.length})`}</button>)}
      </div>
      {list.length ? (
        <div className="startup-grid">
          {list.map((r) => {
            const st = state.students.find((s) => s.id === r.studentId)
            if (!st) return null
            const common = overlap(st.interests, entity.fields)
            return (
              <div key={r.id} className="card card-pad card-hover stack" {...clickable(() => setOpenId(r.id))} style={{ gap: 12, cursor: 'pointer' }}>
                <div className="row" style={{ alignItems: 'flex-start' }}>
                  <Avatar p={st} size="lg" />
                  <div className="grow"><div className="bold">{st.name}</div><div className="small muted">{st.level}</div><div className="xs muted">{st.institution}{st.city ? ` · ${st.city}` : ''}</div></div>
                  <span className={`badge ${badge(r.status)}`}>{r.status}</span>
                </div>
                <p className="small" style={{ background: 'var(--paper)', padding: 12, borderRadius: 12, color: 'var(--ink-2)' }}>“{r.message}”</p>
                {st.goal && <p className="small" style={{ color: 'var(--ink-2)' }}><b>Goal:</b> {st.goal}</p>}
                <div className="row-between">
                  <div className="row wrap" style={{ gap: 6 }}>{(st.interests || []).slice(0, 4).map((i) => <span key={i} className={`chip ${common.includes(i) ? 'chip-match' : ''}`}>{i}</span>)}</div>
                  <span className="xs faint" style={{ whiteSpace: 'nowrap' }}>{ago(r.at)}</span>
                </div>
              </div>
            )
          })}
        </div>
      ) : <Empty icon={GraduationCap} title={tab === 'pending' ? 'No pending requests' : 'Nothing here'} text="When a student requests mentorship, it shows up here." />}
      {openReq && openStudent && (
        <StudentDetails
          st={openStudent}
          common={overlap(openStudent.interests, entity.fields)}
          req={openReq}
          onClose={() => setOpenId(null)}
          actions={openReq.status === 'pending'
            ? <>
              <button className="btn btn-ghost" onClick={() => { respondRequest(openReq.id, 'declined'); toast('Request declined'); setOpenId(null) }}><X size={15} /> Decline</button>
              <button className="btn btn-success" onClick={() => { respondRequest(openReq.id, 'accepted'); toast(`You’re now mentoring ${openStudent.name}. A chat has been opened.`); setOpenId(null) }}><Check size={15} /> Accept</button>
            </>
            : openReq.status === 'accepted'
              ? <button className="btn btn-primary" onClick={() => chat(openStudent)}><MessageCircle size={15} /> Chat</button>
              : null}
        />
      )}
    </div>
  )
}
