"use client";

import { useState, useRef } from 'react';
import { ArrowLeft, ArrowRight, X, CheckCircle2 } from 'lucide-react';
import PropertyCard from '@/components/property/PropertyCard';
import { properties, Property } from '@/data/properties';

export default function FeaturedHomesSection() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', message: '' });

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const containerWidth = scrollRef.current.clientWidth;
      const scrollOffset = direction === 'left' ? -containerWidth * 0.8 : containerWidth * 0.8;
      scrollRef.current.scrollBy({ left: scrollOffset, behavior: 'smooth' });
    }
  };

  const handleContact = (property: Property) => {
    setSelectedProperty(property);
    setContactSubmitted(false);
    setFormData({
      name: '',
      phone: '',
      email: '',
      message: `Hi, I am interested in ${property.name} (${property.bhk || ''} in ${property.propertyType || ''}). Please share the brochure and current availability.`,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactSubmitted(true);
    setTimeout(() => {
      setSelectedProperty(null);
      setContactSubmitted(false);
    }, 2200);
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
        Sample properties and illustrative pricing. Verified developer listings.
      </p>

      {/* Contact Enquiry Modal */}
      {selectedProperty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-7 relative shadow-2xl border border-slate-100">
            <button
              onClick={() => setSelectedProperty(null)}
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
                  The developer for <strong className="text-slate-800">{selectedProperty.name}</strong> will contact you shortly.
                </p>
              </div>
            ) : (
              <div>
                <p className="eyebrow text-[#087ed9]">CONNECT WITH DEVELOPER</p>
                <h3 className="text-xl font-bold text-slate-900 mt-1">
                  Enquire about {selectedProperty.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {selectedProperty.bhk} · {selectedProperty.propertyType} · {selectedProperty.price}
                </p>

                <form onSubmit={handleSubmit} className="mt-5 space-y-3.5">
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
                      onClick={() => setSelectedProperty(null)}
                      className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="inline-flex items-center justify-center px-5 h-[53px] text-xs font-semibold text-white bg-[#087ed9] hover:bg-sky-600 rounded-lg transition shadow-sm"
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
    </section>
  );
}
