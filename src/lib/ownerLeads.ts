import { useEffect, useState } from 'react';

// Buyer leads & site visits for the owner dashboard (mirrors the Restamp owner app).
// Stored in localStorage and seeded with sample data on first use.

export type LeadStatus = 'New' | 'Contacted' | 'Visit' | 'Negotiating' | 'Closed';
export const LEAD_STATUSES: LeadStatus[] = ['New', 'Contacted', 'Visit', 'Negotiating', 'Closed'];

export type OwnerLead = {
  id: string;
  customerName: string;
  phone: string;
  email?: string;
  propertyTitle: string;
  locality: string;
  message: string;
  messageCount: number;
  status: LeadStatus;
  createdAt: string;
};

export type VisitStatus = 'REQUESTED' | 'PROPOSED' | 'CONFIRMED' | 'COMPLETED' | 'DECLINED' | 'CANCELLED';

export type OwnerVisit = {
  id: string;
  leadId: string;
  customerName: string;
  phone: string;
  propertyTitle: string;
  scheduledAt: string;
  status: VisitStatus;
  note?: string;
};

const LEADS_KEY = 'restamp_owner_leads';
const VISITS_KEY = 'restamp_owner_visits';
export const LEADS_EVENT = 'owner-leads-change';

const hoursAgo = (h: number) => new Date(Date.now() - h * 36e5).toISOString();
const inDays = (d: number, hour = 11) => {
  const t = new Date(Date.now() + d * 864e5);
  t.setHours(hour, 0, 0, 0);
  return t.toISOString();
};

const seedLeads = (): OwnerLead[] => [
  { id: 'L1001', customerName: 'Priya Raman', phone: '+91 98401 22334', email: 'priya.r@gmail.com', propertyTitle: '3 BHK Apartment', locality: 'Velachery, Chennai', message: 'Is the price negotiable? I would like to visit this weekend.', messageCount: 2, status: 'New', createdAt: hoursAgo(2) },
  { id: 'L1002', customerName: 'Arjun Kumar', phone: '+91 99620 45871', propertyTitle: '3 BHK Apartment', locality: 'Velachery, Chennai', message: 'Please share the floor plan and maintenance details.', messageCount: 1, status: 'Contacted', createdAt: hoursAgo(20) },
  { id: 'L1003', customerName: 'Meena Subramanian', phone: '+91 90030 77812', propertyTitle: '2 BHK Flat for Rent', locality: 'Adyar, Chennai', message: 'Looking to move in by next month. Is it pet friendly?', messageCount: 3, status: 'Visit', createdAt: hoursAgo(46) },
  { id: 'L1004', customerName: 'Rahul Venkat', phone: '+91 97890 11290', propertyTitle: '3 BHK Apartment', locality: 'Velachery, Chennai', message: 'Can we close at ₹1.05 Cr?', messageCount: 4, status: 'Negotiating', createdAt: hoursAgo(70) },
  { id: 'L1005', customerName: 'Sneha Iyer', phone: '', propertyTitle: '2 BHK Flat for Rent', locality: 'Adyar, Chennai', message: '', messageCount: 0, status: 'Closed', createdAt: hoursAgo(160) },
];

const seedVisits = (): OwnerVisit[] => [
  { id: 'V2001', leadId: 'L1001', customerName: 'Priya Raman', phone: '+91 98401 22334', propertyTitle: '3 BHK Apartment', scheduledAt: inDays(2, 11), status: 'REQUESTED' },
  { id: 'V2002', leadId: 'L1003', customerName: 'Meena Subramanian', phone: '+91 90030 77812', propertyTitle: '2 BHK Flat for Rent', scheduledAt: inDays(1, 17), status: 'CONFIRMED' },
  { id: 'V2003', leadId: 'L1004', customerName: 'Rahul Venkat', phone: '+91 97890 11290', propertyTitle: '3 BHK Apartment', scheduledAt: inDays(-3, 10), status: 'COMPLETED' },
];

function read<T>(key: string, seed: () => T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
    const value = seed();
    localStorage.setItem(key, JSON.stringify(value));
    return value;
  } catch {
    return seed();
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new Event(LEADS_EVENT));
  } catch {
    /* storage unavailable */
  }
}

export const getLeads = () => read<OwnerLead[]>(LEADS_KEY, seedLeads);
export const getVisits = () => read<OwnerVisit[]>(VISITS_KEY, seedVisits);

export function updateLeadStatus(id: string, status: LeadStatus) {
  write(LEADS_KEY, getLeads().map((l) => (l.id === id ? { ...l, status } : l)));
}

export function proposeVisit(lead: OwnerLead, scheduledAt: string, note?: string) {
  const visits = getVisits();
  const existing = visits.find((v) => v.leadId === lead.id && !['COMPLETED', 'DECLINED', 'CANCELLED'].includes(v.status));
  const next: OwnerVisit[] = existing
    ? visits.map((v) => (v.id === existing.id ? { ...v, scheduledAt, note, status: 'PROPOSED' } : v))
    : [{ id: `V${Date.now()}`, leadId: lead.id, customerName: lead.customerName, phone: lead.phone, propertyTitle: lead.propertyTitle, scheduledAt, note, status: 'PROPOSED' }, ...visits];
  write(VISITS_KEY, next);
  if (lead.status === 'New' || lead.status === 'Contacted') updateLeadStatus(lead.id, 'Visit');
}

export function updateVisitStatus(id: string, status: VisitStatus) {
  write(VISITS_KEY, getVisits().map((v) => (v.id === id ? { ...v, status } : v)));
}

export const activeVisitFor = (leadId: string, visits: OwnerVisit[]) =>
  visits.find((v) => v.leadId === leadId && !['COMPLETED', 'DECLINED', 'CANCELLED'].includes(v.status));

export const visitBucket = (v: OwnerVisit): 'Awaiting' | 'Upcoming' | 'Completed' =>
  v.status === 'REQUESTED' || v.status === 'PROPOSED' ? 'Awaiting' : v.status === 'CONFIRMED' ? 'Upcoming' : 'Completed';

export const timeAgo = (iso: string) => {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 6e4);
  if (m < 60) return `${Math.max(1, m)}m ago`;
  if (m < 1440) return `${Math.floor(m / 60)}h ago`;
  return `${Math.floor(m / 1440)}d ago`;
};

export const formatVisit = (iso: string) =>
  new Date(iso).toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

export function useOwnerLeads() {
  const [state, setState] = useState<{ leads: OwnerLead[]; visits: OwnerVisit[] }>({ leads: [], visits: [] });
  useEffect(() => {
    const sync = () => setState({ leads: getLeads(), visits: getVisits() });
    sync();
    window.addEventListener(LEADS_EVENT, sync);
    return () => window.removeEventListener(LEADS_EVENT, sync);
  }, []);
  return state;
}
