import { createContext, useContext, useEffect, useMemo, useState } from 'react'

type Language = 'en' | 'de'

type Dictionary = {
  dashboard: string
  roomBooking: string
  events: string
  support: string
  notifications: string
  loading: string
  noNotifications: string
  disconnect: string
  signIn: string
  signUp: string
  overview: string
  exploreRooms: string
  reservations: string
  settings: string
  newBooking: string
  help: string
  logOut: string
  userSettings: string
  profilePicture: string
  uploadPicture: string
  removePicture: string
  language: string
  languageEnglish: string
  languageGerman: string
  saved: string
}

interface PreferencesContextValue {
  language: Language
  profileImage: string | null
  setLanguage: (language: Language) => void
  setProfileImage: (imageDataUrl: string | null) => void
  t: Dictionary
}

const PREFERENCES_LANGUAGE_KEY = 'awt_pref_language'
const PREFERENCES_PROFILE_IMAGE_KEY = 'awt_pref_profile_image'

const dictionaries: Record<Language, Dictionary> = {
  en: {
    dashboard: 'Dashboard',
    roomBooking: 'Room Booking',
    events: 'Events',
    support: 'Support',
    notifications: 'Notifications',
    loading: 'Loading...',
    noNotifications: 'No notifications yet.',
    disconnect: 'Disconnect',
    signIn: 'Sign In',
    signUp: 'Sign Up',
    overview: 'Overview',
    exploreRooms: 'Explore Rooms',
    reservations: 'Reservations',
    settings: 'Settings',
    newBooking: 'New Booking',
    help: 'Help',
    logOut: 'Log out',
    userSettings: 'User Settings',
    profilePicture: 'Profile Picture',
    uploadPicture: 'Upload Picture',
    removePicture: 'Remove Picture',
    language: 'Language',
    languageEnglish: 'English',
    languageGerman: 'German',
    saved: 'Saved',
  },
  de: {
    dashboard: 'Dashboard',
    roomBooking: 'Raumbuchung',
    events: 'Veranstaltungen',
    support: 'Support',
    notifications: 'Benachrichtigungen',
    loading: 'Laden...',
    noNotifications: 'Noch keine Benachrichtigungen.',
    disconnect: 'Trennen',
    signIn: 'Anmelden',
    signUp: 'Registrieren',
    overview: 'Übersicht',
    exploreRooms: 'Räume entdecken',
    reservations: 'Reservierungen',
    settings: 'Einstellungen',
    newBooking: 'Neue Buchung',
    help: 'Hilfe',
    logOut: 'Abmelden',
    userSettings: 'Benutzereinstellungen',
    profilePicture: 'Profilbild',
    uploadPicture: 'Bild hochladen',
    removePicture: 'Bild entfernen',
    language: 'Sprache',
    languageEnglish: 'Englisch',
    languageGerman: 'Deutsch',
    saved: 'Gespeichert',
  },
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null)

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window === 'undefined') return 'en'
    const value = window.localStorage.getItem(PREFERENCES_LANGUAGE_KEY)
    return value === 'de' ? 'de' : 'en'
  })

  const [profileImage, setProfileImageState] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null
    return window.localStorage.getItem(PREFERENCES_PROFILE_IMAGE_KEY)
  })

  useEffect(() => {
    document.documentElement.lang = language
    window.localStorage.setItem(PREFERENCES_LANGUAGE_KEY, language)
  }, [language])

  useEffect(() => {
    if (profileImage) {
      window.localStorage.setItem(PREFERENCES_PROFILE_IMAGE_KEY, profileImage)
      return
    }

    window.localStorage.removeItem(PREFERENCES_PROFILE_IMAGE_KEY)
  }, [profileImage])

  const value = useMemo<PreferencesContextValue>(() => ({
    language,
    profileImage,
    setLanguage: setLanguageState,
    setProfileImage: setProfileImageState,
    t: dictionaries[language],
  }), [language, profileImage])

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>
}

export function usePreferences() {
  const context = useContext(PreferencesContext)
  if (!context) {
    throw new Error('usePreferences must be used inside PreferencesProvider')
  }
  return context
}
