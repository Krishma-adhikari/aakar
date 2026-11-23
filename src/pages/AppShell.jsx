import { useEffect, useRef, useState } from 'react'
import { Navigate, NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Avatar, Logo, RoleBadge, ThemeToggle, ago } from '../components/ui'
import SignOutButton from '../components/SignOutButton'
import {
  Bell, Bookmark, CalendarDays, CheckCircle2, Compass, GraduationCap, Home, Landmark, Lightbulb, LogOut, MessageCircle,
  Rocket, User, Users, Wallet, Wrench,
} from 'lucide-react'
import { useNotifications, useStore } from '../store'

// Sidebar menu per role. Each item is [path, label, Icon].
const NAV = {

  investor: [
    ['/app/startups', 'Discover startups', Compass],
    ['/app/saved', 'Saved', Bookmark],
    ['/app/messages', 'Messages', MessageCircle],
    ['/app/helpdesk', 'Tech Help Desk', Wrench],
    ['/app/profile', 'My profile', User],
  ],
  startup: [
    ['/app', 'Dashboard', Home],
    ['/app/investors', 'Investors', Landmark],
    ['/app/messages', 'Messages', MessageCircle],
    ['/app/helpdesk', 'Tech Help Desk', Wrench],
    ['/app/profile', 'My listing', Rocket],
  ],
  student: [
    ['/app', 'Home', Home],
    ['/app/sessions', 'Sessions', CalendarDays],
    ['/app/mentors', 'Find mentors', Users],
    ['/app/paid-mentorship', 'Paid mentorship', Wallet], // NEW
    ['/app/messages', 'Messages', MessageCircle],
    ['/app/profile', 'My profile', User],
  ],
  professional: [
    ['/app', 'Home', Home],
    ['/app/sessions', 'My sessions', CalendarDays],
    ['/app/students', 'Matched Students', GraduationCap],
    ['/app/helpdesk', 'Tech Help Desk', Wrench],
    ['/app/messages', 'Messages', MessageCircle],
    ['/app/profile', 'My profile', User],
  ],

  investor: [['/app/startups', 'Discover startups', Compass], ['/app/saved', 'Saved', Bookmark], ['/app/messages', 'Messages', MessageCircle], ['/app/helpdesk', 'Tech Help Desk', Wrench], ['/app/profile', 'My profile', User]],
  startup: [['/app', 'Dashboard', Home], ['/app/investors', 'Investors', Landmark], ['/app/messages', 'Messages', MessageCircle], ['/app/helpdesk', 'Tech Help Desk', Wrench], ['/app/profile', 'My listing', Rocket]],
  student: [['/app', 'Home', Home], ['/app/sessions', 'Sessions', CalendarDays], ['/app/mentors', 'Find mentors', Users], ['/app/messages', 'Messages', MessageCircle], ['/app/profile', 'My profile', User]],
  professional: [['/app', 'Home', Home], ['/app/sessions', 'My sessions', CalendarDays], ['/app/students', 'Students', GraduationCap], ['/app/helpdesk', 'Tech Help Desk', Wrench], ['/app/messages', 'Messages', MessageCircle], ['/app/profile', 'My profile', User]],

}

const NIcon = { session: CalendarDays, check: CheckCircle2, user: User, bulb: Lightbulb, chat: MessageCircle, rocket: Rocket }

