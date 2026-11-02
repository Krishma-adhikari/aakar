import { useEffect, useRef, useState } from 'react'
import './IntroAnimation.css'

const STORAGE_KEY = 'aakar-intro-played'
const BODY_CLASS = 'aakar-intro-playing'
const FLIGHT_DELAY = 5500 // ms the intro plays before the wordmark lifts off
const FLIGHT_MS = 1400 // ms the wordmark takes to reach the navbar logo
const LETTERS = ['A', 'A', 'K', 'A', 'R']

/**
 * The intro is white (light) by default, exactly like the home page.
 * It only turns dark when the site is actually in night mode, i.e. when
 * <html data-theme="dark"> is set by your theme toggle. The visitor's
 * system setting is deliberately ignored.
 */
function detectDarkMode() {
  try {
    return document.documentElement.getAttribute('data-theme') === 'dark'
  } catch {
    return false
  }
}

/**
 * Finds the exact box of the "Aakar" text inside the navbar logo
 * (not the whole logo, which also holds the icon and the आकार text).
 */
function getLogoTextTarget(logo) {
  const walker = document.createTreeWalker(logo, NodeFilter.SHOW_TEXT)
  let node = walker.nextNode()

  while (node) {
    if (/^\s*aakar\s*$/i.test(node.textContent || '')) {
      const range = document.createRange()
      range.selectNodeContents(node)
      const rect = range.getBoundingClientRect()
      if (rect.width > 0 && node.parentElement) {
        return { rect, style: getComputedStyle(node.parentElement) }
      }
    }
    node = walker.nextNode()
  }

  return { rect: logo.getBoundingClientRect(), style: getComputedStyle(logo) }
}

