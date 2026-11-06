'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  X,
  SlidersHorizontal,
  RotateCcw,
  Check,
  Building2,
  Home,
  MapPin,
  Briefcase,
  Layers,
  Compass,
  ShieldCheck,
  Sparkles,
  Waves,
  Dumbbell,
  Car,
  Shield,
  Smile,
  Trees,
  Users,
  Zap,
} from 'lucide-react';
import type { Property } from '@/data/properties';

export interface FilterValues {
  purpose: 'Buy' | 'Resale' | 'Rent' | 'Lease';
  city?: string;
  locality: string; // 'All Chennai', 'Alwarpet', 'Velachery', etc.
  propertyType: string;
  bhk: string[]; // ['1', '2', '3', '4', '5+']
  budget: string; // 'any', 'under-75l', etc.
  customMinPrice?: number;
  customMaxPrice?: number;
  furnishing: string[]; // ['Furnished', 'Semi-Furnished', 'Unfurnished']
  facing: string[]; // ['East', 'North', 'North-East', 'West', 'South']
  badges: string[]; // ['New launch', 'Under construction', 'Verified']
  amenities: string[]; // ['pool', 'gym', 'parking', 'shield', 'clubhouse', 'playground', 'garden', 'power']
  verifiedOnly: boolean;
}

export const initialFilterValues: FilterValues = {
  purpose: 'Buy',
  city: 'Chennai',
  locality: 'All Chennai',
  propertyType: 'All property types',
  bhk: [],
  budget: 'any',
  customMinPrice: undefined,
  customMaxPrice: undefined,
  furnishing: [],
  facing: [],
  badges: [],
  amenities: [],
  verifiedOnly: false,
};

interface FullFiltersModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterValues;
  onApply: (newFilters: FilterValues) => void;
  onReset: () => void;
  /** Number of listings the draft filters match (backend count). */
  countMatches?: (draft: FilterValues) => Promise<number>;
}

export const chennaiLocalities = [
  'All Chennai',
  'Alwarpet',
  'Velachery',
  'Anna Nagar',
  'ECR',
  'OMR',
  'Adyar',
  'Besant Nagar',
  'Guindy',
  'Porur',
  'Guduvanchery',
  'Teynampet',
  'Ambattur',
];

const propertyTypes = [
  { label: 'All property types', icon: Building2 },
  { label: 'Home', icon: Home },
  { label: 'Apartments', icon: Building2 },
  { label: 'Villas', icon: Home },
  { label: 'Plots', icon: MapPin },
  { label: 'Commercial', icon: Briefcase },
];

const bhkOptions = [
  { label: '1 BHK', value: '1' },
  { label: '2 BHK', value: '2' },
  { label: '3 BHK', value: '3' },
  { label: '4 BHK', value: '4' },
  { label: '5+ BHK', value: '5' },
];

const buyBudgets = [
  { label: 'Any budget', value: 'any' },
  { label: 'Under ₹75 Lac', value: 'under-75l' },
  { label: '₹75 Lac – ₹1.25 Cr', value: '75l-1.25cr' },
  { label: '₹1.25 Cr – ₹2 Cr', value: '1.25cr-2cr' },
  { label: '₹2 Cr – ₹5 Cr', value: '2cr-5cr' },
  { label: 'Above ₹5 Cr', value: 'above-5cr' },
];

const rentBudgets = [
  { label: 'Any budget', value: 'any' },
  { label: 'Under ₹30,000 /mo', value: 'under-30k' },
  { label: '₹30,000 – ₹60,000 /mo', value: '30k-60k' },
  { label: '₹60,000 – ₹1.5 Lac /mo', value: '60k-1.5l' },
  { label: 'Above ₹1.5 Lac /mo', value: 'above-1.5l' },
];

const furnishingOptions = ['Fully Furnished', 'Semi-Furnished', 'Unfurnished'];
const facingOptions = ['East', 'North', 'North-East', 'West', 'South'];
const statusBadges = ['New launch', 'Under construction', 'Ready to Move', 'Verified Resale'];

const amenityOptions = [
  { key: 'pool', label: 'Swimming Pool', icon: Waves },
  { key: 'gym', label: 'Gym & Fitness', icon: Dumbbell },
  { key: 'parking', label: 'Covered Parking', icon: Car },
  { key: 'shield', label: '24/7 Security', icon: Shield },
  { key: 'clubhouse', label: 'Clubhouse', icon: Users },
  { key: 'playground', label: "Children's Play Area", icon: Smile },
  { key: 'garden', label: 'Landscaped Garden', icon: Trees },
  { key: 'power', label: 'Power Backup', icon: Zap },
];

