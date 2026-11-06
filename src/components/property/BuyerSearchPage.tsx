"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Search,
  RotateCcw,
  SlidersHorizontal,
  ChevronDown,
  X,
  Home,
  ImageOff,
  Loader2,
  Building2,
  MapPin,
  Briefcase,
} from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import PropertyCard from '@/components/property/PropertyCard';
import FullFiltersModal, {
  FilterValues,
  initialFilterValues,
  countActiveFilters,
  chennaiLocalities,
} from '@/components/property/FullFiltersModal';
import EnquiryModal from '@/components/property/EnquiryModal';
import { Property } from '@/data/properties';
import { countListings, ListingCard, searchListings } from '@/lib/api/buyer';
import { errorMessage } from '@/lib/api/client';
import { cardToProperty } from '@/lib/api/mappers';
import { bedroomFilter, exactCountQueries, matchesBedrooms, statusesFor, toListingSearch } from '@/lib/api/searchFilters';

const PAGE_SIZE = 24;

type RecentSearch = { id: number; title: string; subtitle: string; category?: string; query: string; icon: string };

const purposeTabs = ['Buy', 'Resale', 'Rent', 'Lease'] as const;
type PurposeType = (typeof purposeTabs)[number];

const propertyTypes = [
  'All property types',
  'Home',
  'Apartments',
  'Villas',
  'Plots',
  'Commercial',
];

const bhkOptions = [
  { label: 'Any BHK', value: 'any' },
  { label: '2 BHK', value: '2' },
  { label: '3 BHK', value: '3' },
  { label: '4+ BHK', value: '4' },
];

const buyBudgetOptions = [
  { label: 'Any budget', value: 'any' },
  { label: 'Under ₹75 Lac', value: 'under-75l' },
  { label: '₹75 Lac – ₹1.25 Cr', value: '75l-1.25cr' },
  { label: '₹1.25 Cr – ₹2 Cr', value: '1.25cr-2cr' },
  { label: 'Above ₹2 Cr', value: 'above-2cr' },
];

const rentBudgetOptions = [
  { label: 'Any budget', value: 'any' },
  { label: 'Under ₹30,000 /mo', value: 'under-30k' },
  { label: '₹30,000 – ₹60,000 /mo', value: '30k-60k' },
  { label: '₹60,000 – ₹1.5 Lac /mo', value: '60k-1.5l' },
  { label: 'Above ₹1.5 Lac /mo', value: 'above-1.5l' },
];

const sortOptions = [
  { label: 'Recommended', value: 'recommended' },
  { label: 'Price: Low to High', value: 'price-asc' },
  { label: 'Price: High to Low', value: 'price-desc' },
  { label: 'Newest First', value: 'newest' },
];

