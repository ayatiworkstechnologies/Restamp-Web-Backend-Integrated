"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getProfile, type Profile } from '@/lib/profile';
import { getAgentPayments, getAgentSubscription, type AgentPaymentRecord, type AgentSubscription } from '@/lib/agentPlan';
import { useAgentLeads } from '@/lib/agentLeads';
import { agentCard } from '../ui';
import {
  BadgeCheck,
  Bell,
  Building2,
  ChevronRight,
  CreditCard,
  FileText,
  Headphones,
  HelpCircle,
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
  const [me, setMe] = useState<Profile | null>(null);
  const [sub, setSub] = useState<AgentSubscription | null>(null);
  const [payments, setPayments] = useState<AgentPaymentRecord[]>([]);
  const { leads } = useAgentLeads();

  useEffect(() => {
    setMe(getProfile());
    setSub(getAgentSubscription());
    setPayments(getAgentPayments());
  }, []);

  if (!me || !sub) return null;
  const expired = !!sub.expiresAt && new Date(sub.expiresAt).getTime() < Date.now();
  const fmt = (iso: string) => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`${agentCard} flex flex-wrap items-center gap-5 p-6`}>
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#087ed9] text-2xl font-bold text-white">
          {(me.name || 'A').charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 text-xl font-bold text-slate-900">
            {me.name || 'Agent'}
            <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-semibold text-[#087ed9]">
              <BadgeCheck size={13} /> Verified
            </span>
          </p>
          <p className="text-sm text-slate-500">{sub.firmName ? `${sub.firmName} · ` : ''}{sub.planName.replace(/ Plan$/, '')} Agent</p>
          <p className="mt-1 text-xs text-slate-400">
            {me.mobile ? `+91 ${me.mobile}` : 'No phone on file'}
            {me.email && ` · ${me.email}`}
          </p>
        </div>
        <Link href="/buy" className="inline-flex h-[53px] items-center gap-2 rounded-[16px] bg-slate-100 px-5 text-sm font-semibold text-slate-900 hover:bg-slate-200">
          <Search size={16} /> Switch to Find Property
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Section title="My Plan">
            <Row
              icon={CreditCard}
              label={sub.planName}
              detail={`${sub.locationLimit} Locations · ${sub.expiresAt ? `Expiry Date: ${fmt(sub.expiresAt)}` : 'No expiry'}`}
              right={<span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${expired ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'}`}>{expired ? 'Expired' : 'Active'}</span>}
            />
            <Row icon={Settings} label="Plan & Payments" detail="Your active plan and payment history" href="/agent/dashboard/payments" />
          </Section>

          <Section title="My Locations">
            <div className="px-5 py-4">
              <p className="text-xs text-slate-500">Subscription coverage — you receive properties & buyer leads exclusively in these areas:</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(sub.selectedLocations || []).map((l) => (
                  <span key={l} className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-[#087ed9]">
                    <MapPin size={12} /> {l}
                  </span>
                ))}
              </div>
            </div>
            <Row icon={MapPin} label="Manage Locations" detail={`${sub.selectedLocations?.length || 0} of ${sub.locationLimit} used`} href="/agent/packages" />
          </Section>

          <Section title="My Activity">
            <Row icon={Building2} label="Available Properties" detail="Owner listings in your localities" href="/agent/dashboard/properties" />
            <Row icon={Users} label="My Leads" detail={`${leads.length} customer enquiries`} href="/agent/dashboard/leads" />
          </Section>
        </div>

        <div className="space-y-6">
          <Section title="KYC / Verification">
            <Row
              icon={ShieldCheck}
              label="RERA & Identity Verification"
              detail={`Agent RERA ID: ${sub.reraNumber || 'Not provided'}`}
              right={<span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">Verified & Active</span>}
            />
          </Section>

          <Section title="Payments">
            {payments.length === 0 ? (
              <Row icon={FileText} label="Payment History" detail="No transactions yet" />
            ) : (
              payments.slice(0, 4).map((p) => (
                <Row
                  key={p.id}
                  icon={FileText}
                  label={`₹${p.total.toLocaleString('en-IN')} · ${p.packageName}`}
                  detail={`${fmt(p.paidAt)} · ${p.transactionRef}`}
                  right={<span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${p.status === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{p.status}</span>}
                />
              ))
            )}
          </Section>

          <Section title="Notifications">
            <Row icon={Bell} label="Lead Alerts & Visit Reminders" detail="Get notified about new enquiries and upcoming visits" />
          </Section>

          <Section title="Help & Support">
            <Row icon={Headphones} label="Agent Support Desk" detail="Contact your Restamp Agent Relationship Manager" />
            <Row icon={HelpCircle} label="FAQs & Tutorials" detail="Agent platform rules, lead SLAs & commission guidelines" />
          </Section>
        </div>
      </div>
    </div>
  );
}
