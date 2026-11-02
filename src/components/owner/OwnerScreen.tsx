"use client";

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import PostPropertyWizard from '@/components/owner/PostPropertyWizard';
import { ownerPlans, type OwnerPlan } from '@/lib/ownerPlan';
import {
  Check,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  ArrowUpRight,
  Shield,
  Clock,
  Sparkles,
  Phone,
  Lock,
  Star,
  Home,
  Maximize2,
  CheckCircle2,
  Tag,
  UploadCloud,
  ShieldCheck,
} from 'lucide-react';

/* Property types by intent */
const propertyOptions = {
  Sell: ['Apartment / Flat', 'Independent House / Villa', 'Builder Floor', 'Plot / Land'],
  Rent: ['Apartment / Flat', 'Independent House / Villa', 'Builder Floor', 'Studio / 1 RK'],
  Commercial: ['Office Space', 'Shop / Showroom', 'Commercial Land', 'Warehouse'],
};

type Intent = 'Sell' | 'Rent' | 'Commercial';

/* Animated counter component with viewport observer & smooth cubic ease-out */
function CountUp({
  start = 0,
  end,
  duration = 1800,
  prefix = '',
  suffix = '',
  decimals = 0,
  formatIndian = false,
}: {
  start?: number;
  end: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  formatIndian?: boolean;
}) {
  const [count, setCount] = useState(start);
  const ref = useRef<HTMLSpanElement>(null);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Trigger immediately if already in view
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom >= 0) {
      setHasStarted(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasStarted) {
          setHasStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasStarted]);

  useEffect(() => {
    if (!hasStarted) return;
    if (start === end) {
      setCount(end);
      return;
    }

    let startTime: number | null = null;
    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Smooth cubic ease-out
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setCount(start + easeOut * (end - start));

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setCount(end);
      }
    };

    animationFrameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrameId);
  }, [hasStarted, start, end, duration]);

  const displayValue = formatIndian
    ? Math.floor(count).toLocaleString('en-IN')
    : decimals > 0
    ? count.toFixed(decimals)
    : Math.floor(count).toString();

  return (
    <span ref={ref} className="inline-block tabular-nums">
      {prefix}
      {displayValue}
      {suffix}
    </span>
  );
}

const howItWorksData = [
  {
    step: '01',
    title: 'Enter specs & photos',
    description: 'Add your property type, locality, price, and upload clear smartphone photos.',
    icon: UploadCloud,
    numberColor: 'text-[#087ed9]',
  },
  {
    step: '02',
    title: 'Fast 24-hr verification',
    description: 'Our desk verifies listing authenticity to award the Verified Owner badge.',
    icon: ShieldCheck,
    numberColor: 'text-[#087ed9]',
  },
  {
    step: '03',
    title: 'Close deal directly',
    description: 'Receive calls from genuine buyers/tenants, schedule visits, and finalize with zero fees.',
    icon: CheckCircle2,
    numberColor: 'text-emerald-600',
  },
];

