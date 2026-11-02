import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { recordCall, revealContact } from '@/lib/api/buyer';
import { errorMessage, isApiError } from '@/lib/api/client';
import { getSession, loginHref } from '@/lib/api/session';

/**
 * "View Number" for one listing: reveals the owner's phone through the
 * audited contact endpoint (signed-in buyers only; guests are sent to log
 * in). Calling the revealed number records a call event for Activity.
 */
export function useOwnerContact(listingId: number) {
  const router = useRouter();
  const pathname = usePathname();
  const [phone, setPhone] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const reveal = async () => {
    if (phone || loading) return;
    if (!getSession()) {
      router.push(loginHref(pathname || '/'));
      return;
    }
    setLoading(true);
    setError('');
    try {
      setPhone(await revealContact(listingId));
    } catch (e) {
      setError(
        isApiError(e, 'missing')
          ? 'The owner has not shared a contact number for this listing.'
          : errorMessage(e, 'Could not load the number. Please try again.')
      );
    } finally {
      setLoading(false);
    }
  };

  /** Fire-and-forget: a failed call record must not block the phone call itself. */
  const onCall = () => {
    recordCall(listingId).catch(() => undefined);
  };

  return { phone, loading, error, reveal, onCall };
}

/** "+919876543210" -> "+91 98765 43210" for display. */
export function formatIndianPhone(phone: string): string {
  const m = phone.match(/^\+91(\d{5})(\d{5})$/);
  return m ? `+91 ${m[1]} ${m[2]}` : phone;
}
