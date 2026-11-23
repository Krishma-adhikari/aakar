import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight, ArrowUpRight, BadgeCheck, Bell, CalendarDays, CheckCircle2, FileCheck2, MapPin,
  MessageCircle, Play, Quote, Rocket, Send, ShieldCheck, Sparkles, Star, UserPlus, Users,
  Menu, X,
} from 'lucide-react'
import { Avatar, Logo, Pagoda, ROLES, Skyline, Stupa, ThemeToggle, money, nptParts } from '../components/ui'
import { startups as demoStartups, mentors as demoMentors } from '../data/demo'
import IntroAnimation from '../components/IntroAnimation'
import { useStore, initialsOf } from '../store'
import { supabase } from '../lib/supabase'
import { DEMO_ENABLED } from '../lib/flags'

const pct = (s) => (s.ask ? Math.min(100, Math.round((s.raised / s.ask) * 100)) : 0)

/* ---------- Nav ---------- */
const NAV = [['#features', 'Features'], ['#how', 'How it works'], ['#who', 'Who it’s for'], ['#startups', 'Startups']]

function Nav({ showStories }) {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const f = () => setScrolled(window.scrollY > 10)
    f()
    window.addEventListener('scroll', f, { passive: true })
    return () => window.removeEventListener('scroll', f)
  }, [])
  const links = showStories ? [...NAV, ['#stories', 'Success stories']] : NAV
  const close = () => setOpen(false)
  return (
    <header className={`nav ${scrolled ? 'scrolled' : ''}`}>
      <style>{`
        #how { scroll-margin-top: 100px; }
        .nav .nav-burger { display: none; }
        .nav .nav-menu { display: none; }
        @media (max-width: 900px) {
          .nav .nav-burger { display: inline-grid; }
          .nav .nav-menu {
            display: flex; flex-direction: column; gap: 4px;
            position: absolute; left: 0; right: 0; top: 100%;
            background: var(--card); border-bottom: 1px solid var(--line);
            box-shadow: var(--shadow); padding: 12px 16px 18px;
          }
          .nav .nav-menu a { display: block; padding: 13px 14px; border-radius: 12px; font-weight: 600; font-size: 15px; color: var(--ink-2); }
          .nav .nav-menu a:hover { background: var(--primary-50); color: var(--primary); }
        }
        @media (prefers-reduced-motion: reduce) { .float, .sparkle { animation: none !important; } }
      `}</style>
      <div className="container nav-inner">
        <Logo />
        <nav className="nav-links" aria-label="Main">
          {links.map(([h, t]) => <a key={h} href={h}>{t}</a>)}
        </nav>
        <div className="row" style={{ gap: 10 }}>
          <ThemeToggle />
          <Link to="/login" className="btn btn-outline">Log in</Link>
          <Link to="/register" className="btn btn-primary">Register <ArrowRight size={16} /></Link>
          <button className="icon-btn nav-burger" onClick={() => setOpen((o) => !o)} aria-label="Menu" aria-expanded={open}>
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>
      {open && (
        <div className="nav-menu">
          {links.map(([h, t]) => <a key={h} href={h} onClick={close}>{t}</a>)}
          <Link to="/login" onClick={close}>Log in</Link>
        </div>
      )}
    </header>
  )
}

const Spark = ({ style, size = 18 }) => (
  <svg className="sparkle" style={style} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true"><path d="M12 0 C13 8 16 11 24 12 C16 13 13 16 12 24 C11 16 8 13 0 12 C8 11 11 8 12 0Z" fill="currentColor" /></svg>
)

