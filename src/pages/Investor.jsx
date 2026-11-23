import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, BadgeCheck, Bookmark, BookmarkCheck, Calendar, Eye, EyeOff, MapPin, MessageCircle, Rocket, Search, Sparkles, Users } from 'lucide-react'
import { Avatar, ChipSelect, Empty, Modal, Toggle, money } from '../components/ui'
import { SECTORS, STAGES } from '../data/demo'
import { useStore } from '../store'
import { recommendStartups } from '../lib/recommend'

export function StartupCard({ s, saved, onSave, why }) {
  const nav = useNavigate()
  return (
    <div className="card card-hover s-card" onClick={() => nav('/app/startups/' + s.id)}>
      <div className="row" style={{ alignItems: 'flex-start' }}>
        <Avatar p={s} size="lg" square />
        <div className="grow">
          <div className="row" style={{ gap: 6 }}><h3>{s.name}</h3><BadgeCheck size={16} color="var(--green)" /></div>
          <div className="xs muted row mt-1" style={{ gap: 4 }}><MapPin size={11} /> {s.location} · Founded {s.founded}</div>
          <div className="row mt-2" style={{ gap: 6 }}><span className="badge badge-blue">{s.sector}</span><span className="badge badge-gray">{s.stage}</span></div>
        </div>
        {onSave && <button className="icon-btn" onClick={(e) => { e.stopPropagation(); onSave(s.id) }} aria-label="Save">{saved ? <BookmarkCheck size={17} color="var(--primary)" /> : <Bookmark size={17} />}</button>}
      </div>
      <p className="small" style={{ color: 'var(--ink-2)', minHeight: 44 }}>{s.tagline}</p>
      {why?.length > 0 && <div className="xs muted row" style={{ gap: 4 }}><Sparkles size={11} /> Recommended because: {why.join(', ')}</div>}
      <div className="metrics-mini">{s.traction.map((t) => <div key={t.k}><div className="k">{t.k}</div><div className="v">{t.v}</div></div>)}</div>
      <div>
        <div className="row-between small"><span><b>{money(s.raised)}</b> <span className="muted">raised</span></span><span className="muted">Ask <b style={{ color: 'var(--ink)' }}>{money(s.ask)}</b> · {s.equity}% equity</span></div>
        <div className="progress mt-2"><span style={{ width: `${Math.min(100, (s.raised / s.ask) * 100)}%` }} /></div>
      </div>
    </div>
  )
}