export function countActiveFilters(f: FilterValues): number {
  let count = 0;
  if (f.locality && f.locality !== 'All Chennai' && f.locality !== 'All localities') count++;
  if (f.propertyType !== 'All property types') count++;
  if (f.bhk.length > 0) count += f.bhk.length;
  if (f.budget !== 'any') count++;
  if (f.customMinPrice || f.customMaxPrice) count++;
  if (f.furnishing.length > 0) count += f.furnishing.length;
  if (f.facing.length > 0) count += f.facing.length;
  if (f.badges.length > 0) count += f.badges.length;
  if (f.amenities.length > 0) count += f.amenities.length;
  if (f.verifiedOnly) count++;
  return count;
}

export function filterPropertiesWithValues(list: Property[], f: FilterValues): Property[] {
  return list.filter((prop) => {
    // Purpose
    if (f.purpose && prop.purpose && prop.purpose !== f.purpose) {
      return false;
    }

    // Chennai Locality Filter
    if (f.locality && f.locality !== 'All Chennai' && f.locality !== 'All localities') {
      const locTarget = f.locality.toLowerCase().trim();
      const matchLocality = prop.locality?.toLowerCase().includes(locTarget);
      const matchArea = prop.area?.toLowerCase().includes(locTarget);
      const matchAddress = prop.address?.toLowerCase().includes(locTarget);
      if (!matchLocality && !matchArea && !matchAddress) {
        return false;
      }
    }

    // Property Type
    if (f.propertyType && f.propertyType !== 'All property types') {
      const typeLower = f.propertyType.toLowerCase();
      if (typeLower === 'home') {
        const isHome =
          prop.propertyCategory === 'Home' ||
          prop.propertyCategory === 'Apartments' ||
          prop.propertyCategory === 'Villas' ||
          prop.name.toLowerCase().includes('house') ||
          prop.name.toLowerCase().includes('residence') ||
          prop.name.toLowerCase().includes('flat');
        if (!isHome) return false;
      } else if (typeLower === 'apartments') {
        const isApartment =
          prop.propertyCategory === 'Apartments' ||
          prop.propertyType?.toLowerCase().includes('apartment') ||
          prop.propertyType?.toLowerCase().includes('flat') ||
          prop.propertyType?.toLowerCase().includes('penthouse');
        if (!isApartment) return false;
      } else if (typeLower === 'villas') {
        const isVilla =
          prop.propertyCategory === 'Villas' ||
          prop.propertyType?.toLowerCase().includes('villa');
        if (!isVilla) return false;
      } else if (typeLower === 'plots') {
        const isPlot =
          prop.propertyCategory === 'Plots' ||
          prop.propertyType?.toLowerCase().includes('plot') ||
          prop.propertyType?.toLowerCase().includes('land');
        if (!isPlot) return false;
      } else if (typeLower === 'commercial') {
        const isCommercial =
          prop.propertyCategory === 'Commercial' ||
          prop.propertyType?.toLowerCase().includes('commercial') ||
          prop.propertyType?.toLowerCase().includes('office') ||
          prop.propertyType?.toLowerCase().includes('showroom');
        if (!isCommercial) return false;
      }
    }

    // BHK Multi-select
    if (f.bhk && f.bhk.length > 0) {
      const propBhk = (prop.bhk || prop.beds || '').toLowerCase();
      const bhkMatches = f.bhk.some((val) => {
        if (val === '5') {
          return propBhk.includes('5') || (prop.bhkCount && prop.bhkCount >= 5);
        }
        return propBhk.includes(val) || (prop.bhkCount && prop.bhkCount.toString() === val);
      });
      if (!bhkMatches) return false;
    }

    // Budget Preset
    if (f.budget !== 'any') {
      const min = prop.priceMin || 0;
      const max = prop.priceMax || min;
      if (f.budget === 'under-75l' && min > 7500000) return false;
      if (f.budget === '75l-1.25cr' && (max < 7500000 || min > 12500000)) return false;
      if (f.budget === '1.25cr-2cr' && (max < 12500000 || min > 20000000)) return false;
      if (f.budget === '2cr-5cr' && (max < 20000000 || min > 50000000)) return false;
      if (f.budget === 'above-5cr' && max < 50000000) return false;

      // Rent
      if (f.budget === 'under-30k' && min > 30000) return false;
      if (f.budget === '30k-60k' && (max < 30000 || min > 60000)) return false;
      if (f.budget === '60k-1.5l' && (max < 60000 || min > 150000)) return false;
      if (f.budget === 'above-1.5l' && max < 150000) return false;
    }

    // Custom Min / Max
    if (f.customMinPrice && (prop.priceMax || prop.priceMin || 0) < f.customMinPrice) {
      return false;
    }
    if (f.customMaxPrice && (prop.priceMin || 0) > f.customMaxPrice) {
      return false;
    }

    // Furnishing
    if (f.furnishing && f.furnishing.length > 0) {
      const propFurn = (prop.furnishing || '').toLowerCase().replace(/[- ]/g, '');
      const match = f.furnishing.some((furn) => {
        const target = furn.toLowerCase().replace(/[- ]/g, '');
        return propFurn.includes(target) || (target.includes('furnished') && propFurn.includes('furnished'));
      });
      if (!match) return false;
    }

    // Facing
    if (f.facing && f.facing.length > 0) {
      const propFacing = (prop.facing || '').toLowerCase();
      const match = f.facing.some((fc) => propFacing.includes(fc.toLowerCase()));
      if (!match) return false;
    }

    // Badges / Status
    if (f.badges && f.badges.length > 0) {
      const badgeStr = `${prop.badge || ''} ${prop.statusTag || ''}`.toLowerCase();
      const match = f.badges.some((b) => badgeStr.includes(b.toLowerCase()));
      if (!match) return false;
    }

    // Amenities
    if (f.amenities && f.amenities.length > 0) {
      const propIcons = (prop.amenities || []).map((a) => a.icon.toLowerCase());
      const hasAll = f.amenities.every((icon) => propIcons.includes(icon.toLowerCase()));
      if (!hasAll) return false;
    }

    // Verified Only
    if (f.verifiedOnly) {
      const isVerified =
        (prop.postedBy && prop.postedBy.toLowerCase().includes('verified')) ||
        (prop.badge && prop.badge.toLowerCase().includes('verified')) ||
        (prop.statusTag && prop.statusTag.toLowerCase().includes('verified'));
      if (!isVerified) return false;
    }

    return true;
  });
}

