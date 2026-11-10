"use client";

import { useEffect, useState } from 'react';
import { Clock, Mail, MessageCircle, Phone, Send } from 'lucide-react';
import { getSession, isPlaceholderName } from '@/lib/api/session';

// Restamp's support details come from public build settings (see
// .env.example). A channel that is not configured is not shown: no
// placeholder number or address is ever displayed as if it were real.
const SUPPORT = {
  phone: (process.env.NEXT_PUBLIC_SUPPORT_PHONE || '').trim(),
  email: (process.env.NEXT_PUBLIC_SUPPORT_EMAIL || '').trim(),
  whatsapp: (process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP || '').trim(),
  hours: 'Mon – Sat, 9:30 AM – 6:30 PM',
};

const card = 'rounded-2xl border border-slate-100 bg-white shadow-[0_3px_18px_#15223d06]';
const input =
  'w-full rounded-xl border border-slate-200 bg-white px-4 h-[48px] text-sm text-slate-900 outline-none transition focus:border-[#087ed9]';

export default function ContactUs({ role, topics }: { role: 'agent' | 'owner' | 'visitor'; topics: string[] }) {
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [topic, setTopic] = useState(topics[0]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // The signed-in account's chosen name (the backend profile has no phone number).
    const name = getSession()?.displayName;
    if (name && !isPlaceholderName(name)) setName(name);
  }, []);

  // The RESTAMP backend has no support/contact endpoint yet, so a message
  // cannot be delivered from here. Nothing is stored and no "sent" message is
  // shown; the form explains this and points to the configured channels.
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(`Messages can't be sent from the website yet (${role} support). Please use the contact options on this page.`);
  };

  const channels = [
    SUPPORT.phone && { icon: Phone, label: 'Call us', value: SUPPORT.phone, href: `tel:${SUPPORT.phone.replace(/\s/g, '')}` },
    SUPPORT.email && { icon: Mail, label: 'Email', value: SUPPORT.email, href: `mailto:${SUPPORT.email}` },
    SUPPORT.whatsapp && { icon: MessageCircle, label: 'WhatsApp', value: 'Chat with support', href: SUPPORT.whatsapp },
  ].filter(Boolean) as { icon: typeof Phone; label: string; value: string; href: string }[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Contact Us</h1>
        <p className="mt-1 text-sm text-slate-500">Questions about your plan, leads or account? Our team is here to help.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <section className={`${card} p-6`}>
            <form onSubmit={submit} className="space-y-4">
              <h2 className="font-bold text-slate-900">Send us a message</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-slate-700">Full name</span>
                  <input className={input} value={name} onChange={(e) => setName(e.target.value)} />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-slate-700">Mobile number</span>
                  <input className={input} inputMode="numeric" maxLength={10} value={mobile} onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))} />
                </label>
              </div>
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-slate-700">Topic</span>
                <select className={input} value={topic} onChange={(e) => setTopic(e.target.value)}>
                  {topics.map((t) => <option key={t}>{t}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-slate-700">Message</span>
                <textarea
                  rows={5}
                  className={`${input} h-auto py-3`}
                  placeholder="Tell us how we can help…"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </label>
              {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
              <p className="text-xs text-slate-500">Sending messages from the website is not available yet.</p>
              <button
                type="submit"
                disabled
                title="Sending messages from the website is not available yet"
                className="inline-flex h-[53px] items-center gap-2 rounded-xl bg-[#087ed9] px-6 text-sm font-semibold text-white hover:bg-sky-600 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send size={16} /> Send message
              </button>
            </form>
        </section>

        <aside className="space-y-4">
          {channels.length === 0 && (
            <div className={`${card} p-4 text-sm text-slate-500`}>Support contact details will be published here soon.</div>
          )}
          {channels.map(({ icon: Icon, label, value, href }) => (
            <a
              key={label}
              href={href}
              target={href.startsWith('http') ? '_blank' : undefined}
              rel="noopener noreferrer"
              className={`${card} flex items-center gap-4 p-4 hover:border-[#087ed9]/30`}
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#087ed9] text-white shadow-sm shadow-[#087ed9]/25">
                <Icon size={20} />
              </span>
              <span>
                <span className="block text-xs text-slate-500">{label}</span>
                <span className="block text-sm font-semibold text-slate-900">{value}</span>
              </span>
            </a>
          ))}
          <div className={`${card} flex items-center gap-3 p-4 text-sm text-slate-600`}>
            <Clock size={18} className="text-[#087ed9]" /> {SUPPORT.hours}
          </div>
        </aside>
      </div>
    </div>
  );
}
