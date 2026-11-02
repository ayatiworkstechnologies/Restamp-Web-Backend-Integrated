"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ensureRole, refreshMe, updateDisplayName } from '@/lib/api/auth';
import { errorMessage } from '@/lib/api/client';
import { isPlaceholderName, useSession } from '@/lib/api/session';
import { card } from '../ui';
import {
  User,
  Smartphone,
  Mail,
  MapPin,
  Check,
  Building2,
  PlusCircle,
  CreditCard,
  ShieldCheck,
  ExternalLink,
  Loader2,
} from 'lucide-react';

type RoleValue = 'owner' | 'buyer' | 'agent';

const roleOptions: { value: RoleValue; label: string; available: boolean }[] = [
  { value: 'owner', label: 'Owner', available: true },
  { value: 'buyer', label: 'Buyer', available: true },
  // Agent accounts are not available on the website yet.
  { value: 'agent', label: 'Agent', available: false },
];

export default function OwnerProfilePage() {
  const router = useRouter();
  const { session } = useSession();
  const [name, setName] = useState('');
  const [role, setRole] = useState<RoleValue>('owner');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    refreshMe()
      .then((me) => setName(isPlaceholderName(me.displayName) ? '' : me.displayName))
      .catch((e) => setError(errorMessage(e, 'Could not load your profile.')));
  }, []);

  if (!session) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim().replace(/\s+/g, ' ');
    if (trimmed.length < 2) {
      setError('Please enter your name');
      return;
    }
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      if (trimmed !== session.displayName) await updateDisplayName(trimmed);
      if (role === 'buyer') {
        // Leaving owner mode: the backend role becomes BUYER and the buyer profile opens.
        await ensureRole('BUYER');
        router.push('/profile');
        return;
      }
      setSaved(true);
    } catch (err) {
      setError(errorMessage(err, 'Could not save your changes. Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  const displayName = isPlaceholderName(session.displayName) ? '' : session.displayName;
  const initial = (displayName || 'O').charAt(0).toUpperCase();

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

            <h2 className="mt-4 text-base font-bold text-slate-900">{displayName || 'Owner Profile'}</h2>
            <p className="mt-0.5 text-xs text-slate-500">Signed in with your mobile number</p>

            <div className="mt-3 flex items-center justify-center gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-[#087ed9]">
                Owner
              </span>
            </div>
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
                Buyers see your name on your listings and in their enquiries.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name" icon={User}>
                <input
                  value={name}
                  maxLength={100}
                  onChange={(e) => {
                    setName(e.target.value);
                    setSaved(false);
                  }}
                  placeholder="Your full name"
                  className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                />
              </Field>

              <Field label="Mobile number (Verified)" icon={Smartphone}>
                <input
                  value="Verified at sign-in"
                  disabled
                  className="w-full bg-transparent text-sm text-slate-500 outline-none cursor-not-allowed"
                />
              </Field>

              <Field label="Email" icon={Mail}>
                <input
                  type="email"
                  disabled
                  placeholder="Not available yet"
                  className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 cursor-not-allowed"
                />
              </Field>

              <Field label="City" icon={MapPin}>
                <input
                  value="Chennai"
                  disabled
                  className="w-full bg-transparent text-sm text-slate-500 outline-none cursor-not-allowed"
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
                    disabled={!r.available}
                    title={r.available ? undefined : 'Agent accounts are not available on the website yet'}
                    onClick={() => {
                      setRole(r.value);
                      setSaved(false);
                    }}
                    className={`rounded-xl border px-4 py-2 text-xs font-semibold transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                      role === r.value
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
              <span className="text-xs text-red-600" role="alert">{error}</span>
              <div className="flex items-center gap-3">
                {saved && (
                  <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 animate-fadeIn">
                    <Check size={14} /> Saved successfully
                  </span>
                )}
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-[#087ed9] px-6 py-2.5 text-xs font-semibold text-white hover:bg-[#0070c9] disabled:opacity-60 shadow-sm transition cursor-pointer flex items-center gap-2"
                >
                  {saving && <Loader2 size={14} className="animate-spin" />}
                  Save changes
                </button>
              </div>
            </div>
          </form>

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
      <span className="mt-1.5 flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus-within:border-[#087ed9] focus-within:ring-2 focus-within:ring-[#087ed9]/20 transition">
        <Icon size={16} className="text-slate-400 shrink-0" />
        {children}
      </span>
    </label>
  );
}
