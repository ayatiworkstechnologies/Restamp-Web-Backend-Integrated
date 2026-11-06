"use client";

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import PropertyCard from '@/components/property/PropertyCard';
import EnquiryModal from '@/components/property/EnquiryModal';
import { Property } from '@/data/properties';
import { searchListings } from '@/lib/api/buyer';
import { errorMessage } from '@/lib/api/client';
import { cardToProperty } from '@/lib/api/mappers';

/** Newest verified resale listings from GET /buyer/listings (there is no separate "featured" flag). */
export default function FeaturedHomesSection() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    searchListings({ deal: 'RESALE', sort: 'relevance' }, 1, 9, controller.signal)
      .then((res) => setProperties(res.items.map(cardToProperty)))
      .catch((e) => {
        if (!controller.signal.aborted) setError(errorMessage(e, 'Could not load properties.'));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const containerWidth = scrollRef.current.clientWidth;
      const scrollOffset = direction === 'left' ? -containerWidth * 0.8 : containerWidth * 0.8;
      scrollRef.current.scrollBy({ left: scrollOffset, behavior: 'smooth' });
    }
  };

  const handleContact = (property: Property) => {
    setSelectedProperty(property);
  };

  return (
    <section className="container-site pb-20">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-7">
        <div>
          <p className="eyebrow text-slate-500">HANDPICKED FOR YOU</p>
          <h2 className="text-2xl sm:text-3xl md:text-[32px] font-bold text-slate-900 tracking-tight mt-1.5">
            Recommended Projects
          </h2>
        </div>

        {/* Carousel Navigation Arrows */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => scroll('left')}
            aria-label="Previous properties"
            className="p-2 text-[#087ed9] hover:bg-sky-100/70 hover:scale-110 border border-transparent hover:border-sky-200/80 rounded-full transition duration-200 active:scale-[0.97] cursor-pointer shadow-2xs"
          >
            <ArrowLeft size={22} strokeWidth={2.2} />
          </button>
          <button
            onClick={() => scroll('right')}
            aria-label="Next properties"
            className="p-2 text-[#087ed9] hover:bg-sky-100/70 hover:scale-110 border border-transparent hover:border-sky-200/80 rounded-full transition duration-200 active:scale-[0.97] cursor-pointer shadow-2xs"
          >
            <ArrowRight size={22} strokeWidth={2.2} />
          </button>
        </div>
      </div>

      {/* Carousel Track */}
      <div
        ref={scrollRef}
        className="flex gap-6 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        {loading && (
          <div className="flex items-center gap-2 py-16 text-sm text-slate-500">
            <Loader2 size={18} className="animate-spin text-[#087ed9]" />
            Loading properties…
          </div>
        )}
        {!loading && (error || properties.length === 0) && (
          <div className="py-12 text-sm text-slate-500" role={error ? 'alert' : undefined}>
            {error || 'No resale listings are live right now.'}{' '}
            <Link href="/buy" className="text-[#087ed9] font-semibold hover:underline">
              Browse all properties
            </Link>
          </div>
        )}
        {properties.map((property) => (
          <div
            key={property.id}
            className="w-[88vw] sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] shrink-0 snap-start"
          >
            <PropertyCard property={property} onContact={handleContact} />
          </div>
        ))}
      </div>

      <p className="text-[12px] text-slate-400 mt-4">
        Verified listings posted by owners on Restamp.
      </p>

      {/* Contact Enquiry Modal */}
      {selectedProperty && <EnquiryModal property={selectedProperty} onClose={() => setSelectedProperty(null)} />}
    </section>
  );
}
