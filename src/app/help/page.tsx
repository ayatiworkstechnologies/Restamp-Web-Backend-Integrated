import type { Metadata } from 'next';
import Link from 'next/link';
import { Building2, ChevronDown, CreditCard, Headset, KeyRound, Search, UserRound } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'Help Center | Restamp',
  description: 'Answers to common questions about buying, renting, listing and agent plans on Restamp.',
};

const groups = [
  {
    icon: Search,
    title: 'Buying & renting',
    faqs: [
      { q: 'How do I contact a property owner?', a: 'Open any property and use "Contact" or "Send enquiry". The owner receives your request and can call you back. Log in first so your enquiry is saved under My Activity.' },
      { q: 'Are listings verified?', a: 'Listings marked "Verified" have been checked by our team. Always visit the property and verify documents yourself before paying any money.' },
      { q: 'How do I save a property?', a: 'Tap the heart icon on a property card. Your saved homes appear under Saved Homes in your account.' },
    ],
  },
  {
    icon: Building2,
    title: 'For owners',
    faqs: [
      { q: 'How do I post my property?', a: 'Choose "Post Property Free", log in with your mobile number, pick a plan and follow the step-by-step form. Your listing goes live after a quick review.' },
      { q: 'Where do I see enquiries and site visits?', a: 'Open your Owner Dashboard. The Leads and Site Visits pages list every enquiry and visit request for your properties.' },
    ],
  },
  {
    icon: UserRound,
    title: 'For agents',
    faqs: [
      { q: 'Can agents post properties?', a: 'No. Only owners post properties on Restamp. Agents can view owner properties in their subscribed locations and work with buyer leads.' },
      { q: 'How do location packages work?', a: 'Choose a package of 5, 10 or 15 locations. You get owner properties and buyer enquiries from those locations for the package validity.' },
    ],
  },
  {
    icon: CreditCard,
    title: 'Plans & payments',
    faqs: [
      { q: 'Where can I find my invoices?', a: 'Go to Plan & Payments in your dashboard to see your active plan and full payment history, including GST.' },
      { q: 'How do I change or renew my plan?', a: 'Open Plan & Payments and choose "Change plan". Your new plan starts as soon as payment is confirmed.' },
    ],
  },
  {
    icon: KeyRound,
    title: 'Account & login',
    faqs: [
      { q: 'I did not receive my OTP.', a: 'Check that your number is correct and wait 30 seconds before requesting a new code. If it still does not arrive, contact support.' },
      { q: 'How do I update my profile?', a: 'Open Profile from the account menu or your dashboard and edit your name, email and city.' },
    ],
  },
];

export default function HelpCenterPage() {
  return (
    <>
      <Header />
      <main className="bg-slate-50">
        <section className="border-b border-slate-100 bg-gradient-to-br from-sky-50 to-white">
          <div className="container-site py-12 sm:py-16">
            <p className="eyebrow">Support</p>
            <h1 className="section-title mt-2">Help Center</h1>
            <p className="mt-3 max-w-xl text-sm text-slate-500 sm:text-base">Quick answers to the questions we hear most. Can&apos;t find what you need? Our team is a message away.</p>
          </div>
        </section>

        <div className="container-site space-y-6 py-10 sm:py-14">
          {groups.map(({ icon: Icon, title, faqs }) => (
            <section key={title} className="rounded-2xl border border-slate-100 bg-white p-5 sm:p-7">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#087ed9] text-white shadow-sm shadow-[#087ed9]/25">
                  <Icon size={20} />
                </span>
                <h2 className="text-lg font-bold text-slate-900">{title}</h2>
              </div>
              <div className="mt-4 divide-y divide-slate-100">
                {faqs.map((f) => (
                  <details key={f.q} className="group py-3">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-slate-800 hover:text-[#087ed9] [&::-webkit-details-marker]:hidden">
                      {f.q}
                      <ChevronDown size={16} className="shrink-0 text-slate-400 transition-transform group-open:rotate-180" />
                    </summary>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{f.a}</p>
                  </details>
                ))}
              </div>
            </section>
          ))}

          <section className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50 to-white p-6 sm:flex-row sm:items-center sm:p-8">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#087ed9] text-white">
                <Headset size={20} />
              </span>
              <div>
                <h2 className="font-bold text-slate-900">Still need help?</h2>
                <p className="text-sm text-slate-500">Send us a message and we&apos;ll get back within one working day.</p>
              </div>
            </div>
            <Link href="/contact" className="inline-flex h-[53px] items-center rounded-xl bg-[#087ed9] px-6 text-sm font-semibold text-white hover:bg-sky-600">
              Contact Us
            </Link>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
