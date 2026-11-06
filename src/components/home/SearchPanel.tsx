"use client";

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { HugeiconsIcon } from '@hugeicons/react';
import { Location01Icon, SearchIcon } from '@hugeicons/core-free-icons';
import { ChevronDown, X, MapPin, Building2, Briefcase, Home } from 'lucide-react';

const tabs = ['Buy', 'Resale', 'Rent', 'Lease'];

export default function SearchPanel() {
  const [activeTab, setActiveTab] = useState('Buy');
  const [query, setQuery] = useState('');
  const [propertyType, setPropertyType] = useState('Home');
  const [isFocused, setIsFocused] = useState(false);
  const router = useRouter();
  const containerRef = useRef<HTMLFormElement>(null);

  const [recentSearches, setRecentSearches] = useState([
    { id: 1, title: 'Alwarpet, Chennai', subtitle: 'Prime Residential', category: 'Home', query: 'Alwarpet', icon: 'home' },
    { id: 2, title: 'OMR Cyber Hub, Sholinganallur', subtitle: 'Commercial IT', category: 'Commercial', query: 'OMR', icon: 'briefcase' },
    { id: 3, title: 'ECR Beach Enclave, Injambakkam', subtitle: 'Villas & Plots', category: 'Villas', query: 'ECR', icon: 'map-pin' },
  ]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFocused(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(
      `/buy?purpose=${encodeURIComponent(activeTab)}&type=${encodeURIComponent(
        propertyType
      )}&q=${encodeURIComponent(query)}`
    );
  };

  return (
    <div className={`bg-white rounded-2xl shadow-[0_12px_45px_-10px_rgba(0,0,0,0.1)] hover:shadow-[0_20px_50px_-10px_rgba(8,126,217,0.14)] transition-shadow duration-300 border border-slate-100 p-4 sm:p-6 md:p-8 max-w-4xl mx-auto -mt-16 relative ${isFocused ? 'z-40' : 'z-30'}`}>
      {/* Navigation Tabs */}
      <div className="flex items-center justify-between gap-3 sm:gap-6 mb-4 sm:mb-6 border-b border-slate-100 sm:border-0 pb-1 sm:pb-0">
        <div className="flex items-center gap-5 sm:gap-8 overflow-x-auto no-scrollbar scrollbar-none py-0.5">
          {tabs.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className="relative pb-2.5 text-sm sm:text-[15px] font-medium transition cursor-pointer shrink-0 whitespace-nowrap group/tab"
              >
                <span
                  className={
                    isActive
                      ? 'font-bold text-[#0077e6]'
                      : 'text-slate-600 hover:text-slate-900 group-hover/tab:text-slate-900'
                  }
                >
                  {tab}
                </span>
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#0077e6] rounded-full animate-fadeIn" />
                )}
              </button>
            );
          })}
        </div>
        <Link
          href="/sell"
          className="hidden sm:inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-800 hover:border-slate-300 hover:shadow-sm transition shrink-0 whitespace-nowrap ml-auto mb-1.5"
        >
          <span>Post property</span>
          <span className="rounded bg-green-600 px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold uppercase text-white">Free</span>
        </Link>
      </div>

      {/* Search Input Container */}
      <form onSubmit={handleSearch} ref={containerRef} className="relative">
        <div className="flex flex-col sm:flex-row sm:items-center border border-slate-200 rounded-xl p-2 sm:pl-4 bg-white focus-within:border-sky-400 transition gap-3 sm:gap-0">
          {/* Location Pin & Query Input with Hugeicons */}
          <div className="flex items-center flex-1 min-w-0 px-2 sm:px-0">
            <span className="text-slate-400 shrink-0 mr-3 flex items-center justify-center">
              <HugeiconsIcon icon={Location01Icon} size={19} />
            </span>
            <input
              type="text"
              value={query}
              onFocus={() => setIsFocused(true)}
              onChange={(e) => {
                setQuery(e.target.value);
                setIsFocused(true);
              }}
              placeholder="Search Chennai locality or project (e.g. Alwarpet, OMR, ECR)..."
              className="w-full outline-none text-sm text-slate-800 placeholder:text-slate-400 bg-transparent py-1.5"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="text-slate-400 hover:text-slate-600 p-1 mr-2 cursor-pointer"
                aria-label="Clear query"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Divider */}
          <div className="hidden sm:block h-7 w-[1px] bg-slate-200 mx-4 shrink-0" />

          {/* Dropdown Selector */}
          <div className="relative shrink-0 flex items-center px-2 sm:px-0 sm:pr-4">
            <select
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value)}
              aria-label="Property type"
              className="appearance-none bg-transparent outline-none text-sm text-slate-700 font-medium pr-7 cursor-pointer py-1.5"
            >
              <option value="Home">Home</option>
              <option value="Apartments">Apartments</option>
              <option value="Villas">Villas</option>
              <option value="Plots">Plots</option>
              <option value="Commercial">Commercial</option>
            </select>
            <ChevronDown
              size={16}
              className="text-slate-500 absolute right-2 pointer-events-none"
            />
          </div>

          {/* Search Button with Hugeicons */}
          <button
            type="submit"
            className="bg-[#0077e6] hover:bg-blue-600 active:scale-[0.97] hover:-translate-y-0.5 text-white rounded-lg px-7 py-3 text-sm font-semibold flex items-center justify-center gap-2 transition duration-200 w-full sm:w-auto shrink-0 cursor-pointer shadow-sm hover:shadow-md"
          >
            <HugeiconsIcon icon={SearchIcon} size={17} />
            <span>Search</span>
          </button>
        </div>

        {/* Search Down Suggestion Dropdown (matching reference UI) */}
        {isFocused && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 p-4 sm:p-5 z-50 text-slate-800 animate-in fade-in slide-in-from-top-2 duration-150 text-left">
            {/* SECTION 1: "I'm looking for" */}
            <div className="mb-4">
              <p className="text-xs font-semibold text-slate-400 mb-2">
                I&apos;m looking for
              </p>
              <div className="flex flex-wrap items-center gap-2">
                {['Home', 'Apartments', 'Villas', 'Plots', 'Commercial'].map((category) => {
                  const isSelected = propertyType === category;
                  return (
                    <button
                      key={category}
                      type="button"
                      onClick={() => {
                        setPropertyType(category);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                        isSelected
                          ? 'bg-sky-50 text-[#0077e6] border border-sky-200 shadow-xs'
                          : 'bg-slate-100/80 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <span>{category}</span>
                      {isSelected && <X size={12} className="text-[#0077e6]" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SECTION 2: Recent Searches */}
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
                        setQuery(item.query);
                        if (item.category) setPropertyType(item.category);
                        setIsFocused(false);
                      }}
                      className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition ${
                        idx === 1 ? 'bg-slate-50 border border-slate-100' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-8 h-8 rounded-lg bg-[#087ed9] text-white flex items-center justify-center shrink-0">
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

            {/* Dropdown footer info */}
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span>Click to select · Instant search</span>
              <span className="hidden sm:inline">ESC to close</span>
            </div>
          </div>
        )}
      </form>

      {/* Mobile-only Quick Post Property strip */}
      <div className="sm:hidden mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
        <span className="text-slate-500 font-medium">Looking to sell or rent?</span>
        <Link
          href="/sell"
          className="inline-flex items-center gap-1.5 font-bold text-[#0077e6] hover:underline"
        >
          <span>Post property for free</span>
          <span className="bg-green-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded tracking-wide">
            FREE
          </span>
        </Link>
      </div>
    </div>
  );
}