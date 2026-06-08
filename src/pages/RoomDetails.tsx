import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import Sidebar from '../components/layout/Sidebar'
import Footer from '../components/layout/Footer'
import MobileBottomNav from '../components/layout/MobileBottomNav'
import { Wifi, Wind, Zap, Monitor, Volume2, CheckCircle2, ChevronLeft, type LucideIcon } from 'lucide-react'
import { endpoints } from '../api/endpoints'
import { ApiError, getAccessTokenClaims, getJson, patchJson } from '../api/http'
import { createBooking } from '../api/services/bookingsService'

type SlotState = 'free' | 'occupied' | 'maintenance'

type AvailabilityWindow = {
  roomId: string
  from: string
  to: string
  slots: Array<{
    startsAt: string
    endsAt: string
    state: SlotState
  }>
}

type RoomView = {
  id: string
  name: string
  subtitle: string
  building: string
  campus: string
  floor: string
  wing: string
  seats: number
  status: 'free' | 'occupied' | 'blocked'
  description: string
  amenities: Array<{ label: string; icon: LucideIcon }>
}

const roomData: RoomView = {
  id: 'B-402',
  name: 'Studio B-402',
  subtitle: 'Collaborative Workshop',
  building: 'Main Building',
  campus: 'Campus Mainz',
  floor: 'Lvl 04',
  wing: 'Design Wing',
  seats: 32,
  status: 'free',
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

const timeSlots = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00']
const dayLabels = ['MON', 'TUE', 'WED', 'THU', 'FRI'] as const

function startOfDay(date: Date) {
  const value = new Date(date)
  value.setHours(0, 0, 0, 0)
  return value
}

function addDays(date: Date, daysToAdd: number) {
  const value = new Date(date)
  value.setDate(value.getDate() + daysToAdd)
  return value
}

function atTime(baseDate: Date, hhmm: string) {
  const [hour, minute] = hhmm.split(':').map(Number)
  const value = new Date(baseDate)
  value.setHours(hour, minute, 0, 0)
  return value
}

function hasOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && bStart < aEnd
}

function resolveBackendBaseUrl() {
  const configured = import.meta.env.VITE_BACKEND_BASE_URL as string | undefined
  return configured && configured.length > 0 ? configured : 'http://localhost:4000'
}

function resolveWebSocketUrl(baseUrl: string) {
  const configured = import.meta.env.VITE_BACKEND_WS_URL as string | undefined
  if (configured && configured.length > 0) return configured

  const url = new URL(baseUrl)
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
  url.pathname = '/ws'
  url.search = ''
  url.hash = ''
  return url.toString()
}

