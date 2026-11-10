"use client";

import Link from 'next/link';
import { agentCard } from '../ui';
import { Building2, Users } from 'lucide-react';

// Agent leads (a client CRM with follow-ups, matching and commissions) have no
// backend yet: GET /broker/dashboard reports new_lead_count as unavailable.
// The page says so plainly instead of showing sample leads.
export default function AgentLeadsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Leads</h1>
        <p className="mt-1 text-sm text-slate-500">Manage your customer enquiries.</p>
      </div>

      <div className={`${agentCard} py-16 text-center`}>
        <Users className="mx-auto text-slate-300" size={32} />
        <p className="mt-3 font-semibold text-slate-900">Agent leads are not available yet</p>
        <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
          Restamp doesn&apos;t send buyer leads to agents yet. When it does, your customer enquiries will appear here. Meanwhile, browse the
          owner listings in your covered localities.
        </p>
        <Link
          href="/agent/dashboard/properties"
          className="mt-5 inline-flex h-[53px] items-center gap-2 rounded-[16px] bg-[#087ed9] px-6 text-sm font-semibold text-white hover:bg-sky-600"
        >
          <Building2 size={16} /> Browse Properties
        </Link>
      </div>
    </div>
  );
}
