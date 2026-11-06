"use client";

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useWishlist } from '@/lib/wishlist';
import { signOut } from '@/lib/api/auth';
import { isPlaceholderName, useSession } from '@/lib/api/session';
import { getInitials } from '@/lib/initials';
import {
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  CircleUserRound,
  Heart,
  Building2,
  Home,
  ShieldCheck,
  Sparkles,
  MapPin,
  Tag,
  Key,
  ExternalLink,
  Crown,
  LogOut,
  User,
  Activity,
  Layers,
  ArrowRight,
  Check,
} from 'lucide-react';

/* 1. Large Buy Mega Menu Data */
const buyMegaData = {
  types: [
    { label: 'Flats & Apartments', sub: '1, 2, 3 BHK high-rise & gated flats', href: '/buy?type=Apartment' },
    { label: 'Independent House / Villa', sub: 'Luxury villas & private residences', href: '/buy?type=Villa' },
    { label: 'Residential Plots & Land', sub: 'CMDA / DTCP approved layout plots', href: '/buy?type=Plot' },
    { label: 'Commercial Properties', sub: 'Retail showrooms & office spaces', href: '/buy?type=Commercial' },
    { label: 'Farm Houses & Estates', sub: 'Weekend getaways & plantations', href: '/buy?type=Farmhouse' },
  ],
  budgets: [
    { label: 'Under ₹30 Lac', sub: 'Budget & starter homes', href: '/buy?maxPrice=3000000' },
    { label: '₹30 Lac – ₹50 Lac', sub: 'Affordable family homes', href: '/buy?minPrice=3000000&maxPrice=5000000' },
    { label: '₹50 Lac – ₹1.5 Cr', sub: 'Mid-segment residences', href: '/buy?minPrice=5000000&maxPrice=15000000' },
    { label: 'Luxury Above ₹1.5 Cr', sub: 'Penthouses & sea-facing villas', href: '/buy?minPrice=15000000' },
  ],
  localities: [
    { name: 'Anna Nagar', tag: 'Upscale avenues & metro', href: '/buy?locality=Anna Nagar' },
    { name: 'Adyar & Besant Nagar', tag: 'South Chennai coastal elegance', href: '/buy?locality=Adyar' },
    { name: 'OMR (IT Corridor)', tag: 'Tech parks & integrated townships', href: '/buy?locality=OMR' },
    { name: 'Velachery', tag: 'Prime hub & shopping malls', href: '/buy?locality=Velachery' },
    { name: 'ECR Beach Road', tag: 'Luxury villas & sea breeze', href: '/buy?locality=ECR' },
    { name: 'Porur & T. Nagar', tag: 'Central trade & family hubs', href: '/buy?locality=Porur' },
  ],
};

/* 2. Large Rent Mega Menu Data */
const rentMegaData = {
  bedrooms: [
    { label: '1 BHK Flats & Compacts', sub: 'Ideal for singles & bachelors', href: '/rent?bhk=1' },
    { label: '2 BHK Family Apartments', sub: 'Most popular rental format', href: '/rent?bhk=2' },
    { label: '3 BHK Spacious Residences', sub: 'Clubhouse & modern amenities', href: '/rent?bhk=3' },
    { label: '4+ BHK Penthouses & Villas', sub: 'Luxury private homes for rent', href: '/rent?bhk=4' },
    { label: 'Studio & 1 RK Rooms', sub: 'Low budget & close to IT parks', href: '/rent?type=Studio' },
  ],
  categories: [
    { label: 'Gated Community Flats', sub: '24/7 security, power backup & gym', href: '/rent?filter=gated' },
    { label: 'Independent Houses for Rent', sub: 'Private garden, parking & terrace', href: '/rent?type=House' },
    { label: 'Fully Furnished Homes', sub: 'Move in ready with appliances', href: '/rent?furnished=full' },
    { label: 'Semi-Furnished Apartments', sub: 'Wardrobes & modular kitchen', href: '/rent?furnished=semi' },
    { label: 'Commercial Offices & Shops', sub: 'Retail spaces, clinics & offices', href: '/rent?type=Commercial' },
  ],
  hotspots: [
    { name: 'OMR Tech Corridor', tag: 'Navalur, Sholinganallur, Thoraipakkam', href: '/rent?locality=OMR' },
    { name: 'Velachery & Guindy', tag: 'Metro hub & easy airport access', href: '/rent?locality=Velachery' },
    { name: 'Anna Nagar & Kilpauk', tag: 'Prime educational & residential hub', href: '/rent?locality=Anna Nagar' },
    { name: 'Adyar & Thiruvanmiyur', tag: 'Walk to beach & South Chennai', href: '/rent?locality=Adyar' },
    { name: 'Alwarpet & Nungambakkam', tag: 'Central Chennai high-end living', href: '/rent?locality=Alwarpet' },
  ],
};

