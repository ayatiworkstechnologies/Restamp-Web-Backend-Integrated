"use client";

import React from "react";
import { Search, X } from "lucide-react";
import { EnquiryFilters, EnquiryStatus, EnquiryType } from "@/types/enquiry";

interface EnquiryFiltersProps {
  filters: EnquiryFilters;
  onFilterChange: (newFilters: Partial<EnquiryFilters>) => void;
  statusCounts: {
    all: number;
    active: number;
    addressed: number;
    archived: number;
  };
}

const statusTabs: {
  label: string;
  value: "all" | EnquiryStatus;
  key: "all" | "active" | "addressed" | "archived";
}[] = [
  { label: "All Enquiries", value: "all", key: "all" },
  { label: "New", value: "Active", key: "active" },
  { label: "Owner responded", value: "Addressed", key: "addressed" },
  { label: "Closed", value: "Archived", key: "archived" },
];

const enquiryTypes: ("all" | EnquiryType)[] = [
  "all",
  "Contact Owner Request",
  "Price & Payment Query",
  "Floor Plan & Brochure",
  "Availability Check",
  "General Enquiry",
];

export function EnquiryFiltersBar({
  filters,
  onFilterChange,
  statusCounts,
}: EnquiryFiltersProps) {
  const hasActiveFilters =
    filters.search ||
    filters.status !== "all" ||
    filters.type !== "all" ||
    filters.sortBy !== "recent";

  const clearFilters = () => {
    onFilterChange({
      search: "",
      status: "all",
      type: "all",
      sortBy: "recent",
    });
  };

  return (
    <div className="space-y-3 rounded-2xl border border-[#e8ecf4] bg-white p-4 shadow-sm">
      {/* Status Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-[#f1f4f9] pb-3" role="tablist">
        {statusTabs.map((tab) => {
          const isActive = filters.status === tab.value;
          const count = statusCounts[tab.key];

          return (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onFilterChange({ status: tab.value })}
              className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
                isActive
                  ? "bg-[#162d66] text-white shadow-sm"
                  : "bg-transparent text-[#64748b] hover:bg-[#f8fafc] hover:text-[#101828]"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                  isActive
                    ? "bg-white/20 text-white"
                    : "bg-[#f1f5f9] text-[#64748b]"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search and Dropdowns */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#94a3b8]" />
          <input
            type="text"
            placeholder="Search buyer name, phone, email, property, or owner..."
            value={filters.search}
            onChange={(e) => onFilterChange({ search: e.target.value })}
            className="w-full rounded-xl border border-[#e8ecf4] bg-[#f8fafc] py-2 pl-9 pr-8 text-xs text-[#101828] placeholder-[#94a3b8] transition-colors focus:border-[#162d66] focus:bg-white focus:outline-none"
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => onFilterChange({ search: "" })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#475467]"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Enquiry Type */}
          <select
            value="all"
            disabled
            title="Not available yet: enquiries have no type"
            onChange={(e) =>
              onFilterChange({ type: e.target.value as "all" | EnquiryType })
            }
            aria-label="Filter by enquiry type"
            className="rounded-xl border border-[#e8ecf4] bg-white px-3 py-2 text-xs font-medium text-[#475467] shadow-sm hover:border-[#ccd7ea] focus:border-[#162d66] focus:outline-none"
          >
            <option value="all">All Inquiry Types</option>
            {enquiryTypes
              .filter((t) => t !== "all")
              .map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
          </select>

          {/* Sort By */}
          <select
            value={filters.sortBy}
            onChange={(e) =>
              onFilterChange({
                sortBy: e.target.value as "recent" | "price_desc" | "status",
              })
            }
            aria-label="Sort enquiries"
            className="rounded-xl border border-[#e8ecf4] bg-white px-3 py-2 text-xs font-medium text-[#475467] shadow-sm hover:border-[#ccd7ea] focus:border-[#162d66] focus:outline-none"
          >
            <option value="recent">Sort: Most Recent</option>

            <option value="status">Sort: Status</option>
          </select>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-medium text-[#d97706] hover:bg-[#fffbf0] transition-colors"
            >
              <X className="h-3 w-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
