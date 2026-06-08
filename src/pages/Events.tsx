import { useMemo, useState } from 'react'
import { CalendarDays, Clock, MapPin, Users, Tag } from 'lucide-react'
import Navbar from '../components/layout/Navbar'
import Sidebar from '../components/layout/Sidebar'
import Footer from '../components/layout/Footer'
import MobileBottomNav from '../components/layout/MobileBottomNav'

type EventItem = {
  id: string
  title: string
  tag: 'Info' | 'Wirtschaft' | 'Tech' | 'Karriere' | 'Design'
  date: string
  time: string
  location: string
  seatsLeft: number
  description: string
}

const events: EventItem[] = [
  {
    id: 'ev-1',
    title: 'Info Session: Erasmus Exchange 2027',
    tag: 'Info',
    date: 'Jun 12, 2026',
    time: '10:00 - 11:00',
    location: 'Main Campus - Hall A.104',
    seatsLeft: 35,
    description: 'Overview of partner universities, deadlines, and application checklist for exchange semester planning.',
  },
  {
    id: 'ev-2',
    title: 'Wirtschaft Talk: Startup Finance Basics',
    tag: 'Wirtschaft',
    date: 'Jun 14, 2026',
    time: '14:00 - 15:30',
    location: 'Business Center - Room B.210',
    seatsLeft: 9,
    description: 'Guest lecture on financing models, investor expectations, and common budgeting mistakes in year one.',
  },
  {
    id: 'ev-3',
    title: 'Tech Meetup: Building with AI APIs',
    tag: 'Tech',
    date: 'Jun 16, 2026',
    time: '17:00 - 19:00',
    location: 'Digital Lab - C.410',
    seatsLeft: 22,
    description: 'Hands-on coding meetup focused on prompt design, API integration patterns, and deployment tips.',
  },
  {
    id: 'ev-4',
    title: 'Karriere Fair: Industry Networking Night',
    tag: 'Karriere',
    date: 'Jun 19, 2026',
    time: '18:30 - 21:00',
    location: 'Main Atrium',
    seatsLeft: 120,
    description: 'Meet recruiters from local companies, bring your CV, and book quick interview slots on-site.',
  },
  {
    id: 'ev-5',
    title: 'Design Jam: Rapid UX Challenge',
    tag: 'Design',
    date: 'Jun 20, 2026',
    time: '09:30 - 12:30',
    location: 'Design Studio - D.120',
    seatsLeft: 4,
    description: 'Collaborative sprint to prototype interfaces in teams and pitch outcomes to mentors.',
  },
]

const allTags = ['All', 'Info', 'Wirtschaft', 'Tech', 'Karriere', 'Design'] as const

export default function EventsPage() {
  const [activeTag, setActiveTag] = useState<(typeof allTags)[number]>('All')

  const visibleEvents = useMemo(
    () => (activeTag === 'All' ? events : events.filter((item) => item.tag === activeTag)),
    [activeTag],
  )

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar authenticated />
      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 overflow-y-auto">
          <div className="mb-8">
            <p className="text-xs text-brand-muted mb-1">Campus Events</p>
            <h1 className="text-2xl font-bold text-brand-dark">Upcoming Events</h1>
            <p className="text-sm text-brand-muted mt-2">Browse random event data with category tags like Info and Wirtschaft.</p>
          </div>

          <div className="card p-4 sm:p-5 mb-6">
            <div className="flex flex-wrap gap-2">
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setActiveTag(tag)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded border transition-colors ${
                    activeTag === tag
                      ? 'bg-brand-dark text-white border-brand-dark'
                      : 'text-brand-muted border-brand-border hover:text-brand-dark hover:border-brand-dark'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            {visibleEvents.map((item) => (
              <article key={item.id} className="card p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h2 className="text-base font-semibold text-brand-dark leading-tight">{item.title}</h2>
                  <span className="badge-confirmed inline-flex items-center gap-1 shrink-0">
                    <Tag size={11} /> {item.tag}
                  </span>
                </div>

                <p className="text-sm text-brand-muted mb-4">{item.description}</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-brand-dark">
                  <p className="inline-flex items-center gap-1.5"><CalendarDays size={13} className="text-brand-muted" /> {item.date}</p>
                  <p className="inline-flex items-center gap-1.5"><Clock size={13} className="text-brand-muted" /> {item.time}</p>
                  <p className="inline-flex items-center gap-1.5"><MapPin size={13} className="text-brand-muted" /> {item.location}</p>
                  <p className="inline-flex items-center gap-1.5"><Users size={13} className="text-brand-muted" /> {item.seatsLeft} seats left</p>
                </div>
              </article>
            ))}
          </div>

          {visibleEvents.length === 0 && (
            <p className="text-center text-sm text-brand-muted py-16">No events found for this tag.</p>
          )}
        </main>
      </div>

      <MobileBottomNav />
      <Footer />
    </div>
  )
}
