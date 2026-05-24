import { Link } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import Sidebar from '../components/layout/Sidebar'
import Footer from '../components/layout/Footer'
import MobileBottomNav from '../components/layout/MobileBottomNav'
import { MapPin, Calendar, ChevronRight, ExternalLink } from 'lucide-react'

const upcoming = [
  { title: 'Design Review: Phase 2', room: 'Room 104 · Holzstraße', time: 'Today · 14:00', status: 'confirmed' },
  { title: 'Graduate Thesis Prep', room: 'Library Pod 04 · Main Campus', time: 'Tomorrow · 09:00', status: 'confirmed' },
]

const recommended = [
  { id: 'A.104', name: 'Holzstraße A.104', building: 'Building A', seats: 12, status: 'available' },
  { id: '02.15', name: 'Lucy-Hillebrand-Str. 02.15', building: 'Main Campus', seats: 4, status: 'in_use' },
]

const activity = [
  { msg: 'Confirmed: Studio B.02 reserved.', ago: '12 MIN AGO', type: 'success' },
  { msg: 'Alert: AC maintenance in Bldg C.', ago: '2 HRS AGO', type: 'warning' },
]

export default function Dashboard() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar authenticated />
      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 overflow-y-auto">
          {/* Breadcrumb */}
          <p className="text-xs text-brand-muted mb-6">
            Campus Mainz &rsaquo; <span className="text-brand-dark font-medium">Dashboard</span>
          </p>

          {/* Welcome */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-brand-dark">Guten Tag, Alex.</h1>
            <p className="text-sm text-brand-muted mt-1">
              Your workspace at the School of Design is ready. You have{' '}
              <span className="text-brand-dark font-semibold">2 bookings</span> scheduled for today.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <div className="card p-4 sm:p-5">
              <p className="text-xs text-brand-muted uppercase tracking-wide mb-2">Available Hubs</p>
              <p className="text-2xl sm:text-3xl font-bold text-brand-dark">14</p>
              <p className="text-xs text-brand-muted mt-1">Rooms</p>
            </div>
            <div className="card p-4 sm:p-5">
              <p className="text-xs text-brand-muted uppercase tracking-wide mb-2">Active Bookings</p>
              <p className="text-2xl sm:text-3xl font-bold text-brand-dark">02</p>
              <p className="text-xs text-brand-muted mt-1">Today</p>
            </div>
            <div className="col-span-1 sm:col-span-2 lg:col-span-1 card p-4 sm:p-5 bg-brand-dark text-white">
              <p className="text-xs text-brand-primary uppercase tracking-wide mb-2">Quick Booking</p>
              <div className="space-y-3 mt-3">
                <div>
                  <p className="text-xs font-semibold mb-1">Instant Studio</p>
                  <p className="text-xs text-gray-400 mb-2">Book the nearest available creative workspace for the next 2 hours.</p>
                  <Link to="/rooms" className="text-xs font-semibold text-brand-primary hover:underline flex items-center gap-1">
                    FIND SPACE <ChevronRight size={12} />
                  </Link>
                </div>
                <div className="border-t border-white/10 pt-3">
                  <p className="text-xs font-semibold mb-1">Seminar Room</p>
                  <p className="text-xs text-gray-400 mb-2">Reserve a space with projector and seating for up to 25 people.</p>
                  <Link to="/rooms" className="text-xs font-semibold text-brand-primary hover:underline flex items-center gap-1">
                    SCHEDULE NOW <ChevronRight size={12} />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Upcoming */}
            <div className="lg:col-span-2 space-y-6">
              <div className="card p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-semibold text-brand-dark">Upcoming</h2>
                  <Link to="/bookings" className="text-xs text-brand-primary font-semibold hover:underline uppercase tracking-wide">Manage All Bookings</Link>
                </div>
                <div className="space-y-3">
                  {upcoming.map(b => (
                    <div key={b.title} className="flex flex-col sm:flex-row items-start gap-4 p-3 rounded-lg hover:bg-brand-surface transition-colors">
                      <div className="w-8 h-8 bg-brand-primary/10 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                        <Calendar size={14} className="text-brand-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-brand-dark">{b.title}</p>
                        <p className="text-xs text-brand-muted mt-0.5">{b.room}</p>
                      </div>
                      <div className="text-left sm:text-right shrink-0">
                        <p className="text-xs text-brand-muted">{b.time}</p>
                        <span className="badge-confirmed mt-1">Confirmed</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommended */}
              <div className="card p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-semibold text-brand-dark">Recommended Spaces</h2>
                  <Link to="/rooms" className="text-xs text-brand-primary font-semibold hover:underline uppercase tracking-wide">View All</Link>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  {recommended.map(r => (
                    <div key={r.id} className="border border-brand-border rounded-lg p-4 hover:border-brand-primary/50 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-sm font-medium text-brand-dark leading-tight">{r.name}</p>
                          <p className="text-xs text-brand-muted mt-0.5 flex items-center gap-1">
                            <MapPin size={10} /> {r.building} · {r.seats} Seats
                          </p>
                        </div>
                        {r.status === 'available'
                          ? <span className="badge-available">Available</span>
                          : <span className="badge-inuse">In Use</span>
                        }
                      </div>
                      <Link to={`/rooms/${r.id}`} className="text-xs text-brand-dark font-semibold hover:text-brand-primary transition-colors flex items-center gap-1 mt-3">
                        Book Room <ChevronRight size={12} />
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Activity Feed */}
            <div className="card p-6 h-fit">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-semibold text-brand-dark">Activity Feed</h2>
                <span className="badge-confirmed">3 NEW</span>
              </div>
              <div className="space-y-4">
                {activity.map((a, i) => (
                  <div key={i} className="flex gap-3">
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${a.type === 'success' ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                    <div>
                      <p className="text-xs text-brand-dark">{a.msg}</p>
                      <p className="text-xs text-brand-muted mt-0.5">{a.ago}</p>
                    </div>
                  </div>
                ))}
              </div>

              <button className="btn-outline w-full mt-6 text-xs py-2">
                <ExternalLink size={14} />
                Explore Campus Map
              </button>
            </div>
          </div>
        </main>
      </div>
      <MobileBottomNav />
      <Footer />
    </div>
  )
}
