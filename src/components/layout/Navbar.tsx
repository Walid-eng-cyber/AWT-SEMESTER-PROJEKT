import { Link, useLocation } from 'react-router-dom'
import { Search, Bell, Menu } from 'lucide-react'
import { useState } from 'react'
import logo from '../../assets/logo.png'
import { usePreferences } from '../../preferences/PreferencesContext'

interface NavbarProps {
  authenticated?: boolean
}

export default function Navbar({ authenticated = false }: NavbarProps) {
  const { pathname } = useLocation()
  const { t } = usePreferences()
  const [menuOpen, setMenuOpen] = useState(false)

  const links = [
    { label: t.dashboard, to: '/dashboard' },
    { label: t.roomBooking, to: '/rooms' },
    { label: t.events, to: '/events' },
    { label: t.support, to: '/support' },
  ]

  return (
    <header className="bg-brand-dark text-white sticky top-0 z-50">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3 sm:gap-4">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <img src={logo} alt="Hochschule Mainz" className="h-24 brightness-0 invert" />
        </Link>

        {authenticated ? (
          <>
            {/* Auth nav */}
            <nav className="hidden md:flex items-center gap-6">
              {links.map(({ label, to }) => (
                <Link
                  key={to}
                  to={to}
                  className={`text-sm transition-colors ${pathname.startsWith(to) ? 'text-brand-primary' : 'text-gray-300 hover:text-white'}`}
                >
                  {label}
                </Link>
              ))}
            </nav>

            {/* Right */}
            <div className="hidden md:flex items-center gap-3">
              <div className="relative hidden md:block">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Quick search..."
                  className="bg-white/10 text-white placeholder-gray-400 text-xs pl-8 pr-3 py-1.5 rounded focus:outline-none focus:ring-1 focus:ring-brand-primary w-44"
                />
              </div>
              <button className="relative text-gray-300 hover:text-white">
                <Bell size={18} />
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-brand-primary text-white text-[9px] flex items-center justify-center rounded-full">3</span>
              </button>
              <div className="w-8 h-8 rounded-full bg-brand-primary overflow-hidden flex items-center justify-center text-white text-xs font-semibold">
                AM
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Public nav */}
            <nav className="hidden md:flex items-center gap-6">
              {links.map(({ label, to }) => (
                <Link key={to} to={to} className="text-sm text-gray-300 hover:text-white transition-colors">
                  {label}
                </Link>
              ))}
            </nav>
            <div className="hidden md:flex items-center gap-3">
              <Link to="/signin" className="text-sm text-gray-300 hover:text-white transition-colors">{t.signIn}</Link>
              <Link to="/signup" className="btn-accent text-xs px-4 py-2">{t.signUp}</Link>
            </div>
          </>
        )}

        {/* Mobile menu toggle */}
        <button className="md:hidden text-gray-300 shrink-0" onClick={() => setMenuOpen(o => !o)}>
          <Menu size={20} />
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="md:hidden bg-brand-navy border-t border-white/10 px-4 py-3 space-y-2">
          {links.map(({ label, to }) => (
            <Link key={to} to={to} onClick={() => setMenuOpen(false)} className="block text-sm text-gray-300 py-1">
              {label}
            </Link>
          ))}
          {!authenticated && (
            <div className="pt-2 flex gap-3">
              <Link to="/signin" className="text-sm text-gray-300" onClick={() => setMenuOpen(false)}>{t.signIn}</Link>
              <Link to="/signup" className="text-sm text-brand-primary" onClick={() => setMenuOpen(false)}>{t.signUp}</Link>
            </div>
          )}
        </div>
      )}
    </header>
  )
}
