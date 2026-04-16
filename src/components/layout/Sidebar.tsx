import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, Search, CalendarDays, Settings, PlusCircle, HelpCircle, LogOut } from 'lucide-react'
import logo from '../../assets/logo.png'

const navItems = [
  { label: 'Overview', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Explore Rooms', to: '/rooms', icon: Search },
  { label: 'Reservations', to: '/bookings', icon: CalendarDays },
  { label: 'Settings', to: '/settings', icon: Settings },
]

export default function Sidebar() {
  const { pathname } = useLocation()

  return (
    <aside className="hidden lg:flex flex-col w-56 bg-white border-r border-brand-border min-h-screen shrink-0">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-brand-border">
        <img src={logo} alt="Hochschule Mainz" className="h-28" />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ label, to, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className={`sidebar-link${pathname.startsWith(to) ? ' active' : ''}`}
          >
            <Icon size={16} />
            {label}
          </Link>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 border-t border-brand-border space-y-1">
        <Link to="/rooms/new" className="sidebar-link">
          <PlusCircle size={16} />
          New Booking
        </Link>
        <a href="#" className="sidebar-link">
          <HelpCircle size={16} />
          Help
        </a>
        <Link to="/" className="sidebar-link">
          <LogOut size={16} />
          Log out
        </Link>
      </div>
    </aside>
  )
}
