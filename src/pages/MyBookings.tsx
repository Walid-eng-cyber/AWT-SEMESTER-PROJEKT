import { useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import Sidebar from '../components/layout/Sidebar'
import Footer from '../components/layout/Footer'
import MobileBottomNav from '../components/layout/MobileBottomNav'
import { Search, Calendar, Clock, MapPin, RefreshCw } from 'lucide-react'

type Booking = {
  id: string
  room: string
  location: string
  date: string
  time: string
  status: 'confirmed' | 'pending' | 'cancelled'
}

const upcomingBookings: Booking[] = [
  { id: '1', room: 'Lichtstudio A.04', location: 'Design Faculty · Floor 2', date: 'Oct 24, 2023', time: '09:00 – 11:30', status: 'confirmed' },
  { id: '2', room: 'Quiet Zone 2.12', location: 'Central Library · South Wing', date: 'Oct 26, 2023', time: '14:00 – 18:00', status: 'pending' },
]

const pastBookings: Booking[] = [
  { id: '3', room: 'Auditorium Max', location: 'Main Building · Level 0', date: 'Nov 02, 2023', time: '10:00 – 12:00', status: 'cancelled' },
  { id: '4', room: 'Studio B-402', location: 'Design Wing · Level 4', date: 'Oct 18, 2023', time: '13:00 – 15:00', status: 'confirmed' },
  { id: '5', room: 'Engineering Lab B.301', location: 'Building B · Level 3', date: 'Oct 15, 2023', time: '09:00 – 11:00', status: 'confirmed' },
]

const statusClass: Record<string, string> = {
  confirmed: 'badge-confirmed',
  pending: 'badge-pending',
  cancelled: 'badge-cancelled',
}

function BookingRow({ b }: { b: Booking }) {
  return (
    <tr className="hidden sm:table-row border-b border-brand-border hover:bg-brand-surface/50 transition-colors">
      <td className="px-4 py-4">
        <p className="text-sm font-semibold text-brand-dark">{b.room}</p>
        <p className="text-xs text-brand-muted mt-0.5 flex items-center gap-1"><MapPin size={10} /> {b.location}</p>
      </td>
      <td className="px-4 py-4">
        <p className="text-sm text-brand-dark flex items-center gap-1.5"><Calendar size={13} className="text-brand-muted" /> {b.date}</p>
      </td>
      <td className="px-4 py-4">
        <p className="text-sm text-brand-dark flex items-center gap-1.5"><Clock size={13} className="text-brand-muted" /> {b.time}</p>
      </td>
      <td className="px-4 py-4">
        <span className={statusClass[b.status]}>{b.status.charAt(0).toUpperCase() + b.status.slice(1)}</span>
      </td>
      <td className="px-4 py-4">
        {b.status === 'cancelled' ? (
          <Link to="/rooms" className="inline-flex items-center gap-1 text-xs font-semibold text-brand-primary hover:underline">
            <RefreshCw size={12} /> Rebook
          </Link>
        ) : b.status === 'pending' ? (
          <button className="text-xs font-semibold text-red-600 hover:underline">Cancel</button>
        ) : (
          <Link to={`/rooms/${b.id}`} className="text-xs font-semibold text-brand-dark hover:underline">View</Link>
        )}
      </td>
    </tr>
  )
}

function BookingCard({ b }: { b: Booking }) {
  return (
    <div className="sm:hidden border-b border-brand-border p-4 hover:bg-brand-surface/50 transition-colors">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <p className="text-sm font-semibold text-brand-dark">{b.room}</p>
          <p className="text-xs text-brand-muted mt-0.5 flex items-center gap-1"><MapPin size={10} /> {b.location}</p>
        </div>
        <span className={statusClass[b.status]}>{b.status.charAt(0).toUpperCase() + b.status.slice(1)}</span>
      </div>
      <div className="flex items-center gap-4 text-xs text-brand-muted mb-2">
        <span className="flex items-center gap-1"><Calendar size={12} /> {b.date}</span>
        <span className="flex items-center gap-1"><Clock size={12} /> {b.time}</span>
      </div>
      <div>
        {b.status === 'cancelled' ? (
          <Link to="/rooms" className="inline-flex items-center gap-1 text-xs font-semibold text-brand-primary hover:underline">
            <RefreshCw size={12} /> Rebook
          </Link>
        ) : b.status === 'pending' ? (
          <button className="text-xs font-semibold text-red-600 hover:underline">Cancel</button>
        ) : (
          <Link to={`/rooms/${b.id}`} className="text-xs font-semibold text-brand-dark hover:underline">View</Link>
        )}
      </div>
    </div>
  )
}

export default function MyBookings() {
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming')
  const [query, setQuery] = useState('')

  const bookings = tab === 'upcoming' ? upcomingBookings : pastBookings
  const filtered = bookings.filter(b =>
    b.room.toLowerCase().includes(query.toLowerCase()) ||
    b.location.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar authenticated />
      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 overflow-y-auto">
          {/* Header */}
          <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
            <div>
              <p className="text-xs text-brand-muted mb-1">
                Room Management &rsaquo; <span className="text-brand-dark font-medium">Reservations</span>
              </p>
              <h1 className="text-2xl font-bold text-brand-dark">My Bookings</h1>
            </div>
            <Link to="/rooms" className="btn-primary text-xs py-2 px-4">+ New Booking</Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="card p-5 sm:col-span-1">
              <p className="text-xs text-brand-muted uppercase tracking-wide mb-1">Upcoming This Week</p>
              <p className="text-3xl font-bold text-brand-dark">02</p>
            </div>
            <div className="card p-5">
              <p className="text-xs text-brand-muted uppercase tracking-wide mb-1">Hours Reserved</p>
              <p className="text-3xl font-bold text-brand-dark">12.5</p>
            </div>
            <div className="card p-5 bg-brand-dark text-white">
              <p className="text-xs text-brand-primary uppercase tracking-wide mb-1">Next Reservation</p>
              <p className="text-sm font-semibold text-white mt-1">Lichtstudio</p>
              <p className="text-xs text-gray-400">Tomorrow at 09:00</p>
            </div>
          </div>

          <div className="card">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-brand-border">
              {/* Tabs */}
              <div className="flex gap-1">
                {(['upcoming', 'past'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`px-4 py-1.5 text-sm font-medium rounded transition-colors capitalize ${tab === t ? 'bg-brand-dark text-white' : 'text-brand-muted hover:text-brand-dark'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* Search */}
              <div className="relative w-full sm:w-auto">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
                <input
                  type="text"
                  placeholder="Search bookings..."
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  className="input-field pl-8 py-2 w-full sm:w-52 text-xs"
                />
              </div>
            </div>

            {/* Table (desktop) + Cards (mobile) */}
            <div className="overflow-x-auto">
              <table className="hidden sm:table w-full text-sm">
                <thead>
                  <tr className="bg-brand-surface border-b border-brand-border">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-brand-muted uppercase tracking-wide">Room Details</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-brand-muted uppercase tracking-wide">Date</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-brand-muted uppercase tracking-wide">Time</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-brand-muted uppercase tracking-wide">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-brand-muted uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(b => <BookingRow key={b.id} b={b} />)}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-brand-muted text-sm">No bookings found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile card list */}
            <div className="sm:hidden">
              {filtered.map(b => <BookingCard key={b.id} b={b} />)}
              {filtered.length === 0 && (
                <p className="text-center py-12 text-brand-muted text-sm">No bookings found.</p>
              )}
            </div>
          </div>
        </main>
      </div>
      <MobileBottomNav />
      <Footer />
    </div>
  )
}
