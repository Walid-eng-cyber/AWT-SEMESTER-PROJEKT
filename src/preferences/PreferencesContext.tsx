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
  home: string
  rooms: string
  bookings: string
  roomSearch: string
  myBookings: string
  greeting: string
  dashboardIntro: string
  availableHubs: string
  activeBookings: string
  quickBooking: string
  upcoming: string
  past: string
  manageAllBookings: string
  recommendedSpaces: string
  viewAll: string
  confirmed: string
  pending: string
  cancelled: string
  available: string
  inUse: string
  next: string
  seats: string
  bookRoom: string
  activityFeed: string
  exploreCampusMap: string
  filters: string
  building: string
  allMainBuildings: string
  roomType: string
  capacity: string
  any: string
  equipment: string
  applyFilters: string
  noRoomsMatchFilters: string
  loadMoreSpaces: string
  roomDetails: string
  date: string
  time: string
  status: string
  actions: string
  noBookingsFound: string
  rebook: string
  cancel: string
  view: string
  searchBookings: string
  upcomingThisWeek: string
  hoursReserved: string
  nextReservation: string
  signInSubtitle: string
  password: string
  rememberMe: string
  forgotPassword: string
  or: string
  createAccount: string
  createAccountSubtitle: string
  fullName: string
  universityEmail: string
  idNumber: string
  confirm: string
  alreadyHaveAccount: string
  noAccountYet: string
}

interface PreferencesContextValue {
  language: Language
  setLanguage: (language: Language) => void
  t: Dictionary
}

const PREFERENCES_LANGUAGE_KEY = 'awt_pref_language'

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
    home: 'Home',
    rooms: 'Rooms',
    bookings: 'Bookings',
    roomSearch: 'Room Search',
    myBookings: 'My Bookings',
    greeting: 'Good day, Alex.',
    dashboardIntro: 'Your workspace at the School of Design is ready. You have 2 bookings scheduled for today.',
    availableHubs: 'Available Hubs',
    activeBookings: 'Active Bookings',
    quickBooking: 'Quick Booking',
    upcoming: 'Upcoming',
    past: 'Past',
    manageAllBookings: 'Manage All Bookings',
    recommendedSpaces: 'Recommended Spaces',
    viewAll: 'View All',
    confirmed: 'Confirmed',
    pending: 'Pending',
    cancelled: 'Cancelled',
    available: 'Available',
    inUse: 'In Use',
    next: 'Next',
    seats: 'Seats',
    bookRoom: 'Book Room',
    activityFeed: 'Activity Feed',
    exploreCampusMap: 'Explore Campus Map',
    filters: 'Filters',
    building: 'Building',
    allMainBuildings: 'All Main Buildings',
    roomType: 'Room Type',
    capacity: 'Capacity',
    any: 'Any',
    equipment: 'Equipment',
    applyFilters: 'Apply Filters',
    noRoomsMatchFilters: 'No rooms match your filters.',
    loadMoreSpaces: 'Load More Spaces',
    roomDetails: 'Room Details',
    date: 'Date',
    time: 'Time',
    status: 'Status',
    actions: 'Actions',
    noBookingsFound: 'No bookings found.',
    rebook: 'Rebook',
    cancel: 'Cancel',
    view: 'View',
    searchBookings: 'Search bookings...',
    upcomingThisWeek: 'Upcoming This Week',
    hoursReserved: 'Hours Reserved',
    nextReservation: 'Next Reservation',
    signInSubtitle: 'Enter your university credentials to continue.',
    password: 'Password',
    rememberMe: 'Remember me',
    forgotPassword: 'Forgot password?',
    or: 'or',
    createAccount: 'Create Account',
    createAccountSubtitle: 'Enter your details to register for the Room Portal.',
    fullName: 'Full Name',
    universityEmail: 'University Email',
    idNumber: 'ID Number',
    confirm: 'Confirm',
    alreadyHaveAccount: 'Already have an institutional account?',
    noAccountYet: "Don't have an account?",
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
    home: 'Start',
    rooms: 'Räume',
    bookings: 'Buchungen',
    roomSearch: 'Raumsuche',
    myBookings: 'Meine Buchungen',
    greeting: 'Guten Tag, Alex.',
    dashboardIntro: 'Ihr Arbeitsbereich an der School of Design ist bereit. Sie haben heute 2 Buchungen.',
    availableHubs: 'Verfügbare Räume',
    activeBookings: 'Aktive Buchungen',
    quickBooking: 'Schnellbuchung',
    upcoming: 'Bevorstehend',
    past: 'Vergangen',
    manageAllBookings: 'Alle Buchungen verwalten',
    recommendedSpaces: 'Empfohlene Räume',
    viewAll: 'Alle anzeigen',
    confirmed: 'Bestätigt',
    pending: 'Ausstehend',
    cancelled: 'Storniert',
    available: 'Verfügbar',
    inUse: 'Belegt',
    next: 'Nächste',
    seats: 'Plätze',
    bookRoom: 'Raum buchen',
    activityFeed: 'Aktivitäten',
    exploreCampusMap: 'Campusplan öffnen',
    filters: 'Filter',
    building: 'Gebäude',
    allMainBuildings: 'Alle Hauptgebäude',
    roomType: 'Raumtyp',
    capacity: 'Kapazität',
    any: 'Beliebig',
    equipment: 'Ausstattung',
    applyFilters: 'Filter anwenden',
    noRoomsMatchFilters: 'Keine Räume passen zu Ihren Filtern.',
    loadMoreSpaces: 'Mehr Räume laden',
    roomDetails: 'Raumdetails',
    date: 'Datum',
    time: 'Uhrzeit',
    status: 'Status',
    actions: 'Aktionen',
    noBookingsFound: 'Keine Buchungen gefunden.',
    rebook: 'Neu buchen',
    cancel: 'Stornieren',
    view: 'Ansehen',
    searchBookings: 'Buchungen suchen...',
    upcomingThisWeek: 'Diese Woche',
    hoursReserved: 'Reservierte Stunden',
    nextReservation: 'Nächste Reservierung',
    signInSubtitle: 'Melden Sie sich mit Ihren Hochschulzugangsdaten an.',
    password: 'Passwort',
    rememberMe: 'Angemeldet bleiben',
    forgotPassword: 'Passwort vergessen?',
    or: 'oder',
    createAccount: 'Konto erstellen',
    createAccountSubtitle: 'Geben Sie Ihre Daten ein, um sich für das Raumportal zu registrieren.',
    fullName: 'Vollständiger Name',
    universityEmail: 'Hochschul-E-Mail',
    idNumber: 'Matrikelnummer',
    confirm: 'Bestätigen',
    alreadyHaveAccount: 'Haben Sie bereits ein Hochschulkonto?',
    noAccountYet: 'Noch kein Konto?',
  },
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null)

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window === 'undefined') return 'en'
    const value = window.localStorage.getItem(PREFERENCES_LANGUAGE_KEY)
    return value === 'de' ? 'de' : 'en'
  })

  useEffect(() => {
    document.documentElement.lang = language
    window.localStorage.setItem(PREFERENCES_LANGUAGE_KEY, language)
  }, [language])

  const value = useMemo<PreferencesContextValue>(() => ({
    language,
    setLanguage: setLanguageState,
    t: dictionaries[language],
  }), [language])

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>
}

export function usePreferences() {
  const context = useContext(PreferencesContext)
  if (!context) {
    throw new Error('usePreferences must be used inside PreferencesProvider')
  }
  return context
}
