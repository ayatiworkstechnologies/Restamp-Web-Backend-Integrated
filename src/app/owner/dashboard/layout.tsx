"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { ensureRole, signOut } from '@/lib/api/auth';
import { errorMessage } from '@/lib/api/client';
import { isPlaceholderName, loginHref, useSession } from '@/lib/api/session';
import { getInitials } from '@/lib/initials';
import { Building2, CreditCard, Crown, LayoutDashboard, LogOut, Menu, PlusCircle, UserRound, X, type LucideIcon } from 'lucide-react';

const nav: { label: string; href: string; icon: LucideIcon }[] = [
  { label: 'Dashboard', href: '/owner/dashboard', icon: LayoutDashboard },
  { label: 'My Properties', href: '/owner/dashboard/properties', icon: Building2 },
  { label: 'Add Property', href: '/owner/dashboard/add-property', icon: PlusCircle },
  { label: 'Plan & Payments', href: '/owner/dashboard/payments', icon: CreditCard },
  { label: 'Profile', href: '/owner/dashboard/profile', icon: UserRound },
];

export default function OwnerDashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { session, ready } = useSession();
  const [ownerReady, setOwnerReady] = useState(false);
  const [roleError, setRoleError] = useState('');
  const [open, setOpen] = useState(false);
  const userId = session?.userId;

  // Signed-in users enter owner mode: the backend's current role becomes
  // OWNER (it authorizes every /owner request itself). Access is by role,
  // not by a plan purchase — payments are not connected yet.
  useEffect(() => {
    if (!ready) return;
    if (!userId) {
      router.replace(loginHref(pathname || '/owner/dashboard', 'owner'));
      return;
    }
    ensureRole('OWNER')
      .then(() => setOwnerReady(true))
      .catch((e) => setRoleError(errorMessage(e, 'Could not open the owner dashboard.')));
  }, [ready, userId, router, pathname]);

  useEffect(() => setOpen(false), [pathname]);

  if (roleError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-50 text-sm text-slate-600" role="alert">
        <p>{roleError}</p>
        <button type="button" onClick={() => window.location.reload()} className="font-semibold text-[#087ed9] underline cursor-pointer">
          Try again
        </button>
      </div>
    );
  }

  if (!session || !ownerReady) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-400">Loading your dashboard...</div>;
  }

  const me = { name: isPlaceholderName(session.displayName) ? '' : session.displayName };

  const logout = () => {
    signOut();
    router.push(loginHref(undefined, 'owner'));
  };

  const sidebar = (
    <aside className="flex h-full w-64 flex-col border-r border-slate-100 bg-white">
      <Link href="/" className="flex items-center gap-2 px-6 py-5">
        <Image src="/restamplogo.svg" alt="Restamp Logo" width={32} height={32} className="h-8 w-8 object-contain" />
        <span className="text-lg font-bold tracking-tight text-slate-900">
          Re<span className="text-[#087ed9]">stamp</span>
        </span>
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
      <div className="m-3 rounded-xl bg-[#070e17] p-4 text-white">
        <div className="flex items-center gap-2 text-xs font-semibold text-sky-400">
          <Crown size={14} /> Owner plans
        </div>
        <p className="mt-1 text-[11px] text-slate-400">Plan purchases and payments are not available online yet.</p>
        <Link href="/owner/plans" className="mt-3 block rounded-lg bg-[#087ed9] py-1.5 text-center text-xs font-semibold hover:bg-sky-600 transition">
          View plans
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
            Welcome back, <span className="font-semibold text-slate-900">{me.name || 'Owner'}</span>
          </p>
          <Link href="/owner/dashboard/profile" className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-50 text-sm font-bold text-[#087ed9]">
            {getInitials(me.name) || <UserRound size={18} />}
          </Link>
        </header>
        <main className="px-4 py-6 sm:px-8 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
