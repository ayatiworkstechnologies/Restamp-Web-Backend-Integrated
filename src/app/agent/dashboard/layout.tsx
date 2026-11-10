"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { ensureRole, signOut } from '@/lib/api/auth';
import { errorMessage } from '@/lib/api/client';
import { loginHref, useSession } from '@/lib/api/session';
import { getBrokerPlan, planActive, type BrokerPlan } from '@/lib/api/broker';
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
  const [plan, setPlan] = useState<BrokerPlan | null>(null);
  const [open, setOpen] = useState(false);
  const userId = session?.userId;

  // Signed-in users enter agent mode: the backend's current role becomes
  // BROKER (the backend authorizes every agent request itself), like the
  // owner dashboard does with OWNER. Sign-in is the real Restamp account
  // (OTP on /login) and the plan comes from GET /broker/plan. Agents without
  // a plan still open the dashboard: the backend shows them no properties
  // until a plan covers an area.
  useEffect(() => {
    if (!ready) return;
    if (!userId) {
      router.replace(loginHref(pathname || '/agent/dashboard', 'agent'));
      return;
    }
    let cancelled = false;
    ensureRole('BROKER')
      .then(() => getBrokerPlan())
      .then((p) => {
        if (cancelled) return;
        setPlan(p);
        setAgentReady(true);
      })
      .catch((e) => {
        if (!cancelled) setRoleError(errorMessage(e, 'Could not open the agent dashboard.'));
      });
    return () => {
      cancelled = true;
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

  const active = planActive(plan);
  const fmtDate = (iso: string) => {
    const d = new Date(/[zZ]|[+-]\d\d:\d\d$/.test(iso) ? iso : `${iso}Z`);
    return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

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

      {/* Subscription Card (GET /broker/plan) */}
      {plan?.has_plan && (
        <div className="bg-gradient-to-br from-sky-50 to-white border border-sky-100 text-slate-900 m-3 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-sky-600">
              <Crown size={14} /> {plan.plan_name}
            </div>
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${active ? 'bg-emerald-500/20 text-emerald-600' : 'bg-red-500/15 text-red-600'}`}>
              {active ? 'Active' : 'Expired'}
            </span>
          </div>

          <p className="mt-2 text-xs font-bold text-slate-700">
            {(plan.localities || []).length}
            {plan.locality_limit != null ? ` / ${plan.locality_limit}` : ''} Localities Covered
          </p>

          <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span>Valid till:</span>
            <span className="text-slate-600 font-medium">{plan.valid_until ? fmtDate(plan.valid_until) : 'No end date'}</span>
          </p>

          <div className="mt-3.5 pt-3 border-t border-slate-200 flex items-center gap-2">
            <Link
              href="/agent/packages"
              className="flex-1 rounded-xl bg-[#087ed9] hover:bg-sky-500 py-1.5 text-center text-[11px] font-bold text-white transition shadow-xs"
            >
              View Plans
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

          {/* Plan status (no RERA / KYC record exists on the backend yet) */}
          <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-600">
            <span className={`flex h-2 w-2 rounded-full ${active ? 'bg-emerald-500' : 'bg-slate-300'}`} />
            <span>{plan?.has_plan ? `${plan.plan_name}${active ? '' : ' (expired)'}` : 'No active agent plan'}</span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/agent/packages"
              className="inline-flex items-center gap-1.5 rounded-xl bg-sky-50 text-[#087ed9] border border-sky-200 px-3.5 py-1.5 text-xs font-bold hover:bg-[#087ed9] hover:text-white transition shadow-2xs"
            >
              <Crown size={13} /> {plan?.has_plan ? 'Change Package' : 'View Plans'}
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