/* ---------- Hero backdrop: layered Himalayan ridges, mist and a Nepali pagoda on soft blue ---------- */
function HeroScene() {
  return (
    <svg className="hero-backdrop" viewBox="0 0 640 700" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <defs>
        <linearGradient id="hb-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#cfe0ff" /><stop offset=".55" stopColor="#e8f0ff" /><stop offset="1" stopColor="#f6f9ff" /></linearGradient>
        <radialGradient id="hb-sun" cx=".5" cy=".5" r=".5"><stop offset="0" stopColor="#fff" stopOpacity=".95" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></radialGradient>
        <linearGradient id="hb-far" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#9db8ec" /><stop offset="1" stopColor="#d6e3fa" /></linearGradient>
        <linearGradient id="hb-mid" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#7390d0" /><stop offset="1" stopColor="#bccfee" /></linearGradient>
        <linearGradient id="hb-near" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3b5ba6" /><stop offset="1" stopColor="#6283c8" /></linearGradient>
        <linearGradient id="hb-mist" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff" stopOpacity="0" /><stop offset=".55" stopColor="#fff" stopOpacity=".75" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></linearGradient>
        <linearGradient id="hb-fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff" stopOpacity="0" /><stop offset="1" stopColor="#fff" stopOpacity=".5" /></linearGradient>
      </defs>
      <rect width="640" height="700" fill="url(#hb-sky)" />
      <circle cx="450" cy="190" r="170" fill="url(#hb-sun)" />

      {/* far range with snow caps */}
      <path d="M0 440 L70 372 L120 402 L205 300 L262 352 L342 214 L402 330 L452 288 L520 350 L592 308 L640 360 L640 700 L0 700 Z" fill="url(#hb-far)" />
      <path fill="#fff" opacity=".95" d="M342 214 L372 262 L358 258 L346 276 L334 258 L316 266 Z M205 300 L226 330 L214 327 L206 340 L196 326 L184 332 Z M452 288 L470 314 L460 312 L453 324 L445 312 L434 316 Z" />
      <path d="M342 214 L402 330 L372 322 L350 270 Z" fill="#7f9bd8" opacity=".35" />

      <rect y="380" width="640" height="110" fill="url(#hb-mist)" />

      {/* middle range */}
      <path d="M0 540 L92 468 L160 508 L252 428 L336 498 L424 446 L522 516 L640 458 L640 700 L0 700 Z" fill="url(#hb-mid)" />
      <path fill="#fff" opacity=".85" d="M252 428 L270 452 L260 450 L253 462 L245 450 L234 454 Z" />

      <rect y="470" width="640" height="110" fill="url(#hb-mist)" opacity=".9" />

      {/* near hill with the pagoda */}
      <path d="M0 612 C 110 566 210 592 320 566 C 440 538 540 556 640 520 L640 700 L0 700 Z" fill="url(#hb-near)" />
      <Pagoda x={528} y={548} s={1.7} fill="#1d3170" />
      <g fill="#f6c870" opacity=".85"><rect x="519" y="486" width="5" height="7" rx="1" /><rect x="532" y="486" width="5" height="7" rx="1" /></g>
      <Pagoda x={96} y={600} s={.8} tiers={2} fill="#2a458d" />
      <path d="M528 450 L570 470 M528 450 L486 470" stroke="#e7b8c8" strokeWidth="1.2" fill="none" opacity=".8" />

      <rect y="590" width="640" height="110" fill="url(#hb-fade)" />
    </svg>
  )
}

