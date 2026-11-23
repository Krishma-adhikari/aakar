import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Eye, EyeOff, Landmark, MapPin, MessageCircle, Plus, Sparkles, TrendingUp, Users, X } from 'lucide-react'
import { Avatar, ChipSelect, Empty, Modal, money } from '../components/ui'
import { BUSINESS_MODELS, KEYWORDS, SECTORS, STAGES } from '../data/demo'
import { useStore } from '../store'
import { recommendInvestors } from '../lib/recommend'
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
  // Best-fit investors first: text matching on sectors, bio and your pitch, plus stage and ticket fit.
  const ranked = recommendInvestors(s, visible)

  const send = () => {
    const cid = startChat({ name: pitching.name, initials: pitching.initials, color: pitching.color, subtitle: `${pitching.type} · ${pitching.location}`, kind: 'investor', refId: pitching.id }, `Intro request from ${s.name}`)
    setTimeout(() => sendMessage(cid, msg, 'investor'), 0)
    toast(`Intro sent to ${pitching.name}`)
    nav('/app/messages?c=' + cid)
  }

  return (
    <div className="page">
      <div className="page-head"><div><h1>Investors</h1><p>Investors who chose to be visible to startups, best fit for {s.name} first. {hidden > 0 && `${hidden} more are browsing privately.`}</p></div></div>
      <div className="startup-grid">
        {ranked.map(({ item: i, reasons }) => (
          <div key={i.id} className="card card-pad stack" style={{ gap: 14 }}>
            <div className="row"><Avatar p={i} size="lg" /><div className="grow"><div className="bold" style={{ fontSize: 16 }}>{i.name}</div><div className="small muted">{i.type}</div><div className="xs muted row mt-1" style={{ gap: 4 }}><MapPin size={11} /> {i.location}</div></div></div>
            <p className="small" style={{ color: 'var(--ink-2)' }}>{i.bio}</p>
            <div className="row wrap" style={{ gap: 6 }}>{i.sectors.map((x) => <span key={x} className={`chip ${x === s.sector ? 'chip-match' : ''}`}>{x}</span>)}</div>
            {reasons.length > 0 && <div className="xs muted row" style={{ gap: 4 }}><Sparkles size={11} /> Why this investor: {reasons.join(', ')}</div>}
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
  const [f, setF] = useState({ tagline: s.tagline, sector: s.sector, stage: s.stage, location: s.location, founded: s.founded, ask: s.ask, equity: s.equity, team: s.team, pitchVideo: s.pitchVideo || '', tractionNotes: s.tractionNotes || '', ...s.pitch })
  const [founders, setFounders] = useState(s.founders?.length ? s.founders : [{ name: '', role: '', bg: '', linkedin: '' }])
  const [funds, setFunds] = useState(s.useOfFunds?.length ? s.useOfFunds : [{ label: '', pct: '' }])
  const [metrics, setMetrics] = useState(s.traction || [])
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const setFounder = (i, k, v) => setFounders((p) => p.map((x, j) => (j === i ? { ...x, [k]: v } : x)))
  const total = funds.reduce((a, r) => a + (Number(r.pct) || 0), 0)
  const models = !f.model || BUSINESS_MODELS.includes(f.model) ? BUSINESS_MODELS : [f.model, ...BUSINESS_MODELS]

  const [saving, setSaving] = useState(false)
  const save = async () => {
    if (f.pitchVideo && !/^https?:\/\/\S+$/i.test(f.pitchVideo.trim())) { toast('Pitch video must be a full link starting with https://'); return }
    if (founders.some((x) => !x.name.trim() || !x.role.trim())) { toast('Every executive needs a name and a role.'); return }
    if (founders.some((x) => x.linkedin && !/^https?:\/\/([\w-]+\.)*linkedin\.com\/\S+/i.test(x.linkedin.trim()))) { toast('Use full LinkedIn links (https://linkedin.com/in/…).'); return }
    if (funds.some((r) => !r.label.trim() || !(Number(r.pct) > 0)) || total !== 100) { toast('Use of funds: fill every row and make the percentages add up to 100.'); return }
    setSaving(true)
    const ok = await updateEntity('startups', s.id, {
      tagline: f.tagline, sector: f.sector, stage: f.stage, location: f.location, founded: Number(f.founded) || s.founded,
      ask: Number(f.ask), equity: Number(f.equity), team: Number(f.team),
      pitchVideo: f.pitchVideo.trim(), tractionNotes: f.tractionNotes,
      pitch: { problem: f.problem, solution: f.solution, market: f.market, model: f.model },
      founders: founders.map((x) => ({ name: x.name.trim(), role: x.role.trim(), bg: (x.bg || '').trim(), linkedin: (x.linkedin || '').trim() })),
      useOfFunds: funds.map((r) => ({ label: r.label.trim(), pct: Number(r.pct) })),
      traction: metrics.filter((m) => m.k.trim() && String(m.v).trim()),
    })
    setSaving(false)
    if (ok) toast('Listing updated. Investors see the changes right away.')
  }
  return (
    <div className="page" style={{ maxWidth: 900 }}>
      <div className="page-head"><div><h1>My listing</h1><p>Your public profile, pitch and funding ask.</p></div><Link to={'/app/startups/' + s.id} className="btn btn-ghost"><Eye size={16} /> Preview</Link></div>
      <div className="card card-pad">
        <div className="row"><Avatar p={s} size="lg" square /><div><h3 style={{ fontSize: 22 }}>{s.name}</h3><div className="small muted">Founded {s.founded} · {s.sector}</div></div></div>

        <h3 className="mt-6" style={{ fontSize: 18 }}>Company</h3>
        <div className="grid-2 mt-3">
          <div className="field span-2"><label>Tagline (shown on your card)</label><input className="input" value={f.tagline} onChange={set('tagline')} /></div>
          <div className="field"><label>Sector</label><select className="select" value={f.sector} onChange={set('sector')}>{SECTORS.map((x) => <option key={x}>{x}</option>)}</select></div>
          <div className="field"><label>Stage</label><select className="select" value={f.stage} onChange={set('stage')}>{STAGES.map((x) => <option key={x}>{x}</option>)}</select></div>
          <div className="field"><label>Based in</label><input className="input" value={f.location} onChange={set('location')} /></div>
          <div className="field"><label>Year founded</label><input type="number" className="input" value={f.founded} onChange={set('founded')} /></div>
          <div className="field"><label>Team size</label><input type="number" className="input" value={f.team} onChange={set('team')} /></div>
          <div className="field"><label>Funding ask (USD)</label><input type="number" className="input" value={f.ask} onChange={set('ask')} /></div>
          <div className="field"><label>Equity offered (%)</label><input type="number" className="input" value={f.equity} onChange={set('equity')} /></div>
        </div>

        <h3 className="mt-8" style={{ fontSize: 18 }}>Pitch</h3>
        <div className="grid-2 mt-3">
          <div className="field span-2"><label>Problem statement (one line)</label><input className="input" value={f.problem || ''} onChange={set('problem')} /></div>
          <div className="field span-2"><label>Solution</label><textarea className="textarea" value={f.solution || ''} onChange={set('solution')} /></div>
          <div className="field"><label>Business model</label><select className="select" value={f.model || ''} onChange={set('model')}><option value="">Select…</option>{models.map((x) => <option key={x}>{x}</option>)}</select></div>
          <div className="field"><label>Pitch video link</label><input type="url" className="input" value={f.pitchVideo} onChange={set('pitchVideo')} placeholder="https://youtube.com/…" /></div>
          <div className="field span-2"><label>Market</label><textarea className="textarea" value={f.market || ''} onChange={set('market')} /></div>
        </div>

        <h3 className="mt-8" style={{ fontSize: 18 }}>Traction</h3>
        <div className="stack mt-3" style={{ gap: 10 }}>
          {metrics.map((m, i) => (
            <div key={i} className="row" style={{ gap: 10 }}>
              <input className="input grow" value={m.k} placeholder="Metric, e.g. Users" onChange={(e) => setMetrics((p) => p.map((x, j) => (j === i ? { ...x, k: e.target.value } : x)))} />
              <input className="input grow" value={m.v} placeholder="Value, e.g. 1,200" onChange={(e) => setMetrics((p) => p.map((x, j) => (j === i ? { ...x, v: e.target.value } : x)))} />
              <button type="button" className="icon-btn" aria-label="Remove metric" onClick={() => setMetrics((p) => p.filter((_, j) => j !== i))}><X size={16} /></button>
            </div>
          ))}
          {metrics.length < 4 && <div><button type="button" className="btn btn-soft btn-sm" onClick={() => setMetrics((p) => [...p, { k: '', v: '' }])}><Plus size={14} /> Add metric</button></div>}
          <div className="field"><label>Milestones</label><textarea className="textarea" value={f.tractionNotes} onChange={set('tractionNotes')} placeholder="Pilots, partnerships, awards, waitlist" /></div>
        </div>

        <h3 className="mt-8" style={{ fontSize: 18 }}>Executive team</h3>
        <div className="stack mt-3">
          {founders.map((x, i) => (
            <div key={i} className="card card-pad">
              <div className="row-between"><b className="small">Executive {i + 1}</b>{founders.length > 1 && <button type="button" className="btn btn-ghost btn-sm" onClick={() => setFounders((p) => p.filter((_, j) => j !== i))}><X size={14} /> Remove</button>}</div>
              <div className="grid-2 mt-3">
                <div className="field"><label>Full name</label><input className="input" value={x.name} onChange={(e) => setFounder(i, 'name', e.target.value)} /></div>
                <div className="field"><label>Role</label><input className="input" value={x.role} onChange={(e) => setFounder(i, 'role', e.target.value)} /></div>
                <div className="field span-2"><label>LinkedIn</label><input type="url" className="input" value={x.linkedin || ''} onChange={(e) => setFounder(i, 'linkedin', e.target.value)} placeholder="https://linkedin.com/in/…" /></div>
                <div className="field span-2"><label>Short bio</label><textarea className="textarea" value={x.bg || ''} onChange={(e) => setFounder(i, 'bg', e.target.value)} /></div>
              </div>
            </div>
          ))}
          {founders.length < 4 && <div><button type="button" className="btn btn-soft btn-sm" onClick={() => setFounders((p) => [...p, { name: '', role: '', bg: '', linkedin: '' }])}><Plus size={14} /> Add executive</button></div>}
        </div>

        <h3 className="mt-8" style={{ fontSize: 18 }}>Use of funds</h3>
        <div className="stack mt-3" style={{ gap: 10 }}>
          {funds.map((r, i) => (
            <div key={i} className="row" style={{ gap: 10 }}>
              <input className="input grow" value={r.label} placeholder="e.g. Product development" onChange={(e) => setFunds((p) => p.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
              <input className="input" style={{ width: 100 }} type="number" min="1" max="100" value={r.pct} placeholder="%" onChange={(e) => setFunds((p) => p.map((x, j) => (j === i ? { ...x, pct: e.target.value } : x)))} />
              <button type="button" className="icon-btn" aria-label="Remove row" disabled={funds.length === 1} onClick={() => setFunds((p) => p.filter((_, j) => j !== i))}><X size={16} /></button>
            </div>
          ))}
          <div className="row-between">
            <button type="button" className="btn btn-soft btn-sm" onClick={() => setFunds((p) => [...p, { label: '', pct: '' }])}><Plus size={14} /> Add row</button>
            <span className="small" style={{ color: total === 100 ? 'var(--green)' : 'var(--muted)' }}>Total: <b>{total}%</b></span>
          </div>
        </div>

        <div className="row mt-8" style={{ justifyContent: 'flex-end' }}><button className="btn btn-dark" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save listing'}</button></div>
      </div>
    </div>
  )
}

// Profile page for students and professionals
export function Profile() {
  const { user, entity, updateEntity, toast } = useStore()
  const listKey = { student: 'students', professional: 'mentors' }[user.role]
  const [f, setF] = useState(entity)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  return (
    <div className="page" style={{ maxWidth: 860 }}>
      <div className="page-head"><div><h1>My profile</h1><p>Verified on Aakar · {user.email}</p></div></div>
      <div className="card card-pad">
        <div className="row"><Avatar p={entity} size="lg" /><div><h3 style={{ fontSize: 22 }}>{entity.name}</h3><span className="badge badge-green mt-1">Verified</span></div></div>
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
        </div>
        <div className="row mt-6" style={{ justifyContent: 'flex-end' }}><button className="btn btn-dark" onClick={() => { updateEntity(listKey, entity.id, f); toast('Profile saved') }}>Save changes</button></div>
      </div>
      {user.role === 'professional' && <div className="card card-pad mt-6 row"><Users size={20} color="var(--green)" /><div className="small"><b>Thank you for volunteering.</b> You’ve mentored {entity.mentees} students so far.</div></div>}
    </div>
  )
}