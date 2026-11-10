import { useCallback, useEffect, useState } from 'react';
import { withRole } from '@/lib/api/auth';
import { apiGet, apiPatch, apiPost, errorMessage, type Page } from '@/lib/api/client';
import { parseApiDate } from '@/lib/datetime';
import { isPlaceholderName } from '@/lib/api/session';

// Buyer leads & site visits for the owner dashboard, from the RESTAMP backend
// (GET/PATCH /owner/leads, GET/POST/PATCH /owner/visits). The backend only
// returns the caller's own leads and visits and never includes a buyer's
// phone number, so none is shown. Lead statuses are the backend's three
// (NEW / CONTACTED / CLOSED + a closing reason); nothing is seeded or stored
// in the browser.

export type LeadStatus = 'NEW' | 'CONTACTED' | 'CLOSED';
export const LEAD_STATUSES: LeadStatus[] = ['NEW', 'CONTACTED', 'CLOSED'];
export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = { NEW: 'New', CONTACTED: 'Contacted', CLOSED: 'Closed' };
export const CLOSING_REASONS = ['Sold', 'Rented', 'Leased', 'Not Converted'] as const;
export type ClosingReason = (typeof CLOSING_REASONS)[number];

export type OwnerLead = {
  id: number;
  propertyListingId: number;
  buyerUserId: number;
  customerName: string;
  propertyTitle: string;
  locality: string;
  message: string;
  messageCount: number;
  status: LeadStatus;
  closingReason: string | null;
  listingRemoved: boolean;
  createdAt: string | null;
};

export type VisitStatus = 'REQUESTED' | 'PROPOSED' | 'CONFIRMED' | 'COMPLETED' | 'DECLINED' | 'CANCELLED';

export type OwnerVisit = {
  id: number;
  propertyListingId: number;
  buyerUserId: number;
  customerName: string;
  propertyTitle: string;
  scheduledAt: string;
  status: VisitStatus;
  initiator: string;
  note?: string;
};

type LeadRow = {
  id: number;
  property_listing_id: number;
  buyer_user_id: number;
  buyer_display_name?: string | null;
  listing_removed?: boolean;
  message?: string | null;
  message_count?: number;
  status: string;
  closing_reason?: string | null;
  created_at?: string | null;
  last_message?: string | null;
  listing?: { title?: string; locality?: string | null; city?: string | null } | null;
};

type VisitRow = {
  id: number;
  property_listing_id: number;
  buyer_user_id: number;
  buyer_display_name?: string | null;
  scheduled_at: string;
  status: string;
  initiator: string;
  note?: string | null;
  listing?: { title?: string } | null;
};

const asLeadStatus = (s: string): LeadStatus => (s === 'CONTACTED' || s === 'CLOSED' ? s : 'NEW');

/** A buyer's chosen name, or the honest "Buyer #<id>" fallback (never a phone number, even if one slips through). */
const buyerLabel = (name: string | null | undefined, id: number) =>
  name && name.trim() && !isPlaceholderName(name) ? name.trim() : `Buyer #${id}`;

function toLead(r: LeadRow): OwnerLead {
  return {
    id: r.id,
    propertyListingId: r.property_listing_id,
    buyerUserId: r.buyer_user_id,
    customerName: buyerLabel(r.buyer_display_name, r.buyer_user_id),
    propertyTitle: r.listing?.title || (r.listing_removed ? 'Removed listing' : 'Property'),
    locality: [r.listing?.locality, r.listing?.city].filter(Boolean).join(', '),
    message: r.last_message || r.message || '',
    messageCount: r.message_count ?? 0,
    status: asLeadStatus(r.status),
    closingReason: r.closing_reason ?? null,
    listingRemoved: !!r.listing_removed,
    createdAt: r.created_at ?? null,
  };
}

function toVisit(r: VisitRow): OwnerVisit {
  const at = parseApiDate(r.scheduled_at);
  return {
    id: r.id,
    propertyListingId: r.property_listing_id,
    buyerUserId: r.buyer_user_id,
    customerName: buyerLabel(r.buyer_display_name, r.buyer_user_id),
    propertyTitle: r.listing?.title || 'Property',
    scheduledAt: at ? at.toISOString() : r.scheduled_at,
    status: r.status as VisitStatus,
    initiator: r.initiator,
    note: r.note || undefined,
  };
}