export default function IntroAnimation() {
  const flyerRef = useRef(null)
  const flyRef = useRef(() => {})

  const [show, setShow] = useState(() => {
    try {
      return sessionStorage.getItem(STORAGE_KEY) !== '1'
    } catch {
      return true
    }
  })
  const [leaving, setLeaving] = useState(false)
  const [dark] = useState(detectDarkMode)

  // Clicking the navbar logo scrolls back up to the main (hero) section.
  useEffect(() => {
    const onLogoClick = (event) => {
      const target = event.target
      if (!(target instanceof Element) || !target.closest('.nav .logo')) return
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    document.addEventListener('click', onLogoClick)
    return () => document.removeEventListener('click', onLogoClick)
  }, [])

  useEffect(() => {
    if (!show) return

    // Respect the visitor's reduced-motion preference.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setShow(false)
      return
    }

    try {
      sessionStorage.setItem(STORAGE_KEY, '1')
    } catch {
      // Continue even if session storage is unavailable.
    }

    document.body.classList.add(BODY_CLASS)

    const timers = []
    let animation
    let started = false

    const later = (fn, ms) => {
      const id = window.setTimeout(fn, ms)
      timers.push(id)
      return id
    }

    const finish = () => {
      document.body.classList.remove(BODY_CLASS)
      setShow(false)
    }

    const fly = () => {
      if (started) return
      started = true
      timers.forEach(window.clearTimeout)

      const flyer = flyerRef.current
      const logo = document.querySelector('.nav .logo')

      // Background, rings and text start fading out right away.
      setLeaving(true)

      if (!flyer || !logo) {
        later(finish, 900)
        return
      }

      const { rect: target, style: targetStyle } = getLogoTextTarget(logo)
      const start = flyer.getBoundingClientRect()

      // Centre points: start (screen middle) and end (navbar logo text).
      const startX = start.left + start.width / 2
      const startY = start.top + start.height / 2
      const endX = target.left + target.width / 2
      const endY = target.top + target.height / 2

      // Work out the font size at which "AAKAR" is exactly as wide as the
      // navbar's "Aakar", so the hand-off at the end is seamless.
      const startSize = parseFloat(getComputedStyle(flyer).fontSize)
      const saved = [flyer.style.letterSpacing, flyer.style.paddingLeft]
      flyer.style.letterSpacing = '0'
      flyer.style.paddingLeft = '0'
      const capsWidthPerPx = flyer.getBoundingClientRect().width / startSize
      flyer.style.letterSpacing = saved[0]
      flyer.style.paddingLeft = saved[1]

      const targetSize = parseFloat(targetStyle.fontSize) || startSize
      const targetSpacing = parseFloat(targetStyle.letterSpacing)
      const spacingEm = Number.isFinite(targetSpacing)
        ? targetSpacing / targetSize
        : 0
      const endSize = target.width / (capsWidthPerPx + 4 * spacingEm)

      animation = flyer.animate(
        [
          {
            left: `${startX}px`,
            top: `${startY}px`,
            fontSize: `${startSize}px`,
            letterSpacing: '0.22em',
            paddingLeft: '0.22em',
            opacity: 1,
            offset: 0,
          },
          { opacity: 1, offset: 0.8 },
          {
            left: `${endX}px`,
            top: `${endY}px`,
            fontSize: `${endSize}px`,
            letterSpacing: `${spacingEm}em`,
            paddingLeft: `${spacingEm}em`,
            opacity: 0,
            offset: 1,
          },
        ],
        {
          duration: FLIGHT_MS,
          easing: 'cubic-bezier(0.7, 0, 0.2, 1)',
          fill: 'forwards',
        }
      )

      // Reveal the real navbar logo just as the wordmark lands on it.
      later(
        () => document.body.classList.remove(BODY_CLASS),
        FLIGHT_MS * 0.78
      )
      animation.onfinish = finish
    }

    flyRef.current = fly
    later(fly, FLIGHT_DELAY)

    return () => {
      timers.forEach(window.clearTimeout)
      animation?.cancel()
      document.body.classList.remove(BODY_CLASS)
    }
  }, [show])

  if (!show) return null

  const theme = dark ? 'dark' : 'light'

  return (
    <>
      <div
        className={`aakar-intro${leaving ? ' is-leaving' : ''}`}
        data-intro-theme={theme}
      >
        <div className="intro-glow intro-glow-one" />
        <div className="intro-glow intro-glow-two" />
        <div className="intro-glow intro-glow-three" />

        <div className="intro-particles" aria-hidden="true">
          {Array.from({ length: 14 }, (_, i) => (
            <span
              key={i}
              style={{
                '--i': i,
                left: `${(i * 37 + 8) % 100}%`,
                top: `${(i * 53 + 12) % 100}%`,
              }}
            />
          ))}
        </div>

        <button
          type="button"
          className="intro-skip"
          onClick={() => flyRef.current()}
        >
          Skip <span aria-hidden="true">↗</span>
        </button>

        {/* Everything below is positioned from the exact screen centre. */}
        <div className="intro-stage" aria-hidden="true">
          <div className="intro-rings">
            <span className="intro-ring ring-outer" />
            <span className="intro-ring ring-inner" />
          </div>

          <svg
            className="intro-arc"
            viewBox="0 0 200 50"
            fill="none"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="aakarArcGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" style={{ stopColor: 'var(--ai-blue)' }} />
                <stop offset="100%" style={{ stopColor: 'var(--ai-violet)' }} />
              </linearGradient>
            </defs>
            <path
              className="intro-arc-path"
              d="M2 40 Q100 -10 198 40"
              pathLength="1"
              stroke="url(#aakarArcGradient)"
            />
            <circle className="intro-arc-dot" r="3.5">
              <animateMotion
                dur="3s"
                begin="3.8s"
                repeatCount="indefinite"
                path="M2 40 Q100 -10 198 40"
                keyPoints="0;1;0"
                keyTimes="0;0.5;1"
                calcMode="linear"
              />
            </circle>
          </svg>

          <div className="intro-point point-nepal">
            <span className="intro-point-dot" />
            <span className="intro-point-label">Nepal</span>
          </div>
          <div className="intro-point point-world">
            <span className="intro-point-dot world" />
            <span className="intro-point-label">World</span>
          </div>

          <div className="intro-nepali">आकार</div>
        </div>

        <p className="intro-tagline">Shape your connection</p>
      </div>

      {/* The wordmark lives outside the overlay so it can fly up to the
          navbar while the overlay fades away underneath it. */}
      <div
        className="intro-flyer"
        ref={flyerRef}
        aria-label="Aakar"
        data-intro-theme={theme}
      >
        {LETTERS.map((letter, index) => (
          <span
            key={index}
            aria-hidden="true"
            style={{
              '--c': `var(--ai-letter-${index})`,
              animationDelay: `${0.75 + index * 0.22}s`,
            }}
          >
            {letter}
          </span>
        ))}
      </div>
    </>
  )
}