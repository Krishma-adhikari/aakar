import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, ArrowRight, Check, CheckCircle2, Clock, Eye, EyeOff, FileText, Loader2, Lock, Mail, ShieldCheck,
  ShieldAlert, Sparkles, UserCheck, XCircle,
} from 'lucide-react'
import { Avatar, ChipSelect, Logo, Mountains, ROLES, RoleBadge, StatusBadge, ThemeToggle, Toggle, Upload, fmtDate, fmtTime } from '../components/ui'
import { KEYWORDS, SECTORS, STAGES } from '../data/demo'
import { useStore } from '../store'

/* ---------- Role-specific registration config ---------- */
const COUNTRIES = ['USA', 'UK', 'Australia', 'Canada', 'Japan', 'South Korea', 'Germany', 'UAE', 'Qatar', 'India', 'Nepal', 'Other']
const FORMS = {
  investor: {
    fields: [
      { key: 'investorType', label: 'Investor type', type: 'select', options: ['Angel investor', 'Venture capital', 'Diaspora fund', 'Family office', 'Corporate'], required: true },
      { key: 'firm', label: 'Firm / fund name', placeholder: 'Independent if angel' },
      { key: 'country', label: 'Country of residence', type: 'select', options: COUNTRIES, required: true },
      { key: 'ticket', label: 'Typical ticket size', type: 'select', options: ['$5k – $25k', '$25k – $100k', '$100k – $500k', '$500k+'], required: true },
      { key: 'sectors', label: 'Sectors of interest', type: 'chips', options: SECTORS, span: 2, required: true },
      { key: 'bio', label: 'Short bio', type: 'textarea', span: 2, placeholder: 'Your background and what you look for in a startup' },
      { key: 'visible', label: 'Make my profile visible to startups', type: 'toggle', span: 2, hint: 'Off by default. When off, only startups you message can see you.' },
    ],
    docs: [
      { key: 'id', label: 'Passport or national ID', hint: 'To confirm your identity', required: true },
      { key: 'proof', label: 'Proof of funds or accreditation', hint: 'Bank reference, accreditation letter or fund registration' },
    ],
  },
  startup: {
    fields: [
      { key: 'startupName', label: 'Startup name', required: true },
      { key: 'tagline', label: 'One-line pitch', placeholder: 'What you do, in one sentence', required: true, span: 2 },
      { key: 'sector', label: 'Sector', type: 'select', options: SECTORS, required: true },
      { key: 'stage', label: 'Stage', type: 'select', options: STAGES, required: true },
      { key: 'location', label: 'Based in (district)', placeholder: 'e.g. Kathmandu', required: true },
      { key: 'founded', label: 'Year founded', type: 'number', placeholder: '2024' },
      { key: 'team', label: 'Team size', type: 'number', placeholder: '5' },
      { key: 'regNo', label: 'Company registration no. (OCR)', placeholder: 'OCR-2081-XXXXX', required: true },
      { key: 'ask', label: 'Funding ask (USD)', type: 'number', placeholder: '100000', required: true },
      { key: 'equity', label: 'Equity offered (%)', type: 'number', placeholder: '10' },
      { key: 'problem', label: 'Problem', type: 'textarea', span: 2, required: true },
      { key: 'solution', label: 'Solution', type: 'textarea', span: 2, required: true },
    ],
    docs: [
      { key: 'ocr', label: 'Company registration certificate (OCR)', hint: 'Office of Company Registrar certificate', required: true },
      { key: 'pan', label: 'PAN / VAT certificate', hint: 'Issued by the Inland Revenue Department', required: true },
      { key: 'cit', label: 'Founder citizenship certificate', hint: 'Front and back in one file', required: true },
      { key: 'deck', label: 'Pitch deck (optional)', hint: 'PDF, up to 20 MB' },
    ],
  },
  student: {
    fields: [
      { key: 'institution', label: 'School / college / university', required: true, span: 2 },
      { key: 'level', label: 'Current level', type: 'select', options: ['+2 / A-Levels', 'Bachelor (1st year)', 'Bachelor (2nd year)', 'Bachelor (3rd year)', 'Bachelor (final year)', 'Master', 'Recent graduate'], required: true },
      { key: 'city', label: 'City', placeholder: 'e.g. Pokhara', required: true },
      { key: 'interests', label: 'Interests (used to match you with mentors and sessions)', type: 'chips', options: KEYWORDS, span: 2, required: true, max: 6, hint: 'Pick up to 6' },
      { key: 'goal', label: 'Your main goal', type: 'textarea', span: 2, placeholder: 'e.g. MS in Computer Science in the USA with a scholarship' },
    ],
    docs: [
      { key: 'sid', label: 'Student ID card', hint: 'Photo of the front of your ID', required: true },
      { key: 'enroll', label: 'Enrollment letter or latest transcript', hint: 'Shows you are currently enrolled' },
    ],
  },
  professional: {
    fields: [
      { key: 'title', label: 'Current job title', required: true },
      { key: 'company', label: 'Company / university', required: true },
      { key: 'country', label: 'Country you work in', type: 'select', options: COUNTRIES, required: true },
      { key: 'years', label: 'Years of experience', type: 'number', placeholder: '5', required: true },
      { key: 'degree', label: 'Highest degree', placeholder: 'e.g. MS CS, Texas A&M', span: 2 },
      { key: 'fields', label: 'Expertise (students are matched on these)', type: 'chips', options: KEYWORDS, span: 2, required: true, max: 6, hint: 'Pick up to 6' },
      { key: 'hours', label: 'Hours you can volunteer per month', type: 'select', options: ['2', '4', '6', '8', '10+'] },
      { key: 'linkedin', label: 'LinkedIn URL', placeholder: 'linkedin.com/in/...' },
      { key: 'bio', label: 'Short bio', type: 'textarea', span: 2 },
    ],
    docs: [
      { key: 'id', label: 'Passport or ID', hint: 'To confirm you are Nepali or of Nepali origin', required: true },
      { key: 'emp', label: 'Proof of employment', hint: 'Employment letter, work ID or payslip (amounts hidden)', required: true },
    ],
  },
  organization: {
    fields: [
      { key: 'orgName', label: 'Organization name', required: true, span: 2 },
      { key: 'orgType', label: 'Type', type: 'select', options: ['NGO', 'School', 'College', 'Community org', 'Local government', 'Cooperative'], required: true },
      { key: 'regNo', label: 'Registration number', placeholder: 'SWC / DEO registration no.', required: true },
      { key: 'district', label: 'District', required: true },
      { key: 'contactRole', label: 'Your role', placeholder: 'e.g. Principal, Program Manager', required: true },
      { key: 'focus', label: 'What does your organization do?', type: 'textarea', span: 2 },
    ],
    docs: [
      { key: 'reg', label: 'Registration certificate', hint: 'Social Welfare Council, DEO or municipality certificate', required: true },
      { key: 'auth', label: 'Authorization letter', hint: 'Letter on letterhead allowing you to represent the organization', required: true },
    ],
  },
}

