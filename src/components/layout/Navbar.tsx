import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Search, Bell, Menu } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import logo from '../../assets/logo.png'
import type { Notification } from '../../api/contracts'
import { listNotifications, markNotificationAsRead } from '../../api/services/notificationsService'
import { clearAccessToken } from '../../api/http'

const links = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Room Booking', to: '/rooms' },
  { label: 'Events', to: '/events' },
  { label: 'Support', to: '/support' },
]

interface NavbarProps {
  authenticated?: boolean
}

export default function Navbar({ authenticated = false }: NavbarProps) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loadingNotifications, setLoadingNotifications] = useState(false)
  const [notificationsError, setNotificationsError] = useState<string | null>(null)

  useEffect(() => {
    if (!authenticated) return

    let cancelled = false

    async function loadNotifications() {
      setLoadingNotifications(true)
      setNotificationsError(null)
      try {
        const data = await listNotifications()
        if (!cancelled) {
          setNotifications(data)
        }
      } catch (error) {
        if (!cancelled) {
          setNotificationsError(error instanceof Error ? error.message : 'Failed to load notifications.')
        }
      } finally {
        if (!cancelled) {
          setLoadingNotifications(false)
        }
      }
    }

    void loadNotifications()
    const poll = window.setInterval(() => {
      void loadNotifications()
    }, 15000)

    return () => {
      cancelled = true
      window.clearInterval(poll)
    }
  }, [authenticated])

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.read).length,
    [notifications],
  )

  function formatAge(createdAt: string) {
    const deltaSeconds = Math.max(0, Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000))
    if (deltaSeconds < 60) return `${deltaSeconds}s ago`
    if (deltaSeconds < 3600) return `${Math.floor(deltaSeconds / 60)}m ago`
    if (deltaSeconds < 86400) return `${Math.floor(deltaSeconds / 3600)}h ago`
    return `${Math.floor(deltaSeconds / 86400)}d ago`
  }

  async function handleNotificationClick(notificationId: string) {
    const target = notifications.find((item) => item.id === notificationId)
    if (!target || target.read) return

    try {
      await markNotificationAsRead(notificationId)
      setNotifications((prev) => prev.map((item) => (
        item.id === notificationId ? { ...item, read: true } : item
      )))
    } catch {
      // Ignore mark-as-read errors and keep local state unchanged.
    }
  }

  function handleDisconnect() {
    clearAccessToken()
    setUserMenuOpen(false)
    setNotificationsOpen(false)
    navigate('/signin')
  }

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
              <div className="relative">
                <button className="relative text-gray-300 hover:text-white" onClick={() => setNotificationsOpen((open) => !open)}>
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-3.5 h-3.5 px-1 bg-brand-primary text-white text-[9px] flex items-center justify-center rounded-full">{unreadCount}</span>
                  )}
                </button>
                {notificationsOpen && (
                  <div className="absolute top-8 right-0 w-80 max-h-96 overflow-y-auto rounded-lg border border-brand-border bg-white text-brand-dark shadow-xl z-50">
                  <div className="px-4 py-3 border-b border-brand-border">
                    <p className="text-xs font-semibold uppercase tracking-wide text-brand-muted">Notifications</p>
                  </div>
                  {loadingNotifications && <p className="px-4 py-3 text-xs text-brand-muted">Loading...</p>}
                  {notificationsError && <p className="px-4 py-3 text-xs text-red-600">{notificationsError}</p>}
                  {!loadingNotifications && !notificationsError && notifications.length === 0 && (
                    <p className="px-4 py-3 text-xs text-brand-muted">No notifications yet.</p>
                  )}
                  {!loadingNotifications && !notificationsError && notifications.map((item) => (
                    <button
                      key={item.id}
                      className={`w-full text-left px-4 py-3 border-b border-brand-border/60 hover:bg-brand-surface ${item.read ? 'bg-white' : 'bg-brand-surface/70'}`}
                      onClick={() => void handleNotificationClick(item.id)}
                    >
                      <p className="text-xs font-semibold text-brand-dark">{item.title}</p>
                      <p className="text-xs text-brand-muted mt-1">{item.message}</p>
                      <p className="text-[10px] text-brand-muted mt-2">{formatAge(item.createdAt)}</p>
                    </button>
                  ))}
                  </div>
                )}
              </div>
              <div className="relative">
                <button
                  className="w-8 h-8 rounded-full bg-brand-primary flex items-center justify-center text-white text-xs font-semibold"
                  onClick={() => setUserMenuOpen((open) => !open)}
                  aria-label="Open user menu"
                >
                  AM
                </button>
                {userMenuOpen && (
                  <div className="absolute top-10 right-0 min-w-40 rounded-lg border border-brand-border bg-white text-brand-dark shadow-xl z-50 overflow-hidden">
                    <button
                      className="w-full text-left px-4 py-2.5 text-xs font-semibold hover:bg-brand-surface"
                      onClick={handleDisconnect}
                    >
                      Disconnect
                    </button>
                  </div>
                )}
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
              <Link to="/signin" className="text-sm text-gray-300 hover:text-white transition-colors">Sign In</Link>
              <Link to="/signup" className="btn-accent text-xs px-4 py-2">Sign Up</Link>
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
              <Link to="/signin" className="text-sm text-gray-300" onClick={() => setMenuOpen(false)}>Sign In</Link>
              <Link to="/signup" className="text-sm text-brand-primary" onClick={() => setMenuOpen(false)}>Sign Up</Link>
            </div>
          )}
        </div>
      )}
    </header>
  )
}
