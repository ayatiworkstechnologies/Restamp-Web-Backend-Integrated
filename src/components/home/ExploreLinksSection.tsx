'use client';

import { useState } from 'react';
import { ArrowRight, ChevronRight, Building2, IndianRupee, Landmark, MapPin } from 'lucide-react';
import Link from 'next/link';

const q = (base: string, params: Record<string, string>) => `${base}?${new URLSearchParams(params).toString()}`;
const loc = (l: string) => ({ label: `Property in ${l}`, href: q('/buy', { locality: l }) });

const columns: { title: string; icon: typeof MapPin; tint: string; desc: string; links: { label: string; href: string }[] }[] = [
  {
    title: 'Buy & Rent in Chennai', icon: Building2, tint: 'bg-[#087ed9] text-white', desc: 'Homes, plots & offices to buy or rent',
    links: [
      { label: 'All property in Chennai', href: '/buy' },
      { label: 'Property for Sale', href: q('/buy', { purpose: 'Buy' }) },
      { label: 'Ready to Move Property for Sale', href: q('/buy', { q: 'Ready to move' }) },
      { label: 'Flats for Sale', href: q('/buy', { type: 'Apartments' }) },
      { label: 'Residential Plots for Sale', href: q('/buy', { type: 'Plots' }) },
      { label: 'Under Construction Property', href: q('/buy', { q: 'Under construction' }) },
      { label: 'Property for Rent', href: '/rent' },
      { label: 'Flats for Rent', href: q('/rent', { type: 'Apartments' }) },
      { label: 'Independent Houses for Rent', href: q('/rent', { type: 'Home' }) },
      { label: 'Office Space for Rent', href: q('/rent', { type: 'Commercial' }) },
      { label: 'Villas for Sale', href: q('/buy', { type: 'Villas' }) },
      { label: 'PG & Co-living', href: q('/rent', { q: 'PG' }) },
    ],
  },
  {
    title: 'Localities in Chennai', icon: MapPin, tint: 'bg-[#087ed9] text-white', desc: 'Most searched neighbourhoods',
    links: ['Anna Nagar', 'Velachery', 'T. Nagar', 'Porur', 'Tambaram', 'Sholinganallur', 'Perungudi', 'Pallikaranai', 'Guindy', 'Nungambakkam', 'Mylapore', 'Adyar'].map(loc),
  },
  {
    title: 'Size & Budget', icon: IndianRupee, tint: 'bg-[#087ed9] text-white', desc: 'Filter by BHK and price range',
    links: [
      { label: 'Property under ₹50 Lakh', href: q('/buy', { q: 'under 50 lakh' }) },
      { label: 'Property ₹50 Lakh – ₹1 Crore', href: q('/buy', { q: '50 lakh to 1 crore' }) },
      { label: 'Property above ₹1 Crore', href: q('/buy', { q: 'above 1 crore' }) },
      { label: '1 BHK Flats', href: q('/buy', { q: '1 BHK' }) },
      { label: '2 BHK Flats', href: q('/buy', { q: '2 BHK' }) },
      { label: '3 BHK Flats', href: q('/buy', { q: '3 BHK' }) },
      { label: '4 BHK Flats', href: q('/buy', { q: '4 BHK' }) },
      { label: '3 BHK Houses & Villas', href: q('/buy', { q: '3 BHK', type: 'Villas' }) },
      { label: '1 BHK Flats for Rent', href: q('/rent', { q: '1 BHK' }) },
      { label: '2 BHK Flats for Rent', href: q('/rent', { q: '2 BHK' }) },
      { label: 'Rent under ₹15,000', href: q('/rent', { q: 'under 15000' }) },
      { label: 'Rent above ₹30,000', href: q('/rent', { q: 'above 30000' }) },
    ],
  },
  {
    title: 'Cities & Projects', icon: Landmark, tint: 'bg-[#087ed9] text-white', desc: 'Growth corridors & new launches',
    links: [
      ...['Medavakkam', 'Semmanjeri', 'Navalur', 'Padur', 'Kelambakkam', 'Perungalathur'].map(loc),
      { label: 'New Projects in Chennai', href: '/projects' },
      ...['Tambaram', 'Avadi', 'OMR', 'ECR', 'Porur'].map((l) => ({ label: `New Projects in ${l}`, href: q('/projects', { locality: l }) })),
    ],
  },
];

export default function ExploreLinksSection() {
  const [active, setActive] = useState(0);
  const col = columns[active];

  return (
    <section className="container-site pb-20">
      <div className="mb-8 max-w-2xl">
        <p className="eyebrow">Browse by category</p>
        <h2 className="section-title mt-2">Explore real estate on Restamp</h2>
      </div>

      <div className="overflow-hidden rounded-[24px] border border-slate-100 bg-white shadow-[0_4px_24px_rgba(0,0,0,0.04)] lg:grid lg:grid-cols-[300px_1fr]">
        {/* Sidebar */}
        <div role="tablist" aria-orientation="vertical" className="flex gap-2 overflow-x-auto border-b border-slate-100 bg-slate-50/70 p-3 [scrollbar-width:none] lg:flex-col lg:overflow-visible lg:border-b-0 lg:border-r lg:p-4">
          {columns.map((c, i) => {
            const Icon = c.icon;
            const on = i === active;
            return (
              <button
                key={c.title}
                role="tab"
                aria-selected={on}
                onClick={() => setActive(i)}
                className={`group flex shrink-0 items-center gap-3 rounded-2xl px-3 py-3 text-left transition lg:w-full ${
                  on ? 'bg-white shadow-sm ring-1 ring-slate-200' : 'hover:bg-white/70'
                }`}
              >
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm shadow-[#087ed9]/25 ${c.tint}`}>
                  <Icon size={18} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className={`block whitespace-nowrap text-sm font-bold ${on ? 'text-slate-900' : 'text-slate-600'}`}>{c.title}</span>
                  <span className="hidden text-xs text-slate-500 lg:block">{c.desc}</span>
                </span>
                <ChevronRight size={16} className={`hidden shrink-0 transition lg:block ${on ? 'text-[#087ed9]' : 'text-slate-300 group-hover:translate-x-0.5'}`} />
              </button>
            );
          })}
        </div>

        {/* Links */}
        <div role="tabpanel" className="p-5 sm:p-8">
          <h3 className="mb-5 text-lg font-bold tracking-tight text-slate-900">{col.title}</h3>
          <ul className="grid grid-cols-1 gap-x-8 sm:grid-cols-2 xl:grid-cols-3">
            {col.links.map((l) => (
              <li key={l.label}>
                <Link
                  href={l.href}
                  className="group flex items-center justify-between gap-3 border-b border-dashed border-slate-100 py-3 text-sm text-slate-600 transition hover:text-[#087ed9]"
                >
                  <span className="truncate">{l.label}</span>
                  <ArrowRight size={14} className="shrink-0 -translate-x-1 text-[#087ed9] opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
