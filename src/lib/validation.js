// Pure helpers (no React, no Supabase) so they can be unit-tested.

/* ---------- Meeting link validation ---------- */

// Only https links on these sites are accepted (the database enforces the same rule).
export const LINK_HOSTS = ['zoom.us', 'meet.google.com', 'teams.microsoft.com', 'teams.live.com']

// Returns { ok: true, url } (url is '' when the box is empty) or { ok: false, error }.
export function validateMeetingLink(raw) {
  const v = (raw || '').trim()
  if (!v) return { ok: true, url: '' }
  let u
  try { u = new URL(v) } catch { return { ok: false, error: 'That doesn’t look like a link. Paste the full address, starting with https://' } }
  if (u.protocol !== 'https:') return { ok: false, error: 'The link must start with https://' }
  if (u.username || u.password) return { ok: false, error: 'This link is not allowed. Paste the plain meeting link.' }
  const h = u.hostname.toLowerCase()
  if (!LINK_HOSTS.some((d) => h === d || h.endsWith('.' + d))) {
    return { ok: false, error: 'Only Zoom, Google Meet or Microsoft Teams links are accepted (zoom.us, meet.google.com, teams.microsoft.com, teams.live.com).' }
  }
  return { ok: true, url: u.toString() }
}

/* ---------- Prize ---------- */

// A prize is a positive whole number, otherwise there is no prize.
export const normPrize = (v) => {
  const n = Number(v)
  return Number.isInteger(n) && n > 0 ? n : null
}

/* ---------- Password strength ---------- */

export function checkPassword(pw = '') {
  const rules = [
    ['At least 8 characters', pw.length >= 8],
    ['An uppercase letter', /[A-Z]/.test(pw)],
    ['A lowercase letter', /[a-z]/.test(pw)],
    ['A number', /\d/.test(pw)],
    ['A symbol (! @ # $ …)', /[^A-Za-z0-9]/.test(pw)],
  ]
  const passed = rules.filter(([, ok]) => ok).length
  const common = /^(password|12345678|123456789|qwerty|abc123|letmein|iloveyou)/i.test(pw) || /^(.)\1+$/.test(pw)
  const score = common ? Math.min(passed, 2) : passed + (pw.length >= 12 ? 1 : 0)
  const level = !pw ? 0 : score <= 2 ? 1 : score <= 4 ? 2 : score === 5 ? 3 : 4
  return { rules, level, label: ['', 'Weak', 'Fair', 'Good', 'Strong'][level], ok: passed === rules.length && !common }
}
