"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import HugeIcon from '@/components/ui/HugeIcon';
import {
  FavouriteIcon,
  CallIcon,
  ArrowRight01Icon,
} from '@hugeicons/core-free-icons';
import { Property } from '@/data/properties';
import { toggleWishlist, useWishlist } from '@/lib/wishlist';
import { contactFor, logActivity } from '@/lib/activity';
import { getProfile } from '@/lib/profile';

interface PropertyCardProps {
  property: Property;
  onContact?: (property: Property) => void;
  showExplore?: boolean;
}

export default function PropertyCard({
  property,
  onContact,
  showExplore = false,
}: PropertyCardProps) {
  const router = useRouter();
  const liked = useWishlist().includes(property.id);
  const [showNumber, setShowNumber] = useState(false);

  const propertyUrl = `/properties/${property.id}`;

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!target.closest('button')) {
      router.push(propertyUrl);
    }
  };

  return (
    <article
      onClick={handleCardClick}
      className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs hover:shadow-lg hover:border-sky-300 transition-all duration-300 group flex flex-col h-full cursor-pointer"
    >
      {/* Clickable Card Link - Wraps Image and all details */}
      <Link
        href={propertyUrl}
        className="flex-1 flex flex-col block no-underline text-inherit"
      >
        {/* Property Image Container */}
        <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
          <img
            src={property.image}
            alt={property.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />

          {/* Status Badge (Top-Left) */}
          <span className="absolute top-3.5 left-3.5 bg-white text-slate-800 text-[11px] font-medium px-2.5 py-1 rounded shadow-xs pointer-events-none">
            {property.badge}
          </span>

          {/* Favorite Button (Top-Right) */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleWishlist(property.id);
            }}
            aria-label={liked ? 'Remove from wishlist' : 'Save property'}
            className="absolute top-3.5 right-3.5 p-1 text-white hover:scale-110 active:scale-95 transition drop-shadow z-20 cursor-pointer flex items-center justify-center"
          >
            <HugeIcon
              icon={FavouriteIcon}
              size={20}
              color={liked ? '#ef4444' : '#ffffff'}
              className={liked ? 'fill-red-500' : ''}
            />
          </button>

          {/* Bottom Overlay Bar matching user screenshot: Frosted glass on left, Solid black 2/5 block on right */}
          <div className="absolute bottom-0 inset-x-0 h-9 sm:h-10 flex items-stretch pointer-events-none z-10 overflow-hidden">
            {/* Frosted Glass Timeline Info (Dark text) */}
            <div className="flex-1 bg-white/60 backdrop-blur-md px-3.5 sm:px-4 flex items-center gap-1.5 text-xs sm:text-[13px] text-slate-900 font-normal truncate">
              <span className="text-black font-normal">
                {property.launchType || 'New Launch'}
              </span>
              <span className="text-black font-bold">·</span>
              <span className="text-black font-semibold">
                {property.completion || 'Completion in Jun, 2030'}
              </span>
            </div>

            {/* Solid Black Image Count Box (Flush full-height on the right) */}
            <div className="bg-black text-white text-xs sm:text-[13px] font-medium px-3.5 sm:px-4 flex items-center justify-center shrink-0 tracking-wide">
              {property.imageCount || '2/5'}
            </div>
          </div>
        </div>

        {/* Property Details */}
        <div className="p-5 flex-1 flex flex-col justify-between">
          <div>
            {/* Title & Green New Booking Badge */}
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-bold text-[18px] text-slate-900 group-hover:text-[#087ed9] transition leading-snug line-clamp-1 flex-1">
                {property.name}
              </h3>
              <span className="bg-[#009b4d] text-white text-[10px] font-bold tracking-wider px-2 py-0.5 rounded uppercase shrink-0 mt-0.5 pointer-events-none">
                {property.statusTag || 'NEW BOOKING'}
              </span>
            </div>

            {/* Configuration & Location */}
            <p className="text-xs mt-1.5 text-slate-500 truncate">
              <span className="font-bold text-slate-900">{property.bhk || property.beds}</span>{' '}
              <span className="text-slate-500 font-normal">
                {property.propertyType || property.area}
              </span>
            </p>

            {/* Price */}
            <div className="mt-3">
              <p className="text-xl font-bold text-slate-900 leading-none">
                {property.price}
              </p>
              <p className="text-xs text-slate-400 font-normal mt-1">
                {property.pricePerSqft || '₹7,200 /sqft'}
              </p>
            </div>

            {/* Description snippet */}
            <p className="text-xs text-slate-500 leading-relaxed mt-3 line-clamp-2 min-h-[34px]">
              {property.description}
            </p>

            {/* Builder Info & Optional Explore Link */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-[11px] text-slate-400 font-normal">
                  {property.postedBy || 'Builder'} · {property.postedTime || '2mo ago'}
                </p>
                <p className="text-xs font-bold text-slate-900 uppercase tracking-tight truncate mt-0.5">
                  {property.builderName || 'Skyline Properties'}
                </p>
              </div>
              {showExplore && (
                <span className="text-xs font-semibold text-[#087ed9] flex items-center gap-1 group-hover:translate-x-0.5 transition">
                  <span>Explore</span>
                  <HugeIcon icon={ArrowRight01Icon} size={15} />
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>

      {/* Action Buttons (Separated outside Link) */}
      <div className="px-5 pb-5 pt-0 flex items-center gap-2.5">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (!showNumber) logActivity('call', property.id, contactFor(property));
            setShowNumber(!showNumber);
          }}
          className="flex-1 h-[53px] px-3 border border-[#087ed9] text-[#087ed9] hover:bg-sky-50 font-semibold text-xs rounded-md transition text-center truncate flex items-center justify-center gap-1.5 cursor-pointer bg-white"
        >
          {showNumber && <HugeIcon icon={CallIcon} size={14} color="#087ed9" />}
          <span>
            {showNumber
              ? property.phoneNumber || '+91 98402 11234'
              : 'View Number'}
          </span>
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            const me = getProfile();
            logActivity('message', property.id, {
              ...contactFor(property),
              senderName: me?.name,
              senderPhone: me ? `+91 ${me.mobile}` : undefined,
              senderEmail: me?.email,
              message: `Hi, I am interested in ${property.name}. Please share more details.`,
            });
            onContact?.(property);
          }}
          className="inline-flex items-center justify-center flex-1 h-[53px] px-3 bg-[#087ed9] hover:bg-sky-600 text-white font-semibold text-xs rounded-md transition text-center shadow-xs cursor-pointer"
        >
          Contact
        </button>
      </div>
    </article>
  );
}