import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { recordCall, revealContact, isBuyerPlanRequired } from '@/lib/api/buyer';
import { errorMessage, isApiError } from '@/lib/api/client';
import { getSession, loginHref } from '@/lib/api/session';

/**
 * "View Number" for one listing: reveals the owner's phone through the
 * audited contact endpoint (signed-in buyers only; guests are sent to log
 * in). The reveal also names the owner (public-safe, from the backend);
 * `ownerName` is null when the owner has no saved display name, in which
 * case callers show their existing neutral label. Calling the revealed
 * number records a call event for Activity.
 *
 * When the buyer's free lead quota is used up the backend answers 402
 * BUYER_PLAN_REQUIRED: `planRequired` turns true and `error` carries the
 * backend's own message, so callers can offer the buyer plans page
 * (/buy/plans) instead of a generic failure.
 */
export function useOwnerContact(listingId: number) {
  const router = useRouter();
  const pathname = usePathname();
  const [phone, setPhone] = useState<string | null>(null);
  const [ownerName, setOwnerName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [planRequired, setPlanRequired] = useState(false);

  const reveal = async () => {
    if (phone || loading) return;
    if (!getSession()) {
      router.push(loginHref(pathname || '/'));
      return;
    }
    setLoading(true);
    setError('');
    setPlanRequired(false);
    try {
      const revealed = await revealContact(listingId);
      setPhone(revealed.phone);
      setOwnerName(revealed.ownerName);
    } catch (e) {
      if (isBuyerPlanRequired(e)) {
        setPlanRequired(true);
        // The backend's own quota message when it sent one; otherwise the plain case.
        setError(
          e.detail && e.detail !== 'Invalid request'
            ? e.detail
            : "You've used all the free owner-number reveals on your current plan."
        );
      } else {
        setError(
          isApiError(e, 'missing')
            ? 'The owner has not shared a contact number for this listing.'
            : errorMessage(e, 'Could not load the number. Please try again.')
        );
      }
    } finally {
      setLoading(false);
    }
  };

  /** Fire-and-forget: a failed call record must not block the phone call itself. */
  const onCall = () => {
    recordCall(listingId).catch(() => undefined);
  };

  return { phone, ownerName, loading, error, planRequired, reveal, onCall };
}

/** "+919876543210" -> "+91 98765 43210" for display. */
export function formatIndianPhone(phone: string): string {
  const m = phone.match(/^\+91(\d{5})(\d{5})$/);
  return m ? `+91 ${m[1]} ${m[2]}` : phone;
}
