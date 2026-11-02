"use client";

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import PropertyCard from '@/components/property/PropertyCard';
import {
  BuyerEnquiry,
  CallEvent,
  getEnquiry,
  listCallEvents,
  listEnquiries,
  listViewed,
  listVisits,
  updateVisitStatus,
  ViewedProperty,
  Visit,
} from '@/lib/api/buyer';
import { errorMessage } from '@/lib/api/client';
import { cardToProperty, cleanImageUrl, typeLabel } from '@/lib/api/mappers';
import { isPlaceholderName, loginHref, useSession } from '@/lib/api/session';
import { Phone, MessageSquare, CalendarClock, Eye, Pencil, ChevronRight, ImageOff, Loader2 } from 'lucide-react';

type TabKey = 'calls' | 'messages' | 'visits' | 'viewed';

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
    emptyText: 'Owners you call from a property page will appear here.',
  },
  {
    key: 'messages',
    label: 'Messages',
    icon: MessageSquare,
    emptyTitle: 'No messages yet',
    emptyText: 'Enquiries you send, and the owners’ replies, will appear here.',
  },
  {
    key: 'visits',
    label: 'Visits',
    icon: CalendarClock,
    emptyTitle: 'No visits requested',
    emptyText: 'Site visits you request from a property page will appear here.',
  },
  {
    key: 'viewed',
    label: 'Viewed',
    icon: Eye,
    emptyTitle: 'Nothing viewed yet',
    emptyText: 'Properties you open will appear here so you can find them again.',
  },
];

type Lists = { calls: CallEvent[]; messages: BuyerEnquiry[]; visits: Visit[]; viewed: ViewedProperty[] };

const formatTime = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : '';

const ENQUIRY_STATUS: Record<string, string> = { NEW: 'Sent', CONTACTED: 'Owner responded', CLOSED: 'Closed' };
const VISIT_STATUS: Record<string, string> = {
  REQUESTED: 'Awaiting owner',
  PROPOSED: 'Owner proposed this time',
  CONFIRMED: 'Confirmed',
  DECLINED: 'Declined',
  CANCELLED: 'Cancelled',
  COMPLETED: 'Completed',
};