export async function listOwnerLeads(page = 1, pageSize = 100): Promise<OwnerLead[]> {
  const res = await withRole('OWNER', () => apiGet<Page<LeadRow>>('/owner/leads', { page, page_size: pageSize }));
  return res.items.map(toLead);
}

export async function listOwnerVisits(page = 1, pageSize = 100): Promise<OwnerVisit[]> {
  const res = await withRole('OWNER', () => apiGet<Page<VisitRow>>('/owner/visits', { page, page_size: pageSize }));
  return res.items.map(toVisit);
}

/** Persist a lead status (CLOSED needs the reason the backend accepts). */
export async function updateLeadStatus(id: number, status: LeadStatus, closingReason?: ClosingReason): Promise<OwnerLead> {
  const body = status === 'CLOSED' ? { status, closing_reason: closingReason ?? null } : { status };
  return toLead(await withRole('OWNER', () => apiPatch<LeadRow>(`/owner/leads/${id}`, body)));
}

/**
 * Propose a visit time to the lead's buyer. An open visit on the same
 * property is rescheduled instead (the backend decides which moves are
 * allowed and answers 422 otherwise).
 */
export async function proposeVisit(lead: OwnerLead, scheduledAt: string, note: string | undefined, existing?: OwnerVisit) {
  if (existing) {
    return toVisit(
      await withRole('OWNER', () => apiPatch<VisitRow>(`/owner/visits/${existing.id}`, { scheduled_at: scheduledAt, note: note ?? null })),
    );
  }
  return toVisit(
    await withRole('OWNER', () =>
      apiPost<VisitRow>('/owner/visits', {
        property_listing_id: lead.propertyListingId,
        buyer_user_id: lead.buyerUserId,
        scheduled_at: scheduledAt,
        note: note ?? null,
      }),
    ),
  );
}

export async function updateVisitStatus(id: number, status: Exclude<VisitStatus, 'REQUESTED' | 'PROPOSED'>): Promise<OwnerVisit> {
  return toVisit(await withRole('OWNER', () => apiPatch<VisitRow>(`/owner/visits/${id}`, { status })));
}

const OPEN_VISIT = ['REQUESTED', 'PROPOSED', 'CONFIRMED'];

/** The open visit for this lead's buyer on the same property, if any. */
export const activeVisitFor = (lead: OwnerLead, visits: OwnerVisit[]) =>
  visits.find((v) => v.propertyListingId === lead.propertyListingId && v.buyerUserId === lead.buyerUserId && OPEN_VISIT.includes(v.status));

export const visitBucket = (v: OwnerVisit): 'Awaiting' | 'Upcoming' | 'Completed' =>
  v.status === 'REQUESTED' || v.status === 'PROPOSED' ? 'Awaiting' : v.status === 'CONFIRMED' ? 'Upcoming' : 'Completed';

export const timeAgo = (iso: string | null) => {
  const at = parseApiDate(iso);
  if (!at) return '';
  const m = Math.floor((Date.now() - at.getTime()) / 6e4);
  if (m < 60) return `${Math.max(1, m)}m ago`;
  if (m < 1440) return `${Math.floor(m / 60)}h ago`;
  return `${Math.floor(m / 1440)}d ago`;
};

export const formatVisit = (iso: string) =>
  new Date(iso).toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

/** Leads + visits for the signed-in owner, with honest loading / error states. */
export function useOwnerLeads() {
  const [leads, setLeads] = useState<OwnerLead[]>([]);
  const [visits, setVisits] = useState<OwnerVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    Promise.all([listOwnerLeads(), listOwnerVisits()])
      .then(([l, v]) => {
        if (cancelled) return;
        setLeads(l);
        setVisits(v);
      })
      .catch((e) => {
        if (!cancelled) setError(errorMessage(e, 'Could not load your leads and visits.'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const reload = useCallback(() => setAttempt((a) => a + 1), []);
  const replaceLead = useCallback((l: OwnerLead) => setLeads((prev) => prev.map((x) => (x.id === l.id ? l : x))), []);
  const upsertVisit = useCallback(
    (v: OwnerVisit) => setVisits((prev) => (prev.some((x) => x.id === v.id) ? prev.map((x) => (x.id === v.id ? v : x)) : [v, ...prev])),
    [],
  );
  return { leads, visits, loading, error, reload, replaceLead, upsertVisit };
}
