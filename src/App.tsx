import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import SignIn from './pages/SignIn'
import SignUp from './pages/SignUp'
import Dashboard from './pages/Dashboard'
import RoomSearch from './pages/RoomSearch'
import RoomDetails from './pages/RoomDetails'
import MyBookings from './pages/MyBookings'
import SettingsPage from './pages/Settings'
import EventsPage from './pages/Events'
import AssistantPage from './pages/Assistant'
import FloatingAssistant from './components/assistant/FloatingAssistant'
import { getAccessToken } from './api/http'

function RequireAuth({ children }: { children: JSX.Element }) {
  if (!getAccessToken()) {
    return <Navigate to="/signin" replace />
  }

  return children
}

function RedirectIfAuthenticated({ children }: { children: JSX.Element }) {
  if (getAccessToken()) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/signin" element={<RedirectIfAuthenticated><SignIn /></RedirectIfAuthenticated>} />
        <Route path="/signup" element={<RedirectIfAuthenticated><SignUp /></RedirectIfAuthenticated>} />
        <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
        <Route path="/rooms" element={<RequireAuth><RoomSearch /></RequireAuth>} />
        <Route path="/rooms/:id" element={<RequireAuth><RoomDetails /></RequireAuth>} />
        <Route path="/bookings" element={<RequireAuth><MyBookings /></RequireAuth>} />
        <Route path="/events" element={<RequireAuth><EventsPage /></RequireAuth>} />
        <Route path="/assistant" element={<RequireAuth><AssistantPage /></RequireAuth>} />
        <Route path="/support" element={<RequireAuth><AssistantPage /></RequireAuth>} />
        <Route path="/settings" element={<RequireAuth><SettingsPage /></RequireAuth>} />
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <FloatingAssistant />
    </BrowserRouter>
  )
}
