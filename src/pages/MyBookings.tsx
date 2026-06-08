import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import Sidebar from '../components/layout/Sidebar'
import Footer from '../components/layout/Footer'
import MobileBottomNav from '../components/layout/MobileBottomNav'
import { Search, Calendar, Clock, MapPin, RefreshCw, ShieldCheck } from 'lucide-react'
import { endpoints } from '../api/endpoints'
import { ApiError, getAccessTokenClaims, getJson } from '../api/http'
import { cancelBooking, confirmBooking, listBookings } from '../api/services/bookingsService'

type UiBooking = {
  id: string
  purpose: string
  room: string
  location: string
  date: string
  time: string
  roomId: string
  startsAt: string
  endsAt: string
  status: 'confirmed' | 'pending' | 'cancelled'
}

const statusClass: Record<string, string> = {
  confirmed: 'badge-confirmed',
  pending: 'badge-pending',
  cancelled: 'badge-cancelled',
}

function BookingRow({ b, onCancel }: { b: UiBooking; onCancel: (id: string) => void }) {
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
          <button className="text-xs font-semibold text-red-600 hover:underline" onClick={() => onCancel(b.id)}>Cancel</button>
        ) : (
          <Link to={`/rooms/${b.roomId}`} className="text-xs font-semibold text-brand-dark hover:underline">View</Link>
        )}
      </td>
    </tr>
  )
}

function BookingCard({ b, onCancel }: { b: UiBooking; onCancel: (id: string) => void }) {
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
          <button className="text-xs font-semibold text-red-600 hover:underline" onClick={() => onCancel(b.id)}>Cancel</button>
        ) : (
          <Link to={`/rooms/${b.roomId}`} className="text-xs font-semibold text-brand-dark hover:underline">View</Link>
        )}
      </div>
    </div>
  )
}

