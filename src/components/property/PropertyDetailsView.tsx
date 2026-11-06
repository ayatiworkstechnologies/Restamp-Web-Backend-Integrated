"use client";

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  MapPin,
  Heart,
  Phone,
  Bed,
  Bath,
  Layers,
  Armchair,
  Sun,
  Building,
  Award,
  Maximize2,
  Compass,
  Waves,
  Dumbbell,
  Car,
  ShieldCheck,
  Smile,
  Trees,
  Users,
  Zap,
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  X,
  CheckCircle2,
  HelpCircle,
  MessageSquare,
} from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import PropertyCard from '@/components/property/PropertyCard';
import DualToneIcon, { DualToneIconName } from '@/components/ui/DualToneIcon';
import DealerEnquirySection from '@/components/property/DealerEnquirySection';
import { Property, properties, defaultAmenities, defaultNearby } from '@/data/properties';
import { contactFor, logActivity } from '@/lib/activity';
import { toggleWishlist, useWishlist } from '@/lib/wishlist';

interface PropertyDetailsViewProps {
  property: Property;
}

const faqAnswers: Record<string, string> = {
  'Is the price negotiable?':
    'Yes, slight negotiation on base price and stamp duty assistance is possible depending on the payment schedule and down payment amount.',
  'Are home loans approved?':
    'Yes, pre-approved by all leading financial institutions including SBI, HDFC Bank, ICICI Bank, Axis Bank, and Kotak Mahindra Bank.',
  'Can I schedule a visit today?':
    'Site visits can be scheduled Monday to Sunday between 9:30 AM and 6:30 PM with private chauffeur pickup available upon request.',
  'What is the maintenance fee?':
    'Estimated monthly maintenance is ₹3.50 – ₹4.00 per sq.ft., covering 24/7 security, clubhouse maintenance, generator power backup, and landscaped garden upkeep.',
};

