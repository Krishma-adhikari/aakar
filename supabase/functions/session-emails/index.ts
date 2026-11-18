// @ts-nocheck
import { createClient } from 'jsr:@supabase/supabase-js@2'

// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected automatically into every Edge Function.
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
// These three you set yourself with `supabase secrets set`.
const WEBHOOK_SECRET = Deno.env.get('WEBHOOK_SECRET')!
const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY')!
const SENDER_EMAIL = Deno.env.get('BREVO_SENDER_EMAIL')!
const SENDER_NAME = Deno.env.get('BREVO_SENDER_NAME') ?? 'Aakar'

const db = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })

/* ---------- small helpers ---------- */

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

// Constant-time string compare for the shared secret.
function safeEqual(a: string, b: string) {
  const ea = new TextEncoder().encode(a)
  const eb = new TextEncoder().encode(b)
  if (ea.length !== eb.length) return false
  let diff = 0
  for (let i = 0; i < ea.length; i++) diff |= ea[i] ^ eb[i]
  return diff === 0
}

// Escape everything user-provided before it goes into HTML.
const esc = (v: unknown) =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

// Header-safe single line (subject).
const oneLine = (v: unknown) => String(v ?? '').replace(/[\r\n]+/g, ' ').trim()

const LINK_HOSTS = ['zoom.us', 'meet.google.com', 'teams.microsoft.com', 'teams.live.com']

// Second line of defence: only ever put a valid https Zoom/Meet/Teams URL into an email.
function safeLink(raw?: string | null): string | null {
  if (!raw) return null
  try {
    const u = new URL(raw)
    if (u.protocol !== 'https:' || u.username || u.password) return null
    const h = u.hostname.toLowerCase()
    return LINK_HOSTS.some((d) => h === d || h.endsWith('.' + d)) ? u.toString() : null
  } catch {
    return null
  }
}

const PAY_LABEL: Record<string, string> = { esewa: 'eSewa', khalti: 'Khalti', imepay: 'IME Pay', bank: 'Bank transfer' }

// Nepal time (UTC+05:45), always labelled NPT whatever the server timezone is.
function nptWhen(iso: string) {
  const d = new Date(iso)
  const day = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kathmandu', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(d)
  const time = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kathmandu', hour: 'numeric', minute: '2-digit', hour12: true }).format(d)
  return `${day}, ${time.toUpperCase()} NPT`
}

/* ---------- email content ---------- */

type Kind = 'registered_free' | 'registered_paid' | 'link' | 'reminder'

