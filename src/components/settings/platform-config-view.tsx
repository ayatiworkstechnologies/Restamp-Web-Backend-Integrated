"use client";

import React from "react";
import { Sliders, Lock } from "lucide-react";

const SECTIONS = [
  { title: "General Platform Information", desc: "Platform name, support contacts, currency, timezone and default city." },
  { title: "Listing & Regulatory Compliance Rules", desc: "Owner KYC requirement, RERA numbers, photo limits and listing expiry." },
  { title: "Automated Communications & Lead Dispatch", desc: "Email, SMS and WhatsApp notifications to owners and buyers." },
  { title: "Security & Staff Access Policies", desc: "Two-factor sign-in, session length and IP restrictions for staff." },
];

/**
 * Platform configuration has no backend storage yet, so nothing here can be
 * changed or saved; the sections are listed so the planned scope is visible.
 */
export function PlatformConfigView() {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[#fde68a] bg-[#fffbeb] p-4 text-sm text-[#92400e]">
        Platform configuration is not available yet. There is no backend to store these settings, so they cannot be viewed or changed here.
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {SECTIONS.map((s) => (
          <div key={s.title} className="rounded-2xl border border-[#e8ecf4] bg-white p-5 opacity-70 shadow-sm" title="Not available yet">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-bold text-[#101828]">
                <Sliders className="h-4 w-4 text-[#162d66]" /> {s.title}
              </h3>
              <Lock className="h-4 w-4 text-[#94a3b8]" />
            </div>
            <p className="mt-2 text-xs text-[#64748b]">{s.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
