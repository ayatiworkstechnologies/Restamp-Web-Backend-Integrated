"use client";

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Camera,
  ImagePlus,
  X,
  Minus,
  Plus,
  MapPin,
  Pencil,
  CircleCheck,
  Save,
  Loader2,
} from 'lucide-react';
import {
  clearDraft,
  emptyListing,
  getDraft,
  saveDraft,
  type ListingPhoto,
  type OwnerListing,
  type PhotoCategory,
} from '@/lib/ownerListings';
import {
  asksBhk as needsBhk,
  BACKEND_PHOTO_CATEGORIES,
  bedroomCount,
  createOwnerListing,
  dataUrlToBlob,
  durationToMonths,
  isPlotListing as isPlot,
  uploadListingPhoto,
} from '@/lib/api/owner';
import { errorMessage } from '@/lib/api/client';
import { getSession, loginHref } from '@/lib/api/session';

/* ---------- Options (taken from the Restamp owner app) ---------- */

const purposes = [
  { value: 'Sell', label: 'Sell' },
  { value: 'Resale', label: 'Resale' },
  { value: 'Rent', label: 'Rent' },
  { value: 'Lease', label: 'Lease' },
] as const;

const propertyTypes = {
  Residential: ['Apartment', 'Studio Apartment', 'Builder Floor', 'Independent House / Villa', 'Plot / Land', 'PG / Co-living'],
  Commercial: ['Office', 'Shop', 'Showroom', 'Commercial Building', 'Warehouse / Godown', 'Commercial Land', 'Co-working Space'],
};

const bhkOptions = ['1 RK', '1 BHK', '2 BHK', '3 BHK', '4 BHK', '5 BHK', '5+ BHK'];
const availabilityOptions = ['Ready to Move', 'Under Construction', 'New Launch'];
const ageOptions = ['0-1 Years', '1-5 Years', '5-10 Years', '10+ Years'];
const furnishingOptions = ['Unfurnished', 'Semi-Furnished', 'Furnished'];
const frequencyOptions = ['Monthly', 'Quarterly', 'Yearly'];
const tenantOptions = ['Family', 'Bachelor', 'Company', 'Any'];
const ownershipOptions = ['Freehold', 'Leasehold', 'Co-operative Society', 'Power of Attorney'];
const facingOptions = ['North', 'South', 'East', 'West', 'North-East', 'North-West', 'South-East', 'South-West'];
const overlookingOptions = ['Park', 'Pool', 'Club', 'Main Road', 'Sea Facing'];
const openSidesOptions = ['1', '2', '3', '4'];
const photoCategories: PhotoCategory[] = [
  'Exterior',
  'Living Room',
  'Bedroom',
  'Kitchen',
  'Bathroom',
  'Balcony',
  'Floor Plan',
  'Other Rooms',
];

const featureOptions = [
  'Recently Renovated',
  'Vastu Compliant',
  'High Ceiling',
  'False Ceiling Lighting',
  'Corner Property',
  'Pet Friendly',
  'RERA Approved',
  'Brand New Construction',
  'Gated Community',
  'Modular Kitchen',
  'Solar Water Heater',
  'EV Charging Station',
  'Wheelchair Accessible',
  'Servant Quarters',
  'Natural Daylight',
  'Private Terrace',
];

const amenityOptions = [
  'Lift',
  'Security Guard',
  'CCTV',
  'Club House',
  'Gym',
  'Power Backup',
  'Park',
  'Swimming Pool',
  'Visitor Parking',
  'Intercom',
  "Children's Play Area",
  'Fire Fighting System',
  'Rainwater Harvesting',
  'Piped Gas',
  'Community Hall',
  'Waste Disposal',
];

// Options the backend does not accept yet are shown but cannot be selected.
const UNAVAILABLE_FEATURES = ['RERA Approved', 'Brand New Construction'];
const UNAVAILABLE_PHOTO_CATEGORIES = photoCategories.filter((c) => !BACKEND_PHOTO_CATEGORIES.includes(c));
const MAX_PHOTOS = 20;

const steps = ['Basic', 'Location', 'Property Details', 'Pricing', 'Photos & Details', 'Review'];

const PINCODE_MIN = 600001;
const PINCODE_MAX = 600118;
const COLLAPSED_COUNT = 8;

type Errors = Partial<Record<keyof OwnerListing, string>>;

const isRental = (l: OwnerListing) => l.purpose === 'Rent' || l.purpose === 'Lease';

/** Review label for the bedroom count that will be saved (Bedrooms first, then BHK). */
function bedroomsLabel(l: OwnerListing): string {
  const n = bedroomCount(l);
  if (n === null) return '';
  return l.bedrooms ? l.bedrooms : `${n} (from ${l.bhk})`;
}

/** Both chosen and they disagree: the Bedrooms value is what gets saved. */
function bedroomsDifferFromBhk(l: OwnerListing): boolean {
  if (!l.bedrooms || !needsBhk(l) || !l.bhk) return false;
  return parseInt(l.bedrooms, 10) !== parseInt(l.bhk, 10);
}

