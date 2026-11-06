"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CheckCircle2, X, Loader2 } from 'lucide-react';
import type { Property } from '@/data/properties';
import { sendEnquiry } from '@/lib/api/buyer';
import { errorMessage, isApiError } from '@/lib/api/client';
import { loginHref, useSession } from '@/lib/api/session';

const MAX_MESSAGE = 1000;

/**
 * Sends a real enquiry (POST /buyer/enquiries) for the signed-in buyer. The
 * backend identifies the buyer from their account, so there are no name /
 * phone / email fields to fill. Success is shown only after the server
 * stored the enquiry; failures keep the message and say what went wrong.
 */
export default function EnquiryModal({
  property,
  onClose,
  initialMessage,
}: {
  property: Property;
  onClose: () => void;
  initialMessage?: string;
}) {
  const pathname = usePathname();
  const { session, ready } = useSession();
  const [message, setMessage] = useState(
    initialMessage ||
      `Hi, I am interested in ${property.name}${property.locality ? ` in ${property.locality}` : ''}. Please share more details.`
  );
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sending) return;
    setSending(true);
    setError('');
    try {
      await sendEnquiry(property.id, message.slice(0, MAX_MESSAGE));
      setSent(true);
    } catch (err) {
      setError(
        isApiError(err, 'missing')
          ? 'This property is no longer available for enquiries.'
          : errorMessage(err, 'Your enquiry could not be sent. Please try again.')
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-7 relative shadow-2xl border border-slate-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100 transition"
          aria-label="Close modal"
        >
          <X size={20} />
        </button>

        {sent ? (
          <div className="py-8 text-center">
            <CheckCircle2 size={48} className="text-emerald-500 mx-auto mb-3" />
            <h3 className="text-xl font-bold text-slate-900">Enquiry sent</h3>
            <p className="text-sm text-slate-500 mt-2">
              The owner of <strong className="text-slate-800">{property.name}</strong> can now see your message. Replies appear in{' '}
              <Link href="/activity" className="text-[#087ed9] font-semibold hover:underline">
                your activity
              </Link>
              .
            </p>
          </div>
        ) : (
          <div>
            <p className="eyebrow text-[#087ed9]">CONTACT OWNER</p>
            <h3 className="text-xl font-bold text-slate-900 mt-1">Enquire about {property.name}</h3>
            <p className="text-xs text-slate-500 mt-1">
              {[property.bhk, property.address || property.propertyType, property.price].filter(Boolean).join(' · ')}
            </p>

            {!ready ? null : !session ? (
              <div className="mt-6 rounded-xl bg-sky-50 border border-sky-100 p-4 text-sm text-slate-700">
                <p>Log in with your mobile number to send an enquiry to the owner.</p>
                <Link
                  href={loginHref(pathname || '/')}
                  className="inline-block mt-3 px-5 py-2.5 text-xs font-semibold text-white bg-[#087ed9] hover:bg-sky-600 rounded-lg transition"
                >
                  Log in to continue
                </Link>
              </div>
            ) : (
              <form onSubmit={submit} className="mt-5 space-y-3.5">
                <div>
                  <label htmlFor="enquiry-message" className="block text-xs font-semibold text-slate-700 mb-1">
                    Message
                  </label>
                  <textarea
                    id="enquiry-message"
                    rows={4}
                    maxLength={MAX_MESSAGE}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-200 text-sm focus:outline-hidden focus:border-[#087ed9] resize-none"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Sent from your Restamp account{session.displayName ? ` (${session.displayName})` : ''}.
                  </p>
                </div>

                {error && <p className="text-xs font-semibold text-red-600" role="alert">{error}</p>}

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={sending}
                    className="inline-flex items-center justify-center px-5 h-[53px] text-xs font-semibold text-white bg-[#087ed9] hover:bg-sky-600 disabled:opacity-60 rounded-lg transition shadow-sm cursor-pointer gap-1.5"
                  >
                    {sending && <Loader2 size={14} className="animate-spin" />}
                    {sending ? 'Sending…' : 'Send Enquiry'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