export function InvestorHome() {
  const { state, user, entity } = useStore()
  const nav = useNavigate()
  const savedIds = state.saved[user.id] || []
  const watchlist = state.startups.filter((s) => savedIds.includes(s.id))
  const chats = state.conversations.filter((c) => c.ownerId === user.id && c.peer.kind === 'startup')
  const recs = useMemo(() => recommendStartups(entity, state.startups), [entity, state.startups])
  const totalAsk = state.startups.reduce((a, s) => a + (s.ask || 0), 0)
  const totalRaised = state.startups.reduce((a, s) => a + (s.raised || 0), 0)
  const bySector = Object.entries(state.startups.reduce((o, s) => ({ ...o, [s.sector]: (o[s.sector] || 0) + 1 }), {})).sort((a, b) => b[1] - a[1])
  const mySectors = entity.sectors || []
  const kpis = [
    ['Startups to explore', state.startups.length, Rocket, 'var(--blue)', 'var(--blue-50)'],
    ['Matched to you', recs.length, Sparkles, 'var(--violet)', 'var(--violet-50, var(--blue-50))'],
    ['Saved', watchlist.length, Bookmark, 'var(--amber)', 'var(--amber-50)'],
    ['Founder chats', chats.length, MessageCircle, 'var(--crimson)', 'var(--crimson-50)'],
  ]

  return (
    <div className="page">
      <div className="page-head">
        <div><h1>Namaste, {entity.name.split(' ')[0]}</h1><p>{entity.type}{entity.location ? ` · ${entity.location}` : ''}{entity.ticket ? ` · Ticket ${entity.ticket}` : ''}</p></div>
        <Link to="/app/startups" className="btn btn-primary"><Search size={17} /> Discover startups</Link>
      </div>
      <div className="kpis">
        {kpis.map(([l, v, I, c, bg]) => (
          <div key={l} className="card kpi"><div className="ic" style={{ background: bg, color: c }}><I size={18} /></div><div className="v">{v}</div><div className="small muted">{l}</div></div>
        ))}
      </div>

      <div className="detail-grid mt-6">
        <div>
          <div className="row-between"><h3 style={{ fontSize: 22 }}>Recommended for you</h3><Link to="/app/startups" className="small link">See all</Link></div>
          {recs.length ? (
            <div className="grid-2 mt-4">
              {recs.slice(0, 2).map(({ item, reasons }) => <StartupCard key={item.id} s={item} why={reasons} />)}
            </div>
          ) : <div className="card mt-4"><Empty icon={Sparkles} title="No matches yet" text="Add sectors and a bio to your profile and we’ll recommend startups." action={<Link to="/app/profile" className="btn btn-dark">Edit profile</Link>} /></div>}

          <h3 className="mt-8" style={{ fontSize: 22 }}>Founder conversations</h3>
          <div className="card mt-4" style={{ padding: '4px 20px' }}>
            {chats.length === 0 && <Empty icon={MessageCircle} title="No conversations yet" text="Open a startup and start a chat with its founders." />}
            {chats.slice(0, 5).map((c) => (
              <div key={c.id} className="list-row" style={{ cursor: 'pointer' }} onClick={() => nav('/app/messages?c=' + c.id)}>
                <Avatar p={c.peer} />
                <div className="grow"><div className="bold small">{c.peer.name}</div><div className="xs muted" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.messages.at(-1)?.text}</div></div>
                <ArrowRight size={16} color="var(--faint)" />
              </div>
            ))}
          </div>
        </div>

        <div className="stack">
          <div className="card card-pad">
            <div className="xs faint bold">YOUR INVESTMENT FOCUS</div>
            <div className="row wrap mt-3" style={{ gap: 6 }}>{mySectors.length ? mySectors.map((s) => <span key={s} className="chip chip-match">{s}</span>) : <span className="small muted">No sectors chosen yet.</span>}</div>
            <div className="row-between small mt-3"><span className="muted">Typical ticket</span><b>{entity.ticket || '—'}</b></div>
            <div className="row-between small mt-2"><span className="muted">Visible to startups</span><span className={`badge ${entity.visible ? 'badge-green' : 'badge-gray'}`}>{entity.visible ? 'Yes' : 'No'}</span></div>
            <Link to="/app/profile" className="btn btn-ghost btn-sm mt-3">Edit profile</Link>
          </div>

          <div className="card card-pad">
            <div className="row-between"><div className="xs faint bold">MY WATCHLIST</div><Link to="/app/saved" className="xs link">Manage</Link></div>
            {watchlist.length === 0 && <p className="small muted mt-3">Nothing saved yet. Tap the bookmark on any startup.</p>}
            {watchlist.slice(0, 4).map((s) => (
              <div key={s.id} className="list-row" style={{ cursor: 'pointer' }} onClick={() => nav('/app/startups/' + s.id)}>
                <Avatar p={s} size="sm" square />
                <div className="grow"><div className="small bold">{s.name}</div><div className="xs muted">{s.sector} · {s.stage}</div></div>
                <span className="xs muted">{money(s.ask)}</span>
              </div>
            ))}
          </div>

          <div className="card card-pad">
            <div className="xs faint bold">MARKET SNAPSHOT</div>
            <div className="row-between small mt-3"><span className="muted">Total being raised</span><b>{money(totalAsk)}</b></div>
            <div className="row-between small mt-2"><span className="muted">Already committed</span><b>{money(totalRaised)}</b></div>
            <div className="progress blue mt-3"><span style={{ width: Math.min(100, totalAsk ? (totalRaised / totalAsk) * 100 : 0) + '%' }} /></div>
            <div className="row wrap mt-3" style={{ gap: 6 }}>{bySector.slice(0, 5).map(([s, n]) => <span key={s} className="badge badge-gray">{s} · {n}</span>)}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function Discover() {
  const { state, user, entity, toggleSave } = useStore()
  const isInvestor = user.role === 'investor'
  const [q, setQ] = useState('')
  const [sectors, setSectors] = useState([])
  const [stage, setStage] = useState('')
  const [sort, setSort] = useState(isInvestor ? 'recommended' : 'trending')
  const saved = state.saved[user.id] || []

  // Recommendations for investors: text matching on sectors, bio and each startup's pitch, plus stage and ticket fit.
  const recs = useMemo(() => (isInvestor && entity ? recommendStartups(entity, state.startups) : []), [isInvestor, entity, state.startups])
  const recBy = useMemo(() => Object.fromEntries(recs.map((r) => [r.item.id, r])), [recs])

  const list = useMemo(() => {
    let l = state.startups.filter((s) =>
      (!q || (s.name + s.tagline + s.location + s.sector).toLowerCase().includes(q.toLowerCase())) &&
      (!sectors.length || sectors.includes(s.sector)) && (!stage || s.stage === stage))
    if (sort === 'recommended') l = [...l].sort((a, b) => (recBy[b.id]?.score || 0) - (recBy[a.id]?.score || 0) || b.views - a.views)
    if (sort === 'trending') l = [...l].sort((a, b) => b.views - a.views)
    if (sort === 'ask-low') l = [...l].sort((a, b) => a.ask - b.ask)
    if (sort === 'ask-high') l = [...l].sort((a, b) => b.ask - a.ask)
    if (sort === 'progress') l = [...l].sort((a, b) => b.raised / b.ask - a.raised / a.ask)
    return l
  }, [state.startups, q, sectors, stage, sort, recBy])

  return (
    <div className="page">
      <div className="page-head">
        <div><h1>Discover Nepali startups</h1><p>{state.startups.length} verified startups are raising right now.</p></div>
      </div>
      <div className="filters">
        <div className="input-icon" style={{ width: 300 }}><Search size={16} /><input className="input" placeholder="Search by name, district or idea" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <select className="select" style={{ width: 160 }} value={stage} onChange={(e) => setStage(e.target.value)}><option value="">All stages</option>{STAGES.map((s) => <option key={s}>{s}</option>)}</select>
        <select className="select" style={{ width: 190 }} value={sort} onChange={(e) => setSort(e.target.value)}>
          {isInvestor && <option value="recommended">Sort: Recommended</option>}
          <option value="trending">Sort: Trending</option><option value="progress">Sort: Most funded</option><option value="ask-low">Sort: Smallest ask</option><option value="ask-high">Sort: Largest ask</option>
        </select>
      </div>
      <div style={{ marginBottom: 24 }}><ChipSelect options={SECTORS} value={sectors} onChange={setSectors} /></div>
      {list.length ? (
        <div className="startup-grid">{list.map((s) => <StartupCard key={s.id} s={s} saved={saved.includes(s.id)} onSave={toggleSave} why={isInvestor ? recBy[s.id]?.reasons : undefined} />)}</div>
      ) : <Empty icon={Search} title="No startups match" text="Try removing a filter." />}
    </div>
  )
}

export function Saved() {
  const { state, user, toggleSave } = useStore()
  const saved = state.saved[user.id] || []
  const list = state.startups.filter((s) => saved.includes(s.id))
  return (
    <div className="page">
      <div className="page-head"><div><h1>Saved startups</h1><p>Your watchlist. Startups don’t see who saved them.</p></div></div>
      {list.length ? <div className="startup-grid">{list.map((s) => <StartupCard key={s.id} s={s} saved onSave={toggleSave} />)}</div>
        : <Empty icon={Bookmark} title="Nothing saved yet" text="Tap the bookmark on any startup to keep track of it." action={<Link to="/app/startups" className="btn btn-dark">Discover startups</Link>} />}
    </div>
  )
}

export function StartupDetail() {
  const { id } = useParams()
  const { state, user, toggleSave, startChat, sendMessage, toast } = useStore()
  const nav = useNavigate()
  const [tab, setTab] = useState('pitch')
  const [chatOpen, setChatOpen] = useState(false)
  const s = state.startups.find((x) => x.id === id)
  const founder = s?.founders[0]
  const [msg, setMsg] = useState(founder ? `Namaste ${founder.name.replace(/^(Dr\.|Er\.|CA)\s+/, '').split(' ')[0]}, I came across ${s.name} on Aakar and would love to learn more about your round.` : '')
  if (!s) return <div className="page"><Empty title="Startup not found" /></div>
  const saved = (state.saved[user.id] || []).includes(s.id)
  const isInvestor = user.role === 'investor'
  const existing = state.conversations.find((c) => c.ownerId === user.id && c.peer.refId === s.id)

  const openChat = () => {
    if (existing) return nav('/app/messages?c=' + existing.id)
    setChatOpen(true)
  }
  const send = () => {
    const cid = startChat({ name: founder.name, initials: founder.name.split(' ').map((w) => w[0]).join('').slice(0, 2), color: s.color, subtitle: `${founder.role}, ${s.name}`, kind: 'startup', refId: s.id }, `You started a conversation about ${s.name}.`)
    setTimeout(() => sendMessage(cid, msg, 'startup'), 0)
    toast(`Message sent to ${founder.name}`)
    nav('/app/messages?c=' + cid)
  }

  return (
    <div className="page">
      <button className="btn btn-ghost btn-sm" onClick={() => nav(-1)} style={{ marginBottom: 16 }}><ArrowLeft size={15} /> Back</button>
      <div className="cover" style={{ background: `linear-gradient(120deg, ${s.color}, ${s.color}cc 50%, #0d1b45)` }}>
        <svg viewBox="0 0 800 180" preserveAspectRatio="none" style={{ position: 'absolute', bottom: 0, width: '100%', height: '70%', opacity: .2 }}><path d="M0 180 L140 60 L230 120 L360 20 L470 110 L560 50 L680 130 L800 70 L800 180Z" fill="#fff" /></svg>
      </div>
      <div className="detail-grid">
        <div>
          <div className="row" style={{ alignItems: 'flex-end', padding: '0 24px', position: 'relative' }}>
            <span className="avatar xl" style={{ background: s.color, border: '4px solid var(--paper)' }}>{s.initials}</span>
          </div>
          <div style={{ padding: '16px 4px 0' }}>
            <div className="row wrap" style={{ gap: 8 }}><h1 style={{ fontSize: 34 }}>{s.name}</h1><span className="badge badge-green"><BadgeCheck size={13} /> Verified by Aakar</span></div>
            <p className="mt-2" style={{ fontSize: 17, color: 'var(--ink-2)' }}>{s.tagline}</p>
            <div className="row wrap mt-3 small muted" style={{ gap: 16 }}>
              <span className="row" style={{ gap: 5 }}><MapPin size={14} /> {s.location}, Nepal</span>
              <span className="row" style={{ gap: 5 }}><Calendar size={14} /> Founded {s.founded}</span>
              <span className="row" style={{ gap: 5 }}><Users size={14} /> {s.team} people</span>
              <span className="row" style={{ gap: 5 }}><Eye size={14} /> {s.views.toLocaleString()} views</span>
            </div>
            <div className="row wrap mt-3" style={{ gap: 6 }}><span className="badge badge-blue">{s.sector}</span><span className="badge badge-gray">{s.stage}</span>{s.tags.map((t) => <span key={t} className="chip">{t}</span>)}</div>
          </div>

          <div className="tabs mt-8">
            {[['pitch', 'Pitch'], ['traction', 'Traction'], ['team', 'Team'], ['funds', 'Use of funds']].map(([k, l]) => <button key={k} className={`tab ${tab === k ? 'active' : ''}`} onClick={() => setTab(k)}>{l}</button>)}
          </div>
          {tab === 'pitch' && (
            <div className="stack" style={{ gap: 16 }}>
              {[['The problem', s.pitch.problem], ['Our solution', s.pitch.solution], ['Market', s.pitch.market], ['Business model', s.pitch.model]].filter(([, v]) => v).map(([k, v]) => (
                <div key={k} className="card card-pad pitch-block"><h4>{k}</h4><p>{v}</p></div>
              ))}
              {s.pitchVideo && <a href={s.pitchVideo} target="_blank" rel="noopener noreferrer" className="btn btn-ghost" style={{ alignSelf: 'flex-start' }}>Watch pitch video <ArrowRight size={16} /></a>}
            </div>
          )}
          {tab === 'traction' && (
            <div className="stack" style={{ gap: 16 }}>
              <div className="grid-3">{s.traction.map((t) => <div key={t.k} className="card kpi"><div className="small muted">{t.k}</div><div className="v">{t.v}</div></div>)}</div>
              {s.tractionNotes && <div className="card card-pad pitch-block"><h4>Milestones</h4><p>{s.tractionNotes}</p></div>}
            </div>
          )}
          {tab === 'team' && (
            <div className="stack">{s.founders.map((f) => (
              <div key={f.name} className="card card-pad row"><Avatar p={{ initials: f.name.split(' ').map((w) => w[0]).join('').slice(0, 2), color: s.color }} size="lg" /><div><div className="bold">{f.name}</div><div className="small muted">{f.role}{f.bg && ` · ${f.bg}`}</div>{f.linkedin && <a href={f.linkedin} target="_blank" rel="noopener noreferrer" className="xs link">LinkedIn</a>}</div></div>
            ))}</div>
          )}
          {tab === 'funds' && (
            <div className="card card-pad stack" style={{ gap: 16 }}>
              {s.useOfFunds.map((u) => (
                <div key={u.label} className="bar-row"><span>{u.label}</span><div className="progress blue"><span style={{ width: u.pct + '%' }} /></div><b>{u.pct}%</b></div>
              ))}
            </div>
          )}
        </div>

        <div className="sticky stack" style={{ marginTop: 54 }}>
          <div className="card card-pad">
            <div className="xs faint bold">RAISING</div>
            <div className="serif" style={{ fontSize: 38, fontWeight: 600, letterSpacing: '-.02em' }}>{money(s.ask)}</div>
            <div className="progress mt-3"><span style={{ width: `${Math.min(100, (s.raised / s.ask) * 100)}%` }} /></div>
            <div className="row-between small mt-2"><span><b>{money(s.raised)}</b> committed</span><span className="muted">{Math.round((s.raised / s.ask) * 100)}%</span></div>
            <hr className="divider" />
            <div className="grid-2" style={{ gap: 12 }}>
              <div><div className="xs muted">Equity offered</div><div className="bold">{s.equity}%</div></div>
              <div><div className="xs muted">Valuation</div><div className="bold">{s.valuation === '—' ? '—' : '$' + s.valuation}</div></div>
              <div><div className="xs muted">Stage</div><div className="bold">{s.stage}</div></div>
              <div><div className="xs muted">Investors talking</div><div className="bold">{s.interested}</div></div>
            </div>
            {isInvestor && (
              <div className="stack mt-6" style={{ gap: 8 }}>
                <button className="btn btn-blue btn-lg btn-block" onClick={openChat}><MessageCircle size={18} /> {existing ? 'Open chat' : 'Chat with founder'}</button>
                <button className="btn btn-ghost btn-block" onClick={() => toggleSave(s.id)}>{saved ? <><BookmarkCheck size={16} color="var(--primary)" /> Saved</> : <><Bookmark size={16} /> Save to watchlist</>}</button>
              </div>
            )}
          </div>
          {founder && (
            <div className="card card-pad row">
              <Avatar p={{ initials: founder.name.split(' ').map((w) => w[0]).join('').slice(0, 2), color: s.color }} />
              <div className="grow"><div className="bold small">{founder.name}</div><div className="xs muted">{founder.role} · usually replies within a day</div></div>
            </div>
          )}
        </div>
      </div>

      {chatOpen && (
        <Modal title={`Message ${founder.name}`} sub={`${founder.role}, ${s.name}`} onClose={() => setChatOpen(false)}>
          <textarea className="textarea" rows={5} value={msg} onChange={(e) => setMsg(e.target.value)} />
          <div className="card mt-3" style={{ padding: 12, background: 'var(--paper)', display: 'flex', gap: 10 }}>
            <EyeOff size={16} color="var(--muted)" style={{ flexShrink: 0, marginTop: 2 }} />
            <div className="xs muted">The founder will see your name and investor profile in this chat, even if your profile is hidden from the investor directory.</div>
          </div>
          <div className="row mt-4" style={{ justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost" onClick={() => setChatOpen(false)}>Cancel</button>
            <button className="btn btn-blue" disabled={!msg.trim()} onClick={send}><MessageCircle size={16} /> Send message</button>
          </div>
        </Modal>
      )}
    </div>
  )
}

export function InvestorProfile() {
  const { entity, updateEntity, toast } = useStore()
  const [form, setForm] = useState({ bio: entity.bio, ticket: entity.ticket, sectors: entity.sectors })
  return (
    <div className="page" style={{ maxWidth: 860 }}>
      <div className="page-head"><div><h1>My investor profile</h1><p>Control what startups can see about you.</p></div></div>
      <div className="card card-pad" style={{ display: 'flex', gap: 18, alignItems: 'center', background: entity.visible ? 'var(--green-50)' : 'var(--card)', borderColor: entity.visible ? 'transparent' : 'var(--line)' }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--card)', display: 'grid', placeItems: 'center', color: entity.visible ? 'var(--green)' : 'var(--muted)', border: '1px solid var(--line)' }}>{entity.visible ? <Eye size={22} /> : <EyeOff size={22} />}</div>
        <div className="grow">
          <div className="bold">{entity.visible ? 'Your profile is visible to startups' : 'Your profile is hidden'}</div>
          <div className="small muted">{entity.visible ? 'Verified startups can find you in the investor directory and send you an intro.' : 'Only founders you message can see you. Turn this on to receive pitches from startups.'}</div>
        </div>
        <Toggle on={entity.visible} label="Profile visibility" onChange={(v) => { updateEntity('investors', entity.id, { visible: v }); toast(v ? 'Your profile is now visible to startups' : 'Your profile is now hidden') }} />
      </div>

      <div className="card card-pad mt-6">
        <div className="row"><Avatar p={entity} size="lg" /><div><h3 style={{ fontSize: 22 }}>{entity.name}</h3><div className="small muted">{entity.type} · {entity.location}</div></div></div>
        <div className="grid-2 mt-6">
          <div className="field span-2"><label>Bio</label><textarea className="textarea" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} /></div>
          <div className="field"><label>Typical ticket size</label><input className="input" value={form.ticket} onChange={(e) => setForm({ ...form, ticket: e.target.value })} /></div>
          <div className="field"><label>Deals made</label><input className="input" value={entity.deals} disabled /></div>
          <div className="field span-2"><label>Sectors of interest</label><ChipSelect options={SECTORS} value={form.sectors} onChange={(v) => setForm({ ...form, sectors: v })} /></div>
        </div>
        <div className="row mt-6" style={{ justifyContent: 'flex-end' }}><button className="btn btn-dark" onClick={() => { updateEntity('investors', entity.id, form); toast('Profile saved') }}>Save changes</button></div>
      </div>
    </div>
  )
}