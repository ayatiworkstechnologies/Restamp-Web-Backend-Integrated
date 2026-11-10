"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { isPlaceholderName } from '@/lib/api/session';
import { getBrokerPlan, getBrokerProfile, planActive, type BrokerPlan, type BrokerProfile } from '@/lib/api/broker';
import { errorMessage } from '@/lib/api/client';
import { agentCard } from '../ui';
import {
  Bell,
  Building2,
  ChevronRight,
  CreditCard,
  FileText,
  Headphones,
  HelpCircle,
  Loader2,
  MapPin,
  Search,
  Settings,
  ShieldCheck,
  Users,
  type LucideIcon,
} from 'lucide-react';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <p className="mb-2 px-1 text-xs font-bold uppercase tracking-wider text-slate-400">{title}</p>
      <div className={`${agentCard} divide-y divide-slate-100 overflow-hidden`}>{children}</div>
    </section>
  );
}

function Row({ icon: Icon, label, detail, href, right }: { icon: LucideIcon; label: string; detail?: string; href?: string; right?: React.ReactNode }) {
  const body = (
    <>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-sky-50 text-[#087ed9]">
        <Icon size={18} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-900">{label}</p>
        {detail && <p className="truncate text-xs text-slate-500">{detail}</p>}
      </div>
      {right}
      {href && <ChevronRight size={16} className="text-slate-300" />}
    </>
  );
  return href ? (
    <Link href={href} className="flex items-center gap-3 px-5 py-4 transition hover:bg-slate-50">
      {body}
    </Link>
  ) : (
    <div className="flex items-center gap-3 px-5 py-4">{body}</div>
  );
}

export default function AgentProfilePage() {
  // The signed-in agent (GET /broker/profile) and plan (GET /broker/plan).
  // The backend has no phone number, email, firm, RERA or KYC record for
  // agents, so none is shown or claimed as verified.
  const [me, setMe] = useState<BrokerProfile | null>(null);
  const [plan, setPlan] = useState<BrokerPlan | null>(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setError('');
    Promise.all([getBrokerProfile(), getBrokerPlan()])
      .then(([profile, p]) => {
        if (cancelled) return;
        setMe(profile);
        setPlan(p);
      })
      .catch((e) => !cancelled && setError(errorMessage(e, 'Could not load your agent profile.')));
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  if (error) {
    return (
      <div className={`${agentCard} py-12 text-center text-sm text-red-700`} role="alert">
        <p>{error}</p>
        <button type="button" onClick={() => setAttempt((a) => a + 1)} className="mt-3 font-semibold underline cursor-pointer">
          Try again
        </button>
      </div>
    );
  }
  if (!me || !plan) {
    return (
      <div className={`${agentCard} flex items-center justify-center gap-2 py-16 text-sm text-slate-500`}>
        <Loader2 size={16} className="animate-spin text-[#087ed9]" /> Loading your profile…
      </div>
    );
  }

  const name = isPlaceholderName(me.display_name) ? '' : me.display_name;
  const active = planActive(plan);
  const localities = plan.localities || [];
  const fmt = (iso: string) => {
    const d = new Date(/[zZ]|[+-]\d\d:\d\d$/.test(iso) ? iso : `${iso}Z`);
    return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`${agentCard} flex flex-wrap items-center gap-5 p-6`}>
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#087ed9] text-2xl font-bold text-white">
          {(name || 'A').charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xl font-bold text-slate-900">{name || 'Agent'}</p>
          <p className="text-sm text-slate-500">{plan.has_plan ? `${(plan.plan_name || '').replace(/ Plan$/, '')} Agent` : 'Agent'}</p>
          <p className="mt-1 text-xs text-slate-400">Agent ID #{me.user_id}</p>
        </div>
        <Link href="/buy" className="inline-flex h-[53px] items-center gap-2 rounded-[16px] bg-slate-100 px-5 text-sm font-semibold text-slate-900 hover:bg-slate-200">
          <Search size={16} /> Switch to Find Property
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Section title="My Plan">
            {plan.has_plan ? (
              <Row
                icon={CreditCard}
                label={plan.plan_name || 'Agent plan'}
                detail={`${plan.locality_limit ?? localities.length} Locations · ${plan.valid_until ? `Expiry Date: ${fmt(plan.valid_until)}` : 'No end date'}`}
                right={<span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${active ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>{active ? 'Active' : 'Expired'}</span>}
              />
            ) : (
              <Row icon={CreditCard} label="No active plan" detail="Online plan purchase is not available yet" />
            )}
            <Row icon={Settings} label="Plan & Payments" detail="Your plan details" href="/agent/dashboard/payments" />
          </Section>

          <Section title="My Locations">
            <div className="px-5 py-4">
              <p className="text-xs text-slate-500">Subscription coverage — you see owner properties in these areas:</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {localities.length === 0 && <span className="text-xs text-slate-500">No covered locations yet.</span>}
                {localities.map((l) => (
                  <span key={l} className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-[#087ed9]">
                    <MapPin size={12} /> {l}
                  </span>
                ))}
              </div>
            </div>
            <Row icon={MapPin} label="Covered Locations" detail={`${me.covered_location_count} pincode${me.covered_location_count === 1 ? '' : 's'} covered`} />
          </Section>

          <Section title="My Activity">
            <Row icon={Building2} label="Available Properties" detail="Owner listings in your localities" href="/agent/dashboard/properties" />
            <Row icon={Users} label="My Leads" detail="Not available yet" href="/agent/dashboard/leads" />
          </Section>
        </div>

        <div className="space-y-6">
          <Section title="KYC / Verification">
            <Row icon={ShieldCheck} label="RERA & Identity Verification" detail="Agent verification is not available online yet" />
          </Section>

          <Section title="Payments">
            <Row icon={FileText} label="Payment History" detail="Online payments are not available yet" />
          </Section>

          <Section title="Notifications">
            <Row icon={Bell} label="Lead Alerts & Visit Reminders" detail="Get notified about new enquiries and upcoming visits" />
          </Section>

          <Section title="Help & Support">
            <Row icon={Headphones} label="Agent Support Desk" detail="Contact Restamp support" href="/agent/dashboard/contact" />
            <Row icon={HelpCircle} label="FAQs & Tutorials" detail="Agent platform rules and guidelines" href="/help" />
          </Section>
        </div>
      </div>
    </div>
  );
}
