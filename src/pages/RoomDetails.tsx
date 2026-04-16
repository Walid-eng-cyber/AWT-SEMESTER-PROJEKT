import { useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import Sidebar from '../components/layout/Sidebar'
import Footer from '../components/layout/Footer'
import MobileBottomNav from '../components/layout/MobileBottomNav'
import { Wifi, Wind, Zap, Monitor, Volume2, CheckCircle2, ChevronLeft } from 'lucide-react'

const roomData = {
  id: 'B-402',
  name: 'Studio B-402',
  subtitle: 'Collaborative Workshop',
  building: 'Main Building',
  campus: 'Campus Mainz',
  floor: 'Lvl 04',
  wing: 'Design Wing',
  seats: 32,
  status: 'free' as const,
  description:
    'Designed for high-intensity collaborative work and architectural critique, Studio B-402 offers a flexible furniture arrangement that supports both lecturing and group-focused activities. The room is flooded with north-facing natural light, ideal for color-accurate project assessments and long study sessions.',
  amenities: [
    { label: '4K AirPlay', icon: Monitor },
    { label: 'Surround Audio', icon: Volume2 },
    { label: 'Smart Glass Wall', icon: Monitor },
    { label: 'Fast Charging', icon: Zap },
    { label: 'Climate Ctrl.', icon: Wind },
    { label: 'Eduroam 6E', icon: Wifi },
  ],
}

// Simple availability grid data
const timeSlots = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00']
const days = ['MON', 'TUE', 'WED', 'THU', 'FRI']
const occupancy: Record<string, number[]> = {
  MON: [1, 1, 0, 0, 0, 0],
  TUE: [0, 0, 1, 1, 0, 0],
  WED: [1, 0, 0, 0, 1, 0],
  THU: [0, 1, 1, 0, 0, 0],
  FRI: [0, 0, 0, 1, 1, 0],
}

export default function RoomDetails() {
  const room = roomData // In a real app, look up by route param

  const [date, setDate] = useState('2023-10-25')
  const [from, setFrom] = useState('09:00')
  const [to, setTo] = useState('11:00')
  const [purpose, setPurpose] = useState('')

  const duration = (() => {
    const [fh, fm] = from.split(':').map(Number)
    const [th, tm] = to.split(':').map(Number)
    const total = (th * 60 + tm) - (fh * 60 + fm)
    return total > 0 ? (total / 60).toFixed(1) : '–'
  })()

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar authenticated />
      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 overflow-y-auto">
          {/* Breadcrumb */}
          <div className="bg-white border-b border-brand-border px-4 sm:px-6 lg:px-8 py-4">
            <p className="text-xs text-brand-muted flex items-center gap-1">
              <Link to="/rooms" className="hover:text-brand-dark transition-colors flex items-center gap-1">
                <ChevronLeft size={12} /> Room Search
              </Link>
              <span>&rsaquo;</span>
              <span>{room.campus}</span>
              <span>&rsaquo;</span>
              <span>{room.building}</span>
              <span>&rsaquo;</span>
              <span className="text-brand-dark font-medium">{room.name}</span>
            </p>
          </div>

          <div className="p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 max-w-screen-xl mx-auto">
            <div className="grid lg:grid-cols-5 gap-8">

              {/* Left – Room Info */}
              <div className="lg:col-span-3 space-y-6">
                {/* Hero card */}
                <div className="card overflow-hidden">
                  {/* Top band */}
                  <div className="bg-brand-dark text-white px-6 py-8 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-5" style={{backgroundImage:'repeating-linear-gradient(90deg,#A5CD39 0px,#A5CD39 1px,transparent 1px,transparent 60px),repeating-linear-gradient(180deg,#A5CD39 0px,#A5CD39 1px,transparent 1px,transparent 60px)'}} />
                    <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start gap-3">
                      <div className="min-w-0">
                        <p className="text-brand-primary text-xs font-semibold tracking-widest uppercase mb-1">{room.wing}</p>
                        <h1 className="text-xl sm:text-2xl font-bold">{room.name}:</h1>
                        <h2 className="text-lg sm:text-xl font-light text-gray-300">{room.subtitle}</h2>
                      </div>
                      <span className={`px-3 py-1.5 rounded text-xs font-semibold ${room.status === 'free' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'}`}>
                        {room.status === 'free' ? 'Currently Free' : 'In Use'}
                      </span>
                    </div>

                    <div className="relative z-10 flex flex-wrap gap-6 mt-6">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Capacity</p>
                        <p className="text-2xl font-bold text-white">{room.seats}</p>
                        <p className="text-xs text-gray-400">Pers.</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Floor</p>
                        <p className="text-2xl font-bold text-white">{room.floor}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    <h3 className="text-xs font-semibold tracking-widest uppercase text-brand-muted mb-3">Architectural Profile</h3>
                    <p className="text-sm text-brand-dark leading-relaxed">{room.description}</p>
                  </div>
                </div>

                {/* Technical Arsenal */}
                <div className="card p-6">
                  <h3 className="text-xs font-semibold tracking-widest uppercase text-brand-muted mb-4">Technical Arsenal</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                    {room.amenities.map(({ label, icon: Icon }) => (
                      <div key={label} className="flex items-center gap-2.5 bg-brand-surface border border-brand-border rounded-lg px-3 py-2.5">
                        <Icon size={14} className="text-brand-primary shrink-0" />
                        <span className="text-xs font-medium text-brand-dark">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Availability Timeline */}
                <div className="card p-6">
                  <h3 className="text-xs font-semibold tracking-widest uppercase text-brand-muted mb-4">Availability Timeline</h3>
                  <p className="text-xs text-brand-muted mb-3">Oct 23 — Oct 29</p>
                  <div className="overflow-x-auto">
                    <div className="min-w-[500px]">
                      {/* Time headers */}
                      <div className="flex mb-1 pl-10">
                        {timeSlots.map(t => (
                          <div key={t} className="flex-1 text-center text-xs text-brand-muted">{t}</div>
                        ))}
                      </div>
                      {/* Day rows */}
                      {days.map(day => (
                        <div key={day} className="flex items-center mb-1.5">
                          <div className="w-10 shrink-0 text-xs font-semibold text-brand-muted">{day}</div>
                          <div className="flex flex-1 gap-0.5">
                            {(occupancy[day] || [0, 0, 0, 0, 0, 0]).map((occ, i) => (
                              <div
                                key={i}
                                className={`flex-1 h-6 rounded-sm ${occ ? 'bg-brand-dark/80' : 'bg-emerald-100'}`}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                      <div className="flex items-center gap-4 mt-3 text-xs text-brand-muted">
                        <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-emerald-100 rounded-sm border border-emerald-200 inline-block" /> Free</span>
                        <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-brand-dark/80 rounded-sm inline-block" /> Occupied</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right – Reservation Form */}
              <div className="lg:col-span-2">
                <div className="card p-6 lg:sticky lg:top-20">
                  <h3 className="font-semibold text-brand-dark mb-1">Reserve Space</h3>
                  <p className="text-xs text-brand-muted mb-5">Selected: {room.name}</p>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-brand-dark mb-1.5 uppercase tracking-wide">Select Date</label>
                      <input
                        type="date"
                        value={date}
                        onChange={e => setDate(e.target.value)}
                        className="input-field"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-brand-dark mb-1.5 uppercase tracking-wide">From</label>
                        <input type="time" value={from} onChange={e => setFrom(e.target.value)} className="input-field" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-brand-dark mb-1.5 uppercase tracking-wide">To</label>
                        <input type="time" value={to} onChange={e => setTo(e.target.value)} className="input-field" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-brand-dark mb-1.5 uppercase tracking-wide">Purpose</label>
                      <input
                        type="text"
                        value={purpose}
                        onChange={e => setPurpose(e.target.value)}
                        placeholder="e.g. Design Critique Group B"
                        className="input-field"
                      />
                    </div>

                    {/* Duration summary */}
                    <div className="bg-brand-surface border border-brand-border rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-brand-muted">Duration</span>
                        <span className="text-sm font-bold text-brand-dark">{duration} Hours</span>
                      </div>
                      <p className="text-xs text-brand-muted mt-2">
                        You will receive an access code via university email.
                      </p>
                    </div>

                    <button className="btn-primary w-full">
                      <CheckCircle2 size={16} />
                      Confirm Reservation
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </main>
      </div>
      <MobileBottomNav />
      <Footer />
    </div>
  )
}
