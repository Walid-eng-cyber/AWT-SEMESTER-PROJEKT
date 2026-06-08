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

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/rooms" element={<RoomSearch />} />
        <Route path="/rooms/:id" element={<RoomDetails />} />
        <Route path="/bookings" element={<MyBookings />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