export default function ActivityPage() {
  const { session, ready } = useSession();
  const [activeTab, setActiveTab] = useState<TabKey>('calls');
  const [lists, setLists] = useState<Lists>({ calls: [], messages: [], visits: [], viewed: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const userId = session?.userId;

  // Opening Activity is buyer mode: the list calls make BUYER the current role.
  useEffect(() => {
    if (!ready) return;
    if (!userId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError('');
    (async () => {
      try {
        // Sequential first call: it may switch the role to BUYER once.
        const calls = await listCallEvents(1, 50);
        const [messages, visits, viewed] = await Promise.all([listEnquiries(1, 50), listVisits(1, 50), listViewed(1, 50)]);
        if (!cancelled) setLists({ calls: calls.items, messages: messages.items, visits: visits.items, viewed: viewed.items });
      } catch (e) {
        if (!cancelled) setError(errorMessage(e, 'Could not load your activity.'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ready, userId, attempt]);

  const onVisitChanged = useCallback((v: Visit) => {
    setLists((prev) => ({ ...prev, visits: prev.visits.map((x) => (x.id === v.id ? v : x)) }));
  }, []);

  const current = tabs.find((t) => t.key === activeTab)!;
  const displayName = session ? (isPlaceholderName(session.displayName) ? 'Restamp user' : session.displayName) : 'Guest';

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
                  {displayName.charAt(0).toUpperCase()}
                </div>
                {session && <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500" />}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-slate-900 truncate">{displayName}</p>
                {session ? (
                  <p className="text-xs text-slate-500">Buyer activity · saved to your account</p>
                ) : (
                  <Link href={loginHref('/activity')} className="text-xs text-slate-500 hover:text-[#087ed9]">
                    Log in to see your activity
                  </Link>
                )}
              </div>
            </div>
            <Link
              href={session ? '/profile' : loginHref('/activity')}
              aria-label={session ? 'Edit profile' : 'Login'}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700 hover:bg-sky-50 hover:text-[#087ed9] transition"
            >
              <Pencil size={15} />
            </Link>
          </div>

          {ready && !session ? (
            <div className="mt-6 rounded-2xl border border-slate-100 bg-white px-6 py-14 text-center shadow-[0_12px_45px_-10px_rgba(0,0,0,0.1)]">
              <h2 className="font-bold text-slate-900">Your calls, messages, visits and viewed homes</h2>
              <p className="mx-auto mt-1.5 max-w-md text-sm text-slate-500">
                Log in with your mobile number to see the activity saved to your Restamp account.
              </p>
              <Link
                href={loginHref('/activity')}
                className="mt-5 inline-flex items-center gap-1 rounded-full bg-[#087ed9] px-5 py-2 text-sm font-semibold text-white hover:bg-sky-600 transition"
              >
                Log in <ChevronRight size={16} />
              </Link>
            </div>
          ) : (
            <>
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
                          {loading ? '…' : lists[tab.key].length}
                        </span>
                        {isActive && <span className="absolute bottom-0 left-0 right-0 h-[3px] rounded-full bg-[#087ed9]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tab content */}
              <div className="mt-6">
                {loading ? (
                  <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
                    <Loader2 size={18} className="animate-spin text-[#087ed9]" />
                    Loading your activity…
                  </div>
                ) : error ? (
                  <div className="rounded-2xl border border-red-100 bg-red-50 px-6 py-10 text-center text-sm text-red-700" role="alert">
                    <p>{error}</p>
                    <button type="button" onClick={() => setAttempt((a) => a + 1)} className="mt-3 font-semibold underline cursor-pointer">
                      Try again
                    </button>
                  </div>
                ) : lists[activeTab].length === 0 ? (
                  <div className="rounded-2xl border border-slate-100 bg-white px-6 py-14 text-center shadow-[0_12px_45px_-10px_rgba(0,0,0,0.1)]">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-400">
                      <current.icon size={24} />
                    </div>
                    <h2 className="mt-4 font-bold text-slate-900">{current.emptyTitle}</h2>
                    <p className="mx-auto mt-1.5 max-w-md text-sm text-slate-500">{current.emptyText}</p>
                    <Link
                      href="/buy"
                      className="mt-5 inline-flex items-center gap-1 rounded-full bg-[#087ed9] px-5 py-2 text-sm font-semibold text-white hover:bg-sky-600 transition"
                    >
                      Explore Properties <ChevronRight size={16} />
                    </Link>
                  </div>
                ) : activeTab === 'calls' ? (
                  <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                    {lists.calls.map((c) => (
                      <EntryRow
                        key={c.id}
                        listingId={c.property_listing_id}
                        title={c.listing?.title || 'Listing no longer available'}
                        image={cleanImageUrl(c.listing?.cover_image_url)}
                        time={formatTime(c.created_at)}
                        subtitle={c.listing ? `${c.listing.price_display} · ${c.listing.location_label}` : 'This property was removed or is no longer listed.'}
                      />
                    ))}
                  </div>
                ) : activeTab === 'messages' ? (
                  <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                    {lists.messages.map((e) => (
                      <EnquiryRow key={e.id} enquiry={e} />
                    ))}
                  </div>
                ) : activeTab === 'visits' ? (
                  <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                    {lists.visits.map((v) => (
                      <VisitRow key={v.id} visit={v} onChanged={onVisitChanged} />
                    ))}
                  </div>
                ) : (
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {lists.viewed.map((v) => (
                      <div key={v.id} className="flex flex-col gap-2">
                        <p className="text-xs text-slate-400">Viewed · {formatTime(v.viewed_at)}</p>
                        <PropertyCard property={cardToProperty(v.listing)} showExplore />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

function Thumb({ listingId, image, title }: { listingId: number; image: string; title: string }) {
  return (
    <Link href={`/properties/${listingId}`} className="shrink-0">
      {image ? (
        <img src={image} alt={title} className="h-14 w-14 rounded-lg object-cover bg-slate-100" />
      ) : (
        <span className="h-14 w-14 rounded-lg bg-slate-100 text-slate-300 flex items-center justify-center">
          <ImageOff size={18} />
        </span>
      )}
    </Link>
  );
}

function EntryRow({ listingId, title, image, time, subtitle }: { listingId: number; title: string; image: string; time: string; subtitle: string }) {
  return (
    <article className="flex items-center gap-4 px-4 py-3.5 hover:bg-slate-50 transition">
      <Thumb listingId={listingId} image={image} title={title} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <Link href={`/properties/${listingId}`} className="truncate text-sm font-semibold text-slate-900 hover:text-[#087ed9] transition">
            {title}
          </Link>
          <span className="shrink-0 text-xs text-slate-400">{time}</span>
        </div>
        <p className="mt-0.5 truncate text-xs text-slate-500">{subtitle}</p>
      </div>
    </article>
  );
}

function EnquiryRow({ enquiry }: { enquiry: BuyerEnquiry }) {
  const [open, setOpen] = useState(false);
  const [thread, setThread] = useState<BuyerEnquiry | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (!next || thread) return;
    setLoading(true);
    setError('');
    try {
      setThread(await getEnquiry(enquiry.id));
    } catch (e) {
      setError(errorMessage(e, 'Could not load this conversation.'));
    } finally {
      setLoading(false);
    }
  };

  const l = enquiry.listing;
  return (
    <article className="px-4 py-3.5 hover:bg-slate-50 transition">
      <div className="flex items-center gap-4">
        <Thumb listingId={enquiry.property_listing_id} image={cleanImageUrl(l.cover_image_url)} title={l.title} />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-3">
            <Link
              href={`/properties/${enquiry.property_listing_id}`}
              className="truncate text-sm font-semibold text-slate-900 hover:text-[#087ed9] transition"
            >
              {l.title}
            </Link>
            <span className="shrink-0 text-xs text-slate-400">{formatTime(enquiry.last_message_at || enquiry.created_at)}</span>
          </div>
          <p className="mt-0.5 truncate text-xs text-slate-500">
            {[l.price_display, typeLabel(l.property_type), l.locality].filter(Boolean).join(' · ')}
          </p>
          <p className="mt-1 truncate text-xs text-slate-600">{enquiry.last_message || enquiry.message || 'Enquiry about this property.'}</p>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-[#087ed9]">
            {ENQUIRY_STATUS[enquiry.status] || enquiry.status}
          </span>
          <button type="button" onClick={() => void toggle()} className="text-xs font-semibold text-[#087ed9] hover:underline cursor-pointer">
            {open ? 'Hide' : `View (${enquiry.message_count ?? 1})`}
          </button>
        </div>
      </div>

      {open && (
        <div className="mt-3 ml-[72px] space-y-2">
          {loading && <p className="text-xs text-slate-400">Loading conversation…</p>}
          {error && <p className="text-xs text-red-600" role="alert">{error}</p>}
          {thread?.messages?.map((m, i) => (
            <div
              key={m.id ?? i}
              className={`max-w-xl rounded-xl px-3 py-2 text-xs ${m.sender === 'OWNER' ? 'bg-emerald-50 text-emerald-900' : 'bg-slate-100 text-slate-800'}`}
            >
              <p className="whitespace-pre-line">{m.body}</p>
              <p className="mt-1 text-[10px] text-slate-400">
                {m.sender === 'OWNER' ? 'Owner' : 'You'} · {formatTime(m.created_at)}
              </p>
            </div>
          ))}
          {thread?.status === 'CLOSED' && <p className="text-[11px] text-slate-400">The owner closed this enquiry.</p>}
        </div>
      )}
    </article>
  );
}

function VisitRow({ visit, onChanged }: { visit: Visit; onChanged: (v: Visit) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const canCancel = visit.status === 'REQUESTED' || visit.status === 'PROPOSED' || visit.status === 'CONFIRMED';
  const isProposed = visit.status === 'PROPOSED';

  const update = async (status: 'CANCELLED' | 'CONFIRMED' | 'DECLINED') => {
    setBusy(true);
    setError('');
    try {
      onChanged(await updateVisitStatus(visit.id, status));
    } catch (e) {
      setError(errorMessage(e, 'Could not update this visit.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className="flex items-center gap-4 px-4 py-3.5 hover:bg-slate-50 transition">
      <span className="h-14 w-14 shrink-0 rounded-lg bg-sky-50 text-[#087ed9] flex items-center justify-center">
        <CalendarClock size={22} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <Link
            href={`/properties/${visit.property_listing_id}`}
            className="truncate text-sm font-semibold text-slate-900 hover:text-[#087ed9] transition"
          >
            {visit.listing.title}
          </Link>
          <span className="shrink-0 text-xs font-semibold text-slate-700">{formatTime(visit.scheduled_at)}</span>
        </div>
        <p className="mt-0.5 truncate text-xs text-slate-500">
          {[visit.owner_display_name && `Owner: ${visit.owner_display_name}`, visit.listing.locality].filter(Boolean).join(' · ')}
        </p>
        {visit.note && <p className="mt-1 truncate text-xs text-slate-600">{visit.note}</p>}
        {error && <p className="mt-1 text-xs text-red-600" role="alert">{error}</p>}
      </div>
      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-[#087ed9]">
          {VISIT_STATUS[visit.status] || visit.status}
        </span>
        {isProposed && (
          <div className="flex gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => void update('CONFIRMED')}
              className="text-xs font-semibold text-emerald-600 hover:underline disabled:opacity-60 cursor-pointer"
            >
              Accept
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void update('DECLINED')}
              className="text-xs font-semibold text-slate-500 hover:underline disabled:opacity-60 cursor-pointer"
            >
              Decline
            </button>
          </div>
        )}
        {canCancel && (
          <button
            type="button"
            disabled={busy}
            onClick={() => void update('CANCELLED')}
            className="text-xs font-semibold text-red-500 hover:underline disabled:opacity-60 cursor-pointer"
          >
            {busy ? 'Updating…' : 'Cancel'}
          </button>
        )}
      </div>
    </article>
  );
}
