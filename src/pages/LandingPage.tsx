import { Link } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import { ArrowRight, Layers, Users, Cpu } from 'lucide-react'
import landingPageImage from '../assets/LandingPage.jpeg'

const stats = [
  { value: '150+', label: 'Flexible Spaces' },
  { value: '24/7', label: 'Live Availability' },
  { value: '3', label: 'Main Campuses' },
]

const features = [
  {
    title: 'For Students',
    icon: Users,
    tag1: 'Instant Confirmation',
    tag2: 'Mobile Access',
    desc: 'Secure quiet study spots or collaborative group rooms instantly. Link bookings directly to your project deadlines.',
  },
  {
    title: 'For Staff',
    icon: Layers,
    tag1: 'Bulk Scheduling',
    tag2: 'Resource Catalog',
    desc: 'Manage recurring seminar schedules and laboratory maintenance windows with enterprise-level administrative tools.',
  },
  {
    title: 'Smart Campus',
    icon: Cpu,
    tag1: 'Live Heatmaps',
    tag2: 'Air Quality Data',
    desc: 'Real-time IoT sensors track room occupancy and environment quality to ensure optimal working conditions.',
  },
]

const standards = [
  {
    num: '01',
    title: 'Department Integration',
    desc: 'Access is automatically filtered based on your enrolled degree program or department affiliation.',
  },
  {
    num: '02',
    title: 'Resource Transparency',
    desc: 'Every room profile includes a full inventory of available technology, from 3D printers to VR workstations.',
  },
]

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      {/* Hero */}
      <section
        className="hero-background bg-brand-dark text-white relative overflow-hidden flex flex-col min-h-[100svh]"
        style={{
          backgroundImage: `linear-gradient(rgba(10, 12, 18, 0.82), rgba(10, 12, 18, 0.82)), url(${landingPageImage})`,
        }}
      >
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-24 relative z-10">
          <div className="max-w-2xl">
            <p className="text-brand-primary text-xs font-semibold tracking-widest uppercase mb-3 sm:mb-4">Room Management System</p>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-4 sm:mb-6">
              Space for<br /><span className="text-brand-primary">Excellence.</span>
            </h1>
            <p className="text-gray-300 text-sm sm:text-base leading-relaxed mb-6 sm:mb-8 max-w-lg">
              The official digital gateway to Hochschule Mainz's creative studios, high-tech labs, and collaborative seminar rooms. Empowering students and staff to find the perfect environment for research and innovation.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/rooms" className="btn-accent">
                Find a Room <ArrowRight size={16} />
              </Link>
              <Link to="/signin" className="btn-outline border-white/30 text-white hover:bg-white hover:text-brand-dark">
                Staff Login
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-auto">
          {/* Stats bar */}
          <div className="border-t border-white/10">
            <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 sm:divide-x divide-white/10">
              {stats.map(s => (
                <div key={s.label} className="text-center px-4">
                  <p className="text-2xl font-bold text-brand-primary">{s.value}</p>
                  <p className="text-xs text-gray-400 mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Campus update banner */}
          <div className="bg-brand-navy/85 border-t border-brand-primary/30 backdrop-blur-sm">
            <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-3">
              <div className="mx-auto w-full max-w-3xl flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center sm:text-left sm:justify-start">
                <span className="w-2 h-2 bg-brand-primary rounded-full animate-pulse shrink-0" />
                <span className="text-brand-primary font-medium text-xs uppercase tracking-wide whitespace-nowrap">Campus Update</span>
                <span className="text-gray-300 text-xs sm:text-sm leading-relaxed sm:leading-normal">Lux Pavillon is open for student exhibition bookings until Friday.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Effortless section */}
      <section className="py-12 sm:py-16 md:py-20 bg-white">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8 sm:mb-12">
            <p className="text-brand-primary text-xs font-semibold tracking-widest uppercase mb-2">Effortless Academic Logistics</p>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-brand-dark leading-snug">Streamlined booking processes for every<br className="hidden sm:block" /> member of the Hochschule Mainz community.</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            {features.map(({ title, icon: Icon, tag1, tag2, desc }) => (
              <div key={title} className="card p-6 group hover:shadow-md transition-shadow">
                <div className="w-10 h-10 bg-brand-surface rounded-lg flex items-center justify-center mb-4 group-hover:bg-brand-primary/10 transition-colors">
                  <Icon size={20} className="text-brand-dark" />
                </div>
                <h3 className="font-semibold text-brand-dark mb-2">{title}</h3>
                <p className="text-sm text-brand-muted leading-relaxed mb-4">{desc}</p>
                <div className="flex gap-2 flex-wrap">
                  <span className="badge-available">{tag1}</span>
                  <span className="badge-available">{tag2}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Standards section */}
      <section className="py-12 sm:py-16 md:py-20 bg-brand-surface">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center">
          <div>
            <p className="text-brand-primary text-xs font-semibold tracking-widest uppercase mb-2">Professional Standards</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-brand-dark mb-4">Aligned with Academic Rigor.</h2>
            <p className="text-brand-muted text-sm leading-relaxed">
              Whether you need the specialized equipment of the Engineering Department or the open creative space of Design, our system bridges the gap between your needs and our facilities.
            </p>
          </div>
          <div className="space-y-6">
            {standards.map(s => (
              <div key={s.num} className="flex gap-4">
                <span className="text-brand-primary font-bold text-lg">{s.num}</span>
                <div>
                  <h4 className="font-semibold text-brand-dark mb-1">{s.title}</h4>
                  <p className="text-sm text-brand-muted">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-brand-dark text-white py-12 sm:py-16 md:py-20">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">Advance Your Work.<br />Book Your Space.</h2>
          <p className="text-gray-400 text-sm mb-6 sm:mb-8 max-w-lg mx-auto">
            Connect with the Hochschule Mainz infrastructure. Seamlessly integrated for students, staff, and researchers.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link to="/signin" className="btn-accent">
              Sign in with University ID
            </Link>
            <Link to="/signup" className="btn-outline border-white/30 text-white hover:bg-white hover:text-brand-dark">
              Request Access
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
