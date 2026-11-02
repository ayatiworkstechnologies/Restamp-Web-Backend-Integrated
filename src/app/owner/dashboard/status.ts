import type { OwnerListingOut } from '@/lib/api/owner';

/** One owner-facing label for a listing's verification + listing status. */
export function listingStatusLabel(l: OwnerListingOut): string {
  if (l.removed) return 'Removed';
  if (l.verification_status === 'PENDING') return 'Pending Verification';
  if (l.verification_status === 'REJECTED') return 'Rejected';
  switch (l.listing_status) {
    case 'AVAILABLE':
      return 'Live';
    case 'CLOSED':
      return 'Hidden';
    case 'SOLD':
      return 'Sold';
    case 'RENTED':
      return 'Rented';
    case 'LEASED':
      return 'Leased';
    case 'EXPIRED':
      return 'Expired';
    default:
      return l.listing_status;
  }
}

export function statusTone(l: OwnerListingOut): string {
  if (l.removed) return 'bg-slate-100 text-slate-500';
  if (l.verification_status === 'PENDING') return 'bg-amber-50 text-amber-700';
  if (l.verification_status === 'REJECTED') return 'bg-red-50 text-red-600';
  return l.listing_status === 'AVAILABLE' ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-600';
}