/* ---------- Hero cards. Sample cards (mentor, chat) show in demo mode only. ---------- */
function HeroVisual({ startup }) {
  const nav = useNavigate()
  const [msg, setMsg] = useState('')
  const m = demoMentors[0]
  return (
    <div className="hero-visual">
      <HeroScene />
      <Spark style={{ right: 36, top: 28, zIndex: 1 }} size={20} />
      <Spark style={{ left: 28, top: '46%', animationDelay: '-1.2s', opacity: .6, zIndex: 1 }} size={12} />

      {startup && (
        <div className="glass hero-card left" style={{ '--w': '300px', padding: 18 }}>
          <span className="badge badge-blue" style={{ marginBottom: 10 }}>Invest in Nepal</span>
          <div className="row">
            <span className="avatar" style={{ width: 46, height: 46, backgroundColor: startup.color || 'var(--primary)' }}>{startup.initials}</span>
            <div className="grow">
              <div className="bold">{startup.name}</div>
              <div className="xs muted row" style={{ gap: 4 }}><MapPin size={11} /> {[startup.location, startup.sector].filter(Boolean).join(', ')}</div>
            </div>
            <span className="badge badge-green"><BadgeCheck size={12} /> Verified</span>
          </div>
          <div className="row-between mt-4 small"><span className="bold">{money(startup.raised || 0)} raised</span><span className="muted">of {money(startup.ask || 0)}</span></div>
          <div className="progress mt-2"><span style={{ width: `${pct(startup)}%` }} /></div>
          {startup.traction?.length > 0 && (
            <div className="row mt-3" style={{ gap: 6 }}>{startup.traction.slice(0, 2).map((t) => <span key={t.k} className="chip" style={{ background: 'var(--primary-50)' }}>{t.v} {t.k.toLowerCase()}</span>)}</div>
          )}
        </div>
      )}

      {DEMO_ENABLED && (
        <>
          <div className="glass hero-card right d2" style={{ '--w': '320px', padding: 18 }}>
            <span className="badge badge-violet" style={{ marginBottom: 10 }}>Mentorship</span>
            <div className="row" style={{ alignItems: 'flex-start' }}>
              <div className="ic-tile" style={{ background: 'var(--primary-50)', color: 'var(--primary)', borderRadius: 99, width: 40, height: 40 }}><Bell size={18} /></div>
              <div className="small">
                <div><b>{m.name}</b> is hosting a session on <b>“Computer Science”</b></div>
                <div className="xs muted mt-1 row" style={{ gap: 4 }}><CalendarDays size={12} /> From Seattle · Sat, 8:30 PM NPT · 42 seats left</div>
              </div>
            </div>
            <button className="btn btn-dark btn-sm btn-block mt-3" style={{ background: 'var(--navy)', color: '#fff' }} onClick={() => nav('/register/student')}>Reserve my seat <ArrowRight size={14} /></button>
          </div>

          <div className="glass hero-card left d3" style={{ '--w': '310px', padding: 16 }}>
            <span className="badge badge-teal" style={{ marginBottom: 10 }}>Chat</span>
            <div className="row small">
              <span className="avatar sm" style={{ backgroundColor: '#c0527a' }}>AT</span>
              <b>Aarushi Thapa</b><span className="online" /><span className="xs muted">Online</span>
            </div>
            <div className="bubble peer mt-3" style={{ maxWidth: '100%', fontSize: 13.5, animation: 'none' }}>Namaste Anisha! Loved your pitch. Can we talk about leading your seed round?</div>
            <form className="row mt-3" style={{ gap: 8 }} onSubmit={(e) => { e.preventDefault(); nav('/register') }}>
              <input className="input" style={{ height: 38, borderRadius: 99, fontSize: 13 }} placeholder="Type a message..." value={msg} onChange={(e) => setMsg(e.target.value)} aria-label="Type a message" />
              <button className="btn btn-primary" style={{ width: 38, height: 38, padding: 0 }} aria-label="Send"><Send size={15} /></button>
            </form>
          </div>
        </>
      )}
    </div>
  )
}

/* ---------- Static content ---------- */
const pillars = [
  { n: '01', icon: Rocket, grad: 'linear-gradient(135deg,#3a6cf0,#1d47c8)', shade: 'rgba(33,82,217,.7)', color: 'var(--primary)', to: '/register/investor', cta: 'Join as an investor', title: 'Invest in Nepal', text: 'Startups publish their full profile, pitch and funding ask. Diaspora investors browse, save and start a conversation with founders in one click.', pts: ['Full pitch, traction and use of funds', 'Direct chat between investor and founder', 'Investors stay private unless they choose to be visible'] },

  { n: '02', icon: Users, grad: 'linear-gradient(135deg,#8b6cf5,#5b3ad6)', shade: 'rgba(109,74,230,.7)', color: 'var(--violet)', to: '/register/student', cta: 'Find a mentor', to2: '/register/professional', cta2: 'Become a mentor', title: 'Mentor the next generation', text: 'Students find the right mentor through keyword matching and get guidance on studies, jobs and scholarships from Nepalis abroad.', pts: ['Find mentors by field, country or interest', 'One-to-one mentorship on request', 'Group sessions notify every interested student'] },

]

