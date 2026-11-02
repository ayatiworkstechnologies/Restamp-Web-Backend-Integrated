'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Phone, CheckCircle, ShieldCheck, CalendarClock, Loader2 } from 'lucide-react';
import type { Property } from '@/data/properties';
import { requestVisit, sendEnquiry } from '@/lib/api/buyer';
import { errorMessage, isApiError } from '@/lib/api/client';
import { loginHref, useSession } from '@/lib/api/session';
import { formatIndianPhone, useOwnerContact } from '@/lib/useOwnerContact';

interface DealerEnquirySectionProps {
  property: Property;
}

const MAX_CHARS = 400;

/** Local "YYYY-MM-DDTHH:mm" for a datetime-local input, `hours` from now. */
function localInputValue(hoursFromNow: number): string {
  const d = new Date(Date.now() + hoursFromNow * 3600_000);
  d.setMinutes(0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Owner details + real enquiry (POST /buyer/enquiries) + real site-visit
 * request (POST /buyer/visits). The owner's name comes from the listing; the
 * phone number is revealed only through the audited contact endpoint.
 * Every listing a buyer can open is backend-verified, hence the badge.
 */
export default function DealerEnquirySection({ property }: DealerEnquirySectionProps) {
  const pathname = usePathname();
  const { session, ready } = useSession();
  const contact = useOwnerContact(property.id);

  const ownerName = property.builderName || 'Property owner';
  const ownerAddress = property.address || [property.locality, property.city].filter(Boolean).join(', ');

  const [message, setMessage] = useState('I am interested in this Property.');
  const [agreedTerms, setAgreedTerms] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [visitAt, setVisitAt] = useState(() => localInputValue(24));
  const [visitNote, setVisitNote] = useState('');
  const [visitSending, setVisitSending] = useState(false);
  const [visitDone, setVisitDone] = useState<string | null>(null);
  const [visitError, setVisitError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      setErrorMsg('Please write a message for the owner');
      return;
    }
    if (!agreedTerms) {
      setErrorMsg('Please accept the Terms & Conditions');
      return;
    }
    setErrorMsg('');
    setIsSubmitting(true);
    try {
      await sendEnquiry(property.id, message.slice(0, MAX_CHARS));
      setSubmitted(true);
    } catch (err) {
      setErrorMsg(
        isApiError(err, 'missing')
          ? 'This property is no longer available for enquiries.'
          : errorMessage(err, 'Your enquiry could not be sent. Please try again.')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    const when = new Date(visitAt);
    if (Number.isNaN(when.getTime()) || when.getTime() <= Date.now()) {
      setVisitError('Choose a date and time in the future');
      return;
    }
    setVisitError('');
    setVisitSending(true);
    try {
      const visit = await requestVisit(property.id, when, visitNote);
      setVisitDone(new Date(visit.scheduled_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }));
    } catch (err) {
      setVisitError(errorMessage(err, 'Your visit request could not be sent. Please try again.'));
    } finally {
      setVisitSending(false);
    }
  };

  const loginPrompt = (what: string) => (
    <div className="rounded-xl bg-sky-50 border border-sky-100 p-4 text-xs sm:text-sm text-slate-700">
      <p>Log in with your mobile number to {what}.</p>
      <Link
        href={loginHref(pathname || '/')}
        className="inline-block mt-3 bg-[#087ed9] hover:bg-[#076ec0] text-white font-bold text-xs px-5 py-2.5 rounded-lg transition"
      >
        Log in to continue
      </Link>
    </div>
  );

  return (
    <section className="py-9 border-b border-slate-200" id="dealer">
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">

          {/* Left Column: Owner Details */}
          <div className="lg:col-span-5 flex flex-col justify-between">
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-6 tracking-tight">
                Owner Details
              </h3>

              <div className="flex items-start gap-4 sm:gap-5">
                <div className="relative shrink-0">
                  <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-full bg-gradient-to-br from-[#087ed9] to-[#0369a1] shadow-md flex items-center justify-center border-2 border-white ring-1 ring-slate-200 text-white text-2xl font-extrabold">
                    {ownerName.trim().charAt(0).toUpperCase()}
                  </div>
                  <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-1 shadow-xs" title="Verified listing">
                    <ShieldCheck size={13} strokeWidth={2.5} />
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="text-base sm:text-lg font-extrabold text-[#087ed9] tracking-tight truncate">
                    {ownerName}
                  </h4>
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
                    Owner · Verified listing
                  </p>

                  <div className="mt-3">
                    {contact.phone ? (
                      <a
                        href={`tel:${contact.phone}`}
                        onClick={contact.onCall}
                        className="inline-flex items-center gap-2 bg-[#20c997] hover:bg-[#1bb587] text-white text-xs sm:text-[13px] font-bold px-4 py-2 rounded-lg transition duration-200 shadow-xs cursor-pointer active:scale-98"
                      >
                        <Phone size={14} className="fill-white" />
                        <span>{formatIndianPhone(contact.phone)}</span>
                      </a>
                    ) : (
                      <button
                        type="button"
                        onClick={() => void contact.reveal()}
                        disabled={contact.loading}
                        className="inline-flex items-center gap-2 bg-[#20c997] hover:bg-[#1bb587] disabled:opacity-60 text-white text-xs sm:text-[13px] font-bold px-4 py-2 rounded-lg transition duration-200 shadow-xs cursor-pointer active:scale-98"
                      >
                        <Phone size={14} className="fill-white" />
                        <span>{contact.loading ? 'Loading…' : 'View Phone Number'}</span>
                      </button>
                    )}
                    {contact.error && <p className="text-[11px] text-red-600 font-semibold mt-1" role="alert">{contact.error}</p>}
                  </div>
                </div>
              </div>

              <div className="mt-5 space-y-2.5 text-xs sm:text-[13px] text-slate-700">
                {ownerAddress && (
                  <p className="pt-0.5">
                    <span className="font-semibold text-slate-800">Address : </span>
                    <span className="text-slate-600">{ownerAddress}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Enquiry + Visit */}
          <div className="lg:col-span-7 lg:border-l lg:border-slate-200 lg:pl-10 space-y-8">
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-5 tracking-tight">
                Send enquiry to Owner
              </h3>

              {!ready ? null : !session ? (
                loginPrompt('send an enquiry to the owner')
              ) : submitted ? (
                <div className="p-6 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-3.5 animate-in fade-in zoom-in-95 duration-200">
                  <CheckCircle size={22} className="text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-sm sm:text-base">Enquiry sent</h4>
                    <p className="text-xs sm:text-sm text-emerald-700 mt-1 leading-relaxed">
                      Your message about <strong>{property.name}</strong> is with the owner. Replies appear in{' '}
                      <Link href="/activity" className="font-semibold underline">your activity</Link>.
                    </p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <textarea
                      value={message}
                      maxLength={MAX_CHARS}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={3}
                      aria-label="Message to the owner"
                      className="w-full min-h-[92px] bg-white border border-slate-200 rounded-lg p-3 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#087ed9] focus:ring-1 focus:ring-[#087ed9] resize-none transition"
                    />
                    <div className="flex justify-between text-[11px] text-slate-400 mt-1 font-medium">
                      <span>Sent from your Restamp account{session.displayName ? ` (${session.displayName})` : ''}</span>
                      <span>{MAX_CHARS - message.length} chars</span>
                    </div>
                  </div>

                  {errorMsg && <p className="text-xs text-red-500 font-medium" role="alert">{errorMsg}</p>}

                  <div className="pt-1">
                    <label className="flex items-start gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={agreedTerms}
                        onChange={(e) => setAgreedTerms(e.target.checked)}
                        className="mt-0.5 accent-[#087ed9] rounded w-4 h-4 cursor-pointer shrink-0"
                      />
                      <span className="text-xs text-slate-500 leading-normal">
                        I agree to the{' '}
                        <span className="text-[#087ed9] hover:underline">Terms & Conditions</span>
                        {' '}and{' '}
                        <span className="text-[#087ed9] hover:underline">Privacy Policy</span>
                      </span>
                    </label>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-[#087ed9] hover:bg-[#076ec0] text-white font-bold text-xs sm:text-sm px-6 py-2.5 rounded-lg transition duration-200 shadow-xs cursor-pointer active:scale-98 disabled:opacity-60 inline-flex items-center gap-2"
                    >
                      {isSubmitting && <Loader2 size={14} className="animate-spin" />}
                      <span>{isSubmitting ? 'Sending...' : 'Send Enquiry'}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>

            <div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-4 tracking-tight flex items-center gap-2">
                <CalendarClock size={20} className="text-[#087ed9]" />
                Request a site visit
              </h3>

              {!ready ? null : !session ? (
                loginPrompt('request a site visit')
              ) : visitDone ? (
                <div className="p-5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-3">
                  <CheckCircle size={20} className="text-emerald-600 shrink-0 mt-0.5" />
                  <p className="text-xs sm:text-sm">
                    Visit requested for <strong>{visitDone}</strong>. The owner will confirm or decline it; track it in{' '}
                    <Link href="/activity" className="font-semibold underline">your activity</Link>.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleVisit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="datetime-local"
                    value={visitAt}
                    min={localInputValue(1)}
                    onChange={(e) => setVisitAt(e.target.value)}
                    aria-label="Preferred visit date and time"
                    className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#087ed9] focus:ring-1 focus:ring-[#087ed9]"
                  />
                  <input
                    type="text"
                    value={visitNote}
                    maxLength={300}
                    onChange={(e) => setVisitNote(e.target.value)}
                    placeholder="Note for the owner (optional)"
                    className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#087ed9] focus:ring-1 focus:ring-[#087ed9]"
                  />
                  {visitError && <p className="sm:col-span-2 text-xs text-red-500 font-medium" role="alert">{visitError}</p>}
                  <div className="sm:col-span-2">
                    <button
                      type="submit"
                      disabled={visitSending}
                      className="border border-[#087ed9] text-[#087ed9] hover:bg-sky-50 font-bold text-xs sm:text-sm px-6 py-2.5 rounded-lg transition disabled:opacity-60 inline-flex items-center gap-2 cursor-pointer"
                    >
                      {visitSending && <Loader2 size={14} className="animate-spin" />}
                      <span>{visitSending ? 'Sending...' : 'Request Visit'}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
