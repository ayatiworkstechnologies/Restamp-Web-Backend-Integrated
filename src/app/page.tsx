import Link from 'next/link';
import {
  ArrowRight,
  House,
  MapPin,
  ShieldCheck,
  HeartHandshake,
  Sparkles,
  Compass,
  KeyRound,
  Building2,
} from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import SearchPanel from '@/components/home/SearchPanel';
import FeaturedHomesSection from '@/components/home/FeaturedHomesSection';
import ExploreLinksSection from '@/components/home/ExploreLinksSection';
import HomeAnimations from '@/components/home/HomeAnimations';
import RecentlyAddedSection, { VerifiedPropertiesSection } from '@/components/home/RecentlyAddedSection';

const categories = [
  { name: 'Buy a home', url: '/buy', img: '/images/cat-buy.jpg' },
  { name: 'Rent a home', url: '/rent', img: '/images/cat-rent.jpg' },
  { name: 'New projects', url: '/projects', img: '/images/cat-projects.jpg' },
  { name: 'Plots & land', url: '/buy', img: '/images/cat-plots.jpg' },
  { name: 'Commercial', url: '/buy', img: '/images/cat-commercial.jpg' },
  { name: 'Sell your property', url: '/sell', img: '/images/cat-sell.jpg' },
];

const chennaiLocalities = [
  {
    name: 'Anna Nagar',
    tag: 'Upscale & tree-lined avenues',
    img: '/images/locality-annanagar.jpg',
  },
  {
    name: 'Adyar',
    tag: 'Lush green South Chennai',
    img: '/images/locality-adyar.jpg',
  },
  {
    name: 'OMR (IT Corridor)',
    tag: 'Gated communities & tech parks',
    img: '/images/locality-omr.jpg',
  },
  {
    name: 'Besant Nagar',
    tag: 'Beachside & coastal living',
    img: '/images/locality-besantnagar.jpg',
  },
  {
    name: 'ECR (East Coast Road)',
    tag: 'Luxury villas & sea breeze',
    img: '/images/locality-ecr.jpg',
  },
  {
    name: 'Velachery',
    tag: 'Prime hub & metro connectivity',
    img: '/images/locality-velachery.jpg',
  },
];

