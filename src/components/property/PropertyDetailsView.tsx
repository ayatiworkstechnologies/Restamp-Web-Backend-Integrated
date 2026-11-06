"use client";

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Search,
  MapPin,
  Heart,
  Phone,
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  X,
  ImageOff,
} from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import PropertyCard from '@/components/property/PropertyCard';
import DualToneIcon, { DualToneIconName } from '@/components/ui/DualToneIcon';
import DealerEnquirySection from '@/components/property/DealerEnquirySection';
import EnquiryModal from '@/components/property/EnquiryModal';
import { Property } from '@/data/properties';
import { toggleWishlist, useWishlist } from '@/lib/wishlist';
import { recordView } from '@/lib/api/buyer';
import { getSession, loginHref } from '@/lib/api/session';
import { formatIndianPhone, useOwnerContact } from '@/lib/useOwnerContact';

interface PropertyDetailsViewProps {
  property: Property;
  /** Similar listings from the backend (may be empty). */
  similar?: Property[];
}

// Suggested questions only pre-fill a message to the owner; the website never answers on the owner's behalf.
const SUGGESTED_QUESTIONS = [
  'Is the price negotiable?',
  'Is the property still available?',
  'Can I schedule a site visit?',
  'What is the maintenance fee?',
];

export default function PropertyDetailsView({ property, similar = [] }: PropertyDetailsViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState('overview');
  const isLiked = useWishlist().includes(property.id);
  const contact = useOwnerContact(property.id);

  // Viewed history is recorded only for a signed-in buyer-mode session;
  // merely opening a page never switches the user's role.
  useEffect(() => {
    if (getSession()?.role === 'BUYER') recordView(property.id).catch(() => undefined);
  }, [property.id]);

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [specsModalOpen, setSpecsModalOpen] = useState(false);

  // Search in blue strip
  const [searchCategory, setSearchCategory] = useState('Buy');
  const [searchQuery, setSearchQuery] = useState('');

  // Contact Modal (real enquiry)
  const [contactOpen, setContactOpen] = useState(false);
  const [contactMessage, setContactMessage] = useState<string | undefined>(undefined);
  const [contactProperty, setContactProperty] = useState<Property>(property);

  // Q&A: questions become a message to the owner
  const [userQuestion, setUserQuestion] = useState('');

  const similarScrollRef = useRef<HTMLDivElement>(null);

  const scrollSimilar = (dir: 'left' | 'right') => {
    if (similarScrollRef.current) {
      similarScrollRef.current.scrollBy({
        left: dir === 'left' ? -340 : 340,
        behavior: 'smooth',
      });
    }
  };

  const galleryImages = property.gallery && property.gallery.length > 0
    ? property.gallery
    : property.image
    ? [property.image]
    : [];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams({ purpose: searchCategory });
    if (searchQuery.trim()) params.set('q', searchQuery.trim());
    router.push(`/buy?${params.toString()}`);
  };

  const openContactModal = (target: Property = property, message?: string) => {
    setContactProperty(target);
    setContactMessage(message);
    setContactOpen(true);
  };

  const askOwner = (question: string) => {
    openContactModal(property, `Hi, about ${property.name}: ${question}`);
  };

  const onToggleSaved = async () => {
    try {
      if ((await toggleWishlist(property.id)) === 'login') router.push(loginHref(pathname || '/'));
    } catch {
      // Rolled back to the server state by toggleWishlist.
    }
  };

  const isClickingTabRef = useRef(false);

  // Scroll spy: Update active tab as user scrolls and sections meet the top
  useEffect(() => {
    const sectionIds = ['overview', 'highlights', 'details', 'amenities', 'location', 'dealer'];

    const handleScroll = () => {
      if (isClickingTabRef.current) return;

      // When near bottom of the document, activate the last tab ('dealer')
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 70) {
        setActiveTab('dealer');
        return;
      }

      for (let i = sectionIds.length - 1; i >= 0; i--) {
        const el = document.getElementById(sectionIds[i]);
        if (el) {
          const rect = el.getBoundingClientRect();
          // Header (72px) + Nav (~48px) = 120px; section meets top at ~130px
          if (rect.top <= 135) {
            setActiveTab(sectionIds[i]);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Ensure active tab stays visible in horizontally scrollable nav bar
  useEffect(() => {
    const tabEl = document.getElementById(`tab-${activeTab}`);
    if (tabEl) {
      tabEl.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
    }
  }, [activeTab]);

  const scrollToSection = (id: string) => {
    setActiveTab(id);
    isClickingTabRef.current = true;
    const element = document.getElementById(id);
    if (element) {
      // 72px Header + 48px sticky nav + 5px breathing buffer = 125px
      const yOffset = -125;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
      setTimeout(() => {
        isClickingTabRef.current = false;
      }, 700);
    }
  };

  // Only facts the backend returned for this listing.
  const specCandidates: { label: string | undefined; icon: DualToneIconName }[] = [
    { label: property.beds, icon: 'bed' },
    { label: property.baths, icon: 'bath' },
    { label: property.sqft, icon: 'maximize' },
    { label: property.launchType, icon: 'building' },
  ];
  const specs = specCandidates.filter((x): x is { label: string; icon: DualToneIconName } => !!x.label);

  const details: { label: string; value: string; iconName: DualToneIconName }[] = [
    { label: 'Property type', value: property.propertyType || '', iconName: 'building' as DualToneIconName },
    { label: 'Listing type', value: property.statusTag || '', iconName: 'award' as DualToneIconName },
    { label: 'Area', value: property.sqft || '', iconName: 'maximize' as DualToneIconName },
    { label: 'Construction', value: property.launchType || '', iconName: 'layers' as DualToneIconName },
    { label: 'Bedrooms', value: property.beds || '', iconName: 'bed' as DualToneIconName },
    { label: 'Bathrooms', value: property.baths || '', iconName: 'bath' as DualToneIconName },
  ].filter((d) => d.value);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      <main className="flex-1 pb-16">
        {/* Blue Search Top Banner */}
        <section className="bg-[#087ed9] text-white pt-5 pb-7">
          <div className="container-site">
            {/* Breadcrumb */}
            <div className="text-white/80 text-xs flex items-center gap-1.5 font-medium mb-3">
              <Link href="/" className="hover:text-white transition">
                Home
              </Link>
              <span>/</span>
              <Link href="/buy" className="hover:text-white transition">
                Buy Properties
              </Link>
              <span>/</span>
              <span className="text-white font-semibold truncate max-w-xs">
                {property.name}
              </span>
            </div>

            {/* Embedded Search Bar */}
            <form onSubmit={handleSearchSubmit} className="max-w-3xl">
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <div className="w-full flex-1 flex items-center bg-white rounded-xl shadow-xs overflow-hidden border border-sky-300/40">
                  <div className="relative shrink-0 border-r border-slate-200">
                    <select
                      value={searchCategory}
                      onChange={(e) => setSearchCategory(e.target.value)}
                      aria-label="Search category"
                      className="appearance-none bg-transparent pl-3 pr-7 py-2.5 text-xs font-bold text-slate-700 outline-none cursor-pointer"
                    >
                      <option value="Buy">Buy</option>
                      <option value="Rent">Rent</option>
                      <option value="Resale">Resale</option>
                    </select>
                    <ChevronDown
                      size={13}
                      className="text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
                    />
                  </div>
                  <div className="flex-1 flex items-center px-3">
                    <MapPin size={16} className="text-slate-400 shrink-0 mr-2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search city, locality or property name"
                      className="w-full py-2.5 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full sm:w-auto bg-white hover:bg-slate-50 text-[#087ed9] font-bold text-xs sm:text-sm px-6 py-3 rounded-xl flex items-center justify-center gap-1.5 shrink-0 transition shadow-xs cursor-pointer"
                >
                  <Search size={15} strokeWidth={2.5} />
                  <span>Search</span>
                </button>
              </div>
            </form>
          </div>
        </section>

        {/* Sticky Secondary Tab Navigation */}
        <nav className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-[72px] z-40 shadow-xs">
          <div className="container-site flex items-center gap-6 sm:gap-9 text-xs sm:text-sm font-semibold overflow-x-auto [&::-webkit-scrollbar]:hidden">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'highlights', label: 'Highlights' },
              { id: 'details', label: 'Property Details' },
              { id: 'location', label: 'Location' },
              { id: 'dealer', label: 'Owner Details' },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`tab-${tab.id}`}
                  onClick={() => scrollToSection(tab.id)}
                  className={`py-3.5 transition whitespace-nowrap border-b-2 cursor-pointer ${
                    isActive
                      ? 'border-[#087ed9] text-[#087ed9]'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </nav>

        <div className="container-site pt-6" id="overview">
          {/* Photo Gallery Grid / Flex */}
          <div className="flex flex-col md:flex-row gap-3 sm:gap-3.5 w-full h-auto md:h-[430px] lg:h-[460px]">
            {/* Left Big Hero Image */}
            <div
              onClick={() => {
                if (!galleryImages.length) return;
                setLightboxIndex(0);
                setLightboxOpen(true);
              }}
              className={`w-full ${galleryImages.length > 1 ? 'md:w-[67%] lg:w-[68%]' : ''} h-[260px] sm:h-[340px] md:h-full rounded-2xl overflow-hidden relative group ${galleryImages.length ? 'cursor-pointer' : ''} shadow-xs bg-slate-100 min-h-0 shrink-0`}
            >
              {galleryImages.length ? (
                <img
                  src={galleryImages[0]}
                  alt={property.name}
                  className="w-full h-full object-cover group-hover:scale-103 transition duration-500"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-slate-400">
                  <ImageOff size={34} />
                  <span className="text-sm font-medium">The owner hasn&apos;t added photos yet</span>
                </div>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  void onToggleSaved();
                }}
                aria-label={isLiked ? 'Remove from saved' : 'Save property'}
                className="absolute top-4 right-4 p-2 rounded-full bg-white/90 shadow-md hover:scale-110 active:scale-95 transition"
              >
                <Heart
                  size={19}
                  strokeWidth={2}
                  className={isLiked ? 'text-red-500 fill-red-500' : 'text-slate-700'}
                />
              </button>
            </div>

            {/* Right Stack of up to 3 smaller real photos */}
            {galleryImages.length > 1 && (
              <div className="w-full md:w-[33%] lg:w-[32%] flex flex-row md:flex-col gap-3 sm:gap-3.5 h-24 sm:h-28 md:h-full min-h-0 flex-1">
                {galleryImages.slice(1, 4).map((img, i) => {
                  const isLastTile = i === 2 && galleryImages.length > 4;
                  return (
                    <div
                      key={img}
                      onClick={() => {
                        setLightboxIndex(i + 1);
                        setLightboxOpen(true);
                      }}
                      className={`flex-1 min-w-0 min-h-0 w-full h-full rounded-xl sm:rounded-2xl overflow-hidden relative group cursor-pointer shadow-xs ${isLastTile ? 'bg-slate-900' : 'bg-slate-100'}`}
                    >
                      <img
                        src={img}
                        alt={`${property.name} photo ${i + 2}`}
                        className={`w-full h-full object-cover group-hover:scale-105 transition duration-500 ${isLastTile ? 'opacity-60' : ''}`}
                      />
                      {isLastTile && (
                        <div className="absolute inset-0 flex items-center justify-center text-white text-xs sm:text-sm font-bold tracking-wide">
                          + {galleryImages.length - 4} View All
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Price, Title & Quick Actions Row */}
          <div className="mt-8 pb-7 border-b border-slate-200">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              {/* Left: Price & Title */}
              <div className="flex flex-col sm:flex-row sm:items-baseline gap-4 sm:gap-7">
                <div>
                  <h2 className="text-3xl font-extrabold text-slate-900 leading-none">
                    {property.price}
                  </h2>
                  {property.pricePerSqft && (
                    <p className="text-xs text-slate-400 font-medium mt-1">{property.pricePerSqft}</p>
                  )}
                </div>

                <div className="sm:border-l sm:border-slate-200 sm:pl-7">
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                    {property.name}
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1 flex items-center gap-1.5">
                    <MapPin size={14} className="text-slate-400 shrink-0" />
                    <span>in {property.address || property.area}</span>
                  </p>
                </div>
              </div>

              {/* Right: Action Buttons */}
              <div className="flex flex-col items-start lg:items-end gap-1.5">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => openContactModal()}
                    className="px-5 py-2.5 border border-[#087ed9] text-[#087ed9] hover:bg-sky-50 font-semibold text-xs sm:text-sm rounded-lg transition text-center cursor-pointer shadow-2xs"
                  >
                    Contact Owner
                  </button>
                  {contact.phone ? (
                    <a
                      href={`tel:${contact.phone}`}
                      onClick={contact.onCall}
                      className="px-6 h-[53px] bg-[#087ed9] hover:bg-sky-600 text-white font-semibold text-xs sm:text-sm rounded-lg transition text-center shadow-xs cursor-pointer flex items-center gap-1.5"
                    >
                      <Phone size={14} />
                      <span>{formatIndianPhone(contact.phone)}</span>
                    </a>
                  ) : (
                    <button
                      onClick={() => void contact.reveal()}
                      disabled={contact.loading}
                      className="px-6 h-[53px] bg-[#087ed9] hover:bg-sky-600 disabled:opacity-60 text-white font-semibold text-xs sm:text-sm rounded-lg transition text-center shadow-xs cursor-pointer flex items-center gap-1.5"
                    >
                      <span>{contact.loading ? 'Loading…' : 'View Number'}</span>
                    </button>
                  )}
                </div>
                {contact.error && <p className="text-xs text-red-600" role="alert">{contact.error}</p>}
              </div>
            </div>

            {/* Specs Badges Row (real fields only) */}
            {specs.length > 0 && (
              <div className="flex items-center gap-3 sm:gap-4 mt-6 pt-4 overflow-x-auto no-scrollbar pb-1 text-xs sm:text-[13px] text-slate-600 font-medium whitespace-nowrap">
                {specs.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 sm:gap-4 shrink-0">
                    <div className="flex items-center gap-1.5 shrink-0">
                      <DualToneIcon name={item.icon} size={17} />
                      <span>{item.label}</span>
                    </div>
                    <span className="h-3.5 w-[1px] bg-slate-200/90 shrink-0" />
                  </div>
                ))}
                <button
                  onClick={() => setSpecsModalOpen(true)}
                  className="text-[#087ed9] hover:underline font-semibold text-xs sm:text-[13px] shrink-0 cursor-pointer ml-1"
                >
                  View All
                </button>
              </div>
            )}
          </div>

          {/* Section: About Property */}
          <section className="py-9 border-b border-slate-200" id="highlights">
            <p className="eyebrow text-slate-400">ABOUT PROPERTY</p>
            <h3 className="section-title text-xl sm:text-2xl mt-1 text-slate-900">
              Discover new beginnings
            </h3>
            <p className="text-xs font-bold text-slate-800 mt-2 uppercase tracking-wide">
              ADDRESS: {property.address || [property.locality, property.city].filter(Boolean).join(', ')}
            </p>

            <div className="mt-3 text-xs sm:text-sm text-slate-600 leading-relaxed max-w-4xl whitespace-pre-line">
              <p>{property.description || 'The owner has not added a description yet.'}</p>
            </div>
          </section>

          {/* Section: Property Details */}
          {details.length > 0 && (
            <section className="py-9 border-b border-slate-200" id="details">
              <p className="eyebrow text-slate-400">PROPERTY DETAILS</p>
              <h3 className="section-title text-xl sm:text-2xl mt-1 text-slate-900">
                Discover new beginnings
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4 mt-6">
                {details.map(({ label, value, iconName }) => (
                  <div
                    key={label}
                    className="bg-white border border-[#e5eef7] rounded-2xl p-5 flex flex-col justify-between shadow-xs hover:border-[#087ed9]/40 hover:shadow-md transition-all duration-200"
                  >
                    <span className="w-12 h-12 rounded-xl bg-[#edf6fd] flex items-center justify-center mb-6 shrink-0">
                      <DualToneIcon name={iconName} size={24} />
                    </span>
                    <div>
                      <p className="text-xs text-slate-400 font-medium">{label}</p>
                      <p className="text-sm sm:text-base font-bold text-slate-900 mt-1 truncate">
                        {value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Section: Location */}
          <section className="py-9 border-b border-slate-200" id="location">
            <p className="eyebrow text-slate-400">LOCATION</p>
            <h3 className="section-title text-xl sm:text-2xl mt-1 text-slate-900">
              {[property.locality, property.city].filter(Boolean).join(', ')}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-3 flex items-center gap-1.5">
              <MapPin size={14} className="text-slate-400 shrink-0" />
              <span>{property.address || [property.locality, property.city].filter(Boolean).join(', ')}</span>
            </p>
          </section>

          {/* Section: Owner & Enquiry */}
          <DealerEnquirySection property={property} />

          {/* Section: Q&A — questions go to the owner as an enquiry */}
          <section className="py-10">
            <div className="bg-[#e7f6ff] border border-sky-100 rounded-2xl p-6 sm:p-9 shadow-2xs">
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
                Got questions about this property
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                Choose a suggested question or ask your own. Your question is sent to the owner, who replies in your activity.
              </p>

              <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 mt-5">
                {SUGGESTED_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => askOwner(q)}
                    className="px-4 py-2 rounded-full text-xs font-semibold transition cursor-pointer bg-white text-slate-800 hover:bg-sky-50 border border-sky-200"
                  >
                    {q}
                  </button>
                ))}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (userQuestion.trim()) {
                    askOwner(userQuestion.trim());
                    setUserQuestion('');
                  }
                }}
                className="mt-5 flex flex-col sm:flex-row gap-2.5 max-w-3xl"
              >
                <input
                  type="text"
                  value={userQuestion}
                  onChange={(e) => setUserQuestion(e.target.value)}
                  placeholder="Type your question for the owner..."
                  className="flex-1 bg-white border border-sky-200 rounded-xl px-4 py-3 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#087ed9]"
                />
                <button
                  type="submit"
                  className="bg-[#087ed9] hover:bg-sky-600 text-white font-semibold text-xs sm:text-sm px-6 h-[53px] rounded-xl transition shadow-xs cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                >
                  <span>Ask the owner</span>
                </button>
              </form>
            </div>
          </section>

          {/* Section: Similar Properties */}
          {similar.length > 0 && (
            <section className="pt-4 pb-10">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="eyebrow text-slate-400">SIMILAR PROPERTIES</p>
                  <h3 className="section-title text-xl sm:text-2xl mt-1 text-slate-900">
                    Discover new beginnings
                  </h3>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => scrollSimilar('left')}
                    aria-label="Previous properties"
                    className="p-1.5 text-[#087ed9] hover:bg-sky-50 rounded-full transition cursor-pointer"
                  >
                    <ArrowLeft size={18} strokeWidth={2.2} />
                  </button>
                  <button
                    onClick={() => scrollSimilar('right')}
                    aria-label="Next properties"
                    className="p-1.5 text-[#087ed9] hover:bg-sky-50 rounded-full transition cursor-pointer"
                  >
                    <ArrowRight size={18} strokeWidth={2.2} />
                  </button>
                </div>
              </div>

              <div ref={similarScrollRef} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {similar.map((p) => (
                  <div key={p.id} className="h-full">
                    <PropertyCard property={p} onContact={(target) => openContactModal(target)} showExplore={true} />
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      {/* Lightbox Photo Gallery Modal */}
      {lightboxOpen && galleryImages.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4">
          <button
            onClick={() => setLightboxOpen(false)}
            aria-label="Close photo gallery"
            className="absolute top-5 right-5 text-white/80 hover:text-white p-2"
          >
            <X size={26} />
          </button>
          <div className="max-w-4xl max-h-[80vh] w-full flex items-center justify-center relative">
            <img
              src={galleryImages[lightboxIndex]}
              alt={`Gallery photo ${lightboxIndex + 1}`}
              className="max-h-[75vh] w-auto max-w-full rounded-xl object-contain shadow-2xl"
            />
            {galleryImages.length > 1 && (
              <>
                <button
                  onClick={() =>
                    setLightboxIndex((lightboxIndex - 1 + galleryImages.length) % galleryImages.length)
                  }
                  aria-label="Previous photo"
                  className="absolute left-2 p-3 bg-black/60 hover:bg-black text-white rounded-full transition"
                >
                  <ArrowLeft size={20} />
                </button>
                <button
                  onClick={() => setLightboxIndex((lightboxIndex + 1) % galleryImages.length)}
                  aria-label="Next photo"
                  className="absolute right-2 p-3 bg-black/60 hover:bg-black text-white rounded-full transition"
                >
                  <ArrowRight size={20} />
                </button>
              </>
            )}
          </div>
          <div className="flex items-center gap-2 mt-4">
            {galleryImages.map((_, i) => (
              <button
                key={i}
                onClick={() => setLightboxIndex(i)}
                aria-label={`Photo ${i + 1}`}
                className={`w-2.5 h-2.5 rounded-full transition ${
                  lightboxIndex === i ? 'bg-white' : 'bg-white/40'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Contact Enquiry Modal */}
      {contactOpen && (
        <EnquiryModal
          property={contactProperty}
          initialMessage={contactMessage}
          onClose={() => setContactOpen(false)}
        />
      )}

      {/* Specs Detail Modal (real fields only) */}
      {specsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-lg text-slate-900">
                  Property Features & Overview
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">{property.name}</p>
              </div>
              <button
                onClick={() => setSpecsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition cursor-pointer"
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3.5 py-5 text-xs sm:text-sm">
              {details.map(({ label, value, iconName }) => (
                <div key={label} className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50">
                  <DualToneIcon name={iconName} size={20} />
                  <div>
                    <p className="text-[11px] text-slate-400">{label}</p>
                    <p className="font-bold text-slate-800">{value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSpecsModalOpen(false)}
                className="inline-flex items-center justify-center px-5 h-[53px] bg-[#087ed9] text-white text-xs font-semibold rounded-lg hover:bg-sky-600 transition cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
