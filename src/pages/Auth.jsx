import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, ArrowRight, Check, CheckCircle2, Circle, Clock, Eye, EyeOff, FileText, Loader2, Lock, Mail, ShieldCheck,
  Plus, ShieldAlert, Sparkles, Upload as UploadIcon, UserCheck, X, XCircle,
} from 'lucide-react'
import { Avatar, ChipSelect, Logo, Mountains, ROLES, RoleBadge, StatusBadge, ThemeToggle, Toggle, fmtDate, fmtTime } from '../components/ui'
import { BUSINESS_MODELS, KEYWORDS, SECTORS, STAGES } from '../data/demo'
import { useStore } from '../store'
import { DEMO_ENABLED } from '../lib/flags'
import { checkPassword } from '../lib/validation'


function generatePassword(len = 14) {
  const sets = ['ABCDEFGHJKLMNPQRSTUVWXYZ', 'abcdefghijkmnopqrstuvwxyz', '23456789', '!@#$%&*?']
  const all = sets.join('')
  const rnd = (n) => crypto.getRandomValues(new Uint32Array(1))[0] % n
  const chars = sets.map((s) => s[rnd(s.length)]) // one of each type
  while (chars.length < len) chars.push(all[rnd(all.length)])
  for (let i = chars.length - 1; i > 0; i--) { const j = rnd(i + 1);[chars[i], chars[j]] = [chars[j], chars[i]] }
  return chars.join('')
}

const STRENGTH_COLORS = ['var(--line)', '#dc2626', 'var(--amber)', '#65a30d', 'var(--green)']

function PasswordStrength({ value }) {
  const { rules, level, label } = checkPassword(value)
  return (
    <div>
      <div style={{ display: 'flex', gap: 4 }}>
        {[1, 2, 3, 4].map((i) => <span key={i} style={{ flex: 1, height: 5, borderRadius: 4, background: i <= level ? STRENGTH_COLORS[level] : 'var(--line)' }} />)}
      </div>
      <div className="xs bold mt-1" style={{ color: STRENGTH_COLORS[level], minHeight: 16 }}>{label ? `Password strength: ${label}` : 'Create a strong password'}</div>
      <div className="xs muted mt-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
        {rules.map(([text, ok]) => (
          <span key={text} className="row" style={{ gap: 5, color: ok ? 'var(--green)' : undefined }}>
            {ok ? <Check size={12} /> : <Circle size={10} />} {text}
          </span>
        ))}
      </div>
    </div>
  )
}

