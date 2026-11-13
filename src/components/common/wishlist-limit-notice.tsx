"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { WISHLIST_LIMIT_EVENT } from "@/lib/wishlist";

/** Shown when a buyer tries to save more properties than their plan allows. */
export function WishlistLimitNotice() {
  const [info, setInfo] = useState<{ limit: number; planName: string } | null>(null);

  useEffect(() => {
    const onLimit = (e: Event) => setInfo((e as CustomEvent).detail);
    window.addEventListener(WISHLIST_LIMIT_EVENT, onLimit);
    return () => window.removeEventListener(WISHLIST_LIMIT_EVENT, onLimit);
  }, []);

  useEffect(() => {
    if (!info) return;
    const t = setTimeout(() => setInfo(null), 7000);
    return () => clearTimeout(t);
  }, [info]);

  if (!info) return null;
  return (
    <div
      role="status"
      className="fixed inset-x-4 bottom-4 z-[100] mx-auto flex max-w-md items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm shadow-xl sm:bottom-6"
    >
      <div className="flex-1">
        <p className="font-bold text-slate-900">Shortlist limit reached</p>
        <p className="mt-0.5 text-slate-600">
          Your {info.planName} plan lets you save up to {info.limit} properties.{" "}
          <Link href="/plans" className="font-semibold text-[#087ed9] hover:underline" onClick={() => setInfo(null)}>
            See buyer plans
          </Link>
        </p>
      </div>
      <button type="button" aria-label="Dismiss" onClick={() => setInfo(null)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
        <X size={16} />
      </button>
    </div>
  );
}
