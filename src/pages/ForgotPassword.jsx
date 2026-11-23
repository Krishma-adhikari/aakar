import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useStore } from '../store'

const wrap = { maxWidth: 550, margin: '0 auto', padding: '96px 20px' }

//  the person enters their email and Supabase sends a reset link.
export function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [err, setErr] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setErr('')
    setBusy(true)
    try {
      const redirectTo = window.location.origin + import.meta.env.BASE_URL + 'reset-password'
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), { redirectTo })
      if (error) setErr(error.message)
      else setSent(true)
    } catch {
      setErr('Could not reach the server. Try again.')
    }
    setBusy(false)
  }

  return (
    <div style={wrap}>
      <h1>Forgot password?</h1>
      {sent ? (
        <>
          <p className="muted mt-2">If an account exists for <b>{email}</b>, we’ve sent a link to reset your password. Check your inbox and spam folder.</p>
          <Link to="/login" className="btn btn-primary mt-4">Back to log in</Link>
        </>
      ) : (
        <form onSubmit={submit}>
          <p className="muted mt-2">Enter your email and we’ll send you a link to set a new password.</p>
          <label className="small bold" style={{ display: 'block', marginTop: 20 }}>Email</label>
          <input className="input mt-2" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          {err && <div className="xs mt-2" style={{ color: '#dc2626' }}>{err}</div>}
          <button type="submit" className="btn btn-primary btn-block mt-4" disabled={!email.trim() || busy}>{busy ? 'Sending…' : 'Send reset link'}</button>
          <div className="small mt-4"><Link to="/login" className="link">Back to log in</Link></div>
        </form>
      )}
    </div>
  )
}

// the email link brings the person here, signed in temporarily, to choose a new password.
export function ResetPassword() {
  const { toast } = useStore()
  const nav = useNavigate()
  const [ready, setReady] = useState(false)
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { if (data.session) setReady(true) })
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') setReady(true)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    if (pw.length < 8) { setErr('Use at least 8 characters.'); return }
    if (pw !== pw2) { setErr('The two passwords do not match.'); return }
    setErr('')
    setBusy(true)
    const { error } = await supabase.auth.updateUser({ password: pw })
    if (error) { setErr(error.message); setBusy(false); return }
    await supabase.auth.signOut().catch(() => { })
    toast('Password updated. Log in with your new password.')
    nav('/login', { replace: true })
  }

  return (
    <div style={wrap}>
      <h1>Set a new password</h1>
      {!ready ? (
        <>
          <p className="muted mt-2">This reset link is invalid or has expired. Request a new one.</p>
          <Link to="/forgot-password" className="btn btn-primary mt-4">Request new link</Link>
        </>
      ) : (
        <form onSubmit={submit}>
          <label className="small bold" style={{ display: 'block', marginTop: 20 }}>New password</label>
          <input className="input mt-2" type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="At least 8 characters" />
          <label className="small bold" style={{ display: 'block', marginTop: 16 }}>Confirm password</label>
          <input className="input mt-2" type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} placeholder="Repeat the password" />
          {err && <div className="xs mt-2" style={{ color: '#dc2626' }}>{err}</div>}
          <button type="submit" className="btn btn-primary btn-block mt-4" disabled={!pw || !pw2 || busy}>{busy ? 'Saving…' : 'Update password'}</button>
        </form>
      )}
    </div>
  )
}