function validate(step: number, l: OwnerListing): Errors {
  const e: Errors = {};
  if (step === 0) {
    if (!l.propertyType) e.propertyType = 'Please select a property type';
    if (needsBhk(l) && !l.bhk) e.bhk = 'Please select a BHK configuration';
    if (l.phone.replace(/\D/g, '').length < 8) e.phone = 'Please enter a valid phone number (at least 8 digits)';
    if (l.email && !/^\S+@\S+\.\S+$/.test(l.email)) e.email = 'Please enter a valid email address';
  }
  if (step === 1) {
    if (!l.city.trim()) e.city = 'City is required';
    if (!l.district.trim()) e.district = 'District is required';
    if (!l.locality.trim()) e.locality = 'Locality is required';
    const pin = Number(l.pincode);
    if (!l.pincode) e.pincode = 'Pincode is required';
    else if (!(pin >= PINCODE_MIN && pin <= PINCODE_MAX))
      e.pincode = `Please enter a valid pincode between ${PINCODE_MIN} and ${PINCODE_MAX}.`;
  }
  if (step === 2) {
    if (!(Number(l.carpetArea) > 0)) e.carpetArea = 'Enter a valid carpet area in sq.ft';
    if (!isPlot(l)) {
      if (!l.totalFloors) e.totalFloors = 'Total floors in building is required';
      if (!l.floor) e.floor = 'Property on floor is required';
    }
  }
  if (step === 3) {
    if (!(Number(l.price) > 0))
      e.price = isRental(l)
        ? 'Enter a valid monthly rent amount'
        : l.purpose === 'Resale'
          ? 'Enter a valid resale price'
          : 'Enter a valid expected price';
    if (isRental(l) && !l.securityDeposit) e.securityDeposit = 'Security deposit amount is required';
    if (isRental(l) && !l.availableFrom) e.availableFrom = 'Available from date is required';
    if (isRental(l) && Number.isNaN(durationToMonths(l.lockInPeriod)))
      e.lockInPeriod = "Enter the lock-in like '6 months' or '1 year'";
    if (isRental(l) && Number.isNaN(durationToMonths(l.agreementDuration)))
      e.agreementDuration = "Enter the tenure like '11 months' or '2 years'";
  }
  if (step === 4) {
    if (l.photos.length === 0) e.photos = 'Please add at least one property photo';
    else if (l.photos.length > MAX_PHOTOS) e.photos = `Please keep it to ${MAX_PHOTOS} photos or fewer`;
    else if (l.photos.some((p) => !BACKEND_PHOTO_CATEGORIES.includes(p.category)))
      e.photos = 'Remove photos tagged "Other Rooms" (that category is not available yet)';
    else if (l.features.some((f) => UNAVAILABLE_FEATURES.includes(f)))
      e.photos = 'Remove the features marked "not available yet"';
    if (l.description.trim().length < 10) e.description = 'Please add a description (at least 10 characters)';
  }
  return e;
}

const formatINR = (value: string) => {
  const n = Number(value);
  if (!n) return '—';
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(2).replace(/\.00$/, '')} Cr`;
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(2).replace(/\.00$/, '')} L`;
  return `₹${n.toLocaleString('en-IN')}`;
};

// Shrinks photos so a listing fits in browser storage
function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read the selected photo. Please try selecting it again.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Could not read the selected photo. Please try selecting it again.'));
      img.onload = () => {
        const scale = Math.min(1, 1200 / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.72));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/* ---------- Small form building blocks ---------- */

function Field({
  label,
  hint,
  error,
  optional,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">
        {label}
        {optional && <span className="font-normal text-slate-400"> (Optional)</span>}
      </span>
      <div className="mt-1.5">{children}</div>
      {error ? (
        <p className="mt-1 text-xs text-red-500">{error}</p>
      ) : (
        hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>
      )}
    </label>
  );
}

const inputClass = (error?: string) =>
  `w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-2 ${
    error
      ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
      : 'border-slate-200 focus:border-[#087ed9] focus:ring-[#087ed9]/20'
  }`;

function TextInput({
  value,
  onChange,
  error,
  prefix,
  ...rest
}: { value: string; onChange: (v: string) => void; error?: string; prefix?: string } & Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'value' | 'onChange' | 'prefix'
>) {
  if (prefix) {
    return (
      <div className={`flex items-center gap-2 ${inputClass(error)} focus-within:ring-2`}>
        <span className="text-slate-500">{prefix}</span>
        <input {...rest} value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-transparent outline-none" />
      </div>
    );
  }
  return <input {...rest} value={value} onChange={(e) => onChange(e.target.value)} className={inputClass(error)} />;
}

function Chips({
  options,
  value,
  onChange,
  error,
  disabled = [],
}: {
  options: readonly string[];
  value: string | string[];
  onChange: (v: string) => void;
  error?: string;
  disabled?: readonly string[];
}) {
  const selected = (o: string) => (Array.isArray(value) ? value.includes(o) : value === o);
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          disabled={disabled.includes(o) && !selected(o)}
          title={disabled.includes(o) ? 'Not available yet' : undefined}
          onClick={() => onChange(o)}
          className={`disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-medium transition cursor-pointer ${
            selected(o)
              ? 'border-[#087ed9] bg-sky-50 text-[#087ed9]'
              : error
                ? 'border-red-200 bg-white text-slate-700 hover:border-slate-300'
                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
          }`}
        >
          {Array.isArray(value) && selected(o) && <Check size={13} />}
          {o}
        </button>
      ))}
    </div>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
        {[true, false].map((v) => (
          <button
            key={String(v)}
            type="button"
            onClick={() => onChange(v)}
            className={`rounded-md px-4 py-1 text-xs font-semibold transition cursor-pointer ${
              value === v ? 'bg-white text-[#087ed9] shadow-xs' : 'text-slate-500'
            }`}
          >
            {v ? 'Yes' : 'No'}
          </button>
        ))}
      </div>
    </div>
  );
}