/* ---------- Role-specific registration config ---------- */
const COUNTRIES = ['USA', 'UK', 'Australia', 'Canada', 'Japan', 'South Korea', 'Germany', 'UAE', 'Qatar', 'India', 'Nepal', 'Other']
const GAP_YEARS = Array.from({ length: 11 }, (_, i) => String(new Date().getFullYear() - i))
const FORMS = {
  investor: {
    fields: [
      { key: 'investorType', label: 'Investor type', type: 'select', options: ['Angel investor', 'Venture capital', 'Diaspora fund', 'Family office', 'Corporate'], required: true },
      { key: 'firm', label: 'Firm / fund name', placeholder: 'Independent if angel' },
      { key: 'country', label: 'Country of residence', type: 'select', options: COUNTRIES, required: true },
      { key: 'ticket', label: 'Typical ticket size', type: 'select', options: ['$5k – $25k', '$25k – $100k', '$100k – $500k', '$500k+'], required: true },
      { key: 'sectors', label: 'Sectors of interest', type: 'chips', options: [...SECTORS, 'Other'], span: 2, required: true },
      { key: 'sectorsOther', label: 'Other sectors (please specify)', span: 2, placeholder: 'e.g. Hydropower, Handicrafts', required: true, showIf: (v) => (v.sectors || []).includes('Other') },
      { key: 'bio', label: 'Short bio', type: 'textarea', span: 2, required: true, placeholder: 'Your background and what you look for in a startup' },
      { key: 'visible', label: 'Make my profile visible to startups', type: 'toggle', span: 2, hint: 'Off by default. When off, only startups you message can see you.' },
    ],
    docs: [
      { key: 'id', label: 'Passport or national ID', hint: 'To confirm your identity', required: true },
      { key: 'photo', label: 'Profile photo', hint: 'A clear photo of your face (JPG or PNG)', accept: 'image' },
      { key: 'cv', label: 'CV / résumé', hint: 'PDF, JPG or PNG', required: true },
    ],
  },
  startup: {
    fields: [
      { key: 'startupName', label: 'Startup name', required: true },
      { key: 'sector', label: 'Sector', type: 'select', options: SECTORS, required: true },
      { key: 'stage', label: 'Stage', type: 'select', options: STAGES, required: true },
      { key: 'location', label: 'Based in (district)', placeholder: 'e.g. Kathmandu', required: true },
      { key: 'founded', label: 'Year founded', type: 'number', placeholder: '2024' },
      { key: 'team', label: 'Team size', type: 'number', placeholder: '5' },
      { key: 'regNo', label: 'Company registration no. (OCR)', placeholder: 'OCR-2081-XXXXX', required: true },
      { key: 'ask', label: 'Funding ask (USD)', type: 'number', placeholder: '100000', required: true },
      { key: 'equity', label: 'Equity offered (%)', type: 'number', placeholder: '10' },
    ],
    pitch: [
      { key: 'problemLine', label: 'Problem statement (one line)', placeholder: 'The problem you solve, in one sentence', required: true, span: 2 },
      { key: 'solution', label: 'Solution', type: 'textarea', span: 2, required: true, placeholder: 'What you built and how it solves the problem' },
      { key: 'model', label: 'Business model', type: 'select', options: BUSINESS_MODELS, required: true },
      { key: 'modelOther', label: 'Other business model (please specify)', required: true, showIf: (v) => v.model === 'Other' },
      { key: 'productDesc', label: 'Your product or service', type: 'textarea', span: 2, required: true, placeholder: 'What it is, who uses it and how it works' },
      { key: 'productWebsite', label: 'Product website or app link', type: 'url', span: 2, placeholder: 'https://…', hint: 'Website, app store page or live demo' },
      { key: 'socialLinkedin', label: 'LinkedIn page', type: 'url', placeholder: 'https://linkedin.com/company/…' },
      { key: 'socialFacebook', label: 'Facebook page', type: 'url', placeholder: 'https://facebook.com/…' },
      { key: 'socialInstagram', label: 'Instagram', type: 'url', placeholder: 'https://instagram.com/…' },
      { key: 'socialOther', label: 'Other link (X, YouTube, TikTok…)', type: 'url', placeholder: 'https://…' },
      { key: 'pitchVideo', label: 'Pitch video link', type: 'url', span: 2, placeholder: 'https://youtube.com/…', hint: 'YouTube, Vimeo, Loom or Google Drive link (public or unlisted)' },
      { key: 'tractionUsers', label: 'Users / customers so far', placeholder: 'e.g. 1,200' },
      { key: 'tractionRevenue', label: 'Monthly revenue (USD)', placeholder: 'e.g. 3,500, or 0 if pre-revenue' },
      { key: 'tractionNotes', label: 'Traction & milestones', type: 'textarea', span: 2, required: true, placeholder: 'Pilots, partnerships, awards, waitlist. Write “none yet” if you are at idea stage.' },
    ],
    pitchDocs: [
      { key: 'deck', label: 'Pitch deck', hint: 'PDF, up to 20 MB', accept: 'pdf', maxMb: 20 },
    ],
    docs: [
      { key: 'ocr', label: 'Company registration certificate (OCR)', hint: 'Office of Company Registrar certificate', required: true },
      { key: 'pan', label: 'PAN / VAT certificate', hint: 'Issued by the Inland Revenue Department', required: true },
      { key: 'cit', label: 'Founder citizenship certificate', hint: 'Front and back in one file', required: true },
    ],
  },
  student: {
    fields: [
      { key: 'institution', label: 'School / college / university', required: true, span: 2 },
      { key: 'level', label: 'Current level', type: 'select', options: ['+2 / A-Levels', 'Bachelor (1st year)', 'Bachelor (2nd year)', 'Bachelor (3rd year)', 'Bachelor (final year)', 'Master', 'Recent graduate'], required: true },
      { key: 'city', label: 'City', placeholder: 'e.g. Pokhara', required: true },
      { key: 'gapYear', label: 'Did you take a gap year?', type: 'select', options: ['No', 'Yes'], required: true },
      { key: 'gapYearWhen', label: 'Which year was your gap year?', type: 'select', options: GAP_YEARS, required: true, showIf: (v) => v.gapYear === 'Yes' },
      { key: 'interests', label: 'Interests (used to match you with mentors and sessions)', type: 'chips', options: KEYWORDS, span: 2, required: true, max: 6, hint: 'Pick up to 6' },
      { key: 'goal', label: 'Your main goal', type: 'textarea', span: 2, placeholder: 'e.g. MS in Computer Science in the USA with a scholarship' },
      { key: 'portfolio', label: 'Portfolio link (optional)', type: 'url', span: 2, placeholder: 'https://…', hint: 'GitHub, Behance, a personal site or a shared Drive folder. Mentors can see it.' },
    ],
    docs: [
      { key: 'sid', label: 'Student ID card', hint: 'Photo of the front of your ID', required: true },
      { key: 'resume', label: 'Resume / CV', hint: 'PDF, JPG or PNG', required: true },
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
      { key: 'cv', label: 'CV / résumé', hint: 'PDF, JPG or PNG', required: true },
      { key: 'avatar', label: 'Profile photo (optional)', hint: 'Students will see it on your mentor profile (JPG or PNG)', accept: 'image' },
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

/* ---------- File picker (keeps the real File so it can be uploaded to Supabase Storage) ---------- */
const MAX_MB = 10
const OK_TYPES = ['application/pdf', 'image/jpeg', 'image/png']
const ACCEPTS = {
  image: { types: ['image/jpeg', 'image/png'], attr: '.jpg,.jpeg,.png,image/jpeg,image/png', msg: 'Use a JPG or PNG image.' },
  pdf: { types: ['application/pdf'], attr: '.pdf,application/pdf', msg: 'Use a PDF file.' },
  any: { types: OK_TYPES, attr: '.pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png', msg: 'Use a PDF, JPG or PNG file.' },
}

function FileUpload({ label, hint, required, file, onFile, accept, maxMb = MAX_MB }) {
  const acc = ACCEPTS[accept] || ACCEPTS.any
  const ref = useRef(null)
  const [err, setErr] = useState('')
  const pick = (e) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    if (!acc.types.includes(f.type)) { setErr(acc.msg); return }
    if (f.size > maxMb * 1024 * 1024) { setErr(`The file is larger than ${maxMb} MB.`); return }
    setErr('')
    onFile(f.name, f)
  }
  return (
    <div className="card" style={{ padding: 18, display: 'flex', gap: 16, alignItems: 'center', borderRadius: 18, borderStyle: 'dashed' }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--blue-50)', color: 'var(--blue)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
        {file ? <Check size={20} /> : <UploadIcon size={20} />}
      </div>
      <div className="grow">
        <div className="bold small">{label} {required && <span className="req">*</span>}</div>
        <div className="xs muted">{file ? file : hint}</div>
        {err && <div className="xs mt-1" style={{ color: '#dc2626' }}>{err}</div>}
      </div>
      <input ref={ref} type="file" accept={acc.attr} onChange={pick} style={{ display: 'none' }} />
      <button type="button" className="btn btn-soft btn-sm" onClick={() => ref.current?.click()}>{file ? 'Replace' : 'Upload'}</button>
    </div>
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
const STARTUP_STEPS = ['Account', 'Profile', 'Pitch', 'Verification', 'Review']

export function Register() {
  const { role } = useParams()
  const cfg = FORMS[role]
  const stepNames = role === 'startup' ? STARTUP_STEPS : STEP_NAMES
  const r = ROLES[role]
  const { register } = useStore()
  const nav = useNavigate()
  const [step, setStep] = useState(0)
  const [acc, setAcc] = useState({ name: '', email: '', phone: '', password: '', confirm: '', agree: false })
  const [vals, setVals] = useState({})
  const [docs, setDocs] = useState({}) // key -> file name (shown in the UI)
  const [files, setFiles] = useState({}) // key -> real File (uploaded on submit)
  const [errors, setErrors] = useState({})
  const [showPw, setShowPw] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [execs, setExecs] = useState([{ name: '', role: '', bio: '', linkedin: '' }]) // startup: executive team
  const [funds, setFunds] = useState([{ label: '', pct: '' }]) // startup: use of funds

  if (!cfg) return <Navigate to="/register" replace />
  const stepKey = stepNames[step]
  const visibleFields = (list = []) => list.filter((f) => !f.showIf || f.showIf(vals))
  const fundsTotal = funds.reduce((a, r) => a + (Number(r.pct) || 0), 0)

  const validate = () => {
    const e = {}
    if (step === 0) {
      if (acc.name.trim().length < 3) e.name = 'Enter your full name'
      if (!/^\S+@\S+\.\S+$/.test(acc.email)) e.email = 'Enter a valid email'
      if (!checkPassword(acc.password).ok) e.password = 'Use 8+ characters with upper and lower case, a number and a symbol'
      if (acc.confirm !== acc.password) e.confirm = 'Passwords do not match'
      if (!acc.agree) e.agree = 'Please accept to continue'
    }
    if (step === 1) cfg.fields.filter((f) => !f.showIf || f.showIf(vals)).forEach((f) => {
      const v = vals[f.key]
      if (f.type === 'url' && v && !/^https?:\/\/\S+$/i.test(String(v).trim())) e[f.key] = 'Enter a full link starting with https://'
      if (f.required && (v === undefined || (typeof v === 'string' && !v.trim()) || (Array.isArray(v) && !v.length))) e[f.key] = 'Required'
    })
    if (stepKey === 'Pitch') {
      visibleFields(cfg.pitch).forEach((f) => { if (f.required && !String(vals[f.key] ?? '').trim()) e[f.key] = 'Required' })
      visibleFields(cfg.pitch).forEach((f) => { if (f.type === 'url' && vals[f.key] && !/^https?:\/\/\S+$/i.test(String(vals[f.key]).trim())) e[f.key] = 'Enter a full link starting with https://' })
      execs.forEach((m, i) => {
        if (!m.name.trim() || !m.role.trim() || !m.bio.trim()) e['exec-' + i] = 'Name, role and bio are required'
        else if (!/^https?:\/\/([\w-]+\.)*linkedin\.com\/\S+/i.test(m.linkedin.trim())) e['exec-' + i] = 'Add a valid LinkedIn profile link (https://linkedin.com/in/…)'
      })
      if (funds.some((r) => !r.label.trim() || !(Number(r.pct) > 0))) e.funds = 'Give every row a use and a percentage'
      else if (fundsTotal !== 100) e.funds = `Percentages must add up to 100 (now ${fundsTotal})`
    }
    if (stepKey === 'Verification') cfg.docs.forEach((d) => { if (d.required && !docs[d.key]) e['doc-' + d.key] = 'Required' })
    setErrors(e)
    return !Object.keys(e).length
  }

  const next = () => {
    if (!validate()) return
    if (stepKey === 'Profile' && role === 'startup') setExecs((p) => (p[0].name ? p : [{ ...p[0], name: acc.name.trim() }, ...p.slice(1)]))
    setStep((s) => s + 1)
  }

  const profileSummary = () => {
    const out = {}
    visibleFields([...cfg.fields, ...(cfg.pitch || [])]).forEach((f) => {
      const v = vals[f.key]
      if (v === undefined || v === '') return
      out[f.label.replace(/ \(.*\)$/, '')] = Array.isArray(v) ? v.join(', ') : typeof v === 'boolean' ? (v ? 'Yes' : 'No') : String(v)
    })
    if (role === 'startup') {
      out['Executive team'] = execs.map((m) => `${m.name} (${m.role})`).join(', ')
      out['Use of funds'] = funds.map((r) => `${r.label} ${r.pct}%`).join(', ')
    }
    return out
  }

  // What gets saved. For startups, derive the fields the listing already uses (tagline, problem, model, use of funds).
  const rawData = () => {
    if (role !== 'startup') return vals
    const { model, modelOther, ...rest } = vals
    return {
      ...rest,
      problem: vals.problemLine,
      tagline: (vals.solution || '').trim().split(/(?<=[.!?])\s/)[0].slice(0, 140),
      model: model === 'Other' ? modelOther : model,
      execs: execs.map((m) => ({ name: m.name.trim(), role: m.role.trim(), bio: m.bio.trim(), linkedin: m.linkedin.trim() })),
      useOfFunds: funds.map((r) => ({ label: r.label.trim(), pct: Number(r.pct) })),
    }
  }
  const fileLabel = (key) => cfg.docs.find((d) => d.key === key)?.label || cfg.pitchDocs?.find((d) => d.key === key)?.label
    || (key.startsWith('execphoto-') ? 'Executive photo: ' + (execs[Number(key.split('-')[1])]?.name || '') : key)
  const setFile = (key) => (name, file) => { setDocs((p) => ({ ...p, [key]: name })); setFiles((p) => ({ ...p, [key]: file })) }
  const setExec = (i, k, v) => setExecs((p) => p.map((m, j) => (j === i ? { ...m, [k]: v } : m)))
  const removeLastExec = () => {
    const key = 'execphoto-' + (execs.length - 1)
    setExecs((p) => p.slice(0, -1))
    setDocs((p) => { const n = { ...p }; delete n[key]; return n })
    setFiles((p) => { const n = { ...p }; delete n[key]; return n })
  }

  const submit = async () => {
    setSubmitting(true)
    const res = await register({
      role, name: acc.name.trim(), email: acc.email.trim(), password: acc.password,
      profile: { Phone: acc.phone, ...profileSummary() }, raw: rawData(), docs: Object.values(docs),
      files: Object.entries(files).map(([key, file]) => ({ key, file, label: fileLabel(key) })),
    })
    setSubmitting(false)
    if (res.error) { setErrors({ email: res.error }); setStep(0); return }
    nav('/pending')
  }

  const setA = (k) => (e) => { const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value; setAcc((a) => ({ ...a, [k]: v })) }

  const suggestPassword = () => {
    const g = generatePassword()
    setAcc((a) => ({ ...a, password: g, confirm: g }))
    setShowPw(true) // show it so the user can see and save what was generated
    setErrors((x) => ({ ...x, password: undefined, confirm: undefined }))
  }

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
          {stepNames.map((n, i) => (
            <div key={n} className="row" style={{ gap: 8 }}>
              <div className={`s ${i === step ? 'active' : i < step ? 'done' : ''}`}><span className="n">{i < step ? <Check size={13} /> : i + 1}</span>{n}</div>
              {i < stepNames.length - 1 && <span className="bar" />}
            </div>
          ))}
        </div>

        {step === 0 && (
          <>
            <h1 style={{ fontSize: 32 }}>Create your {r.label.toLowerCase()} account</h1>


            <p className="muted mt-2">This is the person who will manage the account{role === 'startup' ? ' for your startup' : ''}.</p>

            <div className="grid-2 mt-6">
              <div className="field span-2"><label>Full name <span className="req">*</span></label><input className={`input ${errors.name ? 'invalid' : ''}`} value={acc.name} onChange={setA('name')} placeholder="As on your ID" />{errors.name && <span className="err">{errors.name}</span>}</div>
              <div className="field"><label>Email <span className="req">*</span></label><input className={`input ${errors.email ? 'invalid' : ''}`} value={acc.email} onChange={setA('email')} placeholder="you@example.com" />{errors.email && <span className="err">{errors.email}</span>}</div>
              <div className="field"><label>Phone</label><input className="input" value={acc.phone} onChange={setA('phone')} placeholder="+977 98XXXXXXXX" /></div>
              <div className="field"><label>Password <span className="req">*</span></label>
                <div style={{ position: 'relative' }}>
                  <input type={showPw ? 'text' : 'password'} className={`input ${errors.password ? 'invalid' : ''}`} value={acc.password} onChange={setA('password')} autoComplete="new-password" />
                  <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 10, top: 11, border: 0, background: 'none', color: 'var(--faint)' }} aria-label="Show password">{showPw ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                </div>
                {errors.password && <span className="err">{errors.password}</span>}
              </div>
              <div className="field"><label>Confirm password <span className="req">*</span></label>
                <input type={showPw ? 'text' : 'password'} className={`input ${errors.confirm ? 'invalid' : ''}`} value={acc.confirm} onChange={setA('confirm')} autoComplete="new-password" />
                {errors.confirm
                  ? <span className="err">{errors.confirm}</span>
                  : acc.confirm && acc.confirm !== acc.password
                    ? <span className="err">Passwords do not match</span>
                    : acc.confirm && <span className="hint" style={{ color: 'var(--green)' }}>Passwords match</span>}
              </div>
              <div className="span-2">
                <PasswordStrength value={acc.password} />
                <button type="button" className="btn btn-soft btn-sm mt-3" onClick={suggestPassword}><Sparkles size={14} /> Suggest a strong password</button>
              </div>
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
              {visibleFields(cfg.fields).map((f) => <Field key={f.key} f={f} value={vals[f.key]} error={errors[f.key]} onChange={(v) => setVals((p) => ({ ...p, [f.key]: v }))} />)}
            </div>
          </>
        )}

        {stepKey === 'Pitch' && (
          <>
            <h1 style={{ fontSize: 32 }}>Your pitch</h1>
            <p className="muted mt-2">This is what investors read first. Be clear and specific.</p>
            <div className="grid-2 mt-6">
              {visibleFields(cfg.pitch).map((f) => <Field key={f.key} f={f} value={vals[f.key]} error={errors[f.key]} onChange={(v) => setVals((p) => ({ ...p, [f.key]: v }))} />)}
            </div>
            <div className="stack mt-4">
              {cfg.pitchDocs.map((d) => <FileUpload key={d.key} label={d.label} hint={d.hint} accept={d.accept} maxMb={d.maxMb} file={docs[d.key]} onFile={setFile(d.key)} />)}
            </div>

            <h3 className="mt-8" style={{ fontSize: 22 }}>Executive team</h3>
            <p className="small muted mt-1">Add the people investors will be backing. Photo is optional.</p>
            <div className="stack mt-4">
              {execs.map((m, i) => (
                <div key={i} className="card card-pad stack" style={{ gap: 12 }}>
                  <div className="row-between">
                    <b className="small">{i === 0 ? 'Executive 1 (you)' : 'Executive ' + (i + 1)}</b>
                    {i > 0 && i === execs.length - 1 && <button type="button" className="btn btn-ghost btn-sm" onClick={removeLastExec}><X size={14} /> Remove</button>}
                  </div>
                  <div className="grid-2">
                    <div className="field"><label>Full name <span className="req">*</span></label><input className="input" value={m.name} onChange={(e) => setExec(i, 'name', e.target.value)} /></div>
                    <div className="field"><label>Role <span className="req">*</span></label><input className="input" value={m.role} onChange={(e) => setExec(i, 'role', e.target.value)} placeholder="e.g. CEO, CTO" /></div>
                    <div className="field span-2"><label>LinkedIn profile <span className="req">*</span></label><input className="input" type="url" value={m.linkedin} onChange={(e) => setExec(i, 'linkedin', e.target.value)} placeholder="https://linkedin.com/in/…" /></div>
                    <div className="field span-2"><label>Short bio <span className="req">*</span></label><textarea className="textarea" value={m.bio} onChange={(e) => setExec(i, 'bio', e.target.value)} placeholder="Background and relevant experience" /></div>
                  </div>
                  <FileUpload label="Photo" hint="A clear photo (JPG or PNG)" accept="image" file={docs['execphoto-' + i]} onFile={setFile('execphoto-' + i)} />
                  {errors['exec-' + i] && <span className="err">{errors['exec-' + i]}</span>}
                </div>
              ))}
            </div>
            {execs.length < 4 && <button type="button" className="btn btn-soft btn-sm mt-3" onClick={() => setExecs((p) => [...p, { name: '', role: '', bio: '', linkedin: '' }])}><Plus size={14} /> Add another executive</button>}

            <h3 className="mt-8" style={{ fontSize: 22 }}>Use of funds</h3>
            <p className="small muted mt-1">Where will the money you raise go? Percentages must add up to 100.</p>
            <div className="stack mt-4" style={{ gap: 10 }}>
              {funds.map((r, i) => (
                <div key={i} className="row" style={{ gap: 10 }}>
                  <input className="input grow" value={r.label} placeholder="e.g. Product development" onChange={(e) => setFunds((p) => p.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
                  <input className="input" style={{ width: 100 }} type="number" min="1" max="100" value={r.pct} placeholder="%" onChange={(e) => setFunds((p) => p.map((x, j) => (j === i ? { ...x, pct: e.target.value } : x)))} />
                  <button type="button" className="icon-btn" aria-label="Remove row" disabled={funds.length === 1} onClick={() => setFunds((p) => p.filter((_, j) => j !== i))}><X size={16} /></button>
                </div>
              ))}
            </div>
            <div className="row-between mt-3">
              <button type="button" className="btn btn-soft btn-sm" onClick={() => setFunds((p) => [...p, { label: '', pct: '' }])}><Plus size={14} /> Add row</button>
              <span className="small" style={{ color: fundsTotal === 100 ? 'var(--green)' : 'var(--muted)' }}>Total: <b>{fundsTotal}%</b></span>
            </div>
            {errors.funds && <span className="err">{errors.funds}</span>}
          </>
        )}

        {stepKey === 'Verification' && (
          <>
            <h1 style={{ fontSize: 32 }}>Verification documents</h1>
            <p className="muted mt-2">Only Aakar admins can see these. They are used to verify your {role === 'startup' ? 'company' : 'identity'} and are never shown publicly.</p>
            <div className="stack mt-6">
              {cfg.docs.map((d) => (
                <div key={d.key}>
                  <FileUpload label={d.label} hint={d.hint} required={d.required} file={docs[d.key]} accept={d.accept} onFile={(name, file) => { setDocs((p) => ({ ...p, [d.key]: name })); setFiles((p) => ({ ...p, [d.key]: file })) }} />
                  {errors['doc-' + d.key] && <span className="err">Please upload this document</span>}
                </div>
              ))}
            </div>
            <div className="card mt-6" style={{ padding: 16, background: 'var(--blue-50)', borderColor: 'var(--primary-100)', display: 'flex', gap: 12 }}>
              <Lock size={18} color="var(--blue)" style={{ flexShrink: 0, marginTop: 2 }} />
              <div className="small">Your files are used for verification only. Use clear photos or PDF scans.</div>
            </div>
          </>
        )}

        {stepKey === 'Review' && (
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
          {step < stepNames.length - 1
            ? <button className="btn btn-primary btn-lg" onClick={next}>Continue <ArrowRight size={18} /></button>
            : <button className="btn btn-primary btn-lg" onClick={submit} disabled={submitting}>{submitting ? <><Loader2 size={18} className="spin" /> Submitting…</> : <>Submit for verification <ShieldCheck size={18} /></>}</button>}
        </div>
      </div>
    </AuthLayout>
  )
}

/* ---------- Login with verification check ---------- */
export function Login() {
  const { login, setCurrent } = useStore()
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(null) // { user, stage }

  const run = async (e, em = email, p = pw) => {
    e?.preventDefault()
    setError('')
    const res = await login(em, p)
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
            <p className="muted mt-2">Investors, founders, students, and professionals all sign in here.</p>
            <form onSubmit={run} className="stack mt-6" style={{ gap: 16 }}>
              <div className="field"><label>Email</label><div className="input-icon"><Mail size={17} /><input className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="username" /></div></div>
              <div className="field"><label>Password</label><div className="input-icon"><Lock size={17} /><input type="password" className="input" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="••••••••" autoComplete="current-password" /></div></div>
              {error && <div className="err" style={{ fontSize: 13 }}>{error}</div>}

              <div style={{ textAlign: 'right', marginTop: 8 }}>
                <Link to="/forgot-password" className="small link">Forgot password?</Link>
              </div>
              <button className="btn btn-primary btn-lg btn-block" type="submit">Log in <ArrowRight size={18} /></button>
            </form>
            <div className="mt-8">
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
      { t: 'Documents received', s: `${user.docs?.length || 0} files submitted`, state: 'done' },
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
            : user.status === 'rejected' ? <>Reason: <b style={{ color: 'var(--ink)' }}>{user.rejectReason || 'Documents could not be verified.'}</b> To send a new application, register again with the same email and password.</>
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
          {DEMO_ENABLED && user.status === 'pending' && (
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