function AuthLayout({ children, side }) {
  return (
    <div className="auth-wrap">
      <aside className="auth-side">
        <div style={{ position: 'relative', zIndex: 2 }}><Logo /></div>
        <div style={{ position: 'relative', zIndex: 2 }}>{side}</div>
        <div className="row xs" style={{ color: '#cfdcff', position: 'relative', zIndex: 2 }}><ShieldCheck size={14} /> Every account is reviewed by the Aakar team</div>
        <Mountains />
      </aside>
      <main className="auth-main">{children}</main>
    </div>
  )
}

/* ---------- Role picker ---------- */
export function RoleSelect() {
  const [sel, setSel] = useState(null)
  const nav = useNavigate()
  return (
    <AuthLayout side={<><h2>Join a trusted community.</h2><p className="mt-3">Tell us who you are. Each role has its own profile and verification so everyone on Aakar is who they say they are.</p></>}>
      <div className="auth-top">
        <Link to="/" className="btn btn-ghost btn-sm"><ArrowLeft size={15} /> Home</Link>
        <div className="row"><span className="small muted">Already a member? <Link to="/login" className="link">Log in</Link></span><ThemeToggle /></div>
      </div>
      <div style={{ maxWidth: 820 }}>
        <span className="eyebrow">Create account</span>
        <h1 className="mt-3" style={{ fontSize: 38 }}>How will you use Aakar?</h1>
        <p className="muted mt-2">Choose one. You can create another account later for a different role.</p>
        <div className="role-grid mt-8">
          {Object.entries(ROLES).map(([k, r]) => (
            <button key={k} className={`role-pick ${sel === k ? 'sel' : ''}`} onClick={() => setSel(k)} onDoubleClick={() => nav(`/register/${k}`)}>
              <span className="check">{sel === k && <Check size={13} />}</span>
              <span className="ic" style={{ background: r.bg, color: r.color }}><r.icon size={22} /></span>
              <h4>{r.label}</h4>
              <span className="xs bold" style={{ color: r.color }}>{r.who}</span>
              <span className="small muted">{r.blurb}</span>
            </button>
          ))}
        </div>
        <div className="row mt-8" style={{ justifyContent: 'flex-end' }}>
          <button className="btn btn-primary btn-lg" disabled={!sel} onClick={() => nav(`/register/${sel}`)}>
            Continue{sel ? ` as ${ROLES[sel].label.toLowerCase()}` : ''} <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </AuthLayout>
  )
}

