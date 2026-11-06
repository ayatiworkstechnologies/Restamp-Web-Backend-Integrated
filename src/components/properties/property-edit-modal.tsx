"use client";

import React, { useState, useEffect } from "react";
import { X, Save, Edit } from "lucide-react";
import { Property, PropertyStatus, PropertyType, FurnishingStatus } from "@/types/property";

interface PropertyEditModalProps {
  property: Property | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, updates: Partial<Property>) => void;
}

const propertyTypes: PropertyType[] = [
  "Apartment",
  "Villa",
  "Independent House",
  "Penthouse",
  "Commercial",
  "Plot",
];

const statuses: PropertyStatus[] = ["Pending", "Active", "Rejected", "Draft"];
const furnishings: FurnishingStatus[] = ["Unfurnished", "Semi-Furnished", "Fully Furnished"];

export function PropertyEditModal({
  property,
  isOpen,
  onClose,
  onSave,
}: PropertyEditModalProps) {
  const [formData, setFormData] = useState<Partial<Property>>({});

  useEffect(() => {
    if (property) {
      setFormData({
        title: property.title,
        type: property.type,
        bhk: property.bhk,
        price: property.price,
        maintenanceFeeMonthly: property.maintenanceFeeMonthly || 0,
        carpetAreaSqFt: property.carpetAreaSqFt,
        status: property.status,
        locality: property.locality,
        city: property.city,
        address: property.address,
        furnishing: property.furnishing,
        description: property.description,
        featured: property.featured,
        verifiedBadge: property.verifiedBadge,
      });
    }
  }, [property]);

  if (!isOpen || !property) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(property.id, formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm animate-fade-in">
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-[#e2e8f2] bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#f0f3f8] px-6 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#eef4ff] text-[#2854cb]">
              <Edit size={18} />
            </span>
            <div>
              <h2 className="text-base font-extrabold text-[#17253d]">Edit Property Details</h2>
              <p className="text-xs text-[#808fa5]">
                Updating <span className="font-semibold">{property.id}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#344560] mb-1">Property Title</label>
            <input
              type="text"
              required
              value={formData.title || ""}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full rounded-xl border border-[#dce3ee] bg-[#fafbfd] px-3.5 py-2 text-xs font-medium text-[#20314b] outline-none focus:border-[#2854cb] focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-bold text-[#344560] mb-1">Property Type</label>
              <select
                value={formData.type || "Apartment"}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as PropertyType })}
                className="w-full rounded-xl border border-[#dce3ee] bg-[#fafbfd] px-3 py-2 text-xs font-semibold text-[#20314b] outline-none focus:border-[#2854cb] focus:bg-white"
              >
                {propertyTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#344560] mb-1">Bedrooms (BHK)</label>
              <input
                type="number"
                min="0"
                max="10"
                value={formData.bhk ?? 0}
                onChange={(e) => setFormData({ ...formData, bhk: parseInt(e.target.value) || 0 })}
                className="w-full rounded-xl border border-[#dce3ee] bg-[#fafbfd] px-3.5 py-2 text-xs font-medium text-[#20314b] outline-none focus:border-[#2854cb] focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#344560] mb-1">Listing Status</label>
              <select
                value={formData.status || "Pending"}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as PropertyStatus })
                }
                className="w-full rounded-xl border border-[#dce3ee] bg-[#fafbfd] px-3 py-2 text-xs font-semibold text-[#20314b] outline-none focus:border-[#2854cb] focus:bg-white"
              >
                {statuses.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-bold text-[#344560] mb-1">
                Price (INR)
              </label>
              <input
                type="number"
                required
                min="100000"
                step="50000"
                value={formData.price ?? 0}
                onChange={(e) =>
                  setFormData({ ...formData, price: parseInt(e.target.value) || 0 })
                }
                className="w-full rounded-xl border border-[#dce3ee] bg-[#fafbfd] px-3.5 py-2 text-xs font-medium text-[#20314b] outline-none focus:border-[#2854cb] focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#344560] mb-1">
                Carpet Area (sq.ft)
              </label>
              <input
                type="number"
                required
                min="100"
                value={formData.carpetAreaSqFt ?? 0}
                onChange={(e) =>
                  setFormData({ ...formData, carpetAreaSqFt: parseInt(e.target.value) || 0 })
                }
                className="w-full rounded-xl border border-[#dce3ee] bg-[#fafbfd] px-3.5 py-2 text-xs font-medium text-[#20314b] outline-none focus:border-[#2854cb] focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#344560] mb-1">Furnishing</label>
              <select
                value={formData.furnishing || "Semi-Furnished"}
                onChange={(e) =>
                  setFormData({ ...formData, furnishing: e.target.value as FurnishingStatus })
                }
                className="w-full rounded-xl border border-[#dce3ee] bg-[#fafbfd] px-3 py-2 text-xs font-semibold text-[#20314b] outline-none focus:border-[#2854cb] focus:bg-white"
              >
                {furnishings.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-[#344560] mb-1">Locality</label>
              <input
                type="text"
                required
                value={formData.locality || ""}
                onChange={(e) => setFormData({ ...formData, locality: e.target.value })}
                className="w-full rounded-xl border border-[#dce3ee] bg-[#fafbfd] px-3.5 py-2 text-xs font-medium text-[#20314b] outline-none focus:border-[#2854cb] focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#344560] mb-1">City</label>
              <input
                type="text"
                required
                value={formData.city || ""}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full rounded-xl border border-[#dce3ee] bg-[#fafbfd] px-3.5 py-2 text-xs font-medium text-[#20314b] outline-none focus:border-[#2854cb] focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#344560] mb-1">Full Street Address</label>
            <input
              type="text"
              value={formData.address || ""}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full rounded-xl border border-[#dce3ee] bg-[#fafbfd] px-3.5 py-2 text-xs font-medium text-[#20314b] outline-none focus:border-[#2854cb] focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#344560] mb-1">Description</label>
            <textarea
              rows={3}
              value={formData.description || ""}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full rounded-xl border border-[#dce3ee] bg-[#fafbfd] p-2.5 text-xs text-[#20314b] outline-none focus:border-[#2854cb] focus:bg-white"
            />
          </div>

          <div className="flex flex-wrap items-center gap-6 rounded-xl border border-[#edf1f8] bg-[#fbfcfe] p-3">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[#2e3e57]">
              <input
                type="checkbox"
                checked={!!formData.featured}
                onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                className="rounded border-gray-300 text-[#2854cb]"
              />
              <span>Featured Listing</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[#2e3e57]">
              <input
                type="checkbox"
                checked={!!formData.verifiedBadge}
                onChange={(e) => setFormData({ ...formData, verifiedBadge: e.target.checked })}
                className="rounded border-gray-300 text-[#2854cb]"
              />
              <span>RESTAMP Verified Badge</span>
            </label>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-2.5 border-t border-[#f0f3f8] pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#dbe2ee] px-4 py-2 text-xs font-semibold text-[#576882] hover:bg-[#f8fafc]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#2854cb] px-4 py-2 text-xs font-bold text-white shadow-[0_4px_12px_#2854cb35] hover:bg-[#1f45ae] transition-all"
            >
              <Save size={15} />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
