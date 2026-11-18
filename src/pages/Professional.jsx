import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bell, CalendarDays, CalendarPlus, Check, GraduationCap, Heart, MessageCircle, Plus, Star, Users, Wrench, X } from 'lucide-react'
import { Avatar, Empty, Modal, ago } from '../components/ui'
import { KEYWORDS } from '../data/demo'
import { useStore, validateMeetingLink } from '../store'
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

export function ProHome() {
  const { state, entity, respondRequest, toast } = useStore()
  const nav = useNavigate()
  const reqs = state.requests.filter((r) => r.mentorId === entity.id)
  const pending = reqs.filter((r) => r.status === 'pending')
  const mySessions = state.sessions.filter((s) => s.hostId === entity.id && new Date(s.date) > new Date()).sort((a, b) => new Date(a.date) - new Date(b.date))
  const reached = mySessions.reduce((a, s) => a + s.registered.length, 0)
  const openChallenges = state.challenges.filter((c) => c.responses.length === 0).length

  return (
    <div className="page">
      <div className="page-head">
        <div><h1>Namaste, {entity.name.replace(/^(Dr\.|Er\.|CA)\s+/, '').split(' ')[0]}</h1><p>{entity.title}, {entity.company} · {entity.location}</p></div>
        <Link to="/app/sessions?new=1" className="btn btn-primary"><CalendarPlus size={17} /> Host a session</Link>
      </div>
      <div className="kpis">
        {[['Students mentored', entity.mentees, Heart, 'var(--crimson)', 'var(--crimson-50)'], ['Pending requests', pending.length, Bell, 'var(--amber)', 'var(--amber-50)'], ['Registered for my sessions', reached, Users, 'var(--blue)', 'var(--blue-50)'], ['Rating', entity.rating, Star, 'var(--gold)', 'var(--gold-50)']].map(([l, v, I, c, bg]) => (
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
              const common = overlap(st.interests, entity.fields)
              return (
                <div key={r.id} className="card card-pad">
                  <div className="row" style={{ alignItems: 'flex-start' }}>
                    <Avatar p={st} />
                    <div className="grow">
                      <div className="row-between"><div><div className="bold">{st.name}</div><div className="xs muted">{st.level} · {st.institution}</div></div><span className="xs faint">{ago(r.at)}</span></div>
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
                return <div key={r.id} className="list-row"><Avatar p={st} size="sm" /><div className="grow"><div className="small bold">{st.name}</div><div className="xs muted">{st.goal}</div></div><button className="btn btn-ghost btn-sm" onClick={() => nav('/app/messages')}><MessageCircle size={14} /> Chat</button></div>
              })}
            </div>
          </>}
        </div>
        <div className="stack">
          <div className="card card-pad">
            <div className="row-between"><div className="xs faint bold">MY UPCOMING SESSIONS</div><Link to="/app/sessions" className="xs link">Manage</Link></div>
            {mySessions.length === 0 && <p className="small muted mt-3">No sessions scheduled.</p>}
            {mySessions.map((s) => <div key={s.id} className="list-row"><CalendarDays size={18} color="var(--primary)" /><div className="grow"><div className="small bold">{s.title}</div><div className="xs muted">{new Date(s.date).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })} · {s.registered.length} going</div></div></div>)}
          </div>
          <div className="card card-pad" style={{ background: 'var(--primary-50)', borderColor: 'var(--primary-100)' }}>
            <Wrench size={20} color="var(--blue)" />
            <div className="bold mt-2">{openChallenges} tech challenges need help</div>
            <p className="small muted mt-1">Schools and NGOs in Nepal are waiting for advice.</p>
            <Link to="/app/helpdesk" className="btn btn-blue btn-sm mt-3">Open Help Desk</Link>
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

export function ProStudents() {
  const { state, entity } = useStore()
  const list = state.students.map((s) => ({ s, common: overlap(s.interests, entity.fields) })).filter((x) => x.common.length).sort((a, b) => b.common.length - a.common.length)
  return (
    <div className="page">
      <div className="page-head"><div><h1>Students matched to you</h1><p>Based on your expertise: {entity.fields.join(', ')}.</p></div></div>
      {list.length ? (
        <div className="startup-grid">
          {list.map(({ s, common }) => (
            <div key={s.id} className="card card-pad stack" style={{ gap: 12 }}>
              <div className="row"><Avatar p={s} size="lg" /><div><div className="bold">{s.name}</div><div className="small muted">{s.level}</div><div className="xs muted">{s.institution} · {s.city}</div></div></div>
              {s.goal && <p className="small" style={{ color: 'var(--ink-2)' }}><b>Goal:</b> {s.goal}</p>}
              <div className="row wrap" style={{ gap: 6 }}>{s.interests.map((i) => <span key={i} className={`chip ${common.includes(i) ? 'chip-match' : ''}`}>{i}</span>)}</div>
            </div>
          ))}
        </div>
      ) : <Empty icon={GraduationCap} title="No matches yet" />}
    </div>
  )
}