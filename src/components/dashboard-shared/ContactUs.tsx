"use client";

import { useEffect, useState } from 'react';
import { CheckCircle2, Clock, Mail, MessageCircle, Phone, Send } from 'lucide-react';
import { getProfile } from '@/lib/profile';

// TODO: replace with Restamp's real support details.
const SUPPORT = {
  phone: '+91 98400 00000',
  email: 'support@restamp.in',
  whatsapp: 'https://wa.me/919840000000',
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
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const p = getProfile();
    if (p) {
      setName(p.name ?? '');
      setMobile(p.mobile ?? '');
    }
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !/^\d{10}$/.test(mobile) || message.trim().length < 10) {
      setError('Please enter your name, a 10-digit mobile number and a message of at least 10 characters.');
      return;
    }
    setError('');
    // No backend yet: keep a local copy so the request isn't lost in the demo.
    try {
      const key = 'restamp_support_requests';
      const list = JSON.parse(localStorage.getItem(key) || '[]');
      list.unshift({ role, name, mobile, topic, message, createdAt: new Date().toISOString() });
      localStorage.setItem(key, JSON.stringify(list));
    } catch {}
    setSent(true);
  };

  const channels = [
    { icon: Phone, label: 'Call us', value: SUPPORT.phone, href: `tel:${SUPPORT.phone.replace(/\s/g, '')}` },
    { icon: Mail, label: 'Email', value: SUPPORT.email, href: `mailto:${SUPPORT.email}` },
    { icon: MessageCircle, label: 'WhatsApp', value: 'Chat with support', href: SUPPORT.whatsapp },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Contact Us</h1>
        <p className="mt-1 text-sm text-slate-500">Questions about your plan, leads or account? Our team is here to help.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <section className={`${card} p-6`}>
          {sent ? (
            <div className="flex flex-col items-center py-10 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50 text-green-600">
                <CheckCircle2 size={28} />
              </span>
              <h2 className="mt-4 text-lg font-bold text-slate-900">Message sent</h2>
              <p className="mt-1 max-w-sm text-sm text-slate-500">
                Thanks, {name.split(' ')[0]}. Our support team will call you on {mobile} within one working day.
              </p>
              <button
                type="button"
                onClick={() => { setSent(false); setMessage(''); }}
                className="mt-6 rounded-xl border border-[#087ed9] px-4 py-2.5 text-sm font-semibold text-[#087ed9] hover:bg-sky-50"
              >
                Send another message
              </button>
            </div>
          ) : (
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
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button
                type="submit"
                className="inline-flex h-[53px] items-center gap-2 rounded-xl bg-[#087ed9] px-6 text-sm font-semibold text-white hover:bg-sky-600 active:scale-[0.97]"
              >
                <Send size={16} /> Send message
              </button>
            </form>
          )}
        </section>

        <aside className="space-y-4">
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
