// Customer leads & commission records for the agent dashboard (mirrors the Restamp agent app).
// Stored in localStorage and seeded with sample data on first use.
import { useEffect, useState } from 'react';

export type AgentLeadStatus = 'New' | 'Contacted' | 'Visit Scheduled' | 'Negotiating' | 'Closed';
export const AGENT_LEAD_STATUSES: AgentLeadStatus[] = ['New', 'Contacted', 'Visit Scheduled', 'Negotiating', 'Closed'];

export type AgentLead = {
  id: string;
  customerName: string;
  phone: string;
  requirement: string;
  purpose: 'Buy' | 'Rent' | 'Lease';
  preferredLocality: string;
  budget: string;
  status: AgentLeadStatus;
  createdAt: string;
  matchedPropertyId?: string;
  matchedPropertyTitle?: string;
  visitAt?: string;
};

export type Commission = {
  id: string;
  dealTitle: string;
  customerName: string;
  amount: number;
  status: 'Paid' | 'Pending';
  date: string;
};

const LEADS_KEY = 'restamp_agent_leads';
const COMMISSION_KEY = 'restamp_agent_commissions';
const EVENT = 'agent-leads-change';

const hoursAgo = (h: number) => new Date(Date.now() - h * 36e5).toISOString();
const daysFromNow = (d: number, hour = 11) => {
  const t = new Date(Date.now() + d * 864e5);
  t.setHours(hour, 0, 0, 0);
  return t.toISOString();
};

const seedLeads = (): AgentLead[] => [
  { id: 'AL301', customerName: 'Karthik Srinivasan', phone: '+91 98410 55621', requirement: 'Looking for 3 BHK apartment', purpose: 'Buy', preferredLocality: 'OMR IT Corridor', budget: '₹1 Cr – ₹1.5 Cr', status: 'New', createdAt: hoursAgo(1) },
  { id: 'AL302', customerName: 'Divya Prakash', phone: '+91 99401 22870', requirement: 'Looking for 2 BHK', purpose: 'Rent', preferredLocality: 'Sholinganallur', budget: '₹25K – ₹35K /mo', status: 'New', createdAt: hoursAgo(5) },
  { id: 'AL303', customerName: 'Manoj Ramesh', phone: '+91 90801 33417', requirement: 'Independent villa with garden', purpose: 'Buy', preferredLocality: 'ECR', budget: '₹2.5 Cr – ₹3 Cr', status: 'Contacted', createdAt: hoursAgo(26) },
  { id: 'AL304', customerName: 'Lakshmi Narayan', phone: '+91 97910 64528', requirement: 'Office space, 2,000 sq.ft', purpose: 'Lease', preferredLocality: 'Guindy', budget: '₹1.5L – ₹2L /mo', status: 'Visit Scheduled', createdAt: hoursAgo(50), visitAt: daysFromNow(1, 16) },
  { id: 'AL305', customerName: 'Fathima Begum', phone: '+91 98840 71902', requirement: 'Looking for 3 BHK', purpose: 'Buy', preferredLocality: 'Velachery', budget: '₹1.1 Cr – ₹1.3 Cr', status: 'Negotiating', createdAt: hoursAgo(96) },
  { id: 'AL306', customerName: 'Suresh Babu', phone: '', requirement: '2 BHK resale flat', purpose: 'Buy', preferredLocality: 'Porur', budget: '₹70L – ₹85L', status: 'Closed', createdAt: hoursAgo(240) },
];

const seedCommissions = (): Commission[] => [
  { id: 'C901', dealTitle: '2 BHK resale flat, Porur', customerName: 'Suresh Babu', amount: 82000, status: 'Paid', date: hoursAgo(200) },
  { id: 'C902', dealTitle: '3 BHK apartment, Adyar', customerName: 'Nithya Krishnan', amount: 125000, status: 'Paid', date: hoursAgo(600) },
  { id: 'C903', dealTitle: 'Office lease, Guindy', customerName: 'Lakshmi Narayan', amount: 36000, status: 'Pending', date: hoursAgo(30) },
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
    window.dispatchEvent(new Event(EVENT));
  } catch {
    /* storage unavailable */
  }
}

export const getAgentLeads = () => read<AgentLead[]>(LEADS_KEY, seedLeads);
export const getCommissions = () => read<Commission[]>(COMMISSION_KEY, seedCommissions);

export function updateAgentLead(id: string, patch: Partial<AgentLead>) {
  write(LEADS_KEY, getAgentLeads().map((l) => (l.id === id ? { ...l, ...patch } : l)));
}

export function matchProperty(leadId: string, propertyId: string, propertyTitle: string) {
  const lead = getAgentLeads().find((l) => l.id === leadId);
  updateAgentLead(leadId, {
    matchedPropertyId: propertyId,
    matchedPropertyTitle: propertyTitle,
    status: lead && (lead.status === 'New' || lead.status === 'Contacted') ? 'Contacted' : lead?.status,
  });
}

export const isFollowUp = (l: AgentLead) => l.status === 'Contacted' || l.status === 'Negotiating';

export const shortMoney = (n: number) => (n >= 1e5 ? `₹${(n / 1e5).toFixed(1)}L` : `₹${(n / 1e3).toFixed(0)}k`);

export const timeAgo = (iso: string) => {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 6e4);
  if (m < 60) return `${Math.max(1, m)}m ago`;
  if (m < 1440) return `${Math.floor(m / 60)}h ago`;
  return `${Math.floor(m / 1440)}d ago`;
};

export function useAgentLeads() {
  const [state, setState] = useState<{ leads: AgentLead[]; commissions: Commission[] }>({ leads: [], commissions: [] });
  useEffect(() => {
    const sync = () => setState({ leads: getAgentLeads(), commissions: getCommissions() });
    sync();
    window.addEventListener(EVENT, sync);
    return () => window.removeEventListener(EVENT, sync);
  }, []);
  return state;
}
