// TEMPORARY demo navigator: browse the whole app without logging in.
// To remove: set DEMO_MODE to false (or delete this file and its <DemoNav /> in App.jsx).
import { startTransition, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Compass, LogOut, ShieldCheck, X } from 'lucide-react'
import { ROLES } from './ui'
import { useStore } from '../store'

export const DEMO_MODE = true

const ACCOUNTS = {
  investor: 'u-inv', startup: 'u-sup', student: 'u-stu', professional: 'u-pro', organization: 'u-org', admin: 'u-admin',
}

const PAGES = {
  public: [['/', 'Landing page'], ['/register', 'Choose role'], ['/register/investor', 'Register: investor'], ['/register/startup', 'Register: startup'], ['/register/student', 'Register: student'], ['/register/professional', 'Register: professional'], ['/register/organization', 'Register: organization'], ['/login', 'Login']],
  investor: [['/app/startups', 'Discover startups'], ['/app/startups/s1', 'Startup detail'], ['/app/saved', 'Saved'], ['/app/messages', 'Messages'], ['/app/helpdesk', 'Tech Help Desk'], ['/app/profile', 'Profile & visibility']],
  startup: [['/app', 'Dashboard'], ['/app/investors', 'Investors'], ['/app/messages', 'Messages'], ['/app/helpdesk', 'Tech Help Desk'], ['/app/profile', 'My listing']],
  student: [['/app', 'Home'], ['/app/sessions', 'Sessions'], ['/app/mentors', 'Find mentors'], ['/app/messages', 'Messages'], ['/app/profile', 'Profile']],
  professional: [['/app', 'Home & requests'], ['/app/sessions', 'My sessions'], ['/app/students', 'Students'], ['/app/helpdesk', 'Tech Help Desk'], ['/app/messages', 'Messages'], ['/app/profile', 'Profile']],
  organization: [['/app/helpdesk', 'Tech Help Desk'], ['/app/messages', 'Messages'], ['/app/profile', 'Profile']],
  admin: [['/admin', 'Verification queue']],
}

export default function DemoNav() {
  const { user, setCurrent, logout } = useStore()
  const nav = useNavigate()
  const loc = useLocation()
  const [open, setOpen] = useState(false)
  const panelRef = useRef(null)
  const role = user?.role

  // Close the panel when the visitor clicks anywhere outside it, or presses Esc.
  useEffect(() => {
    if (!open) return
    const onDown = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  // Shareable links: add ?as=student (or investor, startup, professional, organization, admin) to any URL.
  // The param is applied once, then removed so it can't override later role switches.
  const handled = useRef(null)
  useEffect(() => {
    const params = new URLSearchParams(loc.search)
    const as = params.get('as')
    if (!as || handled.current === loc.key) return
    handled.current = loc.key
    if (ACCOUNTS[as]) setCurrent(ACCOUNTS[as])
    params.delete('as')
    nav({ pathname: loc.pathname, search: params.toString() }, { replace: true })
  }, [loc.key, loc.search, loc.pathname, nav, setCurrent])

  // The router applies navigation inside a transition, so the role change goes in one too:
  // both then land in the same render and the login guards never see a half-switched state.
  const go = (r, to) => {
    nav(to)
    startTransition(() => {
      if (r === 'public') logout()
      else if (user?.id !== ACCOUNTS[r]) setCurrent(ACCOUNTS[r])
    })
  }

  const viewAs = (r) => go(r, PAGES[r][0][0])

  if (!DEMO_MODE) return null

  return (
    <>
      {!open && (
        <button className="demo-fab" onClick={() => setOpen(true)} aria-label="Open demo navigator">
          <Compass size={18} /> Demo mode{role && <span className="demo-fab-role">{ROLES[role]?.label || 'Admin'}</span>}
        </button>
      )}
      {open && (
        <div className="demo-panel" ref={panelRef}>
          <div className="row-between" style={{ padding: '14px 16px', borderBottom: '1px solid var(--line)' }}>
            <div>
              <div className="bold">Demo navigator</div>
              <div className="xs muted">Temporary: skip login and verification</div>
            </div>
            <button className="icon-btn" style={{ width: 32, height: 32 }} onClick={() => setOpen(false)} aria-label="Close"><X size={16} /></button>
          </div>
          <div style={{ padding: 16 }}>
            <div className="xs faint bold">VIEW AS</div>
            <div className="demo-roles mt-2">
              {Object.entries(ROLES).map(([k, r]) => (
                <button key={k} className={`demo-role ${role === k ? 'on' : ''}`} onClick={() => viewAs(k)}>
                  <span className="ic-tile" style={{ width: 30, height: 30, borderRadius: 9, background: r.grad, color: '#fff' }}><r.icon size={15} /></span>{r.label}
                </button>
              ))}
              <button className={`demo-role ${role === 'admin' ? 'on' : ''}`} onClick={() => viewAs('admin')}>
                <span className="ic-tile" style={{ width: 30, height: 30, borderRadius: 9, background: '#0d1b45', color: '#fff' }}><ShieldCheck size={15} /></span>Admin
              </button>
              <button className={`demo-role ${!role ? 'on' : ''}`} onClick={() => go('public', '/')}>
                <span className="ic-tile" style={{ width: 30, height: 30, borderRadius: 9, background: 'var(--paper-2)', color: 'var(--muted)' }}><LogOut size={15} /></span>Logged out
              </button>
            </div>

            <div className="xs faint bold mt-4">PAGES {role ? `· ${(ROLES[role]?.label || 'Admin').toUpperCase()}` : '· PUBLIC'}</div>
            <div className="stack mt-2" style={{ gap: 2 }}>
              {PAGES[role || 'public'].map(([to, label]) => (
                <button key={to} className={`demo-link ${loc.pathname === to ? 'on' : ''}`} onClick={() => go(role || 'public', to)}>{label}<span className="xs faint">{to}</span></button>
              ))}
            </div>
            {role && (
              <>
                <div className="xs faint bold mt-4">PUBLIC PAGES</div>
                <div className="row wrap mt-2" style={{ gap: 6 }}>
                  {[PAGES.public[0], PAGES.public[1], PAGES.public[7]].map(([to, label]) => <button key={to} className="chip chip-btn" onClick={() => nav(to)}>{label}</button>)}
                  <button className="chip chip-btn" onClick={() => { setCurrent('u-p1'); nav('/pending') }}>Pending status page</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}