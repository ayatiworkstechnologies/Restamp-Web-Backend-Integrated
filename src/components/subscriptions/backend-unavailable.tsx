"use client";

import React from "react";
import { AlertTriangle, Database, Info } from "lucide-react";

interface BackendUnavailableProps {
  title: string;
  section: string;
  neededEndpoints: string[];
  existingCapabilities?: string[];
  note?: string;
}

export function BackendUnavailable({ title, section, neededEndpoints, existingCapabilities, note }: BackendUnavailableProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[#eef2f7] bg-[#fbfcfe] p-6 sm:p-7">
        <div className="flex items-start gap-3">
          <AlertTriangle size={20} className="mt-0.5 shrink-0 text-[#b45309]" />
          <div className="min-w-0">
            <h2 className="text-[18px] font-extrabold tracking-[-0.02em] text-[#1f2e48]">{title}</h2>
            <p className="mt-1 text-xs text-[#8896aa]">Awaiting backend support · {section}</p>
          </div>
        </div>
        {note && <p className="mt-3 text-sm text-[#4b5b74]">{note}</p>}
        <div className="mt-5 rounded-xl border border-[#fde68a] bg-[#fffbeb] p-4 sm:p-5">
          <div className="flex items-start gap-2.5">
            <Info size={16} className="mt-0.5 shrink-0 text-[#92400e]" />
            <div className="text-xs text-[#92400e] leading-relaxed">
              <strong>No backend API exists for this section.</strong> The latest source UI renders tables, forms and actions from
              browser (localStorage) storage in the source repository. Those records have intentionally <em>not</em> been ported: no
              matching backend endpoint exists in this application, and no fake or simulated subscription, payment or notification data
              is displayed or stored here.
            </div>
          </div>
        </div>
        <div className="mt-5">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#8896aa]">Backend endpoints needed:</h3>
          <ul className="mt-1.5 space-y-1 text-sm text-[#4b5b74]">
            {neededEndpoints.map((ep) => (
              <li key={ep} className="flex items-start gap-2">
                <span className="mt-0.5 shrink-0 text-[10px] text-[#b45309]">▸</span>
                <span>{ep}</span>
              </li>
            ))}
          </ul>
        </div>
        {existingCapabilities && existingCapabilities.length > 0 && (
          <div className="mt-5">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#8896aa]">Related existing backend capabilities:</h3>
            <ul className="mt-1.5 space-y-1 text-sm text-[#4b5b74]">
              {existingCapabilities.map((cap) => (
                <li key={cap} className="flex items-start gap-2">
                  <span className="mt-0.5 shrink-0 text-[10px]">▸</span>
                  <span>{cap}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="mt-5 rounded-xl border border-[#e8ecf4] bg-white p-4">
          <div className="flex items-center gap-2.5">
            <Database size={16} className="shrink-0 text-[#6b7b93]" />
            <span className="text-xs text-[#6b7b93]">Read-only placeholder — no subscription, payment or notification records are displayed or stored.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
