"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import PropertyCard from '@/components/property/PropertyCard';
import { properties, type Property } from '@/data/properties';
import { getProfile, type Profile } from '@/lib/profile';
import { contactFor, useActivity, type Activity, type ActivityType } from '@/lib/activity';
import { Phone, MessageSquare, UserRound, Eye, Pencil, ChevronRight } from 'lucide-react';

type TabKey = 'calls' | 'messages' | 'agents' | 'viewed';

const tabs: {
  key: TabKey;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  emptyTitle: string;
  emptyText: string;
}[] = [
  {
    key: 'calls',
    label: 'Calls',
    icon: Phone,
    emptyTitle: 'No calls yet',
    emptyText: 'Properties where you tap "View Number" will appear here.',
  },
  {
    key: 'messages',
    label: 'Messages',
    icon: MessageSquare,
    emptyTitle: 'No messages yet',
    emptyText: 'Properties you contact will appear here so you can follow up.',
  },
  {
    key: 'agents',
    label: 'Agents',
    icon: UserRound,
    emptyTitle: 'No agents contacted',
    emptyText: 'Builders and agents you call or message will be listed here.',
  },
  {
    key: 'viewed',
    label: 'Viewed',
    icon: Eye,
    emptyTitle: 'Nothing viewed yet',
    emptyText: 'Properties you open will appear here so you can find them again.',
  },
];

const activityTypeByTab: Partial<Record<TabKey, ActivityType>> = {
  calls: 'call',
  messages: 'message',
  viewed: 'viewed',
};

const findProperty = (id: number) => properties.find((p) => p.id === id);

