import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Eye, EyeOff, Landmark, MapPin, MessageCircle, TrendingUp, Users, Wrench } from 'lucide-react'
import { Avatar, ChipSelect, Empty, Modal, money } from '../components/ui'
import { KEYWORDS, SECTORS, STAGES } from '../data/demo'
import { useStore } from '../store'
import { StartupCard } from './Investor'

export function StartupHome() {
  const { state, user, entity: s } = useStore()
  const nav = useNavigate()
  const chats = state.conversations.filter((c) => c.ownerId === user.id && c.peer.kind === 'investor')
  const fields = [s.tagline, s.pitch.problem, s.pitch.solution, s.pitch.market, s.pitch.model, s.traction.length >= 3, s.founders.length]
  const complete = Math.round((fields.filter(Boolean).length / fields.length) * 100)

  return (
    <div className="page">
      <div className="page-head">
        <div><h1>{s.name}</h1><p>Your startup on Aakar · {s.stage} · raising {money(s.ask)}</p></div>
        <Link to={'/app/startups/' + s.id} className="btn btn-ghost"><Eye size={16} /> View as investor</Link>
      </div>
      <div className="kpis">
        {[['Profile views', s.views.toLocaleString(), Eye, 'var(--blue)', 'var(--blue-50)'], ['Investors talking', chats.length + s.interested, MessageCircle, 'var(--crimson)', 'var(--crimson-50)'], ['Committed', money(s.raised), TrendingUp, 'var(--green)', 'var(--green-50)'], ['Of goal', Math.round((s.raised / s.ask) * 100) + '%', Landmark, 'var(--amber)', 'var(--amber-50)']].map(([l, v, I, c, bg]) => (
          <div key={l} className="card kpi"><div className="ic" style={{ background: bg, color: c }}><I size={18} /></div><div className="v">{v}</div><div className="small muted">{l}</div></div>
        ))}
      </div>
      <div className="detail-grid mt-6">
        <div>
          <h3 style={{ fontSize: 22 }}>Investor conversations</h3>
          <div className="card mt-4" style={{ padding: '4px 20px' }}>
            {chats.length === 0 && <Empty icon={MessageCircle} title="No investor messages yet" text="Investors start chats from your listing." />}
            {chats.map((c) => (
              <div key={c.id} className="list-row" style={{ cursor: 'pointer' }} onClick={() => nav('/app/messages?c=' + c.id)}>
                <Avatar p={c.peer} />
                <div className="grow"><div className="bold small">{c.peer.name}</div><div className="xs muted" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.messages.at(-1)?.text}</div></div>
                <ArrowRight size={16} color="var(--faint)" />
              </div>
            ))}
          </div>
          <h3 className="mt-8" style={{ fontSize: 22 }}>How investors see you</h3>
          <div className="mt-4" style={{ maxWidth: 420 }}><StartupCard s={s} /></div>
        </div>
        <div className="stack">
          <div className="card card-pad">
            <div className="row-between"><div className="xs faint bold">LISTING COMPLETENESS</div><b>{complete}%</b></div>
            <div className="progress blue mt-3"><span style={{ width: complete + '%' }} /></div>
            <p className="xs muted mt-3">Complete listings get 3x more investor chats.</p>
            <Link to="/app/profile" className="btn btn-dark btn-sm mt-3">Edit listing</Link>
          </div>
          <div className="card card-pad">
            <Landmark size={20} color="var(--blue)" />
            <div className="bold mt-2">{state.investors.filter((i) => i.visible).length} investors are open to pitches</div>
            <p className="small muted mt-1">Some investors choose to make their profile visible to startups.</p>
            <Link to="/app/investors" className="btn btn-blue btn-sm mt-3">Browse investors</Link>
          </div>
          <div className="card card-pad">
            <Wrench size={20} color="var(--teal)" />
            <div className="bold mt-2">Stuck on a tech problem?</div>
            <p className="small muted mt-1">Post it on the Help Desk and get advice from engineers abroad.</p>
            <Link to="/app/helpdesk" className="btn btn-ghost btn-sm mt-3">Open Help Desk</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export function InvestorsDirectory() {
  const { state, entity: s, startChat, sendMessage, toast } = useStore()
  const nav = useNavigate()
  const [pitching, setPitching] = useState(null)
  const [msg, setMsg] = useState('')
  const visible = state.investors.filter((i) => i.visible)
  const hidden = state.investors.length - visible.length

  const send = () => {
    const cid = startChat({ name: pitching.name, initials: pitching.initials, color: pitching.color, subtitle: `${pitching.type} · ${pitching.location}`, kind: 'investor', refId: pitching.id }, `Intro request from ${s.name}`)
    setTimeout(() => sendMessage(cid, msg, 'investor'), 0)
    toast(`Intro sent to ${pitching.name}`)
    nav('/app/messages?c=' + cid)
  }

  return (
    <div className="page">
      <div className="page-head"><div><h1>Investors</h1><p>Investors who chose to be visible to startups. {hidden > 0 && `${hidden} more are browsing privately.`}</p></div></div>
      <div className="startup-grid">
        {visible.map((i) => (
          <div key={i.id} className="card card-pad stack" style={{ gap: 14 }}>
            <div className="row"><Avatar p={i} size="lg" /><div className="grow"><div className="bold" style={{ fontSize: 16 }}>{i.name}</div><div className="small muted">{i.type}</div><div className="xs muted row mt-1" style={{ gap: 4 }}><MapPin size={11} /> {i.location}</div></div></div>
            <p className="small" style={{ color: 'var(--ink-2)' }}>{i.bio}</p>
            <div className="row wrap" style={{ gap: 6 }}>{i.sectors.map((x) => <span key={x} className={`chip ${x === s.sector ? 'chip-match' : ''}`}>{x}</span>)}</div>
            <div className="row-between small"><span className="muted">Ticket <b style={{ color: 'var(--ink)' }}>{i.ticket}</b></span><span className="muted">{i.deals} deals</span></div>
            <button className="btn btn-dark btn-block" onClick={() => { setPitching(i); setMsg(`Namaste! I’m ${s.founders[0].name}, founder of ${s.name}. ${s.tagline} We’re raising ${money(s.ask)} at ${s.stage} stage. Would you be open to a quick call?`) }}><MessageCircle size={16} /> Send intro</button>
          </div>
        ))}
        <div className="card card-pad" style={{ background: 'var(--paper-2)', borderStyle: 'dashed', display: 'grid', placeItems: 'center', textAlign: 'center' }}>
          <div><EyeOff size={24} color="var(--faint)" style={{ margin: '0 auto' }} /><div className="bold mt-2">{hidden} private investor{hidden !== 1 && 's'}</div><p className="small muted mt-1">They can still find you and message you first.</p></div>
        </div>
      </div>
      {pitching && (
        <Modal title={`Intro to ${pitching.name}`} onClose={() => setPitching(null)}>
          <textarea className="textarea" rows={6} value={msg} onChange={(e) => setMsg(e.target.value)} />
          <div className="row mt-4" style={{ justifyContent: 'flex-end' }}><button className="btn btn-ghost" onClick={() => setPitching(null)}>Cancel</button><button className="btn btn-primary" onClick={send} disabled={!msg.trim()}>Send intro</button></div>
        </Modal>
      )}
    </div>
  )
}

export function StartupProfile() {
  const { entity: s, updateEntity, toast } = useStore()
  const [f, setF] = useState({ tagline: s.tagline, sector: s.sector, stage: s.stage, location: s.location, ask: s.ask, equity: s.equity, team: s.team, ...s.pitch })
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const save = () => {
    updateEntity('startups', s.id, { tagline: f.tagline, sector: f.sector, stage: f.stage, location: f.location, ask: Number(f.ask), equity: Number(f.equity), team: Number(f.team), pitch: { problem: f.problem, solution: f.solution, market: f.market, model: f.model } })
    toast('Listing updated. Investors see the changes right away.')
  }
  return (
    <div className="page" style={{ maxWidth: 900 }}>
      <div className="page-head"><div><h1>My listing</h1><p>Your public profile, pitch and funding ask.</p></div><Link to={'/app/startups/' + s.id} className="btn btn-ghost"><Eye size={16} /> Preview</Link></div>
      <div className="card card-pad">
        <div className="row"><Avatar p={s} size="lg" square /><div><h3 style={{ fontSize: 22 }}>{s.name}</h3><div className="small muted">Founded {s.founded}</div></div></div>
        <div className="grid-2 mt-6">
          <div className="field span-2"><label>One-line pitch</label><input className="input" value={f.tagline} onChange={set('tagline')} /></div>
          <div className="field"><label>Sector</label><select className="select" value={f.sector} onChange={set('sector')}>{SECTORS.map((x) => <option key={x}>{x}</option>)}</select></div>
          <div className="field"><label>Stage</label><select className="select" value={f.stage} onChange={set('stage')}>{STAGES.map((x) => <option key={x}>{x}</option>)}</select></div>
          <div className="field"><label>Location</label><input className="input" value={f.location} onChange={set('location')} /></div>
          <div className="field"><label>Team size</label><input type="number" className="input" value={f.team} onChange={set('team')} /></div>
          <div className="field"><label>Funding ask (USD)</label><input type="number" className="input" value={f.ask} onChange={set('ask')} /></div>
          <div className="field"><label>Equity offered (%)</label><input type="number" className="input" value={f.equity} onChange={set('equity')} /></div>
          {[['problem', 'Problem'], ['solution', 'Solution'], ['market', 'Market'], ['model', 'Business model']].map(([k, l]) => <div key={k} className="field span-2"><label>{l}</label><textarea className="textarea" value={f[k]} onChange={set(k)} /></div>)}
        </div>
        <div className="row mt-6" style={{ justifyContent: 'flex-end' }}><button className="btn btn-dark" onClick={save}>Save listing</button></div>
      </div>
    </div>
  )
}

// Profile page for students, professionals and organizations
export function Profile() {
  const { user, entity, updateEntity, toast } = useStore()
  const listKey = { student: 'students', professional: 'mentors', organization: 'organizations' }[user.role]
  const [f, setF] = useState(entity)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  return (
    <div className="page" style={{ maxWidth: 860 }}>
      <div className="page-head"><div><h1>{user.role === 'organization' ? 'Organization profile' : 'My profile'}</h1><p>Verified on Aakar · {user.email}</p></div></div>
      <div className="card card-pad">
        <div className="row"><Avatar p={entity} size="lg" square={user.role === 'organization'} /><div><h3 style={{ fontSize: 22 }}>{entity.name}</h3><span className="badge badge-green mt-1">Verified</span></div></div>
        <div className="grid-2 mt-6">
          {user.role === 'student' && <>
            <div className="field"><label>Institution</label><input className="input" value={f.institution} onChange={set('institution')} /></div>
            <div className="field"><label>Level</label><input className="input" value={f.level} onChange={set('level')} /></div>
            <div className="field span-2"><label>Goal</label><textarea className="textarea" value={f.goal} onChange={set('goal')} /></div>
            <div className="field span-2"><label>Interests (used for mentor matching and session notifications)</label><ChipSelect options={KEYWORDS} value={f.interests} onChange={(v) => setF({ ...f, interests: v })} max={6} /></div>
          </>}
          {user.role === 'professional' && <>
            <div className="field"><label>Title</label><input className="input" value={f.title} onChange={set('title')} /></div>
            <div className="field"><label>Company</label><input className="input" value={f.company} onChange={set('company')} /></div>
            <div className="field span-2"><label>Bio</label><textarea className="textarea" value={f.bio} onChange={set('bio')} /></div>
            <div className="field span-2"><label>Expertise (students are matched on these)</label><ChipSelect options={KEYWORDS} value={f.fields} onChange={(v) => setF({ ...f, fields: v })} max={6} /></div>
          </>}
          {user.role === 'organization' && <>
            <div className="field"><label>Type</label><input className="input" value={f.type} onChange={set('type')} /></div>
            <div className="field"><label>District</label><input className="input" value={f.district} onChange={set('district')} /></div>
          </>}
        </div>
        <div className="row mt-6" style={{ justifyContent: 'flex-end' }}><button className="btn btn-dark" onClick={() => { updateEntity(listKey, entity.id, f); toast('Profile saved') }}>Save changes</button></div>
      </div>
      {user.role === 'professional' && <div className="card card-pad mt-6 row"><Users size={20} color="var(--green)" /><div className="small"><b>Thank you for volunteering.</b> You’ve mentored {entity.mentees} students so far.</div></div>}
    </div>
  )
}
