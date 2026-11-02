"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { PropertyStatus, PropertyType } from "@/types/property";
import {
  AdminListingDetail,
  AdminListingRow,
  getAdminListing,
  listAdminListings,
  rejectAdminListing,
  verifyAdminListing,
} from "@/lib/api/admin";
import { errorMessage, isApiError } from "@/lib/api/client";
import { cleanImageUrl, DEAL_LABELS, typeLabel } from "@/lib/api/mappers";
import { useAdminAuth } from "@/context/admin-auth-context";

interface ToastMessage {
  id: number;
  message: string;
  type: "success" | "error" | "info";
}

/**
 * One admin listing row (GET /admin/listings) shaped for the console. Only
 * backend fields; nothing is estimated. `status` is the console's tab
 * bucket: Pending / Rejected / Active (verified + available) / Draft
 * (every other verified state: hidden, sold, rented, leased, or removed),
 * with the precise state in `statusLabel`.
 */
export interface AdminProperty {
  id: string;
  listingId: number;
  title: string;
  type: PropertyType;
  typeLabel: string;
  dealLabel: string;
  price: number;
  priceDisplay: string;
  status: PropertyStatus;
  statusLabel: string;
  verificationStatus: string;
  listingStatus: string;
  removed: boolean;
  locality: string;
  city: string;
  pincode: string;
  ownerId: number;
  ownerName: string;
  submittedAt: string | null;
  image: string;
}

const TYPE_BUCKET: Record<string, PropertyType> = {
  APARTMENT: "Apartment",
  VILLA: "Villa",
  HOUSE: "Independent House",
  PLOT: "Plot",
  AGRICULTURAL_LAND: "Plot",
  COMMERCIAL: "Commercial",
};

const LISTING_STATE_LABEL: Record<string, string> = {
  CLOSED: "Hidden by owner",
  SOLD: "Sold",
  RENTED: "Rented",
  LEASED: "Leased",
  EXPIRED: "Expired",
};

export function toAdminProperty(r: AdminListingRow): AdminProperty {
  let status: PropertyStatus = "Draft";
  let statusLabel = LISTING_STATE_LABEL[r.listing_status] || r.listing_status;
  if (r.removed) statusLabel = "Removed by owner";
  else if (r.verification_status === "PENDING") [status, statusLabel] = ["Pending", "Pending review"];
  else if (r.verification_status === "REJECTED") [status, statusLabel] = ["Rejected", "Rejected"];
  else if (r.listing_status === "AVAILABLE") [status, statusLabel] = ["Active", "Live"];
  return {
    id: String(r.listing_id),
    listingId: r.listing_id,
    title: r.title,
    type: TYPE_BUCKET[r.property_type] || "Apartment",
    typeLabel: typeLabel(r.property_type),
    dealLabel: DEAL_LABELS[r.transaction_type] || r.transaction_type,
    price: Math.round(r.price_paise / 100),
    priceDisplay: r.price_display,
    status,
    statusLabel,
    verificationStatus: r.verification_status,
    listingStatus: r.listing_status,
    removed: r.removed,
    locality: r.locality,
    city: r.city,
    pincode: r.pincode,
    ownerId: r.owner_user_id,
    ownerName: r.owner_name || "Owner",
    submittedAt: r.submitted_at || null,
    image: cleanImageUrl(r.cover_image_url),
  };
}

interface PropertyContextType {
  properties: AdminProperty[];
  loading: boolean;
  loadError: string | null;
  /** True when more listings exist than were loaded. */
  truncated: boolean;
  stats: { total: number; active: number; pending: number; rejected: number; inactive: number };
  reload: () => void;
  getDetail: (id: number) => Promise<AdminListingDetail>;
  /** PENDING -> VERIFIED. Resolves true on success; failures are toasted. */
  approveProperty: (id: number, notes?: string) => Promise<boolean>;
  /** PENDING -> REJECTED with a required reason. */
  rejectProperty: (id: number, reason: string, category?: string) => Promise<boolean>;
  batchApprove: (ids: number[]) => Promise<void>;
  toast: ToastMessage | null;
  showToast: (message: string, type?: "success" | "error" | "info") => void;
  hideToast: () => void;
}

const PropertyContext = createContext<PropertyContextType | undefined>(undefined);

// Load up to this many listings for the console's in-page filters (5 pages of 100).
const MAX_PAGES = 5;