export default function ActivityPage() {
  const activity = useActivity();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('calls');

  useEffect(() => {
    setProfile(getProfile());
  }, []);

  const lists = useMemo(() => {
    const byType = (type: ActivityType) =>
      activity
        .filter((a) => a.type === type)
        .map((a) => findProperty(a.propertyId))
        .filter((p): p is Property => p !== undefined);

    const entries = (type: ActivityType) =>
      activity
        .filter((a) => a.type === type)
        .map((a) => ({ ...a, property: findProperty(a.propertyId) }))
        .filter((a): a is Activity & { property: Property } => a.property !== undefined);

    const contacted = [...byType('call'), ...byType('message')];
    const agents = new Map<string, { name: string; role: string; phone: string; properties: Property[] }>();
    contacted.forEach((p) => {
      const name = p.builderName || 'Skyline Properties';
      const agent = agents.get(name) ?? {
        name,
        role: p.postedBy || 'Builder',
        phone: p.phoneNumber || '+91 98402 11234',
        properties: [],
      };
      if (!agent.properties.some((x) => x.id === p.id)) agent.properties.push(p);
      agents.set(name, agent);
    });

    return {
      calls: entries('call'),
      messages: entries('message'),
      viewed: byType('viewed'),
      agents: [...agents.values()],
    };
  }, [activity]);

  const current = tabs.find((t) => t.key === activeTab)!;
  const displayName = profile?.name || (profile ? `+91 ${profile.mobile}` : 'Guest');
  const timeFor = (id: number) => {
    const type = activityTypeByTab[activeTab];
    const entry = type && activity.find((a) => a.type === type && a.propertyId === id);
    return entry ? new Date(entry.at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : null;
  };

  return (
    <>
      <Header />
      <main className="bg-slate-50 min-h-[70vh]">
        <div className="container-site py-10">
          {/* User strip */}
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-[0_12px_45px_-10px_rgba(0,0,0,0.1)]">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative shrink-0">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#087ed9] text-lg font-bold text-white">
                  {displayName.replace('+91 ', '').charAt(0).toUpperCase()}
                </div>
                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500" />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-slate-900 truncate">{displayName}</p>
                {profile ? (
                  <p className="text-xs text-slate-500">Buyer activity · synced to your account</p>
                ) : (
                  <Link href="/login?role=buyer" className="text-xs text-slate-500 hover:text-[#087ed9]">
                    Log in to sync your activity
                  </Link>
                )}
              </div>
            </div>
            <Link
              href={profile ? '/profile' : '/login?role=buyer'}
              aria-label={profile ? 'Edit profile' : 'Login'}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700 hover:bg-sky-50 hover:text-[#087ed9] transition"
            >
              <Pencil size={15} />
            </Link>
          </div>

          {/* Tabs */}
          <div className="mt-6 overflow-x-auto border-b border-slate-200">
            <div className="flex min-w-max gap-6">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={`relative flex items-center gap-2 px-1 pb-3 text-sm font-medium transition cursor-pointer ${
                      isActive ? 'text-[#087ed9] font-semibold' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tab.label}
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                        isActive ? 'bg-sky-50 text-[#087ed9]' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {lists[tab.key].length}
                    </span>
                    {isActive && <span className="absolute bottom-0 left-0 right-0 h-[3px] rounded-full bg-[#087ed9]" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab content */}
          <div className="mt-6">
            {lists[activeTab].length === 0 ? (
              <div className="rounded-2xl border border-slate-100 bg-white px-6 py-14 text-center shadow-[0_12px_45px_-10px_rgba(0,0,0,0.1)]">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-400">
                  <current.icon size={24} />
                </div>
                <h2 className="mt-4 font-bold text-slate-900">{current.emptyTitle}</h2>
                <p className="mx-auto mt-1.5 max-w-md text-sm text-slate-500">{current.emptyText}</p>
                <Link
                  href="/buy"
                  className="mt-5 inline-flex items-center gap-1 rounded-full bg-[#087ed9] px-5 h-[53px] text-sm font-semibold text-white hover:bg-sky-600 transition"
                >
                  Explore Properties <ChevronRight size={16} />
                </Link>
              </div>
            ) : activeTab === 'agents' ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {lists.agents.map((agent) => (
                  <div
                    key={agent.name}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-sky-300 hover:shadow-lg transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-sky-50 font-bold text-[#087ed9]">
                        {agent.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold uppercase tracking-tight text-slate-900 truncate">{agent.name}</p>
                        <p className="text-xs text-slate-400">{agent.role}</p>
                      </div>
                    </div>
                    <p className="mt-4 text-xs text-slate-500">
                      {agent.properties.length} {agent.properties.length === 1 ? 'property' : 'properties'} contacted
                    </p>
                    <ul className="mt-2 space-y-1">
                      {agent.properties.map((p) => (
                        <li key={p.id}>
                          <Link href={`/properties/${p.id}`} className="text-sm text-slate-700 hover:text-[#087ed9]">
                            {p.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                    <a
                      href={`tel:${agent.phone.replace(/\s/g, '')}`}
                      className="mt-4 flex items-center justify-center gap-1.5 rounded-md border border-[#087ed9] py-2 text-xs font-semibold text-[#087ed9] hover:bg-sky-50 transition"
                    >
                      <Phone size={14} /> {agent.phone}
                    </a>
                  </div>
                ))}
              </div>
            ) : activeTab === 'calls' || activeTab === 'messages' ? (
              <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                {lists[activeTab].map((entry) => (
                  <ContactEntry key={entry.at + entry.propertyId} entry={entry} isCall={activeTab === 'calls'} />
                ))}
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {(lists[activeTab] as Property[]).map((property) => {
                  const time = timeFor(property.id);
                  return (
                    <div key={property.id} className="flex flex-col gap-2">
                      {time && <p className="text-xs text-slate-400">{current.label} · {time}</p>}
                      <PropertyCard property={property} showExplore />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

const formatTime = (iso: string) =>
  new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

function ContactEntry({ entry, isCall }: { entry: Activity & { property: Property }; isCall: boolean }) {
  const { property } = entry;
  // Entries logged before details were stored fall back to the property's contact
  const d = entry.details ?? contactFor(property);
  const tel = `tel:${d.contactPhone.replace(/\s/g, '')}`;

  return (
    <article className="flex items-center gap-4 px-4 py-3.5 hover:bg-slate-50 transition">
      <Link href={`/properties/${property.id}`} className="shrink-0">
        <img src={property.image} alt={property.name} className="h-14 w-14 rounded-lg object-cover bg-slate-100" />
      </Link>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <Link
            href={`/properties/${property.id}`}
            className="truncate text-sm font-semibold text-slate-900 hover:text-[#087ed9] transition"
          >
            {property.name}
          </Link>
          <span className="shrink-0 text-xs text-slate-400">{formatTime(entry.at)}</span>
        </div>
        <p className="mt-0.5 truncate text-xs text-slate-500">
          {d.contactName} · {d.contactPhone}
        </p>
        {!isCall && <p className="mt-1 truncate text-xs text-slate-600">{d.message || 'Enquiry about this property.'}</p>}
      </div>

      <a
        href={tel}
        aria-label={`Call ${d.contactName}`}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 text-[#087ed9] hover:border-[#087ed9] hover:bg-sky-50 transition"
      >
        <Phone size={15} />
      </a>
    </article>
  );
}
