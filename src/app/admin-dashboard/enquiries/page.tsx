"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Menu,
  Bell,
  Search,
  X,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { EnquiryHeader } from "@/components/enquiries/enquiry-header";
import { EnquiryFiltersBar } from "@/components/enquiries/enquiry-filters";
import { EnquiryTable } from "@/components/enquiries/enquiry-table";
import { EnquiryDetailModal } from "@/components/enquiries/enquiry-detail-modal";
import { AdminEnquiryItem, useEnquiryStore } from "@/context/enquiry-context";
import { useAdminAuth } from "@/context/admin-auth-context";
import { EnquiryFilters, EnquiryStatus } from "@/types/enquiry";

function EnquiryManagementContent() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get("status") as EnquiryStatus | null;
  const initialId = searchParams.get("id");

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Modals state
  const [selectedEnquiry, setSelectedEnquiry] = useState<AdminEnquiryItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const { enquiries, stats, loading, loadError, truncated, reload } = useEnquiryStore();
  const { admin } = useAdminAuth();
  // ?user=<id> (from User Management): enquiries where that user is the buyer or the owner.
  const userFilter = searchParams.get("user");

  // Filters state
  const [filters, setFilters] = useState<EnquiryFilters>({
    search: "",
    status: initialStatus || "all",
    type: "all",
    sortBy: "recent",
  });

  // Handle URL query parameters
  useEffect(() => {
    if (initialStatus) {
      setFilters((prev) => ({ ...prev, status: initialStatus }));
    }
    if (initialId) {
      const found = enquiries.find(
        (e) => e.id.toLowerCase() === initialId.toLowerCase()
      );
      if (found) {
        setSelectedEnquiry(found);
        setIsDetailOpen(true);
      }
    }
  }, [initialStatus, initialId, enquiries]);

  // Handle Inspection modal
  const handleInspect = (enquiry: AdminEnquiryItem) => {
    setSelectedEnquiry(enquiry);
    setIsDetailOpen(true);
  };

  // Status counts for tabs
  const statusCounts = useMemo(() => {
    return {
      all: enquiries.length,
      active: enquiries.filter((e) => e.status === "Active").length,
      addressed: enquiries.filter((e) => e.status === "Addressed").length,
      archived: enquiries.filter((e) => e.status === "Archived").length,
    };
  }, [enquiries]);

  // Filter and sort enquiries
  const filteredEnquiries = useMemo(() => {
    return enquiries
      .filter((e) => {
        // Status filter
        if (filters.status !== "all" && e.status !== filters.status) {
          return false;
        }

        if (userFilter && String(e.buyerId) !== userFilter && String(e.ownerId) !== userFilter) {
          return false;
        }

        // Search query
        if (filters.search.trim()) {
          const query = filters.search.toLowerCase();
          const matches =
            e.buyerName.toLowerCase().includes(query) ||
            e.ownerName.toLowerCase().includes(query) ||
            e.id.includes(query) ||
            e.listingTitle.toLowerCase().includes(query) ||
            e.lastMessage.toLowerCase().includes(query);
          if (!matches) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (filters.sortBy === "status") {
          return a.status.localeCompare(b.status);
        }
        // default "recent" (higher id = created later)
        return b.enquiryId - a.enquiryId;
      });
  }, [enquiries, filters, userFilter]);

  // Keep selectedEnquiry up-to-date with any changes in store
  const activeEnquiry = useMemo(() => {
    if (!selectedEnquiry) return null;
    return enquiries.find((e) => e.id === selectedEnquiry.id) || selectedEnquiry;
  }, [enquiries, selectedEnquiry]);

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      {/* Sidebar Navigation */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#e8ecf4] bg-white/95 px-4 sm:px-6 lg:px-8 backdrop-blur">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-2 text-[#475467] hover:bg-[#f1f4f9] lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f0f4ff] text-[#162d66]">
                <MessageSquare className="h-4 w-4" />
              </div>
              <span className="text-sm font-semibold text-[#101828]">
                Enquiry Management
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-[#ecfdf5] px-2 py-0.5 text-[11px] font-medium text-[#059669]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#10b981]" />
                Online Leads
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Global Lead Search */}
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#94a3b8]" />
              <input
                type="text"
                placeholder="Search leads, buyers, phones..."
                value={filters.search}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, search: e.target.value }))
                }
                className="w-64 rounded-xl border border-[#e8ecf4] bg-[#f8fafc] py-1.5 pl-9 pr-3 text-xs text-[#101828] placeholder-[#94a3b8] focus:border-[#162d66] focus:bg-white focus:outline-none"
              />
            </div>

            {/* Notification Drawer */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative rounded-lg p-2 text-[#475467] hover:bg-[#f1f4f9]"
              >
                <Bell className="h-5 w-5" />
                {stats.active > 0 && (
                  <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#ef4444] text-[10px] font-bold text-white">
                    {stats.active}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 top-12 z-50 w-80 rounded-2xl border border-[#e8ecf4] bg-white p-4 shadow-xl">
                  <div className="flex items-center justify-between border-b border-[#f1f4f9] pb-3">
                    <h4 className="font-semibold text-[#101828] text-sm">
                      New Enquiries ({stats.active})
                    </h4>
                    <button
                      type="button"
                      onClick={() => setNotificationsOpen(false)}
                      className="text-[#94a3b8] hover:text-[#475467]"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-3 space-y-2 max-h-64 overflow-y-auto">
                    {stats.active === 0 ? (
                      <p className="text-xs text-[#64748b] text-center py-4">
                        No enquiries are waiting for an owner response.
                      </p>
                    ) : (
                      enquiries.filter((e) => e.status === "Active").slice(0, 8).map((item) => (
                        <div
                          key={item.id}
                          onClick={() => {
                            setNotificationsOpen(false);
                            handleInspect(item);
                          }}
                          className="cursor-pointer rounded-xl p-2.5 hover:bg-[#f8fafc] transition-colors border border-transparent hover:border-[#e8ecf4]"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-[#101828]">
                              {item.buyerName}
                            </span>
                            <span className="text-[10px] text-[#b45309] font-medium bg-[#fef3c7] px-1.5 py-0.5 rounded">
                              {item.statusLabel}
                            </span>
                          </div>
                          <p className="mt-0.5 text-xs text-[#64748b] line-clamp-1">
                            {item.listingTitle}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Admin Avatar */}
            <div className="flex items-center gap-2 border-l border-[#e8ecf4] pl-3">
              <div className="h-8 w-8 rounded-full bg-[#162d66] text-white flex items-center justify-center font-bold text-xs">
                {(admin?.name || "Admin").slice(0, 2).toUpperCase()}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-semibold text-[#101828]">{admin?.name || "Admin"}</p>
                <p className="text-[10px] text-[#64748b]">{admin?.role}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Header with KPI cards and CTA */}
          <EnquiryHeader
            onFilterActive={() =>
              setFilters((prev) => ({ ...prev, status: "Active" }))
            }
            filteredCount={filteredEnquiries.length}
            totalCount={enquiries.length}
            currentStatusFilter={filters.status}
          />

          {/* Filters Bar */}
          <EnquiryFiltersBar
            filters={filters}
            onFilterChange={(newFilters) =>
              setFilters((prev) => ({ ...prev, ...newFilters }))
            }
            statusCounts={statusCounts}
          />

          {loadError && (
            <div className="rounded-2xl border border-[#fee2e2] bg-[#fef2f2] p-4 text-sm text-[#991b1b]" role="alert">
              {loadError}{" "}
              <button type="button" onClick={reload} className="font-bold underline">
                Try again
              </button>
            </div>
          )}
          {truncated && (
            <div className="rounded-2xl border border-[#fde68a] bg-[#fffbeb] p-3 text-xs text-[#92400e]">
              Showing the newest {enquiries.length} enquiries only.
            </div>
          )}
          {userFilter && (
            <div className="rounded-2xl border border-[#d0e0ff] bg-[#f0f4ff] p-3 text-xs text-[#162d66]">
              Showing enquiries for user #{userFilter}.
            </div>
          )}

          {/* Table View */}
          {loading ? (
            <div className="rounded-2xl border border-[#e8ecf4] bg-white py-12 text-center text-sm text-[#94a3b8]">Loading enquiries…</div>
          ) : (
            <EnquiryTable enquiries={filteredEnquiries} onInspect={handleInspect} />
          )}
        </main>
      </div>

      {/* Inspection & Remarks Modal */}
      <EnquiryDetailModal
        enquiry={activeEnquiry}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
      />

    </div>
  );
}

export default function EnquiryManagementPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-[#f8fafc] text-sm text-[#64748b]">
          Loading Buyer Inquiries Log...
        </div>
      }
    >
      <EnquiryManagementContent />
    </Suspense>
  );
}
