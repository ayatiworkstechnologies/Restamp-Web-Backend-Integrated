"use client";

import React from "react";
import { Search, X, Users, UserCheck, Building } from "lucide-react";
import { UserFilters, UserRole, UserStatus, KycStatus, OwnerType } from "@/types/user";

interface UserFiltersProps {
  filters: UserFilters;
  onFilterChange: (newFilters: Partial<UserFilters>) => void;
  roleCounts: {
    all: number;
    buyers: number;
    owners: number;
  };
}

export function UserFiltersBar({
  filters,
  onFilterChange,
  roleCounts,
}: UserFiltersProps) {
  const roleTabs: { label: string; value: "all" | UserRole; count: number; icon: React.ReactNode }[] = [
    { label: "All Users", value: "all", count: roleCounts.all, icon: <Users size={14} /> },
    { label: "Buyers", value: "buyer", count: roleCounts.buyers, icon: <UserCheck size={14} /> },
    { label: "Owners & Sellers", value: "owner", count: roleCounts.owners, icon: <Building size={14} /> },
  ];

  return (
    <div className="space-y-3 rounded-2xl border border-[#e8ecf4] bg-white p-4 shadow-sm">
      {/* Role Tabs */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[#f1f4f9] pb-3">
        <div className="flex flex-wrap items-center gap-1.5" role="tablist">
          {roleTabs.map((tab) => {
            const isActive = filters.role === tab.value;

            return (
              <button
                key={tab.value}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => onFilterChange({ role: tab.value })}
                className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                  isActive
                    ? "bg-[#2854cb] text-white shadow-sm"
                    : "text-[#6f7e95] hover:bg-[#f5f8ff] hover:text-[#2854cb]"
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-extrabold ${
                    isActive ? "bg-white/20 text-white" : "bg-[#edf1f8] text-[#7d8ca4]"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search and Dropdowns */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search Input */}
        <div className="relative min-w-[220px] flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9da9bc]" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => onFilterChange({ search: e.target.value })}
            placeholder="Search by name, email, phone, user ID, city, agency..."
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

        {/* Status Dropdown */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold text-[#98a6bb]">Status:</span>
          <select
            value={filters.status}
            onChange={(e) => onFilterChange({ status: e.target.value as any })}
            className="rounded-xl border border-[#e2e8f2] bg-[#fbfcfe] px-3 py-2 text-xs font-semibold text-[#324564] outline-none transition-all hover:bg-white focus:border-[#2854cb] cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Pending KYC">Pending KYC</option>
            <option value="Suspended">Suspended</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        {/* KYC Status Dropdown */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold text-[#98a6bb]">KYC:</span>
          <select
            value={filters.kycStatus}
            onChange={(e) => onFilterChange({ kycStatus: e.target.value as any })}
            className="rounded-xl border border-[#e2e8f2] bg-[#fbfcfe] px-3 py-2 text-xs font-semibold text-[#324564] outline-none transition-all hover:bg-white focus:border-[#2854cb] cursor-pointer"
          >
            <option value="all">All KYC</option>
            <option value="Verified">Verified</option>
            <option value="Pending">Pending Review</option>
            <option value="Rejected">Rejected</option>
            <option value="Not Submitted">Not Submitted</option>
          </select>
        </div>

        {/* Owner Type filter if viewing Owners or All */}
        {filters.role !== "buyer" && (
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-[#98a6bb]">Owner Type:</span>
            <select
              value={filters.ownerType || "all"}
              onChange={(e) => onFilterChange({ ownerType: e.target.value as any })}
              className="rounded-xl border border-[#e2e8f2] bg-[#fbfcfe] px-3 py-2 text-xs font-semibold text-[#324564] outline-none transition-all hover:bg-white focus:border-[#2854cb] cursor-pointer"
            >
              <option value="all">All Owner Types</option>
              <option value="Individual Owner">Individual Owner</option>
              <option value="Agent / Broker">Agent</option>
              <option value="Builder / Developer">Builder / Developer</option>
            </select>
          </div>
        )}

        {/* Sort Dropdown */}
        <div className="flex items-center gap-1.5 ml-auto">
          <span className="text-[11px] font-bold text-[#98a6bb]">Sort:</span>
          <select
            value={filters.sortBy}
            onChange={(e) => onFilterChange({ sortBy: e.target.value as any })}
            className="rounded-xl border border-[#e2e8f2] bg-[#fbfcfe] px-3 py-2 text-xs font-semibold text-[#324564] outline-none transition-all hover:bg-white focus:border-[#2854cb] cursor-pointer"
          >
            <option value="recent">Recently Registered</option>
            <option value="name_asc">Name: A to Z</option>
            <option value="listings_desc">Most Listings</option>
            <option value="enquiries_desc">Most Enquiries</option>
          </select>
        </div>
      </div>
    </div>
  );
}
