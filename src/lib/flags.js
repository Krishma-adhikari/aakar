// Demo features (sample accounts, the ?as= shortcut, made-up startups and sessions) exist only
// for local development, or for a separate demo deployment that sets VITE_ENABLE_DEMO=true.
//
// In a normal production build this is false, so:
//  - the demo navigator is not rendered,
//  - ?as=admin and the demo123 logins do nothing,
//  - real members never see made-up data.
export const DEMO_ENABLED = import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEMO === 'true'
