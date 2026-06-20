import { useRef, useState, type ChangeEvent } from 'react'
import Navbar from '../components/layout/Navbar'
import Sidebar from '../components/layout/Sidebar'
import Footer from '../components/layout/Footer'
import MobileBottomNav from '../components/layout/MobileBottomNav'
import { usePreferences } from '../preferences/PreferencesContext'

export default function SettingsPage() {
  const { language, profileImage, setLanguage, setProfileImage, t } = usePreferences()
  const [saved, setSaved] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  function flashSaved() {
    setSaved(true)
    window.setTimeout(() => setSaved(false), 1500)
  }

  function handleFilePicked(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : null
      setProfileImage(result)
      flashSaved()
    }
    reader.readAsDataURL(file)
  }

  function removeImage() {
    setProfileImage(null)
    flashSaved()
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar authenticated />
      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 overflow-y-auto">
          <div className="mb-8">
            <p className="text-xs text-brand-muted mb-1">Portal &rsaquo; <span className="text-brand-dark font-medium">{t.settings}</span></p>
            <h1 className="text-2xl font-bold text-brand-dark">{t.userSettings}</h1>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <section className="card p-6">
              <h2 className="text-sm font-semibold text-brand-dark mb-4">{t.profilePicture}</h2>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full border border-brand-border overflow-hidden bg-brand-surface flex items-center justify-center">
                  {profileImage ? (
                    <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs text-brand-muted">No image</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button className="btn-primary text-xs py-2 px-3" onClick={() => fileInputRef.current?.click()}>{t.uploadPicture}</button>
                  <button className="btn-outline text-xs py-2 px-3" onClick={removeImage}>{t.removePicture}</button>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFilePicked}
              />
            </section>

            <section className="card p-6">
              <h2 className="text-sm font-semibold text-brand-dark mb-4">{t.language}</h2>
              <div className="flex items-center gap-2">
                <button
                  className={`px-3 py-2 rounded border text-xs font-semibold ${language === 'en' ? 'bg-brand-dark text-white border-brand-dark' : 'border-brand-border text-brand-muted hover:text-brand-dark'}`}
                  onClick={() => {
                    setLanguage('en')
                    flashSaved()
                  }}
                >
                  {t.languageEnglish}
                </button>
                <button
                  className={`px-3 py-2 rounded border text-xs font-semibold ${language === 'de' ? 'bg-brand-dark text-white border-brand-dark' : 'border-brand-border text-brand-muted hover:text-brand-dark'}`}
                  onClick={() => {
                    setLanguage('de')
                    flashSaved()
                  }}
                >
                  {t.languageGerman}
                </button>
              </div>
            </section>
          </div>

          {saved && <p className="text-xs text-emerald-700 mt-4">{t.saved}</p>}
        </main>
      </div>
      <MobileBottomNav />
      <Footer />
    </div>
  )
}
