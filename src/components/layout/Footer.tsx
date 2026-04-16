import { Link } from 'react-router-dom'
import logo from '../../assets/logo.png'

export default function Footer() {
  return (
    <footer className="bg-brand-dark text-white mt-auto">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 text-sm">
        {/* Brand */}
        <div>
          <img src={logo} alt="Hochschule Mainz" className="h-36 mb-3 brightness-0 invert" />
          <p className="text-gray-400 text-xs leading-relaxed">
            Official room management and resource allocation platform for the University of Applied Sciences Mainz.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <p className="text-xs font-semibold tracking-widest text-brand-muted uppercase mb-3">Quick Links</p>
          <ul className="space-y-2 text-gray-400 text-xs">
            <li><Link to="/rooms" className="hover:text-white transition-colors">Room Search</Link></li>
            <li><Link to="/bookings" className="hover:text-white transition-colors">My Bookings</Link></li>
            <li><Link to="/dashboard" className="hover:text-white transition-colors">Dashboard</Link></li>
          </ul>
        </div>

        {/* Locations */}
        <div>
          <p className="text-xs font-semibold tracking-widest text-brand-muted uppercase mb-3">Locations</p>
          <ul className="space-y-2 text-gray-400 text-xs">
            <li>Main Campus</li>
            <li>Holzstraße Campus</li>
            <li>Lucy-Hillebrand-Str.</li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <p className="text-xs font-semibold tracking-widest text-brand-muted uppercase mb-3">Contact</p>
          <ul className="space-y-2 text-gray-400 text-xs">
            <li>Library</li>
            <li>IT-Services</li>
            <li>Help Desk</li>
            <li>FAQ</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
          <span className="text-center sm:text-left">© 2024 Hochschule Mainz University of Applied Sciences.</span>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            <a href="#" className="hover:text-gray-300 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-gray-300 transition-colors">Legal Notice</a>
            <a href="#" className="hover:text-gray-300 transition-colors">Imprint</a>
            <a href="#" className="hover:text-gray-300 transition-colors">Accessibility</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