export default function MyBookings() {
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming')
  const [query, setQuery] = useState('')
  const [bookings, setBookings] = useState<UiBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [processingBookingId, setProcessingBookingId] = useState<string | null>(null)

  const actorRole = useMemo(() => getAccessTokenClaims()?.role ?? 'student', [])
  const canModerateReservations = actorRole === 'admin' || actorRole === 'staff'

  useEffect(() => {
    let cancelled = false

    async function loadBookings() {
      setLoading(true)
      setError(null)

      try {
        const [bookingsRes, rooms] = await Promise.all([
          listBookings(),
          getJson<Array<{ id: string; name: string; location: string }>>(endpoints.rooms.list),
        ])

        if (cancelled) return

        const roomById = rooms.reduce<Record<string, { name: string; location: string }>>((acc, room) => {
          acc[room.id] = { name: room.name, location: room.location }
          return acc
        }, {})

        setBookings(bookingsRes.data.map((booking) => {
          const starts = new Date(booking.startsAt)
          const ends = new Date(booking.endsAt)
          const room = roomById[booking.roomId]

          return {
            id: booking.id,
            purpose: booking.purpose,
            roomId: booking.roomId,
            startsAt: booking.startsAt,
            endsAt: booking.endsAt,
            room: room?.name ?? booking.roomId,
            location: room?.location ?? 'Unknown location',
            date: starts.toLocaleDateString(undefined, { month: 'short', day: '2-digit', year: 'numeric' }),
            time: `${starts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${ends.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
            status: booking.status,
          }
        }))
      } catch (loadError) {
        if (cancelled) return
        setError(loadError instanceof Error ? loadError.message : 'Failed to load bookings.')
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadBookings()

    return () => {
      cancelled = true
    }
  }, [])

  async function handleCancel(bookingId: string) {
    setError(null)
    setProcessingBookingId(bookingId)

    try {
      const updated = await cancelBooking(bookingId)
      setBookings((prev) => prev.map((booking) => (
        booking.id === updated.id ? { ...booking, status: updated.status } : booking
      )))
    } catch (cancelError) {
      if (cancelError instanceof ApiError) {
        setError(cancelError.message)
        return
      }
      setError(cancelError instanceof Error ? cancelError.message : 'Failed to cancel booking.')
    } finally {
      setProcessingBookingId(null)
    }
  }

  async function handleConfirm(bookingId: string) {
    setError(null)
    setProcessingBookingId(bookingId)

    try {
      const updated = await confirmBooking(bookingId)
      setBookings((prev) => prev.map((booking) => (
        booking.id === updated.id ? { ...booking, status: updated.status } : booking
      )))
    } catch (confirmError) {
      if (confirmError instanceof ApiError) {
        setError(confirmError.message)
        return
      }
      setError(confirmError instanceof Error ? confirmError.message : 'Failed to confirm booking.')
    } finally {
      setProcessingBookingId(null)
    }
  }

  const filteredByTab = useMemo(() => {
    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)
    const dayBoundary = startOfToday.getTime()

    return bookings.filter((booking) => {
      const startsAt = new Date(booking.startsAt).getTime()
      return tab === 'upcoming' ? startsAt >= dayBoundary : startsAt < dayBoundary
    })
  }, [bookings, tab])

  const filtered = filteredByTab.filter(b =>
    b.room.toLowerCase().includes(query.toLowerCase()) ||
    b.location.toLowerCase().includes(query.toLowerCase())
  )

  const upcomingCount = useMemo(() => {
    const now = Date.now()
    return bookings.filter((booking) => new Date(booking.startsAt).getTime() >= now).length
  }, [bookings])

  const reservedHours = useMemo(() => {
    const total = bookings.reduce((sum, booking) => {
      const starts = new Date(booking.startsAt).getTime()
      const ends = new Date(booking.endsAt).getTime()
      return Number.isFinite(ends) ? sum + Math.max(0, ends - starts) : sum
    }, 0)
    return (total / (1000 * 60 * 60)).toFixed(1)
  }, [bookings])

  const nextReservation = useMemo(() => {
    const now = Date.now()
    return bookings
      .filter((booking) => new Date(booking.startsAt).getTime() >= now)
      .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())[0]
  }, [bookings])

  const pendingReservations = useMemo(
    () => bookings
      .filter((booking) => booking.status === 'pending')
      .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()),
    [bookings],
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
              <p className="text-3xl font-bold text-brand-dark">{upcomingCount.toString().padStart(2, '0')}</p>
            </div>
            <div className="card p-5">
              <p className="text-xs text-brand-muted uppercase tracking-wide mb-1">Hours Reserved</p>
              <p className="text-3xl font-bold text-brand-dark">{reservedHours}</p>
            </div>
            <div className="card p-5 bg-brand-dark text-white">
              <p className="text-xs text-brand-primary uppercase tracking-wide mb-1">Next Reservation</p>
              <p className="text-sm font-semibold text-white mt-1">{nextReservation?.room ?? 'No upcoming reservation'}</p>
              <p className="text-xs text-gray-400">{nextReservation?.date ? `${nextReservation.date} · ${nextReservation.time}` : 'Create one in Explore Rooms'}</p>
            </div>
          </div>

          {canModerateReservations && (
            <div className="card mb-8">
              <div className="px-5 py-4 border-b border-brand-border flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={16} className="text-brand-primary" />
                  <h2 className="text-sm font-semibold text-brand-dark">Reservation Moderation</h2>
                </div>
                <span className="text-xs text-brand-muted">{pendingReservations.length} pending</span>
              </div>

              {pendingReservations.length === 0 ? (
                <p className="px-5 py-5 text-sm text-brand-muted">No pending reservation requests.</p>
              ) : (
                <div className="divide-y divide-brand-border">
                  {pendingReservations.map((booking) => (
                    <div key={booking.id} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-brand-dark">{booking.room}</p>
                        <p className="text-xs text-brand-muted mt-1">{booking.date} · {booking.time}</p>
                        <p className="text-xs text-brand-muted mt-1">Purpose: {booking.purpose}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          className="btn-primary text-xs py-2 px-3"
                          onClick={() => void handleConfirm(booking.id)}
                          disabled={processingBookingId === booking.id}
                        >
                          {processingBookingId === booking.id ? 'Processing...' : 'Confirm'}
                        </button>
                        <button
                          className="btn-outline text-xs py-2 px-3"
                          onClick={() => void handleCancel(booking.id)}
                          disabled={processingBookingId === booking.id}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="card">
            {error && <p className="px-5 pt-4 text-sm text-red-600">{error}</p>}
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
                  {filtered.map(b => <BookingRow key={b.id} b={b} onCancel={handleCancel} />)}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-brand-muted text-sm">{loading ? 'Loading bookings...' : 'No bookings found.'}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile card list */}
            <div className="sm:hidden">
              {filtered.map(b => <BookingCard key={b.id} b={b} onCancel={handleCancel} />)}
              {filtered.length === 0 && (
                <p className="text-center py-12 text-brand-muted text-sm">{loading ? 'Loading bookings...' : 'No bookings found.'}</p>
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