// deno-lint-ignore no-explicit-any
function buildEmail(kind: Kind, c: { session: any; hostName: string; studentName: string; link: string | null }) {
  const { session: s, hostName, studentName, link } = c
  const first = (studentName || 'there').split(' ')[0]

  const rows: [string, string][] = [
    ['Session', s.title],
    ['Mentor', hostName],
    ['When', nptWhen(s.starts_at)],
    ['Duration', `${s.duration_min} minutes`],
    ['Platform', s.platform],
  ]
  if (kind === 'registered_paid') rows.push(['Price', `NPR ${s.price_npr}`])

  let subject = ''
  let heading = ''
  let intro = ''
  let payHtml = ''
  let payText = ''
  const showButton = !!link && kind !== 'registered_paid'

  if (kind === 'registered_free') {
    subject = `You’re in: ${s.title}`
    heading = 'Your seat is reserved'
    intro = link
      ? 'You’re registered. Here are the details and your link to join.'
      : 'You’re registered. The mentor hasn’t added the meeting link yet. We’ll email it to you as soon as it’s ready.'
  } else if (kind === 'registered_paid') {
    const method = PAY_LABEL[s.pay_method] || s.pay_method || 'the mentor'
    subject = `Seat reserved: ${s.title}`
    heading = 'Your seat is reserved'
    intro = 'To confirm your seat, pay the mentor directly:'
    payHtml =
      `<div style="background:#f6f3ee;border-radius:10px;padding:14px 16px;margin:16px 0">` +
      `<div style="font-weight:600">Pay NPR ${esc(s.price_npr)} via ${esc(method)}</div>` +
      `<div style="font-size:18px;margin-top:4px">${esc(s.pay_account)}</div>` +
      `<div style="color:#666;font-size:13px;margin-top:8px">After paying, open Aakar and tap “I’ve paid”. We’ll email you the meeting link as soon as the mentor confirms your payment.</div>` +
      `</div>`
    payText = `\nPay NPR ${s.price_npr} via ${method}: ${s.pay_account}\nAfter paying, open Aakar and tap "I've paid". We'll email you the meeting link as soon as the mentor confirms your payment.\n`
  } else if (kind === 'link') {
    subject = `Your link for ${s.title}`
    heading = 'Your meeting link is ready'
    intro = 'Here is your link to join the session.'
  } else {
    subject = `Starting soon: ${s.title}`
    heading = 'Your session starts in about an hour'
    intro = link ? 'Use the button below to join.' : 'The mentor hasn’t added the meeting link yet. We’ll email it as soon as it’s ready.'
  }

  const detailRows = rows
    .map(([k, v]) => `<tr><td style="padding:6px 16px 6px 0;color:#666;font-size:14px;vertical-align:top;white-space:nowrap">${esc(k)}</td><td style="padding:6px 0;font-size:15px;font-weight:600">${esc(v)}</td></tr>`)
    .join('')

  const button = showButton
    ? `<div style="text-align:center;margin:28px 0 8px">` +
      `<a href="${esc(link)}" target="_blank" rel="noopener noreferrer" style="display:inline-block;background:#1b2340;color:#ffffff;text-decoration:none;font-weight:700;font-size:18px;padding:16px 40px;border-radius:12px">Join session</a>` +
      `</div>` +
      `<p style="text-align:center;color:#666;font-size:12px;margin:8px 0 0">Button not working? Copy this link into your browser:<br>${esc(link)}</p>`
    : ''

  const html =
    `<!doctype html><html><body style="margin:0;background:#f3f1ec;font-family:Arial,Helvetica,sans-serif;color:#1b2340">` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">` +
    `<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px">` +
    `<tr><td style="padding:32px">` +
    `<div style="font-size:14px;color:#666">Hi ${esc(first)},</div>` +
    `<h1 style="font-size:24px;margin:8px 0 12px">${esc(heading)}</h1>` +
    `<p style="font-size:15px;line-height:1.5;margin:0 0 16px">${esc(intro)}</p>` +
    payHtml +
    `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0">${detailRows}</table>` +
    button +
    `<hr style="border:none;border-top:1px solid #eee;margin:28px 0 16px">` +
    `<p style="font-size:12px;color:#888;line-height:1.5;margin:0">Sent by Aakar. You got this email because you registered for a session on Aakar. The meeting link is for you, so please don’t share it.</p>` +
    `</td></tr></table></td></tr></table></body></html>`

  const text =
    `Hi ${first},\n\n${heading}\n${intro}\n${payText}\n` +
    rows.map(([k, v]) => `${k}: ${v}`).join('\n') +
    (showButton ? `\n\nJoin session: ${link}` : '') +
    `\n\n--\nSent by Aakar. You got this email because you registered for a session on Aakar. The meeting link is for you, so please don't share it.\n`

  return { subject: oneLine(subject), html, text }
}

async function sendMail(to: string, toName: string, mail: { subject: string; html: string; text: string }) {
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': BREVO_API_KEY, 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({
      sender: { name: SENDER_NAME, email: SENDER_EMAIL },
      to: [{ email: to, name: oneLine(toName) || undefined }],
      subject: mail.subject,
      htmlContent: mail.html,
      textContent: mail.text,
    }),
  })
  // Status only. Never log the address, the body or the link.
  if (!res.ok) throw new Error(`Brevo responded ${res.status}`)
}

/* ---------- data + idempotent claiming ---------- */

type Col = 'email_registered_at' | 'email_link_at' | 'email_reminder_at'

async function loadCtx(sid: string, stid: string) {
  const [{ data: session }, { data: reg }, { data: student }, { data: priv }] = await Promise.all([
    db.from('sessions').select('*').eq('id', sid).maybeSingle(),
    db.from('session_registrations').select('*').eq('session_id', sid).eq('student_id', stid).maybeSingle(),
    db.from('profiles').select('full_name, email').eq('id', stid).maybeSingle(),
    db.from('session_private').select('meeting_link').eq('session_id', sid).maybeSingle(),
  ])
  if (!session || !reg || !student?.email) return null
  const { data: host } = await db.from('profiles').select('full_name').eq('id', session.host_id).maybeSingle()
  return {
    session,
    reg,
    studentEmail: student.email as string,
    studentName: (student.full_name as string) || '',
    hostName: (host?.full_name as string) || 'Your mentor',
    link: safeLink(priv?.meeting_link),
  }
}

// Set the column only if it is still empty. Returns true for exactly ONE caller, even if
// the webhook is delivered twice at the same moment.
async function claim(col: Col, sid: string, stid: string, extra: Partial<Record<Col, string>> = {}) {
  const now = new Date().toISOString()
  const { data, error } = await db
    .from('session_registrations')
    .update({ [col]: now, ...extra })
    .eq('session_id', sid)
    .eq('student_id', stid)
    .is(col, null)
    .select('session_id')
  if (error) throw error
  return (data?.length ?? 0) > 0
}

