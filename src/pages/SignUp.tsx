import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye, EyeOff, ShieldCheck, Clock } from 'lucide-react'
import logo from '../assets/logo.png'
import { usePreferences } from '../preferences/PreferencesContext'

export default function SignUp() {
  const [showPw, setShowPw] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const { t } = usePreferences()

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex flex-1">

        {/* Left panel */}
        <div className="hidden lg:flex flex-col justify-between w-2/5 bg-brand-dark text-white p-12 relative overflow-hidden">
          <div className="absolute inset-0 opacity-5 pointer-events-none" style={{backgroundImage:'repeating-linear-gradient(90deg,#A5CD39 0px,#A5CD39 1px,transparent 1px,transparent 80px),repeating-linear-gradient(180deg,#A5CD39 0px,#A5CD39 1px,transparent 1px,transparent 80px)'}} />

          <div className="relative z-10">
            <Link to="/">
              <img src={logo} alt="Hochschule Mainz" className="h-36 brightness-0 invert" />
            </Link>
          </div>

          <div className="relative z-10">
            <p className="text-xs font-semibold tracking-widest text-brand-primary uppercase mb-4">Hochschule Mainz</p>
            <h1 className="text-4xl font-bold leading-tight mb-4">
              The Academic<br /><span className="text-brand-primary">Curator</span>
            </h1>
            <p className="text-gray-400 text-sm leading-relaxed mb-8">
              Join the central node for spatial management. Register to access laboratory booking, seminar room reservations, and academic event coordination.
            </p>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-brand-primary/20 rounded-lg flex items-center justify-center shrink-0">
                  <ShieldCheck size={16} className="text-brand-primary" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">University Verified Credentials</p>
                  <p className="text-xs text-gray-500">Secure institutional access</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-brand-primary/20 rounded-lg flex items-center justify-center shrink-0">
                  <Clock size={16} className="text-brand-primary" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">Real-time Resource Scheduling</p>
                  <p className="text-xs text-gray-500">Live availability across all campuses</p>
                </div>
              </div>
            </div>
          </div>

          <p className="relative z-10 text-xs text-gray-600">Hochschule Mainz Room Portal</p>
        </div>

        {/* Right panel – form */}
        <div className="flex-1 flex flex-col justify-center items-center bg-brand-surface px-4 sm:px-6 py-8 sm:py-12 overflow-y-auto">
          <div className="w-full max-w-md">
            <Link to="/" className="lg:hidden block text-center mb-8">
              <img src={logo} alt="Hochschule Mainz" className="h-36 mx-auto" />
            </Link>

            <h2 className="text-2xl font-bold text-brand-dark mb-1">{t.createAccount}</h2>
            <p className="text-sm text-brand-muted mb-8">{t.createAccountSubtitle}</p>

            <form className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-brand-dark mb-1.5 tracking-wide uppercase">{t.fullName}</label>
                <input type="text" className="input-field" placeholder="e.g. Johannes Gutenberg" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-dark mb-1.5 tracking-wide uppercase">{t.universityEmail}</label>
                <input type="email" className="input-field" placeholder="student@hs-mainz.de" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-dark mb-1.5 tracking-wide uppercase">{t.idNumber}</label>
                <input type="text" className="input-field" placeholder="7-digit matriculation number" maxLength={7} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-brand-dark mb-1.5 tracking-wide uppercase">{t.password}</label>
                  <div className="relative">
                    <input type={showPw ? 'text' : 'password'} className="input-field pr-10" placeholder="••••••••" />
                    <button type="button" onClick={() => setShowPw(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-dark">
                      {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-dark mb-1.5 tracking-wide uppercase">{t.confirm}</label>
                  <div className="relative">
                    <input type={showConfirm ? 'text' : 'password'} className="input-field pr-10" placeholder="••••••••" />
                    <button type="button" onClick={() => setShowConfirm(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-dark">
                      {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
              </div>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={e => setAgreed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-brand-dark shrink-0"
                />
                <span className="text-xs text-brand-muted leading-relaxed">
                  I agree to the{' '}
                  <a href="#" className="text-brand-dark font-semibold hover:underline">Terms of Service</a>
                  {' '}and{' '}
                  <a href="#" className="text-brand-dark font-semibold hover:underline">Data Protection Policy</a>.
                </span>
              </label>

              <button type="submit" disabled={!agreed} className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed">
                {t.createAccount}
              </button>
            </form>

            <p className="text-xs text-center text-brand-muted mt-6">
              {t.alreadyHaveAccount}{' '}
              <Link to="/signin" className="text-brand-dark font-semibold hover:underline">{t.signIn}</Link>
            </p>
          </div>
        </div>
      </div>

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
