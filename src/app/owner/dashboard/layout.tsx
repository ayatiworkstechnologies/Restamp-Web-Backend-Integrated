"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { clearProfile, getProfile, type Profile } from '@/lib/profile';
import { getSubscription, type OwnerSubscription } from '@/lib/ownerPlan';
import { Building2, CalendarCheck, CreditCard, MessageSquareText, Crown, Headset, LayoutDashboard, LogOut, Menu, PlusCircle, UserRound, X, type LucideIcon } from 'lucide-react';

const nav: { label: string; href: string; icon: LucideIcon }[] = [
  { label: 'Dashboard', href: '/owner/dashboard', icon: LayoutDashboard },
  { label: 'My Properties', href: '/owner/dashboard/properties', icon: Building2 },
  { label: 'Add Property', href: '/owner/dashboard/add-property', icon: PlusCircle },
  { label: 'Leads', href: '/owner/dashboard/leads', icon: MessageSquareText },
  { label: 'Site Visits', href: '/owner/dashboard/visits', icon: CalendarCheck },
  { label: 'Plan & Payments', href: '/owner/dashboard/payments', icon: CreditCard },
  { label: 'Profile', href: '/owner/dashboard/profile', icon: UserRound },
  { label: 'Contact Us', href: '/owner/dashboard/contact', icon: Headset },
];

export default function OwnerDashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [me, setMe] = useState<Profile | null>(null);
  const [sub, setSub] = useState<OwnerSubscription | null>(null);
  const [open, setOpen] = useState(false);

  // Only logged-in owners with an active plan get in
  useEffect(() => {
    const profile = getProfile();
    if (!profile) return router.replace('/login?role=owner');
    const subscription = getSubscription();
    if (!subscription) return router.replace('/owner/plans');
    setMe(profile);
    setSub(subscription);
    const refresh = () => setMe(getProfile());
    window.addEventListener('profile-change', refresh);
    return () => window.removeEventListener('profile-change', refresh);
  }, [router]);

  useEffect(() => setOpen(false), [pathname]);

  if (!me || !sub) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-400">Loading your dashboard...</div>;
  }

  const logout = () => {
    clearProfile();
    router.push('/login?role=owner');
  };

  const sidebar = (
    <aside className="flex h-full w-64 flex-col border-r border-slate-100 bg-white">
      <Link href="/" className="flex items-center gap-2 px-6 py-5">
        <Image src="/restamp-logo.svg" alt="Restamp" width={149} height={40} className="h-10 w-auto" />
      </Link>
      <p className="px-6 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Owner Studio</p>
      <nav className="flex-1 space-y-1 px-3">
        {nav.map(({ label, href, icon: Icon }) => {
          const active = href === '/owner/dashboard' ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                active ? 'bg-sky-50 text-[#087ed9]' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="bg-gradient-to-br from-sky-50 to-white border border-sky-100 text-slate-900 m-3 rounded-xl p-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-sky-600">
          <Crown size={14} /> {sub.planName}
        </div>
        <p className="mt-1 text-[11px] text-slate-500">
          {sub.expiresAt
            ? `Valid till ${new Date(sub.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`
            : 'Valid until deal closed'}
        </p>
        <Link href="/owner/plans" className="mt-3 block rounded-lg bg-[#087ed9] py-1.5 text-center text-xs font-semibold hover:bg-sky-600 transition">
          Upgrade plan
        </Link>
      </div>
      <button
        type="button"
        onClick={logout}
        className="mx-3 mb-4 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-500 hover:bg-red-50 hover:text-red-600 transition cursor-pointer"
      >
        <LogOut size={18} /> Logout
      </button>
    </aside>
  );

  return (
    <div className="flex min-h-screen bg-slate-50">
      <div className="sticky top-0 hidden h-screen lg:block">{sidebar}</div>
      {open && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          {sidebar}
          <button type="button" aria-label="Close menu" onClick={() => setOpen(false)} className="flex-1 bg-black/40" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-100 bg-white/90 px-4 py-3 backdrop-blur sm:px-8">
          <button type="button" aria-label="Open menu" onClick={() => setOpen(true)} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden cursor-pointer">
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
          <p className="text-sm text-slate-500">
            Welcome back, <span className="font-semibold text-slate-900">{me.name || `+91 ${me.mobile}`}</span>
          </p>
          <Link href="/owner/dashboard/profile" className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-50 text-sm font-bold text-[#087ed9]">
            {(me.name || 'O').charAt(0).toUpperCase()}
          </Link>
        </header>
        <main className="px-4 py-6 sm:px-8 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