/* ---------- Registration form ---------- */
function Field({ f, value, onChange, error }) {
  const common = { id: f.key, value: value ?? '', onChange: (e) => onChange(e.target.value), placeholder: f.placeholder, className: `${f.type === 'textarea' ? 'textarea' : f.type === 'select' ? 'select' : 'input'} ${error ? 'invalid' : ''}` }
  let control
  if (f.type === 'select') control = <select {...common}><option value="">Select…</option>{f.options.map((o) => <option key={o}>{o}</option>)}</select>
  else if (f.type === 'textarea') control = <textarea {...common} />
  else if (f.type === 'chips') control = <ChipSelect options={f.options} value={value || []} onChange={onChange} max={f.max} />
  else if (f.type === 'toggle') return (
    <div className={`card ${f.span === 2 ? 'span-2' : ''}`} style={{ padding: 16, display: 'flex', gap: 14, alignItems: 'center', borderRadius: 14 }}>
      <Eye size={20} color="var(--blue)" />
      <div className="grow"><div className="bold small">{f.label}</div><div className="xs muted">{f.hint}</div></div>
      <Toggle on={!!value} onChange={onChange} label={f.label} />
    </div>
  )
  else control = <input type={f.type || 'text'} {...common} />
  return (
    <div className={`field ${f.span === 2 ? 'span-2' : ''}`}>
      <label htmlFor={f.key}>{f.label} {f.required && <span className="req">*</span>}</label>
      {control}
      {error ? <span className="err">{error}</span> : f.hint && <span className="hint">{f.hint}</span>}
    </div>
  )
}

const STEP_NAMES = ['Account', 'Profile', 'Verification', 'Review']

