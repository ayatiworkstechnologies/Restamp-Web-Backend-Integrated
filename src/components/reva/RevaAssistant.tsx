'use client';

/**
 * Site-wide Reva AI chat assistant (floating widget).
 *
 * Talks only to the real backend POST /chat: the answer, its language, and
 * any property cards come from the server, which grounds them in real
 * listings and the signed-in caller's own account data. Nothing is invented
 * here — when the backend answers from its verified knowledge base
 * (`demo: true`, no AI provider configured yet) the widget says so plainly.
 *
 * - Guests get public answers; a signed-in session is attached automatically
 *   and a rejected token falls back to the anonymous attempt (see reva.ts).
 * - Loading, error, rate-limit and timeout states are shown in the panel,
 *   with a Retry that resends the last unanswered message.
 * - English / Tamil (தமிழ்) toggle; the choice is remembered in this tab.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, Bot, Loader2, RotateCcw, Sparkles, X } from 'lucide-react';
import {
  CHAT_HISTORY_MAX_ITEMS,
  CHAT_MESSAGE_MAX_CHARS,
  type ChatHealth,
  type ChatTurn,
  type RevaListing,
  sendChatMessage,
  getChatHealth,
} from '@/lib/api/reva';
import { errorMessage } from '@/lib/api/client';

type Bubble =
  | { kind: 'user'; text: string }
  | { kind: 'assistant'; text: string; demo: boolean | null; listings: RevaListing[] | null }
  | { kind: 'error'; text: string; retryWith: string };

const LANG_KEY = 'restamp_reva_language';

const SUGGESTIONS_EN = [
  'Show 2BHK flats in Velachery',
  'How does 0% brokerage work?',
  'How do I post a property?',
  'What are the buyer plans?',
];
const SUGGESTIONS_TA = [
  'வேலச்சேரியில் 2BHK வீடுகள் காட்டுங்கள்',
  '0% தரகு எப்படி வேலை செய்யும்?',
  'சொத்தை எப்படி பதிவு செய்வது?',
  'வாங்குபவர் திட்டங்கள் என்ன?',
];

function trimHistory(turns: ChatTurn[]): ChatTurn[] {
  return turns.slice(-CHAT_HISTORY_MAX_ITEMS);
}

export function RevaAssistant() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [language, setLanguage] = useState<'en' | 'ta'>('en');
  const [input, setInput] = useState('');
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [sending, setSending] = useState(false);
  const [health, setHealth] = useState<ChatHealth | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  // Turns to send as conversation history (successful exchanges only).
  const historyRef = useRef<ChatTurn[]>([]);

  useEffect(() => setMounted(true), []);

  // Restore the language choice of this tab.
  useEffect(() => {
    try {
      const saved = window.sessionStorage.getItem(LANG_KEY);
      if (saved === 'ta' || saved === 'en') setLanguage(saved);
    } catch {}
  }, []);

  useEffect(() => {
    try {
      window.sessionStorage.setItem(LANG_KEY, language);
    } catch {}
  }, [language]);

  // Service mode banner: fetched when the panel first opens (best effort —
  // if it fails, the header simply stays neutral and per-answer hints apply).
  useEffect(() => {
    if (!open || health) return;
    let cancelled = false;
    getChatHealth()
      .then((h) => {
        if (!cancelled) setHealth(h);
      })
      .catch(() => {
        /* the first chat attempt will surface real errors */
      });
    return () => {
      cancelled = true;
    };
  }, [open, health]);

  // Keep the latest messages in view.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [bubbles, sending, open]);

  const demoMode = health ? health.mode !== 'ai' : null;

  const send = useCallback(
    async (rawText: string) => {
      const text = rawText.trim().slice(0, CHAT_MESSAGE_MAX_CHARS);
      if (!text || sending) return;

      setInput('');
      const assistantIndex = bubbles.length; // placeholder for this turn's reply
      setBubbles((prev) => [
        ...prev,
        { kind: 'user', text },
        { kind: 'assistant', text: '', demo: null, listings: null },
      ]);
      setSending(true);
      try {
        const res = await sendChatMessage({
          message: text,
          language,
          history: trimHistory(historyRef.current),
        });
        historyRef.current = trimHistory([
          ...historyRef.current,
          { role: 'user', content: text },
          { role: 'assistant', content: res.reply },
        ]);
        setBubbles((prev) => {
          const next = [...prev];
          next[assistantIndex] = { kind: 'assistant', text: res.reply, demo: res.demo, listings: res.listings };
          return next;
        });
      } catch (e) {
        const message = errorMessage(e, 'Reva could not answer right now. Please try again.');
        setBubbles((prev) => {
          const next = [...prev];
          next[assistantIndex] = { kind: 'error', text: message, retryWith: text };
          return next;
        });
      } finally {
        setSending(false);
      }
    },
    [bubbles.length, language, sending]
  );

  const retry = useCallback(
    (text: string, at: number) => {
      if (sending) return;
      setBubbles((prev) => {
        const next = [...prev];
        next[at] = { kind: 'assistant', text: '', demo: null, listings: null };
        return next;
      });
      void send(text);
    },
    [send, sending]
  );

  const suggestions = useMemo(() => (language === 'ta' ? SUGGESTIONS_TA : SUGGESTIONS_EN), [language]);

  if (!mounted) return null;

  return (
    <>
      {/* Launcher (hidden while the panel is open) */}
      {!open && (
        <button
          type="button"
          aria-label={language === 'ta' ? 'Reva AI உதவியாளரைத் திறக்க' : 'Open Reva AI assistant'}
          onClick={() => {
            setOpen(true);
            setTimeout(() => inputRef.current?.focus(), 50);
          }}
          className="fixed bottom-5 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#087ed9] text-white shadow-[0_12px_30px_rgba(8,126,217,0.4)] transition hover:bg-sky-600 hover:scale-105 sm:bottom-6 sm:right-6 cursor-pointer"
        >
          <Sparkles size={24} />
        </button>
      )}

      {/* Panel */}
      {open && (
        <div
          role="dialog"
          aria-label="Reva AI assistant"
          className="fixed inset-x-3 bottom-3 z-50 flex h-[min(620px,78dvh)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.35)] sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-[400px]"
        >
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-slate-100 bg-[#087ed9] px-4 py-3 text-white">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15">
              <Bot size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold leading-tight">Reva AI</p>
              <p className="truncate text-[11px] text-sky-100">
                {demoMode === null
                  ? language === 'ta'
                    ? 'உங்கள் Restamp உதவியாளர்'
                    : 'Your Restamp assistant'
                  : demoMode
                  ? language === 'ta'
                    ? 'சரிபார்க்கப்பட்ட தகவல் பதில்கள் (AI இணைக்கப்படவில்லை)'
                    : 'Verified-info answers (live AI not connected)'
                  : language === 'ta'
                  ? 'AI-இயங்கும் Restamp உதவியாளர்'
                  : 'Live AI assistant'}
              </p>
            </div>
            {/* Language toggle */}
            <div className="flex shrink-0 overflow-hidden rounded-full border border-white/30 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-2.5 py-1 cursor-pointer ${language === 'en' ? 'bg-white text-[#087ed9]' : 'text-white hover:bg-white/10'}`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLanguage('ta')}
                className={`px-2.5 py-1 cursor-pointer ${language === 'ta' ? 'bg-white text-[#087ed9]' : 'text-white hover:bg-white/10'}`}
              >
                தமிழ்
              </button>
            </div>
            <button
              type="button"
              aria-label="Close Reva AI"
              onClick={() => setOpen(false)}
              className="shrink-0 rounded-full p-1.5 text-sky-100 transition hover:bg-white/10 hover:text-white cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-slate-50 px-4 py-4">
            {bubbles.length === 0 && (
              <div className="pt-2 text-center">
                <p className="text-sm font-semibold text-slate-700">
                  {language === 'ta' ? 'வணக்கம்! நான் Reva AI 🏠' : 'Hi! I am Reva AI 🏠'}
                </p>
                <p className="mx-auto mt-1 max-w-[290px] text-xs leading-relaxed text-slate-500">
                  {language === 'ta'
                    ? 'சென்னை சொத்துகளைத் தேடவும், 0% தரகு, திட்டங்கள் மற்றும் பார்வை ஏற்பாடு பற்றி கேளுங்கள்.'
                    : 'Ask me to find homes in Chennai, explain 0% brokerage, plans, or scheduling a visit.'}
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => void send(s)}
                      className="rounded-full border border-sky-100 bg-white px-3 py-1.5 text-[11px] font-semibold text-[#087ed9] transition hover:border-[#087ed9]/40 hover:bg-sky-50 cursor-pointer"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {bubbles.map((b, i) => {
              if (b.kind === 'user') {
                return (
                  <div key={i} className="flex justify-end">
                    <div className="max-w-[80%] whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-[#087ed9] px-3.5 py-2.5 text-[13px] leading-relaxed text-white">
                      {b.text}
                    </div>
                  </div>
                );
              }
              if (b.kind === 'error') {
                return (
                  <div key={i} className="flex justify-start">
                    <div className="flex max-w-[85%] items-start gap-2 rounded-2xl rounded-bl-md border border-rose-100 bg-rose-50 px-3.5 py-2.5 text-[12px] leading-relaxed text-rose-700">
                      <AlertCircle size={14} className="mt-0.5 shrink-0" />
                      <div className="space-y-1.5">
                        <p>{b.text}</p>
                        <button
                          type="button"
                          onClick={() => retry(b.retryWith, i)}
                          className="flex items-center gap-1 text-[11px] font-bold text-rose-800 hover:underline cursor-pointer"
                        >
                          <RotateCcw size={11} /> Retry
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }
              // Assistant: bubble + optional demo hint + real listing cards
              return (
                <div key={i} className="space-y-2">
                  <div className="flex justify-start">
                    <div className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-bl-md border border-slate-100 bg-white px-3.5 py-2.5 text-[13px] leading-relaxed text-slate-700 shadow-sm">
                      {b.text || (
                        <span className="flex items-center gap-1.5 py-0.5 text-slate-400">
                          <Loader2 size={13} className="animate-spin" />
                          {language === 'ta' ? 'Reva நினைக்கிறது…' : 'Reva is thinking…'}
                        </span>
                      )}
                    </div>
                  </div>
                  {b.demo && (
                    <p className="pl-1 text-[10.5px] italic leading-snug text-slate-400">
                      {language === 'ta'
                        ? 'Restamp-ன் சரிபார்க்கப்பட்ட தகவலிலிருந்து பதில் — நேரடி AI இன்னும் இணைக்கப்படவில்லை.'
                        : 'Answered from Restamp\u2019s verified info — live AI is not connected yet.'}
                    </p>
                  )}
                  {b.listings && b.listings.length > 0 && (
                    <div className="space-y-2 pl-1">
                      {b.listings.map((l) => (
                        <Link
                          key={l.listing_id}
                          href={`/properties/${l.listing_id}`}
                          onClick={() => setOpen(false)}
                          className="block rounded-xl border border-sky-100 bg-white p-3 transition hover:border-[#087ed9]/40 hover:bg-sky-50/50"
                        >
                          <p className="truncate text-[12.5px] font-bold text-slate-900">{l.title}</p>
                          <p className="mt-0.5 text-[11.5px] font-semibold text-[#087ed9]">{l.price_display}</p>
                          <p className="mt-0.5 text-[11px] text-slate-500">
                            {l.locality}, {l.city}
                            {typeof l.bedrooms === 'number' ? ` · ${l.bedrooms} BHK` : ''} · {l.property_type}
                          </p>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Composer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void send(input);
            }}
            className="border-t border-slate-100 bg-white px-3 py-3"
          >
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void send(input);
                  }
                }}
                maxLength={CHAT_MESSAGE_MAX_CHARS}
                placeholder={language === 'ta' ? 'Reva-விடம் கேளுங்கள்…' : 'Ask Reva anything…'}
                className="max-h-28 min-h-[42px] flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-[13px] text-slate-700 outline-none transition focus:border-[#087ed9]/50 focus:bg-white cursor-text"
              />
              <button
                type="submit"
                disabled={sending || !input.trim()}
                aria-label="Send message"
                className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl bg-[#087ed9] text-white transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
              >
                {sending ? <Loader2 size={17} className="animate-spin" /> : <Sparkles size={17} />}
              </button>
            </div>
            <p className="mt-2 px-1 text-[10px] leading-snug text-slate-400">
              {language === 'ta'
                ? 'Reva Restamp தரவுகளின் அடிப்படையில் மட்டுமே பதிலளிக்கிறது — தவறான தகவல்களைச் சொல்லாது. இறுதி முடிவுகளுக்கு இணையதளத்தைச் சரிபார்க்கவும்.'
                : 'Reva answers only from Restamp data and may not always be right — confirm details on the website.'}
            </p>
          </form>
        </div>
      )}
    </>
  );
}