export default function PropertyDetailsView({ property }: PropertyDetailsViewProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [showNumber, setShowNumber] = useState(false);
  const isLiked = useWishlist().includes(property.id);

  useEffect(() => {
    logActivity('viewed', property.id);
  }, [property.id]);
  const [showMoreDesc, setShowMoreDesc] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [specsModalOpen, setSpecsModalOpen] = useState(false);

  // Search in blue strip
  const [searchCategory, setSearchCategory] = useState('Buy');
  const [searchQuery, setSearchQuery] = useState('');

  // Contact Modal
  const [contactOpen, setContactOpen] = useState(false);
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', message: '' });

  // Q&A
  const [userQuestion, setUserQuestion] = useState('');
  const [answeredQuestion, setAnsweredQuestion] = useState<{ q: string; a: string } | null>({
    q: 'Is the price negotiable?',
    a: faqAnswers['Is the price negotiable?'],
  });

  // Nearby carousel
  const nearbyScrollRef = useRef<HTMLDivElement>(null);
  const similarScrollRef = useRef<HTMLDivElement>(null);

  const scrollNearby = (dir: 'left' | 'right') => {
    if (nearbyScrollRef.current) {
      nearbyScrollRef.current.scrollBy({
        left: dir === 'left' ? -260 : 260,
        behavior: 'smooth',
      });
    }
  };

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
    : [
        property.image,
        '/images/twin-towers.jpg',
        '/images/apartments.jpg',
        '/images/prop-2.jpg',
      ];

  const amenities = property.amenities || defaultAmenities;
  const nearby = property.nearby || defaultNearby;

  const similarProperties = properties
    .filter((p) => p.id !== property.id)
    .slice(0, 3);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/buy?q=${encodeURIComponent(searchQuery)}`);
  };

  const handleAskQuestion = (q: string) => {
    if (faqAnswers[q]) {
      setAnsweredQuestion({ q, a: faqAnswers[q] });
    } else {
      setAnsweredQuestion({
        q,
        a: `Thank you for asking about "${q}". Our property advisor will provide accurate verified details for ${property.name} right away.`,
      });
    }
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    logActivity('message', property.id, {
      ...contactFor(property),
      senderName: formData.name,
      senderPhone: formData.phone,
      senderEmail: formData.email,
      message: formData.message,
    });
    if (/visit/i.test(formData.message)) logActivity('siteVisit', property.id);
    setContactSubmitted(true);
    setTimeout(() => {
      setContactOpen(false);
      setContactSubmitted(false);
    }, 2200);
  };

  const openContactModal = () => {
    setContactOpen(true);
    setContactSubmitted(false);
    setFormData({
      name: '',
      phone: '',
      email: '',
      message: `Hi, I am interested in ${property.name} (${property.bhk || ''} in ${property.locality || ''}). Please share more details and arrange a site visit.`,
    });
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

  const renderAmenityIcon = (iconName: string) => {
    switch (iconName) {
      case 'pool':
        return <DualToneIcon name="pool" size={22} />;
      case 'gym':
        return <DualToneIcon name="gym" size={22} />;
      case 'parking':
        return <DualToneIcon name="car" size={22} />;
      case 'shield':
        return <DualToneIcon name="shield" size={22} />;
      case 'playground':
        return <DualToneIcon name="award" size={22} />;
      case 'garden':
        return <DualToneIcon name="trees" size={22} />;
      case 'clubhouse':
        return <DualToneIcon name="users" size={22} />;
      case 'power':
        return <DualToneIcon name="zap" size={22} />;
      default:
        return <DualToneIcon name="building" size={22} />;
    }
  };

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
              { id: 'amenities', label: 'Amenities' },
              { id: 'location', label: 'Location' },
              { id: 'dealer', label: 'Dealer Details' },
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
                setLightboxIndex(0);
                setLightboxOpen(true);
              }}
              className="w-full md:w-[67%] lg:w-[68%] h-[260px] sm:h-[340px] md:h-full rounded-2xl overflow-hidden relative group cursor-pointer shadow-xs bg-slate-100 min-h-0 shrink-0"
            >
              <img
                src={galleryImages[0]}
                alt={property.name}
                className="w-full h-full object-cover group-hover:scale-103 transition duration-500"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleWishlist(property.id);
                }}
                aria-label="Save property"
                className="absolute top-4 right-4 p-2 rounded-full bg-white/90 shadow-md hover:scale-110 active:scale-95 transition"
              >
                <Heart
                  size={19}
                  strokeWidth={2}
                  className={isLiked ? 'text-red-500 fill-red-500' : 'text-slate-700'}
                />
              </button>
            </div>

            {/* Right Stack of 3 Smaller Images */}
            <div className="w-full md:w-[33%] lg:w-[32%] flex flex-row md:flex-col gap-3 sm:gap-3.5 h-24 sm:h-28 md:h-full min-h-0 flex-1">
              {galleryImages.slice(1, 3).map((img, i) => (
                <div
                  key={i}
                  onClick={() => {
                    setLightboxIndex(i + 1);
                    setLightboxOpen(true);
                  }}
                  className="flex-1 min-w-0 min-h-0 w-full h-full rounded-xl sm:rounded-2xl overflow-hidden relative group cursor-pointer shadow-xs bg-slate-100"
                >
                  <img
                    src={img}
                    alt={`${property.name} photo ${i + 2}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                </div>
              ))}

              {/* 3rd image with + 15 View All Overlay */}
              <div
                onClick={() => {
                  setLightboxIndex(3);
                  setLightboxOpen(true);
                }}
                className="flex-1 min-w-0 min-h-0 w-full h-full rounded-xl sm:rounded-2xl overflow-hidden relative group cursor-pointer shadow-xs bg-slate-900"
              >
                <img
                  src={galleryImages[3] || galleryImages[0]}
                  alt={`${property.name} photo 4`}
                  className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition duration-500"
                />
                <div className="absolute inset-0 flex items-center justify-center text-white text-xs sm:text-sm font-bold tracking-wide">
                  + 15 View All
                </div>
              </div>
            </div>
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
                  <p className="text-xs text-slate-400 font-medium mt-1">
                    {property.pricePerSqft || '₹35,999 /sqft'}
                  </p>
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
              <div className="flex items-center gap-3">
                <button
                  onClick={openContactModal}
                  className="px-5 py-2.5 border border-[#087ed9] text-[#087ed9] hover:bg-sky-50 font-semibold text-xs sm:text-sm rounded-lg transition text-center cursor-pointer shadow-2xs"
                >
                  Contact Dealer
                </button>
                <button
                  onClick={() => {
                    if (!showNumber) logActivity('call', property.id, contactFor(property));
                    setShowNumber(!showNumber);
                  }}
                  className="px-6 h-[53px] bg-[#087ed9] hover:bg-sky-600 text-white font-semibold text-xs sm:text-sm rounded-lg transition text-center shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  {showNumber && <Phone size={14} />}
                  <span>
                    {showNumber
                      ? property.phoneNumber || '+91 98401 22345'
                      : 'View Number'}
                  </span>
                </button>
              </div>
            </div>

            {/* Specs Badges Row with Accurate Dual-Tone Icons for each feature */}
            <div className="flex items-center gap-3 sm:gap-4 mt-6 pt-4 overflow-x-auto no-scrollbar pb-1 text-xs sm:text-[13px] text-slate-600 font-medium whitespace-nowrap">
              {[
                { label: property.beds || '3 Beds', icon: 'bed' as const },
                { label: property.baths || '3 Baths', icon: 'bath' as const },
                { label: property.floors || '2 Floors', icon: 'layers' as const },
                { label: property.furnishing || 'Semifurnished', icon: 'sofa' as const },
                { label: property.balconies || '3 Balconies', icon: 'balcony' as const },
                { label: '3 Fans', icon: 'fan' as const },
                { label: '6 Lights', icon: 'lightbulb' as const },
                { label: '1 Parking', icon: 'car' as const },
              ].map((item, idx) => (
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
                +3 View All
              </button>
            </div>
          </div>

          {/* Section: About Property */}
          <section className="py-9 border-b border-slate-200" id="highlights">
            <p className="eyebrow text-slate-400">ABOUT PROPERTY</p>
            <h3 className="section-title text-xl sm:text-2xl mt-1 text-slate-900">
              Discover new beginnings
            </h3>
            <p className="text-xs font-bold text-slate-800 mt-2 uppercase tracking-wide">
              ADDRESS: {property.address || `${property.locality}, ${property.city}`}
            </p>

            <div className="mt-3 text-xs sm:text-sm text-slate-600 leading-relaxed max-w-4xl">
              <p>
                {property.descriptionLong || property.description}
              </p>
              {showMoreDesc && (
                <p className="mt-3">
                  Premium Italian marble flooring, expansive master suites with walk-in wardrobes, floor-to-ceiling soundproof glass panels, and private landscaped sit-outs. Gated perimeter with digital biometric access, dedicated EV charging ports in parking bays, and multi-cuisine resident cafeteria inside clubhouse.
                </p>
              )}
              <button
                onClick={() => setShowMoreDesc(!showMoreDesc)}
                className="text-[#087ed9] font-bold text-xs mt-2 hover:underline cursor-pointer block"
              >
                {showMoreDesc ? 'Less <<' : 'More >>'}
              </button>
            </div>
          </section>

          {/* Section: Property Details */}
          <section className="py-9 border-b border-slate-200" id="details">
            <p className="eyebrow text-slate-400">PROPERTY DETAILS</p>
            <h3 className="section-title text-xl sm:text-2xl mt-1 text-slate-900">
              Discover new beginnings
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4 mt-6">
              {[
                {
                  label: 'Property type',
                  value: property.propertyCategory || 'Apartments',
                  iconName: 'building' as DualToneIconName,
                },
                {
                  label: 'Listing scope',
                  value: 'Recommended',
                  iconName: 'award' as DualToneIconName,
                },
                {
                  label: 'Super built-up',
                  value: property.superBuiltUp || property.sqft || '2,400 sq. ft.',
                  iconName: 'maximize' as DualToneIconName,
                },
                {
                  label: 'Furnishing',
                  value: property.furnishing || 'Unfurnished',
                  iconName: 'sofa' as DualToneIconName,
                },
                {
                  label: 'Facing direction',
                  value: property.facing || 'East',
                  iconName: 'compass' as DualToneIconName,
                },
                {
                  label: 'Floor level',
                  value: property.floorLevel || '12th of 18 Floors',
                  iconName: 'layers' as DualToneIconName,
                },
              ].map(({ label, value, iconName }) => (
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

          {/* Section: Amenities */}
          <section className="py-9 border-b border-slate-200" id="amenities">
            <p className="eyebrow text-slate-400">AMENITIES</p>
            <h3 className="section-title text-xl sm:text-2xl mt-1 text-slate-900">
              Discover new beginnings
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              {amenities.map((item) => (
                <div
                  key={item.title}
                  className="border border-slate-200 rounded-xl p-4.5 bg-white flex items-start gap-3.5 hover:shadow-2xs transition"
                >
                  <span className="p-2.5 rounded-lg bg-sky-50 shrink-0">
                    {renderAmenityIcon(item.icon)}
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-[11px] text-slate-400 mt-4">
              Illustrative amenities only. Availability varies by property.
            </p>
          </section>

          {/* Section: Places Nearby */}
          <section className="py-9 border-b border-slate-200" id="location">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="eyebrow text-slate-400">PLACES NEARBY</p>
                <h3 className="section-title text-xl sm:text-2xl mt-1 text-slate-900">
                  {property.locality || 'Alwarpet'}, {property.city || 'Chennai'}
                </h3>
              </div>

              {/* Navigation Arrows */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => scrollNearby('left')}
                  aria-label="Previous places"
                  className="p-1.5 text-[#087ed9] hover:bg-sky-50 rounded-full transition cursor-pointer"
                >
                  <ArrowLeft size={18} strokeWidth={2.2} />
                </button>
                <button
                  onClick={() => scrollNearby('right')}
                  aria-label="Next places"
                  className="p-1.5 text-[#087ed9] hover:bg-sky-50 rounded-full transition cursor-pointer"
                >
                  <ArrowRight size={18} strokeWidth={2.2} />
                </button>
              </div>
            </div>

            <div
              ref={nearbyScrollRef}
              className="flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory scroll-smooth [&::-webkit-scrollbar]:hidden"
            >
              {nearby.map((place) => (
                <div
                  key={place.name}
                  className="w-[260px] sm:w-[280px] shrink-0 border border-slate-200 rounded-xl p-3 bg-white flex items-center gap-3.5 snap-start shadow-2xs hover:border-sky-300 transition"
                >
                  <img
                    src={place.img}
                    alt={place.name}
                    className="w-14 h-14 rounded-lg object-cover shrink-0 bg-slate-100"
                  />
                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                      {place.name}
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5 truncate">
                      {place.distance}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-[11px] text-slate-400 mt-3">
              Illustrative amenities only. Availability varies by property.
            </p>
          </section>

          {/* Section: Dealer & Enquiry */}
          <DealerEnquirySection property={property} />

          {/* Section: Q&A / FAQ Box */}
          <section className="py-10">
            <div className="bg-[#e7f6ff] border border-sky-100 rounded-2xl p-6 sm:p-9 shadow-2xs">
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
                Got questions about this property
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                Choose a suggested question or ask your own.
              </p>

              {/* Suggested Questions Pills */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 mt-5">
                {[
                  'Is the price negotiable?',
                  'Are home loans approved?',
                  'Can I schedule a visit today?',
                  'What is the maintenance fee?',
                ].map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => handleAskQuestion(q)}
                    className={`px-4 py-2 rounded-full text-xs font-semibold transition cursor-pointer ${
                      answeredQuestion?.q === q
                        ? 'bg-[#087ed9] text-white shadow-xs'
                        : 'bg-white text-slate-800 hover:bg-sky-50 border border-sky-200'
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>

              {/* Question Input Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (userQuestion.trim()) {
                    handleAskQuestion(userQuestion.trim());
                    setUserQuestion('');
                  }
                }}
                className="mt-5 flex flex-col sm:flex-row gap-2.5 max-w-3xl"
              >
                <input
                  type="text"
                  value={userQuestion}
                  onChange={(e) => setUserQuestion(e.target.value)}
                  placeholder="Type your question here..."
                  className="flex-1 bg-white border border-sky-200 rounded-xl px-4 py-3 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#087ed9]"
                />
                <button
                  type="submit"
                  className="bg-[#087ed9] hover:bg-sky-600 text-white font-semibold text-xs sm:text-sm px-6 h-[53px] rounded-xl transition shadow-xs cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                >
                  <Search size={15} />
                  <span>Search</span>
                </button>
              </form>

              {/* Instant Answer Feedback Box */}
              {answeredQuestion && (
                <div className="mt-5 p-4 rounded-xl bg-white border border-sky-200 shadow-2xs animate-in fade-in duration-200">
                  <div className="flex items-start gap-2.5">
                    <MessageSquare size={17} className="text-[#087ed9] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        {answeredQuestion.q}
                      </p>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        {answeredQuestion.a}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Section: Similar Properties */}
          <section className="pt-4 pb-10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="eyebrow text-slate-400">SIMILAR PROPERTIES</p>
                <h3 className="section-title text-xl sm:text-2xl mt-1 text-slate-900">
                  Discover new beginnings
                </h3>
              </div>

              {/* Navigation Arrows */}
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

            <div
              ref={similarScrollRef}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {similarProperties.map((p) => (
                <div key={p.id} className="h-full">
                  <PropertyCard
                    property={p}
                    onContact={openContactModal}
                    showExplore={true}
                  />
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      {/* Lightbox Photo Gallery Modal */}
      {lightboxOpen && (
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
            {/* Arrows */}
            <button
              onClick={() =>
                setLightboxIndex(
                  (lightboxIndex - 1 + galleryImages.length) % galleryImages.length
                )
              }
              className="absolute left-2 p-3 bg-black/60 hover:bg-black text-white rounded-full transition"
            >
              <ArrowLeft size={20} />
            </button>
            <button
              onClick={() =>
                setLightboxIndex((lightboxIndex + 1) % galleryImages.length)
              }
              className="absolute right-2 p-3 bg-black/60 hover:bg-black text-white rounded-full transition"
            >
              <ArrowRight size={20} />
            </button>
          </div>
          <div className="flex items-center gap-2 mt-4">
            {galleryImages.map((_, i) => (
              <button
                key={i}
                onClick={() => setLightboxIndex(i)}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-7 relative shadow-2xl border border-slate-100">
            <button
              onClick={() => setContactOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100 transition"
              aria-label="Close modal"
            >
              <X size={20} />
            </button>

            {contactSubmitted ? (
              <div className="py-8 text-center">
                <CheckCircle2 size={48} className="text-emerald-500 mx-auto mb-3" />
                <h3 className="text-xl font-bold text-slate-900">Enquiry Received!</h3>
                <p className="text-sm text-slate-500 mt-2">
                  The developer for <strong className="text-slate-800">{property.name}</strong> will contact you shortly.
                </p>
              </div>
            ) : (
              <div>
                <p className="eyebrow text-[#087ed9]">CONNECT WITH DEVELOPER</p>
                <h3 className="text-xl font-bold text-slate-900 mt-1">
                  Enquire about {property.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {property.bhk} · {property.address || property.propertyType} · {property.price}
                </p>

                <form onSubmit={handleContactSubmit} className="mt-5 space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Arun Kumar"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-hidden focus:border-[#087ed9]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="+91 98765 43210"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-hidden focus:border-[#087ed9]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        placeholder="you@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-hidden focus:border-[#087ed9]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Message
                    </label>
                    <textarea
                      rows={3}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-200 text-sm focus:outline-hidden focus:border-[#087ed9] resize-none"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setContactOpen(false)}
                      className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="inline-flex items-center justify-center px-5 h-[53px] text-xs font-semibold text-white bg-[#087ed9] hover:bg-sky-600 rounded-lg transition shadow-sm cursor-pointer"
                    >
                      Send Enquiry
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Specs Detail Modal */}
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
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50">
                <DualToneIcon name="bed" size={20} />
                <div>
                  <p className="text-[11px] text-slate-400">Bedrooms</p>
                  <p className="font-bold text-slate-800">{property.beds || '3 Beds'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50">
                <DualToneIcon name="bath" size={20} />
                <div>
                  <p className="text-[11px] text-slate-400">Bathrooms</p>
                  <p className="font-bold text-slate-800">{property.baths || '3 Baths'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50">
                <DualToneIcon name="layers" size={20} />
                <div>
                  <p className="text-[11px] text-slate-400">Total Floors</p>
                  <p className="font-bold text-slate-800">{property.floors || '2 Floors'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50">
                <DualToneIcon name="sofa" size={20} />
                <div>
                  <p className="text-[11px] text-slate-400">Furnishing</p>
                  <p className="font-bold text-slate-800">{property.furnishing || 'Semifurnished'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50">
                <DualToneIcon name="balcony" size={20} />
                <div>
                  <p className="text-[11px] text-slate-400">Balconies</p>
                  <p className="font-bold text-slate-800">{property.balconies || '3 Balconies'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50">
                <DualToneIcon name="fan" size={20} />
                <div>
                  <p className="text-[11px] text-slate-400">Ceiling Fans</p>
                  <p className="font-bold text-slate-800">3 Fans Fitted</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50">
                <DualToneIcon name="lightbulb" size={20} />
                <div>
                  <p className="text-[11px] text-slate-400">Lights & LED</p>
                  <p className="font-bold text-slate-800">6 Lights Installed</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50">
                <DualToneIcon name="car" size={20} />
                <div>
                  <p className="text-[11px] text-slate-400">Parking</p>
                  <p className="font-bold text-slate-800">1 Covered Bay</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50">
                <DualToneIcon name="building" size={20} />
                <div>
                  <p className="text-[11px] text-slate-400">Super Built-up</p>
                  <p className="font-bold text-slate-800">{property.superBuiltUp || '2,400 sq. ft.'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50">
                <DualToneIcon name="compass" size={20} />
                <div>
                  <p className="text-[11px] text-slate-400">Facing Direction</p>
                  <p className="font-bold text-slate-800">{property.facing || 'East'}</p>
                </div>
              </div>
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