export default function BuyerSearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Read initial params
  const initialQuery = searchParams.get('q') || '';
  const initialLocality = searchParams.get('locality') || searchParams.get('city') || 'All Chennai';
  const initialType = searchParams.get('type') || 'All property types';
  const initialPurposeParam = searchParams.get('purpose');
  const initialPurpose: PurposeType =
    initialPurposeParam && ['Buy', 'Resale', 'Rent', 'Lease'].includes(initialPurposeParam)
      ? (initialPurposeParam as PurposeType)
      : 'Buy';

  // Core Unified Filter State - Focused 100% on Chennai
  const [filterValues, setFilterValues] = useState<FilterValues>({
    purpose: initialPurpose,
    city: 'Chennai',
    locality:
      initialLocality && initialLocality !== 'All cities' && initialLocality !== 'Chennai'
        ? initialLocality
        : 'All Chennai',
    propertyType: initialType === 'All residential' ? 'Home' : initialType,
    bhk: [],
    budget: 'any',
    furnishing: [],
    facing: [],
    badges: [],
    amenities: [],
    verifiedOnly: false,
  });

  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedSort, setSelectedSort] = useState('recommended');

  const selectedPurpose = filterValues.purpose;
  const selectedLocality = filterValues.locality || 'All Chennai';
  const selectedType = filterValues.propertyType;
  const selectedBhk = filterValues.bhk.length === 1 ? filterValues.bhk[0] : (filterValues.bhk.length > 1 ? 'multi' : 'any');
  const selectedBudget = filterValues.budget;

  // Contact Modal State (real enquiry, see EnquiryModal)
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  // Search Experience Suggestion Dropdown State
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Recent searches made in this visit (none are invented).
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);

  // Click outside and Escape key listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsSearchFocused(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsSearchFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Sync state if URL query changes
  useEffect(() => {
    if (initialQuery) setSearchQuery(initialQuery);
    if (initialLocality) {
      const loc =
        initialLocality !== 'All cities' && initialLocality !== 'Chennai'
          ? initialLocality
          : 'All Chennai';
      setFilterValues((prev) => ({ ...prev, locality: loc, city: 'Chennai' }));
    }
    if (initialPurposeParam && ['Buy', 'Resale', 'Rent', 'Lease'].includes(initialPurposeParam)) {
      setFilterValues((prev) => ({ ...prev, purpose: initialPurposeParam as PurposeType }));
    }
    if (initialType) {
      setFilterValues((prev) => ({
        ...prev,
        propertyType: initialType === 'All residential' ? 'Home' : initialType,
      }));
    }
  }, [initialQuery, initialLocality, initialPurposeParam, initialType]);

  // Submit search query
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (searchQuery.trim()) {
      const term = searchQuery.trim();
      setRecentSearches((prev) =>
        [
          { id: Date.now(), title: term, subtitle: `${filterValues.purpose} · Chennai`, query: term, icon: 'map-pin' },
          ...prev.filter((r) => r.query.toLowerCase() !== term.toLowerCase()),
        ].slice(0, 5)
      );
      params.set('q', term);
    } else {
      params.delete('q');
    }
    router.replace(`/buy?${params.toString()}`);
  };

  // Filter helper setters
  const updatePurpose = (purpose: PurposeType) => {
    setFilterValues((prev) => ({
      ...prev,
      purpose,
      budget: 'any',
    }));
    const params = new URLSearchParams(searchParams.toString());
    params.set('purpose', purpose);
    router.replace(`/buy?${params.toString()}`);
  };

  const updateLocality = (locality: string) => {
    setFilterValues((prev) => ({ ...prev, locality, city: 'Chennai' }));
  };

  const updateType = (propertyType: string) => {
    setFilterValues((prev) => ({ ...prev, propertyType }));
  };

  const updateBhk = (bhkVal: string) => {
    setFilterValues((prev) => ({
      ...prev,
      bhk: bhkVal === 'any' ? [] : [bhkVal],
    }));
  };

  const updateBudget = (budget: string) => {
    setFilterValues((prev) => ({ ...prev, budget }));
  };

  // Reset all filters
  const handleReset = () => {
    setSearchQuery('');
    setSelectedSort('recommended');
    setFilterValues({
      ...initialFilterValues,
      purpose: filterValues.purpose,
    });
    router.replace(`/buy?purpose=${filterValues.purpose}`);
  };

  const removeSingleFilter = (type: string, value?: string) => {
    setFilterValues((prev) => {
      switch (type) {
        case 'locality':
        case 'city':
          return { ...prev, locality: 'All Chennai', city: 'Chennai' };
        case 'propertyType':
          return { ...prev, propertyType: 'All property types' };
        case 'bhk':
          return { ...prev, bhk: prev.bhk.filter((b) => b !== value) };
        case 'budget':
          return { ...prev, budget: 'any', customMinPrice: undefined, customMaxPrice: undefined };
        case 'furnishing':
          return { ...prev, furnishing: prev.furnishing.filter((f) => f !== value) };
        case 'facing':
          return { ...prev, facing: prev.facing.filter((fc) => fc !== value) };
        case 'badge':
          return { ...prev, badges: prev.badges.filter((b) => b !== value) };
        case 'amenity':
          return { ...prev, amenities: prev.amenities.filter((a) => a !== value) };
        case 'verified':
          return { ...prev, verifiedOnly: false };
        default:
          return prev;
      }
    });
  };

  const activeFiltersCount = useMemo(() => countActiveFilters(filterValues), [filterValues]);

  // Select Budget Options based on Purpose
  const activeBudgetOptions =
    filterValues.purpose === 'Rent' || filterValues.purpose === 'Lease'
      ? rentBudgetOptions
      : buyBudgetOptions;

  // Results come from GET /buyer/listings (only verified, available
  // listings). Typing is debounced so each keystroke doesn't hit the server.
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery), 350);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const apiFilters = useMemo(
    () => toListingSearch(filterValues, debouncedQuery, selectedSort),
    [filterValues, debouncedQuery, selectedSort]
  );
  const filtersKey = JSON.stringify(apiFilters);
  // Multi-select BHK / status: the backend takes one value, so the exact
  // match for the rest is applied to the returned cards.
  const clientBedrooms = useMemo(() => bedroomFilter(filterValues.bhk).clientBedrooms, [filterValues.bhk]);
  const clientStatuses = useMemo(() => {
    const st = statusesFor(filterValues.badges);
    return st.length > 1 ? st : undefined;
  }, [filterValues.badges]);
  const clientFiltered = !!clientBedrooms || !!clientStatuses;

  const [results, setResults] = useState<ListingCard[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setLoadError('');
    searchListings(JSON.parse(filtersKey), 1, PAGE_SIZE, controller.signal)
      .then((res) => {
        setResults(res.items);
        setTotal(res.total);
        setPage(1);
      })
      .catch((e) => {
        if (controller.signal.aborted) return;
        setResults([]);
        setTotal(0);
        setLoadError(errorMessage(e, 'Could not load properties. Please try again.'));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [filtersKey, reloadKey]);

  const loadMore = async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await searchListings(JSON.parse(filtersKey), page + 1, PAGE_SIZE);
      setResults((prev) => [...prev, ...res.items.filter((c) => !prev.some((p) => p.listing_id === c.listing_id))]);
      setTotal(res.total);
      setPage(page + 1);
    } catch (e) {
      setLoadError(errorMessage(e, 'Could not load more properties.'));
    } finally {
      setLoadingMore(false);
    }
  };

  const filteredProperties = useMemo(
    () =>
      results
        .filter((c) => matchesBedrooms(c.bedrooms, clientBedrooms))
        .filter((c) => !clientStatuses || (!!c.construction_status && clientStatuses.includes(c.construction_status)))
        .map(cardToProperty),
    [results, clientBedrooms, clientStatuses]
  );
  const hasMore = results.length < total;
  const shownCount = clientFiltered ? filteredProperties.length : total;

  // Exact count for the dialog's Apply button. One request normally; with
  // several BHKs / statuses selected, one per combination (the backend
  // filters on one value each), summed.
  const countMatches = useCallback(
    async (draft: FilterValues) => {
      const counts = await Promise.all(exactCountQueries(draft, debouncedQuery, selectedSort).map((q) => countListings(q)));
      return counts.reduce((sum, n) => sum + n, 0);
    },
    [debouncedQuery, selectedSort]
  );

  const handleContact = (property: Property) => {
    setSelectedProperty(property);
  };

  const heroTitles: Record<PurposeType, { eyebrow: string; title: string; subtitle: string }> = {
    Buy: {
      eyebrow: 'PROPERTIES IN CHENNAI',
      title: 'Find a place to call your own in Chennai',
      subtitle: 'Explore new launches, beach villas and prime apartments across Chennai directly from verified builders.',
    },
    Resale: {
      eyebrow: 'FEATURED CHENNAI RESALE PROPERTIES',
      title: 'Discover homes worth owning in Chennai',
      subtitle: 'Ready-to-move homes in Chennai with verified clear titles and immediate registration.',
    },
    Rent: {
      eyebrow: 'RENTAL HOMES IN CHENNAI',
      title: 'Find your ideal rental home in Chennai',
      subtitle: 'Furnished & semi-furnished residences in prime, well-connected Chennai neighborhoods.',
    },
    Lease: {
      eyebrow: 'COMMERCIAL & LEASE SPACES IN CHENNAI',
      title: 'Executive spaces & commercial leases in Chennai',
      subtitle: 'Grade-A office suites, tech hubs and commercial spaces across Chennai for business growth.',
    },
  };

  const currentHero = heroTitles[selectedPurpose] || heroTitles.Buy;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Blue Search Hero Section */}
        <section className="bg-[#087ed9] text-white pt-6 pb-10">
          <div className="container-site">
            {/* Breadcrumb */}
            <nav className="text-white/80 text-xs flex items-center gap-2 font-medium mb-3">
              <Link href="/" className="hover:text-white transition">
                Home
              </Link>
              <span>/</span>
              <span className="text-white/90">Chennai</span>
              <span>/</span>
              <span className="text-white font-semibold">
                {selectedPurpose} Properties
              </span>
            </nav>

            {/* Purpose Tabs: Buy, Resale, Rent, Lease */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 mb-5">
              {purposeTabs.map((purpose) => {
                const isActive = selectedPurpose === purpose;
                return (
                  <button
                    key={purpose}
                    type="button"
                    onClick={() => updatePurpose(purpose)}
                    className={`px-4 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer active:scale-95 ${
                      isActive
                        ? 'bg-white text-slate-900 shadow-md font-bold'
                        : 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-xs font-medium'
                    }`}
                  >
                    {purpose}
                  </button>
                );
              })}
            </div>

            {/* Title & Subtitle */}
            <p className="text-[11px] font-bold tracking-[0.2em] text-sky-200 uppercase">
              {currentHero.eyebrow}
            </p>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white mt-1.5 tracking-tight">
              {currentHero.title}
            </h1>
            <p className="text-sm md:text-base text-white/90 mt-1.5 max-w-2xl">
              {currentHero.subtitle}
            </p>

            {/* Search Bar & Action Buttons with Search Down Suggestion Dropdown */}
            <form
              onSubmit={handleSearchSubmit}
              className="mt-6 flex flex-col sm:flex-row gap-2.5 max-w-4xl relative z-40"
            >
              <div ref={searchContainerRef} className="flex-1 relative">
                <div className="relative flex items-center bg-white rounded-xl shadow-xs border border-sky-300/40">
                  <Search
                    size={18}
                    className="text-slate-400 absolute left-4 pointer-events-none"
                  />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onFocus={() => setIsSearchFocused(true)}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setIsSearchFocused(true);
                    }}
                    placeholder={`Search Chennai locality (e.g. Alwarpet, Velachery, ECR, Anna Nagar) or ${selectedPurpose.toLowerCase()} property...`}
                    className="w-full pl-11 pr-10 py-3 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-hidden"
                  />

                  {/* Right Clear Icon */}
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        searchInputRef.current?.focus();
                      }}
                      className="absolute right-3 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                      aria-label="Clear search input"
                    >
                      <X size={15} />
                    </button>
                  )}
                </div>

                {/* Search Down Suggestion Dropdown (matching reference UI) */}
                {isSearchFocused && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 p-4 sm:p-5 z-50 text-slate-800 animate-in fade-in slide-in-from-top-2 duration-150">
                    {/* SECTION 1: "I'm looking for" */}
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-slate-400 mb-2">
                        I&apos;m looking for
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        {['Home', 'Apartments', 'Villas', 'Plots', 'Commercial'].map((category) => {
                          const isSelected = selectedType === category;
                          return (
                            <button
                              key={category}
                              type="button"
                              onClick={() => {
                                if (isSelected) {
                                  updateType('All property types');
                                } else {
                                  updateType(category);
                                }
                              }}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                                isSelected
                                  ? 'bg-sky-50 text-[#087ed9] border border-sky-200 shadow-xs'
                                  : 'bg-slate-100/80 text-slate-600 hover:bg-slate-100'
                              }`}
                            >
                              <span>{category}</span>
                              {isSelected && <X size={12} className="text-[#087ed9]" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* SECTION 2: Dynamic Content */}
                    {searchQuery.trim().length > 0 ? (
                      /* Live Property & Locality Matches */
                      <div>
                        <div className="flex items-center justify-between mb-2 pb-1 border-b border-slate-100">
                          <p className="text-xs font-semibold text-slate-400">
                            Matching Properties
                          </p>
                          <span className="text-[11px] text-slate-400 font-medium">
                            {loading ? 'Searching…' : `${shownCount}${clientFiltered && hasMore ? '+' : ''} found`}
                          </span>
                        </div>

                        {filteredProperties.length > 0 ? (
                          <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                            {filteredProperties.slice(0, 5).map((prop, idx) => (
                              <div
                                key={prop.id}
                                onClick={() => {
                                  router.push(`/properties/${prop.id}`);
                                  setIsSearchFocused(false);
                                }}
                                className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition ${
                                  idx === 0
                                    ? 'bg-slate-50 border border-slate-100 hover:bg-slate-100/80'
                                    : 'hover:bg-slate-50'
                                }`}
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  {prop.image ? (
                                    <img
                                      src={prop.image}
                                      alt={prop.name}
                                      className="w-10 h-10 rounded-lg object-cover shrink-0 border border-slate-200"
                                    />
                                  ) : (
                                    <span className="w-10 h-10 rounded-lg shrink-0 border border-slate-200 bg-slate-50 text-slate-300 flex items-center justify-center">
                                      <ImageOff size={16} />
                                    </span>
                                  )}
                                  <div className="min-w-0">
                                    <p className="text-xs sm:text-sm font-bold text-slate-800 truncate">
                                      {prop.name}
                                    </p>
                                    <p className="text-[11px] text-slate-400 truncate">
                                      {prop.locality ? `${prop.locality}, Chennai` : prop.city} · {prop.bhk || prop.propertyCategory}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0 ml-3">
                                  <span className="text-xs font-bold text-[#087ed9] bg-sky-50 px-2 py-0.5 rounded-md">
                                    {prop.price}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400 py-4 text-center">
                            {loading ? 'Searching…' : loadError ? loadError : <>No properties matching &ldquo;{searchQuery}&rdquo;</>}
                          </p>
                        )}
                      </div>
                    ) : (
                      /* Recent Searches Section (exact design from reference screenshot) */
                      <div>
                        <div className="flex items-center justify-between mb-2 pb-1 border-b border-slate-100">
                          <p className="text-xs font-semibold text-slate-400">Recent</p>
                          {recentSearches.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setRecentSearches([])}
                              className="text-xs text-slate-400 hover:text-slate-700 font-medium transition cursor-pointer"
                            >
                              Clear All
                            </button>
                          )}
                        </div>

                        {recentSearches.length > 0 ? (
                          <div className="space-y-1">
                            {recentSearches.map((item, idx) => (
                              <div
                                key={item.id}
                                onClick={() => {
                                  setSearchQuery(item.query);
                                  if (item.category) updateType(item.category);
                                  setIsSearchFocused(false);
                                }}
                                className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition ${
                                  idx === 1
                                    ? 'bg-slate-50 border border-slate-100'
                                    : 'hover:bg-slate-50'
                                }`}
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <span className="w-8 h-8 rounded-lg bg-sky-50 text-[#087ed9] flex items-center justify-center shrink-0">
                                    {item.icon === 'home' && <Home size={15} />}
                                    {item.icon === 'building' && <Building2 size={15} />}
                                    {item.icon === 'map-pin' && <MapPin size={15} />}
                                    {item.icon === 'briefcase' && <Briefcase size={15} />}
                                  </span>
                                  <div className="flex items-center gap-2 truncate">
                                    <span className="text-xs sm:text-sm font-semibold text-slate-800">
                                      {item.title}
                                    </span>
                                    <span className="text-xs text-slate-400">
                                      {item.subtitle}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setRecentSearches(recentSearches.filter((s) => s.id !== item.id));
                                    }}
                                    className="text-slate-300 hover:text-slate-600 p-1 rounded-full transition cursor-pointer"
                                    aria-label="Remove recent item"
                                  >
                                    <X size={13} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400 py-3 text-center">
                            No recent searches
                          </p>
                        )}
                      </div>
                    )}

                    {/* Dropdown footer helper info */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Click to select · Instant filter</span>
                      <span className="hidden sm:inline">ESC to close</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Search Button */}
              <button
                type="submit"
                className="bg-white hover:bg-slate-50 text-[#087ed9] font-bold text-xs sm:text-sm px-6 py-3 rounded-xl flex items-center justify-center gap-2 shrink-0 transition shadow-xs cursor-pointer active:scale-95"
              >
                <Search size={16} strokeWidth={2.5} />
                <span>Search</span>
              </button>

              {/* Reset Button */}
              <button
                type="button"
                onClick={handleReset}
                title="Reset all filters"
                className="bg-white/15 hover:bg-white/25 text-white font-medium text-xs sm:text-sm px-4 py-3 rounded-xl flex items-center justify-center gap-1.5 shrink-0 transition backdrop-blur-xs cursor-pointer active:scale-95"
              >
                <RotateCcw size={14} />
                <span>Reset</span>
              </button>
            </form>
          </div>
        </section>

        {/* Filter Toolbar Bar */}
        <section className="bg-white border-b border-slate-200 sticky top-[72px] z-40 shadow-xs">
          <div className="container-site py-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Left Filters */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                {/* Full Filters Button with Counter */}
                <button
                  type="button"
                  onClick={() => setIsFilterModalOpen(true)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer border shadow-2xs active:scale-95 ${
                    activeFiltersCount > 0
                      ? 'bg-sky-50 text-[#087ed9] border-sky-300 ring-2 ring-sky-100'
                      : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <SlidersHorizontal size={14} className={activeFiltersCount > 0 ? 'text-[#087ed9]' : 'text-slate-600'} />
                  <span>All Filters</span>
                  {activeFiltersCount > 0 && (
                    <span className="w-5 h-5 rounded-full bg-[#087ed9] text-white flex items-center justify-center text-[10px] font-extrabold ml-0.5">
                      {activeFiltersCount}
                    </span>
                  )}
                </button>

                <span className="h-5 w-[1px] bg-slate-200 hidden sm:inline-block" />

                {/* Purpose Dropdown Selector */}
                <div className="relative">
                  <select
                    value={filterValues.purpose}
                    onChange={(e) => updatePurpose(e.target.value as PurposeType)}
                    aria-label="Filter by purpose"
                    className="appearance-none bg-sky-50 border border-sky-200 text-[#087ed9] font-bold rounded-lg pl-3 pr-7 py-2 text-xs focus:outline-hidden cursor-pointer"
                  >
                    {purposeTabs.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={13}
                    className="text-[#087ed9] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  />
                </div>

                {/* Locality Dropdown */}
                <div className="relative">
                  <select
                    value={filterValues.locality}
                    onChange={(e) => updateLocality(e.target.value)}
                    aria-label="Filter by Chennai locality"
                    className="appearance-none bg-white border border-slate-200 rounded-lg pl-3 pr-7 py-2 text-xs font-medium text-slate-700 hover:border-slate-300 focus:outline-hidden cursor-pointer"
                  >
                    {chennaiLocalities.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={13}
                    className="text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  />
                </div>

                {/* Property Type Dropdown */}
                <div className="relative">
                  <select
                    value={filterValues.propertyType}
                    onChange={(e) => updateType(e.target.value)}
                    aria-label="Filter by property type"
                    className="appearance-none bg-white border border-slate-200 rounded-lg pl-3 pr-7 py-2 text-xs font-medium text-slate-700 hover:border-slate-300 focus:outline-hidden cursor-pointer"
                  >
                    {propertyTypes.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={13}
                    className="text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  />
                </div>

                {/* BHK Dropdown */}
                <div className="relative">
                  <select
                    value={filterValues.bhk.length === 1 ? filterValues.bhk[0] : (filterValues.bhk.length > 1 ? 'multi' : 'any')}
                    onChange={(e) => updateBhk(e.target.value)}
                    aria-label="Filter by BHK"
                    className="appearance-none bg-white border border-slate-200 rounded-lg pl-3 pr-7 py-2 text-xs font-medium text-slate-700 hover:border-slate-300 focus:outline-hidden cursor-pointer"
                  >
                    <option value="any">Any BHK</option>
                    <option value="1">1 BHK</option>
                    <option value="2">2 BHK</option>
                    <option value="3">3 BHK</option>
                    <option value="4">4 BHK</option>
                    <option value="5">5+ BHK</option>
                    {filterValues.bhk.length > 1 && (
                      <option value="multi" disabled>
                        {filterValues.bhk.length} BHKs selected
                      </option>
                    )}
                  </select>
                  <ChevronDown
                    size={13}
                    className="text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  />
                </div>

                {/* Budget Dropdown */}
                <div className="relative">
                  <select
                    value={filterValues.budget}
                    onChange={(e) => updateBudget(e.target.value)}
                    aria-label="Filter by budget"
                    className="appearance-none bg-white border border-slate-200 rounded-lg pl-3 pr-7 py-2 text-xs font-medium text-slate-700 hover:border-slate-300 focus:outline-hidden cursor-pointer"
                  >
                    {activeBudgetOptions.map((b) => (
                      <option key={b.value} value={b.value}>
                        {b.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={13}
                    className="text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  />
                </div>
              </div>

              {/* Right Sort Dropdown */}
              <div className="relative">
                <select
                  value={selectedSort}
                  onChange={(e) => setSelectedSort(e.target.value)}
                  aria-label="Sort properties"
                  className="appearance-none bg-white border border-slate-200 rounded-lg pl-3 pr-7 py-2 text-xs font-medium text-slate-700 hover:border-slate-300 focus:outline-hidden cursor-pointer"
                >
                  {sortOptions.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={13}
                  className="text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                />
              </div>
            </div>

            {/* Active Filter Chips Bar */}
            {activeFiltersCount > 0 && (
              <div className="pt-3 flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-slate-400 text-[11px] font-semibold mr-1">Active:</span>

                {filterValues.locality && filterValues.locality !== 'All Chennai' && filterValues.locality !== 'All localities' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-sky-50 text-[#087ed9] border border-sky-200 font-medium">
                    <span>{filterValues.locality}</span>
                    <button onClick={() => removeSingleFilter('locality')} className="hover:text-red-500 cursor-pointer">
                      <X size={12} />
                    </button>
                  </span>
                )}

                {filterValues.propertyType !== 'All property types' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-sky-50 text-[#087ed9] border border-sky-200 font-medium">
                    <span>{filterValues.propertyType}</span>
                    <button onClick={() => removeSingleFilter('propertyType')} className="hover:text-red-500 cursor-pointer">
                      <X size={12} />
                    </button>
                  </span>
                )}

                {filterValues.bhk.map((b) => (
                  <span key={b} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-sky-50 text-[#087ed9] border border-sky-200 font-medium">
                    <span>{b === '5' ? '5+ BHK' : `${b} BHK`}</span>
                    <button onClick={() => removeSingleFilter('bhk', b)} className="hover:text-red-500 cursor-pointer">
                      <X size={12} />
                    </button>
                  </span>
                ))}

                {filterValues.budget !== 'any' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-sky-50 text-[#087ed9] border border-sky-200 font-medium">
                    <span>
                      {activeBudgetOptions.find((b) => b.value === filterValues.budget)?.label || filterValues.budget}
                    </span>
                    <button onClick={() => removeSingleFilter('budget')} className="hover:text-red-500 cursor-pointer">
                      <X size={12} />
                    </button>
                  </span>
                )}

                {filterValues.furnishing.map((f) => (
                  <span key={f} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-sky-50 text-[#087ed9] border border-sky-200 font-medium">
                    <span>{f}</span>
                    <button onClick={() => removeSingleFilter('furnishing', f)} className="hover:text-red-500 cursor-pointer">
                      <X size={12} />
                    </button>
                  </span>
                ))}

                {filterValues.facing.map((fc) => (
                  <span key={fc} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-sky-50 text-[#087ed9] border border-sky-200 font-medium">
                    <span>{fc} Facing</span>
                    <button onClick={() => removeSingleFilter('facing', fc)} className="hover:text-red-500 cursor-pointer">
                      <X size={12} />
                    </button>
                  </span>
                ))}

                {filterValues.badges.map((b) => (
                  <span key={b} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-sky-50 text-[#087ed9] border border-sky-200 font-medium">
                    <span>{b}</span>
                    <button onClick={() => removeSingleFilter('badge', b)} className="hover:text-red-500 cursor-pointer">
                      <X size={12} />
                    </button>
                  </span>
                ))}

                {filterValues.amenities.map((a) => (
                  <span key={a} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-sky-50 text-[#087ed9] border border-sky-200 font-medium">
                    <span className="capitalize">{a}</span>
                    <button onClick={() => removeSingleFilter('amenity', a)} className="hover:text-red-500 cursor-pointer">
                      <X size={12} />
                    </button>
                  </span>
                ))}

                {filterValues.verifiedOnly && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                    <span>Verified Only</span>
                    <button onClick={() => removeSingleFilter('verified')} className="hover:text-red-500 cursor-pointer">
                      <X size={12} />
                    </button>
                  </span>
                )}

                <button
                  type="button"
                  onClick={handleReset}
                  className="text-xs font-semibold text-[#087ed9] hover:underline ml-1 cursor-pointer"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Results Section */}
        <section className="container-site py-8">
          {/* Header Count & Inventory Disclaimer */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              {loading
                ? `Searching ${selectedPurpose} properties…`
                : `${shownCount}${clientFiltered && hasMore ? '+' : ''} ${selectedPurpose} properties in ${filterValues.locality === 'All Chennai' ? 'Chennai' : filterValues.locality}`}
            </h2>
            <p className="text-xs text-slate-400">
              Verified Chennai listings
            </p>
          </div>

          {/* Properties Grid */}
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-20 text-sm text-slate-500">
              <Loader2 size={18} className="animate-spin text-[#087ed9]" />
              Loading properties…
            </div>
          ) : loadError && results.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-lg mx-auto my-12 shadow-xs" role="alert">
              <h3 className="text-lg font-bold text-slate-900">Properties could not be loaded</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">{loadError}</p>
              <button
                onClick={() => setReloadKey((k) => k + 1)}
                className="mt-5 inline-flex items-center gap-1.5 bg-[#087ed9] hover:bg-sky-600 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition cursor-pointer"
              >
                <RotateCcw size={14} />
                <span>Try again</span>
              </button>
            </div>
          ) : filteredProperties.length > 0 || hasMore ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProperties.map((property) => (
                  <div key={property.id} className="h-full">
                    <PropertyCard property={property} onContact={handleContact} />
                  </div>
                ))}
              </div>
              {loadError && <p className="text-xs text-red-600 text-center mt-6" role="alert">{loadError}</p>}
              {hasMore && (
                <div className="flex justify-center mt-8">
                  <button
                    onClick={() => void loadMore()}
                    disabled={loadingMore}
                    className="inline-flex items-center gap-2 border border-[#087ed9] text-[#087ed9] hover:bg-sky-50 disabled:opacity-60 text-xs font-semibold px-5 py-2.5 rounded-lg transition cursor-pointer"
                  >
                    {loadingMore && <Loader2 size={14} className="animate-spin" />}
                    {loadingMore ? 'Loading…' : 'Load more properties'}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-lg mx-auto my-12 shadow-xs">
              <Search size={40} className="text-slate-300 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-900">No properties found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                Try loosening your filters or search for another locality or property type.
              </p>
              <button
                onClick={handleReset}
                className="mt-5 inline-flex items-center gap-1.5 bg-[#087ed9] hover:bg-sky-600 text-white text-xs font-semibold px-4 h-[53px] rounded-lg transition cursor-pointer"
              >
                <RotateCcw size={14} />
                <span>Reset all filters</span>
              </button>
            </div>
          )}
        </section>
      </main>

      {/* Contact Enquiry Modal */}
      {selectedProperty && <EnquiryModal property={selectedProperty} onClose={() => setSelectedProperty(null)} />}

      {/* Full Filters Popup Modal */}
      <FullFiltersModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        filters={filterValues}
        onApply={(newFilters) => setFilterValues(newFilters)}
        onReset={() =>
          setFilterValues({
            ...initialFilterValues,
            purpose: filterValues.purpose,
          })
        }
        countMatches={countMatches}
      />

      <Footer />
    </div>
  );
}
