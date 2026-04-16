import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import logo from '../assets/logo.png'

export default function SignIn() {
  const [showPw, setShowPw] = useState(false)
  const [remember, setRemember] = useState(false)

  return (
    <div className="min-h-screen flex flex-col">
      {/* Split layout */}
      <div className="flex flex-1">

        {/* Left panel – brand */}
        <div className="hidden lg:flex flex-col justify-between w-1/2 bg-brand-dark text-white p-12 relative overflow-hidden">
          {/* Grid texture */}
          <div className="absolute inset-0 opacity-5 pointer-events-none" style={{backgroundImage:'repeating-linear-gradient(90deg,#A5CD39 0px,#A5CD39 1px,transparent 1px,transparent 80px),repeating-linear-gradient(180deg,#A5CD39 0px,#A5CD39 1px,transparent 1px,transparent 80px)'}} />

          <div className="relative z-10">
            <Link to="/">
              <img src={logo} alt="Hochschule Mainz" className="h-36 brightness-0 invert" />
            </Link>
          </div>

          <div className="relative z-10 max-w-sm">
            <p className="text-xs font-semibold tracking-widest text-brand-primary uppercase mb-4">Hochschule Mainz</p>
            <h1 className="text-4xl font-bold leading-tight mb-4">
              The Academic<br /><span className="text-brand-primary">Curator.</span>
            </h1>
            <p className="text-gray-400 text-sm leading-relaxed">
              Managing intellectual space through intentional design. Access the Room Management Portal to coordinate university facilities, seminar rooms, and lecture halls.
            </p>
          </div>

          <p className="relative z-10 text-xs text-gray-600">Room Management Portal v2.0</p>
        </div>

        {/* Right panel – form */}
        <div className="flex-1 flex flex-col justify-center items-center bg-brand-surface px-4 sm:px-6 py-8 sm:py-12">
          <div className="w-full max-w-sm">
            {/* Mobile brand */}
            <Link to="/" className="lg:hidden block text-center mb-8">
              <img src={logo} alt="Hochschule Mainz" className="h-36 mx-auto" />
            </Link>

            <h2 className="text-2xl font-bold text-brand-dark mb-1">Sign In</h2>
            <p className="text-sm text-brand-muted mb-8">Enter your university credentials to continue.</p>

            <form className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-brand-dark mb-1.5 tracking-wide uppercase">Email / University ID</label>
                <input type="text" className="input-field" placeholder="name@hs-mainz.de" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-dark mb-1.5 tracking-wide uppercase">Password</label>
                <div className="relative">
                  <input type={showPw ? 'text' : 'password'} className="input-field pr-10" placeholder="••••••••" />
                  <button
                    type="button"
                    onClick={() => setShowPw(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-dark transition-colors"
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={e => setRemember(e.target.checked)}
                    className="w-4 h-4 accent-brand-dark"
                  />
                  <span className="text-brand-muted text-xs">Remember me</span>
                </label>
                <a href="#" className="text-xs text-brand-primary hover:underline">Forgot password?</a>
              </div>

              <button type="submit" className="btn-primary w-full">Sign In</button>
            </form>

            {/* Divider */}
            <div className="relative flex items-center my-6">
              <div className="flex-1 border-t border-brand-border" />
              <span className="mx-3 text-xs text-brand-muted">or</span>
              <div className="flex-1 border-t border-brand-border" />
            </div>

            {/* External access */}
            <p className="text-xs font-semibold tracking-widest text-brand-muted uppercase text-center mb-3">External Access</p>
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button className="btn-outline text-xs py-2 px-3">
                EduGAIN
              </button>
              <button className="btn-outline text-xs py-2 px-3">
                Guest ID
              </button>
            </div>

            <p className="text-xs text-center text-brand-muted">
              Don't have an account?{' '}
              <Link to="/signup" className="text-brand-dark font-semibold hover:underline">Register your ID</Link>
            </p>
          </div>
        </div>
      </div>

      {/* Footer strip */}
      <div className="bg-brand-dark text-center py-3">
        <div className="flex flex-wrap justify-center gap-4 text-xs text-gray-500">
          <span className="text-gray-400">© 2024 Hochschule Mainz University of Applied Sciences</span>
          <a href="#" className="hover:text-gray-300">Privacy Policy</a>
          <a href="#" className="hover:text-gray-300">Legal Notice</a>
          <a href="#" className="hover:text-gray-300">Accessibility</a>
          <a href="#" className="hover:text-gray-300">Contact</a>
        </div>
      </div>
    </div>
  )
}