const steps = [
  { icon: UserPlus, title: 'Pick your role', text: 'Investor, startup, student or professional.' },
  { icon: FileCheck2, title: 'Submit your profile', text: 'Add your details and the documents needed to verify you.' },
  { icon: ShieldCheck, title: 'Get verified', text: 'Our admin team checks every profile, usually within 24 hours.', alt: true },
  { icon: Sparkles, title: 'Start connecting', text: 'Invest, mentor, learn or solve problems with people you can trust.' },
]

// Made-up stats and testimonials. Shown in demo mode only, never to real visitors.
const demoStories = [
  { quote: 'I left Nepal 9 years ago with no one to ask about grad school. On Aakar I spend one evening a month and help 60 students at once.', who: demoMentors[0], role: `${demoMentors[0].title}, ${demoMentors[0].company}`, feature: true },
  { quote: 'Two diaspora angels found us on Aakar in our first week. That chat turned into $140k for our seed round.', who: { initials: 'AT', color: '#0f9f6e', name: 'Anisha Thapa' }, role: 'Founder, Krishi Sathi' },
  { quote: 'Dr. Asmita reviewed my SOP three times. I’m now starting my MPH in the UK on a Chevening scholarship.', who: { initials: 'PD', color: '#6d4ae6', name: 'Prerana Dahal' }, role: 'Student, Tribhuvan University' },
]