function Counter({ label, hint, value, onChange }: { label: string; hint: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3">
      <div>
        <p className="text-sm font-medium text-slate-700">{label}</p>
        <p className="text-xs text-slate-400">{hint}</p>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label={`Fewer ${label}`}
          onClick={() => onChange(Math.max(0, value - 1))}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-600 hover:border-[#087ed9] hover:text-[#087ed9] transition cursor-pointer"
        >
          <Minus size={14} />
        </button>
        <span className="w-4 text-center text-sm font-semibold text-slate-900">{value}</span>
        <button
          type="button"
          aria-label={`More ${label}`}
          onClick={() => onChange(value + 1)}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-600 hover:border-[#087ed9] hover:text-[#087ed9] transition cursor-pointer"
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-slate-100 pt-6 first:border-0 first:pt-0">
      <h3 className="font-bold text-slate-900">{title}</h3>
      {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
      <div className="mt-4 space-y-5">{children}</div>
    </section>
  );
}

/* ---------- Wizard ---------- */

export default function PostPropertyWizard({
  doneHref = '/',
  doneLabel = 'Back to home',
  initialPurpose,
  initialCategory,
  initialPropertyType,
  initialPhone,
  containerId,
}: {
  doneHref?: string;
  doneLabel?: string;
  initialPurpose?: 'Sell' | 'Resale' | 'Rent' | 'Lease';
  initialCategory?: 'Residential' | 'Commercial';
  initialPropertyType?: string;
  initialPhone?: string;
  containerId?: string;
} = {}) {
  const [listing, setListing] = useState<OwnerListing>(() => {
    const base = emptyListing();
    if (initialPurpose) base.purpose = initialPurpose;
    if (initialCategory) base.category = initialCategory;
    if (initialPropertyType) base.propertyType = initialPropertyType;
    if (initialPhone) base.phone = initialPhone;
    return base;
  });
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Errors>({});
  const [notice, setNotice] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  const [resumable, setResumable] = useState<ReturnType<typeof getDraft>>(null);
  const [published, setPublished] = useState<OwnerListing | null>(null);
  const [publishing, setPublishing] = useState(false);
  // Photos that failed to upload after the listing itself was created.
  const [createdId, setCreatedId] = useState<number | null>(null);
  const [failedPhotos, setFailedPhotos] = useState<ListingPhoto[]>([]);
  const [needsLogin, setNeedsLogin] = useState(false);
  const pathname = usePathname();
  const [photoCategory, setPhotoCategory] = useState<PhotoCategory>('Exterior');
  const [showAllFeatures, setShowAllFeatures] = useState(false);
  const [showAllAmenities, setShowAllAmenities] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const draft = getDraft();
    if (draft) setResumable(draft);
    setListing((l) => ({
      ...l,
      ...(initialPurpose ? { purpose: initialPurpose } : {}),
      ...(initialCategory ? { category: initialCategory } : {}),
      ...(initialPropertyType ? { propertyType: initialPropertyType } : {}),
      phone: initialPhone || l.phone || '',
    }));
  }, [initialPurpose, initialCategory, initialPropertyType, initialPhone]);

  const set = <K extends keyof OwnerListing>(key: K, value: OwnerListing[K]) => {
    setListing((l) => ({ ...l, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };
  const toggleIn = (key: 'tenantPreference' | 'features' | 'amenities' | 'overlooking', value: string) =>
    set(key, listing[key].includes(value) ? listing[key].filter((v) => v !== value) : [...listing[key], value]);

  const goTo = (next: number) => {
    setStep(next);
    setNotice(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const next = () => {
    const e = validate(step, listing);
    setErrors(e);
    if (Object.keys(e).length) {
      setNotice({ tone: 'error', text: 'Please complete the highlighted required fields before proceeding.' });
      return;
    }
    goTo(step + 1);
  };

  const onSaveDraft = () => {
    const ok = saveDraft(listing, step);
    setNotice(
      ok
        ? { tone: 'ok', text: 'Draft saved. You can continue this listing later.' }
        : { tone: 'error', text: 'Could not save draft. Try removing a few photos.' }
    );
  };

  /** Upload photos in display order (the first one becomes the cover). Returns the ones that failed. */
  const uploadPhotos = async (listingId: number, photos: ListingPhoto[]): Promise<ListingPhoto[]> => {
    const failed: ListingPhoto[] = [];
    for (const photo of photos) {
      try {
        await uploadListingPhoto(listingId, dataUrlToBlob(photo.src), photo.category);
      } catch {
        failed.push(photo);
      }
    }
    return failed;
  };

  const onPublish = async () => {
    if (publishing) return;
    for (let s = 0; s < 5; s++) {
      const e = validate(s, listing);
      if (Object.keys(e).length) {
        setErrors(e);
        goTo(s);
        setNotice({ tone: 'error', text: 'Please complete the highlighted required fields before publishing.' });
        return;
      }
    }
    if (!getSession()) {
      // Keep the work: save the draft locally, then ask the owner to log in.
      saveDraft(listing, step);
      setNeedsLogin(true);
      setNotice({ tone: 'error', text: 'Log in as an owner to publish. Your draft has been saved on this device.' });
      return;
    }
    setPublishing(true);
    setNotice(null);
    try {
      const created = await createOwnerListing(listing);
      setCreatedId(created.listing_id);
      setFailedPhotos(await uploadPhotos(created.listing_id, listing.photos));
      clearDraft();
      setPublished(listing);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setNotice({ tone: 'error', text: errorMessage(err, 'Could not publish your property. Please try again.') });
    } finally {
      setPublishing(false);
    }
  };

  const retryFailedPhotos = async () => {
    if (!createdId || publishing) return;
    setPublishing(true);
    try {
      setFailedPhotos(await uploadPhotos(createdId, failedPhotos));
    } finally {
      setPublishing(false);
    }
  };

  const addPhotos = async (files: FileList | null) => {
    if (!files?.length) return;
    const added: ListingPhoto[] = [];
    for (const file of Array.from(files)) {
      if (listing.photos.length + added.length >= MAX_PHOTOS) {
        setNotice({ tone: 'error', text: `You can add up to ${MAX_PHOTOS} photos.` });
        break;
      }
      if (file.size > 10 * 1024 * 1024) {
        setNotice({ tone: 'error', text: `${file.name}: Image exceeds the 10 MB limit.` });
        continue;
      }
      try {
        const src = await compressImage(file);
        added.push({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, src, category: photoCategory });
      } catch (err) {
        setNotice({ tone: 'error', text: (err as Error).message });
      }
    }
    if (added.length) set('photos', [...listing.photos, ...added]);
  };

  /* ---------- Success screen ---------- */
  if (published) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-[0_12px_45px_-10px_rgba(0,0,0,0.1)]">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-green-600">
          <CircleCheck size={32} />
        </div>
        <h2 className="mt-5 text-xl font-bold text-slate-900">Property submitted!</h2>
        <p className="mt-2 text-sm text-slate-500">
          Your listing is <span className="font-semibold text-amber-600">Pending Verification</span>. It isn&apos;t visible to
          buyers yet and will go live once it&apos;s verified.
        </p>
        {failedPhotos.length > 0 && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-left text-sm text-amber-900" role="alert">
            <p>
              {failedPhotos.length} of {published.photos.length} photo{published.photos.length === 1 ? '' : 's'} could not be uploaded.
            </p>
            <button
              type="button"
              onClick={() => void retryFailedPhotos()}
              disabled={publishing}
              className="mt-2 inline-flex items-center gap-1.5 font-semibold text-amber-800 underline disabled:opacity-60 cursor-pointer"
            >
              {publishing && <Loader2 size={14} className="animate-spin" />}
              Retry upload
            </button>
          </div>
        )}
        <div className="mt-6 flex items-center gap-4 rounded-xl bg-slate-50 p-3 text-left">
          {published.photos[0] && <img src={published.photos[0].src} alt="" className="h-16 w-16 rounded-lg object-cover" />}
          <div className="min-w-0">
            <p className="truncate font-semibold text-slate-900">
              {[needsBhk(published) ? published.bhk : '', published.propertyType].filter(Boolean).join(' ')}
            </p>
            <p className="truncate text-xs text-slate-500">
              {published.locality}, {published.city}
            </p>
            <p className="mt-0.5 text-sm font-bold text-slate-900">
              {formatINR(published.price)}
              {isRental(published) && <span className="text-xs font-normal text-slate-500"> /month</span>}
            </p>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => {
              setPublished(null);
              setCreatedId(null);
              setFailedPhotos([]);
              setListing(emptyListing());
              setStep(0);
            }}
            className="rounded-lg border border-[#087ed9] px-5 py-2.5 text-sm font-semibold text-[#087ed9] hover:bg-sky-50 transition cursor-pointer"
          >
            Add another property
          </button>
          <Link href={doneHref} className="rounded-lg bg-[#087ed9] px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-600 transition">
            {doneLabel}
          </Link>
        </div>
      </div>
    );
  }

  const priceLabel = isRental(listing) ? 'Monthly Rent' : listing.purpose === 'Resale' ? 'Resale Price' : 'Expected Price';
  const pricingSubtitle = isRental(listing)
    ? 'Transparent rental pricing and deposit terms attract qualified tenants faster.'
    : listing.purpose === 'Resale'
      ? 'Transparent resale pricing attracts serious and qualified buyers faster.'
      : 'Transparent new property pricing attracts serious buyers and investors faster.';

  return (
    <div id={containerId || 'post-property-wizard'} className="grid gap-6 lg:grid-cols-[260px_1fr]">
      {/* Step list */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <ol className="flex gap-2 overflow-x-auto rounded-2xl border border-slate-100 bg-white p-3 shadow-[0_12px_45px_-10px_rgba(0,0,0,0.1)] lg:flex-col lg:gap-1">
          {steps.map((label, i) => {
            const done = i < step;
            const active = i === step;
            return (
              <li key={label} className="shrink-0">
                <button
                  type="button"
                  disabled={i > step}
                  onClick={() => goTo(i)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition ${
                    active ? 'bg-sky-50 font-semibold text-[#087ed9]' : done ? 'text-slate-700 hover:bg-slate-50 cursor-pointer' : 'text-slate-400'
                  }`}
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      active ? 'bg-[#087ed9] text-white' : done ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {done ? <Check size={13} /> : i + 1}
                  </span>
                  <span className="whitespace-nowrap">{label}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </aside>

      <div className="min-w-0">
        {resumable && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm">
            <span className="text-slate-700">You have a saved draft. Continue where you left off?</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setListing(resumable.listing);
                  setStep(resumable.step);
                  setResumable(null);
                }}
                className="rounded-lg bg-[#087ed9] px-3 py-1.5 font-semibold text-white hover:bg-sky-600 transition cursor-pointer"
              >
                Continue Listing
              </button>
              <button
                type="button"
                onClick={() => {
                  clearDraft();
                  setResumable(null);
                }}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-600 hover:border-slate-300 transition cursor-pointer"
              >
                Discard
              </button>
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-slate-100 bg-white p-6 md:p-8 shadow-[0_12px_45px_-10px_rgba(0,0,0,0.1)]">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Step {step + 1} of {steps.length}
              </p>
              <h2 className="mt-1 text-xl font-bold text-slate-900">{steps[step]}</h2>
            </div>
            <button
              type="button"
              onClick={onSaveDraft}
              className="flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:border-slate-300 hover:text-slate-900 transition cursor-pointer"
            >
              <Save size={14} /> Save Draft
            </button>
          </div>

          <div className="space-y-6">
            {/* Step 1: Basic */}
            {step === 0 && (
              <>
                <Section title="You're looking to?">
                  <Chips
                    options={purposes.map((p) => p.label)}
                    value={listing.purpose}
                    onChange={(v) => set('purpose', v as OwnerListing['purpose'])}
                  />
                </Section>
                <Section title="Property Category">
                  <Chips
                    options={['Residential', 'Commercial']}
                    value={listing.category}
                    onChange={(v) => {
                      setListing((l) => ({ ...l, category: v as OwnerListing['category'], propertyType: '', bhk: '' }));
                    }}
                  />
                  <Field label="Property Type" error={errors.propertyType}>
                    <Chips
                      options={propertyTypes[listing.category]}
                      value={listing.propertyType}
                      onChange={(v) => set('propertyType', v)}
                      error={errors.propertyType}
                    />
                  </Field>
                  {needsBhk(listing) && (
                    <Field label="BHK Configuration" error={errors.bhk}>
                      <Chips options={bhkOptions} value={listing.bhk} onChange={(v) => set('bhk', v)} error={errors.bhk} />
                    </Field>
                  )}
                </Section>
                <Section title="Contact Details">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field label="Phone Number" hint="Verified buyers/tenants will reach you on this number." error={errors.phone}>
                      <TextInput
                        prefix="+91"
                        type="tel"
                        inputMode="numeric"
                        placeholder="Mobile number"
                        value={listing.phone}
                        onChange={(v) => set('phone', v.replace(/\D/g, '').slice(0, 10))}
                        error={errors.phone}
                      />
                    </Field>
                    <Field
                      label="Email"
                      optional
                      hint="Official rental agreement and inspection reports will be emailed."
                      error={errors.email}
                    >
                      <TextInput
                        type="email"
                        placeholder="you@example.com"
                        value={listing.email}
                        onChange={(v) => set('email', v)}
                        error={errors.email}
                      />
                    </Field>
                  </div>
                </Section>
              </>
            )}

            {/* Step 2: Location */}
            {step === 1 && (
              <Section
                title="Property Location"
                subtitle={`Accurate neighborhood details ensure high-intent ${isRental(listing) ? 'tenant' : 'buyer'} matches in your area.`}
              >
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="City" error={errors.city}>
                    <TextInput value={listing.city} onChange={(v) => set('city', v)} error={errors.city} />
                  </Field>
                  <Field label="District" error={errors.district}>
                    <TextInput value={listing.district} onChange={(v) => set('district', v)} error={errors.district} />
                  </Field>
                  <Field label="Locality" error={errors.locality}>
                    <TextInput
                      placeholder="e.g. Anna Nagar"
                      value={listing.locality}
                      onChange={(v) => set('locality', v)}
                      error={errors.locality}
                    />
                  </Field>
                  <Field
                    label="Pincode"
                    hint={`Chennai pincode between ${PINCODE_MIN} and ${PINCODE_MAX}. Required before publishing.`}
                    error={errors.pincode}
                  >
                    <TextInput
                      inputMode="numeric"
                      placeholder="600040"
                      value={listing.pincode}
                      onChange={(v) => set('pincode', v.replace(/\D/g, '').slice(0, 6))}
                      error={errors.pincode}
                    />
                  </Field>
                  <Field label="Sub Locality" optional>
                    <TextInput value={listing.subLocality} onChange={(v) => set('subLocality', v)} />
                  </Field>
                  <Field label="Apartment / Society" optional>
                    <TextInput
                      placeholder="e.g. Green Acres Residency"
                      value={listing.society}
                      onChange={(v) => set('society', v)}
                    />
                  </Field>
                  <Field label="House No." optional>
                    <TextInput placeholder="e.g. Flat 402, Block B" value={listing.houseNo} onChange={(v) => set('houseNo', v)} />
                  </Field>
                  <Field label="Landmark" optional>
                    <TextInput placeholder="e.g. Opposite Tower Park" value={listing.landmark} onChange={(v) => set('landmark', v)} />
                  </Field>
                </div>
              </Section>
            )}

            {/* Step 3: Property details */}
            {step === 2 && (
              <>
                <p className="text-sm text-slate-500">Specify room configurations, areas, floor level, and readiness.</p>
                {!isPlot(listing) && listing.category === 'Residential' && (
                  <Section title="Room Details">
                    <Field label="Bedrooms">
                      <Chips options={['1', '2', '3', '4', '5+']} value={listing.bedrooms} onChange={(v) => set('bedrooms', v)} />
                      {bedroomsDifferFromBhk(listing) && (
                        <p className="mt-2 text-xs text-amber-700">
                          This differs from your BHK choice ({listing.bhk}). {listing.bedrooms} bedrooms will be saved; the listing title keeps {listing.bhk}.
                        </p>
                      )}
                    </Field>
                    <Field label="Bathrooms">
                      <Chips options={['1', '2', '3', '4', '5+']} value={listing.bathrooms} onChange={(v) => set('bathrooms', v)} />
                    </Field>
                    <Field label="Balconies">
                      <Chips options={['0', '1', '2', '3', '3+']} value={listing.balconies} onChange={(v) => set('balconies', v)} />
                    </Field>
                  </Section>
                )}
                <Section title="Area Details">
                  <div className="grid gap-5 sm:grid-cols-3">
                    <Field
                      label={isPlot(listing) ? 'Plot Area (sq.ft)' : 'Carpet Area (sq.ft)'}
                      hint="Usable net floor area inside the walls."
                      error={errors.carpetArea}
                    >
                      <TextInput
                        inputMode="numeric"
                        value={listing.carpetArea}
                        onChange={(v) => set('carpetArea', v.replace(/\D/g, ''))}
                        error={errors.carpetArea}
                      />
                    </Field>
                    {!isPlot(listing) && (
                      <>
                        <Field label="Built-up Area" optional>
                          <TextInput
                            inputMode="numeric"
                            value={listing.builtUpArea}
                            onChange={(v) => set('builtUpArea', v.replace(/\D/g, ''))}
                          />
                        </Field>
                        <Field label="Super Built-up" optional>
                          <TextInput
                            inputMode="numeric"
                            value={listing.superBuiltUpArea}
                            onChange={(v) => set('superBuiltUpArea', v.replace(/\D/g, ''))}
                          />
                        </Field>
                      </>
                    )}
                  </div>
                </Section>
                {!isPlot(listing) && (
                  <Section title="Floor Details">
                    <div className="grid gap-5 sm:grid-cols-2">
                      <Field label="Total Floors in Building" error={errors.totalFloors}>
                        <TextInput
                          inputMode="numeric"
                          value={listing.totalFloors}
                          onChange={(v) => set('totalFloors', v.replace(/\D/g, '').slice(0, 3))}
                          error={errors.totalFloors}
                        />
                      </Field>
                      <Field label="Property on Floor" hint="Use 0 for ground floor." error={errors.floor}>
                        <TextInput
                          inputMode="numeric"
                          value={listing.floor}
                          onChange={(v) => set('floor', v.replace(/\D/g, '').slice(0, 3))}
                          error={errors.floor}
                        />
                      </Field>
                    </div>
                    {listing.category === 'Residential' && (
                      <Toggle label="Duplex Property?" value={listing.duplex} onChange={(v) => set('duplex', v)} />
                    )}
                  </Section>
                )}
                <Section title="Availability Status">
                  <Chips options={availabilityOptions} value={listing.availability} onChange={(v) => set('availability', v)} />
                  {listing.availability === 'Ready to Move' && !isPlot(listing) && (
                    <Field label="Property Age">
                      <Chips options={ageOptions} value={listing.propertyAge} onChange={(v) => set('propertyAge', v)} />
                    </Field>
                  )}
                  {!isPlot(listing) && (
                    <Field label="Furnishing Status">
                      <Chips options={furnishingOptions} value={listing.furnishing} onChange={(v) => set('furnishing', v)} />
                    </Field>
                  )}
                </Section>
              </>
            )}

            {/* Step 4: Pricing */}
            {step === 3 && (
              <>
                <p className="text-sm text-slate-500">{pricingSubtitle}</p>
                <Section title={isRental(listing) ? 'Rent & Deposit' : 'Price & Terms'}>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field
                      label={priceLabel}
                      hint={Number(listing.price) ? formatINR(listing.price) : undefined}
                      error={errors.price}
                    >
                      <TextInput
                        prefix="₹"
                        inputMode="numeric"
                        value={listing.price}
                        onChange={(v) => set('price', v.replace(/\D/g, ''))}
                        error={errors.price}
                      />
                    </Field>
                    {isRental(listing) ? (
                      <Field label="Security Deposit" hint="Typically 4 to 10 months of monthly rent" error={errors.securityDeposit}>
                        <TextInput
                          prefix="₹"
                          inputMode="numeric"
                          value={listing.securityDeposit}
                          onChange={(v) => set('securityDeposit', v.replace(/\D/g, ''))}
                          error={errors.securityDeposit}
                        />
                      </Field>
                    ) : (
                      <Field label="Booking / Token Amount" optional hint="Advance booking deposit">
                        <TextInput
                          prefix="₹"
                          inputMode="numeric"
                          value={listing.bookingAmount}
                          onChange={(v) => set('bookingAmount', v.replace(/\D/g, ''))}
                        />
                      </Field>
                    )}
                    <Field label="Maintenance Charges" optional>
                      <TextInput
                        prefix="₹"
                        inputMode="numeric"
                        value={listing.maintenance}
                        onChange={(v) => set('maintenance', v.replace(/\D/g, ''))}
                      />
                    </Field>
                    <Field label="Maintenance Frequency">
                      <Chips
                        options={frequencyOptions}
                        value={listing.maintenanceFrequency}
                        onChange={(v) => set('maintenanceFrequency', v)}
                      />
                    </Field>
                  </div>
                  <Toggle
                    label={isRental(listing) ? 'Rent Negotiable?' : 'Price Negotiable?'}
                    value={listing.negotiable}
                    onChange={(v) => set('negotiable', v)}
                  />
                  <Field
                    label={isRental(listing) ? 'Available From' : 'Possession / Available From'}
                    optional={!isRental(listing)}
                    error={errors.availableFrom}
                  >
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => set('availableFrom', new Date().toISOString().slice(0, 10))}
                        className="rounded-full border border-slate-200 px-4 py-1.5 text-sm font-medium text-slate-700 hover:border-slate-300 cursor-pointer"
                      >
                        Immediately
                      </button>
                      <button
                        type="button"
                        onClick={() => set('availableFrom', new Date(Date.now() + 15 * 864e5).toISOString().slice(0, 10))}
                        className="rounded-full border border-slate-200 px-4 py-1.5 text-sm font-medium text-slate-700 hover:border-slate-300 cursor-pointer"
                      >
                        Within 15 Days
                      </button>
                      <input
                        type="date"
                        value={listing.availableFrom}
                        onChange={(e) => set('availableFrom', e.target.value)}
                        className={`${inputClass(errors.availableFrom)} sm:w-auto`}
                      />
                    </div>
                  </Field>
                </Section>
                {isRental(listing) && (
                  <Section title="Tenant Preference">
                    <Chips
                      options={tenantOptions}
                      value={listing.tenantPreference}
                      onChange={(v) => set('tenantPreference', listing.tenantPreference.includes(v) ? [] : [v])}
                    />
                    <div className="grid gap-5 sm:grid-cols-2">
                      <Field label="Lock-in Period" optional error={errors.lockInPeriod}>
                        <TextInput placeholder="e.g. 6 months" value={listing.lockInPeriod} onChange={(v) => set('lockInPeriod', v)} />
                      </Field>
                      <Field label="Preferred Agreement Duration" optional error={errors.agreementDuration}>
                        <TextInput
                          placeholder="e.g. 11 months"
                          value={listing.agreementDuration}
                          onChange={(v) => set('agreementDuration', v)}
                        />
                      </Field>
                    </div>
                  </Section>
                )}
              </>
            )}

            {/* Step 5: Photos & details */}
            {step === 4 && (
              <>
                <Section title="Add Property Photos" subtitle="Upload clear photos of your property. The first photo is the cover.">
                  <Field label="Choose Photo Category">
                    <Chips
                      options={photoCategories}
                      value={photoCategory}
                      disabled={UNAVAILABLE_PHOTO_CATEGORIES}
                      onChange={(v) => setPhotoCategory(v as PhotoCategory)}
                    />
                  </Field>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => cameraRef.current?.click()}
                      className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:border-[#087ed9] hover:text-[#087ed9] transition cursor-pointer"
                    >
                      <Camera size={16} /> Camera
                    </button>
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:border-[#087ed9] hover:text-[#087ed9] transition cursor-pointer"
                    >
                      <ImagePlus size={16} /> Gallery (multiple images)
                    </button>
                    <input
                      ref={cameraRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      hidden
                      onChange={(e) => {
                        addPhotos(e.target.files);
                        e.target.value = '';
                      }}
                    />
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      hidden
                      onChange={(e) => {
                        addPhotos(e.target.files);
                        e.target.value = '';
                      }}
                    />
                  </div>
                  {errors.photos && <p className="text-xs text-red-500">{errors.photos}</p>}
                  {listing.photos.length > 0 && (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {listing.photos.map((photo, i) => (
                        <div key={photo.id} className="group relative aspect-[4/3] overflow-hidden rounded-lg bg-slate-100">
                          <img src={photo.src} alt={photo.category} className="h-full w-full object-cover" />
                          {i === 0 && (
                            <span className="absolute left-2 top-2 rounded bg-[#087ed9] px-1.5 py-0.5 text-[10px] font-bold text-white">
                              COVER
                            </span>
                          )}
                          <span className="absolute bottom-0 inset-x-0 bg-black/50 px-2 py-1 text-[11px] text-white">{photo.category}</span>
                          <button
                            type="button"
                            aria-label="Remove photo"
                            onClick={() => set('photos', listing.photos.filter((p) => p.id !== photo.id))}
                            className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-slate-700 hover:text-red-500 cursor-pointer"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </Section>

                {!isPlot(listing) && (
                  <Section title="Parking">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Counter
                        label="Covered Parking"
                        hint="Basement / stilt reserved slots"
                        value={listing.coveredParking}
                        onChange={(v) => set('coveredParking', v)}
                      />
                      <Counter
                        label="Open Parking"
                        hint="Compound / surface dedicated spots"
                        value={listing.openParking}
                        onChange={(v) => set('openParking', v)}
                      />
                    </div>
                  </Section>
                )}

                <Section title="Description" subtitle="What makes your property unique?">
                  <Field
                    label="Description"
                    hint="Highlight building conveniences, security, facing, and unique features."
                    error={errors.description}
                  >
                    <textarea
                      rows={5}
                      placeholder="Add property description..."
                      value={listing.description}
                      onChange={(e) => set('description', e.target.value)}
                      className={inputClass(errors.description)}
                    />
                  </Field>
                </Section>

                <Section title="Ownership">
                  <Chips options={ownershipOptions} value={listing.ownership} onChange={(v) => set('ownership', v)} />
                </Section>

                <Section title="Property Features">
                  <Chips
                    options={showAllFeatures ? featureOptions : featureOptions.slice(0, COLLAPSED_COUNT)}
                    value={listing.features}
                    disabled={UNAVAILABLE_FEATURES}
                    onChange={(v) => toggleIn('features', v)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowAllFeatures(!showAllFeatures)}
                    className="text-sm font-semibold text-[#087ed9] hover:underline cursor-pointer"
                  >
                    {showAllFeatures ? 'View Less Features' : `View All Features (${featureOptions.length})`}
                  </button>
                </Section>

                <Section title="Amenities">
                  <Chips
                    options={showAllAmenities ? amenityOptions : amenityOptions.slice(0, COLLAPSED_COUNT)}
                    value={listing.amenities}
                    onChange={(v) => toggleIn('amenities', v)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowAllAmenities(!showAllAmenities)}
                    className="text-sm font-semibold text-[#087ed9] hover:underline cursor-pointer"
                  >
                    {showAllAmenities ? 'View Less Amenities' : `View All Amenities (${amenityOptions.length})`}
                  </button>
                </Section>

                <Section title="Property Facing">
                  <Chips options={facingOptions} value={listing.facing} onChange={(v) => set('facing', v)} />
                  <Field label="Overlooking">
                    <Chips
                      options={overlookingOptions}
                      value={listing.overlooking}
                      onChange={(v) => set('overlooking', listing.overlooking.includes(v) ? [] : [v])}
                    />
                  </Field>
                  <Field label="No. of Open Sides">
                    <Chips options={openSidesOptions} value={listing.openSides} onChange={(v) => set('openSides', v)} />
                  </Field>
                </Section>
              </>
            )}

            {/* Step 6: Review */}
            {step === 5 && <Review listing={listing} onEdit={goTo} />}
          </div>

          {notice && (
            <p
              className={`mt-6 rounded-lg px-4 py-2.5 text-sm ${
                notice.tone === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
              }`}
            >
              {notice.text}
              {needsLogin && (
                <>
                  {' '}
                  <Link href={loginHref(pathname || '/owner/dashboard/add-property', 'owner')} className="font-semibold underline">
                    Log in
                  </Link>
                </>
              )}
            </p>
          )}

          <div className="mt-8 flex items-center justify-between gap-3 border-t border-slate-100 pt-6">
            <button
              type="button"
              onClick={() => goTo(step - 1)}
              disabled={step === 0}
              className="flex items-center gap-1 rounded-lg px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:invisible cursor-pointer"
            >
              <ChevronLeft size={16} /> Back
            </button>
            {step < steps.length - 1 ? (
              <button
                type="button"
                onClick={next}
                className="flex items-center gap-1 rounded-lg bg-[#087ed9] px-6 py-2.5 text-sm font-semibold text-white hover:bg-sky-600 transition cursor-pointer"
              >
                {step === steps.length - 2 ? 'Review' : 'Next'} <ChevronRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void onPublish()}
                disabled={publishing}
                className="rounded-lg bg-[#087ed9] px-6 py-2.5 text-sm font-semibold text-white hover:bg-sky-600 disabled:opacity-60 transition cursor-pointer flex items-center gap-2"
              >
                {publishing && <Loader2 size={16} className="animate-spin" />}
                {publishing ? 'Publishing…' : 'Publish Property'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Review step ---------- */

function Review({ listing: l, onEdit }: { listing: OwnerListing; onEdit: (step: number) => void }) {
  const rows = (pairs: [string, string | undefined | false][]) =>
    pairs.filter(([, v]) => v).map(([k, v]) => (
      <div key={k} className="flex justify-between gap-4 py-1.5 text-sm">
        <span className="text-slate-500">{k}</span>
        <span className="text-right font-medium text-slate-900">{v}</span>
      </div>
    ));

  const block = (title: string, step: number, children: React.ReactNode) => (
    <div className="rounded-xl border border-slate-100 p-4">
      <div className="mb-2 flex items-center justify-between">
        <h4 className="font-semibold text-slate-900">{title}</h4>
        <button
          type="button"
          onClick={() => onEdit(step)}
          className="flex items-center gap-1 text-xs font-semibold text-[#087ed9] hover:underline cursor-pointer"
        >
          <Pencil size={12} /> Edit
        </button>
      </div>
      {children}
    </div>
  );

  const area = (v: string) => (v ? `${Number(v).toLocaleString('en-IN')} sq.ft` : undefined);

  return (
    <>
      <p className="text-sm text-slate-500">Complete buyer listing preview before publishing.</p>

      {/* Preview card */}
      <div className="overflow-hidden rounded-2xl border border-slate-200">
        <div className="relative aspect-[16/7] bg-slate-100">
          {l.photos[0] && <img src={l.photos[0].src} alt="" className="h-full w-full object-cover" />}
          <span className="absolute left-3.5 top-3.5 rounded bg-white px-2.5 py-1 text-[11px] font-medium text-slate-800 shadow-xs">
            {l.purpose === 'Sell' ? 'New Sale' : `For ${l.purpose}`}
          </span>
          <span className="absolute bottom-3.5 right-3.5 rounded bg-black px-2.5 py-1 text-xs text-white">
            Photos ({l.photos.length})
          </span>
        </div>
        <div className="p-5">
          <h3 className="text-lg font-bold text-slate-900">
            {[needsBhk(l) ? l.bhk : '', l.propertyType].filter(Boolean).join(' ')}
            {l.society && ` in ${l.society}`}
          </h3>
          <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
            <MapPin size={14} /> {[l.locality, l.city].filter(Boolean).join(', ')}
            {l.pincode && ` - ${l.pincode}`}
          </p>
          <p className="mt-3 text-xl font-bold text-slate-900">
            {formatINR(l.price)}
            {isRental(l) && <span className="text-sm font-normal text-slate-500"> /month</span>}
            {l.negotiable && (
              <span className="ml-2 rounded bg-green-50 px-1.5 py-0.5 align-middle text-[11px] font-semibold text-green-700">
                Negotiable
              </span>
            )}
          </p>
          {l.description && <p className="mt-3 text-sm leading-relaxed text-slate-600">{l.description}</p>}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {block(
          'Basic',
          0,
          rows([
            ['Looking to', l.purpose],
            ['Category', l.category],
            ['Property Type', l.propertyType],
            ['BHK', needsBhk(l) && l.bhk],
            ['Phone', l.phone && `+91 ${l.phone}`],
            ['Email', l.email],
          ])
        )}
        {block(
          'Location',
          1,
          rows([
            ['Locality', l.locality],
            ['Sub Locality', l.subLocality],
            ['Society', l.society],
            ['House No.', l.houseNo],
            ['Landmark', l.landmark],
            ['City', `${l.city}, ${l.district}`],
            ['Pincode', l.pincode],
          ])
        )}
        {block(
          'Property Details',
          2,
          rows([
            ['Bedrooms', bedroomsLabel(l)],
            ['Bathrooms', l.bathrooms],
            ['Balconies', l.balconies],
            [isPlot(l) ? 'Plot Area' : 'Carpet Area', area(l.carpetArea)],
            ['Built-up Area', area(l.builtUpArea)],
            ['Super Built-up Area', area(l.superBuiltUpArea)],
            ['Floor', l.floor && `${l.floor === '0' ? 'Ground' : l.floor} of ${l.totalFloors}`],
            ['Duplex', l.duplex && 'Yes'],
            ['Availability', l.availability],
            ['Property Age', l.propertyAge],
            ['Furnishing', !isPlot(l) && l.furnishing],
          ])
        )}
        {block(
          'Pricing',
          3,
          rows([
            [isRental(l) ? 'Monthly Rent' : 'Price', formatINR(l.price)],
            ['Security Deposit', l.securityDeposit && formatINR(l.securityDeposit)],
            ['Booking Amount', l.bookingAmount && formatINR(l.bookingAmount)],
            ['Maintenance', l.maintenance && `${formatINR(l.maintenance)} / ${l.maintenanceFrequency}`],
            ['Negotiable', l.negotiable ? 'Yes' : 'No'],
            [isRental(l) ? 'Available From' : 'Possession From', l.availableFrom],
            ['Tenant Preference', l.tenantPreference.join(', ')],
            ['Lock-in Period', l.lockInPeriod],
            ['Agreement Tenure', l.agreementDuration],
          ])
        )}
        {block(
          'Photos & Details',
          4,
          <>
            {l.photos.length > 0 && (
              <div className="mb-3 flex gap-2 overflow-x-auto">
                {l.photos.map((p) => (
                  <img key={p.id} src={p.src} alt={p.category} className="h-14 w-14 shrink-0 rounded-lg object-cover" />
                ))}
              </div>
            )}
            {rows([
              ['Covered Parking', l.coveredParking > 0 && String(l.coveredParking)],
              ['Open Parking', l.openParking > 0 && String(l.openParking)],
              ['Ownership', l.ownership],
              ['Facing', l.facing],
              ['Overlooking', l.overlooking.join(', ')],
              ['Open Sides', l.openSides],
            ])}
          </>
        )}
        {(l.features.length > 0 || l.amenities.length > 0) &&
          block(
            'Amenities & Features',
            4,
            <div className="flex flex-wrap gap-1.5">
              {[...l.features, ...l.amenities].map((x) => (
                <span key={x} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700">
                  {x}
                </span>
              ))}
            </div>
          )}
      </div>
    </>
  );
}
