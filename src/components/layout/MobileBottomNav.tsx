import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, Search, CalendarDays, PlusCircle } from 'lucide-react'

const items = [
  { label: 'Home', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Rooms', to: '/rooms', icon: Search },
  { label: 'Bookings', to: '/bookings', icon: CalendarDays },
  { label: 'New', to: '/rooms', icon: PlusCircle },
]

export default function MobileBottomNav() {
  const { pathname } = useLocation()

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-brand-border shadow-[0_-8px_24px_rgba(0,0,0,0.08)]">
      <div className="grid grid-cols-4 h-16">
        {items.map(({ label, to, icon: Icon }) => {
          const active = pathname === to || (to !== '/dashboard' && pathname.startsWith(to))
          return (
            <Link
              key={label}
              to={to}
              className={`flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors ${active ? 'text-brand-dark' : 'text-brand-muted'}`}
            >
              <Icon size={16} className={active ? 'text-brand-primary' : ''} />
              <span>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
