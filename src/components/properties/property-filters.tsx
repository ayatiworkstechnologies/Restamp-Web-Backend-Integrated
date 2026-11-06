"use client";

import React from "react";
import {
  Search,
  X,
  SlidersHorizontal,
  LayoutGrid,
  Table as TableIcon,
  ChevronDown,
} from "lucide-react";
import { PropertyFilters, PropertyStatus, PropertyType } from "@/types/property";

interface PropertyFiltersBarProps {
  filters: PropertyFilters;
  onFilterChange: (newFilters: Partial<PropertyFilters>) => void;
  statusCounts: {
    all: number;
    pending: number;
    active: number;
    rejected: number;
  };
  viewMode: "table" | "grid";
  onViewModeChange: (mode: "table" | "grid") => void;
}

const statusOptions: { label: string; value: "All" | PropertyStatus; key: "all" | "pending" | "active" | "rejected" }[] = [
  { label: "All Properties", value: "All", key: "all" },
  { label: "Pending Review", value: "Pending", key: "pending" },
  { label: "Active Listings", value: "Active", key: "active" },
  { label: "Rejected", value: "Rejected", key: "rejected" },
];

const propertyTypes: ("All" | PropertyType)[] = [
  "All",
  "Apartment",
  "Villa",
  "Independent House",
  "Commercial",
  "Plot",
];

const bhkOptions: ("All" | "1" | "2" | "3" | "4+")[] = ["All", "1", "2", "3", "4+"];

export function PropertyFiltersBar({
  filters,
  onFilterChange,
  statusCounts,
  viewMode,
  onViewModeChange,
}: PropertyFiltersBarProps) {
  return (
    <div className="space-y-3 rounded-2xl border border-[#e8ecf4] bg-white p-4 shadow-sm">
      {/* Status Tabs and View Switcher */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[#f1f4f9] pb-3">
        <div className="flex flex-wrap items-center gap-1.5" role="tablist">
          {statusOptions.map((tab) => {
            const isActive = filters.status === tab.value;
            const count = statusCounts[tab.key];

            return (
              <button
                key={tab.value}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => onFilterChange({ status: tab.value })}
                className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                  isActive
                    ? "bg-[#2854cb] text-white shadow-sm"
                    : "text-[#6f7e95] hover:bg-[#f5f8ff] hover:text-[#2854cb]"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-extrabold ${
                    isActive
                      ? "bg-white/20 text-white"
                      : tab.value === "Pending" && count > 0
                      ? "bg-[#fef3c7] text-[#b45309]"
                      : "bg-[#edf1f8] text-[#7d8ca4]"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-1 rounded-xl border border-[#e2e8f2] bg-[#f8fafc] p-1">
          <button
            type="button"
            title="Table View"
            onClick={() => onViewModeChange("table")}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all ${
              viewMode === "table"
                ? "bg-white text-[#2854cb] shadow-sm"
                : "text-[#7f8da4] hover:text-[#283854]"
            }`}
          >
            <TableIcon size={14} />
            <span className="hidden sm:inline">Table</span>
          </button>
          <button
            type="button"
            title="Grid Cards View"
            onClick={() => onViewModeChange("grid")}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all ${
              viewMode === "grid"
                ? "bg-white text-[#2854cb] shadow-sm"
                : "text-[#7f8da4] hover:text-[#283854]"
            }`}
          >
            <LayoutGrid size={14} />
            <span className="hidden sm:inline">Cards</span>
          </button>
        </div>
      </div>

      {/* Search, Type, BHK and Sort Controls */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search Input */}
        <div className="relative min-w-[220px] flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9da9bc]" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => onFilterChange({ search: e.target.value })}
            placeholder="Search by title, location, owner name, ID..."
            className="w-full rounded-xl border border-[#e2e8f2] bg-[#fbfcfe] pl-9 pr-8 py-2 text-xs font-medium text-[#22324d] outline-none transition-all placeholder:text-[#a1adc0] focus:border-[#2854cb] focus:bg-white"
          />
          {filters.search && (
            <button
              onClick={() => onFilterChange({ search: "" })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#a1adc0] hover:text-[#324564]"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Property Type Dropdown */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold text-[#98a6bb]">Type:</span>
          <select
            value={filters.type}
            onChange={(e) => onFilterChange({ type: e.target.value as any })}
            className="rounded-xl border border-[#e2e8f2] bg-[#fbfcfe] px-3 py-2 text-xs font-semibold text-[#324564] outline-none transition-all hover:bg-white focus:border-[#2854cb] cursor-pointer"
          >
            {propertyTypes.map((t) => (
              <option key={t} value={t}>
                {t === "All" ? "All Types" : t}
              </option>
            ))}
          </select>
        </div>

        {/* BHK Dropdown */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold text-[#98a6bb]">BHK:</span>
          <select
            value="All"
            disabled
            title="Not available yet: admin listing rows do not include bedrooms"
            onChange={(e) => onFilterChange({ bhk: e.target.value as any })}
            className="rounded-xl border border-[#e2e8f2] bg-[#fbfcfe] px-3 py-2 text-xs font-semibold text-[#324564] outline-none transition-all hover:bg-white focus:border-[#2854cb] cursor-pointer"
          >
            <option value="All">All BHK</option>
            <option value="1">1 BHK</option>
            <option value="2">2 BHK</option>
            <option value="3">3 BHK</option>
            <option value="4+">4+ BHK</option>
          </select>
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-1.5 ml-auto">
          <span className="text-[11px] font-bold text-[#98a6bb]">Sort:</span>
          <select
            value={filters.sortBy}
            onChange={(e) => onFilterChange({ sortBy: e.target.value as any })}
            className="rounded-xl border border-[#e2e8f2] bg-[#fbfcfe] px-3 py-2 text-xs font-semibold text-[#324564] outline-none transition-all hover:bg-white focus:border-[#2854cb] cursor-pointer"
          >
            <option value="newest">Newest First</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="title_asc">Title: A to Z</option>
          </select>
        </div>
      </div>
    </div>
  );
}
