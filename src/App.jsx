import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { StoreProvider, useStore } from './store'
import DemoNav from './components/DemoNav' // demo mode only (see lib/flags.js)
import { DEMO_ENABLED } from './lib/flags'

// Pages are code-split so each one loads only when visited.
// Helper for modules that use named exports instead of a default export.
const named = (loader, name) => lazy(() => loader().then((m) => ({ default: m[name] })))

const Landing = lazy(() => import('./pages/Landing'))
const Admin = lazy(() => import('./pages/Admin'))
const AppShell = lazy(() => import('./pages/AppShell'))
const Messages = lazy(() => import('./pages/Messages'))

const forgot = () => import('./pages/ForgotPassword')
const ForgotPassword = named(forgot, 'ForgotPassword')
const ResetPassword = named(forgot, 'ResetPassword')


const auth = () => import('./pages/Auth')
const Login = named(auth, 'Login')
const Pending = named(auth, 'Pending')
const Register = named(auth, 'Register')
const RoleSelect = named(auth, 'RoleSelect')


const investor = () => import('./pages/Investor')
const Discover = named(investor, 'Discover')
const InvestorHome = named(investor, 'InvestorHome')
const InvestorProfile = named(investor, 'InvestorProfile')
const Saved = named(investor, 'Saved')
const StartupDetail = named(investor, 'StartupDetail')

const startup = () => import('./pages/Startup')
const InvestorsDirectory = named(startup, 'InvestorsDirectory')
const Profile = named(startup, 'Profile')
const StartupHome = named(startup, 'StartupHome')
const StartupProfile = named(startup, 'StartupProfile')

const student = () => import('./pages/Student')
const Mentors = named(student, 'Mentors')
const StudentHome = named(student, 'StudentHome')
const StudentSessions = named(student, 'StudentSessions')

const professional = () => import('./pages/Professional')
const ProHome = named(professional, 'ProHome')
const ProSessions = named(professional, 'ProSessions')
const ProStudents = named(professional, 'ProStudents')


function RoleRoute({ fallback = '/app', ...pages }) {
  const { user } = useStore()
  if (!user) return <Navigate to="/login" replace />
  return pages[user.role] || <Navigate to={fallback} replace />
}

// Only approved members may open the app. Everyone else goes to the status page.
function RequireApproved({ children }) {
  const { user } = useStore()
  if (!user) return <Navigate to="/login" replace />
  if (user.role === 'admin') return <Navigate to="/admin" replace />
  if (user.status !== 'approved') return <Navigate to="/pending" replace />
  return children
}

// Wait until we know whether the browser still has a login, so a reload does not bounce you to /login.
function Gate({ children }) {
  const { authReady } = useStore()
  return authReady ? children : <PageLoader />
}

function ScrollTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

function PageLoader() {
  return <div style={{ padding: '4rem 1rem', textAlign: 'center', opacity: 0.6 }}>Loading…</div>
}

export default function App() {
  return (
    <StoreProvider>
      {/* BASE_URL follows vite.config: '/aakar/' locally, '/' on Vercel */}
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <ScrollTop />
        {DEMO_ENABLED && <DemoNav />}
        <Suspense fallback={<PageLoader />}>
          <Gate><Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/register" element={<RoleSelect />} />
            <Route path="/register/:role" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/pending" element={<Pending />} />
            <Route path="/admin" element={<Admin />} />

            <Route path="/app" element={<RequireApproved><AppShell /></RequireApproved>}>
              <Route
                index
                element={
                  <RoleRoute
                    fallback="/"
                    investor={<InvestorHome />}
                    startup={<StartupHome />}
                    student={<StudentHome />}
                    professional={<ProHome />}
                  />
                }
              />
              <Route path="startups" element={<RoleRoute investor={<Discover />} />} />
              <Route path="startups/:id" element={<StartupDetail />} />
              <Route path="saved" element={<RoleRoute investor={<Saved />} />} />
              <Route path="investors" element={<RoleRoute startup={<InvestorsDirectory />} />} />
              <Route
                path="sessions"
                element={<RoleRoute student={<StudentSessions />} professional={<ProSessions />} />}
              />
              <Route path="mentors" element={<RoleRoute student={<Mentors />} />} />
              <Route path="students" element={<RoleRoute professional={<ProStudents />} />} />
              <Route path="messages" element={<Messages />} />
              <Route
                path="profile"
                element={
                  <RoleRoute
                    investor={<InvestorProfile />}
                    startup={<StartupProfile />}
                    student={<Profile />}
                    professional={<Profile />}
                    organization={<Profile />}
                  />
                }
              />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes></Gate>
        </Suspense>
      </BrowserRouter>
    </StoreProvider>
  )
}