export default function FullFiltersModal({
  isOpen,
  onClose,
  filters,
  onApply,
  onReset,
  countMatches,
}: FullFiltersModalProps) {
  // Local state inside modal for fast interactive editing
  const [draft, setDraft] = useState<FilterValues>(filters);

  // Sync draft when opened or external filters change
  useEffect(() => {
    if (isOpen) {
      setDraft(filters);
    }
  }, [isOpen, filters]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Escape key closes modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Live count of matching listings from the backend (debounced). Unknown
  // (null) while loading or when the count could not be fetched.
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const draftKey = JSON.stringify(draft);
  useEffect(() => {
    if (!isOpen || !countMatches) return;
    let cancelled = false;
    setPreviewCount(null);
    const timer = setTimeout(() => {
      countMatches(draft)
        .then((n) => {
          if (!cancelled) setPreviewCount(n);
        })
        .catch(() => undefined);
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, draftKey, countMatches]);

  const activeCount = useMemo(() => countActiveFilters(draft), [draft]);

  if (!isOpen) return null;

  const toggleBhk = (val: string) => {
    setDraft((prev) => {
      const exists = prev.bhk.includes(val);
      const updated = exists ? prev.bhk.filter((b) => b !== val) : [...prev.bhk, val];
      return { ...prev, bhk: updated };
    });
  };

  const toggleFurnishing = (val: string) => {
    setDraft((prev) => {
      const exists = prev.furnishing.includes(val);
      const updated = exists ? prev.furnishing.filter((f) => f !== val) : [...prev.furnishing, val];
      return { ...prev, furnishing: updated };
    });
  };

  const toggleFacing = (val: string) => {
    setDraft((prev) => {
      const exists = prev.facing.includes(val);
      const updated = exists ? prev.facing.filter((f) => f !== val) : [...prev.facing, val];
      return { ...prev, facing: updated };
    });
  };

  const toggleBadge = (val: string) => {
    setDraft((prev) => {
      const exists = prev.badges.includes(val);
      const updated = exists ? prev.badges.filter((b) => b !== val) : [...prev.badges, val];
      return { ...prev, badges: updated };
    });
  };

  const toggleAmenity = (key: string) => {
    setDraft((prev) => {
      const exists = prev.amenities.includes(key);
      const updated = exists ? prev.amenities.filter((a) => a !== key) : [...prev.amenities, key];
      return { ...prev, amenities: updated };
    });
  };

  const handleModalReset = () => {
    setDraft({
      ...initialFilterValues,
      purpose: draft.purpose, // preserve current purpose
    });
  };

  const handleApplyClick = () => {
    onApply(draft);
    onClose();
  };

  const currentBudgets = draft.purpose === 'Rent' || draft.purpose === 'Lease' ? rentBudgets : buyBudgets;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200"
      >
        {/* Sticky Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-sky-50 text-[#087ed9] flex items-center justify-center">
              <SlidersHorizontal size={18} />
            </span>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 leading-tight">
                All Filters
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                {activeCount > 0 ? `${activeCount} filter${activeCount > 1 ? 's' : ''} active` : 'Refine search results'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {activeCount > 0 && (
              <button
                type="button"
                onClick={handleModalReset}
                className="text-xs font-semibold text-[#087ed9] hover:text-sky-700 hover:underline flex items-center gap-1 cursor-pointer transition"
              >
                <RotateCcw size={12} />
                <span>Reset</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-7 divide-y divide-slate-100 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full">
          
          {/* Section 1: Purpose Tabs */}
          <div>
            <label className="text-xs font-extrabold text-slate-900 tracking-wider uppercase block mb-3">
              I am looking to
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['Buy', 'Resale', 'Rent', 'Lease'] as const).map((p) => {
                const isSelected = draft.purpose === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setDraft((prev) => ({ ...prev, purpose: p, budget: 'any' }))}
                    className={`py-2.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer border ${
                      isSelected
                        ? 'bg-[#087ed9] text-white border-[#087ed9] shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Chennai Locality Selection */}
          <div className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-extrabold text-slate-900 tracking-wider uppercase">
                Select Chennai Locality
              </label>
              <span className="text-[11px] text-[#087ed9] font-bold">Chennai Only</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {chennaiLocalities.map((loc) => {
                const isSelected = (draft.locality || 'All Chennai') === loc;
                return (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => setDraft((prev) => ({ ...prev, locality: loc }))}
                    className={`px-3.5 py-2 rounded-xl text-xs sm:text-[13px] font-semibold transition cursor-pointer border ${
                      isSelected
                        ? 'bg-[#087ed9] text-white border-[#087ed9] shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-white hover:border-slate-300'
                    }`}
                  >
                    {loc}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Property Type */}
          <div className="pt-6">
            <label className="text-xs font-extrabold text-slate-900 tracking-wider uppercase block mb-3">
              Property Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {propertyTypes.map(({ label, icon: Icon }) => {
                const isSelected = draft.propertyType === label;
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setDraft((prev) => ({ ...prev, propertyType: label }))}
                    className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition cursor-pointer ${
                      isSelected
                        ? 'bg-sky-50/80 border-[#087ed9] text-[#087ed9] font-bold shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <Icon size={16} className={isSelected ? 'text-[#087ed9]' : 'text-slate-400'} />
                    <span className="text-xs sm:text-sm font-semibold truncate">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 4: BHK Configuration (Multi-Select) */}
          <div className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-extrabold text-slate-900 tracking-wider uppercase">
                BHK Configuration
              </label>
              <span className="text-[11px] text-slate-400">Multiple selection allowed</span>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {bhkOptions.map((opt) => {
                const isChecked = draft.bhk.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => toggleBhk(opt.value)}
                    className={`py-2.5 rounded-xl border text-xs sm:text-sm font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      isChecked
                        ? 'bg-[#087ed9] text-white border-[#087ed9] shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {isChecked && <Check size={13} strokeWidth={3} />}
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 5: Budget Range */}
          <div className="pt-6">
            <label className="text-xs font-extrabold text-slate-900 tracking-wider uppercase block mb-3">
              Budget Range ({draft.purpose === 'Rent' || draft.purpose === 'Lease' ? 'Monthly' : 'Purchase'})
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {currentBudgets.map((b) => {
                const isSelected = draft.budget === b.value;
                return (
                  <button
                    key={b.value}
                    type="button"
                    onClick={() => setDraft((prev) => ({ ...prev, budget: b.value }))}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold transition cursor-pointer text-center truncate ${
                      isSelected
                        ? 'bg-sky-50 border-[#087ed9] text-[#087ed9] font-bold shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {b.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 6: Furnishing Status */}
          <div className="pt-6">
            <label className="text-xs font-extrabold text-slate-900 tracking-wider uppercase block mb-3">
              Furnishing
            </label>
            <p className="text-[11px] text-slate-400 mb-2">Not available yet: listings can't be filtered by this.</p>
            <div className="flex flex-wrap gap-2">
              {furnishingOptions.map((furn) => {
                const isSelected = draft.furnishing.includes(furn);
                return (
                  <button
                    key={furn}
                    type="button"
                    onClick={() => toggleFurnishing(furn)}
                    disabled
                    className={`disabled:opacity-50 disabled:cursor-not-allowed px-3.5 py-2 rounded-xl border text-xs sm:text-[13px] font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-[#087ed9] text-white border-[#087ed9] shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {isSelected && <Check size={13} strokeWidth={3} />}
                    <span>{furn}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 7: Construction & Status Badge */}
          <div className="pt-6">
            <label className="text-xs font-extrabold text-slate-900 tracking-wider uppercase block mb-3">
              Construction & Listing Status
            </label>
            <div className="flex flex-wrap gap-2">
              {statusBadges.map((badge) => {
                const isSelected = draft.badges.includes(badge);
                return (
                  <button
                    key={badge}
                    type="button"
                    onClick={() => toggleBadge(badge)}
                    className={`px-3.5 py-2 rounded-xl border text-xs sm:text-[13px] font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-[#087ed9] text-white border-[#087ed9] shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {isSelected && <Check size={13} strokeWidth={3} />}
                    <span>{badge}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 8: Facing Direction */}
          <div className="pt-6">
            <label className="text-xs font-extrabold text-slate-900 tracking-wider uppercase block mb-3">
              Facing Direction
            </label>
            <p className="text-[11px] text-slate-400 mb-2">Not available yet: listings can't be filtered by this.</p>
            <div className="flex flex-wrap gap-2">
              {facingOptions.map((fc) => {
                const isSelected = draft.facing.includes(fc);
                return (
                  <button
                    key={fc}
                    type="button"
                    onClick={() => toggleFacing(fc)}
                    disabled
                    className={`disabled:opacity-50 disabled:cursor-not-allowed px-3.5 py-2 rounded-xl border text-xs sm:text-[13px] font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-[#087ed9] text-white border-[#087ed9] shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {isSelected && <Check size={13} strokeWidth={3} />}
                    <span>{fc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 9: Amenities Checklist */}
          <div className="pt-6">
            <label className="text-xs font-extrabold text-slate-900 tracking-wider uppercase block mb-3">
              Amenities & Facilities
            </label>
            <p className="text-[11px] text-slate-400 mb-2">Not available yet: listings can't be filtered by this.</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {amenityOptions.map(({ key, label, icon: Icon }) => {
                const isChecked = draft.amenities.includes(key);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleAmenity(key)}
                    disabled
                    className={`disabled:opacity-50 disabled:cursor-not-allowed p-2.5 rounded-xl border text-left flex items-center gap-2 transition cursor-pointer ${
                      isChecked
                        ? 'bg-sky-50 border-[#087ed9] text-[#087ed9] font-bold shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <Icon size={15} className={isChecked ? 'text-[#087ed9]' : 'text-slate-400'} />
                    <span className="text-xs font-semibold truncate">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 10: Verified Listing Only Toggle */}
          <div className="pt-6">
            <label className="flex items-center justify-between p-3.5 bg-sky-50/60 border border-sky-200/80 rounded-2xl cursor-pointer">
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-xl bg-white text-[#087ed9] flex items-center justify-center shadow-xs">
                  <ShieldCheck size={20} />
                </span>
                <div>
                  <p className="text-xs sm:text-sm font-bold text-slate-900">
                    Verified Listings Only
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Every listing shown on Restamp has been verified
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={draft.verifiedOnly}
                onChange={(e) => setDraft((prev) => ({ ...prev, verifiedOnly: e.target.checked }))}
                className="w-5 h-5 accent-[#087ed9] rounded cursor-pointer"
              />
            </label>
          </div>

        </div>

        {/* Sticky Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-white shrink-0">
          <button
            type="button"
            onClick={handleModalReset}
            className="text-xs sm:text-sm font-bold text-slate-600 hover:text-slate-900 transition px-3 py-2 cursor-pointer"
          >
            Clear All
          </button>

          <button
            type="button"
            onClick={handleApplyClick}
            className="bg-[#087ed9] hover:bg-[#076ec0] text-white font-bold text-xs sm:text-sm px-6 h-[53px] rounded-xl transition shadow-xs cursor-pointer active:scale-98 flex items-center gap-2"
          >
            <span>Apply Filters</span>
            <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-extrabold">
              {previewCount ?? '…'}
            </span>
          </button>
        </div>

      </div>
    </div>
  );
}
