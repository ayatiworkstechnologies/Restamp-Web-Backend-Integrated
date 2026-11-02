"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { EnquiryStatus } from "@/types/enquiry";
import { AdminEnquiryDetail, AdminEnquiryRow, getAdminEnquiry, listAdminEnquiries } from "@/lib/api/admin";
import { errorMessage } from "@/lib/api/client";
import { useAdminAuth } from "@/context/admin-auth-context";

/**
 * One buyer enquiry (GET /admin/enquiries), read-only for admins: its status
 * belongs to the owner's lead workflow (NEW -> CONTACTED -> CLOSED). The
 * console's buckets map to it as Active = NEW, Addressed = CONTACTED,
 * Archived = CLOSED. Owners' private lead notes are never returned.
 */
export interface AdminEnquiryItem {
  id: string;
  enquiryId: number;
  status: EnquiryStatus;
  statusLabel: string;
  closingReason: string | null;
  listingId: number;
  listingTitle: string;
  buyerId: number;
  buyerName: string;
  ownerId: number;
  ownerName: string;
  messageCount: number;
  lastMessage: string;
  lastMessageAt: string | null;
  createdAt: string | null;
}

const STATUS: Record<string, { status: EnquiryStatus; label: string }> = {
  NEW: { status: "Active", label: "New" },
  CONTACTED: { status: "Addressed", label: "Owner responded" },
  CLOSED: { status: "Archived", label: "Closed by owner" },
};

export function toAdminEnquiry(r: AdminEnquiryRow): AdminEnquiryItem {
  const st = STATUS[r.status] || { status: "Active" as EnquiryStatus, label: r.status };
  return {
    id: String(r.id),
    enquiryId: r.id,
    status: st.status,
    statusLabel: st.label,
    closingReason: r.closing_reason || null,
    listingId: r.property_listing_id,
    listingTitle: r.listing_title || `Listing #${r.property_listing_id}`,
    buyerId: r.buyer_user_id,
    buyerName: r.buyer_name || "Buyer",
    ownerId: r.owner_user_id,
    ownerName: r.owner_name || "Owner",
    messageCount: r.message_count,
    lastMessage: r.last_message || "",
    lastMessageAt: r.last_message_at || null,
    createdAt: r.created_at || null,
  };
}

interface EnquiryContextType {
  enquiries: AdminEnquiryItem[];
  loading: boolean;
  loadError: string | null;
  truncated: boolean;
  stats: { total: number; active: number; addressed: number; archived: number };
  reload: () => void;
  getDetail: (id: number) => Promise<AdminEnquiryDetail>;
}

const EnquiryContext = createContext<EnquiryContextType | undefined>(undefined);

const MAX_PAGES = 5;

export function EnquiryProvider({ children }: { children: React.ReactNode }) {
  const { admin, can } = useAdminAuth();
  const [enquiries, setEnquiries] = useState<AdminEnquiryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [truncated, setTruncated] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const canView = !!admin && can("enquiries.view");

  useEffect(() => {
    if (!canView) {
      setEnquiries([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    (async () => {
      try {
        const rows: AdminEnquiryRow[] = [];
        let total = 0;
        for (let page = 1; page <= MAX_PAGES; page++) {
          const res = await listAdminEnquiries({}, page, 100);
          rows.push(...res.items);
          total = res.total;
          if (rows.length >= total || res.items.length === 0) break;
        }
        if (cancelled) return;
        setEnquiries(rows.map(toAdminEnquiry));
        setTruncated(rows.length < total);
      } catch (e) {
        if (!cancelled) setLoadError(errorMessage(e, "Could not load enquiries."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [canView, reloadKey]);

  const stats = useMemo(
    () => ({
      total: enquiries.length,
      active: enquiries.filter((e) => e.status === "Active").length,
      addressed: enquiries.filter((e) => e.status === "Addressed").length,
      archived: enquiries.filter((e) => e.status === "Archived").length,
    }),
    [enquiries]
  );

  return (
    <EnquiryContext.Provider
      value={{ enquiries, loading, loadError, truncated, stats, reload: () => setReloadKey((k) => k + 1), getDetail: getAdminEnquiry }}
    >
      {children}
    </EnquiryContext.Provider>
  );
}

export function useEnquiryStore() {
  const context = useContext(EnquiryContext);
  if (context === undefined) {
    throw new Error("useEnquiryStore must be used within an EnquiryProvider");
  }
  return context;
}
