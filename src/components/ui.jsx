/* eslint-disable react-refresh/only-export-components */
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Briefcase, Building2, Check, FileUp, GraduationCap, Landmark, Moon, Rocket, Sun, X, CheckCircle2 } from 'lucide-react'

export const ROLES = {
  investor: { label: 'Investor', icon: Landmark, color: 'var(--primary)', bg: 'var(--primary-50)', grad: 'linear-gradient(135deg,#3a6cf0,#1d47c8)', blurb: 'Discover vetted Nepali startups, read pitches and chat directly with founders.', who: 'Angels, VCs and diaspora funds' },
  startup: { label: 'Startup', icon: Rocket, color: 'var(--violet)', bg: 'var(--violet-50)', grad: 'linear-gradient(135deg,#8b6cf5,#5b3ad6)', blurb: 'List your profile, pitch and funding needs in front of investors worldwide.', who: 'Founders building in Nepal' },
  student: { label: 'Student', icon: GraduationCap, color: 'var(--green)', bg: 'var(--green-50)', grad: 'linear-gradient(135deg,#22c58b,#0a8a5f)', blurb: 'Get matched with Nepali mentors abroad and join sessions in your field.', who: '+2, Bachelor and Master students' },
  professional: { label: 'Professional', icon: Briefcase, color: 'var(--amber)', bg: 'var(--amber-50)', grad: 'linear-gradient(135deg,#f6b73c,#d1830a)', blurb: 'Mentor students voluntarily, host group sessions and solve local tech problems.', who: 'Nepali professionals abroad' },
  organization: { label: 'Organization', icon: Building2, color: 'var(--teal)', bg: 'var(--teal-50)', grad: 'linear-gradient(135deg,#22b8d8,#0a7f9c)', blurb: 'Post technical challenges and get solutions from the diaspora tech community.', who: 'NGOs, schools and local bodies' },
}

export function LogoMark({ size = 34 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <defs>
        <linearGradient id="lm-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#4a7bf5" /><stop offset="1" stopColor="#1d47c8" /></linearGradient>
      </defs>
      <path d="M3 34 L20 4 L37 34 L28.5 34 L20 18.5 L11.5 34 Z" fill="url(#lm-g)" />
      <path d="M16 34 L20 27 L24 34 Z" fill="url(#lm-g)" opacity=".55" />
    </svg>
  )
}

export function Logo({ to = '/' }) {
  return (
    <Link to={to} className="logo" aria-label="Aakar home">
      <LogoMark />
      Aakar <span className="sep" /> <span className="deva">आकार</span>
    </Link>
  )
}

/* ---------- Theme (per-viewer preference) ---------- */
function readTheme() {
  try { return localStorage.getItem('aakar-theme') || 'light' } catch { return 'light' }
}
export function useTheme() {
  const [theme, setTheme] = useState(readTheme)
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try { localStorage.setItem('aakar-theme', theme) } catch { /* ignore */ }
  }, [theme])
  return [theme, () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))]
}
export function ThemeToggle() {
  const [theme, toggle] = useTheme()
  return (
    <button className="icon-btn" onClick={toggle} aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'} title={theme === 'dark' ? 'Light mode' : 'Dark mode'}>
      {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
    </button>
  )
}

export function Avatar({ p, size = '', square = false }) {
  if (!p) return null
  return <span className={`avatar ${size} ${square ? 'sq' : ''}`} style={{ backgroundColor: p.color || 'var(--primary)' }}>{p.initials}</span>
}

export function StatusBadge({ status }) {
  if (status === 'approved') return <span className="badge badge-green"><span className="dot" /> Verified</span>
  if (status === 'rejected') return <span className="badge badge-red"><span className="dot" /> Rejected</span>
  return <span className="badge badge-amber"><span className="dot" /> Pending review</span>
}

export function RoleBadge({ role }) {
  const r = ROLES[role]
  if (!r) return <span className="badge badge-gray">Admin</span>
  const Icon = r.icon
  return <span className="badge" style={{ background: r.bg, color: r.color }}><Icon size={12} /> {r.label}</span>
}

/* ---------- Nepal skyline pieces ---------- */
// A multi-tier pagoda, drawn around (0,0) = base centre.
export function Pagoda({ x = 0, y = 0, s = 1, fill = 'currentColor', tiers = 3 }) {
  const parts = []
  parts.push(<rect key="base" x={-34} y={-8} width={68} height={8} />)
  parts.push(<rect key="base2" x={-28} y={-14} width={56} height={6} />)
  let top = -14
  for (let i = 0; i < tiers; i++) {
    const w = 46 - i * 11
    const wall = 13 - i
    parts.push(<rect key={'w' + i} x={-w / 2 + 6} y={top - wall} width={w - 12} height={wall} />)
    top -= wall
    const rw = w + 14
    parts.push(<path key={'r' + i} d={`M ${-rw / 2 - 3} ${top + 2} Q ${-rw / 2 + 4} ${top - 2} ${-w / 2 + 2} ${top - 10} L ${w / 2 - 2} ${top - 10} Q ${rw / 2 - 4} ${top - 2} ${rw / 2 + 3} ${top + 2} Z`} />)
    top -= 10
  }
  parts.push(<rect key="f" x={-1.5} y={top - 12} width={3} height={12} />)
  parts.push(<circle key="fc" cx={0} cy={top - 13} r={3} />)
  return <g transform={`translate(${x} ${y}) scale(${s})`} fill={fill}>{parts}</g>
}

export function Stupa({ x = 0, y = 0, s = 1, fill = 'currentColor' }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} fill={fill}>
      <rect x={-46} y={-6} width={92} height={6} />
      <rect x={-38} y={-12} width={76} height={6} />
      <path d="M -32 -12 A 32 30 0 0 1 32 -12 Z" />
      <rect x={-9} y={-52} width={18} height={12} />
      <path d="M -7 -52 L 7 -52 L 3 -86 L -3 -86 Z" />
      <path d="M -12 -86 Q 0 -96 12 -86 Z" />
      <rect x={-1} y={-100} width={2} height={10} />
    </g>
  )
}