function HowItWorksSteps() {
  const [activeStep, setActiveStep] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [inView, setInView] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Trigger immediately if already in view
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom >= 0) {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (isHovered) return;
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 3);
    }, 3600);
    return () => clearInterval(interval);
  }, [isHovered]);

  return (
    <div
      ref={containerRef}
      className="grid md:grid-cols-3 gap-8 pt-2"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {howItWorksData.map((item, index) => {
        const isActive = activeStep === index;
        const Icon = item.icon;
        return (
          <div
            key={item.step}
            onMouseEnter={() => setActiveStep(index)}
            onClick={() => setActiveStep(index)}
            className={`group rounded-2xl p-6 -m-3 transition-all duration-500 cursor-pointer relative ${
              inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            } ${
              isActive
                ? 'bg-slate-50/90 shadow-[0_4px_24px_rgba(0,0,0,0.04)] -translate-y-1'
                : 'hover:bg-slate-50/50 hover:-translate-y-0.5'
            }`}
            style={{ transitionDelay: `${index * 120}ms` }}
          >
            {/* Top track with animated progress line */}
            <div className="h-0.5 w-full bg-slate-200/80 rounded-full overflow-hidden relative mb-5">
              <div
                className={`h-full rounded-full transition-all duration-700 ease-out ${
                  isActive
                    ? 'w-full bg-gradient-to-r from-[#087ed9] to-[#38bdf8]'
                    : 'w-10 bg-slate-300 group-hover:w-24 group-hover:bg-[#087ed9]/50'
                }`}
              />
            </div>

            {/* Header: Step Number & Micro-Icon */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-bold font-mono tracking-wider transition-colors duration-300 ${item.numberColor}`}
                >
                  {item.step}
                </span>
                {isActive && (
                  <span className="flex h-1.5 w-1.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#087ed9] opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#087ed9]" />
                  </span>
                )}
              </div>

              {/* Minimal Animated Micro Icon */}
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-300 ${
                  isActive
                    ? 'bg-sky-50 text-[#087ed9] scale-110 shadow-2xs'
                    : 'bg-slate-50 text-slate-400 group-hover:text-[#087ed9] group-hover:bg-sky-50/60'
                }`}
              >
                <Icon size={16} strokeWidth={2.2} />
              </div>
            </div>

            {/* Title */}
            <h3
              className={`text-base font-bold mt-3 tracking-tight transition-colors duration-300 ${
                isActive ? 'text-slate-900' : 'text-slate-800 group-hover:text-[#087ed9]'
              }`}
            >
              {item.title}
            </h3>

            {/* Description */}
            <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
              {item.description}
            </p>
          </div>
        );
      })}
    </div>
  );
}