export function Register() {
  const { role } = useParams()
  const cfg = FORMS[role]
  const r = ROLES[role]
  const { register } = useStore()
  const nav = useNavigate()
  const [step, setStep] = useState(0)
  const [acc, setAcc] = useState({ name: '', email: '', phone: '', password: '', confirm: '', agree: false })
  const [vals, setVals] = useState({})
  const [docs, setDocs] = useState({})
  const [errors, setErrors] = useState({})
  const [showPw, setShowPw] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  if (!cfg) return <Navigate to="/register" replace />

  const validate = () => {
    const e = {}
    if (step === 0) {
      if (acc.name.trim().length < 3) e.name = 'Enter your full name'
      if (!/^\S+@\S+\.\S+$/.test(acc.email)) e.email = 'Enter a valid email'
      if (acc.password.length < 6) e.password = 'At least 6 characters'
      if (acc.confirm !== acc.password) e.confirm = 'Passwords do not match'
      if (!acc.agree) e.agree = 'Please accept to continue'
    }
    if (step === 1) cfg.fields.forEach((f) => {
      const v = vals[f.key]
      if (f.required && (v === undefined || v === '' || (Array.isArray(v) && !v.length))) e[f.key] = 'Required'
    })
    if (step === 2) cfg.docs.forEach((d) => { if (d.required && !docs[d.key]) e['doc-' + d.key] = 'Required' })
    setErrors(e)
    return !Object.keys(e).length
  }

  const next = () => { if (validate()) setStep((s) => s + 1) }

  const profileSummary = () => {
    const out = {}
    cfg.fields.forEach((f) => {
      const v = vals[f.key]
      if (v === undefined || v === '') return
      out[f.label.replace(/ \(.*\)$/, '')] = Array.isArray(v) ? v.join(', ') : typeof v === 'boolean' ? (v ? 'Yes' : 'No') : String(v)
    })
    return out
  }

  const submit = () => {
    setSubmitting(true)
    setTimeout(() => {
      const res = register({
        role, name: acc.name.trim(), email: acc.email.trim(), password: acc.password,
        profile: { Phone: acc.phone, ...profileSummary() }, raw: vals, docs: Object.values(docs),
      })
      setSubmitting(false)
      if (res.error) { setErrors({ email: res.error }); setStep(0); return }
      nav('/pending')
    }, 900)
  }

  const setA = (k) => (e) => { const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value; setAcc((a) => ({ ...a, [k]: v })) }

  return (
    <AuthLayout side={<>
      <span className="badge pill-dark"><r.icon size={13} /> {r.label} account</span>
      <h2 className="mt-4">{r.blurb}</h2>
      <div className="verify-list mt-8" style={{ color: '#cdd2e4' }}>
        {cfg.docs.filter((d) => d.required).map((d) => <div key={d.key} className="verify-item"><span className="vi vi-dark"><FileText size={14} /></span>{d.label}</div>)}
        <div className="verify-item"><span className="vi vi-dark"><UserCheck size={14} /></span>Reviewed by an Aakar admin</div>
      </div>
    </>}>
      <div className="auth-top">
        <Link to="/register" className="btn btn-ghost btn-sm"><ArrowLeft size={15} /> Change role</Link>
        <div className="row"><span className="small muted">Already a member? <Link to="/login" className="link">Log in</Link></span><ThemeToggle /></div>
      </div>
      <div style={{ maxWidth: 720 }}>
        <div className="stepper">
          {STEP_NAMES.map((n, i) => (
            <div key={n} className="row" style={{ gap: 8 }}>
              <div className={`s ${i === step ? 'active' : i < step ? 'done' : ''}`}><span className="n">{i < step ? <Check size={13} /> : i + 1}</span>{n}</div>
              {i < STEP_NAMES.length - 1 && <span className="bar" />}
            </div>
          ))}
        </div>

        {step === 0 && (
          <>
            <h1 style={{ fontSize: 32 }}>Create your {r.label.toLowerCase()} account</h1>
            <p className="muted mt-2">This is the person who will manage the account{role === 'startup' || role === 'organization' ? ` for your ${role}` : ''}.</p>
            <div className="grid-2 mt-6">
              <div className="field span-2"><label>Full name <span className="req">*</span></label><input className={`input ${errors.name ? 'invalid' : ''}`} value={acc.name} onChange={setA('name')} placeholder="As on your ID" />{errors.name && <span className="err">{errors.name}</span>}</div>
              <div className="field"><label>Email <span className="req">*</span></label><input className={`input ${errors.email ? 'invalid' : ''}`} value={acc.email} onChange={setA('email')} placeholder="you@example.com" />{errors.email && <span className="err">{errors.email}</span>}</div>
              <div className="field"><label>Phone</label><input className="input" value={acc.phone} onChange={setA('phone')} placeholder="+977 98XXXXXXXX" /></div>
              <div className="field"><label>Password <span className="req">*</span></label>
                <div style={{ position: 'relative' }}>
                  <input type={showPw ? 'text' : 'password'} className={`input ${errors.password ? 'invalid' : ''}`} value={acc.password} onChange={setA('password')} />
                  <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 10, top: 11, border: 0, background: 'none', color: 'var(--faint)' }} aria-label="Show password">{showPw ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                </div>
                {errors.password && <span className="err">{errors.password}</span>}
              </div>
              <div className="field"><label>Confirm password <span className="req">*</span></label><input type="password" className={`input ${errors.confirm ? 'invalid' : ''}`} value={acc.confirm} onChange={setA('confirm')} />{errors.confirm && <span className="err">{errors.confirm}</span>}</div>
              <label className="span-2 row small" style={{ alignItems: 'flex-start', gap: 10 }}>
                <input type="checkbox" checked={acc.agree} onChange={setA('agree')} style={{ marginTop: 4 }} />
                <span>I confirm the information I provide is accurate and agree to Aakar’s community guidelines and verification process.{errors.agree && <span className="err" style={{ display: 'block' }}>{errors.agree}</span>}</span>
              </label>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <h1 style={{ fontSize: 32 }}>Your {role === 'startup' ? 'startup profile & pitch' : 'profile'}</h1>
            <p className="muted mt-2">{role === 'startup' ? 'This is what investors will see. You can add more detail after you’re verified.' : 'This helps us verify you and match you with the right people.'}</p>
            <div className="grid-2 mt-6">
              {cfg.fields.map((f) => <Field key={f.key} f={f} value={vals[f.key]} error={errors[f.key]} onChange={(v) => setVals((p) => ({ ...p, [f.key]: v }))} />)}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h1 style={{ fontSize: 32 }}>Verification documents</h1>
            <p className="muted mt-2">Only Aakar admins can see these. They are used to verify your {role === 'startup' ? 'company' : role === 'organization' ? 'organization' : 'identity'} and are never shown publicly.</p>
            <div className="stack mt-6">
              {cfg.docs.map((d) => (
                <div key={d.key}>
                  <Upload label={d.label} hint={d.hint} required={d.required} file={docs[d.key]} onFile={(name) => setDocs((p) => ({ ...p, [d.key]: name }))} />
                  {errors['doc-' + d.key] && <span className="err">Please upload this document</span>}
                </div>
              ))}
            </div>
            <button type="button" className="btn btn-soft btn-sm mt-4" onClick={() => setDocs(Object.fromEntries(cfg.docs.map((d) => [d.key, d.label.split(' ')[0] + '_sample.pdf'])))}>
              <Sparkles size={14} /> Demo: attach sample files
            </button>
            <div className="card mt-6" style={{ padding: 16, background: 'var(--blue-50)', borderColor: 'var(--primary-100)', display: 'flex', gap: 12 }}>
              <Lock size={18} color="var(--blue)" style={{ flexShrink: 0, marginTop: 2 }} />
              <div className="small">Files are encrypted and deleted 90 days after your account is verified. Use clear photos or PDF scans.</div>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h1 style={{ fontSize: 32 }}>Review and submit</h1>
            <p className="muted mt-2">After you submit, an admin will review your application. You’ll get access once you’re verified.</p>
            <div className="card card-pad mt-6">
              <div className="row"><Avatar p={{ initials: acc.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase(), color: 'var(--primary)' }} size="lg" /><div><h3 style={{ fontSize: 22 }}>{acc.name}</h3><div className="small muted">{acc.email}</div><div className="mt-1"><RoleBadge role={role} /></div></div></div>
              <hr className="divider" />
              <div className="grid-2" style={{ gap: 12 }}>
                {Object.entries(profileSummary()).map(([k, v]) => <div key={k}><div className="xs faint bold">{k.toUpperCase()}</div><div className="small">{v}</div></div>)}
              </div>
              <hr className="divider" />
              <div className="xs faint bold">DOCUMENTS</div>
              <div className="row wrap mt-2">{Object.values(docs).map((d) => <span key={d} className="chip"><FileText size={13} /> {d}</span>)}</div>
            </div>
          </>
        )}

        <div className="row-between mt-8">
          {step > 0 ? <button className="btn btn-ghost" onClick={() => setStep(step - 1)}><ArrowLeft size={16} /> Back</button> : <span />}
          {step < 3
            ? <button className="btn btn-primary btn-lg" onClick={next}>Continue <ArrowRight size={18} /></button>
            : <button className="btn btn-primary btn-lg" onClick={submit} disabled={submitting}>{submitting ? <><Loader2 size={18} className="spin" /> Submitting…</> : <>Submit for verification <ShieldCheck size={18} /></>}</button>}
        </div>
      </div>
    </AuthLayout>
  )
}

