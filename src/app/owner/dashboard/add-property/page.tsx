"use client";

import PostPropertyWizard from '@/components/owner/PostPropertyWizard';

// No plan-based listing limit: plans and payments are not connected to the
// backend yet, so the website does not invent one.
export default function OwnerAddPropertyPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Add Property</h1>
        <p className="mt-1 text-sm text-slate-500">Add a new property for sale, resale, rent or lease.</p>
      </div>
      <PostPropertyWizard doneHref="/owner/dashboard/properties" doneLabel="View my properties" />
    </div>
  );
}
