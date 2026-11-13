'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';
import { useOwnerPlans, type OwnerPlan } from '@/lib/ownerPlan';

type Category = 'Residential' | 'Commercial';

/**
 * "Assistance Plans" pricing section from the owner landing page (/owner).
 * Also rendered by Admin → Subscription Plans as the website preview, so
 * both always use the same markup.
 *
 * - No props: live admin-managed plans, links active (website).
 * - `plans`: render exactly these plans (admin preview, may include drafts/unsaved edits).
 * - `preview`: links and buttons are inert so admins can't navigate away.
 */
export default function OwnerAssistancePlans({
  plans,
  preview = false,
  showHeader = true,
}: {
  plans?: OwnerPlan[];
  preview?: boolean;
  showHeader?: boolean;
}) {
  const live = useOwnerPlans();
  const [planCategory, setPlanCategory] = useState<Category>('Residential');
  const list = plans ?? live[planCategory];
  const loading = !plans && list.length === 0;

  const Cta = ({ className, children }: { className: string; children: React.ReactNode }) =>
    preview ? (
      <span aria-disabled="true" className={`${className} !cursor-default`}>{children}</span>
    ) : (
      <Link href="/owner/plans" className={className}>{children}</Link>
    );

  return (
    <section className={`${preview ? 'py-10' : 'py-24'} bg-[#f4f4f6] border-b border-slate-200/70 scroll-mt-20`}>
      <div className="container-site">
        {showHeader && (
          <div className="flex flex-wrap items-end justify-between gap-4 mb-14">
            <div>
              <p className="eyebrow text-[#087ed9]">Assistance Plans</p>
              <h2 className="section-title mt-1.5 text-slate-900">Upgrade when you need extra reach</h2>
              <p className="mt-2 text-sm text-slate-500 max-w-xl">
                Get dedicated relationship manager assistance, top search placement, and direct verified WhatsApp buyer leads.
              </p>
            </div>
            <div className="inline-flex rounded-2xl bg-white border border-slate-200/80 p-1 text-xs font-semibold shadow-2xs">
              {(['Residential', 'Commercial'] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setPlanCategory(cat)}
                  className={`px-4 py-2 rounded-xl transition cursor-pointer ${
                    planCategory === cat ? 'bg-slate-900 text-white shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className={`grid grid-cols-1 ${list.length === 1 ? '' : 'md:grid-cols-3'} gap-6 sm:gap-7 items-stretch`}>
          {loading &&
            [0, 1, 2].map((i) => (
              <div key={i} className="h-[460px] animate-pulse rounded-[32px] sm:rounded-[36px] border border-slate-200/80 bg-white" />
            ))}
          {plans && plans.length === 0 && (
            <p className="col-span-full rounded-3xl border border-slate-200/80 bg-white p-10 text-center text-sm text-slate-500">
              No owner plans are on sale. This section would show no plans on the website.
            </p>
          )}
          {list.map((p: OwnerPlan) => {
            const isFeatured = p.popular;
            return (
              <div
                key={p.id}
                className={`relative rounded-[32px] sm:rounded-[36px] bg-white p-7 sm:p-9 flex flex-col justify-between transition-all duration-300 ${
                  isFeatured
                    ? 'border border-slate-200/80 shadow-xl shadow-slate-300/40 overflow-hidden'
                    : 'border border-slate-200/80 shadow-sm hover:shadow-xl hover:shadow-slate-200/40'
                }`}
              >
                {/* Glowing Sunset Ambient Mesh Aura for Featured Plan */}
                {isFeatured && (
                  <div
                    className="absolute -top-12 -left-12 -right-12 h-64 pointer-events-none rounded-t-[36px] overflow-hidden opacity-90"
                    style={{
                      background:
                        'radial-gradient(ellipse at 50% 28%, rgba(147, 197, 253, 0.55) 0%, rgba(254, 215, 170, 0.6) 45%, rgba(251, 207, 232, 0.4) 75%, transparent 100%)',
                      filter: 'blur(36px)',
                    }}
                  />
                )}

                {/* Top Tier Block */}
                <div>
                  <div className="flex items-center justify-between relative z-10">
                    <span
                      className={`text-xl font-bold tracking-tight ${
                        isFeatured ? 'bg-gradient-to-r from-sky-600 via-amber-600 to-rose-600 bg-clip-text text-transparent' : 'text-slate-900'
                      }`}
                    >
                      {p.name}
                    </span>
                    {isFeatured && (
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-900 text-white text-[10px] font-extrabold uppercase tracking-wider shadow-xs">
                        {p.highlight || 'Most Popular'}
                      </span>
                    )}
                  </div>

                  {/* Price & Billing */}
                  <div className="mt-4 flex items-baseline gap-3 relative z-10">
                    <span className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
                      {p.price === 0 ? 'Free' : `₹${p.price.toLocaleString('en-IN')}`}
                    </span>
                    <div className="text-[11px] leading-tight font-medium">
                      <span className={`block font-bold ${isFeatured ? 'text-slate-900' : 'text-slate-700'}`}>{p.priceSub1}</span>
                      <span className="block text-slate-400">{p.priceSub2}</span>
                    </div>
                  </div>

                  {/* Primary CTA Button */}
                  <div className="mt-6 relative z-10">
                    <Cta
                      className={`w-full py-4 px-6 rounded-2xl font-bold text-sm tracking-wide transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer ${
                        isFeatured ? 'bg-[#18181b] hover:bg-black text-white shadow-md shadow-slate-900/10' : 'bg-[#f4f4f5] hover:bg-[#e4e4e7] text-slate-900'
                      }`}
                    >
                      <span>{p.price === 0 ? 'Use Free Plan' : 'Select Plan'}</span>
                      <ArrowRight size={15} />
                    </Cta>
                  </div>

                  {/* Subtle Hairline Divider */}
                  <div className={`mt-8 pt-7 border-t relative z-10 ${isFeatured ? 'border-slate-100' : 'border-slate-100/90'}`} />

                  {/* Feature Bullets */}
                  <div className="space-y-3.5 relative z-10">
                    {p.features.map((feature, idx) => (
                      <div
                        key={idx}
                        className={`flex items-start gap-3 text-sm leading-snug ${isFeatured ? 'text-slate-800 font-medium' : 'text-slate-600'}`}
                      >
                        <Check
                          size={16}
                          strokeWidth={isFeatured ? 2.5 : 2.2}
                          className={`shrink-0 mt-0.5 ${isFeatured ? 'text-[#087ed9]' : 'text-slate-900'}`}
                        />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Card Footer Link */}
                <div className="pt-8 mt-8 border-t border-slate-100 relative z-10">
                  <Cta className="text-xs text-slate-400 hover:text-slate-700 font-medium transition inline-flex items-center gap-1">
                    <span>Need custom assistance?</span>
                    <span className="text-[#087ed9] font-semibold">Explore options &rarr;</span>
                  </Cta>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