/* ---------- Login with verification check ---------- */
const DEMO = [
  ['investor@aakar.demo', 'investor', 'Investor'], ['startup@aakar.demo', 'startup', 'Startup founder'], ['student@aakar.demo', 'student', 'Student'],
  ['mentor@aakar.demo', 'professional', 'Professional'], ['org@aakar.demo', 'organization', 'Organization'], ['admin@aakar.demo', 'admin', 'Admin'],
  ['pending@aakar.demo', 'investor', 'Pending account'], ['fakeinvestor@demo.com', 'investor', 'Rejected account'],
]

export function Login() {
  const { login, setCurrent } = useStore()
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(null) // { user, stage }

  const run = (e, em = email, p = pw) => {
    e?.preventDefault()
    setError('')
    const res = login(em, p)
    if (res.error) { setError(res.error); return }
    setChecking({ user: res.user, stage: 0 })
  }

  useEffect(() => {
    if (!checking) return
    if (checking.stage < 3) {
      const t = setTimeout(() => setChecking((c) => ({ ...c, stage: c.stage + 1 })), 550)
      return () => clearTimeout(t)
    }
    const u = checking.user
    const t = setTimeout(() => {
      setCurrent(u.id)
      if (u.role === 'admin') nav('/admin')
      else if (u.status === 'approved') nav('/app')
      else nav('/pending')
    }, u.status === 'approved' ? 600 : 1200)
    return () => clearTimeout(t)
  }, [checking, nav, setCurrent])

  const u = checking?.user
  const items = u ? [
    { label: 'Account found', ok: true },
    { label: `Role: ${ROLES[u.role]?.label || 'Admin'}`, ok: true },
    { label: 'Documents submitted', ok: true },
    { label: u.status === 'approved' ? 'Verified by admin' : u.status === 'rejected' ? 'Verification rejected' : 'Waiting for admin approval', ok: u.status === 'approved', bad: u.status === 'rejected', wait: u.status === 'pending' },
  ] : []

  return (
    <AuthLayout side={<><h2>Welcome back.</h2><p className="mt-3">Log in to continue. We check your verification status every time you sign in, so only approved members get through.</p></>}>
      <div className="auth-top">
        <Link to="/" className="btn btn-ghost btn-sm"><ArrowLeft size={15} /> Home</Link>
        <div className="row"><span className="small muted">New here? <Link to="/register" className="link">Register</Link></span><ThemeToggle /></div>
      </div>
      <div style={{ maxWidth: 440, margin: '0 auto' }}>
        {!checking ? (
          <>
            <h1 style={{ fontSize: 34 }}>Log in to Aakar</h1>
            <p className="muted mt-2">Investors, founders, students, professionals and organizations all sign in here.</p>
            <form onSubmit={run} className="stack mt-6" style={{ gap: 16 }}>
              <div className="field"><label>Email</label><div className="input-icon"><Mail size={17} /><input className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="username" /></div></div>
              <div className="field"><label>Password</label><div className="input-icon"><Lock size={17} /><input type="password" className="input" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="••••••••" autoComplete="current-password" /></div></div>
              {error && <div className="err" style={{ fontSize: 13 }}>{error}</div>}
              <button className="btn btn-primary btn-lg btn-block" type="submit">Log in <ArrowRight size={18} /></button>
            </form>
            <div className="mt-8">
              <div className="row-between"><span className="xs faint bold">DEMO ACCOUNTS · PASSWORD demo123</span></div>
              <div className="demo-accounts mt-3">
                {DEMO.map(([em, role, label]) => (
                  <button key={em} className="demo-acc" onClick={() => { setEmail(em); setPw('demo123'); run(null, em, 'demo123') }}>
                    <span className="avatar sm" style={{ background: ROLES[role]?.color || '#0d1b45' }}>{(() => { const I = ROLES[role]?.icon || ShieldCheck; return <I size={14} /> })()}</span>
                    <span className="grow"><span className="small bold" style={{ display: 'block' }}>{label}</span><span className="xs muted" style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis' }}>{em}</span></span>
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="card card-pad" style={{ marginTop: 40 }}>
            <div className="row"><Avatar p={u} size="lg" /><div><h3 style={{ fontSize: 22 }}>{u.name}</h3><div className="mt-1"><RoleBadge role={u.role} /></div></div></div>
            <hr className="divider" />
            <div className="xs faint bold">CHECKING YOUR VERIFICATION</div>
            <div className="verify-list mt-3">
              {items.map((it, i) => {
                const done = checking.stage > i || (checking.stage === 3 && i === 3)
                const cls = !done ? '' : it.bad ? 'bad' : it.wait ? 'wait' : 'ok'
                return (
                  <div key={it.label} className={`verify-item ${cls}`}>
                    <span className="vi">{!done ? <Loader2 size={14} className="spin" /> : it.bad ? <XCircle size={15} /> : it.wait ? <Clock size={15} /> : <Check size={15} />}</span>
                    <span style={{ color: done ? 'var(--ink)' : 'var(--faint)' }}>{it.label}</span>
                  </div>
                )
              })}
            </div>
            {checking.stage === 3 && <p className="small muted mt-6">{u.status === 'approved' ? 'All good. Taking you in…' : 'Taking you to your application status…'}</p>}
          </div>
        )}
      </div>
    </AuthLayout>
  )
}

/* ---------- Pending / rejected status ---------- */
export function Pending() {
  const { user, logout } = useStore()
  const nav = useNavigate()
  const tl = useMemo(() => {
    if (!user) return []
    const st = user.status
    return [
      { t: 'Application submitted', s: `${fmtDate(user.submittedAt)} at ${fmtTime(user.submittedAt)}`, state: 'done' },
      { t: 'Documents received', s: `${user.docs?.length || 0} files uploaded securely`, state: 'done' },
      { t: st === 'rejected' ? 'Review completed' : 'Admin review', s: st === 'pending' ? 'Usually within 24 hours' : st === 'rejected' ? 'Your application was not approved' : 'Approved', state: st === 'pending' ? 'current' : 'done' },
      { t: 'Access to Aakar', s: st === 'approved' ? 'You’re in!' : 'Unlocks after verification', state: st === 'approved' ? 'done' : '' },
    ]
  }, [user])

  if (!user) return <Navigate to="/login" replace />
  if (user.role === 'admin') return <Navigate to="/admin" replace />

  return (
    <AuthLayout side={<><h2>{user.status === 'approved' ? 'You’re verified!' : 'Thanks for applying.'}</h2><p className="mt-3">Verification keeps Aakar safe for investors, founders and students. We review every account by hand.</p></>}>
      <div className="auth-top">
        <Link to="/" className="btn btn-ghost btn-sm"><ArrowLeft size={15} /> Home</Link>
        <div className="row"><ThemeToggle /><button className="btn btn-ghost btn-sm" onClick={() => { logout(); nav('/login') }}>Log out</button></div>
      </div>
      <div style={{ maxWidth: 620 }}>
        <div style={{ width: 64, height: 64, borderRadius: 20, display: 'grid', placeItems: 'center', background: user.status === 'approved' ? 'var(--green-50)' : user.status === 'rejected' ? 'var(--crimson-50)' : 'var(--amber-50)', color: user.status === 'approved' ? 'var(--green)' : user.status === 'rejected' ? 'var(--crimson)' : 'var(--amber)' }}>
          {user.status === 'approved' ? <CheckCircle2 size={30} /> : user.status === 'rejected' ? <ShieldAlert size={30} /> : <Clock size={30} />}
        </div>
        <h1 className="mt-6" style={{ fontSize: 36 }}>
          {user.status === 'approved' ? 'Your account is verified' : user.status === 'rejected' ? 'We couldn’t verify your account' : 'Your profile is under review'}
        </h1>
        <p className="muted mt-3" style={{ fontSize: 16 }}>
          {user.status === 'approved' ? 'Welcome to Aakar. Everything is unlocked for you now.'
            : user.status === 'rejected' ? <>Reason: <b style={{ color: 'var(--ink)' }}>{user.rejectReason || 'Documents could not be verified.'}</b> You can register again with updated documents.</>
              : <>Hi {user.name.split(' ')[0]}, an Aakar admin is checking your details and documents. We’ll email <b style={{ color: 'var(--ink)' }}>{user.email}</b> when you’re approved.</>}
        </p>

        <div className="card card-pad mt-8">
          <div className="row-between"><div className="row"><Avatar p={user} /><div><div className="bold">{user.name}</div><div className="xs muted">{user.email}</div></div></div><div className="row" style={{ gap: 6 }}><RoleBadge role={user.role} /><StatusBadge status={user.status} /></div></div>
          <hr className="divider" />
          <div className="timeline">
            {tl.map((x) => (
              <div key={x.t} className={`tl-item ${x.state}`}>
                <span className="tl-ic">{x.state === 'done' ? <Check size={15} /> : x.state === 'current' ? <Clock size={15} /> : <Lock size={13} />}</span>
                <div><div className="bold small">{x.t}</div><div className="xs muted">{x.s}</div></div>
              </div>
            ))}
          </div>
        </div>

        <div className="row wrap mt-6">
          {user.status === 'approved' && <button className="btn btn-primary btn-lg" onClick={() => nav('/app')}>Enter Aakar <ArrowRight size={18} /></button>}
          {user.status === 'rejected' && <Link to="/register" className="btn btn-primary btn-lg">Register again</Link>}
          {user.status === 'pending' && (
            <div className="card" style={{ padding: 16, background: 'var(--gold-50)', borderColor: 'transparent', display: 'flex', gap: 12, alignItems: 'center', width: '100%' }}>
              <Sparkles size={20} color="var(--amber)" />
              <div className="grow small"><b>Hackathon demo:</b> log in as admin to approve this account, then come back.</div>
              <button className="btn btn-dark btn-sm" onClick={() => { logout(); nav('/login') }}>Open admin login</button>
            </div>
          )}
        </div>
      </div>
    </AuthLayout>
  )
}
