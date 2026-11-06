"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { ensureRole, signOut } from '@/lib/api/auth';
import { errorMessage } from '@/lib/api/client';
import { loginHref, useSession } from '@/lib/api/session';
import { getAgentSubscription, type AgentSubscription } from '@/lib/agentPlan';
import {
  LayoutDashboard,
  Building2,
  Users,
  CreditCard,
  UserRound,
  LogOut,
  Menu,
  X,
  Crown,
  ShieldCheck,
  TrendingUp,
  MapPin,
  Sparkles,
  Headset,
  type LucideIcon,
} from 'lucide-react';

const agentNav: { label: string; href: string; icon: LucideIcon }[] = [
  { label: 'Dashboard', href: '/agent/dashboard', icon: LayoutDashboard },
  { label: 'Properties', href: '/agent/dashboard/properties', icon: Building2 },
  { label: 'Leads', href: '/agent/dashboard/leads', icon: Users },
  { label: 'Plan & Payments', href: '/agent/dashboard/payments', icon: CreditCard },
  { label: 'Profile', href: '/agent/dashboard/profile', icon: UserRound },
  { label: 'Contact Us', href: '/agent/dashboard/contact', icon: Headset },
];

export default function AgentDashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { session, ready } = useSession();
  const [agentReady, setAgentReady] = useState(false);
  const [roleError, setRoleError] = useState('');
  const [sub, setSub] = useState<AgentSubscription | null>(null);
  const [open, setOpen] = useState(false);
  const userId = session?.userId;

  // Signed-in users enter agent mode: the backend's current role becomes
  // BROKER (the backend authorizes every agent request itself), like the
  // owner dashboard does with OWNER. Sign-in is the real Restamp account
  // (OTP on /login); agent plans are still kept in this browser until the
  // plan pages are connected to the backend.
  useEffect(() => {
    if (!ready) return;
    if (!userId) {
      router.replace(loginHref(pathname || '/agent/dashboard', 'agent'));
      return;
    }
    let cancelled = false;
    ensureRole('BROKER')
      .then(() => {
        if (cancelled) return;
        // Protect route: require an agent plan with at least one location.
        const activeSub = getAgentSubscription();
        if (!activeSub || !activeSub.selectedLocations || activeSub.selectedLocations.length === 0) {
          router.replace('/agent/packages');
          return;
        }
        setSub(activeSub);
        setAgentReady(true);
      })
      .catch((e) => {
        if (!cancelled) setRoleError(errorMessage(e, 'Could not open the agent dashboard.'));
      });
    const refresh = () => setSub(getAgentSubscription());
    window.addEventListener('agent-subscription-change', refresh);
    return () => {
      cancelled = true;
      window.removeEventListener('agent-subscription-change', refresh);
    };
  }, [ready, userId, router, pathname]);

  useEffect(() => setOpen(false), [pathname]);

  const logout = () => {
    signOut();
    router.push(loginHref(undefined, 'agent'));
  };

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

  if (!session || !agentReady) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-400">Loading your dashboard...</div>;
  }

  // Calculate days remaining
  const daysRemaining = sub?.expiresAt
    ? Math.max(0, Math.ceil((new Date(sub.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  const sidebar = (
    <aside className="flex h-full w-64 flex-col overflow-y-auto border-r border-slate-100 bg-white">
      {/* Brand Header */}
      <Link href="/" className="flex items-center gap-2 px-6 py-5">
        <Image src="/restamp-logo.svg" alt="Restamp" width={149} height={40} className="h-10 w-auto" />
      </Link>
      <div className="px-6 pb-3 flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-sky-50 text-[10px] font-bold uppercase tracking-wider text-[#087ed9]">
          <ShieldCheck size={13} /> Agent Console
        </span>
        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" title="Syndicate Online" />
      </div>

      {/* Nav List */}
      <nav className="flex-1 space-y-1 px-3">
        {agentNav.map(({ label, href, icon: Icon }) => {
          const active = href === '/agent/dashboard' ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
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

      {/* Subscription Card */}
      {sub && (
        <div className="bg-gradient-to-br from-sky-50 to-white border border-sky-100 text-slate-900 m-3 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-sky-600">
              <Crown size={14} /> {sub.badge || sub.planName}
            </div>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-600">
              Active Paid
            </span>
          </div>

          <p className="mt-2 text-xs font-bold text-slate-700">
            {sub.selectedLocations?.length || 0} / {sub.locationLimit} Micro-Markets Covered
          </p>

          <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span>Valid till:</span>
            <span className="text-slate-600 font-medium">
              {sub.expiresAt
                ? new Date(sub.expiresAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                : 'Active Lifetime'}
            </span>
          </p>

          {daysRemaining !== null && (
            <p className="text-[10px] text-sky-600 font-bold mt-0.5">
              {daysRemaining} days remaining in cycle
            </p>
          )}

          <div className="mt-3.5 pt-3 border-t border-slate-200 flex items-center gap-2">
            <Link
              href="/agent/packages"
              className="flex-1 rounded-xl bg-[#087ed9] hover:bg-sky-500 py-1.5 text-center text-[11px] font-bold text-white transition shadow-xs"
            >
              Upgrade Locations
            </Link>
          </div>
        </div>
      )}

      {/* Logout / Switch */}
      <button
        type="button"
        onClick={logout}
        className="mx-3 mb-4 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-500 hover:bg-red-50 hover:text-red-600 transition cursor-pointer"
      >
        <LogOut size={18} /> Exit Console
      </button>
    </aside>
  );

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Desktop sidebar */}
      <div className="sticky top-0 hidden h-screen lg:block lg:w-64 lg:shrink-0">{sidebar}</div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setOpen(false)} />
          <div className="relative z-10 w-64">{sidebar}</div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/95 backdrop-blur-md px-4 sm:px-8">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open navigation menu"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 lg:hidden"
          >
            <Menu size={20} />
          </button>

          {/* Quick RERA verification indicator */}
          <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-600">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
            <span>RERA Registered Agent:</span>
            <span className="font-mono text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md text-[11px] font-bold">
              {sub?.reraNumber || 'TN/AGENT/0491/2023'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/agent/packages"
              className="inline-flex items-center gap-1.5 rounded-xl bg-sky-50 text-[#087ed9] border border-sky-200 px-3.5 py-1.5 text-xs font-bold hover:bg-[#087ed9] hover:text-white transition shadow-2xs"
            >
              <Crown size={13} /> {sub?.badge || 'Change Package'}
            </Link>

            <Link
              href="/agent"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
            >
              Public Agent Hub
            </Link>
          </div>
        </header>

        <main className="w-full flex-1 px-4 py-6 sm:px-8 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