/* ---------- Page ---------- */
export default function Landing() {
  const { state } = useStore()
  const [pub, setPub] = useState([]) // approved startups for logged-out visitors (real mode)

  // Real mode: logged-out visitors cannot read profiles, so use the public_startups() database function.
  useEffect(() => {
    if (DEMO_ENABLED) return undefined
    let alive = true
    supabase.rpc('public_startups').then(({ data, error }) => {
      if (error) console.error('public_startups failed:', error.message)
      if (!alive || !data) return
      setPub(data.map((r) => ({
        id: r.id, name: r.name, initials: initialsOf(r.name), color: '#3a6cf0',
        tagline: r.tagline || '', sector: r.sector || '', stage: r.stage || '',
        location: r.location || '', ask: Number(r.ask) || 0, raised: 0,
      })))
    })
    return () => { alive = false }
  }, [])

  // Real startups first (a signed-in member sees them in state too), sample ones only in demo mode.
  const liveStartups = useMemo(() => (DEMO_ENABLED ? state.startups : (state.startups.length ? state.startups : pub)).slice(0, 6), [state.startups, pub])
  const heroStartup = liveStartups[0] || (DEMO_ENABLED ? demoStartups[0] : null)

  // Upcoming sessions only, from the live state. Hidden when there are none.
  const upcoming = useMemo(() => state.sessions
    .filter((se) => new Date(se.date) > new Date())
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 3), [state.sessions])

  const avatars = DEMO_ENABLED ? demoMentors.slice(0, 4) : state.mentors.slice(0, 4)
  const showStories = DEMO_ENABLED

  return (
    <div>
      <IntroAnimation />
      <Nav showStories={showStories} />

      <section className="hero">
        <div className="container hero-grid">
          <div style={{ animation: 'rise .6s ease' }}>
            <span className="eyebrow">For Nepalis abroad, and everyone at home</span>
            <h1 className="mt-6">
              Nepal’s talent,<br />connected to the{' '}
              <span className="hl">world.
                <svg viewBox="0 0 200 20" preserveAspectRatio="none" aria-hidden="true"><path d="M3 14 C 50 4, 120 2, 197 9" stroke="var(--primary)" strokeWidth="5" strokeLinecap="round" fill="none" /></svg>
              </span>
            </h1>
            <p className="hero-lede">Aakar brings the Nepali diaspora and Nepal together on one trusted platform. Fund startups and mentor students from wherever you live.</p>
            <div className="stack" style={{ gap: 12, marginTop: 24, maxWidth: 520 }}>
              {[
                [Rocket, 'Invest in Nepal', 'Back verified startups and chat with founders.'],
                [Users, 'Mentor students', 'Host sessions and guide students on studies, jobs and scholarships.'],              ].map(([I, t, d]) => (
                <div key={t} className="row" style={{ gap: 12, alignItems: 'flex-start' }}>
                  <span className="ic-tile" style={{ width: 36, height: 36, borderRadius: 11, background: 'var(--primary-50)', color: 'var(--primary)' }}><I size={18} /></span>
                  <div className="small" style={{ paddingTop: 7 }}><b>{t}</b> <span className="muted">· {d}</span></div>
                </div>
              ))}
            </div>
            <div className="hero-ctas">
              <Link to="/register" className="btn btn-primary btn-lg">Join Aakar, it’s free <ArrowRight size={18} /></Link>
              <a href="#startups" className="play-btn"><span className="pc"><Play size={18} fill="currentColor" /></span> Explore startups</a>
            </div>
            {DEMO_ENABLED && (
              <div className="hero-proof">
                <div className="avatar-stack">{avatars.map((m) => <Avatar key={m.id} p={m} />)}</div>
                <span className="vsep" />
                <div className="small"><b>340+ mentors</b> in 28 countries<br /><span className="muted xs">from Google, Microsoft, Meta and more</span></div>
              </div>
            )}
          </div>
          <HeroVisual startup={heroStartup} />
        </div>
        <div className="hero-bottom"><Skyline /></div>
        <div className="tagline-divider">Building a stronger, more innovative Nepal</div>
      </section>

      <section className="section" id="features">
        <div className="container">
          <div className="section-head center">
            <span className="eyebrow">What you can do</span>
            <h2>Two ways the diaspora <span>builds Nepal</span>, together.</h2>
            <p>Money and mentorship: the two things Nepalis abroad most want to give back, now in one place.</p>
          </div>
          <div className="pillars">
            {pillars.map((p) => (
              <div key={p.n} className="pillar card-hover" style={{ '--accent': p.grad }}>
                <span className="num">{p.n}</span>
                <div className="pic" style={{ background: p.grad, '--shade': p.shade }}><p.icon size={26} /></div>
                <h3>{p.title}</h3>
                <p className="pillar-text">{p.text}</p>
                <ul>{p.pts.map((t) => <li key={t}><span className="tick" style={{ color: p.color }}><CheckCircle2 size={16} /></span> {t}</li>)}</ul>

                {DEMO_ENABLED && (
                  <div className="pillar-preview">
                    {p.n === '01' && <div className="row small"><Avatar p={demoStartups[3]} size="sm" square /><div className="grow"><b>{demoStartups[3].name}</b><div className="xs muted">Raising {money(demoStartups[3].ask)} · {demoStartups[3].stage}</div></div><span className="btn btn-primary btn-sm"><MessageCircle size={14} /> Chat</span></div>}
                    {p.n === '02' && <div className="row small"><Avatar p={demoMentors[1]} size="sm" /><div className="grow"><b>{demoMentors[1].name}</b><div className="xs muted">Matched on <span style={{ color: 'var(--violet)', fontWeight: 700 }}>Scholarships · Study in UK</span></div></div></div>}
                  </div>
                )}

                <div className="pillar-cta">
                  <Link to={p.to} className="btn btn-dark btn-sm">{p.cta} <ArrowRight size={15} /></Link>
                  {p.to2 && <Link to={p.to2} className="btn btn-ghost btn-sm">{p.cta2}</Link>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how" className="container">
        <div className="how-wrap">
          <svg viewBox="0 0 400 160" style={{ position: 'absolute', right: 0, bottom: 0, width: 420, opacity: .07, color: 'var(--primary)' }} aria-hidden="true"><Pagoda x={300} y={160} s={1.6} /><Stupa x={380} y={160} s={1} /></svg>
          <div className="section-head" style={{ marginBottom: 48 }}>
            <span className="eyebrow">How it works</span>
            <h2>Verified people only. <span>That’s the whole point.</span></h2>
            <p>Every investor, founder, student and mentor is reviewed by an admin before they can use Aakar, so trust is built in from day one.</p>
          </div>
          <div className="steps">
            {steps.map((s, i) => (
              <div key={s.title} className="step">
                <div className={`step-dot ${s.alt ? 'alt' : ''}`}><s.icon size={24} /></div>
                {i < steps.length - 1 && <div className="step-line" />}
                <div className="xs bold mt-4" style={{ color: 'var(--primary)', letterSpacing: '.1em' }}>STEP {i + 1}</div>
                <h4>{s.title}</h4>
                <p>{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="who">
        <div className="container">
          <div className="section-head center">
            <span className="eyebrow">Who it’s for</span>
            <h2>One platform, <span>four communities.</span></h2>
            <p>Pick the role that fits you. Each one is verified by our team before it goes live.</p>
          </div>
          <div className="roles">
            {Object.entries(ROLES).map(([k, r]) => (
              <Link key={k} to={`/register/${k}`} className="role-card card-hover" style={{ '--rc-bg': r.bg }}>
                <div className="ic-tile" style={{ background: r.grad, color: '#fff', width: 52, height: 52, borderRadius: 16 }}><r.icon size={24} /></div>
                <div>
                  <h4>{r.label}</h4>
                  <div className="who" style={{ color: r.color }}>{r.who}</div>
                </div>
                <p>{r.blurb}</p>
                <span className="go">Join as {r.label.toLowerCase()} <ArrowUpRight size={15} /></span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section dark-section" id="startups">
        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <div className="row-between wrap" style={{ alignItems: 'flex-end', marginBottom: 48 }}>
            <div className="section-head" style={{ marginBottom: 0 }}>
              <span className="eyebrow">Raising now</span>
              <h2>Startups building from Palpa to Pokhara.</h2>
              <p>A preview of verified Nepali startups. Investors see the full pitch, team and financials after signing in.</p>
            </div>
            <Link to="/register/investor" className="btn btn-white">Join as an investor <ArrowRight size={16} /></Link>
          </div>

          {liveStartups.length > 0 ? (
            <div className="startup-strip">
              {liveStartups.map((s) => (
                <div key={s.id} className="dark-card">
                  <div className="row">
                    <Avatar p={s} square />
                    <div className="grow"><div className="bold">{s.name}</div><div className="xs" style={{ color: '#a9b6d8' }}>{[s.sector, s.location].filter(Boolean).join(' · ')}</div></div>
                    {s.stage && <span className="badge" style={{ background: 'rgba(255,255,255,.08)', color: '#cfdcff' }}>{s.stage}</span>}
                  </div>
                  <p className="small mt-3" style={{ color: '#cfd8ef', minHeight: 44 }}>{s.tagline}</p>
                  <div className="row-between mt-4 xs" style={{ color: '#a9b6d8' }}><span><b style={{ color: '#fff', fontSize: 15 }}>{money(s.raised || 0)}</b> raised</span><span>Raising {money(s.ask || 0)}</span></div>
                  <div className="progress mt-2"><span style={{ width: `${pct(s)}%` }} /></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="dark-card" style={{ textAlign: 'center', padding: 36 }}>
              <div className="bold">No startups are listed yet</div>
              <p className="small mt-2" style={{ color: '#cfd8ef' }}>Verified startups appear here as soon as an admin approves them.</p>
              <Link to="/register/startup" className="btn btn-white mt-4">List your startup <ArrowRight size={16} /></Link>
            </div>
          )}
        </div>
      </section>

      {(showStories || upcoming.length > 0) && (
        <section className="section" id="stories">
          <div className="container">
            {showStories && (
              <>
                <div className="section-head center">
                  <span className="eyebrow">Success stories</span>
                  <h2>Real connections, <span>real outcomes.</span></h2>
                </div>
                <div className="stories">
                  {demoStories.map((s) => (
                    <div key={s.who.name} className={`story card-hover ${s.feature ? 'feature' : ''}`}>
                      <div className="row-between">
                        <Quote size={28} color={s.feature ? '#fff' : 'var(--primary)'} style={{ opacity: s.feature ? .6 : 1 }} />
                        <div className="row" style={{ gap: 2 }}>{[0, 1, 2, 3, 4].map((i) => <Star key={i} size={14} color="#f0a91f" fill="#f0a91f" />)}</div>
                      </div>
                      <blockquote>“{s.quote}”</blockquote>
                      <div className="row"><Avatar p={s.who} /><div><div className="bold small">{s.who.name}</div><div className="xs" style={{ color: s.feature ? '#dbe6ff' : 'var(--muted)' }}>{s.role}</div></div></div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {upcoming.length > 0 && (
              <>
                <div className="row-between wrap" style={{ marginTop: showStories ? 72 : 0, marginBottom: 20 }}>
                  <h3 style={{ fontSize: 26, fontWeight: 800 }}>Upcoming mentorship sessions</h3>
                  <Link to="/register/student" className="link small">Join as a student →</Link>
                </div>
                <div className="startup-grid">
                  {upcoming.map((se) => {
                    const host = state.mentors.find((m) => m.id === se.hostId)
                    const p = nptParts(se.date)
                    return (
                      <div key={se.id} className="card session-card card-hover">
                        <div className="date-tile"><div className="m">{p.month}</div><div className="d">{p.day}</div></div>
                        <div className="grow">
                          <span className="chip chip-match">{se.keyword}</span>
                          <div className="bold mt-2">{se.title}</div>
                          {host && <div className="row xs muted mt-3"><Avatar p={host} size="sm" /> {host.name} · {(host.location || '').split(',')[0]}</div>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        </section>
      )}

      <section className="container">
        <div className="cta-band">
          <svg viewBox="0 0 520 200" style={{ position: 'absolute', right: -20, bottom: 0, width: 560, opacity: .16, color: '#fff' }} aria-hidden="true">
            <path d="M0 200 L120 80 L180 130 L290 30 L380 120 L440 90 L520 140 L520 200Z" fill="#fff" />
            <Pagoda x={420} y={200} s={1.1} /><Stupa x={490} y={200} s={.7} />
          </svg>
          <div style={{ position: 'relative' }}>
            <h2>Wherever you are, you can help build Nepal.</h2>
            <p>Create your profile in five minutes. Our team verifies it, and you’re in.</p>
            <div className="row wrap mt-6">
              <Link to="/register" className="btn btn-lg btn-white">Register now <ArrowRight size={18} /></Link>
              <Link to="/login" className="btn btn-lg btn-outline-w">I already have an account</Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div>
              <Logo />
              <p className="muted small mt-3" style={{ maxWidth: 320 }}>आकार means “shape”. We’re a community shaping Nepal’s future, from Kathmandu to every corner of the world.</p>
            </div>
            <div><h5>Platform</h5><ul><li><a href="#startups">Startups</a></li><li><a href="#features">Mentorship</a></li></ul></div>
            <div><h5>Join as</h5><ul>{Object.entries(ROLES).slice(0, 4).map(([k, r]) => <li key={k}><Link to={`/register/${k}`}>{r.label}</Link></li>)}</ul></div>
            <div><h5>Aakar</h5><ul><li><a href="#how">Trust &amp; verification</a></li>{showStories && <li><a href="#stories">Success stories</a></li>}<li><Link to="/login">Log in</Link></li></ul></div>
          </div>
          <div className="row-between mt-8 xs faint wrap">
            <span>© 2026 Aakar. Built with love from Nepal.</span>
            {DEMO_ENABLED && <span>Demo prototype · all data is fictional</span>}
          </div>
        </div>
      </footer>
    </div>
  )
}