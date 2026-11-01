import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { StoreProvider, useStore } from './store'
import Landing from './pages/Landing'
import { Login, Pending, Register, RoleSelect } from './pages/Auth'
import Admin from './pages/Admin'
import AppShell from './pages/AppShell'
import Messages from './pages/Messages'
import HelpDesk from './pages/HelpDesk'
import { Discover, InvestorProfile, Saved, StartupDetail } from './pages/Investor'
import { InvestorsDirectory, Profile, StartupHome, StartupProfile } from './pages/Startup'
import { Mentors, StudentHome, StudentSessions } from './pages/Student'
import { ProHome, ProSessions, ProStudents } from './pages/Professional'
import DemoNav from './components/DemoNav' // TEMPORARY: no-login navigation

// Renders the page for the signed-in user's role, or sends them home.
function ByRole(map) {
  const { user } = useStore()
  return map[user?.role] || <Navigate to="/app" replace />
}

function ScrollTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

export default function App() {
  return (
    <StoreProvider>
      <BrowserRouter>
        <ScrollTop />
        <DemoNav />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/register" element={<RoleSelect />} />
          <Route path="/register/:role" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/pending" element={<Pending />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/app" element={<AppShell />}>
            <Route index element={<ByRole investor={<Discover />} startup={<StartupHome />} student={<StudentHome />} professional={<ProHome />} organization={<Navigate to="/app/helpdesk" replace />} />} />
            <Route path="startups" element={<ByRole investor={<Discover />} />} />
            <Route path="startups/:id" element={<StartupDetail />} />
            <Route path="saved" element={<ByRole investor={<Saved />} />} />
            <Route path="investors" element={<ByRole startup={<InvestorsDirectory />} />} />
            <Route path="sessions" element={<ByRole student={<StudentSessions />} professional={<ProSessions />} />} />
            <Route path="mentors" element={<ByRole student={<Mentors />} />} />
            <Route path="students" element={<ByRole professional={<ProStudents />} />} />
            <Route path="helpdesk" element={<HelpDesk />} />
            <Route path="messages" element={<Messages />} />
            <Route path="profile" element={<ByRole investor={<InvestorProfile />} startup={<StartupProfile />} student={<Profile />} professional={<Profile />} organization={<Profile />} />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </StoreProvider>
  )
}
