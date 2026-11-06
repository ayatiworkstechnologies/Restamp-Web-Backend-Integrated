"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import PostPropertyWizard from '@/components/owner/PostPropertyWizard';
import { getOwnerListings } from '@/lib/ownerListings';
import { getSubscription } from '@/lib/ownerPlan';
import { card } from '../ui';

export default function OwnerAddPropertyPage() {
  const [limitReached, setLimitReached] = useState<boolean | null>(null);

  // Checked once on entry so finishing the last allowed listing still shows its success screen
  useEffect(() => {
    const sub = getSubscription();
    setLimitReached(!!sub && getOwnerListings().length >= sub.listingLimit);
  }, []);

  if (limitReached === null) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Add Property</h1>
        <p className="mt-1 text-sm text-slate-500">Add a new property for sale, resale, rent or lease.</p>
      </div>
      {limitReached ? (
        <div className={`${card} py-14 text-center`}>
          <p className="font-semibold text-slate-900">You&apos;ve reached your plan&apos;s listing limit.</p>
          <p className="mt-1 text-sm text-slate-500">Upgrade your plan to list more properties.</p>
          <Link href="/owner/plans" className="inline-flex items-center justify-center mt-5 rounded-xl bg-[#087ed9] px-5 h-[53px] text-sm font-semibold text-white hover:bg-sky-600 transition">
            Upgrade plan
          </Link>
        </div>
      ) : (
        <PostPropertyWizard doneHref="/owner/dashboard/properties" doneLabel="View my properties" />
      )}
    </div>
  );
}
