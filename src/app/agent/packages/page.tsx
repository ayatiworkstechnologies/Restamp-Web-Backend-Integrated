"use client";

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { getSession, loginHref } from '@/lib/api/session';
import {
  locationPackages,
  availableAgentLocations,
  saveDraftPackage,
  getDraftPackage,
  type LocationPackage,
  type AgentLocation,
} from '@/lib/agentPlan';
import {
  Check,
  CheckCircle2,
  MapPin,
  Search,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Building2,
  TrendingUp,
  AlertCircle,
  X,
  Layers,
  ChevronRight,
  Filter,
} from 'lucide-react';

export default function AgentPackagesPage() {
  const router = useRouter();

  // Wizard sub-step: 1 = Choose Package Tier, 2 = Choose Micro-Markets
  const [step, setStep] = useState<1 | 2>(1);

  // Selected package (default: Growth Agent 10 locations)
  const [selectedPkgId, setSelectedPkgId] = useState<'loc-5' | 'loc-10' | 'loc-15'>('loc-5');
  const currentPackage = useMemo(
    () => locationPackages.find((p) => p.id === selectedPkgId) || locationPackages[0],
    [selectedPkgId]
  );

  // Selected locations (defaults empty so agent can make fresh selection or restore from draft)
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('All');
  const [limitWarning, setLimitWarning] = useState<string | null>(null);

  // Load existing draft or URL query param if available
  useEffect(() => {
    let pkgFromUrl: 'loc-5' | 'loc-10' | 'loc-15' | null = null;
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const pkgParam = params.get('pkg');
      if (pkgParam === 'loc-5' || pkgParam === 'loc-10' || pkgParam === 'loc-15') {
        pkgFromUrl = pkgParam;
        setSelectedPkgId(pkgParam);
        setStep(2);
      }
    }

    const draft = getDraftPackage();
    if (draft) {
      if (!pkgFromUrl && draft.packageId) setSelectedPkgId(draft.packageId);
      if (draft.selectedLocations && draft.selectedLocations.length > 0) {
        setSelectedLocations(draft.selectedLocations);
      }
    }
  }, []);

  // Filter locations based on query and region
  const filteredLocations = useMemo(() => {
    return availableAgentLocations.filter((loc) => {
      const matchesSearch =
        loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loc.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loc.tag.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRegion = selectedRegion === 'All' || loc.region === selectedRegion;

      return matchesSearch && matchesRegion;
    });
  }, [searchQuery, selectedRegion]);

  // Handle Package Selection & Transition to Step 2
  const handleSelectPackageAndProceed = (pkgId: 'loc-5' | 'loc-10' | 'loc-15') => {
    setSelectedPkgId(pkgId);
    const newPkg = locationPackages.find((p) => p.id === pkgId)!;

    // Adjust selected locations if they exceed new limit
    if (selectedLocations.length > newPkg.locationLimit) {
      setSelectedLocations(selectedLocations.slice(0, newPkg.locationLimit));
    }
    setLimitWarning(null);

    // Transition to Step 2: Choose Micro-Markets
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Switch package while inside Step 2
  const handleChangePackageTier = (pkgId: 'loc-5' | 'loc-10' | 'loc-15') => {
    setSelectedPkgId(pkgId);
    const newPkg = locationPackages.find((p) => p.id === pkgId)!;
    if (selectedLocations.length > newPkg.locationLimit) {
      setSelectedLocations(selectedLocations.slice(0, newPkg.locationLimit));
      setLimitWarning(
        `Selection adjusted to ${newPkg.locationLimit} locations for ${newPkg.name}.`
      );
    } else {
      setLimitWarning(null);
    }
  };

  // Handle Location Toggle
  const toggleLocation = (locationName: string) => {
    setLimitWarning(null);

    if (selectedLocations.includes(locationName)) {
      setSelectedLocations(selectedLocations.filter((l) => l !== locationName));
      return;
    }

    // Check if adding would exceed limit
    if (selectedLocations.length >= currentPackage.locationLimit) {
      const nextPkg =
        selectedPkgId === 'loc-5'
          ? locationPackages[1]
          : selectedPkgId === 'loc-10'
          ? locationPackages[2]
          : null;

      if (nextPkg) {
        setLimitWarning(
          `You have reached the ${currentPackage.locationLimit}-location limit. Upgrade to ${nextPkg.name} (${nextPkg.locationLimit} Locations) to add more.`
        );
      } else {
        setLimitWarning(
          `Maximum ${currentPackage.locationLimit} locations allowed for this package. Deselect a location to add this one.`
        );
      }
      return;
    }

    setSelectedLocations([...selectedLocations, locationName]);
  };

  // Quick remove location from pill
  const removeLocation = (locationName: string) => {
    setSelectedLocations(selectedLocations.filter((l) => l !== locationName));
  };

  // Continue to Payment
  const handleContinueToPayment = () => {
    if (selectedLocations.length === 0) {
      setLimitWarning(`Please select at least 1 preferred micro-market location to continue.`);
      return;
    }

    // Save draft for payment checkout
    saveDraftPackage({
      packageId: selectedPkgId,
      selectedLocations,
      updatedAt: new Date().toISOString(),
    });

    // Check login
    if (!getSession()) {
      router.push(loginHref('/agent/payment', 'agent'));
      return;
    }

    router.push('/agent/payment');
  };

  // Bill calculation
  const gst = Math.round(currentPackage.price * 0.18);
  const totalPayable = currentPackage.price + gst;

  return (
    <>
      <Header />
      <main className="min-h-screen bg-slate-50/70 py-8 sm:py-12 md:py-14 text-slate-900">
        <div className="container-site max-w-7xl mx-auto space-y-10">
          {/* Top Master Breadcrumbs Indicator */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs font-medium text-slate-400">
            <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
              <CheckCircle2 size={15} className="text-emerald-500" />
              <span>1. Verification</span>
            </span>
            <span className="text-slate-300">/</span>

            {/* Step 1: Package */}
            <button
              type="button"
              onClick={() => {
                setStep(1);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full border transition cursor-pointer ${
                step === 1
                  ? 'bg-sky-50 text-[#087ed9] border-sky-300 font-bold'
                  : 'bg-white text-emerald-600 border-emerald-200 font-semibold'
              }`}
            >
              {step === 2 ? (
                <CheckCircle2 size={13} className="text-emerald-500" />
              ) : (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#087ed9] text-white text-[10px] font-bold">
                  2
                </span>
              )}
              <span>Plan: {currentPackage.name}</span>
            </button>

            <span className="text-slate-300">/</span>

            {/* Step 2: Locations */}
            <span
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full border transition ${
                step === 2
                  ? 'bg-sky-50 text-[#087ed9] border-sky-300 font-bold shadow-2xs'
                  : 'bg-slate-100 text-slate-400 border-slate-200'
              }`}
            >
              <span
                className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold ${
                  step === 2 ? 'bg-[#087ed9] text-white' : 'bg-slate-300 text-slate-700'
                }`}
              >
                3
              </span>
              <span>Choose Locations</span>
            </span>

            <span className="text-slate-300">/</span>
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-slate-200 text-slate-500 text-[10px] font-bold">
                4
              </span>
              <span>Payment</span>
            </span>
            <span className="text-slate-300">/</span>
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-slate-200 text-slate-500 text-[10px] font-bold">
                5
              </span>
              <span>Portal</span>
            </span>
          </div>

          {/* ========================================================================= */}
          {/* SUB-STEP 1: CHOOSE PACKAGE TIER (5, 10, or 15 Locations)                   */}
          {/* ========================================================================= */}
          {step === 1 && (
            <div className="space-y-8 animate-fadeIn">
              <div className="text-center max-w-3xl mx-auto space-y-3">
                <span className="inline-block px-3 py-1 rounded-full bg-sky-100/70 text-xs font-bold text-[#087ed9] uppercase tracking-wider">
                  Step 1 of 2: Select Location Tier
                </span>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
                  Choose Your Micro-Market <span className="text-[#087ed9]">Package</span>
                </h1>
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                  Choose how many high-demand Indian micro-markets you want to syndicate. In the next step, you will handpick the exact localities.
                </p>
              </div>

              {/* 3 Package Comparison Cards (Matching Mockup Design) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-7 items-stretch pt-2">
                {locationPackages.map((pkg) => {
                  const isFeatured = pkg.popular;
                  const isSelected = selectedPkgId === pkg.id;
                  return (
                    <div
                      key={pkg.id}
                      onClick={() => setSelectedPkgId(pkg.id)}
                      className={`relative rounded-[32px] sm:rounded-[36px] bg-white p-7 sm:p-9 flex flex-col justify-between transition-all duration-300 cursor-pointer ${
                        isFeatured
                          ? 'border border-slate-200/80 shadow-xl shadow-slate-300/40 overflow-hidden'
                          : 'border border-slate-200/80 shadow-sm hover:shadow-xl hover:shadow-slate-200/40'
                      } ${isSelected ? 'ring-2 ring-slate-900' : ''}`}
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
                              {pkg.badge}
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
                              / 90 days access
                            </span>
                            <span className="block text-slate-400">
                              ₹{pkg.monthlyEquivalent.toLocaleString('en-IN')}/mo equiv.
                            </span>
                          </div>
                        </div>

                        {/* Primary CTA Button (Positioned at Top like Reference Mockup) */}
                        <div className="mt-6 relative z-10">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectPackageAndProceed(pkg.id);
                            }}
                            className={`w-full py-4 px-6 rounded-2xl font-bold text-sm tracking-wide transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer ${
                              isFeatured
                                ? 'bg-[#18181b] hover:bg-black text-white shadow-md shadow-slate-900/10'
                                : 'bg-[#f4f4f5] hover:bg-[#e4e4e7] text-slate-900'
                            }`}
                          >
                            <span>Choose {pkg.locationLimit} Locations</span>
                            <ArrowRight size={15} />
                          </button>
                        </div>

                        {/* Subtle Hairline Divider */}
                        <div className="mt-8 pt-7 border-t border-slate-100 relative z-10" />

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
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectPackageAndProceed(pkg.id);
                          }}
                          className="text-xs text-slate-400 hover:text-slate-700 font-medium transition inline-flex items-center gap-1 cursor-pointer"
                        >
                          <span>Need custom micro-markets?</span>
                          <span className="text-[#087ed9] font-semibold">Explore options &rarr;</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Sticky Action Bar for Step 1 */}
              <div className="bg-gradient-to-br from-sky-50 to-white border border-sky-100 text-slate-900 bg-slate-900 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <span className="text-[11px] font-bold text-sky-600 uppercase tracking-wider block">
                    Selected Package
                  </span>
                  <p className="text-lg font-black text-slate-900">
                    {currentPackage.name} ({currentPackage.badge}) • ₹{currentPackage.price.toLocaleString('en-IN')}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Covers {currentPackage.locationLimit} exclusive operational micro-markets
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleSelectPackageAndProceed(selectedPkgId)}
                  className="w-full sm:w-auto px-7 h-[53px] rounded-2xl bg-[#087ed9] hover:bg-sky-500 text-white text-sm font-extrabold transition shadow-lg hover:shadow-sky-500/25 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Continue to Step 2: Choose {currentPackage.locationLimit} Micro-Markets</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SUB-STEP 2: CHOOSE MICRO-MARKETS (Appears when Step 1 is chosen & clicked) */}
          {/* ========================================================================= */}
          {step === 2 && (
            <div className="space-y-6 animate-fadeIn">
              {/* Top Navigation: Back to Plan + Switch Tiers */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="inline-flex items-center gap-1.5 font-bold text-slate-600 hover:text-slate-900 transition cursor-pointer"
                >
                  <ArrowLeft size={15} />
                  <span>Change Plan Tier</span>
                </button>

                <div className="flex items-center gap-3">
                  <span className="text-slate-400 font-medium">Plan:</span>
                  <span className="font-extrabold text-slate-900">
                    {currentPackage.name} (₹{currentPackage.price.toLocaleString('en-IN')})
                  </span>
                  <div className="flex items-center gap-1 p-1 bg-[#f4f4f5] rounded-full border border-slate-200/80">
                    {(['loc-5', 'loc-10', 'loc-15'] as const).map((id) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => handleChangePackageTier(id)}
                        className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all duration-200 cursor-pointer ${
                          selectedPkgId === id
                            ? 'bg-[#18181b] text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {id.replace('loc-', '')} Loc
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Step 2 Header & Container (Minimal Clean Architecture) */}
              <div className="bg-white rounded-[32px] sm:rounded-[36px] p-7 sm:p-9 border border-slate-200/80 shadow-xs space-y-6">
                {/* Header & Minimal Slot Counter */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                      Choose Your {currentPackage.locationLimit} Micro-Markets
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                      Select the operational areas where you hold listings to receive direct buyer leads.
                    </p>
                  </div>

                  {/* Minimal Slot Pill */}
                  <div className="flex items-center gap-3 self-start sm:self-auto bg-[#f4f4f5] px-4 py-2.5 rounded-2xl border border-slate-200/80">
                    <span className="text-xs text-slate-600 font-medium">
                      Slots:{' '}
                      <strong className="text-slate-900 font-black">
                        <span className="text-slate-900">{selectedLocations.length}</span> of{' '}
                        {currentPackage.locationLimit}
                      </strong>
                    </span>
                    <div className="w-20 bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-slate-900 transition-all duration-300 rounded-full"
                        style={{
                          width: `${Math.min(
                            100,
                            (selectedLocations.length / currentPackage.locationLimit) * 100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Limit Warning Alert */}
                {limitWarning && (
                  <div className="flex items-center justify-between gap-3 p-3.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl text-xs font-semibold animate-fadeIn">
                    <div className="flex items-center gap-2">
                      <AlertCircle size={15} className="text-amber-600 shrink-0" />
                      <span>{limitWarning}</span>
                    </div>
                    {selectedPkgId !== 'loc-15' && (
                      <button
                        type="button"
                        onClick={() =>
                          handleChangePackageTier(selectedPkgId === 'loc-5' ? 'loc-10' : 'loc-15')
                        }
                        className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold transition shrink-0 cursor-pointer"
                      >
                        Upgrade &rarr;
                      </button>
                    )}
                  </div>
                )}

                {/* Minimal Search & Clean City Filters */}
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                  <div className="relative flex-1 max-w-sm">
                    <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search Chennai micro-markets..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-8 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-[#f4f4f5]/60 focus:bg-white focus:border-slate-900 outline-none transition font-medium"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>

                  {/* Chennai Zone Filter Pills */}
                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    {['All', 'South & OMR', 'Central Chennai', 'Coastal & ECR', 'West Chennai'].map((zone) => (
                      <button
                        key={zone}
                        type="button"
                        onClick={() => setSelectedRegion(zone)}
                        className={`px-3.5 py-2 rounded-xl transition-all duration-200 cursor-pointer text-xs font-bold ${
                          selectedRegion === zone
                            ? 'bg-[#18181b] text-white shadow-xs'
                            : 'bg-[#f4f4f5] text-slate-600 hover:bg-[#e4e4e7] hover:text-slate-900'
                        }`}
                      >
                        {zone}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Minimalist Micro-Market Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
                  {filteredLocations.map((loc) => {
                    const isSelected = selectedLocations.includes(loc.name);
                    const isMaxReached =
                      !isSelected && selectedLocations.length >= currentPackage.locationLimit;

                    return (
                      <div
                        key={loc.id}
                        onClick={() => toggleLocation(loc.name)}
                        className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer select-none flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'border-slate-900 bg-slate-50/90 shadow-md shadow-slate-900/5 ring-2 ring-slate-900'
                            : isMaxReached
                            ? 'border-slate-200/60 bg-white opacity-40 hover:opacity-80'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-bold text-slate-900 truncate tracking-tight">
                            {loc.name}
                          </h4>
                          <p className="text-xs text-slate-500 mt-0.5 truncate">
                            {loc.city} • Avg {loc.avgTicketPrice}
                          </p>
                        </div>

                        <div
                          className={`h-5 w-5 rounded-full border flex items-center justify-center shrink-0 transition-all duration-200 ${
                            isSelected
                              ? 'border-[#18181b] bg-[#18181b] text-white shadow-xs'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isSelected && <Check size={12} strokeWidth={2.8} />}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Selected Location Chips Tray (Minimal) */}
                {selectedLocations.length > 0 && (
                  <div className="pt-4 border-t border-slate-100 space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800">
                        Selected ({selectedLocations.length}/{currentPackage.locationLimit}):
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedLocations([])}
                        className="text-rose-600 hover:underline font-semibold cursor-pointer"
                      >
                        Clear all
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {selectedLocations.map((locName) => (
                        <span
                          key={locName}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200/80 text-xs font-bold text-slate-800"
                        >
                          <span>{locName}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeLocation(locName);
                            }}
                            className="hover:text-rose-600 transition ml-0.5 cursor-pointer"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Sticky Action Bar for Step 2 */}
              <div className="sticky bottom-4 z-30 bg-[#18181b]/95 backdrop-blur-xl text-white rounded-[28px] p-5 sm:p-6 shadow-2xl border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-4 sm:gap-8">
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                      Plan
                    </span>
                    <span className="text-sm sm:text-base font-extrabold text-white">
                      {currentPackage.name}
                    </span>
                  </div>

                  <div className="border-l border-white/15 pl-4 sm:pl-8">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                      Locations
                    </span>
                    <span
                      className={`text-sm sm:text-base font-extrabold ${
                        selectedLocations.length === currentPackage.locationLimit
                          ? 'text-emerald-400'
                          : 'text-white'
                      }`}
                    >
                      {selectedLocations.length} of {currentPackage.locationLimit} Selected
                    </span>
                  </div>

                  <div className="border-l border-white/15 pl-4 sm:pl-8">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                      Total Payable
                    </span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xl sm:text-2xl font-black text-[#38bdf8] tracking-tight">
                        ₹{totalPayable.toLocaleString('en-IN')}
                      </span>
                      <span className="text-xs text-slate-400 font-normal">(incl. GST)</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleContinueToPayment}
                    disabled={selectedLocations.length === 0}
                    className={`w-full sm:w-auto px-8 py-3.5 rounded-full text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
                      selectedLocations.length > 0
                        ? 'bg-white hover:bg-slate-100 text-slate-900 shadow-xl hover:scale-[1.02] active:scale-[0.98]'
                        : 'bg-white/20 text-white/40 cursor-not-allowed'
                    }`}
                  >
                    <span>Proceed to Payment</span>
                    <ArrowRight size={15} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