function Notifications() {
  const notifs = useNotifications()
  const { markNotifsRead } = useStore()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const nav = useNavigate()
  const unread = notifs.filter((n) => n.unread).length

  useEffect(() => {
    const f = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false)
    document.addEventListener('mousedown', f)
    return () => document.removeEventListener('mousedown', f)
  }, [])

  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <button className="icon-btn" onClick={() => setOpen(!open)} aria-label="Notifications"><Bell size={18} />{unread > 0 && <span className="notif-dot" />}</button>
      {open && (
        <div className="dropdown">
          <div className="row-between" style={{ padding: '14px 16px', borderBottom: '1px solid var(--line)' }}>
            <b>Notifications</b>
            {unread > 0 && <button className="xs bold" style={{ border: 0, background: 'none', color: 'var(--blue)' }} onClick={() => markNotifsRead(notifs.map((n) => n.id))}>Mark all read</button>}
          </div>
          <div style={{ maxHeight: 380, overflowY: 'auto' }}>
            {notifs.length === 0 && <div className="small muted" style={{ padding: 24, textAlign: 'center' }}>You’re all caught up.</div>}
            {notifs.map((n) => {
              const I = NIcon[n.icon] || Bell
              return (
                <button key={n.id} className={`notif-item ${n.unread ? 'unread' : ''}`} onClick={() => { markNotifsRead([n.id]); setOpen(false); nav(n.to) }}>
                  <span className="avatar sm" style={{ background: 'var(--card)', color: 'var(--primary)', border: '1px solid var(--line)' }}><I size={15} /></span>
                  <span className="grow"><span style={{ display: 'block' }}>{n.text}</span><span className="xs muted" style={{ display: 'block' }}>{n.sub}</span></span>
                  <span className="xs faint">{ago(n.at)}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default function AppShell() {
  const { user, entity, logout, state, unreadTotal } = useStore()
  const nav = useNavigate()
  const { pathname } = useLocation()

  if (!user) return <Navigate to="/login" replace />
  if (user.role === 'admin') return <Navigate to="/admin" replace />
  if (user.status !== 'approved') return <Navigate to="/pending" replace />

  const items = NAV[user.role] || [] // safe fallback if a role has no menu

  // Mentor "Home" badge = pending mentorship requests waiting for me.
  const reqCount = user.role === 'professional'
    ? state.requests.filter((r) => r.mentorId === entity?.id && r.status === 'pending').length
    : 0

  const goProfile = () => nav('/app/profile')
  const doLogout = () => { logout(); nav('/') }

  // Messages badge = unseen messages from the other person.
  const links = items.map(([to, label, I]) => (
    <NavLink key={to} to={to} end={to === '/app'} className={({ isActive }) => `side-link ${isActive ? 'active' : ''}`}>
      <I size={18} /> {label}
      {label === 'Messages' && unreadTotal > 0 && <span className="count">{unreadTotal > 99 ? '99+' : unreadTotal}</span>}
      {label === 'Home' && reqCount > 0 && <span className="count">{reqCount}</span>}
    </NavLink>
  ))

  return (
    <div className="shell">
      <aside className="sidebar">
        <div style={{ padding: '0 8px 18px' }}><Logo to="/app" /></div>
        <div className="side-section">Menu</div>
        {links}
        <div className="side-user">
          <span onClick={goProfile} style={{ cursor: 'pointer', display: 'inline-flex' }} title="My profile">
            <Avatar p={user} size="sm" />
          </span>
          <div className="grow" onClick={goProfile} style={{ cursor: 'pointer', minWidth: 0 }} title="My profile">
            <div className="small bold" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</div>
            <RoleBadge role={user.role} />
          </div>
          <button className="icon-btn" style={{ width: 32, height: 32 }} onClick={doLogout} aria-label="Log out" title="Log out"><LogOut size={15} /></button>
        </div>
      </aside>
      <div className="main">
        <header className="topbar">
          <div className="row" style={{ marginLeft: 'auto' }}>
            <span className="badge badge-green mobile-hide"><CheckCircle2 size={12} /> Verified {user.role}</span>
            <ThemeToggle />
            <Notifications />
            <span onClick={goProfile} style={{ cursor: 'pointer', display: 'inline-flex' }} title="My profile">
              <Avatar p={user} size="sm" />
            </span>
          </div>
        </header>
        <nav className="mobile-nav">
          {links}
          <button className="side-link" style={{ border: 0, background: 'none' }} onClick={doLogout}><LogOut size={16} /> Log out</button>
        </nav>
        <Outlet />
        {/* Sign out button, shown only on the profile page */}
        {pathname === '/app/profile' && (
          <div style={{ padding: '0 clamp(16px, 4vw, 40px) 40px' }}>
            <SignOutButton />
          </div>
        )}
      </div>
    </div>
  )
}