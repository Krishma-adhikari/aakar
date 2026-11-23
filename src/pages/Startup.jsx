import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Check, Circle, Eye, EyeOff, Landmark, MapPin, MessageCircle, Pencil, Plus, Sparkles, Upload, Users, X } from 'lucide-react'
import { Avatar, ChipSelect, Empty, Modal, money } from '../components/ui'
import { BUSINESS_MODELS, KEYWORDS, SECTORS, STAGES } from '../data/demo'
import { useStore } from '../store'
import { recommendInvestors } from '../lib/recommend'
import { StartupCard } from './Investor'

export function StartupHome() {
  const { state, user, entity: s } = useStore()
  const nav = useNavigate()
  const chats = state.conversations.filter((c) => c.ownerId === user.id && c.peer.kind === 'investor')
  const openInvestors = state.investors.filter((i) => i.visible)
  const suggested = recommendInvestors(s, openInvestors).slice(0, 3)

  // What a complete listing needs. Each missing item links to the listing editor.
  const checklist = [
    ['Tagline', !!s.tagline],
    ['Problem statement', !!s.pitch?.problem],
    ['Solution', !!s.pitch?.solution],
    ['Business model', !!s.pitch?.model],
    ['Traction metrics', (s.traction?.length || 0) >= 3],
    ['Executive team', (s.founders?.length || 0) > 0],
    ['Use of funds', (s.useOfFunds?.length || 0) > 0],
    ['Pitch video', !!s.pitchVideo],
    ['Pitch deck', !!s.deck],
  ]
  const done = checklist.filter(([, ok]) => ok).length
  const complete = Math.round((done / checklist.length) * 100)
  const R = 46
  const C = 2 * Math.PI * R
  const firstName = (user.name || '').split(' ')[0]
  const kpis = [
    ['Profile views', (s.views || 0).toLocaleString(), Eye, 'var(--blue)', 'var(--blue-50)'],
    ['Investors talking', chats.length + (s.interested || 0), MessageCircle, 'var(--crimson)', 'var(--crimson-50)'],
    ['Investors open to pitches', openInvestors.length, Landmark, 'var(--violet)', 'var(--violet-50, var(--blue-50))'],
  ]

  return (
    <div className="page">
      <div className="sh-hero">
        <svg className="ridge" viewBox="0 0 800 110" preserveAspectRatio="none" aria-hidden="true"><path d="M0 110 L0 70 L90 30 L150 62 L250 8 L330 58 L420 24 L520 66 L620 20 L710 60 L800 36 L800 110 Z" fill="#fff" /></svg>
        <div className="sh-id">
          <Avatar p={s} size="xl" square />
          <div style={{ minWidth: 0 }}>
            <div className="sh-hello">Namaste, {firstName}</div>
            <h1>{s.name}</h1>
            <div className="sh-chips">
              <span>{s.stage}</span><span>{s.sector}</span>
              {s.location && <span className="row" style={{ gap: 4 }}><MapPin size={12} /> {s.location}</span>}
              <span>Raising {money(s.ask)}</span>
            </div>
            <div className="sh-actions">
              <Link to="/app/profile" className="btn btn-white btn-sm"><Pencil size={15} /> Edit listing</Link>
              <Link to={'/app/startups/' + s.id} className="btn btn-ghost-light btn-sm"><Eye size={15} /> View as investor</Link>
            </div>
          </div>
        </div>
        <div className="sh-ring" title={'Listing ' + complete + '% complete'}>
          <svg viewBox="0 0 112 112" width="112" height="112" aria-hidden="true">
            <circle cx="56" cy="56" r={R} fill="none" stroke="rgba(255,255,255,.22)" strokeWidth="9" />
            <circle cx="56" cy="56" r={R} fill="none" stroke="#fff" strokeWidth="9" strokeLinecap="round" strokeDasharray={`${(complete / 100) * C} ${C}`} transform="rotate(-90 56 56)" />
          </svg>
          <div className="sh-ring-text"><b>{complete}%</b><span>complete</span></div>
        </div>
      </div>

      <div className="kpis kpis-3 mt-6">
        {kpis.map(([l, v, I, c, bg]) => (
          <div key={l} className="card kpi"><div className="ic" style={{ background: bg, color: c }}><I size={18} /></div><div className="v">{v}</div><div className="small muted">{l}</div></div>
        ))}
      </div>

      <div className="detail-grid mt-6">
        <div>
          <div className="row-between"><h3 style={{ fontSize: 22 }}>Investors who fit you</h3><Link to="/app/investors" className="small link">See all</Link></div>
          <div className="stack mt-4" style={{ gap: 12 }}>
            {suggested.length === 0 && <div className="card"><Empty icon={Landmark} title="No investors visible yet" text="Investors choose whether startups can see them. We’ll show the best fits here." /></div>}
            {suggested.map(({ item: inv, reasons }) => (
              <div key={inv.id} className="card card-pad card-hover" style={{ cursor: 'pointer' }} onClick={() => nav('/app/investors')}>
                <div className="row" style={{ alignItems: 'flex-start' }}>
                  <Avatar p={inv} size="lg" />
                  <div className="grow">
                    <div className="bold">{inv.name}</div>
                    <div className="xs muted">{inv.type}{inv.location ? ` · ${inv.location}` : ''}{inv.ticket ? ` · Ticket ${inv.ticket}` : ''}</div>
                    <div className="row wrap mt-2" style={{ gap: 6 }}>{(inv.sectors || []).slice(0, 4).map((x) => <span key={x} className={`chip ${x === s.sector ? 'chip-match' : ''}`}>{x}</span>)}</div>
                    {reasons?.length > 0 && <div className="xs muted row mt-2" style={{ gap: 4 }}><Sparkles size={11} /> {reasons.join(', ')}</div>}
                  </div>
                  <ArrowRight size={16} color="var(--faint)" />
                </div>
              </div>
            ))}
          </div>

          <h3 className="mt-8" style={{ fontSize: 22 }}>Investor conversations</h3>
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
            <div className="row-between"><div className="xs faint bold">STRENGTHEN YOUR LISTING</div><b>{done}/{checklist.length}</b></div>
            <div className="progress blue mt-3"><span style={{ width: complete + '%' }} /></div>
            <ul className="check-list mt-4">
              {checklist.map(([label, ok]) => (
                <li key={label} className={ok ? 'ok' : ''}>
                  <span className="mark">{ok ? <Check size={13} /> : <Circle size={13} />}</span>
                  <span className="grow">{label}</span>
                  {!ok && <Link to="/app/profile" className="xs link">Add</Link>}
                </li>
              ))}
            </ul>
            <p className="xs muted mt-3">Complete listings get 3x more investor chats.</p>
          </div>
          <div className="card card-pad">
            <Landmark size={20} color="var(--blue)" />
            <div className="bold mt-2">{openInvestors.length} investors are open to pitches</div>
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
  const { entity: s, updateEntity, uploadMyDeck, uploadPublicImage, docUrl, toast } = useStore()
  const deckRef = useRef(null)
  const [deckBusy, setDeckBusy] = useState(false)
  const [f, setF] = useState({ tagline: s.tagline, sector: s.sector, stage: s.stage, location: s.location, founded: s.founded, ask: s.ask, equity: s.equity, team: s.team, pitchVideo: s.pitchVideo || '', productDesc: s.product?.desc || '', productWebsite: s.product?.website || '', socialLinkedin: s.socials?.linkedin || '', socialFacebook: s.socials?.facebook || '', socialInstagram: s.socials?.instagram || '', socialOther: s.socials?.other || '', tractionNotes: s.tractionNotes || '', ...s.pitch })
  const [founders, setFounders] = useState(s.founders?.length ? s.founders : [{ name: '', role: '', bg: '', linkedin: '' }])
  const [funds, setFunds] = useState(s.useOfFunds?.length ? s.useOfFunds : [{ label: '', pct: '' }])
  const [metrics, setMetrics] = useState(s.traction || [])
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const setFounder = (i, k, v) => setFounders((p) => p.map((x, j) => (j === i ? { ...x, [k]: v } : x)))
  const total = funds.reduce((a, r) => a + (Number(r.pct) || 0), 0)
  const models = !f.model || BUSINESS_MODELS.includes(f.model) ? BUSINESS_MODELS : [f.model, ...BUSINESS_MODELS]

  const [saving, setSaving] = useState(false)
  const pickExecPhoto = (i) => async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!['image/jpeg', 'image/png'].includes(file.type)) { toast('Use a JPG or PNG image.'); return }
    if (file.size > 5 * 1024 * 1024) { toast('The photo is larger than 5 MB.'); return }
    const url = await uploadPublicImage(file, 'exec' + i)
    if (url) setFounders((p) => p.map((x, j) => (j === i ? { ...x, photo: url } : x)))
  }
  const pickDeck = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (file.type !== 'application/pdf') { toast('Use a PDF file.'); return }
    if (file.size > 20 * 1024 * 1024) { toast('The file is larger than 20 MB.'); return }
    setDeckBusy(true)
    const ok = await uploadMyDeck(file)
    setDeckBusy(false)
    if (ok) toast('Pitch deck updated. Investors can open it from your listing.')
  }
  const viewDeck = async () => {
    const url = await docUrl(s.deck.path)
    if (url) window.open(url, '_blank', 'noopener,noreferrer')
  }
  const save = async () => {
    const asUrl = (v) => { const t = (v || '').trim(); return !t || /^https?:\/\//i.test(t) ? t : 'https://' + t }
    const links = { pitchVideo: asUrl(f.pitchVideo), productWebsite: asUrl(f.productWebsite), socialLinkedin: asUrl(f.socialLinkedin), socialFacebook: asUrl(f.socialFacebook), socialInstagram: asUrl(f.socialInstagram), socialOther: asUrl(f.socialOther) }
    if (Object.values(links).some((u) => u && !/^https?:\/\/\S+\.\S+/.test(u))) { toast('Please check your links. They must be valid web addresses.'); return }
    if (!(f.productDesc || '').trim()) { toast('Please describe your product or service.'); return }
    if (founders.some((x) => !x.name.trim() || !x.role.trim())) { toast('Every executive needs a name and a role.'); return }
    if (founders.some((x) => x.linkedin && !/^https?:\/\/([\w-]+\.)*linkedin\.com\/\S+/i.test(x.linkedin.trim()))) { toast('Use full LinkedIn links (https://linkedin.com/in/…).'); return }
    if (funds.some((r) => !r.label.trim() || !(Number(r.pct) > 0)) || total !== 100) { toast('Use of funds: fill every row and make the percentages add up to 100.'); return }
    setSaving(true)
    const ok = await updateEntity('startups', s.id, {
      tagline: f.tagline, sector: f.sector, stage: f.stage, location: f.location, founded: Number(f.founded) || s.founded,
      ask: Number(f.ask), equity: Number(f.equity), team: Number(f.team),
      pitchVideo: links.pitchVideo, tractionNotes: f.tractionNotes,
      product: { desc: f.productDesc.trim(), website: links.productWebsite },
      socials: { linkedin: links.socialLinkedin, facebook: links.socialFacebook, instagram: links.socialInstagram, other: links.socialOther },
      pitch: { problem: f.problem, solution: f.solution, market: f.market, model: f.model },
      founders: founders.map((x) => ({ name: x.name.trim(), role: x.role.trim(), bg: (x.bg || '').trim(), linkedin: (x.linkedin || '').trim(), photo: x.photo || '' })),
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

        <h3 className="mt-8" style={{ fontSize: 18 }}>Product &amp; links</h3>
        <div className="grid-2 mt-3">
          <div className="field span-2"><label>Your product or service</label><textarea className="textarea" value={f.productDesc} onChange={set('productDesc')} placeholder="What it is, who uses it and how it works" /></div>
          <div className="field span-2"><label>Product website or app link</label><input type="url" className="input" value={f.productWebsite} onChange={set('productWebsite')} placeholder="https://…" /></div>
          <div className="field"><label>LinkedIn page</label><input type="url" className="input" value={f.socialLinkedin} onChange={set('socialLinkedin')} placeholder="https://linkedin.com/company/…" /></div>
          <div className="field"><label>Facebook page</label><input type="url" className="input" value={f.socialFacebook} onChange={set('socialFacebook')} placeholder="https://facebook.com/…" /></div>
          <div className="field"><label>Instagram</label><input type="url" className="input" value={f.socialInstagram} onChange={set('socialInstagram')} placeholder="https://instagram.com/…" /></div>
          <div className="field"><label>Other link (X, YouTube, TikTok…)</label><input type="url" className="input" value={f.socialOther} onChange={set('socialOther')} placeholder="https://…" /></div>
        </div>

        <h3 className="mt-8" style={{ fontSize: 18 }}>Pitch materials</h3>
        <div className="grid-2 mt-3">
          <div className="field span-2">
            <label>Pitch video link</label>
            <input type="url" className="input" value={f.pitchVideo} onChange={set('pitchVideo')} placeholder="https://youtube.com/…" />
            <span className="hint">YouTube, Vimeo, Loom or Google Drive (public or unlisted). Click “Save listing” below to publish a changed link.</span>
          </div>
          <div className="field span-2">
            <label>Pitch deck (PDF, up to 20 MB)</label>
            <div className="row" style={{ gap: 12 }}>
              <span className="small muted grow">{s.deck?.name || 'No pitch deck uploaded yet'}</span>
              <input ref={deckRef} type="file" accept=".pdf,application/pdf" onChange={pickDeck} style={{ display: 'none' }} />
              {s.deck?.path && <button type="button" className="btn btn-ghost btn-sm" onClick={viewDeck}>View</button>}
              <button type="button" className="btn btn-soft btn-sm" disabled={deckBusy} onClick={() => deckRef.current?.click()}><Upload size={14} /> {deckBusy ? 'Uploading…' : s.deck ? 'Replace' : 'Upload'}</button>
            </div>
            <span className="hint">A new deck is saved as soon as it uploads. Investors open it from your startup page.</span>
          </div>
        </div>

        <h3 className="mt-8" style={{ fontSize: 18 }}>Pitch</h3>
        <div className="grid-2 mt-3">
          <div className="field span-2"><label>Problem statement (one line)</label><input className="input" value={f.problem || ''} onChange={set('problem')} /></div>
          <div className="field span-2"><label>Solution</label><textarea className="textarea" value={f.solution || ''} onChange={set('solution')} /></div>
          <div className="field"><label>Business model</label><select className="select" value={f.model || ''} onChange={set('model')}><option value="">Select…</option>{models.map((x) => <option key={x}>{x}</option>)}</select></div>
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
              <div className="row" style={{ gap: 12, marginBottom: 12 }}>
                <Avatar p={{ name: x.name, initials: (x.name || '?').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase(), color: s.color, photo: x.photo }} size="lg" />
                <label className="btn btn-soft btn-sm" style={{ cursor: 'pointer' }}><Upload size={14} /> {x.photo ? 'Change photo' : 'Add photo'}<input type="file" accept=".jpg,.jpeg,.png,image/jpeg,image/png" onChange={pickExecPhoto(i)} style={{ display: 'none' }} /></label>
              </div>
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
  const { user, entity, updateEntity, uploadMyCv, uploadMyPhoto, docUrl, toast } = useStore()
  const listKey = { student: 'students', professional: 'mentors' }[user.role]
  const [f, setF] = useState(entity)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const cvRef = useRef(null)
  const photoRef = useRef(null)
  const [photoBusy, setPhotoBusy] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const asUrl = (v) => { const t = (v || '').trim(); return !t || /^https?:\/\//i.test(t) ? t : 'https://' + t }
  const saveProfile = async () => {
    const patch = { ...f }
    patch.portfolio = asUrl(f.portfolio)
    if (user.role === 'professional') patch.linkedin = asUrl(f.linkedin)
    const bad = [patch.portfolio, patch.linkedin].some((u) => u && !/^https?:\/\/\S+\.\S+/.test(u))
    if (bad) { toast('Please enter valid links (starting with https://).'); return }
    setSaving(true)
    const ok = await updateEntity(listKey, entity.id, patch)
    setSaving(false)
    if (ok) { setF(patch); toast('Profile saved') }
  }
  const pickPhoto = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!['image/jpeg', 'image/png'].includes(file.type)) { toast('Use a JPG or PNG image.'); return }
    if (file.size > 5 * 1024 * 1024) { toast('The photo is larger than 5 MB.'); return }
    setPhotoBusy(true)
    const ok = await uploadMyPhoto(file)
    setPhotoBusy(false)
    if (ok) toast('Photo updated')
  }
  const pickCv = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)) { toast('Use a PDF, JPG or PNG file.'); return }
    if (file.size > 10 * 1024 * 1024) { toast('The file is larger than 10 MB.'); return }
    setUploading(true)
    const ok = await uploadMyCv(file)
    setUploading(false)
    if (ok) { setF((p) => ({ ...p, cv: { name: file.name } })); toast('CV updated') }
  }
  const viewCv = async () => {
    if (!entity.cv?.path) return
    const url = await docUrl(entity.cv.path)
    if (url) window.open(url, '_blank', 'noopener,noreferrer')
  }
  const cvField = (
    <div className="field span-2">
      <label>CV / résumé</label>
      <div className="row" style={{ gap: 12 }}>
        <span className="small muted grow">{f.cv?.name || 'No CV uploaded yet'}</span>
        <input ref={cvRef} type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" onChange={pickCv} style={{ display: 'none' }} />
        {entity.cv?.path && <button type="button" className="btn btn-ghost btn-sm" onClick={viewCv}>View</button>}
        <button type="button" className="btn btn-soft btn-sm" disabled={uploading} onClick={() => cvRef.current?.click()}><Upload size={14} /> {uploading ? 'Uploading…' : f.cv ? 'Replace' : 'Upload'}</button>
      </div>
      <span className="hint">{user.role === 'student' ? 'Mentors you send a request to can open your CV, portfolio and goals.' : 'Students can open your LinkedIn, portfolio and CV from your mentor profile.'}</span>
    </div>
  )
  return (
    <div className="page" style={{ maxWidth: 860 }}>
      <div className="page-head"><div><h1>My profile</h1><p>Verified on Aakar · {user.email}</p></div></div>
      <div className="card card-pad">
        <div className="row"><Avatar p={entity} size="xl" /><div className="grow"><h3 style={{ fontSize: 22 }}>{entity.name}</h3><span className="badge badge-green mt-1">Verified</span></div>{<><input ref={photoRef} type="file" accept=".jpg,.jpeg,.png,image/jpeg,image/png" onChange={pickPhoto} style={{ display: 'none' }} /><button type="button" className="btn btn-soft btn-sm" disabled={photoBusy} onClick={() => photoRef.current?.click()}><Upload size={14} /> {photoBusy ? 'Uploading…' : entity.photo ? 'Change photo' : 'Add photo'}</button></>}</div>
        <div className="grid-2 mt-6">
          {user.role === 'student' && <>
            <div className="span-2 xs faint bold">ABOUT YOU</div>
            <div className="field"><label>Institution</label><input className="input" value={f.institution} onChange={set('institution')} /></div>
            <div className="field"><label>Level</label><input className="input" value={f.level} onChange={set('level')} /></div>
            <div className="field"><label>City</label><input className="input" value={f.city || ''} onChange={set('city')} /></div>
            <div className="span-2 xs faint bold mt-4">INTERESTS</div>
            <div className="field span-2"><label>Used for mentor matching and session notifications (up to 6)</label><ChipSelect options={KEYWORDS} value={f.interests} onChange={(v) => setF({ ...f, interests: v })} max={6} /></div>
            <div className="span-2 xs faint bold mt-4">FUTURE GOALS</div>
            <div className="field span-2"><label>Where do you want to be, and what would you like help with?</label><textarea className="textarea" value={f.goal || ''} onChange={set('goal')} placeholder="e.g. MS in Computer Science in the USA with a scholarship" /></div>
            <div className="span-2 xs faint bold mt-4">PORTFOLIO &amp; CV</div>
            <div className="field span-2"><label>Portfolio link</label><input type="url" className="input" value={f.portfolio || ''} onChange={set('portfolio')} placeholder="https://github.com/… or your website" /></div>
            {cvField}
          </>}
          {user.role === 'professional' && <>
            <div className="field"><label>Title</label><input className="input" value={f.title} onChange={set('title')} /></div>
            <div className="field"><label>Company</label><input className="input" value={f.company} onChange={set('company')} /></div>
            <div className="field span-2"><label>Bio</label><textarea className="textarea" value={f.bio} onChange={set('bio')} /></div>
            <div className="field"><label>LinkedIn</label><input type="url" className="input" value={f.linkedin || ''} onChange={set('linkedin')} placeholder="https://linkedin.com/in/…" /></div>
            <div className="field"><label>Portfolio / website</label><input type="url" className="input" value={f.portfolio || ''} onChange={set('portfolio')} placeholder="https://…" /></div>
            {cvField}
            <div className="field span-2"><label>Expertise (students are matched on these)</label><ChipSelect options={KEYWORDS} value={f.fields} onChange={(v) => setF({ ...f, fields: v })} max={6} /></div>
          </>}
        </div>
        <div className="row mt-6" style={{ justifyContent: 'flex-end' }}><button className="btn btn-dark" onClick={saveProfile} disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button></div>
      </div>
      {user.role === 'professional' && <div className="card card-pad mt-6 row"><Users size={20} color="var(--green)" /><div className="small"><b>Thank you for volunteering.</b> You’ve mentored {entity.mentees} students so far.</div></div>}
    </div>
  )
}