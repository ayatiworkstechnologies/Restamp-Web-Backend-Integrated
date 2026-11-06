"use client";

import { X } from 'lucide-react';
import { matchProperty, type AgentLead } from '@/lib/agentLeads';
import type { AgentPropertyItem } from '@/lib/agent-data';

type Props =
  | { mode: 'lead-to-property'; lead: AgentLead; properties: AgentPropertyItem[]; onClose: () => void; onDone: (msg: string) => void }
  | { mode: 'property-to-lead'; property: AgentPropertyItem; leads: AgentLead[]; onClose: () => void; onDone: (msg: string) => void };

export default function MatchModal(props: Props) {
  const title = props.mode === 'lead-to-property' ? 'Match Property' : 'Match Property with Lead';
  const subtitle =
    props.mode === 'lead-to-property'
      ? `Client: ${props.lead.customerName} • Seeking: ${props.lead.requirement}`
      : `${props.property.title} • ${props.property.locality}`;

  const rows =
    props.mode === 'lead-to-property'
      ? props.properties.map((p) => ({
          key: p.id,
          main: p.title,
          sub: `${p.bhk} • ${p.locality} • ${p.price}`,
          pick: () => {
            matchProperty(props.lead.id, p.id, p.title);
            props.onDone(`"${p.title}" has been matched to ${props.lead.customerName}. You can now schedule a site visit or contact the customer.`);
          },
        }))
      : props.leads
          .filter((l) => l.status !== 'Closed')
          .map((l) => ({
            key: l.id,
            main: l.customerName,
            sub: `${l.requirement} • Budget: ${l.budget}`,
            pick: () => {
              matchProperty(l.id, props.property.id, props.property.title);
              props.onDone(`Successfully matched "${props.property.title}" with ${l.customerName}. You can now schedule a site visit or send property details.`);
            },
          }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={props.onClose}>
      <div className="flex max-h-[80vh] w-full max-w-lg flex-col rounded-[20px] bg-white" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-6">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-slate-900">{title}</h2>
            <p className="truncate text-sm text-slate-500">{subtitle}</p>
          </div>
          <button type="button" aria-label="Close" onClick={props.onClose} className="cursor-pointer rounded-lg p-1 text-slate-400 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>
        <p className="px-6 pt-4 text-xs font-bold uppercase tracking-wider text-slate-400">
          {props.mode === 'lead-to-property' ? 'Select an owner-posted property' : 'Select an active customer lead'}
        </p>
        <ul className="flex-1 space-y-2 overflow-y-auto p-6 pt-3">
          {rows.length === 0 ? (
            <li className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
              {props.mode === 'lead-to-property'
                ? 'No properties available in your covered locations.'
                : "No leads to match yet. When buyers enquire in your localities they'll appear in Leads."}
            </li>
          ) : (
            rows.map((r) => (
              <li key={r.key} className="flex items-center gap-3 rounded-[14px] border border-slate-100 p-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900">{r.main}</p>
                  <p className="truncate text-xs text-slate-500">{r.sub}</p>
                </div>
                <button type="button" onClick={r.pick} className="h-10 shrink-0 cursor-pointer rounded-[12px] bg-[#087ed9] px-4 text-xs font-semibold text-white hover:bg-sky-600">
                  {props.mode === 'lead-to-property' ? 'Select' : 'Assign'}
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
