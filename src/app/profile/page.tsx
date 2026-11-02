"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { type OwnerSubscription, type Payment } from '@/lib/ownerPlan';
import { ensureRole, refreshMe, signOut, updateDisplayName } from '@/lib/api/auth';
import { errorMessage } from '@/lib/api/client';
import { isPlaceholderName, loginHref, useSession, type BackendRole } from '@/lib/api/session';
import { Smartphone, Mail, MapPin, User, LogOut, Heart, Home, Building2, Check, Activity, Crown, Receipt, Loader2 } from 'lucide-react';

type RoleValue = 'buyer' | 'owner' | 'agent';

const roleOptions: { value: RoleValue; label: string; backend: BackendRole | null }[] = [
  { value: 'buyer', label: 'Buyer', backend: 'BUYER' },
  { value: 'owner', label: 'Owner', backend: 'OWNER' },
  // Agent accounts are not available on the website yet (agent area not connected).
  { value: 'agent', label: 'Agent', backend: null },
];

const quickLinks = [
  { label: 'My activity', href: '/activity', icon: Activity },
  { label: 'Saved homes', href: '/saved', icon: Heart },
  { label: 'Post property', href: '/sell', icon: Home },
  { label: 'New projects', href: '/projects', icon: Building2 },
];

const roleFromBackend = (role: BackendRole | null): RoleValue => (role === 'OWNER' ? 'owner' : role === 'BROKER' ? 'agent' : 'buyer');

