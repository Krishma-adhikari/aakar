import { useEffect, useRef, useState } from 'react'
import { Navigate, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Avatar, Logo, RoleBadge, ThemeToggle, ago } from '../components/ui'
import {
  Bell, Bookmark, CalendarDays, CheckCircle2, Compass, GraduationCap, Home, Landmark, Lightbulb, LogOut, MessageCircle,
  Rocket, User, Users, Wrench,
} from 'lucide-react'
import { useNotifications, useStore } from '../store'

const NAV = {
  investor: [['/app/startups', 'Discover startups', Compass], ['/app/saved', 'Saved', Bookmark], ['/app/messages', 'Messages', MessageCircle], ['/app/helpdesk', 'Tech Help Desk', Wrench], ['/app/profile', 'My profile', User]],
  startup: [['/app', 'Dashboard', Home], ['/app/investors', 'Investors', Landmark], ['/app/messages', 'Messages', MessageCircle], ['/app/helpdesk', 'Tech Help Desk', Wrench], ['/app/profile', 'My listing', Rocket]],
  student: [['/app', 'Home', Home], ['/app/sessions', 'Sessions', CalendarDays], ['/app/mentors', 'Find mentors', Users], ['/app/messages', 'Messages', MessageCircle], ['/app/profile', 'My profile', User]],
  professional: [['/app', 'Home', Home], ['/app/sessions', 'My sessions', CalendarDays], ['/app/students', 'Matched Students', GraduationCap], ['/app/helpdesk', 'Tech Help Desk', Wrench], ['/app/messages', 'Messages', MessageCircle], ['/app/profile', 'My profile', User]],
  organization: [['/app/helpdesk', 'Tech Help Desk', Wrench], ['/app/messages', 'Messages', MessageCircle], ['/app/profile', 'Organization', User]],
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
  const { user, entity, logout, state } = useStore()
  const nav = useNavigate()
  if (!user) return <Navigate to="/login" replace />
  if (user.role === 'admin') return <Navigate to="/admin" replace />
  if (user.status !== 'approved') return <Navigate to="/pending" replace />

  const items = NAV[user.role]
  const convCount = state.conversations.filter((c) => c.ownerId === user.id && c.messages.at(-1)?.from === 'peer').length
  const reqCount = user.role === 'professional' ? state.requests.filter((r) => r.mentorId === entity?.id && r.status === 'pending').length : 0

  const links = items.map(([to, label, I]) => (
    <NavLink key={to} to={to} end={to === '/app'} className={({ isActive }) => `side-link ${isActive ? 'active' : ''}`}>
      <I size={18} /> {label}
      {label === 'Messages' && convCount > 0 && <span className="count">{convCount}</span>}
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
          <Avatar p={user} size="sm" />
          <div className="grow"><div className="small bold" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</div><RoleBadge role={user.role} /></div>
          <button className="icon-btn" style={{ width: 32, height: 32 }} onClick={() => { logout(); nav('/') }} aria-label="Log out" title="Log out"><LogOut size={15} /></button>
        </div>
      </aside>
      <div className="main">
        <header className="topbar">
          <div className="row" style={{ marginLeft: 'auto' }}>
            <span className="badge badge-green mobile-hide"><CheckCircle2 size={12} /> Verified {user.role}</span>
            <ThemeToggle />
            <Notifications />
            <Avatar p={user} size="sm" />
          </div>
        </header>
        <nav className="mobile-nav">{links}<button className="side-link" style={{ border: 0, background: 'none' }} onClick={() => { logout(); nav('/') }}><LogOut size={16} /> Log out</button></nav>
        <Outlet />
      </div>
    </div>
  )
}