/* 3. Large New Projects Mega Menu Data */
const projectsMegaData = {
  stages: [
    { label: 'Newly Launched Projects', sub: 'Pre-launch pricing & early offers', href: '/projects?status=New' },
    { label: 'Under Construction', sub: 'Flexible construction-linked milestones', href: '/projects?status=Ongoing' },
    { label: 'Ready to Move In Projects', sub: 'Zero GST, instant possession', href: '/projects?status=Ready' },
  ],
  collections: [
    { label: 'RERA Approved Communities', sub: '100% verified legal clear titles', href: '/projects?filter=rera' },
    { label: 'Gated Integrated Townships', sub: 'Schools, retail & lifestyle club inside', href: '/projects?filter=gated' },
    { label: 'Luxury Beachfront Villas', sub: 'Private infinity pools & ocean view', href: '/projects?locality=ECR' },
    { label: 'High-Rise Panoramic Towers', sub: 'Skyline views & designer penthouses', href: '/projects?type=Apartment' },
  ],
  corridors: [
    { name: 'OMR Phase 2 (Siruseri)', tag: 'Highest rental yield & IT boom', href: '/projects?locality=OMR' },
    { name: 'ECR Coastline & Kovalam', tag: 'Scenic beach retreats & villas', href: '/projects?locality=ECR' },
    { name: 'GST Road & Tambaram', tag: 'Transit hub & SEZ commercial belt', href: '/projects?locality=Tambaram' },
    { name: 'Porur & West Metro Extension', tag: 'Rapidly appreciating family corridor', href: '/projects?locality=Porur' },
  ],
};

/* 4. Large For Property Owners Mega Menu Data */
const ownerMegaData = {
  postServices: [
    { label: 'Post Property to Sell', sub: 'Free listing with 0% brokerage', href: '/sell?purpose=Sell', badge: 'FREE' },
    { label: 'Post Property for Rent', sub: 'Direct tenant leads without dealers', href: '/sell?purpose=Rent', badge: 'FREE' },
    { label: 'Commercial Unit Sale / Lease', sub: 'Connect with retail & corporate seekers', href: '/sell?purpose=Commercial' },
    { label: 'Dedicated Owner Portal Hub', sub: 'Explore why 18,000+ owners trust us', href: '/owner' },
  ],
  management: [
    { label: 'Owner Dashboard', sub: 'Live view counters & WhatsApp inquiries', href: '/owner/dashboard' },
    { label: 'My Listed Properties', sub: 'Manage, edit & renew your listings', href: '/owner/dashboard/properties' },
    { label: 'Owner Profile & Contacts', sub: 'Update phone, email & verification', href: '/owner/dashboard/profile' },
    { label: 'Invoices & Billing History', sub: 'GST receipts & payment records', href: '/owner/dashboard/payments' },
  ],
  plans: [
    { label: 'Basic Listing Plan (₹0)', sub: '100% Free forever with 30-60d validity', href: '/owner/plans' },
    { label: 'Gold Assist Package (₹1,999)', sub: 'Top search placement & verified badge', href: '/owner/plans' },
    { label: 'Titanium VIP Mandate (₹4,999)', sub: 'Dedicated RM until deal is closed', href: '/owner/plans' },
  ],
};

/* 5. Large For Agents & Brokers Mega Menu Data */
const agentMegaData = {
  portal: [
    { label: 'Agent Partner Portal', sub: 'Dedicated partner screen & onboarding', href: '/agent', badge: 'NEW' },
    { label: 'Broker Deal Console', sub: 'Real-time leads & mandate management', href: '/agent/dashboard', badge: 'CRM' },
    { label: 'Market & Deal Analytics', sub: 'Analyze live agent transactions & demand', href: '/agent#agent-analytics-hub' },
    { label: 'Post Commercial Mandate', sub: 'Grade-A tech parks & retail leasing', href: '/sell?purpose=Commercial' },
  ],
  services: [
    { label: 'RERA Verification Desk', sub: 'Verify your broker certificate', href: '/agent' },
    { label: 'Buyer Inquiry Pipeline', sub: 'Pre-approved mortgage buyer alerts', href: '/agent/dashboard#leads' },
    { label: 'Active Mandate Portfolio', sub: 'Syndicated prime inventory', href: '/agent/dashboard#mandates' },
    { label: 'Agent Login / Register', sub: 'Dedicated partner authentication', href: '/agent/login' },
  ],
  plans: [
    { label: '5 Locations Hub (₹2,999)', sub: 'Coverage in 5 chosen micro-markets', href: '/agent/packages' },
    { label: '10 Locations Partner (₹4,999)', sub: 'Top 10% search placement & co-broking', href: '/agent/packages' },
    { label: '15 Locations Syndicate (₹7,999)', sub: 'Metro-wide dominance & key account manager', href: '/agent/packages' },
  ],
};

