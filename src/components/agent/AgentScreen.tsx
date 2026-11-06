"use client";

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import {
  getAgentAnalyticsSummary,
} from '@/lib/agent-data';
import { locationPackages, type LocationPackage } from '@/lib/agentPlan';
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
  Building2,
  Bed,
  Bath,
  Maximize2,
  CheckCircle2,
  Tag,
  ShieldCheck,
  MapPin,
} from 'lucide-react';

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

const howItWorksAgent = [
  {
    step: '01',
    title: 'RERA Verification & Onboarding',
    description: 'Verify your agent RERA registration number and unlock verified agent status within 15 minutes.',
    icon: ShieldCheck,
    numberColor: 'text-[#087ed9]',
  },
  {
    step: '02',
    title: 'Browse Owner Properties',
    description: 'Access verified owner-posted properties in your chosen localities and match them with your active buyer leads.',
    icon: Building2,
    numberColor: 'text-[#087ed9]',
  },
  {
    step: '03',
    title: 'Close Deals & Retain 100% Commission',
    description: 'Receive verified buyer inquiries, schedule site visits, and retain 100% of your brokerage with zero platform cut.',
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
      {howItWorksAgent.map((item, index) => {
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

export default function AgentScreen() {
  const summary = getAgentAnalyticsSummary();

  // FAQ state
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: 'Does Restamp charge commission or take a cut of my brokerage?',
      a: 'No. Restamp operates on a strict 0% platform commission policy for verified agent partners. You keep 100% of the brokerage earned from your property buyers and sellers.',
    },
    {
      q: 'How does Restamp protect me from agent collision and lead poaching?',
      a: 'When you receive a verified buyer inquiry, the buyer contact is encrypted and tied to your agent console. We guarantee zero lead poaching on your assigned enquiries.',
    },
    {
      q: 'What is required to become a RERA-Verified Agent?',
      a: 'You simply provide your State RERA Agent Certificate (e.g. TN/AGENT/XXXX/YYYY) and PAN details. Our compliance desk checks the regulatory portal and activates your Verified Partner badge within 24 hours.',
    },
    {
      q: 'Can agents post properties on Restamp?',
      a: 'No. Properties are posted only by owners. As an agent you get access to owner-posted properties in your subscribed localities, plus buyer enquiries, site visits and deal tracking in your dashboard.',
    },
    {
      q: 'How do buyer inquiries reach me?',
      a: 'Inquiries arrive instantly via direct WhatsApp alerts, push notifications, and are recorded in your real-time Agent CRM console with full buyer budget, property intent, and loan readiness status.',
    },
    {
      q: 'Can I co-broke with other Restamp verified agents?',
      a: 'Yes. Restamp has a trusted Agent Network where agents can share client requirements with pre-agreed 50:50 commission split escrow terms.',
    },
  ];

  return (
    <div className="bg-white text-slate-900 min-h-screen">
      {/* Architectural Full-Bleed Hero Banner (Matching Owner Screen Architecture) */}
      <section
        className="relative w-full overflow-hidden bg-[#070e17] min-h-[640px] sm:min-h-[700px] md:min-h-[760px] lg:min-h-[820px] flex flex-col justify-between py-10 sm:py-14 md:py-16"
        style={{
          backgroundImage:
            'linear-gradient(180deg, rgba(7, 14, 23, 0.45) 0%, rgba(7, 14, 23, 0.15) 35%, rgba(7, 14, 23, 0.88) 100%), linear-gradient(90deg, rgba(7, 14, 23, 0.9) 0%, rgba(7, 14, 23, 0.5) 50%, rgba(7, 14, 23, 0.22) 100%), url(/images/skyline-elite.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center 35%',
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
              BUILT TO EMPOWER
            </p>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-normal tracking-tight text-white leading-[1.08] drop-shadow-md">
              Scale deal flow agents love
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base md:text-lg text-white/80 leading-relaxed font-light drop-shadow-xs max-w-xl">
              Direct access to high-intent property buyers, verified owner properties, zero agent collision, and real-time deal closing analytics across prime Indian micro-markets.
            </p>

            {/* Pill CTA Button (Matching Reference Design) */}
            <div className="pt-2 flex flex-wrap items-center gap-4">
              <Link
                href="/agent/dashboard"
                className="inline-flex items-center gap-3.5 rounded-full bg-white hover:bg-slate-100 text-slate-900 font-semibold pl-6 pr-2.5 py-2.5 text-sm transition-all duration-300 hover:scale-[1.02] shadow-2xl group active:scale-[0.98]"
              >
                <span>Get started</span>
                <span className="h-8 w-8 rounded-full bg-[#070e17] text-white flex items-center justify-center transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 shadow-sm">
                  <ArrowUpRight size={15} />
                </span>
              </Link>

              <Link
                href="/agent/packages"
                className="inline-flex items-center gap-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white px-5 py-2.5 text-sm font-medium transition border border-white/20 active:scale-[0.98]"
              >
                <span>Micro-Market Packages</span>
              </Link>

              <div className="flex items-center gap-2 text-xs sm:text-sm text-white/75 bg-slate-950/40 backdrop-blur-md px-4 py-2.5 rounded-full border border-white/10">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>0% Platform Commission · 100% Commission Retained</span>
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
                  const target = document.getElementById('restamp-broker-advantage') || document.getElementById('how-it-works-agent');
                  target?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="rounded-full bg-[#070e17]/70 hover:bg-[#070e17]/90 backdrop-blur-md px-5 py-2 border border-white/20 text-xs font-medium text-white/90 flex items-center gap-2 shadow-xl transition-all duration-200 hover:scale-105 cursor-pointer"
              >
                <span>Scroll down</span>
                <ChevronDown size={13} className="text-white/70 animate-bounce" />
              </button>
            </div>

            {/* 5 Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6 sm:gap-8 text-white">
              <div>
                <p className="text-2xl sm:text-3xl md:text-4xl font-light tracking-tight text-white">
                  <CountUp end={summary.totalAgentsCount} duration={1800} suffix="+" />
                </p>
                <p className="text-xs sm:text-sm text-white/65 mt-1 font-light">Verified agents</p>
              </div>

              <div>
                <p className="text-2xl sm:text-3xl md:text-4xl font-light tracking-tight text-white">
                  <CountUp end={summary.activeMandatesCount} duration={2000} suffix="+" />
                </p>
                <p className="text-xs sm:text-sm text-white/65 mt-1 font-light">Owner properties</p>
              </div>

              <div>
                <p className="text-2xl sm:text-3xl md:text-4xl font-light tracking-tight text-white">
                  <CountUp end={summary.totalInventoryValueCr} duration={2200} prefix="₹" suffix=" Cr" decimals={1} />
                </p>
                <p className="text-xs sm:text-sm text-white/65 mt-1 font-light">Inventory value</p>
              </div>

              <div>
                <p className="text-2xl sm:text-3xl md:text-4xl font-light tracking-tight text-white">
                  <CountUp end={summary.avgDaysToClose} duration={1800} suffix="d" decimals={1} />
                </p>
                <p className="text-xs sm:text-sm text-white/65 mt-1 font-light">Avg deal velocity</p>
              </div>

              <div className="col-span-2 sm:col-span-1">
                <p className="text-2xl sm:text-3xl md:text-4xl font-light tracking-tight text-white flex items-center gap-1.5">
                  <Star size={20} className="fill-amber-400 text-amber-400" />
                  <CountUp end={4.9} duration={1600} decimals={1} suffix=" / 5" />
                </p>
                <p className="text-xs sm:text-sm text-white/65 mt-1 font-light">Agent trust score</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Restamp Broker Difference (Bento Grid matching OwnerScreen architecture) */}
      <section id="restamp-broker-advantage" className="py-20 bg-[#eceef2] border-b border-slate-200/70 scroll-mt-20">
        <div className="container-site">
          <div className="max-w-xl mb-12">
            <p className="eyebrow text-[#087ed9]">The Restamp Agent Advantage</p>
            <h2 className="section-title mt-1.5 text-slate-900">Built exclusively for real estate closers</h2>
            <p className="mt-2 text-sm text-slate-500">
              An institutional-grade deal engine engineered to help verified agents close mandates faster.
            </p>
          </div>

          {/* Top Row: 3 Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-7">
            {/* Card 1: 0% Platform Commission Guarantee */}
            <div className="rounded-[28px] sm:rounded-[32px] bg-white p-7 sm:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_36px_rgba(0,0,0,0.07)] transition duration-300 flex flex-col justify-between group">
              <div className="h-48 sm:h-52 rounded-2xl bg-[#fafbfe] border border-slate-100/90 flex items-center justify-center overflow-hidden mb-7 relative p-5">
                <div className="bg-gradient-to-br from-sky-50 to-white border border-sky-100 text-slate-900 relative z-10 rounded-2xl px-4 py-3.5 shadow-xl flex items-center gap-3.5 max-w-[270px] w-full transform group-hover:scale-[1.03] transition duration-300">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#087ed9]/25 text-[#38bdf8]">
                    <Tag size={16} strokeWidth={2.5} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 tracking-wide truncate">Zero Platform Commission</p>
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-snug truncate">
                      Keep 100% of your brokerage fees
                    </p>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">100% Commission Retention</h3>
                <p className="mt-2 text-xs sm:text-[13px] text-slate-500 leading-relaxed">
                  Unlike conventional portals that demand revenue shares, Restamp does not take a single rupee from your closed deals.
                </p>
              </div>
            </div>

            {/* Card 2: Zero Mandate Collision & Locking */}
            <div className="rounded-[28px] sm:rounded-[32px] bg-white p-7 sm:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_36px_rgba(0,0,0,0.07)] transition duration-300 flex flex-col justify-between group">
              <div className="h-48 sm:h-52 rounded-2xl bg-[#fafbfe] border border-slate-100/90 flex items-center justify-center overflow-hidden mb-7 relative p-5">
                <div className="bg-gradient-to-br from-sky-50 to-white border border-sky-100 text-slate-900 relative z-10 rounded-2xl p-4 shadow-xl max-w-[210px] w-full transform -rotate-2 group-hover:rotate-0 transition duration-300">
                  <div className="flex items-center gap-2 mb-2">
                    <Lock size={14} className="text-[#087ed9]" />
                    <p className="text-[11px] font-bold text-slate-900 tracking-wide">Mandate Locked</p>
                  </div>
                  <div className="space-y-1.5">
                    <div className="h-2 bg-gradient-to-r from-[#087ed9] to-[#38bdf8] rounded-full w-5/6" />
                    <div className="h-2 bg-slate-200 rounded-full w-3/5" />
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">Zero Agent Collision</h3>
                <p className="mt-2 text-xs sm:text-[13px] text-slate-500 leading-relaxed">
                  Your client leads are locked to your agent console. No duplicate lead hijacking.
                </p>
              </div>
            </div>

            {/* Card 3: Pre-Approved Bank Loan Buyers */}
            <div className="rounded-[28px] sm:rounded-[32px] bg-white p-7 sm:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_36px_rgba(0,0,0,0.07)] transition duration-300 flex flex-col justify-between group">
              <div className="h-48 sm:h-52 rounded-2xl bg-[#fafbfe] border border-slate-100/90 flex items-center justify-center overflow-hidden mb-7 relative p-4">
                <div className="grid grid-cols-2 gap-2.5 w-full max-w-[240px]">
                  <div className="h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold">
                    HDFC Bank
                  </div>
                  <div className="h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center text-[10px] font-bold">
                    SBI Home
                  </div>
                  <div className="h-10 rounded-xl bg-amber-500 text-slate-900 flex items-center justify-center text-[10px] font-extrabold">
                    ICICI Bank
                  </div>
                  <div className="h-10 rounded-xl bg-[#087ed9] text-white flex items-center justify-center text-[10px] font-bold">
                    Axis Bank
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">Sanctioned Buyer Leads</h3>
                <p className="mt-2 text-xs sm:text-[13px] text-slate-500 leading-relaxed">
                  Over 64% of buyer inquiries carry pre-approved mortgage sanction letters, reducing your transaction closing cycle to days.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works for Agents */}
      <section className="py-20 bg-white border-b border-slate-100">
        <div className="container-site">
          <div className="max-w-xl mb-12">
            <p className="eyebrow text-[#087ed9]">Three Step Syndicate Workflow</p>
            <h2 className="section-title mt-1.5 text-slate-900">How to close with Restamp</h2>
            <p className="mt-2 text-sm text-slate-500">Fast onboarding designed specifically for certified agents.</p>
          </div>

          <HowItWorksSteps />
        </div>
      </section>

      {/* Agent Plans & Pricing — Location Packages (Matching Mockup Architecture) */}
      <section id="plans" className="py-24 bg-[#f4f4f6] border-b border-slate-200/70 scroll-mt-20">
        <div className="container-site">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-14">
            <div>
              <p className="eyebrow text-[#087ed9]">Micro-Market Packages</p>
              <h2 className="section-title mt-1.5 text-slate-900">Choose your coverage scale</h2>
              <p className="mt-2 text-sm text-slate-500 max-w-xl">
                Select the number of high-demand micro-markets you want to syndicate. Keep 100% of your brokerage with zero platform cut.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200/80 text-xs font-semibold text-slate-700 shadow-2xs">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>90-Day Syndication Access · 0% Commission</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-7 items-stretch">
            {locationPackages.map((pkg) => {
              const isFeatured = pkg.popular;
              return (
                <div
                  key={pkg.id}
                  className={`relative rounded-[32px] sm:rounded-[36px] bg-white p-7 sm:p-9 flex flex-col justify-between transition-all duration-300 ${
                    isFeatured
                      ? 'border border-slate-200/80 shadow-xl shadow-slate-300/40 overflow-hidden'
                      : 'border border-slate-200/80 shadow-sm hover:shadow-xl hover:shadow-slate-200/40'
                  }`}
                >
                  {/* Glowing Sunset Ambient Mesh Aura for Featured Card */}
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
                        {pkg.name}
                      </span>
                      {isFeatured && (
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-900 text-white text-[10px] font-extrabold uppercase tracking-wider shadow-xs">
                          Most Popular
                        </span>
                      )}
                    </div>

                    {/* Price & Billing */}
                    <div className="mt-4 flex items-baseline gap-3 relative z-10">
                      <span className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
                        ₹{pkg.price.toLocaleString('en-IN')}
                      </span>
                      <div className="text-[11px] leading-tight font-medium">
                        <span
                          className={`block font-bold ${
                            isFeatured ? 'text-slate-900' : 'text-slate-700'
                          }`}
                        >
                          ₹{pkg.monthlyEquivalent.toLocaleString('en-IN')} / mo eq.
                        </span>
                        <span className="block text-slate-400">
                          billed quarterly (90 days)
                        </span>
                      </div>
                    </div>

                    {/* Primary CTA Button (Positioned at Top like Reference Design) */}
                    <div className="mt-6 relative z-10">
                      <Link
                        href={`/agent/packages?pkg=${pkg.id}`}
                        className={`w-full py-4 px-6 rounded-2xl font-bold text-sm tracking-wide transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer ${
                          isFeatured
                            ? 'bg-[#18181b] hover:bg-black text-white shadow-md shadow-slate-900/10'
                            : 'bg-[#f4f4f5] hover:bg-[#e4e4e7] text-slate-900'
                        }`}
                      >
                        <span>Select {pkg.locationLimit} Micro-Markets</span>
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
                      {pkg.features.map((feature, idx) => (
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
                      href={`/agent/packages?pkg=${pkg.id}`}
                      className="text-xs text-slate-400 hover:text-slate-700 font-medium transition inline-flex items-center gap-1"
                    >
                      <span>Need higher limits?</span>
                      <span className="text-[#087ed9] font-semibold">Explore options &rarr;</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Agent FAQs Accordion */}
      <section className="py-20 bg-white border-b border-slate-100">
        <div className="container-site max-w-4xl">
          <div className="text-center max-w-lg mx-auto mb-12">
            <p className="eyebrow text-[#087ed9]">Frequently Asked Questions</p>
            <h2 className="section-title mt-1.5 text-slate-900">Agent Q&amp;A</h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={faq.q}
                  className="rounded-2xl border border-slate-200 bg-white overflow-hidden transition duration-200"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full text-left px-6 py-4.5 flex items-center justify-between gap-4 font-bold text-slate-900 text-sm hover:text-[#087ed9] transition cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-50 text-slate-400 shrink-0">
                      {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-5 pt-1 text-xs sm:text-sm text-slate-500 leading-relaxed border-t border-slate-50">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="container-site py-12 sm:py-16">
        <div className="bg-gradient-to-br from-sky-50 to-white border border-sky-100 text-slate-900 rounded-[32px] p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-8 shadow-sm">
          <div className="max-w-xl text-center md:text-left">
            <span className="inline-block px-3 py-1 rounded-full bg-sky-500/20 text-sky-600 text-xs font-bold uppercase tracking-wider mb-2">
              Ready to Expand?
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Join 140+ Top Real Estate Closers on Restamp
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
              Activate your agent profile today, verify your RERA certificate, and access real-time pre-approved buyer inquiries.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <Link
              href="/agent/dashboard"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#087ed9] text-white hover:bg-[#0670c2] font-bold text-xs sm:text-sm px-6 py-3.5 shadow-md shadow-[#087ed9]/25 transition"
            >
              Open Agent Dashboard <ArrowRight size={15} />
            </Link>
            <Link
              href="/agent/dashboard/properties"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white hover:border-[#087ed9] hover:text-[#087ed9] border border-slate-200 text-slate-900 font-bold text-xs sm:text-sm px-6 py-3.5 transition"
            >
              Browse Owner Properties
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
