"use client";

import React, { useState } from "react";
import { X, Plus, Building2, UploadCloud, CheckCircle2 } from "lucide-react";
import { Property, PropertyType, FurnishingStatus, PropertyStatus } from "@/types/property";

interface PropertyAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (newProp: Omit<Property, "id" | "submittedAt" | "updatedAt" | "auditLog">) => void;
}

const sampleImages = [
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1200&q=80",
];

const availableAmenities = [
  "Swimming Pool",
  "State-of-art Gym",
  "24/7 Security",
  "100% Power Backup",
  "Clubhouse",
  "Children's Play Area",
  "EV Charging Station",
  "Covered Car Parking",
  "Intercom Facility",
  "Solar Water Heating",
];

export function PropertyAddModal({ isOpen, onClose, onAdd }: PropertyAddModalProps) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<PropertyType>("Apartment");
  const [bhk, setBhk] = useState(3);
  const [bathrooms, setBathrooms] = useState(3);
  const [balconies, setBalconies] = useState(2);
  const [carpetAreaSqFt, setCarpetAreaSqFt] = useState(1650);
  const [price, setPrice] = useState(11500000);
  const [maintenanceFeeMonthly, setMaintenanceFeeMonthly] = useState(4500);
  const [locality, setLocality] = useState("Adyar");
  const [city, setCity] = useState("Chennai");
  const [address, setAddress] = useState("Plot 12, 1st Cross Avenue");
  const [pincode, setPincode] = useState("600020");
  const [furnishing, setFurnishing] = useState<FurnishingStatus>("Semi-Furnished");
  const [floor, setFloor] = useState("4th of 10 Floors");
  const [facing, setFacing] = useState<any>("East");
  const [parking, setParking] = useState("2 Covered Car Parking");
  const [ageOfProperty, setAgeOfProperty] = useState("New Construction");
  const [possessionStatus, setPossessionStatus] = useState<any>("Ready to Move");
  const [reraId, setReraId] = useState("TN/29/Building/0912/2026");
  const [status, setStatus] = useState<PropertyStatus>("Pending");
  const [ownerName, setOwnerName] = useState("Raghavan S");
  const [ownerPhone, setOwnerPhone] = useState("+91 98400 11223");
  const [ownerEmail, setOwnerEmail] = useState("raghavan.s@gmail.com");
  const [ownerType, setOwnerType] = useState<any>("Individual Owner");
  const [description, setDescription] = useState(
    "Well-designed, spacious luxury property situated in high demand residential corridor with excellent transit and clubhouse amenities."
  );
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([
    "Swimming Pool",
    "State-of-art Gym",
    "24/7 Security",
    "100% Power Backup",
  ]);

  if (!isOpen) return null;

  const toggleAmenity = (name: string) => {
    if (selectedAmenities.includes(name)) {
      setSelectedAmenities(selectedAmenities.filter((a) => a !== name));
    } else {
      setSelectedAmenities([...selectedAmenities, name]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newPropertyData: Omit<Property, "id" | "submittedAt" | "updatedAt" | "auditLog"> = {
      title,
      description,
      type,
      bhk,
      bathrooms,
      balconies,
      carpetAreaSqFt,
      superBuiltUpAreaSqFt: Math.round(carpetAreaSqFt * 1.25),
      price,
      maintenanceFeeMonthly,
      bookingAmount: Math.round(price * 0.05),
      status,
      locality,
      address,
      city,
      state: "Tamil Nadu",
      pincode,
      furnishing,
      floor,
      totalFloors: 10,
      facing,
      parking,
      ageOfProperty,
      possessionStatus,
      possessionDate: "Immediate",
      reraId,
      reraVerified: true,
      featured: false,
      verifiedBadge: false,
      images: sampleImages,
      amenities: selectedAmenities,
      owner: {
        id: `USR-${Math.floor(1000 + Math.random() * 9000)}`,
        name: ownerName,
        phone: ownerPhone,
        email: ownerEmail,
        isKycVerified: true,
        accountType: ownerType,
        joinedDate: "Today",
        totalListings: 1,
      },
      documents: [
        {
          id: "DOC-NEW-1",
          title: "Parent Deed & Title Certificate",
          type: "Title Deed",
          fileUrl: "#",
          fileSize: "3.8 MB",
          status: "Pending",
          uploadedAt: "Today",
        },
      ],
      adminChecklist: {
        legalDocumentsVerified: false,
        pricingValidated: true,
        physicalInspectionDone: false,
        highResolutionPhotos: true,
        ownerIdentityConfirmed: true,
      },
    };

    onAdd(newPropertyData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
      <div className="relative flex max-h-[92vh] w-full max-w-3xl flex-col rounded-3xl border border-[#e2e8f2] bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#f0f3f8] px-6 py-4 bg-[#fbfcfe]">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2854cb] text-white shadow-md">
              <Plus size={20} strokeWidth={2.5} />
            </span>
            <div>
              <h2 className="text-base font-extrabold text-[#17253d]">Add New Property Listing</h2>
              <p className="text-xs text-[#808fa5]">
                Onboard a new residential or commercial property directly into RESTAMP
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

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Section 1: Basic Information */}
          <div className="space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#263752]">
              1. Basic Property Details
            </h3>
            <div>
              <label className="block text-xs font-bold text-[#344560] mb-1">
                Property Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Marina Horizon Luxury Suite"
                className="w-full rounded-xl border border-[#dce3ee] bg-[#fafbfd] px-3.5 py-2 text-xs font-medium text-[#20314b] outline-none focus:border-[#2854cb] focus:bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <label className="block text-xs font-bold text-[#344560] mb-1">Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as PropertyType)}
                  className="w-full rounded-xl border border-[#dce3ee] bg-[#fafbfd] px-3 py-2 text-xs font-semibold text-[#20314b] outline-none focus:border-[#2854cb]"
                >
                  <option value="Apartment">Apartment</option>
                  <option value="Villa">Villa</option>
                  <option value="Independent House">Independent House</option>
                  <option value="Penthouse">Penthouse</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Plot">Plot</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#344560] mb-1">BHK</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={bhk}
                  onChange={(e) => setBhk(parseInt(e.target.value) || 0)}
                  className="w-full rounded-xl border border-[#dce3ee] bg-[#fafbfd] px-3 py-2 text-xs font-medium text-[#20314b] outline-none focus:border-[#2854cb]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#344560] mb-1">Bathrooms</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={bathrooms}
                  onChange={(e) => setBathrooms(parseInt(e.target.value) || 0)}
                  className="w-full rounded-xl border border-[#dce3ee] bg-[#fafbfd] px-3 py-2 text-xs font-medium text-[#20314b] outline-none focus:border-[#2854cb]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#344560] mb-1">Furnishing</label>
                <select
                  value={furnishing}
                  onChange={(e) => setFurnishing(e.target.value as FurnishingStatus)}
                  className="w-full rounded-xl border border-[#dce3ee] bg-[#fafbfd] px-3 py-2 text-xs font-semibold text-[#20314b] outline-none focus:border-[#2854cb]"
                >
                  <option value="Unfurnished">Unfurnished</option>
                  <option value="Semi-Furnished">Semi-Furnished</option>
                  <option value="Fully Furnished">Fully Furnished</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Pricing & Specs */}
          <div className="space-y-4 border-t border-[#f0f3f8] pt-5">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#263752]">
              2. Financials & Dimensions
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-bold text-[#344560] mb-1">
                  Asking Price (INR) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="100000"
                  step="50000"
                  value={price}
                  onChange={(e) => setPrice(parseInt(e.target.value) || 0)}
                  className="w-full rounded-xl border border-[#dce3ee] bg-[#fafbfd] px-3.5 py-2 text-xs font-medium text-[#20314b] outline-none focus:border-[#2854cb]"
                />
                <span className="mt-1 block text-[10px] text-[#8191a8]">
                  Approx: ₹{(price / 10000000).toFixed(2)} Cr
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#344560] mb-1">
                  Carpet Area (sq.ft) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="50"
                  value={carpetAreaSqFt}
                  onChange={(e) => setCarpetAreaSqFt(parseInt(e.target.value) || 0)}
                  className="w-full rounded-xl border border-[#dce3ee] bg-[#fafbfd] px-3.5 py-2 text-xs font-medium text-[#20314b] outline-none focus:border-[#2854cb]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#344560] mb-1">
                  Monthly Maintenance (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={maintenanceFeeMonthly}
                  onChange={(e) => setMaintenanceFeeMonthly(parseInt(e.target.value) || 0)}
                  className="w-full rounded-xl border border-[#dce3ee] bg-[#fafbfd] px-3.5 py-2 text-xs font-medium text-[#20314b] outline-none focus:border-[#2854cb]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <label className="block text-xs font-bold text-[#344560] mb-1">Floor Level</label>
                <input
                  type="text"
                  value={floor}
                  onChange={(e) => setFloor(e.target.value)}
                  className="w-full rounded-xl border border-[#dce3ee] bg-[#fafbfd] px-3 py-2 text-xs font-medium text-[#20314b] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#344560] mb-1">Facing</label>
                <select
                  value={facing}
                  onChange={(e) => setFacing(e.target.value)}
                  className="w-full rounded-xl border border-[#dce3ee] bg-[#fafbfd] px-3 py-2 text-xs font-semibold text-[#20314b] outline-none"
                >
                  <option value="East">East</option>
                  <option value="North">North</option>
                  <option value="South">South</option>
                  <option value="West">West</option>
                  <option value="North-East">North-East</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#344560] mb-1">Parking</label>
                <input
                  type="text"
                  value={parking}
                  onChange={(e) => setParking(e.target.value)}
                  className="w-full rounded-xl border border-[#dce3ee] bg-[#fafbfd] px-3 py-2 text-xs font-medium text-[#20314b] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#344560] mb-1">Initial Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as PropertyStatus)}
                  className="w-full rounded-xl border border-[#dce3ee] bg-[#fafbfd] px-3 py-2 text-xs font-semibold text-[#20314b] outline-none"
                >
                  <option value="Pending">Pending (Needs Review)</option>
                  <option value="Active">Active (Publish Live)</option>
                  <option value="Draft">Draft</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Location */}
          <div className="space-y-4 border-t border-[#f0f3f8] pt-5">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#263752]">
              3. Location & Address
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-bold text-[#344560] mb-1">
                  Locality / Neighborhood <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={locality}
                  onChange={(e) => setLocality(e.target.value)}
                  placeholder="e.g. Adyar, Anna Nagar"
                  className="w-full rounded-xl border border-[#dce3ee] bg-[#fafbfd] px-3.5 py-2 text-xs font-medium text-[#20314b] outline-none focus:border-[#2854cb]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#344560] mb-1">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full rounded-xl border border-[#dce3ee] bg-[#fafbfd] px-3.5 py-2 text-xs font-medium text-[#20314b] outline-none focus:border-[#2854cb]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#344560] mb-1">Pincode</label>
                <input
                  type="text"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  className="w-full rounded-xl border border-[#dce3ee] bg-[#fafbfd] px-3.5 py-2 text-xs font-medium text-[#20314b] outline-none focus:border-[#2854cb]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#344560] mb-1">Street Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full rounded-xl border border-[#dce3ee] bg-[#fafbfd] px-3.5 py-2 text-xs font-medium text-[#20314b] outline-none"
              />
            </div>
          </div>

          {/* Section 4: Owner Information */}
          <div className="space-y-4 border-t border-[#f0f3f8] pt-5">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#263752]">
              4. Owner / Lister Contact
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-[#344560] mb-1">
                  Owner Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  className="w-full rounded-xl border border-[#dce3ee] bg-[#fafbfd] px-3.5 py-2 text-xs font-medium text-[#20314b] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#344560] mb-1">Phone Number</label>
                <input
                  type="text"
                  required
                  value={ownerPhone}
                  onChange={(e) => setOwnerPhone(e.target.value)}
                  className="w-full rounded-xl border border-[#dce3ee] bg-[#fafbfd] px-3.5 py-2 text-xs font-medium text-[#20314b] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#344560] mb-1">Account Type</label>
                <select
                  value={ownerType}
                  onChange={(e) => setOwnerType(e.target.value)}
                  className="w-full rounded-xl border border-[#dce3ee] bg-[#fafbfd] px-3 py-2 text-xs font-semibold text-[#20314b] outline-none"
                >
                  <option value="Individual Owner">Individual Owner</option>
                  <option value="Agent / Broker">Agent</option>
                  <option value="Builder / Developer">Builder / Developer</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 5: Amenities */}
          <div className="space-y-3 border-t border-[#f0f3f8] pt-5">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#263752]">
              5. Amenities & Facilities
            </h3>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {availableAmenities.map((amenity) => {
                const checked = selectedAmenities.includes(amenity);
                return (
                  <button
                    key={amenity}
                    type="button"
                    onClick={() => toggleAmenity(amenity)}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs font-semibold transition-all ${
                      checked
                        ? "border-[#2854cb] bg-[#eff4ff] text-[#2854cb]"
                        : "border-[#e2e8f2] bg-white text-[#6b7b92] hover:bg-[#f8fafc]"
                    }`}
                  >
                    <CheckCircle2
                      size={14}
                      className={checked ? "text-[#2854cb]" : "text-slate-300"}
                    />
                    <span>{amenity}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-2.5 border-t border-[#f0f3f8] pt-5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#dbe2ee] px-4 py-2 text-xs font-semibold text-[#576882] hover:bg-[#f8fafc]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#2854cb] px-5 py-2 text-xs font-bold text-white shadow-[0_4px_12px_#2854cb35] hover:bg-[#1f45ae] transition-all"
            >
              <Plus size={16} strokeWidth={2.5} />
              <span>Create Property Listing</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
