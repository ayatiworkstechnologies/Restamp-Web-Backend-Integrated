'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BadgeCheck, Bath, BedDouble, Heart, MapPin, Phone, Ruler } from 'lucide-react';
import { properties, Property } from '@/data/properties';
import { toggleWishlist, useWishlist } from '@/lib/wishlist';

function RecentCard({ p, liked, verified }: { p: Property; liked: boolean; verified?: boolean }) {
  const [show, setShow] = useState(false);
  const title = [p.bhk, p.propertyType || p.propertyCategory].filter(Boolean).join(' ') || p.name;
  const location = p.address || [p.locality || p.area, p.city].filter(Boolean).join(', ');

  const meta = [p.price, p.sqft].filter(Boolean);

  return (
    <article className="group flex flex-col rounded-[24px] bg-white p-3 shadow-[0_8px_30px_rgba(15,23,42,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(15,23,42,0.12)]">
      <Link href={`/properties/${p.id}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden rounded-[18px]">
          <img src={p.image} alt={title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
          {verified && (
            <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-emerald-700 shadow-sm">
              <BadgeCheck size={14} className="fill-emerald-100" /> Verified
            </span>
          )}
          <button
            type="button"
            aria-label={liked ? 'Remove from saved' : 'Save property'}
            onClick={(e) => {
              e.preventDefault();
              toggleWishlist(p.id);
            }}
            className="absolute right-3 top-3 inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-sm backdrop-blur transition hover:scale-110"
          >
            <Heart size={18} className={liked ? 'fill-rose-500 text-rose-500' : ''} />
          </button>
        </div>
        <div className="px-3 pt-5">
          <h3 className="truncate text-xl font-bold tracking-tight text-slate-900">{title}</h3>
          <p className="mt-1.5 truncate text-sm text-slate-500">
            <span className="font-semibold text-[#087ed9]">{meta[0]}</span>
            {meta.slice(1).map((m) => (
              <span key={m}> · {m}</span>
            ))}
          </p>
          {location && (
            <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-500">
              <MapPin size={15} className="shrink-0" />
              <span className="truncate">{location}</span>
            </p>
          )}
        </div>
      </Link>
      <div className="mx-3 mt-5 border-t border-slate-100" />
      <div className="px-3 pb-2 pt-4">
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="inline-flex w-full h-[53px] cursor-pointer items-center justify-center gap-2 rounded-[16px] bg-slate-100 px-5 text-sm font-semibold text-slate-900 transition hover:bg-slate-200"
        >
          <Phone size={16} />
          {show ? p.phoneNumber || '+91 98402 11234' : 'View Number'}
        </button>
      </div>
    </article>
  );
}

type SectionProps = {
  eyebrow: string;
  title: string;
  description: string;
  items: Property[];
  href?: string;
  verified?: boolean;
};

export function PropertyCardSection({ eyebrow, title, description, items, href = '/buy', verified }: SectionProps) {
  const wish = useWishlist();
  return (
    <section className="container-site pb-16">
      <div className="mb-7 flex items-end justify-between gap-4">
        <div className="max-w-2xl">
          <p className="eyebrow">{eyebrow}</p>
          <h2 className="section-title mt-2">{title}</h2>
          <p className="text-sm text-slate-600 mt-3 leading-relaxed">{description}</p>
        </div>
        <Link href={href} className="shrink-0 text-sm font-semibold text-[#087ed9] hover:underline">
          View all →
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((p) => (
          <RecentCard key={p.id} p={p} liked={wish.includes(p.id)} verified={verified} />
        ))}
      </div>
    </section>
  );
}

export default function RecentlyAddedSection() {
  return (
    <PropertyCardSection
      eyebrow="Fresh on Restamp"
      title="Recently added properties"
      description="The newest homes, villas and apartments just listed — be the first to explore them before they're gone."
      items={[...properties].sort((a, b) => b.id - a.id).slice(0, 4)}
    />
  );
}

function VerifiedCard({ p, liked }: { p: Property; liked: boolean }) {
  const isRent = p.purpose === 'Rent' || p.purpose === 'Lease' || /\/\s*mo/i.test(p.price);
  const location = p.address || [p.locality || p.area, p.city].filter(Boolean).join(', ');
  const specs = [
    p.beds && { icon: BedDouble, label: p.beds },
    p.baths && { icon: Bath, label: p.baths },
    p.sqft && { icon: Ruler, label: p.sqft },
  ].filter(Boolean) as { icon: typeof Bath; label: string }[];

  return (
    <Link
      href={`/properties/${p.id}`}
      className="group flex flex-col overflow-hidden rounded-[16px] bg-white shadow-[0_6px_24px_rgba(15,23,42,0.07)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_14px_36px_rgba(15,23,42,0.12)]"
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        <img src={p.image} alt={p.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        <span
          className={`absolute left-3 top-3 rounded-md px-2.5 py-1 text-xs font-semibold ${
            isRent ? 'bg-indigo-500 text-white' : 'bg-emerald-100 text-emerald-800'
          }`}
        >
          {isRent ? 'For Rent' : 'For Sale'}
        </span>
        <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-md bg-white/95 px-2.5 py-1 text-xs font-semibold text-[#087ed9] shadow-sm">
          <BadgeCheck size={14} className="fill-sky-100" /> Verified
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="flex min-w-0 items-center gap-1.5 text-base font-bold text-slate-900">
            <span className="truncate">{p.name}</span>
          </h3>
          <button
            type="button"
            aria-label={liked ? 'Remove from saved' : 'Save property'}
            onClick={(e) => {
              e.preventDefault();
              toggleWishlist(p.id);
            }}
            className="shrink-0 cursor-pointer text-slate-500 transition hover:scale-110 hover:text-rose-500"
          >
            <Heart size={20} className={liked ? 'fill-rose-500 text-rose-500' : ''} />
          </button>
        </div>
        {location && (
          <p className="mt-1.5 flex items-center gap-1.5 text-sm text-slate-500">
            <MapPin size={14} className="shrink-0" />
            <span className="truncate">{location}</span>
          </p>
        )}
        <p className="mt-4 text-lg font-bold text-slate-900">{p.price}</p>
        <div className="mt-auto pt-4">
          <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-4 text-xs text-slate-500">
            {specs.map(({ icon: I, label }) => (
              <span key={label} className="flex min-w-0 items-center gap-1.5">
                <I size={14} className="shrink-0" />
                <span className="truncate">{label}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
}

export function VerifiedPropertiesSection() {
  const wish = useWishlist();
  const verified = properties.filter((p) => /verified/i.test(p.postedBy || ''));
  const items = (verified.length >= 4 ? verified : [...verified, ...properties.filter((p) => !verified.includes(p))]).slice(0, 4);
  return (
    <section className="container-site pb-16">
      <div className="mb-7 flex items-end justify-between gap-4">
        <div className="max-w-2xl">
          <p className="eyebrow">Trusted listings</p>
          <h2 className="section-title mt-2">Verified properties</h2>
          <p className="text-sm text-slate-600 mt-3 leading-relaxed">
            Every listing here is checked by our team — genuine owners, verified documents and accurate pricing.
          </p>
        </div>
        <Link href="/buy" className="shrink-0 text-sm font-semibold text-[#087ed9] hover:underline">
          View all →
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((p) => (
          <VerifiedCard key={p.id} p={p} liked={wish.includes(p.id)} />
        ))}
      </div>
    </section>
  );
}