export default function RoomDetails() {
  const { id: routeRoomId } = useParams<{ id: string }>()

  const [room, setRoom] = useState<RoomView>(roomData)
  const [roomLoading, setRoomLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const defaultTimes = useMemo(() => {
    const now = new Date()
    const start = new Date(now)
    start.setMinutes(0, 0, 0)
    start.setHours(start.getHours() + 1)

    const end = new Date(start)
    end.setHours(end.getHours() + 1)

    const toTime = (value: Date) => {
      const hh = String(value.getHours()).padStart(2, '0')
      const mm = String(value.getMinutes()).padStart(2, '0')
      return `${hh}:${mm}`
    }

    return { from: toTime(start), to: toTime(end) }
  }, [])

  const [date, setDate] = useState(() => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  })
  const [from, setFrom] = useState(defaultTimes.from)
  const [to, setTo] = useState(defaultTimes.to)
  const [purpose, setPurpose] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [editName, setEditName] = useState('')
  const [editLocation, setEditLocation] = useState('')
  const [editCapacity, setEditCapacity] = useState<number>(0)
  const [editEquipment, setEditEquipment] = useState('')
  const [manageError, setManageError] = useState<string | null>(null)
  const [manageSuccess, setManageSuccess] = useState<string | null>(null)
  const [savingRoom, setSavingRoom] = useState(false)
  const [timelineLoading, setTimelineLoading] = useState(false)
  const [timelineError, setTimelineError] = useState<string | null>(null)
  const [timelineSlotsByDay, setTimelineSlotsByDay] = useState<Record<string, SlotState[]>>({})
  const [timelineReloadKey, setTimelineReloadKey] = useState(0)

  const actorRole = getAccessTokenClaims()?.role
  const canManageRoom = actorRole === 'admin' || actorRole === 'staff'
  const backendBaseUrl = useMemo(() => resolveBackendBaseUrl(), [])
  const webSocketUrl = useMemo(() => resolveWebSocketUrl(backendBaseUrl), [backendBaseUrl])

  const timelineDays = useMemo(() => {
    const anchor = startOfDay(new Date(`${date}T00:00:00`))
    const dayOfWeek = anchor.getDay()
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    const monday = addDays(anchor, mondayOffset)

    return dayLabels.map((label, index) => ({
      label,
      date: addDays(monday, index),
    }))
  }, [date])

  const timelineRangeLabel = useMemo(() => {
    const first = timelineDays[0]?.date
    const last = timelineDays[timelineDays.length - 1]?.date
    if (!first || !last) return ''

    const format = (value: Date) => value.toLocaleDateString(undefined, { month: 'short', day: '2-digit' })
    return `${format(first)} - ${format(last)}`
  }, [timelineDays])

  useEffect(() => {
    let cancelled = false

    async function loadRoom() {
      if (!routeRoomId) {
        setLoadError('Missing room id in route.')
        setRoomLoading(false)
        return
      }

      try {
        const roomDataFromApi = await getJson<{
          id: string
          name: string
          location: string
          capacity: number
          equipment: string[]
          status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE'
        }>(endpoints.rooms.byId(routeRoomId))

        if (cancelled) return

        setRoom({
          id: roomDataFromApi.id,
          name: roomDataFromApi.name,
          subtitle: roomData.subtitle,
          building: roomDataFromApi.location,
          campus: 'Campus Mainz',
          floor: 'Campus',
          wing: 'Academic Spaces',
          seats: roomDataFromApi.capacity,
          status: roomDataFromApi.status === 'MAINTENANCE' ? 'blocked' : roomDataFromApi.status === 'AVAILABLE' ? 'free' : 'occupied',
          description: roomData.description,
          amenities: roomDataFromApi.equipment.length > 0
            ? roomDataFromApi.equipment.map((label) => ({
              label,
              icon: label.toLowerCase().includes('audio') ? Volume2 : label.toLowerCase().includes('wifi') ? Wifi : Monitor,
            }))
            : roomData.amenities,
        })
        setEditName(roomDataFromApi.name)
        setEditLocation(roomDataFromApi.location)
        setEditCapacity(roomDataFromApi.capacity)
        setEditEquipment(roomDataFromApi.equipment.join(', '))
      } catch (error) {
        if (cancelled) return
        setLoadError(error instanceof Error ? error.message : 'Failed to load room.')
      } finally {
        if (!cancelled) {
          setRoomLoading(false)
        }
      }
    }

    void loadRoom()

    return () => {
      cancelled = true
    }
  }, [routeRoomId])

  const reservationStartsAt = useMemo(() => `${date}T${from}:00`, [date, from])
  const reservationEndsAt = useMemo(() => `${date}T${to}:00`, [date, to])

  useEffect(() => {
    let cancelled = false

    async function loadTimeline() {
      if (!routeRoomId) return

      setTimelineLoading(true)
      setTimelineError(null)

      try {
        const windows = await Promise.all(
          timelineDays.map(async ({ label, date: timelineDate }) => {
            const fromDate = atTime(timelineDate, timeSlots[0])
            const toDate = atTime(timelineDate, timeSlots[timeSlots.length - 1])

            const window = await getJson<AvailabilityWindow>(endpoints.availability.window, {
              roomId: routeRoomId,
              from: fromDate.toISOString(),
              to: toDate.toISOString(),
            })

            const states: SlotState[] = []

            for (let i = 0; i < timeSlots.length - 1; i += 1) {
              const slotStart = atTime(timelineDate, timeSlots[i])
              const slotEnd = atTime(timelineDate, timeSlots[i + 1])

              let nextState: SlotState = 'free'
              for (const segment of window.slots) {
                const segStart = new Date(segment.startsAt)
                const segEnd = new Date(segment.endsAt)

                if (!hasOverlap(slotStart, slotEnd, segStart, segEnd)) continue

                if (segment.state === 'maintenance') {
                  nextState = 'maintenance'
                  break
                }

                if (segment.state === 'occupied') {
                  nextState = 'occupied'
                }
              }

              states.push(nextState)
            }

            return { label, states }
          }),
        )

        if (cancelled) return

        setTimelineSlotsByDay(windows.reduce<Record<string, SlotState[]>>((acc, item) => {
          acc[item.label] = item.states
          return acc
        }, {}))
      } catch (error) {
        if (!cancelled) {
          setTimelineError(error instanceof Error ? error.message : 'Failed to load availability timeline.')
        }
      } finally {
        if (!cancelled) {
          setTimelineLoading(false)
        }
      }
    }

    void loadTimeline()

    return () => {
      cancelled = true
    }
  }, [routeRoomId, timelineDays, timelineReloadKey])

  useEffect(() => {
    if (!routeRoomId) return

    const socket = new WebSocket(webSocketUrl)
    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data as string) as {
          type: string
          data?: { roomId?: string }
        }

        if ((payload.type === 'appointment.updated' || payload.type === 'appointment.created' || payload.type === 'appointment.deleted' || payload.type === 'room.status.changed')
            && payload.data?.roomId === routeRoomId) {
          setTimelineReloadKey((value) => value + 1)
        }
      } catch {
        // Ignore malformed payloads.
      }
    }

    return () => {
      socket.close()
    }
  }, [routeRoomId, webSocketUrl])

  useEffect(() => {
    const poll = window.setInterval(() => {
      setTimelineReloadKey((value) => value + 1)
    }, 20000)

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setTimelineReloadKey((value) => value + 1)
      }
    }

    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      window.clearInterval(poll)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [])

  async function handleReservationSubmit() {
    setSubmitError(null)
    setSubmitSuccess(null)

    if (!purpose.trim()) {
      setSubmitError('Please add a purpose for the reservation.')
      return
    }

    if (!routeRoomId) {
      setSubmitError('Room id is missing.')
      return
    }

    if (room.status === 'blocked') {
      setSubmitError('This room is blocked due to maintenance and cannot be reserved.')
      return
    }

    setSubmitting(true)
    try {
      await createBooking(
        {
          roomId: routeRoomId,
          startsAt: reservationStartsAt,
          endsAt: reservationEndsAt,
          purpose: purpose.trim(),
        },
        crypto.randomUUID(),
      )
      setSubmitSuccess('Reservation request submitted successfully.')
      setTimelineReloadKey((value) => value + 1)
    } catch (error) {
      if (error instanceof ApiError && error.status === 403) {
        setSubmitError('You can submit requests, but only staff or admin can confirm reservations.')
      } else {
        setSubmitError(error instanceof Error ? error.message : 'Failed to submit reservation.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function handleSaveRoomEdits() {
    if (!routeRoomId) return

    setManageError(null)
    setManageSuccess(null)
    setSavingRoom(true)

    try {
      const payload = {
        name: editName.trim(),
        location: editLocation.trim(),
        capacity: editCapacity,
        equipment: editEquipment
          .split(',')
          .map((item) => item.trim())
          .filter((item) => item.length > 0),
      }

      const updated = await patchJson<{
        id: string
        name: string
        location: string
        capacity: number
        equipment: string[]
      }, typeof payload>(endpoints.rooms.update(routeRoomId), payload)

      setRoom((prev) => ({
        ...prev,
        name: updated.name,
        building: updated.location,
        seats: updated.capacity,
        amenities: updated.equipment.length > 0
          ? updated.equipment.map((label) => ({
            label,
            icon: label.toLowerCase().includes('audio') ? Volume2 : label.toLowerCase().includes('wifi') ? Wifi : Monitor,
          }))
          : prev.amenities,
      }))
      setManageSuccess('Room details updated.')
    } catch (error) {
      setManageError(error instanceof Error ? error.message : 'Failed to update room details.')
    } finally {
      setSavingRoom(false)
    }
  }

  async function handleToggleBlockRoom() {
    if (!routeRoomId) return

    setManageError(null)
    setManageSuccess(null)
    setSavingRoom(true)

    try {
      const nextStatus = room.status === 'blocked' ? 'AVAILABLE' : 'MAINTENANCE'
      await patchJson<{ status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' }, { status: 'AVAILABLE' | 'MAINTENANCE' }>(
        endpoints.rooms.setStatus(routeRoomId),
        { status: nextStatus },
      )

      setRoom((prev) => ({
        ...prev,
        status: nextStatus === 'MAINTENANCE' ? 'blocked' : 'free',
      }))
      setManageSuccess(nextStatus === 'MAINTENANCE' ? 'Room blocked for maintenance.' : 'Room reopened for reservation.')
      setTimelineReloadKey((value) => value + 1)
    } catch (error) {
      if (error instanceof ApiError) {
        setManageError(error.message)
      } else {
        setManageError(error instanceof Error ? error.message : 'Failed to update room status.')
      }
    } finally {
      setSavingRoom(false)
    }
  }

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
            {roomLoading && <p className="text-sm text-brand-muted mb-4">Loading room details...</p>}
            {loadError && <p className="text-sm text-red-600 mb-4">{loadError}</p>}
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
                      <span className={`px-3 py-1.5 rounded text-xs font-semibold ${room.status === 'free' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : room.status === 'blocked' ? 'bg-red-500/20 text-red-200 border border-red-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'}`}>
                        {room.status === 'free' ? 'Currently Free' : room.status === 'blocked' ? 'Blocked' : 'In Use'}
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
                  <p className="text-xs text-brand-muted mb-3">{timelineRangeLabel}</p>
                  {timelineLoading && <p className="text-xs text-brand-muted mb-2">Refreshing timeline...</p>}
                  {timelineError && <p className="text-xs text-red-600 mb-2">{timelineError}</p>}
                  <div className="overflow-x-auto">
                    <div className="min-w-[500px]">
                      {/* Time headers */}
                      <div className="flex mb-1 pl-10">
                        {timeSlots.map(t => (
                          <div key={t} className="flex-1 text-center text-xs text-brand-muted">{t}</div>
                        ))}
                      </div>
                      {/* Day rows */}
                      {timelineDays.map(({ label }) => (
                        <div key={label} className="flex items-center mb-1.5">
                          <div className="w-10 shrink-0 text-xs font-semibold text-brand-muted">{label}</div>
                          <div className="flex flex-1 gap-0.5">
                            {(timelineSlotsByDay[label] || Array(timeSlots.length - 1).fill('free')).map((state, i) => (
                              <div
                                key={i}
                                className={`flex-1 h-6 rounded-sm ${state === 'maintenance' ? 'bg-red-200' : state === 'occupied' ? 'bg-brand-dark/80' : 'bg-emerald-100'}`}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                      <div className="flex items-center gap-4 mt-3 text-xs text-brand-muted">
                        <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-emerald-100 rounded-sm border border-emerald-200 inline-block" /> Free</span>
                        <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-brand-dark/80 rounded-sm inline-block" /> Occupied</span>
                        <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-red-200 rounded-sm inline-block" /> Maintenance</span>
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
                  {room.status === 'blocked' && (
                    <p className="text-xs text-red-600 mb-4">Room is currently blocked due to maintenance and cannot be reserved.</p>
                  )}

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

                    {submitError && <p className="text-xs text-red-600">{submitError}</p>}
                    {submitSuccess && <p className="text-xs text-emerald-700">{submitSuccess}</p>}

                    <button className="btn-primary w-full" onClick={handleReservationSubmit} disabled={submitting || roomLoading || room.status === 'blocked'}>
                      <CheckCircle2 size={16} />
                      {submitting ? 'Submitting...' : 'Submit Reservation Request'}
                    </button>
                  </div>
                </div>

                {canManageRoom && (
                  <div className="card p-6 mt-6">
                    <h3 className="font-semibold text-brand-dark mb-3">Room Management</h3>
                    <p className="text-xs text-brand-muted mb-4">Staff/Admin can edit room details or block this room when a problem occurs.</p>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-brand-dark mb-1">Room Name</label>
                        <input className="input-field" value={editName} onChange={(event) => setEditName(event.target.value)} />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-brand-dark mb-1">Location</label>
                        <input className="input-field" value={editLocation} onChange={(event) => setEditLocation(event.target.value)} />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-brand-dark mb-1">Capacity</label>
                        <input type="number" min={1} className="input-field" value={editCapacity} onChange={(event) => setEditCapacity(Number(event.target.value) || 0)} />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-brand-dark mb-1">Equipment (comma separated)</label>
                        <input className="input-field" value={editEquipment} onChange={(event) => setEditEquipment(event.target.value)} />
                      </div>

                      {manageError && <p className="text-xs text-red-600">{manageError}</p>}
                      {manageSuccess && <p className="text-xs text-emerald-700">{manageSuccess}</p>}

                      <div className="flex gap-2">
                        <button className="btn-primary text-xs py-2 px-3" onClick={handleSaveRoomEdits} disabled={savingRoom || roomLoading}>
                          {savingRoom ? 'Saving...' : 'Save Room Edits'}
                        </button>
                        <button className="btn-outline text-xs py-2 px-3" onClick={handleToggleBlockRoom} disabled={savingRoom || roomLoading}>
                          {room.status === 'blocked' ? 'Unblock Room' : 'Block Room'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
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
