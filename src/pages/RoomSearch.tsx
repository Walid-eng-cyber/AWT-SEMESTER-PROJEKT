import { useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import Sidebar from '../components/layout/Sidebar'
import Footer from '../components/layout/Footer'
import MobileBottomNav from '../components/layout/MobileBottomNav'
import { MapPin, Users, Monitor, Speaker, Wifi, ChevronRight, SlidersHorizontal, X } from 'lucide-react'

type Room = {
  id: string
  name: string
  building: string
  floor: string
  seats: number
  type: 'Seminar' | 'Lab' | 'Lecture' | 'Studio'
  equipment: string[]
  status: 'available' | 'in_use'
  nextAvail?: string
}

const allRooms: Room[] = [
  { id: 'A.204', name: 'A.204 Auditorium', building: 'Building A', floor: 'Level 2', seats: 120, type: 'Lecture', equipment: ['Projector', 'Smartboard'], status: 'available' },
  { id: 'B.012', name: 'B.012 Collaborative Hub', building: 'Building B', floor: 'Ground', seats: 8, type: 'Seminar', equipment: ['Touch Display', 'Whiteboard'], status: 'available' },
  { id: 'C.410', name: 'Digital Media Studio', building: 'Building C', floor: 'Level 4', seats: 24, type: 'Studio', equipment: ['Pro Audio', 'Streaming Kit'], status: 'in_use', nextAvail: '14:00' },
  { id: 'A.104', name: 'Holzstraße A.104', building: 'Building A', floor: 'Level 1', seats: 12, type: 'Seminar', equipment: ['Projector', 'Smartboard'], status: 'available' },
  { id: 'B.301', name: 'Engineering Lab B.301', building: 'Building B', floor: 'Level 3', seats: 30, type: 'Lab', equipment: ['Workstations', 'Smartboard'], status: 'available' },
  { id: 'C.120', name: 'Design Workshop C.120', building: 'Building C', floor: 'Level 1', seats: 18, type: 'Studio', equipment: ['Drawing Tables', 'Projector'], status: 'in_use', nextAvail: '16:00' },
  { id: 'A.210', name: 'Seminar Room A.210', building: 'Building A', floor: 'Level 2', seats: 35, type: 'Seminar', equipment: ['Projector', 'PA System'], status: 'available' },
  { id: 'B.102', name: 'Research Lab B.102', building: 'Building B', floor: 'Level 1', seats: 20, type: 'Lab', equipment: ['Smartboard', 'Projector'], status: 'available' },
]

const equipmentIcons: Record<string, React.ReactNode> = {
  'Projector': <Monitor size={12} />,
  'Smartboard': <Monitor size={12} />,
  'Touch Display': <Monitor size={12} />,
  'Pro Audio': <Speaker size={12} />,
  'Streaming Kit': <Wifi size={12} />,
}

export default function RoomSearch() {
  const [building, setBuilding] = useState('all')
  const [roomType, setRoomType] = useState<string[]>([])
  const [capacityRange, setCapacityRange] = useState('all')
  const [filtersOpen, setFiltersOpen] = useState(false)

  const toggleType = (t: string) =>
    setRoomType(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])

  const visible = allRooms.filter(r => {
    if (building !== 'all' && !r.building.toLowerCase().includes(building)) return false
    if (roomType.length > 0 && !roomType.includes(r.type)) return false
    if (capacityRange === '1-20' && r.seats > 20) return false
    if (capacityRange === '20-50' && (r.seats < 20 || r.seats > 50)) return false
    if (capacityRange === '50+' && r.seats < 50) return false
    return true
  })

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar authenticated />
      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 overflow-y-auto">
          {/* Header */}
          <div className="bg-white border-b border-brand-border px-4 sm:px-6 lg:px-8 py-6">
            <p className="text-xs text-brand-muted mb-2">
              Campus &rsaquo; Building A &rsaquo; <span className="text-brand-dark font-medium">Room Search</span>
            </p>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-brand-dark">Explore Spatial Assets</h1>
                <p className="text-sm text-brand-muted mt-1">
                  Curated learning environments optimized for academic excellence and collaborative research.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setFiltersOpen(o => !o)}
                  className="lg:hidden btn-outline text-xs py-2 px-3 flex items-center gap-1.5"
                >
                  <SlidersHorizontal size={14} /> Filters
                </button>
                <span className="text-sm font-semibold text-brand-dark shrink-0">{visible.length} Rooms</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row flex-1">
            {/* Mobile filter overlay backdrop */}
            {filtersOpen && (
              <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setFiltersOpen(false)} />
            )}

            {/* Filters */}
            <aside className={`
              fixed inset-y-0 left-0 z-40 w-72 bg-white border-r border-brand-border p-5 overflow-y-auto
              transform transition-transform duration-200 ease-in-out
              lg:relative lg:inset-auto lg:z-auto lg:w-60 lg:transform-none lg:transition-none
              ${filtersOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal size={14} className="text-brand-muted" />
                  <span className="text-xs font-semibold uppercase tracking-wide text-brand-dark">Filters</span>
                </div>
                <button onClick={() => setFiltersOpen(false)} className="lg:hidden text-brand-muted hover:text-brand-dark">
                  <X size={18} />
                </button>
              </div>

              {/* Building */}
              <div className="mb-6">
                <label className="block text-xs font-semibold text-brand-dark mb-2 uppercase tracking-wide">Building</label>
                <select
                  value={building}
                  onChange={e => setBuilding(e.target.value)}
                  className="input-field text-xs py-2"
                >
                  <option value="all">All Main Buildings</option>
                  <option value="building a">Building A</option>
                  <option value="building b">Building B</option>
                  <option value="building c">Building C</option>
                </select>
              </div>

              {/* Room Type */}
              <div className="mb-6">
                <label className="block text-xs font-semibold text-brand-dark mb-2 uppercase tracking-wide">Room Type</label>
                <div className="flex flex-wrap gap-2">
                  {['Seminar', 'Lab', 'Lecture', 'Studio'].map(t => (
                    <button
                      key={t}
                      onClick={() => toggleType(t)}
                      className={`text-xs px-3 py-1.5 rounded border transition-colors ${roomType.includes(t) ? 'bg-brand-dark text-white border-brand-dark' : 'border-brand-border text-brand-muted hover:border-brand-dark hover:text-brand-dark'}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Capacity */}
              <div className="mb-6">
                <label className="block text-xs font-semibold text-brand-dark mb-2 uppercase tracking-wide">Capacity</label>
                {[['all', 'Any'], ['1-20', '1 – 20 seats'], ['20-50', '20 – 50 seats'], ['50+', '50+ seats']].map(([val, label]) => (
                  <label key={val} className="flex items-center gap-2 mb-2 cursor-pointer">
                    <input type="radio" name="cap" value={val} checked={capacityRange === val} onChange={() => setCapacityRange(val)} className="accent-brand-dark" />
                    <span className="text-xs text-brand-muted">{label}</span>
                  </label>
                ))}
              </div>

              {/* Equipment */}
              <div className="mb-6">
                <label className="block text-xs font-semibold text-brand-dark mb-2 uppercase tracking-wide">Equipment</label>
                {['Smartboard', 'Projector', 'Pro Audio', 'Whiteboard'].map(eq => (
                  <label key={eq} className="flex items-center gap-2 mb-2 cursor-pointer">
                    <input type="checkbox" className="accent-brand-dark" />
                    <span className="text-xs text-brand-muted">{eq}</span>
                  </label>
                ))}
              </div>

              <button className="btn-primary w-full text-xs py-2" onClick={() => setFiltersOpen(false)}>Apply Filters</button>
            </aside>

            {/* Results */}
            <div className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
                {visible.map(room => (
                  <div key={room.id} className="card hover:shadow-md transition-shadow flex flex-col">
                    {/* Header band */}
                    <div className="bg-brand-surface border-b border-brand-border px-5 py-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs text-brand-muted font-medium">{room.building}</p>
                          <p className="text-sm font-semibold text-brand-dark mt-0.5">{room.name}</p>
                        </div>
                        {room.status === 'available'
                          ? <span className="badge-available">Available</span>
                          : <span className="badge-inuse">Next: {room.nextAvail}</span>
                        }
                      </div>
                    </div>

                    <div className="p-5 flex-1 flex flex-col">
                      <div className="flex items-center gap-4 text-xs text-brand-muted mb-4">
                        <span className="flex items-center gap-1"><Users size={12} /> {room.seats} Seats</span>
                        <span className="flex items-center gap-1"><MapPin size={12} /> {room.floor}</span>
                      </div>

                      <div className="flex flex-wrap gap-1.5 mb-5">
                        {room.equipment.map(eq => (
                          <span key={eq} className="inline-flex items-center gap-1 text-xs bg-brand-surface border border-brand-border px-2 py-0.5 rounded text-brand-muted">
                            {equipmentIcons[eq] ?? null} {eq}
                          </span>
                        ))}
                      </div>

                      <div className="mt-auto">
                        <Link
                          to={`/rooms/${room.id}`}
                          className="btn-primary w-full text-xs py-2"
                        >
                          Book Room <ChevronRight size={14} />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {visible.length === 0 && (
                <div className="text-center py-16 text-brand-muted text-sm">
                  No rooms match your filters.
                </div>
              )}

              {visible.length > 0 && (
                <div className="text-center mt-8">
                  <button className="btn-outline text-xs">Load More Spaces</button>
                </div>
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
