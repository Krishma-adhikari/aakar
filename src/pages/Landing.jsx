import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight, ArrowUpRight, BadgeCheck, Bell, CalendarDays, CheckCircle2, FileCheck2, Globe2, Lightbulb, MapPin,
  MessageCircle, Play, Quote, Rocket, Send, ShieldCheck, Sparkles, Star, UserPlus, Users, Wrench, TrendingUp, GraduationCap,
  Menu, X,
} from 'lucide-react'
import { Avatar, Logo, Pagoda, ROLES, Skyline, Stupa, ThemeToggle, money } from '../components/ui'
import { startups, mentors, sessions } from '../data/demo'
import IntroAnimation from '../components/IntroAnimation'

function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const f = () => setScrolled(window.scrollY > 10)
    f()
    window.addEventListener('scroll', f, { passive: true })
    return () => window.removeEventListener('scroll', f)
  }, [])
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
          .nav .nav-menu a {
            display: block; padding: 13px 14px; border-radius: 12px;
            font-weight: 600; font-size: 15px; color: var(--ink-2);
          }
          .nav .nav-menu a:hover { background: var(--primary-50); color: var(--primary); }
        }
      `}</style>
      <div className="container nav-inner">
        <Logo />
        <nav className="nav-links">
          <a href="#features">Features</a>
          <a href="#how">How it works</a>
          <a href="#who">Who it's for</a>
          <a href="#stories">Success stories</a>
          <a href="#startups">Startups</a>
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
          <a href="#features" onClick={close}>Features</a>
          <a href="#how" onClick={close}>How it works</a>
          <a href="#who" onClick={close}>Who it's for</a>
          <a href="#stories" onClick={close}>Success stories</a>
          <a href="#startups" onClick={close}>Startups</a>
          <Link to="/login" onClick={close}>Log in</Link>
        </div>
      )}
    </header>
  )
}

const Spark = ({ style, size = 18 }) => (
  <svg className="sparkle" style={style} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true"><path d="M12 0 C13 8 16 11 24 12 C16 13 13 16 12 24 C11 16 8 13 0 12 C8 11 11 8 12 0Z" fill="currentColor" /></svg>
)

// Illustrated Himalaya + pagoda scene. Drop a photo at /public/hero-nepal.jpg to show it instead.
function HeroScene() {
  const [photo, setPhoto] = useState(false)
  useEffect(() => {
    const img = new Image()
    img.onload = () => setPhoto(img.naturalWidth > 0)
    img.src = '/hero-nepal.jpg'
  }, [])
  return (
    <svg className="hero-scene" viewBox="0 0 640 580" aria-hidden="true">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#bcd3ff" /><stop offset=".55" stopColor="#e6eeff" /><stop offset="1" stopColor="#f7f9ff" /></linearGradient>
        <linearGradient id="far" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#8fa9de" /><stop offset="1" stopColor="#c9d8f5" /></linearGradient>
        <linearGradient id="mid" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#5877c0" /><stop offset="1" stopColor="#8aa4dc" /></linearGradient>
        <linearGradient id="near" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2f4d97" /><stop offset="1" stopColor="#4d6cb5" /></linearGradient>
        <linearGradient id="temple" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1b2f66" /><stop offset="1" stopColor="#2d4789" /></linearGradient>
        <linearGradient id="mist" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff" stopOpacity="0" /><stop offset=".5" stopColor="#fff" stopOpacity=".7" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></linearGradient>
        <radialGradient id="sun" cx=".5" cy=".5" r=".5"><stop offset="0" stopColor="#fff" stopOpacity=".95" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></radialGradient>
        <linearGradient id="fadeMask" x1="0" y1="0" x2="0" y2="1"><stop offset=".62" stopColor="#fff" /><stop offset="1" stopColor="#000" /></linearGradient>
        <linearGradient id="fadeMaskX" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#000" /><stop offset=".22" stopColor="#fff" /></linearGradient>
        <mask id="sceneMask"><rect width="640" height="580" fill="url(#fadeMask)" /></mask>
        <mask id="sceneMaskX"><rect width="640" height="580" fill="url(#fadeMaskX)" /></mask>
        <clipPath id="orb"><circle cx="390" cy="300" r="278" /></clipPath>
      </defs>

      {/* orbit ring behind */}
      <ellipse cx="330" cy="300" rx="320" ry="250" fill="none" stroke="var(--primary)" strokeOpacity=".18" strokeWidth="1.5" transform="rotate(-18 330 300)" />

      <g mask="url(#sceneMaskX)"><g mask="url(#sceneMask)"><g clipPath="url(#orb)" className="scene-art">
        <rect width="640" height="580" fill="url(#sky)" />
        <circle cx="470" cy="150" r="120" fill="url(#sun)" />
        {/* far range */}
        <path d="M100 330 L170 250 L215 280 L290 190 L340 235 L400 120 L452 190 L492 160 L560 230 L640 200 L640 580 L100 580 Z" fill="url(#far)" />
        <path d="M400 120 L424 152 L413 150 L405 165 L396 150 L384 158 L390 138 Z M290 190 L306 210 L298 209 L292 220 L284 210 L276 214 Z M492 160 L508 178 L500 177 L495 186 L487 176 Z" fill="#fff" />
        <path d="M400 120 L452 190 L430 188 L410 160 Z" fill="#6d8acb" opacity=".45" />
        {/* main peak */}
        <path d="M150 380 L260 280 L300 300 L380 210 L440 100 L520 230 L560 210 L640 290 L640 580 L150 580 Z" fill="url(#mid)" opacity=".9" />
        <path d="M440 100 L470 150 L458 147 L449 166 L438 150 L424 162 L430 132 Z M380 210 L396 232 L387 230 L380 243 L371 232 Z" fill="#fff" />
        <path d="M440 100 L520 230 L490 226 L455 170 Z" fill="#3e5ca6" opacity=".4" />
        <rect y="300" width="640" height="90" fill="url(#mist)" />
        {/* near ridge with forest */}
        <path d="M120 460 C 200 400 280 420 340 400 C 400 380 470 395 520 370 C 570 345 610 350 640 340 L640 580 L120 580 Z" fill="url(#near)" />
        <g fill="#233d80">
          {Array.from({ length: 22 }).map((_, i) => {
            const x = 150 + i * 22
            const y = 430 - Math.sin(i / 3) * 18 - i * 2.4
            return <path key={i} d={`M ${x} ${y} L ${x + 7} ${y + 22} L ${x - 7} ${y + 22} Z`} />
          })}
        </g>
        {/* temple hill */}
        <path d="M470 580 L520 360 C 550 335 610 330 650 340 L650 580 Z" fill="#1f3577" />
        <Pagoda x={598} y={345} s={1.75} fill="url(#temple)" />
        <g fill="#f6c870" opacity=".85">
          <rect x="587" y="299" width="6" height="8" rx="1" /><rect x="603" y="299" width="6" height="8" rx="1" />
          <rect x="591" y="267" width="5" height="7" rx="1" /><rect x="601" y="267" width="5" height="7" rx="1" />
        </g>
        <Pagoda x={520} y={392} s={.95} tiers={2} fill="#22397a" />
        {/* village */}
        <g fill="#2a448a">
          <rect x="330" y="470" width="26" height="16" /><path d="M326 470 L343 458 L360 470 Z" />
          <rect x="372" y="462" width="30" height="18" /><path d="M368 462 L387 448 L406 462 Z" />
          <rect x="414" y="478" width="22" height="14" /><path d="M410 478 L425 467 L440 478 Z" />
        </g>
        <rect y="430" width="640" height="150" fill="url(#mist)" opacity=".6" />
        {/* optional photo override */}
        {photo && <image href="/hero-nepal.jpg" x="110" y="20" width="560" height="560" preserveAspectRatio="xMidYMid slice" />}
      </g></g></g>
    </svg>
  )
}

function HeroVisual() {
  const s = startups[0]
  const m = mentors[0]
  const nav = useNavigate()
  const [msg, setMsg] = useState('')
  return (
    <div className="hero-visual">
      <HeroScene />
      <Spark style={{ left: 160, top: 22 }} size={22} />
      <Spark style={{ left: 120, top: 330, animationDelay: '-1.2s', opacity: .6 }} size={12} />
      <Spark style={{ right: 40, top: 70, animationDelay: '-2s', opacity: .7 }} size={14} />

      <div className="glass float" style={{ left: 20, top: 70, width: 300, padding: 18 }}>
        <div className="row">
          <span className="avatar" style={{ width: 46, height: 46, backgroundColor: 'var(--primary)' }}>{s.initials}</span>
          <div className="grow">
            <div className="bold">{s.name}</div>
            <div className="xs muted row" style={{ gap: 4 }}><MapPin size={11} /> {s.location}, {s.sector}</div>
          </div>
          <span className="badge badge-green"><BadgeCheck size={12} /> Verified</span>
        </div>
        <div className="row-between mt-4 small"><span className="bold">{money(s.raised)} raised</span><span className="muted">of {money(s.ask)}</span></div>
        <div className="progress mt-2"><span style={{ width: `${(s.raised / s.ask) * 100}%` }} /></div>
        <div className="row mt-3" style={{ gap: 6 }}>{s.traction.slice(0, 2).map((t) => <span key={t.k} className="chip" style={{ background: 'var(--primary-50)' }}>{t.v} {t.k.toLowerCase()}</span>)}</div>
      </div>

      <div className="glass float d2" style={{ right: 40, top: 250, width: 320, padding: 18 }}>
        <div className="row" style={{ alignItems: 'flex-start' }}>
          <div className="ic-tile" style={{ background: 'var(--primary-50)', color: 'var(--primary)', borderRadius: 99, width: 40, height: 40 }}><Bell size={18} /></div>
          <div className="small">
            <div><b>{m.name}</b> is hosting a session on <b>“Computer Science”</b></div>
            <div className="xs muted mt-1 row" style={{ gap: 4 }}><CalendarDays size={12} /> From Seattle · Sat, 8:30 PM NPT · 42 seats left</div>
          </div>
        </div>
        <button className="btn btn-dark btn-sm btn-block mt-3" style={{ background: 'var(--navy)', color: '#fff' }} onClick={() => nav('/register/student')}>Reserve my seat <ArrowRight size={14} /></button>
      </div>

      <div className="glass float d3" style={{ left: 40, top: 418, width: 310, padding: 16 }}>
        <div className="row small">
          <span className="avatar sm" style={{ backgroundColor: '#c0527a' }}>AT</span>
          <b>Aarushi Thapa</b>
          <span className="online" />
          <span className="xs muted">Online</span>
        </div>
        <div className="bubble peer mt-3" style={{ maxWidth: '100%', fontSize: 13.5, animation: 'none' }}>Namaste Anisha! Loved your pitch. Can we talk about leading your seed round?</div>
        <form className="row mt-3" style={{ gap: 8 }} onSubmit={(e) => { e.preventDefault(); nav('/register') }}>
          <input className="input" style={{ height: 38, borderRadius: 99, fontSize: 13 }} placeholder="Type a message..." value={msg} onChange={(e) => setMsg(e.target.value)} aria-label="Type a message" />
          <button className="btn btn-primary" style={{ width: 38, height: 38, padding: 0 }} aria-label="Send"><Send size={15} /></button>
        </form>
      </div>
    </div>
  )
}

const pillars = [
  { n: '01', icon: Rocket, grad: 'linear-gradient(135deg,#3a6cf0,#1d47c8)', shade: 'rgba(33,82,217,.7)', color: 'var(--primary)', title: 'Invest in Nepal', text: 'Startups publish their full profile, pitch and funding ask. Diaspora investors browse, save and start a conversation with founders in one click.', pts: ['Full pitch, traction and use of funds', 'Direct chat between investor and founder', 'Investors stay private unless they choose to be visible'] },
  { n: '02', icon: Users, grad: 'linear-gradient(135deg,#8b6cf5,#5b3ad6)', shade: 'rgba(109,74,230,.7)', color: 'var(--violet)', title: 'Mentor the next generation', text: 'Nepali professionals abroad volunteer to guide students on higher studies, jobs and global opportunities, matched by field and interests.', pts: ['Keyword matching between students and mentors', 'One-to-one mentorship on request', 'Group sessions notify every interested student'] },
  { n: '03', icon: Wrench, grad: 'linear-gradient(135deg,#22b8d8,#0a7f9c)', shade: 'rgba(8,145,178,.7)', color: 'var(--teal)', title: 'Tech Help Desk', text: 'NGOs, schools and startups post the technical problems they face. Engineers anywhere in the world reply with solutions over chat.', pts: ['Post a challenge in minutes', 'Experts send solutions directly', 'Turn advice into ongoing support'] },
]

const steps = [
  { icon: UserPlus, title: 'Pick your role', text: 'Investor, startup, student, professional or organization.' },
  { icon: FileCheck2, title: 'Submit your profile', text: 'Add your details and the documents needed to verify you.' },
  { icon: ShieldCheck, title: 'Get verified', text: 'Our admin team checks every profile, usually within 24 hours.', alt: true },
  { icon: Sparkles, title: 'Start connecting', text: 'Invest, mentor, learn or solve problems with people you can trust.' },
]

const stories = [
  { quote: 'I left Nepal 9 years ago with no one to ask about grad school. On Aakar I spend one evening a month and help 60 students at once.', who: mentors[0], role: `${mentors[0].title}, ${mentors[0].company}`, feature: true },
  { quote: 'Two diaspora angels found us on Aakar in our first week. That chat turned into $140k for our seed round.', who: { initials: 'AT', color: '#0f9f6e', name: 'Anisha Thapa' }, role: 'Founder, Krishi Sathi' },
  { quote: 'Dr. Asmita reviewed my SOP three times. I’m now starting my MPH in the UK on a Chevening scholarship.', who: { initials: 'PD', color: '#6d4ae6', name: 'Prerana Dahal' }, role: 'Student, Tribhuvan University' },
]

export default function Landing() {
  return (
    <div>
      <IntroAnimation />
      <Nav />

      <section className="hero">
        <div className="container hero-grid">
          <div style={{ animation: 'rise .6s ease' }}>
            <span className="eyebrow">For the 3M+ Nepalis abroad, and everyone at home</span>
            <h1 className="mt-6">
              Nepal’s talent,<br />connected to the{' '}
              <span className="hl">world.
                <svg viewBox="0 0 200 20" preserveAspectRatio="none" aria-hidden="true"><path d="M3 14 C 50 4, 120 2, 197 9" stroke="var(--primary)" strokeWidth="5" strokeLinecap="round" fill="none" /></svg>
              </span>
            </h1>
            <p className="hero-lede">Aakar brings the Nepali diaspora and Nepal together on one trusted platform. Fund startups, mentor students and solve local tech problems from wherever you live.</p>
            <div className="hero-ctas">
              <Link to="/register" className="btn btn-primary btn-lg">Join Aakar, it’s free <ArrowRight size={18} /></Link>
              <a href="#startups" className="play-btn"><span className="pc"><Play size={18} fill="currentColor" /></span> Explore startups</a>
            </div>
            <div className="hero-proof">
              <div className="avatar-stack">
                {mentors.slice(0, 4).map((m) => <Avatar key={m.id} p={m} />)}
              </div>
              <span className="vsep" />
              <div className="small"><b>340+ mentors</b> in 28 countries<br /><span className="muted xs">from Google, Microsoft, Meta and more</span></div>
            </div>
          </div>
          <HeroVisual />
        </div>
        <div className="hero-bottom"><Skyline /></div>
        <div className="tagline-divider">Building a stronger, more innovative Nepal</div>
      </section>

      <div className="container stats-band">
        <div className="glass stats-grid" style={{ boxShadow: 'var(--shadow)' }}>
          {[[TrendingUp, '120+', 'Verified Nepali startups'], [Globe2, '$4.8M', 'Funding requested on Aakar'], [GraduationCap, '2,100+', 'Students mentored'], [Lightbulb, '85', 'Tech challenges solved']].map(([I, n, l]) => (
            <div key={l}><div className="ic-tile" style={{ background: 'var(--primary-50)', color: 'var(--primary)' }}><I size={20} /></div><div><div className="stat-num">{n}</div><div className="stat-label">{l}</div></div></div>
          ))}
        </div>
      </div>

      <section className="section" id="features">
        <div className="container">
          <div className="section-head center">
            <span className="eyebrow">What you can do</span>
            <h2>Three ways the diaspora <span>builds Nepal</span>, together.</h2>
            <p>Money, mentorship and know-how: the three things Nepalis abroad most want to give back, now in one place.</p>
          </div>
          <div className="pillars">
            {pillars.map((p) => (
              <div key={p.n} className="pillar card-hover" style={{ '--accent': p.grad }}>
                <span className="num">{p.n}</span>
                <div className="pic" style={{ background: p.grad, '--shade': p.shade }}><p.icon size={24} /></div>
                <h3>{p.title}</h3>
                <p>{p.text}</p>
                <ul>{p.pts.map((t) => <li key={t}><CheckCircle2 size={16} color={p.color} /> {t}</li>)}</ul>
                <div className="pillar-preview" style={{ marginTop: 'auto' }}>
                  {p.n === '01' && <div className="row small"><Avatar p={startups[3]} size="sm" square /><div className="grow"><b>{startups[3].name}</b><div className="xs muted">Asking {money(startups[3].ask)} · {startups[3].stage}</div></div><span className="btn btn-primary btn-sm"><MessageCircle size={14} /> Chat</span></div>}
                  {p.n === '02' && <div className="row small"><Avatar p={mentors[1]} size="sm" /><div className="grow"><b>{mentors[1].name}</b><div className="xs muted">Matched on <span style={{ color: 'var(--violet)', fontWeight: 700 }}>Scholarships · Study in UK</span></div></div></div>}
                  {p.n === '03' && <div className="row small"><span className="avatar sm sq" style={{ backgroundColor: '#0891b2' }}><Lightbulb size={15} /></span><div className="grow"><b>School lab PCs too slow</b><div className="xs muted">2 solutions suggested · Sindhupalchok</div></div></div>}
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
            <p>Every investor, founder, student, mentor and organization is reviewed by an admin before they can use Aakar, so trust is built in from day one.</p>
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
            <h2>One platform, <span>five communities.</span></h2>
          </div>
          <div className="roles">
            {Object.entries(ROLES).map(([k, r]) => (
              <Link key={k} to={`/register/${k}`} className="role-card card-hover" style={{ '--rc-bg': r.bg }}>
                <div className="ic-tile" style={{ background: r.grad, color: '#fff', width: 48, height: 48, borderRadius: 15 }}><r.icon size={22} /></div>
                <h4>{r.label}</h4>
                <div className="xs bold" style={{ color: r.color }}>{r.who}</div>
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
          <div className="startup-strip">
            {startups.slice(0, 6).map((s) => (
              <div key={s.id} className="dark-card">
                <div className="row">
                  <Avatar p={s} square />
                  <div className="grow"><div className="bold">{s.name}</div><div className="xs" style={{ color: '#a9b6d8' }}>{s.sector} · {s.location}</div></div>
                  <span className="badge" style={{ background: 'rgba(255,255,255,.08)', color: '#cfdcff' }}>{s.stage}</span>
                </div>
                <p className="small mt-3" style={{ color: '#cfd8ef', minHeight: 44 }}>{s.tagline}</p>
                <div className="row-between mt-4 xs" style={{ color: '#a9b6d8' }}><span><b style={{ color: '#fff', fontSize: 15 }}>{money(s.raised)}</b> raised</span><span>Ask {money(s.ask)}</span></div>
                <div className="progress mt-2"><span style={{ width: `${(s.raised / s.ask) * 100}%` }} /></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="stories">
        <div className="container">
          <div className="section-head center">
            <span className="eyebrow">Success stories</span>
            <h2>Real connections, <span>real outcomes.</span></h2>
          </div>
          <div className="stories">
            {stories.map((s) => (
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

          <div className="row-between mt-8 wrap" style={{ marginTop: 72, marginBottom: 20 }}>
            <h3 style={{ fontSize: 26, fontWeight: 800 }}>Upcoming mentorship sessions</h3>
            <Link to="/register/student" className="link small">Join as a student →</Link>
          </div>
          <div className="startup-grid">
            {sessions.slice(0, 3).map((se) => {
              const host = mentors.find((m) => m.id === se.hostId)
              const d = new Date(se.date)
              return (
                <div key={se.id} className="card session-card card-hover">
                  <div className="date-tile"><div className="m">{d.toLocaleString('en-US', { month: 'short' })}</div><div className="d">{d.getDate()}</div></div>
                  <div className="grow">
                    <span className="chip chip-match">{se.keyword}</span>
                    <div className="bold mt-2">{se.title}</div>
                    <div className="row xs muted mt-3"><Avatar p={host} size="sm" /> {host.name} · {host.location.split(',')[0]}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

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
            <div><h5>Platform</h5><ul><li><a href="#startups">Startups</a></li><li><a href="#features">Mentorship</a></li><li><a href="#features">Tech Help Desk</a></li></ul></div>
            <div><h5>Join as</h5><ul>{Object.entries(ROLES).slice(0, 4).map(([k, r]) => <li key={k}><Link to={`/register/${k}`}>{r.label}</Link></li>)}</ul></div>
            <div><h5>Aakar</h5><ul><li><a href="#how">Trust & verification</a></li><li><a href="#stories">Success stories</a></li><li><Link to="/login">Admin login</Link></li></ul></div>
          </div>
          <div className="row-between mt-8 xs faint wrap"><span>© 2026 Aakar. Built for the hackathon with love from Nepal.</span><span>Demo prototype · all data is fictional</span></div>
        </div>
      </footer>
    </div>
  )
}