// If sending fails, give the claim back so a later event can try again.
async function unclaim(cols: Col[], sid: string, stid: string) {
  await db
    .from('session_registrations')
    .update(Object.fromEntries(cols.map((c) => [c, null])))
    .eq('session_id', sid)
    .eq('student_id', stid)
}

const linkEligible = (c: NonNullable<Awaited<ReturnType<typeof loadCtx>>>) =>
  !c.session.is_paid || c.reg.pay_status === 'confirmed'

/* ---------- the three jobs ---------- */

// One registration: send "registered" once, then "link" once when the student is allowed to have it.
async function processRegistration(sid: string, stid: string): Promise<number> {
  let sent = 0
  const a = await loadCtx(sid, stid)
  if (!a) return 0

  // Step A: the first email after registering.
  if (!a.reg.email_registered_at) {
    const free = !a.session.is_paid
    const withLink = free && !!a.link
    const extra = withLink ? { email_link_at: new Date().toISOString() } : {}
    if (await claim('email_registered_at', sid, stid, extra)) {
      try {
        const mail = buildEmail(free ? 'registered_free' : 'registered_paid', { session: a.session, hostName: a.hostName, studentName: a.studentName, link: withLink ? a.link : null })
        await sendMail(a.studentEmail, a.studentName, mail)
        sent++
      } catch (e) {
        await unclaim(withLink ? ['email_registered_at', 'email_link_at'] : ['email_registered_at'], sid, stid)
        throw e
      }
    }
  }

  // Step B: the link email (after payment is confirmed, or when the host adds the link later).
  const b = await loadCtx(sid, stid)
  if (b && b.reg.email_registered_at && !b.reg.email_link_at && b.link && linkEligible(b)) {
    if (await claim('email_link_at', sid, stid)) {
      try {
        await sendMail(b.studentEmail, b.studentName, buildEmail('link', { session: b.session, hostName: b.hostName, studentName: b.studentName, link: b.link }))
        sent++
      } catch (e) {
        await unclaim(['email_link_at'], sid, stid)
        throw e
      }
    }
  }
  return sent
}

// The host added or changed a link: send it to everyone who is allowed and has not had it yet.
async function processSession(sid: string): Promise<number> {
  const { data: regs } = await db
    .from('session_registrations')
    .select('student_id')
    .eq('session_id', sid)
    .not('email_registered_at', 'is', null)
    .is('email_link_at', null)
  let sent = 0
  for (const r of regs ?? []) sent += await processRegistration(sid, r.student_id)
  return sent
}

// Optional: reminder about an hour before the start, once per registration.
async function runReminders(): Promise<number> {
  const now = new Date()
  const soon = new Date(now.getTime() + 65 * 60 * 1000)
  const { data: sessions } = await db.from('sessions').select('id').gt('starts_at', now.toISOString()).lte('starts_at', soon.toISOString())
  let sent = 0
  for (const s of sessions ?? []) {
    const { data: regs } = await db.from('session_registrations').select('student_id').eq('session_id', s.id).is('email_reminder_at', null)
    for (const r of regs ?? []) {
      const c = await loadCtx(s.id, r.student_id)
      if (!c || !linkEligible(c)) continue
      if (!(await claim('email_reminder_at', s.id, r.student_id))) continue
      try {
        await sendMail(c.studentEmail, c.studentName, buildEmail('reminder', { session: c.session, hostName: c.hostName, studentName: c.studentName, link: c.link }))
        sent++
      } catch (e) {
        await unclaim(['email_reminder_at'], s.id, r.student_id)
        throw e
      }
    }
  }
  return sent
}

/* ---------- entry point ---------- */

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405)
  if (!WEBHOOK_SECRET || !safeEqual(req.headers.get('x-webhook-secret') ?? '', WEBHOOK_SECRET)) {
    return json({ error: 'unauthorized' }, 401)
  }

  let body: any // deno-lint-ignore no-explicit-any
  try {
    body = await req.json()
  } catch {
    return json({ error: 'bad json' }, 400)
  }

  try {
    let sent = 0
    const isWrite = body?.type === 'INSERT' || body?.type === 'UPDATE'

    if (body?.type === 'REMINDER_TICK') {
      sent = await runReminders()
    } else if (isWrite && body.table === 'session_registrations' && body.record?.session_id && body.record?.student_id) {
      sent = await processRegistration(body.record.session_id, body.record.student_id)
    } else if (isWrite && body.table === 'session_private' && body.record?.session_id) {
      sent = await processSession(body.record.session_id)
    } else {
      return json({ ignored: true })
    }
    return json({ ok: true, sent })
  } catch (e) {
    console.error('session-emails failed:', e instanceof Error ? e.message : 'unknown error')
    return json({ error: 'failed' }, 500)
  }
})