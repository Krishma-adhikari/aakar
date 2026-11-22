import { describe, expect, it } from 'vitest'
import { checkPassword, normPrize, validateMeetingLink } from './validation'

describe('validateMeetingLink', () => {
  it('accepts an empty box', () => {
    expect(validateMeetingLink('')).toEqual({ ok: true, url: '' })
    expect(validateMeetingLink(undefined)).toEqual({ ok: true, url: '' })
  })
  it('accepts Zoom, Meet and Teams over https', () => {
    expect(validateMeetingLink('https://meet.google.com/abc-defg-hij').ok).toBe(true)
    expect(validateMeetingLink('https://us02web.zoom.us/j/123').ok).toBe(true)
    expect(validateMeetingLink('https://teams.microsoft.com/l/meetup-join/x').ok).toBe(true)
  })
  it('rejects http, other sites, look-alike hosts and embedded credentials', () => {
    expect(validateMeetingLink('http://zoom.us/j/1').ok).toBe(false)
    expect(validateMeetingLink('https://evil.com/zoom.us').ok).toBe(false)
    expect(validateMeetingLink('https://zoom.us.evil.com/j/1').ok).toBe(false)
    expect(validateMeetingLink('https://user:pw@zoom.us/j/1').ok).toBe(false)
    expect(validateMeetingLink('not a link').ok).toBe(false)
  })
})

describe('normPrize', () => {
  it('keeps positive whole numbers only', () => {
    expect(normPrize('5000')).toBe(5000)
    expect(normPrize(0)).toBe(null)
    expect(normPrize(-5)).toBe(null)
    expect(normPrize(2.5)).toBe(null)
    expect(normPrize('')).toBe(null)
    expect(normPrize('abc')).toBe(null)
  })
})

describe('checkPassword', () => {
  it('needs all five rules', () => {
    expect(checkPassword('Abcdef1!').ok).toBe(true)
    expect(checkPassword('abcdef1!').ok).toBe(false)
    expect(checkPassword('Short1!').ok).toBe(false)
  })
  it('flags common passwords even if they pass the rules', () => {
    expect(checkPassword('Password1!').ok).toBe(false)
  })
})