function actionError(e: unknown, fallback: string): string {
  if (isApiError(e, "validation") && e.detail) return e.detail;
  return errorMessage(e, fallback);
}

export function PropertyProvider({ children }: { children: React.ReactNode }) {
  const { admin, can } = useAdminAuth();
  const [properties, setProperties] = useState<AdminProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [truncated, setTruncated] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const canView = !!admin && can("properties.view");

  const showToast = useCallback((message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ id: Date.now(), message, type });
  }, []);
  const hideToast = useCallback(() => setToast(null), []);

  useEffect(() => {
    if (!canView) {
      setProperties([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    (async () => {
      try {
        const rows: AdminListingRow[] = [];
        let total = 0;
        for (let page = 1; page <= MAX_PAGES; page++) {
          const res = await listAdminListings({ include_removed: true }, page, 100);
          rows.push(...res.items);
          total = res.total;
          if (rows.length >= total || res.items.length === 0) break;
        }
        if (cancelled) return;
        setProperties(rows.map(toAdminProperty));
        setTruncated(rows.length < total);
      } catch (e) {
        if (!cancelled) setLoadError(errorMessage(e, "Could not load listings."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [canView, reloadKey]);

  const replaceRow = useCallback((detail: AdminListingDetail) => {
    const l = detail.listing;
    setProperties((prev) =>
      prev.map((p) =>
        p.listingId === l.listing_id
          ? toAdminProperty({
              listing_id: l.listing_id,
              title: l.title,
              property_type: l.property_type,
              transaction_type: l.transaction_type,
              price_paise: l.price_paise,
              price_period: l.price_period,
              price_display: l.price_display,
              verification_status: l.verification_status,
              listing_status: l.listing_status,
              removed: !!l.removed,
              submitted_at: l.submitted_at,
              owner_user_id: detail.owner.user_id,
              owner_name: detail.owner.display_name,
              locality: l.locality,
              city: l.city,
              pincode: l.pincode,
              cover_image_url: l.cover_image_url,
            })
          : p
      )
    );
  }, []);

  const approveProperty = useCallback(
    async (id: number, notes?: string) => {
      try {
        replaceRow(await verifyAdminListing(id, notes));
        showToast("Listing verified. It is now visible to buyers if available.", "success");
        return true;
      } catch (e) {
        showToast(actionError(e, "Could not verify this listing."), "error");
        return false;
      }
    },
    [replaceRow, showToast]
  );

  const rejectProperty = useCallback(
    async (id: number, reason: string, category?: string) => {
      try {
        replaceRow(await rejectAdminListing(id, reason, category));
        showToast("Listing rejected. The owner can fix it and resubmit.", "success");
        return true;
      } catch (e) {
        showToast(actionError(e, "Could not reject this listing."), "error");
        return false;
      }
    },
    [replaceRow, showToast]
  );

  const batchApprove = useCallback(
    async (ids: number[]) => {
      let ok = 0;
      let failed = 0;
      for (const id of ids) {
        try {
          replaceRow(await verifyAdminListing(id));
          ok++;
        } catch {
          failed++;
        }
      }
      showToast(
        failed ? `Verified ${ok} listing(s); ${failed} could not be verified.` : `Verified ${ok} listing(s).`,
        failed ? "error" : "success"
      );
    },
    [replaceRow, showToast]
  );

  const stats = useMemo(
    () => ({
      total: properties.length,
      active: properties.filter((p) => p.status === "Active").length,
      pending: properties.filter((p) => p.status === "Pending").length,
      rejected: properties.filter((p) => p.status === "Rejected").length,
      inactive: properties.filter((p) => p.status === "Draft").length,
    }),
    [properties]
  );

  return (
    <PropertyContext.Provider
      value={{
        properties,
        loading,
        loadError,
        truncated,
        stats,
        reload: () => setReloadKey((k) => k + 1),
        getDetail: getAdminListing,
        approveProperty,
        rejectProperty,
        batchApprove,
        toast,
        showToast,
        hideToast,
      }}
    >
      {children}
    </PropertyContext.Provider>
  );
}

export function usePropertyStore() {
  const context = useContext(PropertyContext);
  if (context === undefined) {
    throw new Error("usePropertyStore must be used within a PropertyProvider");
  }
  return context;
}