export default function HomePage() {
  return (
    <>
      <Header />
      <main className="bg-slate-50">
        {/* Hero Section */}
        <section
          className="h-[600px] bg-cover bg-center flex items-start justify-center text-center pt-16 md:pt-20 relative overflow-hidden"
          style={{
            backgroundImage: 'url(/images/hero-bg.jpg)',
          }}
        >
          {/* Luminous Animated Radial Ambient Orbs */}
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-sky-500/20 rounded-full blur-3xl pointer-events-none animate-ambient-glow" />
          <div className="absolute top-1/2 -right-32 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none animate-ambient-glow delay-300" />


          <div className="text-white px-5 z-10 max-w-3xl mx-auto">
            <div className="animate-hero-fade-up inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 text-white text-[11px] sm:text-xs font-bold tracking-[0.22em] px-3.5 py-1.5 rounded-full mb-4 shadow-sm transition">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-glow" />
              WELCOME TO RESTAMP
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[54px] font-extrabold leading-[1.15] sm:leading-[1.12] tracking-tight text-white animate-hero-fade-up delay-150">
              Find your next home.
              <br />
              <span className="bg-gradient-to-r from-white via-sky-100 to-sky-200 bg-clip-text text-transparent">
                Make it your own.
              </span>
            </h1>
            <p className="mt-3.5 sm:mt-4 text-sm sm:text-base text-white/95 max-w-lg mx-auto font-medium leading-relaxed animate-hero-fade-up delay-300">
              A place to live. A space to grow. A home to love.
            </p>
          </div>
        </section>

        {/* Search Panel */}
        <div className="container-site animate-hero-fade-up delay-450 relative z-30">
          <SearchPanel />
          <p className="text-center text-[11px] text-slate-400 mt-5 font-medium tracking-wide">
            Buy · Rent · Resale · New projects · Commercial
          </p>
        </div>

        {/* Categories Section */}
        <section className="container-site py-16">
          <p className="eyebrow text-center">Whatever your next move, start here</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 sm:gap-5 mt-7">
            {categories.map((cat) => (
              <Link
                href={cat.url}
                key={cat.name}
                className="text-center group block hover-lift transition duration-300"
              >
                <div className="overflow-hidden rounded-2xl bg-slate-100 aspect-[4/3] shadow-sm group-hover:shadow-xl group-hover:shadow-sky-500/15 transition duration-300 relative border border-slate-100">
                  <img
                    src={cat.img}
                    alt={cat.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/35 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                <span className="text-xs font-semibold block mt-3 text-slate-700 group-hover:text-[#087ed9] transition-colors duration-200">
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Home Journey Section */}
        <section className="container-site pb-20">
          <div className="text-center mb-8">
            <p className="eyebrow">Your home journey starts with the choices</p>
            <h2 className="section-title mt-2">
              Better places to live.
              <br />
              More possibilities to explore.
            </h2>
          </div>

          {/* Blueprint Banner Card matching Your-home-journey.png */}
          <div className="relative w-full rounded-[24px] sm:rounded-[32px] overflow-hidden bg-[#0074ce] shadow-xl text-white min-h-[440px] sm:min-h-[400px] md:min-h-[380px] lg:min-h-[420px] group">
            {/* High-resolution 2x background graphic with building cutout and blueprint grid */}
            <div
              className="absolute inset-0 w-full h-full bg-no-repeat bg-right bg-cover pointer-events-none group-hover:scale-[1.01] transition-transform duration-500 ease-out"
              style={{
                backgroundImage: `url('/images/your-home-journey@2x.png')`,
              }}
            />

            {/* Top Right Floating Pill: Post property FREE */}
            <Link
              href="/sell"
              aria-label="Post property for free"
              className="absolute top-4 sm:top-6 lg:top-7 right-4 sm:right-7 lg:right-9 z-20 inline-flex items-center gap-1.5 sm:gap-2 bg-white hover:bg-slate-50 text-slate-900 text-xs sm:text-sm font-semibold px-3 sm:px-4 py-1.5 sm:py-2.5 rounded-xl shadow-md hover:shadow-xl hover:scale-105 active:scale-[0.97] transition duration-200"
            >
              <span>Post property</span>
              <span className="bg-[#00a862] text-white text-[10px] sm:text-xs font-bold px-1.5 py-0.5 rounded tracking-wide animate-pulse">
                FREE
              </span>
            </Link>

            {/* Left Content Area */}
            <div className="relative z-10 flex flex-col justify-center h-full pt-16 pb-8 sm:py-8 md:py-10 lg:py-12 px-6 sm:px-8 md:px-10 lg:px-12 w-full max-w-full md:max-w-[55%] lg:max-w-[550px]">
              {/* Eyebrow badge with floating animation */}
              <div className="inline-block self-start mb-3 sm:mb-5">
                <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-md bg-[#005fb8]/60 border border-white/20 text-white text-[10px] sm:text-[11px] font-bold tracking-[0.18em] uppercase backdrop-blur-xs">
                  <Sparkles size={11} className="text-sky-200" />
                  BUY A HOME
                </span>
              </div>

              {/* Title */}
              <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-[42px] font-extrabold text-white tracking-tight leading-[1.16]">
                Not just a property.
                <br />
                Your kind of place.
              </h3>

              {/* Subtitle */}
              <p className="text-white/90 text-xs sm:text-sm md:text-[15px] leading-relaxed mt-3 sm:mt-4 max-w-md font-normal">
                From your first apartment to a little more room for everyone.
                Find a home that fits the life you want to live.
              </p>

              {/* CTA Button */}
              <div className="mt-5 sm:mt-8">
                <Link
                  href="/buy"
                  className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-[#0074ce] hover:text-[#005fa8] text-xs sm:text-sm md:text-[15px] font-bold px-5 sm:px-7 py-3 sm:py-3.5 rounded-xl shadow-lg hover:shadow-2xl hover:-translate-y-0.5 active:translate-y-0 transition duration-200 group/btn"
                >
                  <span>Explore homes to buy</span>
                  <ArrowRight size={16} className="group-hover/btn:translate-x-1.5 transition-transform duration-200" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Recommended Projects */}
        <FeaturedHomesSection />

        {/* Quick Links Banner */}
        <section className="container-site py-12">
          <div className="mb-7 max-w-2xl">
            <p className="eyebrow">Start your journey</p>
            <h2 className="section-title mt-2">Whatever you're looking for, start here</h2>
            <p className="text-sm text-slate-600 mt-3 leading-relaxed">
              Buy your first home, find a rental that fits or discover brand-new projects — pick a path and we'll take it from there.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Compass, title: 'What does your next move look like?', cta: 'Start exploring', href: '/buy' },
              { icon: House, title: 'A home of your own', cta: 'Explore homes', href: '/buy' },
              { icon: KeyRound, title: 'A fresh new start', cta: 'Explore rentals', href: '/rent' },
              { icon: Building2, title: 'Something brand new', cta: 'Explore projects', href: '/projects' },
            ].map(({ icon: I, title, cta, href }) => (
              <Link
                href={href}
                key={title}
                className="group flex flex-col justify-between gap-6 rounded-[16px] bg-white border border-slate-100 p-5 sm:p-6 min-h-[180px] transition duration-300 hover:-translate-y-1 hover:border-sky-100 hover:shadow-xl hover:shadow-slate-200/60"
              >
                <div>
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#087ed9] text-white shadow-sm shadow-[#087ed9]/25 transition-transform duration-300 group-hover:scale-110">
                    <I size={22} strokeWidth={2} />
                  </span>
                  <h3 className="mt-4 text-base font-semibold leading-snug text-slate-900">{title}</h3>
                </div>
                <span className="flex items-center justify-between text-sm font-semibold text-[#087ed9]">
                  {cta}
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-sky-50 transition duration-300 group-hover:bg-[#087ed9] group-hover:text-white">
                    <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-0.5" />
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Recently Added */}
        <RecentlyAddedSection />

        {/* Verified Properties */}
        <VerifiedPropertiesSection />

        {/* New Projects & Communities */}
        <section className="container-site py-20">
          <p className="eyebrow">Built for a better tomorrow</p>
          <h2 className="section-title mt-2 mb-7">Discover new beginnings</h2>
          <div className="relative rounded-2xl overflow-hidden shadow-sm group">
            <img
              src="/images/apartments.jpg"
              alt="New residential development"
              className="h-80 md:h-96 w-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-transparent flex items-end p-8 md:p-12">
              <div className="text-white max-w-lg">
                <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md border border-white/20 text-sky-200 text-xs px-3 py-1 rounded-full mb-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-glow" />
                  <span className="tracking-wider font-bold">DISCOVER NEW PROJECTS</span>
                </div>
                <h3 className="text-2xl md:text-3xl font-bold mt-1">
                  A community you’ll love coming home to
                </h3>
                <Link
                  href="/projects"
                  className="inline-flex items-center gap-2 mt-4 text-sm font-semibold text-white underline underline-offset-4 hover:text-sky-200 transition group/btn"
                >
                  <span>Explore projects</span>
                  <ArrowRight size={14} className="group-hover/btn:translate-x-1.5 transition-transform duration-200" />
                </Link>
              </div>
            </div>
          </div>

        </section>

        {/* Explore Chennai Localities */}
        <section className="container-site pb-20">
          <p className="eyebrow">Find your corner of Chennai</p>
          <h2 className="section-title mt-2 mb-6">Explore popular localities</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5">
            {chennaiLocalities.map((loc) => (
              <Link
                href={'/buy?city=Chennai&locality=' + encodeURIComponent(loc.name)}
                key={loc.name}
                className="flex items-center gap-4 border border-[#f0f0f0] rounded-2xl p-4 sm:p-5 hover:border-sky-300 hover:shadow-xl hover:shadow-sky-500/10 hover:-translate-y-1.5 transition duration-300 bg-white group min-h-[86px]"
              >
                <div className="overflow-hidden rounded-xl h-16 w-16 sm:h-17 sm:w-17 shrink-0">
                  <img
                    src={loc.img}
                    alt={loc.name}
                    className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-[15px] sm:text-base font-bold text-slate-900 group-hover:text-[#087ed9] transition-colors duration-200 truncate">
                    {loc.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">
                    {loc.tag}
                  </p>
                </div>
                <ArrowRight
                  size={17}
                  className="text-slate-400 group-hover:text-[#087ed9] group-hover:translate-x-1.5 transition duration-200 shrink-0"
                />
              </Link>
            ))}
          </div>
        </section>


        {/* Trust & Confidence Section */}
        <section className="container-site pb-20">
          <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-10 lg:gap-16 items-center rounded-[24px] bg-white border border-slate-100 p-6 sm:p-10 lg:p-14">
            <div>
              <p className="eyebrow">More than a property search</p>
              <h2 className="section-title mt-3">
                A little more confidence.
                <br />
                Every step of the way.
              </h2>
              <p className="text-sm text-slate-600 mt-4 leading-relaxed max-w-md">
                From the first search to the final handshake, Restamp keeps every decision clear, verified and simple.
              </p>
            </div>
            <div className="grid sm:grid-cols-3 lg:grid-cols-1 gap-4">
              {[
                [MapPin, 'Find what feels right', 'Search by neighbourhood, budget and lifestyle to shortlist homes that truly fit.'],
                [ShieldCheck, 'The details that matter', 'Verified listings, transparent pricing and owner details — no surprises later.'],
                [HeartHandshake, 'Your next move, simplified', 'Connect directly, schedule visits and close the deal with guidance at every step.'],
              ].map(([Icon, label, desc], i) => {
                const I = Icon as typeof MapPin;
                return (
                  <div
                    key={i}
                    className="group flex flex-col lg:flex-row gap-4 lg:items-center p-5 rounded-[16px] bg-slate-50 border border-slate-100 hover:bg-white hover:border-sky-100 hover:shadow-lg hover:shadow-slate-200/60 transition duration-300"
                  >
                    <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-sky-100 text-[#087ed9] group-hover:bg-[#087ed9] group-hover:text-white transition-colors duration-300">
                      <I size={22} />
                    </span>
                    <div className="flex-1">
                      <h3 className="text-base font-semibold text-slate-900">{label as string}</h3>
                      <p className="text-sm text-slate-500 mt-1 leading-relaxed">{desc as string}</p>
                    </div>
                    <span className="hidden lg:block text-2xl font-extrabold text-slate-200 group-hover:text-sky-200 transition-colors">
                      0{i + 1}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Mobile App Download Section */}
        <section id="download-app" className="container-site pb-20">
          <div className="relative w-full rounded-[24px] sm:rounded-[32px] overflow-hidden bg-[#0074ce] shadow-xl text-white min-h-[380px] sm:min-h-[400px] lg:min-h-[420px] group">
            {/* High-definition smartphone mockup graphic pinned cleanly as background */}
            <div
              className="absolute inset-0 w-full h-full bg-no-repeat bg-right bg-cover pointer-events-none group-hover:scale-[1.01] transition-transform duration-500 ease-out"
              style={{
                backgroundImage: `url('/images/mobile-app@2x.webp')`,
                imageRendering: '-webkit-optimize-contrast',
              }}
            />

            {/* Floating Ratings Pill Badge */}
            <div className="hidden sm:inline-flex items-center gap-2 absolute top-6 right-6 lg:right-10 bg-white/15 backdrop-blur-md border border-white/25 rounded-full px-4 py-1.5 text-xs text-white font-medium shadow-lg animate-float pointer-events-none">
              <span className="text-amber-300">★ 4.9</span>
              <span className="text-white/90">Rated by 25,000+ Verified Users</span>
            </div>

            {/* Readability gradient mask for smaller screens */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#0074ce] via-[#0074ce]/95 to-[#0074ce]/40 sm:via-[#0074ce]/80 md:via-[#0074ce]/60 md:to-transparent lg:via-[#0074ce]/20 lg:to-transparent pointer-events-none" />

            {/* Left Content Area */}
            <div className="relative z-10 flex flex-col justify-center min-h-[380px] sm:min-h-[400px] lg:min-h-[420px] p-6 sm:p-8 md:p-10 lg:p-12 w-full max-w-full md:max-w-[52%] lg:max-w-[540px]">
              {/* Eyebrow / Subtitle */}
              <p className="text-white/90 text-xs sm:text-sm md:text-[15px] font-normal leading-relaxed">
                Take control of your home journey with ease — anywhere, anytime.
              </p>

              {/* Title */}
              <h2 className="text-2xl sm:text-3xl lg:text-[38px] font-extrabold text-white tracking-tight leading-[1.15] mt-2 sm:mt-3">
                Download the Restamp
                <br />
                App today!
              </h2>

              {/* App Store & Google Play Badges - Responsive & Side by Side */}
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 sm:gap-3.5 mt-5 sm:mt-6">
                {/* Apple App Store */}
                <a
                  href="#download-ios"
                  aria-label="Download on the App Store"
                  className="inline-flex items-center gap-2 sm:gap-2.5 bg-white/12 hover:bg-white/22 active:scale-[0.97] backdrop-blur-md border border-white/25 hover:border-white/40 rounded-xl px-3 py-2 sm:px-3.5 sm:py-2.5 text-white transition duration-200 shadow-sm hover:shadow-lg shrink-0 group hover:scale-105"
                >
                  <svg
                    className="w-4.5 h-5.5 sm:w-5 sm:h-6 shrink-0 drop-shadow-xs"
                    viewBox="0 0 20 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M16.7045 12.7631C16.7166 11.8432 16.9669 10.9413 17.4321 10.1412C17.8972 9.34108 18.5621 8.66885 19.3648 8.18702C18.8548 7.47597 18.1821 6.89081 17.4 6.478C16.6178 6.0652 15.7479 5.83613 14.8592 5.80898C12.9635 5.61471 11.1258 6.91644 10.1598 6.91644C9.17506 6.91644 7.68776 5.82827 6.08616 5.86044C5.05021 5.89311 4.04059 6.18722 3.15568 6.7141C2.27077 7.24099 1.54075 7.98268 1.03674 8.86691C-1.14648 12.5573 0.482005 17.9809 2.57338 20.964C3.61975 22.4247 4.84264 24.0564 6.44279 23.9985C8.00863 23.9351 8.59344 23.0237 10.4835 23.0237C12.3561 23.0237 12.9048 23.9985 14.5374 23.9617C16.2176 23.9351 17.2762 22.4945 18.2859 21.02C19.0377 19.9792 19.6162 18.8288 20 17.6116C19.0238 17.2085 18.1908 16.5338 17.6048 15.6716C17.0187 14.8094 16.7056 13.7979 16.7045 12.7631Z"
                      fill="white"
                    />
                    <path
                      d="M13.6208 3.84713C14.5369 2.77343 14.9883 1.39335 14.879 0C13.4793 0.143519 12.1865 0.796596 11.258 1.82911C10.804 2.33351 10.4563 2.92033 10.2348 3.55601C10.0132 4.19168 9.92219 4.86375 9.96686 5.5338C10.6669 5.54084 11.3595 5.3927 11.9924 5.10054C12.6253 4.80838 13.1821 4.37982 13.6208 3.84713Z"
                      fill="white"
                    />
                  </svg>
                  <div className="text-left">
                    <span className="text-[8.5px] sm:text-[9.5px] text-white/80 font-semibold block uppercase tracking-wider leading-none mb-0.5">
                      Download on the
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-white block leading-tight whitespace-nowrap">
                      App Store
                    </span>
                  </div>
                </a>

                {/* Google Play Store */}
                <a
                  href="#download-android"
                  aria-label="Download on Google Play"
                  className="inline-flex items-center gap-2 sm:gap-2.5 bg-white/12 hover:bg-white/22 active:scale-[0.97] backdrop-blur-md border border-white/25 hover:border-white/40 rounded-xl px-3 py-2 sm:px-3.5 sm:py-2.5 text-white transition duration-200 shadow-sm hover:shadow-lg shrink-0 group hover:scale-105"
                >
                  <svg
                    className="w-4.5 h-5.5 sm:w-5 sm:h-6 shrink-0 drop-shadow-xs"
                    viewBox="0 0 21 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M9.80482 11.4617L0.0895996 22.0059C0.0905121 22.0078 0.090512 22.0106 0.0914244 22.0125C0.389807 23.1574 1.41179 24 2.62539 24C3.11083 24 3.56616 23.8656 3.95671 23.6305L3.98773 23.6118L14.9229 17.1593L9.80482 11.4617Z"
                      fill="#EA4335"
                    />
                    <path
                      d="M19.6331 9.66619L19.624 9.65966L14.9028 6.86123L9.58391 11.7013L14.9219 17.1582L19.6176 14.3878C20.4406 13.9324 21 13.045 21 12.0223C21 11.0052 20.4489 10.1225 19.6331 9.66619Z"
                      fill="#FBBC04"
                    />
                    <path
                      d="M0.0894234 1.99331C0.0310244 2.21353 0 2.44494 0 2.68382V21.3163C0 21.5552 0.0310245 21.7866 0.0903359 22.0059L10.1386 11.7313L0.0894234 1.99331Z"
                      fill="#4285F4"
                    />
                    <path
                      d="M9.87657 11.9999L14.9044 6.85935L3.98192 0.383507C3.58499 0.139962 3.12145 -4.76837e-06 2.62597 -4.76837e-06C1.41237 -4.76837e-06 0.388558 0.844468 0.0901759 1.99034C0.0901759 1.99127 0.0892639 1.9922 0.0892639 1.99314L9.87657 11.9999Z"
                      fill="#34A853"
                    />
                  </svg>
                  <div className="text-left">
                    <span className="text-[8.5px] sm:text-[9.5px] text-white/80 font-semibold block uppercase tracking-wider leading-none mb-0.5">
                      Download on the
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-white block leading-tight whitespace-nowrap">
                      Google Play
                    </span>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Explore Links */}
        <ExploreLinksSection />

        {/* Bottom Banner */}
        <section className="container-site pb-20">
          <div className="grid overflow-hidden rounded-[28px] border border-slate-100 bg-white shadow-[0_4px_24px_rgba(0,0,0,0.05)] md:grid-cols-[1.15fr_1fr]">
            <div className="flex flex-col justify-center p-7 sm:p-10 lg:p-14">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#087ed9] text-white shadow-sm shadow-[#087ed9]/25">
                <House size={22} strokeWidth={2} />
              </span>
              <h2 className="mt-6 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
                The right address <span className="text-[#087ed9]">changes everything.</span>
              </h2>
              <p className="mt-3 text-sm text-slate-500 sm:text-base">
                Your next chapter starts with Restamp — verified owner homes, zero brokerage hassle.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/buy"
                  className="group inline-flex items-center justify-center gap-2 rounded-xl bg-[#087ed9] px-6 py-3.5 text-sm font-bold text-white shadow-md shadow-[#087ed9]/25 transition hover:bg-[#0670c2]"
                >
                  Let’s find your home
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  href="/rent"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-6 py-3.5 text-sm font-bold text-slate-700 transition hover:border-[#087ed9] hover:text-[#087ed9]"
                >
                  Explore rentals
                </Link>
              </div>
            </div>
            <div className="relative min-h-[220px] md:min-h-full">
              <img src="/images/interior.jpg" alt="Bright modern living room" className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-white/30 via-transparent to-transparent md:from-white/60" />
            </div>
          </div>
        </section>
      </main>
      <HomeAnimations />
      <Footer />
    </>
  );
}