export default function Header() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [userDropdown, setUserDropdown] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const pathname = usePathname();
  const wishlistCount = useWishlist().length;
  // Signed-in state comes from the backend session (name and current role).
  const { session } = useSession();
  const profile = session
    ? {
        name: isPlaceholderName(session.displayName) ? '' : session.displayName,
        role: session.role === 'OWNER' ? 'Owner' : session.role === 'BROKER' ? 'Agent' : 'Buyer',
      }
    : null;

  const headerRef = useRef<HTMLElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleDropdownEnter = (name: string) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setActiveDropdown(name);
  };

  const handleDropdownLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 220);
  };

  // Close menus on page route changes
  useEffect(() => {
    setOpen(false);
    setActiveDropdown(null);
    setUserDropdown(false);
  }, [pathname]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  // Click outside to dismiss dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
        setUserDropdown(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveDropdown(null);
        setUserDropdown(false);
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const closeMenu = () => {
    setOpen(false);
    setExpanded(null);
    setActiveDropdown(null);
  };

  const logout = () => {
    signOut();
    setUserDropdown(false);
    router.push('/');
  };

  const roleMenus = [
    {
      label: 'For Buyers',
      links: [
        { label: 'Buy Property', href: '/buy' },
        { label: 'Saved Homes', href: '/saved' },
        { label: 'My Activity', href: '/activity' },
        { label: 'Buyer Login', href: '/login?role=buyer' },
      ],
    },
    {
      label: 'For Owners',
      links: [
        { label: 'Owner Portal / Post Free', href: '/owner' },
        { label: 'Post Property to Sell', href: '/sell?purpose=Sell' },
        { label: 'Rent Out Property', href: '/sell?purpose=Rent' },
        { label: 'Owner Dashboard', href: '/owner/dashboard' },
        { label: 'Owner Plans & Pricing', href: '/owner/plans' },
        { label: 'Owner Login', href: '/login?role=owner' },
      ],
    },
    {
      label: 'For Agents',
      links: [
        { label: 'Agent Partner Portal', href: '/agent' },
        { label: 'Agent Deal Analytics', href: '/agent#agent-analytics-hub' },
        { label: 'Broker Console Dashboard', href: '/agent/dashboard' },
        { label: 'Agent Partner Plans', href: '/agent#plans' },
        { label: 'Agent Login', href: '/login?role=agent' },
        { label: 'Post Commercial Unit', href: '/sell?purpose=Commercial' },
      ],
    },
    {
      label: 'For Admin',
      links: [
        { label: 'Admin Login', href: '/admin/login' },
        { label: 'Admin Dashboard', href: '/admin-dashboard' },
      ],
    },
  ];

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-50 bg-white border-b border-slate-100 shadow-2xs"
    >
      <div className="container-site flex h-18 items-center justify-between gap-3 lg:gap-5 relative">
        {/* Brand Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 text-[#087ed9] font-extrabold text-xl tracking-tight shrink-0"
        >
          <Image
            src="/restamplogo.svg"
            alt="Restamp Logo"
            width={30}
            height={30}
            className="h-7.5 w-7.5 object-contain"
            priority
          />
          <span className="text-slate-900 font-bold">
            Re<span className="text-[#087ed9]">stamp</span>
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2.5 text-sm font-medium">
          {/* 1. BUY TAB */}
          <div
            className="relative py-4"
            onMouseEnter={() => handleDropdownEnter('Buy')}
            onMouseLeave={handleDropdownLeave}
          >
            <Link
              href="/buy"
              onClick={() => setActiveDropdown(null)}
              className={`flex items-center gap-1.5 py-2 px-3 rounded-xl transition cursor-pointer ${
                pathname.startsWith('/buy') || activeDropdown === 'Buy'
                  ? 'text-[#087ed9] font-bold bg-sky-50'
                  : 'text-slate-700 hover:text-[#087ed9] hover:bg-slate-50'
              }`}
            >
              <span>Buy</span>
              <ChevronDown
                size={14}
                className={`transition-transform duration-200 ${
                  activeDropdown === 'Buy' ? 'rotate-180 text-[#087ed9]' : 'text-slate-400'
                }`}
              />
            </Link>
          </div>

          {/* 2. RENT TAB */}
          <div
            className="relative py-4"
            onMouseEnter={() => handleDropdownEnter('Rent')}
            onMouseLeave={handleDropdownLeave}
          >
            <Link
              href="/rent"
              onClick={() => setActiveDropdown(null)}
              className={`flex items-center gap-1.5 py-2 px-3 rounded-xl transition cursor-pointer ${
                pathname.startsWith('/rent') || activeDropdown === 'Rent'
                  ? 'text-[#087ed9] font-bold bg-sky-50'
                  : 'text-slate-700 hover:text-[#087ed9] hover:bg-slate-50'
              }`}
            >
              <span>Rent</span>
              <ChevronDown
                size={14}
                className={`transition-transform duration-200 ${
                  activeDropdown === 'Rent' ? 'rotate-180 text-[#087ed9]' : 'text-slate-400'
                }`}
              />
            </Link>
          </div>

          {/* 3. NEW PROJECTS TAB */}
          <div
            className="relative py-4"
            onMouseEnter={() => handleDropdownEnter('Projects')}
            onMouseLeave={handleDropdownLeave}
          >
            <Link
              href="/projects"
              onClick={() => setActiveDropdown(null)}
              className={`flex items-center gap-1.5 py-2 px-3 rounded-xl transition cursor-pointer ${
                pathname.startsWith('/projects') || activeDropdown === 'Projects'
                  ? 'text-[#087ed9] font-bold bg-sky-50'
                  : 'text-slate-700 hover:text-[#087ed9] hover:bg-slate-50'
              }`}
            >
              <span>New projects</span>
              <ChevronDown
                size={14}
                className={`transition-transform duration-200 ${
                  activeDropdown === 'Projects' ? 'rotate-180 text-[#087ed9]' : 'text-slate-400'
                }`}
              />
            </Link>
          </div>

          {/* 4. FOR PROPERTY OWNERS TAB */}
          <div
            className="relative py-4"
            onMouseEnter={() => handleDropdownEnter('Owner')}
            onMouseLeave={handleDropdownLeave}
          >
            <Link
              href="/owner"
              onClick={() => setActiveDropdown(null)}
              className={`flex items-center gap-1.5 py-2 px-3 rounded-xl transition cursor-pointer ${
                pathname === '/owner' || activeDropdown === 'Owner'
                  ? 'text-[#087ed9] font-bold bg-sky-50'
                  : 'text-slate-700 hover:text-[#087ed9] hover:bg-slate-50'
              }`}
            >
              <span>For Owners</span>
              <ChevronDown
                size={14}
                className={`transition-transform duration-200 ${
                  activeDropdown === 'Owner' ? 'rotate-180 text-[#087ed9]' : 'text-slate-400'
                }`}
              />
            </Link>
          </div>

          {/* 5. FOR AGENTS TAB */}
          <div
            className="relative py-4"
            onMouseEnter={() => handleDropdownEnter('Agent')}
            onMouseLeave={handleDropdownLeave}
          >
            <Link
              href="/agent"
              onClick={() => setActiveDropdown(null)}
              className={`flex items-center gap-1.5 py-2 px-3 rounded-xl transition cursor-pointer ${
                pathname.startsWith('/agent') || activeDropdown === 'Agent'
                  ? 'text-[#087ed9] font-bold bg-sky-50'
                  : 'text-slate-700 hover:text-[#087ed9] hover:bg-slate-50'
              }`}
            >
              <span>For Agents</span>
              <span className="rounded bg-sky-100 text-[#087ed9] px-1.5 py-0.2 text-[9px] font-extrabold uppercase">
                Hub
              </span>
              <ChevronDown
                size={14}
                className={`transition-transform duration-200 ${
                  activeDropdown === 'Agent' ? 'rotate-180 text-[#087ed9]' : 'text-slate-400'
                }`}
              />
            </Link>
          </div>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3 text-slate-700">
          <Link
            href="/sell"
            className="hidden sm:flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 hover:border-slate-300 hover:shadow-xs transition"
          >
            Post property
            <span className="rounded bg-[#087ed9] px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">
              Free
            </span>
          </Link>

          {/* Wishlist */}
          <Link
            aria-label="Saved homes"
            href="/saved"
            className="relative p-2.5 hover:bg-slate-100 rounded-xl transition text-slate-600 hover:text-rose-600 flex items-center justify-center"
          >
            <Heart size={20} />
            {wishlistCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                {wishlistCount}
              </span>
            )}
          </Link>

          {/* Profile Trigger */}
          <div ref={userDropdownRef} className="relative">
            {profile ? (
              <button
                type="button"
                onClick={() => setUserDropdown(!userDropdown)}
                className="flex items-center gap-1.5 p-1 rounded-full hover:ring-2 hover:ring-sky-200 transition cursor-pointer"
                aria-label="User Account"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#087ed9] text-xs font-bold text-white shadow-xs">
                  {getInitials(profile.name) || <User size={16} />}
                </span>
              </button>
            ) : (
              <Link
                href="/login"
                aria-label="Login"
                className="p-2.5 hover:bg-slate-100 rounded-xl transition text-slate-600 hover:text-slate-900 flex items-center justify-center"
              >
                <User size={20} />
              </Link>
            )}

            {/* User Dropdown */}
            {userDropdown && profile && (
              <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-slate-100 bg-white p-2 shadow-xl z-50 animate-fadeIn">
                <div className="p-3 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-900 truncate">{profile.name || 'User Profile'}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Signed in with your mobile number</p>
                  <span className="mt-2 inline-block rounded-full bg-sky-50 px-2.5 py-0.5 text-[10px] font-semibold text-[#087ed9] capitalize">
                    {profile.role || 'Buyer'}
                  </span>
                </div>

                <div className="py-1">
                  <Link
                    href="/profile"
                    onClick={() => setUserDropdown(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#087ed9] rounded-xl transition"
                  >
                    <User size={15} className="text-slate-400" />
                    My Profile
                  </Link>
                  <Link
                    href="/owner/dashboard"
                    onClick={() => setUserDropdown(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#087ed9] rounded-xl transition"
                  >
                    <Crown size={15} className="text-amber-500" />
                    Owner Dashboard
                  </Link>
                  <Link
                    href="/saved"
                    onClick={() => setUserDropdown(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#087ed9] rounded-xl transition"
                  >
                    <Heart size={15} className="text-slate-400" />
                    Saved Homes
                  </Link>
                  <Link
                    href="/activity"
                    onClick={() => setUserDropdown(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#087ed9] rounded-xl transition"
                  >
                    <Activity size={15} className="text-slate-400" />
                    My Activity
                  </Link>
                </div>

                <div className="pt-1 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={logout}
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                  >
                    <LogOut size={15} />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Hamburger Menu Toggle Button */}
          <button
            type="button"
            className="p-2 hover:bg-slate-100 rounded-xl transition text-slate-700 cursor-pointer flex items-center justify-center"
            aria-label={open ? 'Close navigation' : 'Open navigation'}
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* =========================================================================
            LARGE FULL-CONTAINER MEGA DROPDOWN (Positioned relative to container-site)
           ========================================================================= */}
        {activeDropdown && (
          <div
            className="absolute top-full left-0 right-0 pt-2 z-50 animate-fadeIn"
            onMouseEnter={() => {
              if (hoverTimeoutRef.current) {
                clearTimeout(hoverTimeoutRef.current);
                hoverTimeoutRef.current = null;
              }
            }}
            onMouseLeave={handleDropdownLeave}
          >
            <div className="rounded-[28px] border border-slate-100/90 bg-white p-7 sm:p-8 shadow-[0_25px_70px_rgba(0,0,0,0.18)]">
              {/* ----------------- 1. BUY LARGE DROPDOWN ----------------- */}
              {activeDropdown === 'Buy' && (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                  {/* Col 1: Property Types (3 cols) */}
                  <div className="md:col-span-3">
                    <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-4">
                      Property Types
                    </p>
                    <div className="space-y-3">
                      {buyMegaData.types.map((item) => (
                        <Link
                          key={item.label}
                          href={item.href}
                          onClick={() => setActiveDropdown(null)}
                          className="group block"
                        >
                          <p className="text-xs font-bold text-slate-800 group-hover:text-[#087ed9] transition">
                            {item.label}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                            {item.sub}
                          </p>
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* Col 2: By Budget & Bedrooms (3 cols) */}
                  <div className="md:col-span-3">
                    <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-4">
                      By Budget
                    </p>
                    <div className="space-y-3">
                      {buyMegaData.budgets.map((item) => (
                        <Link
                          key={item.label}
                          href={item.href}
                          onClick={() => setActiveDropdown(null)}
                          className="group block"
                        >
                          <p className="text-xs font-bold text-slate-800 group-hover:text-[#087ed9] transition">
                            {item.label}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                            {item.sub}
                          </p>
                        </Link>
                      ))}
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-100">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                        Quick BHK Filter
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {['1 BHK', '2 BHK', '3 BHK', '4+ BHK'].map((bhk, i) => (
                          <Link
                            key={bhk}
                            href={`/buy?bhk=${i + 1}`}
                            onClick={() => setActiveDropdown(null)}
                            className="rounded-lg bg-slate-50 border border-slate-200/80 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:border-[#087ed9] hover:bg-sky-50 hover:text-[#087ed9] transition"
                          >
                            {bhk}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Col 3: Top Localities (3 cols) */}
                  <div className="md:col-span-3 rounded-2xl bg-slate-50/70 p-5 border border-slate-100">
                    <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-3.5">
                      Top Chennai Localities
                    </p>
                    <div className="space-y-3">
                      {buyMegaData.localities.map((item) => (
                        <Link
                          key={item.name}
                          href={item.href}
                          onClick={() => setActiveDropdown(null)}
                          className="group block"
                        >
                          <p className="text-xs font-bold text-slate-800 group-hover:text-[#087ed9] transition">
                            {item.name}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                            {item.tag}
                          </p>
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* Col 4: Featured Promo Card (3 cols) */}
                  <div className="md:col-span-3 rounded-2xl bg-gradient-to-br from-[#0c1829] to-slate-900 text-white p-6 flex flex-col justify-between shadow-md relative overflow-hidden">
                    <div className="relative z-10">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#087ed9]/30 border border-[#38bdf8]/40 px-2.5 py-0.5 text-[10px] font-extrabold tracking-wide text-[#38bdf8] uppercase">
                        Zero Brokerage Assurance
                      </span>
                      <h4 className="text-base font-extrabold text-white mt-3 leading-tight">
                        Direct From Verified Owners
                      </h4>
                      <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                        Skip middleman commissions completely. Connect with genuine home sellers in Chennai directly.
                      </p>
                    </div>

                    <div className="relative z-10 pt-5 space-y-2.5">
                      <Link
                        href="/buy?owner=true"
                        onClick={() => setActiveDropdown(null)}
                        className="flex items-center justify-center gap-1.5 w-full rounded-xl bg-[#087ed9] py-2.5 text-xs font-bold text-white hover:bg-[#0070c9] shadow-sm transition"
                      >
                        Explore Owner Homes <ArrowRight size={13} />
                      </Link>
                      <Link
                        href="/sell"
                        onClick={() => setActiveDropdown(null)}
                        className="block text-center text-[11px] font-medium text-slate-400 hover:text-white transition"
                      >
                        Selling your property? List Free →
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {/* ----------------- 2. RENT LARGE DROPDOWN ----------------- */}
              {activeDropdown === 'Rent' && (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                  {/* Col 1: Bedrooms (3 cols) */}
                  <div className="md:col-span-3">
                    <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-4">
                      By Configuration
                    </p>
                    <div className="space-y-3">
                      {rentMegaData.bedrooms.map((item) => (
                        <Link
                          key={item.label}
                          href={item.href}
                          onClick={() => setActiveDropdown(null)}
                          className="group block"
                        >
                          <p className="text-xs font-bold text-slate-800 group-hover:text-[#087ed9] transition">
                            {item.label}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                            {item.sub}
                          </p>
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* Col 2: Categories (3 cols) */}
                  <div className="md:col-span-3">
                    <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-4">
                      Property Category
                    </p>
                    <div className="space-y-3">
                      {rentMegaData.categories.map((item) => (
                        <Link
                          key={item.label}
                          href={item.href}
                          onClick={() => setActiveDropdown(null)}
                          className="group block"
                        >
                          <p className="text-xs font-bold text-slate-800 group-hover:text-[#087ed9] transition">
                            {item.label}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                            {item.sub}
                          </p>
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* Col 3: Rental Hotspots (3 cols) */}
                  <div className="md:col-span-3 rounded-2xl bg-slate-50/70 p-5 border border-slate-100">
                    <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-3.5">
                      Top Rental Hotspots
                    </p>
                    <div className="space-y-3">
                      {rentMegaData.hotspots.map((item) => (
                        <Link
                          key={item.name}
                          href={item.href}
                          onClick={() => setActiveDropdown(null)}
                          className="group block"
                        >
                          <p className="text-xs font-bold text-slate-800 group-hover:text-[#087ed9] transition">
                            {item.name}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                            {item.tag}
                          </p>
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* Col 4: Featured Promo Card (3 cols) */}
                  <div className="md:col-span-3 rounded-2xl bg-gradient-to-br from-sky-50 via-white to-blue-50/70 border border-sky-100 p-6 flex flex-col justify-between shadow-xs">
                    <div>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#087ed9] px-2.5 py-0.5 text-[10px] font-extrabold tracking-wide text-white uppercase">
                        Direct Landlords
                      </span>
                      <h4 className="text-base font-extrabold text-slate-900 mt-3 leading-tight">
                        Zero Commission Rentals
                      </h4>
                      <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                        Rent genuine homes directly from landlords. Encrypted phone number privacy protection included.
                      </p>
                    </div>

                    <div className="pt-5 space-y-2.5">
                      <Link
                        href="/rent"
                        onClick={() => setActiveDropdown(null)}
                        className="flex items-center justify-center gap-1.5 w-full rounded-xl bg-[#087ed9] py-2.5 text-xs font-bold text-white hover:bg-[#0070c9] shadow-sm transition"
                      >
                        Browse Rentals <ArrowRight size={13} />
                      </Link>
                      <Link
                        href="/sell?purpose=Rent"
                        onClick={() => setActiveDropdown(null)}
                        className="block text-center text-[11px] font-medium text-slate-500 hover:text-[#087ed9] transition"
                      >
                        Owner? List for Rent Free →
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {/* ----------------- 3. NEW PROJECTS LARGE DROPDOWN ----------------- */}
              {activeDropdown === 'Projects' && (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                  {/* Col 1: Stages (3 cols) */}
                  <div className="md:col-span-3">
                    <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-4">
                      Construction Stage
                    </p>
                    <div className="space-y-3">
                      {projectsMegaData.stages.map((item) => (
                        <Link
                          key={item.label}
                          href={item.href}
                          onClick={() => setActiveDropdown(null)}
                          className="group block"
                        >
                          <p className="text-xs font-bold text-slate-800 group-hover:text-[#087ed9] transition">
                            {item.label}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                            {item.sub}
                          </p>
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* Col 2: Collections (3 cols) */}
                  <div className="md:col-span-3">
                    <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-4">
                      Themed Collections
                    </p>
                    <div className="space-y-3">
                      {projectsMegaData.collections.map((item) => (
                        <Link
                          key={item.label}
                          href={item.href}
                          onClick={() => setActiveDropdown(null)}
                          className="group block"
                        >
                          <p className="text-xs font-bold text-slate-800 group-hover:text-[#087ed9] transition">
                            {item.label}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                            {item.sub}
                          </p>
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* Col 3: Corridors (3 cols) */}
                  <div className="md:col-span-3 rounded-2xl bg-slate-50/70 p-5 border border-slate-100">
                    <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-3.5">
                      Chennai Growth Corridors
                    </p>
                    <div className="space-y-3">
                      {projectsMegaData.corridors.map((item) => (
                        <Link
                          key={item.name}
                          href={item.href}
                          onClick={() => setActiveDropdown(null)}
                          className="group block"
                        >
                          <p className="text-xs font-bold text-slate-800 group-hover:text-[#087ed9] transition">
                            {item.name}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                            {item.tag}
                          </p>
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* Col 4: Featured Promo Card (3 cols) */}
                  <div className="md:col-span-3 rounded-2xl bg-gradient-to-br from-[#0c1829] to-slate-900 text-white p-6 flex flex-col justify-between shadow-md">
                    <div>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#087ed9]/30 border border-[#38bdf8]/40 px-2.5 py-0.5 text-[10px] font-extrabold tracking-wide text-[#38bdf8] uppercase">
                        VIP Concierge
                      </span>
                      <h4 className="text-base font-extrabold text-white mt-3 leading-tight">
                        Free Site Visit &amp; Advisory
                      </h4>
                      <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                        Complimentary cab visits, floor plans, RERA clearance verification &amp; negotiated builder pricing.
                      </p>
                    </div>

                    <div className="pt-5 space-y-2.5">
                      <Link
                        href="/projects"
                        onClick={() => setActiveDropdown(null)}
                        className="flex items-center justify-center gap-1.5 w-full rounded-xl bg-[#087ed9] py-2.5 text-xs font-bold text-white hover:bg-[#0070c9] shadow-sm transition"
                      >
                        Explore All Projects <ArrowRight size={13} />
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {/* ----------------- 4. FOR OWNERS LARGE DROPDOWN ----------------- */}
              {activeDropdown === 'Owner' && (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                  {/* Col 1: Post Services (3 cols) */}
                  <div className="md:col-span-3">
                    <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-4">
                      Post &amp; List
                    </p>
                    <div className="space-y-3">
                      {ownerMegaData.postServices.map((item) => (
                        <Link
                          key={item.label}
                          href={item.href}
                          onClick={() => setActiveDropdown(null)}
                          className="group block"
                        >
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-bold text-slate-800 group-hover:text-[#087ed9] transition">
                              {item.label}
                            </p>
                            {item.badge && (
                              <span className="rounded bg-[#087ed9] px-1.5 py-0.2 text-[9px] font-bold text-white uppercase">
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                            {item.sub}
                          </p>
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* Col 2: Owner Management (3 cols) */}
                  <div className="md:col-span-3">
                    <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-4">
                      Owner Management Studio
                    </p>
                    <div className="space-y-3">
                      {ownerMegaData.management.map((item) => (
                        <Link
                          key={item.label}
                          href={item.href}
                          onClick={() => setActiveDropdown(null)}
                          className="group block"
                        >
                          <p className="text-xs font-bold text-slate-800 group-hover:text-[#087ed9] transition">
                            {item.label}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                            {item.sub}
                          </p>
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* Col 3: Plans & Pricing (3 cols) */}
                  <div className="md:col-span-3 rounded-2xl bg-slate-50/70 p-5 border border-slate-100">
                    <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-3.5">
                      Plans &amp; Assistance
                    </p>
                    <div className="space-y-3">
                      {ownerMegaData.plans.map((item) => (
                        <Link
                          key={item.label}
                          href={item.href}
                          onClick={() => setActiveDropdown(null)}
                          className="group block"
                        >
                          <p className="text-xs font-bold text-slate-800 group-hover:text-[#087ed9] transition">
                            {item.label}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                            {item.sub}
                          </p>
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* Col 4: Featured Promo Card (3 cols) */}
                  <div className="md:col-span-3 rounded-2xl bg-gradient-to-br from-sky-50 via-white to-blue-50 border border-sky-100 p-6 flex flex-col justify-between shadow-xs">
                    <div>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-2.5 py-0.5 text-[10px] font-extrabold tracking-wide text-white uppercase">
                        18,000+ Owners Trust Us
                      </span>
                      <h4 className="text-base font-extrabold text-slate-900 mt-3 leading-tight">
                        Close Deals in 15 Days
                      </h4>
                      <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                        5,00,000+ active seekers in Chennai. Zero brokerage guarantee with instant direct WhatsApp leads.
                      </p>
                    </div>

                    <div className="pt-5 space-y-2.5">
                      <Link
                        href="/sell"
                        onClick={() => setActiveDropdown(null)}
                        className="flex items-center justify-center gap-1.5 w-full rounded-xl bg-[#087ed9] py-2.5 text-xs font-bold text-white hover:bg-[#0070c9] shadow-sm transition"
                      >
                        Post Free Property <ArrowRight size={13} />
                      </Link>
                      <Link
                        href="/owner"
                        onClick={() => setActiveDropdown(null)}
                        className="block text-center text-[11px] font-medium text-slate-500 hover:text-[#087ed9] transition"
                      >
                        Visit Dedicated Owner Screen →
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {/* ----------------- 5. AGENT LARGE DROPDOWN ----------------- */}
              {activeDropdown === 'Agent' && (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                  {/* Col 1: Portal & Tools (3 cols) */}
                  <div className="md:col-span-3">
                    <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-4">
                      Partner Hub &amp; Tools
                    </p>
                    <div className="space-y-3">
                      {agentMegaData.portal.map((item) => (
                        <Link
                          key={item.label}
                          href={item.href}
                          onClick={() => setActiveDropdown(null)}
                          className="group block"
                        >
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-bold text-slate-800 group-hover:text-[#087ed9] transition">
                              {item.label}
                            </p>
                            {item.badge && (
                              <span className="rounded bg-sky-100 text-[#087ed9] px-1.5 py-0.2 text-[9px] font-extrabold uppercase">
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                            {item.sub}
                          </p>
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* Col 2: Services & Workspaces (3 cols) */}
                  <div className="md:col-span-3">
                    <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-4">
                      Workspaces &amp; Inquiries
                    </p>
                    <div className="space-y-3">
                      {agentMegaData.services.map((item) => (
                        <Link
                          key={item.label}
                          href={item.href}
                          onClick={() => setActiveDropdown(null)}
                          className="group block"
                        >
                          <p className="text-xs font-bold text-slate-800 group-hover:text-[#087ed9] transition">
                            {item.label}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                            {item.sub}
                          </p>
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* Col 3: Plans & Tiers (3 cols) */}
                  <div className="md:col-span-3 rounded-2xl bg-slate-50/70 p-5 border border-slate-100">
                    <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-3.5">
                      Partner Tiers (0% Cut)
                    </p>
                    <div className="space-y-3">
                      {agentMegaData.plans.map((item) => (
                        <Link
                          key={item.label}
                          href={item.href}
                          onClick={() => setActiveDropdown(null)}
                          className="group block"
                        >
                          <p className="text-xs font-bold text-slate-800 group-hover:text-[#087ed9] transition">
                            {item.label}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                            {item.sub}
                          </p>
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* Col 4: Featured Promo Card (3 cols) */}
                  <div className="md:col-span-3 rounded-2xl bg-gradient-to-br from-slate-900 to-[#070e17] text-white p-6 flex flex-col justify-between shadow-xs border border-slate-800">
                    <div>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-extrabold tracking-wide text-emerald-300 uppercase">
                        140+ Partner Brokers
                      </span>
                      <h4 className="text-base font-extrabold text-white mt-3 leading-tight">
                        Scale Brokerage Revenue
                      </h4>
                      <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                        Direct verified buyer leads, mandate protection, and real-time deal flow analytics.
                      </p>
                    </div>

                    <div className="pt-5 space-y-2.5">
                      <Link
                        href="/agent/dashboard"
                        onClick={() => setActiveDropdown(null)}
                        className="flex items-center justify-center gap-1.5 w-full rounded-xl bg-[#087ed9] py-2.5 text-xs font-bold text-white hover:bg-sky-500 shadow-sm transition"
                      >
                        Open Agent Console <ArrowRight size={13} />
                      </Link>
                      <Link
                        href="/agent"
                        onClick={() => setActiveDropdown(null)}
                        className="block text-center text-[11px] font-medium text-slate-400 hover:text-white transition"
                      >
                        Explore Partner Network →
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Slide-Over Drawer Menu (Mobile & Quick Nav) */}
      {open && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity"
            onClick={closeMenu}
          />

          <aside className="absolute right-0 top-0 h-full w-[88%] max-w-sm bg-white shadow-2xl flex flex-col overflow-y-auto animate-slideInRight">
            {/* Drawer Header */}
            <div className="flex items-center justify-between bg-slate-50 px-5 py-4 border-b border-slate-100">
              <Link
                href={profile ? '/profile' : '/login'}
                onClick={closeMenu}
                className="flex items-center gap-3 text-slate-800 hover:text-[#087ed9] transition"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-50 text-[#087ed9] border border-sky-100 font-bold text-sm">
                  {(profile && getInitials(profile.name)) || <CircleUserRound size={22} />}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">
                    {profile ? profile.name || 'Restamp user' : 'Login / Register'}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {profile ? `Role: ${profile.role}` : 'Access your account'}
                  </p>
                </div>
              </Link>
              <button
                type="button"
                aria-label="Close menu"
                onClick={closeMenu}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Quick Action: Post Property */}
            <div className="p-4 border-b border-slate-100">
              <Link
                href="/sell"
                onClick={closeMenu}
                className="flex items-center justify-between rounded-xl bg-[#087ed9] px-4 py-3 text-xs font-bold text-white shadow-sm hover:bg-[#0070c9] transition"
              >
                <span className="flex items-center gap-2">
                  <Home size={16} />
                  Post Property Free
                </span>
                <span className="rounded bg-white/20 px-1.5 py-0.5 text-[9px] font-extrabold uppercase">
                  0% Brokerage
                </span>
              </Link>
            </div>

            {/* Main Navigation Items */}
            <div className="px-3 py-2 border-b border-slate-100">
              <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Explore Properties
              </p>
              <div className="space-y-0.5">
                <Link
                  href="/buy"
                  onClick={closeMenu}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#087ed9] transition"
                >
                  <span>Buy Homes &amp; Plots</span>
                  <ChevronRight size={14} className="text-slate-400" />
                </Link>
                <Link
                  href="/rent"
                  onClick={closeMenu}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#087ed9] transition"
                >
                  <span>Rent Residential &amp; Commercial</span>
                  <ChevronRight size={14} className="text-slate-400" />
                </Link>
                <Link
                  href="/projects"
                  onClick={closeMenu}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#087ed9] transition"
                >
                  <span>New Residential Projects</span>
                  <ChevronRight size={14} className="text-slate-400" />
                </Link>
                <Link
                  href="/owner"
                  onClick={closeMenu}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#087ed9] transition"
                >
                  <span>For Property Owners</span>
                  <span className="rounded bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-[#087ed9]">
                    Owner Hub
                  </span>
                </Link>
                <Link
                  href="/agent"
                  onClick={closeMenu}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#087ed9] transition"
                >
                  <span>For Agents &amp; Brokers</span>
                  <span className="rounded bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-[#087ed9]">
                    Agent Hub
                  </span>
                </Link>
              </div>
            </div>

            {/* Role Portals & Services Accordions */}
            <div className="flex-1 px-3 py-2">
              <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Portals &amp; Workspaces
              </p>
              <div className="space-y-1">
                {roleMenus.map((menu) => {
                  const isOpen = expanded === menu.label;
                  return (
                    <div key={menu.label} className="rounded-xl overflow-hidden border border-slate-100">
                      <button
                        type="button"
                        onClick={() => setExpanded(isOpen ? null : menu.label)}
                        className="flex w-full items-center justify-between px-3.5 py-2.5 text-left text-xs font-bold text-slate-800 hover:bg-slate-50 transition cursor-pointer"
                      >
                        <span>{menu.label}</span>
                        <ChevronRight
                          size={14}
                          className={`text-slate-400 transition-transform duration-200 ${
                            isOpen ? 'rotate-90 text-[#087ed9]' : ''
                          }`}
                        />
                      </button>

                      {isOpen && (
                        <div className="bg-slate-50/70 px-3 py-2 space-y-1 border-t border-slate-100">
                          {menu.links.map((link) => (
                            <Link
                              key={link.href}
                              href={link.href}
                              onClick={closeMenu}
                              className="block px-2.5 py-1.5 text-xs text-slate-600 hover:text-[#087ed9] hover:bg-white rounded-lg transition font-medium"
                            >
                              {link.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
              <Link href="/saved" onClick={closeMenu} className="flex items-center gap-1.5 hover:text-[#087ed9]">
                <Heart size={14} /> Saved ({wishlistCount})
              </Link>
              {profile ? (
                <button type="button" onClick={logout} className="flex items-center gap-1.5 text-rose-600 hover:underline cursor-pointer">
                  <LogOut size={14} /> Sign out
                </button>
              ) : (
                <Link href="/login" onClick={closeMenu} className="text-[#087ed9] font-bold hover:underline">
                  Sign in →
                </Link>
              )}
            </div>
          </aside>
        </div>
      )}
    </header>
  );
}