// Wide decorative skyline: soft hills on the left, temples on the right.
export function Skyline({ className = '', color = 'var(--primary)' }) {
  return (
    <svg className={className} viewBox="0 0 1440 150" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <path d="M0 150 L0 92 C 120 60 220 70 320 96 C 420 120 520 80 640 100 C 760 120 860 90 980 110 L 980 150 Z" fill={color} opacity=".07" />
      <path d="M0 150 L0 116 C 160 92 300 112 440 120 C 560 128 700 110 820 126 L 820 150 Z" fill={color} opacity=".08" />
      <g style={{ color }} opacity=".14">
        <Pagoda x={1130} y={150} s={1.15} />
        <Stupa x={1260} y={150} s={.9} />
        <Pagoda x={1370} y={150} s={.8} tiers={2} />
        <Pagoda x={1030} y={150} s={.7} tiers={2} />
      </g>
      <path d="M940 150 L 1440 150 L 1440 140 L 940 140 Z" fill={color} opacity=".1" />
    </svg>
  )
}

// Mountains for dark panels (auth side, CTA)
export function Mountains({ className = 'auth-mtn' }) {
  return (
    <svg className={className} viewBox="0 0 460 200" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <path d="M0 200 L0 120 L70 70 L120 100 L190 30 L250 95 L300 60 L360 110 L410 80 L460 105 L460 200 Z" fill="#fff" opacity=".08" />
      <path d="M190 30 L210 50 L200 49 L192 58 L182 46 Z M70 70 L86 84 L78 84 L70 92 L62 82 Z" fill="#fff" opacity=".35" />
      <path d="M0 200 L0 150 L90 120 L160 145 L240 115 L320 150 L400 125 L460 140 L460 200 Z" fill="#fff" opacity=".08" />
      <g style={{ color: '#fff' }} opacity=".16"><Pagoda x={360} y={200} s={.9} /><Stupa x={440} y={200} s={.6} /></g>
    </svg>
  )
}

export function Modal({ title, sub, onClose, children, width }) {
  useEffect(() => {
    const k = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [onClose])
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={width ? { maxWidth: width } : undefined} role="dialog" aria-modal="true">
        <div className="modal-head">
          <div>
            <h3>{title}</h3>
            {sub && <p className="muted small mt-1">{sub}</p>}
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  )
}

export function Empty({ icon: Icon, title, text, action }) {
  return (
    <div className="empty">
      {Icon && <div className="ic"><Icon size={24} /></div>}
      <div className="bold" style={{ color: 'var(--ink)' }}>{title}</div>
      {text && <p className="small mt-1">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function ChipSelect({ options, value, onChange, max }) {
  return (
    <div className="row wrap" style={{ gap: 8 }}>
      {options.map((o) => {
        const on = value.includes(o)
        return (
          <button type="button" key={o} className={`chip chip-btn ${on ? 'active' : ''}`}
            onClick={() => onChange(on ? value.filter((x) => x !== o) : max && value.length >= max ? value : [...value, o])}>
            {on && <Check size={13} />} {o}
          </button>
        )
      })}
    </div>
  )
}

export function Upload({ label, hint, file, onFile, required }) {
  const ref = useRef(null)
  return (
    <div className={`upload ${file ? 'done' : ''}`} onClick={() => ref.current?.click()} role="button" tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && ref.current?.click()}>
      <div className="ic">{file ? <CheckCircle2 size={20} /> : <FileUp size={20} />}</div>
      <div className="grow">
        <div className="bold small">{label} {required && <span className="req">*</span>}</div>
        <div className="xs muted">{file ? file : hint}</div>
      </div>
      <span className="btn btn-soft btn-sm">{file ? 'Replace' : 'Upload'}</span>
      <input ref={ref} type="file" hidden accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0].name)} />
    </div>
  )
}

export function Toggle({ on, onChange, label }) {
  return <button type="button" className={`toggle ${on ? 'on' : ''}`} onClick={() => onChange(!on)} aria-pressed={on} aria-label={label} />
}

export const money = (n) => {
  if (n >= 1e6) return `$${(n / 1e6).toFixed(n % 1e6 ? 1 : 0)}M`
  if (n >= 1e3) return `$${Math.round(n / 1e3)}k`
  return `$${n}`
}
export const fmtDate = (iso, opts = { month: 'short', day: 'numeric' }) => new Date(iso).toLocaleDateString('en-US', opts)
export const fmtTime = (iso) => new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
export const ago = (iso) => {
  const s = (Date.now() - new Date(iso)) / 1000
  if (s < 0) return 'in ' + Math.ceil(-s / 86400) + 'd'
  if (s < 60) return 'just now'
  if (s < 3600) return Math.floor(s / 60) + 'm ago'
  if (s < 86400) return Math.floor(s / 3600) + 'h ago'
  return Math.floor(s / 86400) + 'd ago'
}
