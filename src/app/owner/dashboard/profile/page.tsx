"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getProfile, saveProfile, type Profile } from '@/lib/profile';
import { getSubscription, type OwnerSubscription } from '@/lib/ownerPlan';
import { card, shortDate } from '../ui';
import {
  User,
  Smartphone,
  Mail,
  MapPin,
  Check,
  Crown,
  Building2,
  PlusCircle,
  CreditCard,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';

const roleOptions: { value: Profile['role']; label: string }[] = [
  { value: 'owner', label: 'Owner' },
  { value: 'buyer', label: 'Buyer' },
  { value: 'agent', label: 'Agent' },
];

export default function OwnerProfilePage() {
  const [me, setMe] = useState<Profile | null>(null);
  const [sub, setSub] = useState<OwnerSubscription | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setMe(getProfile());
    setSub(getSubscription());
  }, []);

  if (!me) return null;

  const set = (key: keyof Profile, value: string) => {
    setMe({ ...me, [key]: value });
    setSaved(false);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    saveProfile(me);
    setSaved(true);
    window.dispatchEvent(new Event('profile-change'));
  };

  const initial = (me.name || 'O').charAt(0).toUpperCase();
  const joined = me.joinedAt ? shortDate(me.joinedAt) : 'Recently';
  const roleLabel = roleOptions.find((r) => r.value === me.role)?.label || 'Owner';

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Profile</h1>
        <p className="mt-1 text-sm text-slate-500">
          Your owner contact details, shown to interested buyers and tenants.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Left Side: Summary Card & Quick Links */}
        <aside className="space-y-6">
          {/* Avatar & Info Card */}
          <div className={`${card} p-6 text-center`}>
            <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-sky-50 text-3xl font-bold text-[#087ed9] border-2 border-sky-100 shadow-inner">
              {initial}
              <span className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full bg-[#087ed9] text-white shadow-xs">
                <ShieldCheck size={14} />
              </span>
            </div>

            <h2 className="mt-4 text-base font-bold text-slate-900">{me.name || 'Owner Profile'}</h2>
            <p className="mt-0.5 text-xs text-slate-500">+91 {me.mobile}</p>

            <div className="mt-3 flex items-center justify-center gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-[#087ed9]">
                Verified {roleLabel} ⭐
              </span>
            </div>

            <p className="mt-4 text-[11px] text-slate-400">Member since {joined}</p>
          </div>

          {/* Quick Links Card */}
          <div className={`${card} p-2`}>
            <Link
              href="/owner/dashboard/properties"
              className="flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#087ed9] transition"
            >
              <span className="flex items-center gap-2.5">
                <Building2 size={16} className="text-slate-400" />
                My Properties
              </span>
              <span className="text-[10px] text-slate-400">Manage</span>
            </Link>

            <Link
              href="/owner/dashboard/add-property"
              className="flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#087ed9] transition"
            >
              <span className="flex items-center gap-2.5">
                <PlusCircle size={16} className="text-slate-400" />
                Add New Property
              </span>
              <span className="text-[10px] text-[#087ed9] font-bold">+ New</span>
            </Link>

            <Link
              href="/owner/dashboard/payments"
              className="flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#087ed9] transition"
            >
              <span className="flex items-center gap-2.5">
                <CreditCard size={16} className="text-slate-400" />
                Plan &amp; Billing
              </span>
              <span className="text-[10px] text-slate-400">Invoices</span>
            </Link>

            <Link
              href="/profile"
              className="flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#087ed9] transition"
            >
              <span className="flex items-center gap-2.5">
                <ExternalLink size={16} className="text-slate-400" />
                Main Consumer Profile
              </span>
              <span className="text-[10px] text-slate-400">Buyer View</span>
            </Link>
          </div>
        </aside>

        {/* Right Side: Form and Subscription Card */}
        <div className="space-y-6">
          {/* Edit Form */}
          <form onSubmit={submit} className={`${card} p-6 sm:p-7 space-y-6`}>
            <div>
              <h2 className="text-base font-bold text-slate-900">Personal details</h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Keep your details accurate so prospective buyers and tenants can connect directly.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name" icon={User}>
                <input
                  value={me.name}
                  onChange={(e) => set('name', e.target.value)}
                  placeholder="Your full name"
                  className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                />
              </Field>

              <Field label="Mobile number (Verified)" icon={Smartphone}>
                <input
                  value={`+91 ${me.mobile}`}
                  disabled
                  className="w-full bg-transparent text-sm text-slate-500 outline-none cursor-not-allowed"
                />
              </Field>

              <Field label="Email" icon={Mail}>
                <input
                  type="email"
                  value={me.email}
                  onChange={(e) => set('email', e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                />
              </Field>

              <Field label="City" icon={MapPin}>
                <input
                  value={me.city}
                  onChange={(e) => set('city', e.target.value)}
                  placeholder="e.g. Chennai"
                  className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                />
              </Field>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-700">Account Role</p>
              <div className="mt-2 flex flex-wrap gap-2.5">
                {roleOptions.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => set('role', r.value)}
                    className={`rounded-xl border px-4 py-2 text-xs font-semibold transition cursor-pointer ${
                      me.role === r.value
                        ? 'border-[#087ed9] bg-sky-50 text-[#087ed9] shadow-2xs'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <span className="text-xs text-slate-400">Member since {joined}</span>
              <div className="flex items-center gap-3">
                {saved && (
                  <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 animate-fadeIn">
                    <Check size={14} /> Saved successfully
                  </span>
                )}
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-xl bg-[#087ed9] px-6 h-[53px] text-xs font-semibold text-white hover:bg-[#0070c9] shadow-sm transition cursor-pointer"
                >
                  Save changes
                </button>
              </div>
            </div>
          </form>

          {/* Active Plan Card */}
          {sub && (
            <div className={`${card} p-6 sm:p-7`}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200/60 px-3 py-1 text-xs font-bold text-amber-800">
                    <Crown size={14} className="text-amber-600" /> Active Owner Plan
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 mt-2">{sub.planName}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {sub.expiresAt
                      ? `Valid until ${shortDate(sub.expiresAt)}`
                      : 'Valid until deal closed · Full duration assurance'}
                  </p>
                </div>

                <Link
                  href="/owner/plans"
                  className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition"
                >
                  Upgrade plan
                </Link>
              </div>

              <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-3 border-t border-slate-100 pt-4">
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-[10px] text-slate-400 font-semibold uppercase">Listing Limit</p>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">{sub.listingLimit} Properties</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-[10px] text-slate-400 font-semibold uppercase">Brokerage</p>
                  <p className="text-sm font-bold text-emerald-600 mt-0.5">0% Zero Commission</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 col-span-2 sm:col-span-1">
                  <p className="text-[10px] text-slate-400 font-semibold uppercase">Verified Badge</p>
                  <p className="text-sm font-bold text-[#087ed9] mt-0.5">Included ⭐</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-slate-700">{label}</span>
      <span className="mt-1.5 flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus-within:border-[#087ed9] transition">
        <Icon size={16} className="text-slate-400 shrink-0" />
        {children}
      </span>
    </label>
  );
}
