import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Check, CheckCircle2, Clock, Eye, FileText, LogOut, RotateCcw, Search, ShieldCheck, Users, X, XCircle } from 'lucide-react'
import { Avatar, Empty, Logo, Modal, ROLES, RoleBadge, StatusBadge, ThemeToggle, ago, fmtDate, fmtTime } from '../components/ui'
import { useStore } from '../store'

const CHECKS = {
  investor: ['Name on ID matches account', 'ID document is valid and not expired', 'Proof of funds / accreditation looks genuine', 'No duplicate or flagged accounts'],
  startup: ['OCR registration number verified', 'PAN / VAT certificate matches company name', 'Founder citizenship matches account holder', 'Pitch contains no misleading claims'],
  student: ['Student ID matches name', 'Institution is recognised', 'Currently enrolled'],
  professional: ['Name on ID matches account', 'Employment verified (letter or LinkedIn)', 'Expertise matches experience'],
  organization: ['Registration certificate is valid', 'Authorization letter on official letterhead', 'Contact person verified by phone'],
}
const REASONS = ['Could not verify identity documents.', 'Documents are blurry or incomplete.', 'Registration number does not match records.', 'Duplicate account.', 'Other']

function Review({ u, onClose }) {
  const { approve, reject, entityOf, toast } = useStore()
  const checks = CHECKS[u.role] || []
  const [done, setDone] = useState(u.status === 'approved' ? checks : [])
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason] = useState(REASONS[0])
  const [other, setOther] = useState('')
  const [preview, setPreview] = useState(null)
  const entity = entityOf(u)

  const profile = u.profile || (entity ? Object.fromEntries(Object.entries({
    Location: entity.location || entity.city || entity.district, Type: entity.type, Institution: entity.institution, Title: entity.title, Company: entity.company,
    Sector: entity.sector, Stage: entity.stage, Interests: entity.interests?.join(', '), Expertise: entity.fields?.join(', '), Ticket: entity.ticket,
  }).filter(([, v]) => v)) : {})

  return (
    <div className="drawer-wrap" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="drawer">
        <div className="row-between" style={{ padding: '20px 24px', borderBottom: '1px solid var(--line)', position: 'sticky', top: 0, background: 'var(--card)', zIndex: 2 }}>
          <div className="row"><ShieldCheck size={18} color="var(--blue)" /><b>Verification review</b></div>
          <button className="icon-btn" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>
        <div style={{ padding: 24 }}>
          <div className="row"><Avatar p={u} size="lg" /><div className="grow"><h3 style={{ fontSize: 22 }}>{u.name}</h3><div className="small muted">{u.email}</div><div className="row mt-2" style={{ gap: 6 }}><RoleBadge role={u.role} /><StatusBadge status={u.status} /></div></div></div>
          <div className="xs muted mt-3">Submitted {fmtDate(u.submittedAt, { month: 'long', day: 'numeric', year: 'numeric' })} at {fmtTime(u.submittedAt)}</div>

          <hr className="divider" />
          <div className="xs faint bold">PROFILE DETAILS</div>
          <div className="grid-2 mt-3" style={{ gap: 14 }}>
            {Object.entries(profile).filter(([, v]) => v).map(([k, v]) => <div key={k}><div className="xs muted">{k}</div><div className="small bold" style={{ fontWeight: 500 }}>{v}</div></div>)}
          </div>

          <hr className="divider" />
          <div className="xs faint bold">DOCUMENTS ({u.docs?.length || 0})</div>
          <div className="stack mt-3" style={{ gap: 10 }}>
            {(u.docs || []).map((d) => (
              <div key={d} className="doc-preview">
                <div className="doc-thumb" />
                <div className="grow"><div className="small bold">{d}</div><div className="xs muted">Uploaded with application · encrypted</div></div>
                <button className="btn btn-ghost btn-sm" onClick={() => setPreview(d)}><Eye size={14} /> View</button>
              </div>
            ))}
          </div>

          {checks.length > 0 && <>
            <hr className="divider" />
            <div className="row-between"><div className="xs faint bold">VERIFICATION CHECKLIST</div><button className="xs bold" style={{ border: 0, background: 'none', color: 'var(--blue)' }} onClick={() => setDone(checks)}>Mark all</button></div>
            <div className="stack mt-3" style={{ gap: 8 }}>
              {checks.map((c) => {
                const on = done.includes(c)
                return (
                  <label key={c} className="row small" style={{ cursor: 'pointer', padding: '10px 12px', borderRadius: 12, border: '1px solid var(--line)', background: on ? 'var(--green-50)' : 'var(--card)' }}>
                    <input type="checkbox" checked={on} onChange={() => setDone(on ? done.filter((x) => x !== c) : [...done, c])} /> {c}
                  </label>
                )
              })}
            </div>
          </>}

          {u.status === 'rejected' && u.rejectReason && <div className="card mt-6" style={{ padding: 14, background: 'var(--crimson-50)', borderColor: 'transparent' }}><div className="small"><b>Rejected:</b> {u.rejectReason}</div></div>}

          {!rejecting ? (
            <div className="row mt-8">
              {u.status !== 'approved' && <button className="btn btn-success btn-lg grow" disabled={done.length < checks.length} onClick={() => { approve(u.id); toast(`${u.name} approved. They can now use Aakar.`); onClose() }}><CheckCircle2 size={18} /> Approve</button>}
              {u.status !== 'rejected' && <button className="btn btn-danger-ghost btn-lg grow" onClick={() => setRejecting(true)}><XCircle size={18} /> Reject</button>}
            </div>
          ) : (
            <div className="card card-pad mt-6">
              <div className="bold small">Reason for rejection</div>
              <select className="select mt-2" value={reason} onChange={(e) => setReason(e.target.value)}>{REASONS.map((r) => <option key={r}>{r}</option>)}</select>
              {reason === 'Other' && <textarea className="textarea mt-2" value={other} onChange={(e) => setOther(e.target.value)} placeholder="Tell the applicant what to fix" />}
              <div className="row mt-4">
                <button className="btn btn-ghost grow" onClick={() => setRejecting(false)}>Cancel</button>
                <button className="btn btn-primary grow" onClick={() => { reject(u.id, reason === 'Other' ? other || 'Other' : reason); toast(`${u.name} rejected.`); onClose() }}>Confirm rejection</button>
              </div>
            </div>
          )}
          {u.status !== 'approved' && done.length < checks.length && !rejecting && <p className="xs muted mt-2">Complete the checklist to enable approval.</p>}
        </div>
      </div>
      {preview && (
        <Modal title={preview} sub={`Submitted by ${u.name}`} onClose={() => setPreview(null)}>
          <div style={{ height: 340, borderRadius: 14, border: '1px solid var(--line)', background: 'repeating-linear-gradient(0deg, var(--line) 0 2px, var(--paper) 2px 14px)', display: 'grid', placeItems: 'center', position: 'relative' }}>
            <div style={{ textAlign: 'center' }}><FileText size={40} color="var(--faint)" /><div className="small muted mt-2">Document preview (demo)</div></div>
            <div style={{ position: 'absolute', top: 20, left: 20, width: 70, height: 84, borderRadius: 8, background: 'var(--line)' }} />
            <div style={{ position: 'absolute', bottom: 18, right: 18, padding: '4px 10px', borderRadius: 6, border: '2px solid var(--crimson)', color: 'var(--crimson)', fontWeight: 700, fontSize: 11, transform: 'rotate(-8deg)' }}>GOVT. OF NEPAL</div>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default function Admin() {
  const { state, user, logout, resetDemo } = useStore()
  const nav = useNavigate()
  const [tab, setTab] = useState('pending')
  const [role, setRole] = useState('all')
  const [q, setQ] = useState('')
  const [openId, setOpenId] = useState(null)

  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'admin') return <Navigate to="/app" replace />

  const apps = state.users.filter((u) => u.role !== 'admin')
  const counts = { pending: apps.filter((u) => u.status === 'pending').length, approved: apps.filter((u) => u.status === 'approved').length, rejected: apps.filter((u) => u.status === 'rejected').length }
  const list = apps
    .filter((u) => tab === 'all' || u.status === tab)
    .filter((u) => role === 'all' || u.role === role)
    .filter((u) => !q || (u.name + u.email).toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
  const open = apps.find((u) => u.id === openId)

  return (
    <div style={{ minHeight: '100vh' }}>
      <div className="topbar topbar-dark">
        <div className="row"><Logo to="/admin" /><span className="badge" style={{ background: 'rgba(255,255,255,.1)', color: '#fff' }}>Admin console</span></div>
        <div className="row">
          <ThemeToggle />
          <button className="btn btn-sm" onClick={() => { resetDemo(); nav('/login') }}><RotateCcw size={14} /> Reset demo</button>
          <button className="btn btn-sm" onClick={() => { logout(); nav('/login') }}><LogOut size={14} /> Log out</button>
        </div>
      </div>
      <div className="page" style={{ margin: '0 auto' }}>
        <div className="page-head">
          <div><h1>Verification queue</h1><p>Review every new member before they can access Aakar.</p></div>
        </div>
        <div className="kpis">
          {[['Waiting for review', counts.pending, Clock, 'var(--amber)', 'var(--amber-50)'], ['Verified members', counts.approved, CheckCircle2, 'var(--green)', 'var(--green-50)'], ['Rejected', counts.rejected, XCircle, 'var(--crimson)', 'var(--crimson-50)'], ['Total applications', apps.length, Users, 'var(--blue)', 'var(--blue-50)']].map(([l, v, I, c, bg]) => (
            <div key={l} className="card kpi"><div className="ic" style={{ background: bg, color: c }}><I size={18} /></div><div className="v">{v}</div><div className="small muted">{l}</div></div>
          ))}
        </div>

        <div className="card mt-6" style={{ overflow: 'hidden' }}>
          <div className="row-between wrap" style={{ padding: '6px 16px 0' }}>
            <div className="tabs" style={{ marginBottom: 0, borderBottom: 0 }}>
              {[['pending', `Pending (${counts.pending})`], ['approved', 'Approved'], ['rejected', 'Rejected'], ['all', 'All']].map(([k, l]) => <button key={k} className={`tab ${tab === k ? 'active' : ''}`} onClick={() => setTab(k)}>{l}</button>)}
            </div>
            <div className="input-icon" style={{ width: 260, padding: '8px 0' }}><Search size={16} /><input className="input" style={{ height: 38 }} placeholder="Search name or email" value={q} onChange={(e) => setQ(e.target.value)} /></div>
          </div>
          <div className="row wrap" style={{ padding: '12px 16px', borderTop: '1px solid var(--line)', gap: 8 }}>
            <button className={`chip chip-btn ${role === 'all' ? 'active' : ''}`} onClick={() => setRole('all')}>All roles</button>
            {Object.entries(ROLES).map(([k, r]) => <button key={k} className={`chip chip-btn ${role === k ? 'active' : ''}`} onClick={() => setRole(k)}><r.icon size={13} /> {r.label}</button>)}
          </div>
          {list.length ? (
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead><tr><th>Applicant</th><th>Role</th><th className="mobile-hide">Submitted</th><th className="mobile-hide">Documents</th><th>Status</th><th /></tr></thead>
                <tbody>
                  {list.map((u) => (
                    <tr key={u.id} className={`clickable ${openId === u.id ? 'sel' : ''}`} onClick={() => setOpenId(u.id)}>
                      <td><div className="row"><Avatar p={u} size="sm" /><div><div className="bold">{u.name}</div><div className="xs muted">{u.email}</div></div></div></td>
                      <td><RoleBadge role={u.role} /></td>
                      <td className="mobile-hide small muted">{ago(u.submittedAt)}</td>
                      <td className="mobile-hide"><span className="chip"><FileText size={12} /> {u.docs?.length || 0} files</span></td>
                      <td><StatusBadge status={u.status} /></td>
                      <td style={{ textAlign: 'right' }}><button className="btn btn-ghost btn-sm">{u.status === 'pending' ? <>Review <Check size={14} /></> : 'View'}</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <Empty icon={CheckCircle2} title="All caught up" text="No applications in this view." />}
        </div>
      </div>
      {open && <Review key={open.id} u={open} onClose={() => setOpenId(null)} />}
    </div>
  )
}