export default function OwnerScreen() {
  const searchParams = useSearchParams();

  // URL query pre-fills (e.g. /owner?purpose=Rent or /sell?purpose=Rent)
  const queryPurpose = searchParams.get('purpose');

  // Fast-Start State matching reference design
  const [intent, setIntent] = useState<Intent>(
    queryPurpose === 'Rent' || queryPurpose === 'Lease' ? 'Rent' : 'Sell'
  );
  const [selectedType] = useState<string>(propertyOptions.Sell[0]);
  const [phone, setPhone] = useState<string>('');

  // Plans category toggle
  const [planCategory, setPlanCategory] = useState<'Residential' | 'Commercial'>('Residential');

  // FAQ accordion open state
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: 'Is listing a property completely free on Restamp?',
      a: 'Yes. Individual property owners can list residential or commercial properties completely free of cost with 0% brokerage. Your listing stays active for 30–60 days with direct inquiries from verified home seekers.',
    },
    {
      q: 'How does Restamp protect my phone number from spam?',
      a: 'We use number masking and buyer verification so your phone number is only shared with verified, genuine prospects — filtering out telemarketers and broker spam.',
    },
    {
      q: 'How quickly does my listing go live?',
      a: 'Our verification team reviews property details within 2 to 24 hours. Once verified, your listing goes live across search results and inquiry alerts.',
    },
    {
      q: 'Can I list both rental and resale properties?',
      a: 'Yes. You can post apartments, independent houses, villas, plots, office spaces, and commercial shops for sale, resale, rent, or lease.',
    },
    {
      q: 'What is the "Verified Owner" badge?',
      a: 'The Verified Owner tag confirms property ownership, reassuring buyers and tenants and typically generating 3x more direct responses.',
    },
    {
      q: 'Are assisted services available if I need help?',
      a: 'Yes. For owners who prefer a hands-off experience, our Gold and Titanium plans provide professional photography, relationship managers, and legal agreement drafting.',
    },
  ];

  return (
    <div className="bg-white text-slate-900 min-h-screen">
      {/* Architectural Full-Bleed Hero Banner (Matching Reference Design) */}
      <section
        className="relative w-full overflow-hidden bg-[#070e17] min-h-[640px] sm:min-h-[700px] md:min-h-[760px] lg:min-h-[820px] flex flex-col justify-between py-10 sm:py-14 md:py-16"
        style={{
          backgroundImage:
            'linear-gradient(180deg, rgba(7, 14, 23, 0.45) 0%, rgba(7, 14, 23, 0.15) 35%, rgba(7, 14, 23, 0.85) 100%), linear-gradient(90deg, rgba(7, 14, 23, 0.88) 0%, rgba(7, 14, 23, 0.45) 50%, rgba(7, 14, 23, 0.2) 100%), url(/images/owner-architectural-hero.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center 45%',
        }}
      >
        {/* Blueprint Architectural Grid Framing with Corner Crosshairs */}
        <div className="absolute inset-4 sm:inset-8 md:inset-10 lg:inset-12 border border-white/15 pointer-events-none z-10">
          <span className="absolute -top-2.5 -left-2.5 text-white/40 text-xs font-mono font-light select-none">+</span>
          <span className="absolute -top-2.5 -right-2.5 text-white/40 text-xs font-mono font-light select-none">+</span>
          <span className="absolute -bottom-2.5 -left-2.5 text-white/40 text-xs font-mono font-light select-none">+</span>
          <span className="absolute -bottom-2.5 -right-2.5 text-white/40 text-xs font-mono font-light select-none">+</span>
        </div>

        {/* Top / Main Hero Content */}
        <div className="container-site w-full relative z-20 pt-6 sm:pt-10 md:pt-14">
          <div className="max-w-2xl space-y-6 text-white">
            {/* Architectural Eyebrow */}
            <p className="text-xs sm:text-[13px] font-medium tracking-[0.22em] text-white/70 uppercase font-mono">
              BUILT TO INSPIRE
            </p>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-normal tracking-tight text-white leading-[1.08] drop-shadow-md">
              Design spaces people love
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base md:text-lg text-white/80 leading-relaxed font-light drop-shadow-xs max-w-xl">
              Bring your architectural projects to life with a template that puts your work front and center. Simple, elegant, and made for creators like you.
            </p>

            {/* Pill CTA Button (Matching Reference Design) */}
            <div className="pt-2 flex flex-wrap items-center gap-4">
              <Link
                href="/sell"
                className="inline-flex items-center gap-3.5 rounded-full bg-white hover:bg-slate-100 text-slate-900 font-semibold pl-6 pr-2.5 py-2.5 text-sm transition-all duration-300 hover:scale-[1.02] shadow-2xl group active:scale-[0.98]"
              >
                <span>Get started</span>
                <span className="h-8 w-8 rounded-full bg-[#070e17] text-white flex items-center justify-center transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 shadow-sm">
                  <ArrowUpRight size={15} />
                </span>
              </Link>

              <div className="flex items-center gap-2 text-xs sm:text-sm text-white/75 bg-slate-950/40 backdrop-blur-md px-4 py-2.5 rounded-full border border-white/10">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>0% Platform Commission · 100% Free Listing</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Architectural Metrics Strip Integrated into Banner Base */}
        <div className="container-site w-full relative z-20 pt-16 sm:pt-24 pb-4 sm:pb-6">
          <div className="relative border-t border-white/15 pt-8 sm:pt-10">
            {/* Center Floating "Scroll down" Pill Badge */}
            <div className="absolute -top-5 left-1/2 -translate-x-1/2">
              <button
                type="button"
                onClick={() => {
                  const target = document.getElementById('restamp-difference');
                  target?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="rounded-full bg-[#070e17]/70 hover:bg-[#070e17]/90 backdrop-blur-md px-5 py-2 border border-white/20 text-xs font-medium text-white/90 flex items-center gap-2 shadow-xl transition-all duration-200 hover:scale-105 cursor-pointer"
              >
                <span>Scroll down</span>
                <ChevronDown size={13} className="text-white/70 animate-bounce" />
              </button>
            </div>

            {/* 4 Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 text-white">
              <div>
                <p className="text-2xl sm:text-3xl md:text-4xl font-light tracking-tight text-white">
                  <CountUp prefix="₹" end={0} duration={1200} />
                </p>
                <p className="text-xs sm:text-sm text-white/65 mt-1 font-light">Zero brokerage</p>
              </div>

              <div>
                <p className="text-2xl sm:text-3xl md:text-4xl font-light tracking-tight text-white">
                  <CountUp end={15} duration={1600} suffix=" Days" />
                </p>
                <p className="text-xs sm:text-sm text-white/65 mt-1 font-light">Average closure</p>
              </div>

              <div>
                <p className="text-2xl sm:text-3xl md:text-4xl font-light tracking-tight text-white">
                  <CountUp end={500000} duration={2000} formatIndian suffix="+" />
                </p>
                <p className="text-xs sm:text-sm text-white/65 mt-1 font-light">Active verified seekers</p>
              </div>

              <div>
                <p className="text-2xl sm:text-3xl md:text-4xl font-light tracking-tight text-white">
                  <CountUp end={4.9} duration={1800} decimals={1} suffix=" / 5" />
                </p>
                <p className="text-xs sm:text-sm text-white/65 mt-1 font-light">Owner satisfaction</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Restamp Difference — Bento Grid matching User Reference Design */}
      <section id="restamp-difference" className="py-20 bg-[#eceef2] border-b border-slate-200/70 scroll-mt-20">
        <div className="container-site">
          <div className="max-w-xl mb-12">
            <p className="eyebrow text-[#087ed9]">The Restamp Difference</p>
            <h2 className="section-title mt-1.5 text-slate-900">Why owners list with us</h2>
            <p className="mt-2 text-sm text-slate-500">
              A transparent, direct-to-buyer platform built to help you rent or sell faster.
            </p>
          </div>

          {/* Top Row: 3 Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-7">
            {/* Card 1: Monthly voucher / Zero Brokerage Guarantee (Matching reference) */}
            <div className="rounded-[28px] sm:rounded-[32px] bg-white p-7 sm:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_36px_rgba(0,0,0,0.07)] transition duration-300 flex flex-col justify-between group">
              <div className="h-48 sm:h-52 rounded-2xl bg-[#fafbfe] border border-slate-100/90 flex items-center justify-center overflow-hidden mb-7 relative p-5">
                {/* Horizontal ghost wireframe bars matching reference */}
                <div className="absolute inset-x-8 space-y-2.5 pointer-events-none opacity-45">
                  <div className="flex gap-2">
                    <div className="h-2 w-14 bg-slate-200 rounded-full" />
                    <div className="h-2 w-28 bg-slate-200 rounded-full" />
                  </div>
                  <div className="h-2 w-44 bg-slate-200 rounded-full" />
                  <div className="h-2 w-24 bg-slate-200 rounded-full" />
                  <div className="h-2 w-36 bg-slate-200 rounded-full" />
                  <div className="flex gap-2">
                    <div className="h-2 w-20 bg-slate-200 rounded-full" />
                    <div className="h-2 w-16 bg-slate-200 rounded-full" />
                  </div>
                </div>

                {/* Floating Dark Pill Tag with Restamp Blue highlight matching reference */}
                <div className="relative z-10 rounded-2xl bg-[#0c111d] text-white px-4 py-3.5 shadow-[0_16px_36px_-6px_rgba(0,0,0,0.3)] border border-slate-800/90 flex items-center gap-3.5 max-w-[270px] w-full transform group-hover:scale-[1.03] transition duration-300">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#087ed9]/25 text-[#38bdf8]">
                    <Tag size={16} strokeWidth={2.5} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white tracking-wide truncate">0% Brokerage</p>
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-snug truncate">
                      When you list &amp; close with direct buyers
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">Zero Brokerage Guarantee</h3>
                <p className="mt-2 text-xs sm:text-[13px] text-slate-500 leading-relaxed">
                  Keep 100% of your deal amount. We never charge commission or hidden brokerage fees from property owners.
                </p>
              </div>
            </div>

            {/* Card 2: Multiple address / Direct Inquiries (Matching reference) */}
            <div className="rounded-[28px] sm:rounded-[32px] bg-white p-7 sm:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_36px_rgba(0,0,0,0.07)] transition duration-300 flex flex-col justify-between group">
              <div className="h-48 sm:h-52 rounded-2xl bg-[#fafbfe] border border-slate-100/90 flex items-center justify-center overflow-hidden mb-7 relative p-5">
                {/* Halftone dot pattern in the top-right corner matching reference */}
                <div className="absolute top-3 right-3 opacity-30 pointer-events-none">
                  <svg width="68" height="68" viewBox="0 0 68 68" fill="none">
                    <pattern id="dot-grid" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
                      <circle cx="2" cy="2" r="1.2" fill="#94a3b8" />
                    </pattern>
                    <rect width="68" height="68" fill="url(#dot-grid)" />
                  </svg>
                </div>

                {/* Stacked background address items matching reference */}
                <div className="absolute top-8 left-7 space-y-4 pointer-events-none opacity-60">
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400">Address 1</span>
                    <div className="h-2 w-28 bg-slate-200/80 rounded-full mt-1.5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400">Address 3</span>
                    <div className="h-2 w-20 bg-slate-200/80 rounded-full mt-1.5" />
                  </div>
                </div>

                {/* Foreground elevated dark card matching reference tilted address 2 */}
                <div className="relative z-10 ml-auto mr-1 mt-4 rounded-2xl bg-[#0c111d] text-white p-3.5 shadow-[0_16px_36px_-6px_rgba(0,0,0,0.3)] border border-slate-800/90 max-w-[195px] w-full transform -rotate-2 group-hover:rotate-0 transition duration-300">
                  <p className="text-[11px] font-bold text-white tracking-wide">Address 2 · Direct Lead</p>
                  <div className="space-y-1.5 mt-2.5">
                    <div className="h-2 bg-gradient-to-r from-[#087ed9] to-[#38bdf8] rounded-full w-4/5" />
                    <div className="h-2 bg-slate-700/70 rounded-full w-3/5" />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">Direct Inquiries</h3>
                <p className="mt-2 text-xs sm:text-[13px] text-slate-500 leading-relaxed">
                  Ship inquiries seamlessly to your phone with direct calls and WhatsApp leads from verified home seekers.
                </p>
              </div>
            </div>

            {/* Card 3: 20+ brands / Partner Portals (Matching reference) */}
            <div className="rounded-[28px] sm:rounded-[32px] bg-white p-7 sm:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_36px_rgba(0,0,0,0.07)] transition duration-300 flex flex-col justify-between group">
              <div className="h-48 sm:h-52 rounded-2xl bg-[#fafbfe] border border-slate-100/90 flex items-center justify-center overflow-hidden mb-7 relative p-4">
                {/* 4x3 Grid of brand / portal tiles matching reference */}
                <div className="grid grid-cols-4 gap-2.5 w-full max-w-[270px]">
                  {/* Row 1 */}
                  <div className="h-9 rounded-xl bg-slate-950 text-white flex items-center justify-center text-[9px] font-extrabold tracking-wider shadow-2xs">
                    RESTAMP
                  </div>
                  <div className="h-9 rounded-xl bg-slate-100" />
                  <div className="h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center text-[9px] font-extrabold shadow-2xs">
                    99ac
                  </div>
                  <div className="h-9 rounded-xl bg-[#087ed9] text-white flex items-center justify-center text-[9px] font-bold shadow-2xs">
                    MB
                  </div>

                  {/* Row 2 */}
                  <div className="h-9 rounded-xl bg-slate-100" />
                  <div className="h-9 rounded-xl bg-rose-500 text-white flex items-center justify-center text-[9px] font-bold shadow-2xs">
                    RERA
                  </div>
                  <div className="h-9 rounded-xl bg-white border border-slate-200 text-rose-600 flex items-center justify-center text-[9px] font-bold shadow-2xs">
                    Housing
                  </div>
                  <div className="h-9 rounded-xl bg-slate-100" />

                  {/* Row 3 */}
                  <div className="h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center text-[9px] font-bold shadow-2xs">
                    WA
                  </div>
                  <div className="h-9 rounded-xl bg-slate-100" />
                  <div className="h-9 rounded-xl bg-slate-100" />
                  <div className="h-9 rounded-xl bg-slate-800 text-white flex items-center justify-center text-[9px] font-bold shadow-2xs">
                    20+
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">20+ Partner Portals</h3>
                <p className="mt-2 text-xs sm:text-[13px] text-slate-500 leading-relaxed">
                  Discover buyer excellence across 20+ top real estate networks with verified owner syndication on Restamp.
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Row: 2 Wider Cards (Matching Security & Paylater in reference) */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-7 mt-6 sm:mt-7">
            {/* Card 4 (5 cols): Security & PIN (Inspired by Security circular waves in reference) */}
            <div className="md:col-span-5 rounded-[28px] sm:rounded-[32px] bg-white p-7 sm:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_36px_rgba(0,0,0,0.07)] transition duration-300 flex flex-col justify-between group">
              <div className="h-48 sm:h-52 rounded-2xl bg-[#fafbfe] border border-slate-100/90 flex items-center justify-center overflow-hidden mb-7 relative">
                {/* Concentric sonar ripples matching reference */}
                <div className="absolute h-72 w-72 rounded-full border border-slate-200/35 pointer-events-none" />
                <div className="absolute h-56 w-56 rounded-full border border-slate-200/55 pointer-events-none" />
                <div className="absolute h-40 w-40 rounded-full border border-slate-200/75 pointer-events-none" />
                <div className="absolute h-24 w-24 rounded-full border border-sky-300/60 pointer-events-none" />

                {/* Centered elevated white card with "Enter pin" and 4 cells matching reference */}
                <div className="relative z-10 bg-white rounded-2xl p-4 sm:p-5 shadow-[0_12px_30px_rgba(0,0,0,0.08)] border border-slate-100 flex flex-col items-center gap-2 transform group-hover:scale-105 transition duration-300">
                  <span className="text-[11px] font-semibold text-slate-700 tracking-tight">Enter pin</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="h-7 w-7 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center text-xs font-bold text-slate-800">
                      •
                    </span>
                    <span className="h-7 w-7 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center text-xs font-bold text-slate-800">
                      •
                    </span>
                    <span className="h-7 w-7 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center text-xs font-bold text-slate-800">
                      •
                    </span>
                    <span className="h-7 w-7 rounded-lg bg-[#087ed9] border border-[#087ed9] text-white flex items-center justify-center text-xs font-bold shadow-2xs">
                      •
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">Security &amp; Privacy Shield</h3>
                <p className="mt-2 text-xs sm:text-[13px] text-slate-500 leading-relaxed">
                  Authorize your orders and inquiries confidently with encrypted phone masking for personalized privacy protection.
                </p>
              </div>
            </div>

            {/* Card 5 (7 cols): Paylater Option (Inspired by Paylater Option tabs in reference) */}
            <div className="md:col-span-7 rounded-[28px] sm:rounded-[32px] bg-white p-7 sm:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_36px_rgba(0,0,0,0.07)] transition duration-300 flex flex-col justify-between group">
              <div className="h-48 sm:h-52 rounded-2xl bg-[#fafbfe] border border-slate-100/90 flex items-center justify-center overflow-hidden mb-7 relative p-4 sm:p-6">
                {/* Pill bar container holding 3 option cards matching reference */}
                <div className="bg-[#eceef2] rounded-3xl p-2 sm:p-2.5 flex items-center gap-2 sm:gap-3 max-w-lg w-full border border-slate-200/60 shadow-inner">
                  {/* Option 1: Selected Active Card (like $1,800 black card in reference, with Restamp Blue) */}
                  <div className="bg-[#0c111d] text-white rounded-2xl p-3 sm:p-3.5 shadow-[0_12px_28px_rgba(0,0,0,0.25)] border border-slate-800 flex-1 transform -translate-y-0.5">
                    <p className="text-[10px] font-semibold text-[#38bdf8] uppercase tracking-wider">3 Month · Free</p>
                    <p className="text-base sm:text-lg font-extrabold text-white mt-0.5 tracking-tight">
                      ₹0 <span className="text-[10px] text-slate-400 font-normal">/ mo</span>
                    </p>
                  </div>

                  {/* Option 2: 6 Month / Gold */}
                  <div className="bg-white rounded-2xl p-3 sm:p-3.5 border border-slate-200/80 text-slate-700 flex-1 shadow-2xs">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">6 Month</p>
                    <p className="text-sm sm:text-base font-bold text-slate-900 mt-0.5 tracking-tight">
                      ₹1,999 <span className="text-[10px] text-slate-400 font-normal">/ mo</span>
                    </p>
                  </div>

                  {/* Option 3: 12 Month / VIP */}
                  <div className="bg-white rounded-2xl p-3 sm:p-3.5 border border-slate-200/80 text-slate-700 flex-1 shadow-2xs">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">12 Month</p>
                    <p className="text-sm sm:text-base font-bold text-slate-900 mt-0.5 tracking-tight">
                      ₹4,999 <span className="text-[10px] text-slate-400 font-normal">/ mo</span>
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">Paylater option</h3>
                <p className="mt-2 text-xs sm:text-[13px] text-slate-500 leading-relaxed">
                  Shop now, pay later! Enjoy flexible listing validity: 0% free active ad, or assisted closing options for hassle-free convenience.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Simple Steps */}
      <section className="py-16 bg-white border-b border-slate-100">
        <div className="container-site">
          <div className="max-w-xl mb-12">
            <p className="eyebrow text-[#087ed9]">Process</p>
            <h2 className="section-title mt-1.5 text-slate-900">How it works</h2>
            <p className="mt-2 text-sm text-slate-500">Three straightforward steps to close your deal.</p>
          </div>

          <HowItWorksSteps />
        </div>
      </section>

      {/* Integrated Property Posting Studio (The Wizard) */}
      <section id="owner-property-studio" className="py-16 md:py-20 bg-slate-50/50 border-b border-slate-100 scroll-mt-20">
        <div className="container-site">
          <div className="mb-8">
            <p className="eyebrow text-[#087ed9]">Property Studio</p>
            <h2 className="section-title mt-1.5 text-slate-900">Complete your property listing</h2>
            <p className="mt-1 text-sm text-slate-500">
              Provide accurate location, specifications, and pricing below to publish your listing.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-7 shadow-xs">
            <PostPropertyWizard
              initialPurpose={intent === 'Commercial' ? 'Lease' : intent}
              initialCategory={intent === 'Commercial' ? 'Commercial' : 'Residential'}
              initialPropertyType={selectedType}
              initialPhone={phone}
              doneHref="/owner/dashboard"
              doneLabel="Go to Owner Dashboard"
            />
          </div>
        </div>
      </section>

      {/* Owner Assistance Plans — Matching Modern Mockup Architecture */}
      <section className="py-24 bg-[#f4f4f6] border-b border-slate-200/70 scroll-mt-20">
        <div className="container-site">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-14">
            <div>
              <p className="eyebrow text-[#087ed9]">Assistance Plans</p>
              <h2 className="section-title mt-1.5 text-slate-900">Upgrade when you need extra reach</h2>
              <p className="mt-2 text-sm text-slate-500 max-w-xl">
                Get dedicated relationship manager assistance, top search placement, and direct verified WhatsApp buyer leads.
              </p>
            </div>
            <div className="inline-flex rounded-2xl bg-white border border-slate-200/80 p-1 text-xs font-semibold shadow-2xs">
              {(['Residential', 'Commercial'] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setPlanCategory(cat)}
                  className={`px-4 py-2 rounded-xl transition cursor-pointer ${
                    planCategory === cat ? 'bg-slate-900 text-white shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-7 items-stretch">
            {ownerPlans[planCategory].map((p: OwnerPlan) => {
              const isFeatured = p.popular;
              return (
                <div
                  key={p.id}
                  className={`relative rounded-[32px] sm:rounded-[36px] bg-white p-7 sm:p-9 flex flex-col justify-between transition-all duration-300 ${
                    isFeatured
                      ? 'border border-slate-200/80 shadow-xl shadow-slate-300/40 overflow-hidden'
                      : 'border border-slate-200/80 shadow-sm hover:shadow-xl hover:shadow-slate-200/40'
                  }`}
                >
                  {/* Glowing Sunset Ambient Mesh Aura for Featured Plan */}
                  {isFeatured && (
                    <div
                      className="absolute -top-12 -left-12 -right-12 h-64 pointer-events-none rounded-t-[36px] overflow-hidden opacity-90"
                      style={{
                        background:
                          'radial-gradient(ellipse at 50% 28%, rgba(147, 197, 253, 0.55) 0%, rgba(254, 215, 170, 0.6) 45%, rgba(251, 207, 232, 0.4) 75%, transparent 100%)',
                        filter: 'blur(36px)',
                      }}
                    />
                  )}

                  {/* Top Tier Block */}
                  <div>
                    <div className="flex items-center justify-between relative z-10">
                      <span
                        className={`text-xl font-bold tracking-tight ${
                          isFeatured
                            ? 'bg-gradient-to-r from-sky-600 via-amber-600 to-rose-600 bg-clip-text text-transparent'
                            : 'text-slate-900'
                        }`}
                      >
                        {p.name}
                      </span>
                      {isFeatured && (
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-900 text-white text-[10px] font-extrabold uppercase tracking-wider shadow-xs">
                          {p.highlight || 'Most Popular'}
                        </span>
                      )}
                    </div>

                    {/* Price & Billing */}
                    <div className="mt-4 flex items-baseline gap-3 relative z-10">
                      <span className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
                        {p.price === 0 ? 'Free' : `₹${p.price.toLocaleString('en-IN')}`}
                      </span>
                      <div className="text-[11px] leading-tight font-medium">
                        <span
                          className={`block font-bold ${
                            isFeatured ? 'text-slate-900' : 'text-slate-700'
                          }`}
                        >
                          {p.priceSub1}
                        </span>
                        <span className="block text-slate-400">
                          {p.priceSub2}
                        </span>
                      </div>
                    </div>

                    {/* Primary CTA Button (Positioned at Top like Reference Mockup) */}
                    <div className="mt-6 relative z-10">
                      <Link
                        href="/owner/plans"
                        className={`w-full py-4 px-6 rounded-2xl font-bold text-sm tracking-wide transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer ${
                          isFeatured
                            ? 'bg-[#18181b] hover:bg-black text-white shadow-md shadow-slate-900/10'
                            : 'bg-[#f4f4f5] hover:bg-[#e4e4e7] text-slate-900'
                        }`}
                      >
                        <span>{p.price === 0 ? 'Use Free Plan' : 'Select Plan'}</span>
                        <ArrowRight size={15} />
                      </Link>
                    </div>

                    {/* Subtle Hairline Divider */}
                    <div
                      className={`mt-8 pt-7 border-t relative z-10 ${
                        isFeatured ? 'border-slate-100' : 'border-slate-100/90'
                      }`}
                    />

                    {/* Feature Bullets with Clean Checkmarks */}
                    <div className="space-y-3.5 relative z-10">
                      {p.features.map((feature, idx) => (
                        <div
                          key={idx}
                          className={`flex items-start gap-3 text-sm leading-snug ${
                            isFeatured
                              ? 'text-slate-800 font-medium'
                              : 'text-slate-600'
                          }`}
                        >
                          <Check
                            size={16}
                            strokeWidth={isFeatured ? 2.5 : 2.2}
                            className={`shrink-0 mt-0.5 ${
                              isFeatured ? 'text-[#087ed9]' : 'text-slate-900'
                            }`}
                          />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Card Footer Link */}
                  <div className="pt-8 mt-8 border-t border-slate-100 relative z-10">
                    <Link
                      href="/owner/plans"
                      className="text-xs text-slate-400 hover:text-slate-700 font-medium transition inline-flex items-center gap-1"
                    >
                      <span>Need custom assistance?</span>
                      <span className="text-[#087ed9] font-semibold">Explore options &rarr;</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section className="py-16 bg-slate-50/60">
        <div className="container-site max-w-2xl">
          <div className="mb-10 text-center">
            <p className="eyebrow text-[#087ed9]">FAQ</p>
            <h2 className="section-title mt-1.5 text-slate-900">Common questions</h2>
          </div>

          <div className="space-y-2.5">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div key={faq.q} className="rounded-xl border border-slate-200/80 bg-white overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full flex items-center justify-between gap-4 p-4 text-left text-sm font-semibold text-slate-900 hover:text-[#087ed9] transition cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <span className="text-slate-400">
                      {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 text-xs sm:text-sm text-slate-500 leading-relaxed border-t border-slate-100 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
