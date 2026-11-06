"use client";

import React, { useState } from "react";
import {
  Save,
  Shield,
  Bell,
  Building,
  Lock,
  Globe,
  Sliders,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import { PlatformSettings } from "@/types/settings";
import { useSettingsStore } from "@/context/settings-context";

export function PlatformConfigView() {
  const { platformSettings, updatePlatformSettings, resetToDefaultSettings } =
    useSettingsStore();

  const [formData, setFormData] = useState<PlatformSettings>(platformSettings);

  const handleChange = (key: keyof PlatformSettings, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updatePlatformSettings(formData);
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* 1. General Marketplace Settings */}
      <div className="rounded-2xl border border-[#e8ecf4] bg-white p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 border-b border-[#f1f4f9] pb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#f0f4ff] text-[#162d66]">
            <Globe className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-[#101828]">
              General Platform Information
            </h3>
            <p className="text-xs text-[#64748b]">
              Platform branding, public support contacts, and localization.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-medium text-[#334155] mb-1">
              Platform Brand Name
            </label>
            <input
              type="text"
              value={formData.platformName}
              onChange={(e) => handleChange("platformName", e.target.value)}
              className="w-full rounded-xl border border-[#e8ecf4] p-2.5 text-xs text-[#101828] focus:border-[#162d66] focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-medium text-[#334155] mb-1">
              Platform Tagline
            </label>
            <input
              type="text"
              value={formData.tagline}
              onChange={(e) => handleChange("tagline", e.target.value)}
              className="w-full rounded-xl border border-[#e8ecf4] p-2.5 text-xs text-[#101828] focus:border-[#162d66] focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-medium text-[#334155] mb-1">
              Public Support Email
            </label>
            <input
              type="email"
              value={formData.supportEmail}
              onChange={(e) => handleChange("supportEmail", e.target.value)}
              className="w-full rounded-xl border border-[#e8ecf4] p-2.5 text-xs text-[#101828] focus:border-[#162d66] focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-medium text-[#334155] mb-1">
              Support Hotline Phone
            </label>
            <input
              type="text"
              value={formData.supportPhone}
              onChange={(e) => handleChange("supportPhone", e.target.value)}
              className="w-full rounded-xl border border-[#e8ecf4] p-2.5 text-xs text-[#101828] focus:border-[#162d66] focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-medium text-[#334155] mb-1">
              Currency & Symbol
            </label>
            <input
              type="text"
              value={formData.currency}
              onChange={(e) => handleChange("currency", e.target.value)}
              className="w-full rounded-xl border border-[#e8ecf4] p-2.5 text-xs text-[#101828] focus:border-[#162d66] focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-medium text-[#334155] mb-1">
              Timezone & Headquarters City
            </label>
            <input
              type="text"
              value={formData.defaultCity}
              onChange={(e) => handleChange("defaultCity", e.target.value)}
              className="w-full rounded-xl border border-[#e8ecf4] p-2.5 text-xs text-[#101828] focus:border-[#162d66] focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* 2. Listing & Compliance Rules */}
      <div className="rounded-2xl border border-[#e8ecf4] bg-white p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 border-b border-[#f1f4f9] pb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#ecfdf5] text-[#059669]">
            <Building className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-[#101828]">
              Listing & Regulatory Compliance Rules
            </h3>
            <p className="text-xs text-[#64748b]">
              Enforce document checks, RERA registration, and inventory quality standards.
            </p>
          </div>
        </div>

        <div className="space-y-3 divide-y divide-[#f8fafc]">
          {/* Require KYC */}
          <div className="flex items-center justify-between pt-2 text-xs">
            <div>
              <span className="font-semibold text-[#101828]">
                Mandatory Owner KYC Verification
              </span>
              <p className="text-[11px] text-[#64748b]">
                Property owners must submit Aadhaar and proof of ownership before listings can be approved.
              </p>
            </div>
            <input
              type="checkbox"
              checked={formData.requireOwnerKyc}
              onChange={(e) => handleChange("requireOwnerKyc", e.target.checked)}
              className="h-4 w-4 rounded border-[#cbd5e1] text-[#162d66] cursor-pointer"
            />
          </div>

          {/* Require RERA */}
          <div className="flex items-center justify-between pt-3 text-xs">
            <div>
              <span className="font-semibold text-[#101828]">
                Enforce TNRERA / State RERA Registration ID
              </span>
              <p className="text-[11px] text-[#64748b]">
                Requires valid RERA project registration number for all new developments and builder listings.
              </p>
            </div>
            <input
              type="checkbox"
              checked={formData.requireReraNumber}
              onChange={(e) => handleChange("requireReraNumber", e.target.checked)}
              className="h-4 w-4 rounded border-[#cbd5e1] text-[#162d66] cursor-pointer"
            />
          </div>

          {/* Direct Contact */}
          <div className="flex items-center justify-between pt-3 text-xs">
            <div>
              <span className="font-semibold text-[#101828]">
                Direct Buyer-to-Owner Contact Sharing
              </span>
              <p className="text-[11px] text-[#64748b]">
                When enabled, verified buyers can view owner contact info directly without admin mediation.
              </p>
            </div>
            <input
              type="checkbox"
              checked={formData.allowDirectOwnerContact}
              onChange={(e) =>
                handleChange("allowDirectOwnerContact", e.target.checked)
              }
              className="h-4 w-4 rounded border-[#cbd5e1] text-[#162d66] cursor-pointer"
            />
          </div>

          {/* Max Images & Expiry */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 text-xs">
            <div>
              <label className="block font-medium text-[#334155] mb-1">
                Max Upload Images per Listing
              </label>
              <input
                type="number"
                min={5}
                max={30}
                value={formData.maxImagesPerListing}
                onChange={(e) =>
                  handleChange("maxImagesPerListing", parseInt(e.target.value) || 15)
                }
                className="w-full rounded-xl border border-[#e8ecf4] p-2 text-xs text-[#101828] focus:border-[#162d66] focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-medium text-[#334155] mb-1">
                Listing Expiration Duration (Days)
              </label>
              <input
                type="number"
                min={30}
                max={365}
                value={formData.autoExpireDays}
                onChange={(e) =>
                  handleChange("autoExpireDays", parseInt(e.target.value) || 90)
                }
                className="w-full rounded-xl border border-[#e8ecf4] p-2 text-xs text-[#101828] focus:border-[#162d66] focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Notifications & Lead Dispatch */}
      <div className="rounded-2xl border border-[#e8ecf4] bg-white p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 border-b border-[#f1f4f9] pb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#fff4e6] text-[#ea580c]">
            <Bell className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-[#101828]">
              Automated Communications & Lead Dispatch
            </h3>
            <p className="text-xs text-[#64748b]">
              Configure automated notifications to buyers, property owners, and operations staff.
            </p>
          </div>
        </div>

        <div className="space-y-3 divide-y divide-[#f8fafc] text-xs">
          <div className="flex items-center justify-between pt-2">
            <div>
              <span className="font-semibold text-[#101828]">
                Owner Email Notifications
              </span>
              <p className="text-[11px] text-[#64748b]">
                Immediately dispatch an email to the property owner whenever a buyer submits an inquiry.
              </p>
            </div>
            <input
              type="checkbox"
              checked={formData.emailNotifications}
              onChange={(e) =>
                handleChange("emailNotifications", e.target.checked)
              }
              className="h-4 w-4 rounded border-[#cbd5e1] text-[#162d66] cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between pt-3">
            <div>
              <span className="font-semibold text-[#101828]">
                WhatsApp Direct Lead Alerts
              </span>
              <p className="text-[11px] text-[#64748b]">
                Send instant WhatsApp template message with buyer details to listing owners.
              </p>
            </div>
            <input
              type="checkbox"
              checked={formData.whatsappAlerts}
              onChange={(e) => handleChange("whatsappAlerts", e.target.checked)}
              className="h-4 w-4 rounded border-[#cbd5e1] text-[#162d66] cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between pt-3">
            <div>
              <span className="font-semibold text-[#101828]">
                Admin Daily Digest Email
              </span>
              <p className="text-[11px] text-[#64748b]">
                Send morning operational email summarizing new listings, pending approvals, and active leads.
              </p>
            </div>
            <input
              type="checkbox"
              checked={formData.adminDailyDigest}
              onChange={(e) => handleChange("adminDailyDigest", e.target.checked)}
              className="h-4 w-4 rounded border-[#cbd5e1] text-[#162d66] cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* 4. Security & Access Control */}
      <div className="rounded-2xl border border-[#e8ecf4] bg-white p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 border-b border-[#f1f4f9] pb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#ede9fe] text-[#7c3aed]">
            <Lock className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-[#101828]">
              Security & Staff Access Policies
            </h3>
            <p className="text-xs text-[#64748b]">
              Authentication policies, session timeouts, and IP whitelisting.
            </p>
          </div>
        </div>

        <div className="space-y-3 divide-y divide-[#f8fafc] text-xs">
          <div className="flex items-center justify-between pt-2">
            <div>
              <span className="font-semibold text-[#101828]">
                Enforce Two-Factor Authentication (2FA) for All Staff
              </span>
              <p className="text-[11px] text-[#64748b]">
                Requires staff to link Google Authenticator / Authy before accessing the admin console.
              </p>
            </div>
            <input
              type="checkbox"
              checked={formData.enforce2FA}
              onChange={(e) => handleChange("enforce2FA", e.target.checked)}
              className="h-4 w-4 rounded border-[#cbd5e1] text-[#162d66] cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between pt-3">
            <div>
              <span className="font-semibold text-[#101828]">
                Admin Session Inactivity Timeout
              </span>
              <p className="text-[11px] text-[#64748b]">
                Automatically log out inactive administrative browser sessions.
              </p>
            </div>
            <select
              value={formData.sessionTimeoutMinutes}
              onChange={(e) =>
                handleChange(
                  "sessionTimeoutMinutes",
                  parseInt(e.target.value) || 30
                )
              }
              className="rounded-xl border border-[#e8ecf4] bg-white px-3 py-1.5 text-xs text-[#101828] focus:border-[#162d66] focus:outline-none"
            >
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={60}>1 hour</option>
              <option value={120}>2 hours</option>
            </select>
          </div>

          {/* Maintenance Mode Alert */}
          <div className="flex items-center justify-between pt-3">
            <div>
              <span className="font-semibold text-[#ef4444] flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4" />
                Platform Maintenance Mode
              </span>
              <p className="text-[11px] text-[#64748b]">
                When active, public marketplace shows a maintenance banner. Only authenticated admin staff can browse.
              </p>
            </div>
            <input
              type="checkbox"
              checked={formData.maintenanceMode}
              onChange={(e) => handleChange("maintenanceMode", e.target.checked)}
              className="h-4 w-4 rounded border-[#cbd5e1] text-[#ef4444] cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Save Action Bar */}
      <div className="flex items-center justify-between rounded-2xl border border-[#e8ecf4] bg-white p-4 shadow-sm">
        <button
          type="button"
          onClick={resetToDefaultSettings}
          className="inline-flex items-center gap-1.5 rounded-xl border border-[#e8ecf4] bg-white px-3 py-2 text-xs font-semibold text-[#64748b] hover:bg-[#f8fafc] hover:text-[#101828]"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Reset Defaults</span>
        </button>

        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-xl bg-[#162d66] px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#0f1f47] transition-colors"
        >
          <Save className="h-4 w-4" />
          <span>Save Platform Configuration</span>
        </button>
      </div>
    </form>
  );
}
