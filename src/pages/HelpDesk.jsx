import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Lightbulb, MapPin, MessageCircle, Plus, Search, Send, Wrench } from 'lucide-react'
import { Avatar, ChipSelect, Empty, Modal, ago } from '../components/ui'
import { useStore } from '../store'

const CATEGORIES = ['Hardware / IT', 'Software / Data', 'Cloud / DevOps', 'Cybersecurity', 'Website / App', 'Internet / Networking', 'Other']
const URG = { High: 'badge-red', Medium: 'badge-amber', Low: 'badge-gray' }

export default function HelpDesk() {
  const { state, user, entity, postChallenge, respondChallenge, startChat, toast } = useStore()
  const nav = useNavigate()
  const canPost = user.role === 'organization' || user.role === 'startup'
  const [tab, setTab] = useState(canPost ? 'mine' : 'open')
  const [q, setQ] = useState('')
  const [cats, setCats] = useState([])
  const [posting, setPosting] = useState(false)
  const [answering, setAnswering] = useState(null)
  const [answer, setAnswer] = useState('')
  const [form, setForm] = useState({ title: '', category: CATEGORIES[0], urgency: 'Medium', desc: '', tags: '' })

  const posterOf = (c) => (c.posterType === 'startup' ? state.startups : state.organizations).find((x) => x.id === c.posterId)
  const isMine = (c) => c.posterId === entity.id

  let list = state.challenges
  if (tab === 'mine') list = list.filter(isMine)
  if (tab === 'open') list = list.filter((c) => c.responses.length === 0)
  list = list.filter((c) => (!q || (c.title + c.desc).toLowerCase().includes(q.toLowerCase())) && (!cats.length || cats.includes(c.category)))

  const submitPost = () => {
    postChallenge({ posterType: user.role === 'startup' ? 'startup' : 'organization', posterId: entity.id, title: form.title, category: form.category, urgency: form.urgency, desc: form.desc, tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean) })
    toast('Challenge posted. Professionals in that field will see it.')
    setPosting(false); setTab('mine')
    setForm({ title: '', category: CATEGORIES[0], urgency: 'Medium', desc: '', tags: '' })
  }

  const submitAnswer = () => {
    const p = posterOf(answering)
    respondChallenge(answering.id, { name: user.name, initials: user.initials, color: user.color }, answer, { name: p.name, initials: p.initials, color: p.color, subtitle: `Re: ${answering.title}`, kind: answering.posterType === 'startup' ? 'startup' : 'organization', refId: p.id })
    toast(`Solution sent to ${p.name}`)
    setAnswering(null); setAnswer('')
    nav('/app/messages')
  }

  const chatWith = (r, c) => {
    const id = startChat({ name: r.name, initials: r.initials, color: r.color, subtitle: `Re: ${c.title}`, kind: 'professional', refId: 'resp-' + r.name }, `About your challenge “${c.title}”`)
    nav('/app/messages?c=' + id)
  }

  return (
    <div className="page">
      <div className="page-head">
        <div><h1>Tech Help Desk</h1><p>NGOs, schools and startups post technical problems. The diaspora tech community suggests solutions.</p></div>
        {canPost && <button className="btn btn-primary" onClick={() => setPosting(true)}><Plus size={17} /> Post a challenge</button>}
      </div>
      <div className="filters">
        {canPost && <button className={`chip chip-btn ${tab === 'mine' ? 'active' : ''}`} onClick={() => setTab('mine')}>My challenges</button>}
        <button className={`chip chip-btn ${tab === 'open' ? 'active' : ''}`} onClick={() => setTab('open')}>Needs help</button>
        <button className={`chip chip-btn ${tab === 'all' ? 'active' : ''}`} onClick={() => setTab('all')}>All challenges</button>
        <div className="input-icon" style={{ width: 280, marginLeft: 'auto' }}><Search size={16} /><input className="input" placeholder="Search challenges" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      </div>
      <div style={{ marginBottom: 20 }}><ChipSelect options={CATEGORIES} value={cats} onChange={setCats} /></div>

      <div className="stack">
        {list.length === 0 && <div className="card"><Empty icon={Wrench} title={tab === 'mine' ? 'You haven’t posted a challenge yet' : 'No challenges here'} action={canPost && tab === 'mine' && <button className="btn btn-dark" onClick={() => setPosting(true)}>Post your first challenge</button>} /></div>}
        {list.map((c) => {
          const p = posterOf(c)
          const mine = isMine(c)
          return (
            <div key={c.id} className="card card-pad">
              <div className="row" style={{ alignItems: 'flex-start' }}>
                <Avatar p={p} square />
                <div className="grow">
                  <div className="row wrap" style={{ gap: 6 }}>
                    <span className="small bold">{p?.name}</span>
                    <span className="xs muted row" style={{ gap: 3 }}><MapPin size={11} /> {p?.district || p?.location} · {p?.type || 'Startup'}</span>
                    <span className="xs faint">· {ago(c.at)}</span>
                  </div>
                  <h3 className="mt-2" style={{ fontSize: 20 }}>{c.title}</h3>
                  <div className="row wrap mt-2" style={{ gap: 6 }}>
                    <span className="badge badge-blue">{c.category}</span>
                    <span className={`badge ${URG[c.urgency]}`}>{c.urgency === 'High' && <AlertTriangle size={11} />} {c.urgency} urgency</span>
                    {c.tags.map((t) => <span key={t} className="chip">{t}</span>)}
                  </div>
                  <p className="small mt-3" style={{ color: 'var(--ink-2)' }}>{c.desc}</p>

                  {c.responses.length > 0 && (
                    <div className="mt-4" style={{ borderTop: '1px solid var(--line-2)', paddingTop: 12 }}>
                      <div className="xs faint bold">{c.responses.length} SOLUTION{c.responses.length > 1 && 'S'} SUGGESTED</div>
                      {c.responses.map((r, i) => (
                        <div key={i} className="row mt-3" style={{ alignItems: 'flex-start' }}>
                          <Avatar p={r} size="sm" />
                          <div className="grow" style={{ background: 'var(--paper)', borderRadius: 14, padding: '10px 14px' }}>
                            <div className="row-between"><span className="small bold">{r.name}</span><span className="xs faint">{ago(r.at)}</span></div>
                            <p className="small mt-1" style={{ color: 'var(--ink-2)' }}>{r.text}</p>
                            {mine && <button className="btn btn-ghost btn-sm mt-2" onClick={() => chatWith(r, c)}><MessageCircle size={14} /> Reply in chat</button>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {!mine && <button className="btn btn-blue btn-sm" onClick={() => setAnswering(c)}><Lightbulb size={15} /> Suggest a solution</button>}
              </div>
            </div>
          )
        })}
      </div>

      {posting && (
        <Modal title="Post a technical challenge" sub="Describe the problem clearly. Experts will reply with suggestions in chat." onClose={() => setPosting(false)} width={620}>
          <div className="grid-2">
            <div className="field span-2"><label>What’s the problem?</label><input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Our school website keeps going down" /></div>
            <div className="field"><label>Category</label><select className="select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></div>
            <div className="field"><label>Urgency</label><select className="select" value={form.urgency} onChange={(e) => setForm({ ...form, urgency: e.target.value })}><option>High</option><option>Medium</option><option>Low</option></select></div>
            <div className="field span-2"><label>Details</label><textarea className="textarea" rows={5} value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} placeholder="What have you tried? What equipment, budget and internet do you have?" /></div>
            <div className="field span-2"><label>Tags</label><input className="input" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="Comma separated, e.g. WordPress, Hosting" /></div>
          </div>
          <div className="row mt-4" style={{ justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost" onClick={() => setPosting(false)}>Cancel</button>
            <button className="btn btn-primary" disabled={!form.title.trim() || !form.desc.trim()} onClick={submitPost}>Post challenge</button>
          </div>
        </Modal>
      )}

      {answering && (
        <Modal title="Suggest a solution" sub={`To ${posterOf(answering)?.name} · “${answering.title}”`} onClose={() => setAnswering(null)}>
          <textarea className="textarea" rows={6} value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Explain your suggested fix. You can continue the conversation in chat." />
          <div className="row mt-4" style={{ justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost" onClick={() => setAnswering(null)}>Cancel</button>
            <button className="btn btn-blue" disabled={!answer.trim()} onClick={submitAnswer}><Send size={15} /> Send solution</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