export default function ProfilePage() {
  const router = useRouter();
  const { session, ready } = useSession();
  const [name, setName] = useState('');
  const [role, setRole] = useState<RoleValue>('buyer');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  // Plans and payments are not connected to the backend: nothing is shown as purchased.
  const subscription: OwnerSubscription | null = null;
  const payments: Payment[] = [];
  const userId = session?.userId;

  useEffect(() => {
    if (!ready) return;
    if (!userId) {
      router.replace(loginHref('/profile'));
      return;
    }
    // Fresh name and role from the backend.
    refreshMe()
      .then((me) => {
        setName(isPlaceholderName(me.displayName) ? '' : me.displayName);
        setRole(roleFromBackend(me.role));
      })
      .catch((e) => setError(errorMessage(e, 'Could not load your profile.')));
  }, [ready, userId, router]);

  if (!session) return null;

  const save = async (e: React.FormEvent) => {
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
      const backendRole = roleOptions.find((r) => r.value === role)?.backend;
      if (backendRole) await ensureRole(backendRole);
      setSaved(true);
    } catch (err) {
      setError(errorMessage(err, 'Could not save your changes. Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  const logout = () => {
    signOut();
    router.push('/');
  };

  const displayName = isPlaceholderName(session.displayName) ? '' : session.displayName;
  const initial = (displayName || 'U').charAt(0).toUpperCase();
  const roleLabel = roleOptions.find((r) => r.value === roleFromBackend(session.role))?.label;

  return (
    <>
      <Header />
      <main className="bg-slate-50 min-h-[70vh]">
        <div className="container-site py-12">
          <p className="eyebrow">My account</p>
          <h1 className="section-title mt-3">Profile</h1>

          <div className="mt-8 grid gap-6 lg:grid-cols-[320px_1fr]">
            {/* Summary card */}
            <aside className="flex flex-col gap-6">
              <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_12px_45px_-10px_rgba(0,0,0,0.1)] text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-sky-50 text-3xl font-bold text-[#087ed9]">
                  {initial}
                </div>
                <h2 className="mt-4 text-lg font-bold text-slate-900">{displayName || 'Add your name'}</h2>
                <p className="mt-1 text-sm text-slate-500">Signed in with your mobile number</p>
                <span className="mt-3 inline-block rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-[#087ed9]">
                  {roleLabel}
                </span>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-white p-2 shadow-[0_12px_45px_-10px_rgba(0,0,0,0.1)]">
                {quickLinks.map(({ label, href, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-[#087ed9] transition"
                  >
                    <Icon size={18} className="text-slate-400" />
                    {label}
                  </Link>
                ))}
                <button
                  type="button"
                  onClick={logout}
                  className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 transition cursor-pointer"
                >
                  <LogOut size={18} />
                  Logout
                </button>
              </div>
            </aside>

            {/* Edit form */}
            <div className="space-y-6">
            <form
              onSubmit={save}
              className="rounded-2xl border border-slate-100 bg-white p-6 md:p-8 shadow-[0_12px_45px_-10px_rgba(0,0,0,0.1)]"
            >
              <h2 className="text-lg font-bold text-slate-900">Personal details</h2>
              <p className="mt-1 text-sm text-slate-500">Owners see your name when you contact them.</p>

              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <Field label="Full name" icon={User}>
                  <input
                    value={name}
                    maxLength={100}
                    onChange={(e) => {
                      setName(e.target.value);
                      setSaved(false);
                    }}
                    placeholder="Your name"
                    className="w-full bg-transparent outline-none placeholder:text-slate-400"
                  />
                </Field>
                <Field label="Mobile number" icon={Smartphone}>
                  <input value="Verified at sign-in" disabled className="w-full bg-transparent text-slate-500 outline-none" />
                </Field>
                <Field label="Email" icon={Mail}>
                  <input
                    type="email"
                    disabled
                    placeholder="Not available yet"
                    className="w-full bg-transparent outline-none placeholder:text-slate-400 disabled:cursor-not-allowed"
                  />
                </Field>
                <Field label="City" icon={MapPin}>
                  <input
                    value="Chennai"
                    disabled
                    className="w-full bg-transparent text-slate-500 outline-none disabled:cursor-not-allowed"
                  />
                </Field>
              </div>

              <p className="mt-6 text-sm font-medium text-slate-700">I am a</p>
              <div className="mt-2 flex flex-wrap gap-3">
                {roleOptions.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    disabled={!r.backend}
                    title={r.backend ? undefined : 'Agent accounts are not available on the website yet'}
                    onClick={() => {
                      setRole(r.value);
                      setSaved(false);
                    }}
                    className={`rounded-lg border px-5 py-2 text-sm font-medium transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                      role === r.value
                        ? 'border-[#087ed9] bg-sky-50 text-[#087ed9]'
                        : 'border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>

              <div className="mt-8 flex items-center gap-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-[#087ed9] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#0670c2] disabled:opacity-60 transition cursor-pointer flex items-center gap-2"
                >
                  {saving && <Loader2 size={16} className="animate-spin" />}
                  Save changes
                </button>
                {error && <span className="text-sm text-red-600" role="alert">{error}</span>}
                {saved && (
                  <span className="flex items-center gap-1 text-sm text-green-600">
                    <Check size={16} /> Saved
                  </span>
                )}
              </div>
            </form>

            {session.role === 'OWNER' && (
              <OwnerPlanCard subscription={subscription} payments={payments} />
            )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
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
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <span className="mt-1.5 flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus-within:border-[#087ed9] focus-within:ring-2 focus-within:ring-[#087ed9]/20">
        <Icon size={16} className="text-slate-400" />
        {children}
      </span>
    </label>
  );
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

function OwnerPlanCard({ subscription, payments }: { subscription: OwnerSubscription | null; payments: Payment[] }) {
  const expired = subscription?.expiresAt ? new Date(subscription.expiresAt) < new Date() : false;

  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-6 md:p-8 shadow-[0_12px_45px_-10px_rgba(0,0,0,0.1)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Owner Plan</h2>
          <p className="mt-1 text-sm text-slate-500">Choose a plan to list your properties with zero brokerage.</p>
        </div>
        <Link
          href="/owner/plans"
          className="rounded-lg bg-[#087ed9] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0670c2] transition"
        >
          {!subscription ? 'Choose a plan' : expired ? 'Renew Plan' : 'Upgrade Plan'}
        </Link>
      </div>

      {subscription ? (
        <div className="mt-6 flex flex-wrap items-center gap-4 rounded-xl bg-sky-50 p-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-[#087ed9]">
            <Crown size={20} />
          </div>
          <div className="flex-1">
            <p className="font-bold text-slate-900">{subscription.planName}</p>
            <p className="text-sm text-slate-500">
              Up to {subscription.listingLimit} listings ·{' '}
              {subscription.expiresAt
                ? `${expired ? 'Expired on' : 'Valid till'} ${formatDate(subscription.expiresAt)}`
                : 'Until deal closed'}
            </p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              expired ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'
            }`}
          >
            {expired ? 'Expired' : 'Active'}
          </span>
        </div>
      ) : (
        <p className="mt-6 rounded-xl border border-dashed border-slate-200 p-4 text-center text-sm text-slate-500">
          No plan yet. Pick Basic (free), Gold Assist or Titanium VIP to start listing.
        </p>
      )}

      <h3 className="mt-8 flex items-center gap-2 font-semibold text-slate-900">
        <Receipt size={16} className="text-slate-400" /> Payment History
      </h3>
      {payments.length === 0 ? (
        <p className="mt-2 text-sm text-slate-500">No payments yet.</p>
      ) : (
        <div className="mt-3 divide-y divide-slate-100 rounded-xl border border-slate-100">
          {payments.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
              <div className="min-w-0">
                <p className="font-medium text-slate-900">{p.planName}</p>
                <p className="text-xs text-slate-500">
                  {formatDate(p.paidAt)} · {p.method}
                  {p.promoCode && ` · ${p.promoCode}`}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-slate-900">₹{p.total.toLocaleString('en-IN')}</p>
                <p className="font-mono text-[11px] text-slate-400">{p.id}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
