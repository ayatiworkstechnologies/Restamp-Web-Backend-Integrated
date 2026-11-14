"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowRight, Globe, Mic, Phone, RotateCcw, Send, Square, Volume2, VolumeX, X } from "lucide-react";
import { properties, getPropertyById, type Property } from "@/data/properties";
import { getWishlist } from "@/lib/wishlist";
import { getActivity, contactFor, logActivity } from "@/lib/activity";
import { getProfile } from "@/lib/profile";
import { RevaLogo, RevaOrb } from "./RevaOrb";
import {
  COPY,
  QUICK_ACTIONS,
  ROUTE_PATHS,
  sendRevaChat,
  type DataKind,
  type RevaAction,
  type RevaLang,
  type RevaRole,
} from "./reva-data";

/** Pages where the assistant is not shown. */
const HIDDEN_PREFIXES = ["/admin", "/admin-dashboard", "/admin-login", "/invoice"];

/** Any element can open Reva: window.dispatchEvent(new CustomEvent("reva:open", { detail: "optional prompt" })) */
export const REVA_OPEN_EVENT = "reva:open";

interface Visit {
  id: string;
  title: string;
  locality: string;
  at: string;
}

interface Msg {
  id: string;
  from: "user" | "assistant";
  text: string;
  action?: RevaAction;
  chips?: boolean;
  listings?: Property[];
  pickContact?: boolean;
  visits?: Visit[];
  contact?: { property: Property; name: string; role: string; phone: string };
}

const ROLES: RevaRole[] = ["Buyer", "Owner", "Agent"];

const welcome = (lang: RevaLang, role: RevaRole): Msg => ({
  id: `welcome-${lang}-${role}-${Date.now()}`,
  from: "assistant",
  text: COPY[lang].welcome(role),
  chips: true,
});

function roleFromProfile(): RevaRole {
  const r = getProfile()?.role;
  return r === "owner" ? "Owner" : r === "agent" ? "Agent" : "Buyer";
}

function searchListings(q: string) {
  const words = q.toLowerCase().split(/\s+/).filter((w) => w.length > 1);
  if (!words.length) return [];
  return properties
    .map((p) => {
      const hay = [p.name, p.locality, p.area, p.city, p.bhk, p.propertyType, p.type, p.propertyCategory].filter(Boolean).join(" ").toLowerCase();
      return { p, score: words.filter((w) => hay.includes(w)).length };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map((x) => x.p);
}

// Minimal typing for the Web Speech API (not in the TS DOM lib).
type SpeechRec = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
};
function getSpeechCtor(): (new () => SpeechRec) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: new () => SpeechRec; webkitSpeechRecognition?: new () => SpeechRec };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export function RevaChatbot() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState<RevaLang>("en");
  const [role, setRole] = useState<RevaRole>("Buyer");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [recording, setRecording] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const nextId = useRef(0);
  const awaitingContact = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const recRef = useRef<SpeechRec | null>(null);
  const threadRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingPrompt = useRef<string | null>(null);
  const t = COPY[lang];

  const hidden = HIDDEN_PREFIXES.some((p) => pathname === p || pathname?.startsWith(`${p}/`));

  // Start a fresh conversation whenever language or role changes.
  const reset = useCallback((l: RevaLang, r: RevaRole) => {
    abortRef.current?.abort();
    awaitingContact.current = false;
    setBusy(false);
    setError("");
    setMessages([welcome(l, r)]);
  }, []);

  useEffect(() => {
    const r = roleFromProfile();
    setRole(r);
    setMessages([welcome("en", r)]);
  }, []);

  useEffect(() => {
    const onOpen = (e: Event) => {
      const prompt = (e as CustomEvent<string | undefined>).detail;
      if (typeof prompt === "string" && prompt.trim()) pendingPrompt.current = prompt.trim();
      setOpen(true);
    };
    window.addEventListener(REVA_OPEN_EVENT, onOpen);
    return () => window.removeEventListener(REVA_OPEN_EVENT, onOpen);
  }, []);

  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    setTimeout(() => inputRef.current?.focus(), 50);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const stopSpeech = () => {
    try {
      window.speechSynthesis?.cancel();
    } catch {}
  };

  const speak = useCallback(
    (text: string) => {
      try {
        const synth = window.speechSynthesis;
        if (!synth) throw new Error("no tts");
        synth.cancel();
        const u = new SpeechSynthesisUtterance(text.replace(/[•*#]/g, ""));
        u.lang = lang === "ta" ? "ta-IN" : "en-IN";
        const voice = synth.getVoices().find((v) => v.lang.toLowerCase().startsWith(lang === "ta" ? "ta" : "en-in"));
        if (voice) u.voice = voice;
        synth.speak(u);
      } catch {
        setError(t.speakingError);
      }
    },
    [lang, t.speakingError],
  );

  const goTo = (action: RevaAction) => {
    setOpen(false);
    router.push(ROUTE_PATHS[action.route]);
  };

  const submit = useCallback(
    async (raw: string, opts?: { dataKind?: DataKind }) => {
      const question = raw.trim();
      if (!question || busy) return;
      if (question.length > 500) {
        setError(t.tooLong);
        return;
      }
      setError("");
      setDraft("");
      setBusy(true);
      const dataKind = opts?.dataKind;
      const history = messages.map((m) => ({ from: m.from, text: m.text }));
      const userMsg: Msg = { id: `m-${++nextId.current}`, from: "user", text: question };
      setMessages((items) => [...items, userMsg]);
      const bot = (fields: Omit<Msg, "id" | "from">): Msg => ({ id: `m-${++nextId.current}`, from: "assistant", ...fields });
      const reply = (m: Msg) => {
        setMessages((items) => [...items, m]);
        if (autoSpeak) speak(m.text);
      };

      // Contact owner, step 1: ask what to look for.
      const contactIntent =
        dataKind === "contactPrompt" ||
        /\b(contact|call|phone|number)\b.*\bowner\b|\bowner\b.*\b(contact|number|phone)\b/i.test(question);
      if (contactIntent && !awaitingContact.current) {
        awaitingContact.current = true;
        await new Promise((r) => setTimeout(r, 350));
        reply(
          bot({
            text:
              lang === "ta"
                ? "சரி! சொத்தின் பெயர் அல்லது இடத்தைத் தட்டச்சு செய்யுங்கள் (எ.கா. \"Anna Nagar\" அல்லது \"4 BHK Villa\"), பொருந்தும் சொத்துகளைக் காட்டுகிறேன்."
                : "Sure! Type the property name or location (e.g. \"Anna Nagar\" or \"4 BHK Villa\") and I'll find matching properties.",
          }),
        );
        setBusy(false);
        return;
      }

      // Contact owner, step 2: search listings and let the user pick one.
      if (awaitingContact.current) {
        awaitingContact.current = false;
        await new Promise((r) => setTimeout(r, 350));
        const found = searchListings(question);
        if (found.length) {
          reply(
            bot({
              text:
                lang === "ta"
                  ? `"${question}" க்கு ${found.length} சொத்துகள் கிடைத்தன. உரிமையாளர் தொடர்பு விவரங்களைக் காண ஒன்றைத் தேர்ந்தெடுக்கவும்.`
                  : `I found ${found.length} ${found.length === 1 ? "property" : "properties"} for "${question}". Pick one to see the owner's contact details.`,
              listings: found,
              pickContact: true,
            }),
          );
        } else {
          awaitingContact.current = true;
          reply(
            bot({
              text:
                lang === "ta"
                  ? `"${question}" க்கு சொத்துகள் கிடைக்கவில்லை. வேறு பெயர் அல்லது இடத்தை முயற்சிக்கவும்.`
                  : `I couldn't find any properties for "${question}". Try another property name or location.`,
            }),
          );
        }
        setBusy(false);
        return;
      }

      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const [result] = await Promise.all([
          sendRevaChat({ question, role, language: lang, history, signal: controller.signal }),
          new Promise((r) => setTimeout(r, 500)), // keep the typing indicator visible briefly
        ]);
        if (controller.signal.aborted) return;

        // Quick-action chips attach the visitor's real data from this site.
        let listings: Property[] | undefined;
        let visits: Visit[] | undefined;
        let note = "";
        if (dataKind === "listings") {
          listings = properties.slice(0, 6);
        } else if (dataKind === "saved") {
          listings = getWishlist()
            .map((id) => getPropertyById(id))
            .filter((p): p is Property => !!p)
            .slice(0, 10);
          if (!listings.length)
            note = lang === "ta" ? "\n\nநீங்கள் இன்னும் எந்தச் சொத்தையும் சேமிக்கவில்லை. சேமிக்க இதயக் குறியீட்டைத் தட்டவும்." : "\n\nYou haven't saved any properties yet. Tap the heart on a property to save it.";
        } else if (dataKind === "visits") {
          visits = getActivity()
            .filter((a) => a.type === "siteVisit")
            .slice(0, 10)
            .map((a, i) => {
              const p = getPropertyById(a.propertyId);
              return { id: `${a.propertyId}-${i}`, title: p?.name ?? "Property", locality: [p?.locality, p?.city].filter(Boolean).join(", "), at: a.at };
            });
          if (!visits.length)
            note = lang === "ta" ? "\n\nஉங்களுக்கு இன்னும் பார்வை நேரங்கள் இல்லை. ஒரு சொத்தைத் திறந்து 'Schedule Visit' தட்டவும்." : "\n\nYou have no site visits yet. Open a property and tap Schedule Visit.";
        }

        reply(bot({ text: result.text + note, action: result.action, listings: listings?.length ? listings : undefined, visits: visits?.length ? visits : undefined }));
      } catch {
        if (!controller.signal.aborted) setError(t.networkError);
      } finally {
        if (abortRef.current === controller) abortRef.current = null;
        setBusy(false);
      }
    },
    [busy, messages, role, lang, autoSpeak, speak, t.tooLong, t.networkError],
  );

  // Run a prompt passed through the open event once the panel is open.
  useEffect(() => {
    if (open && pendingPrompt.current && !busy) {
      const p = pendingPrompt.current;
      pendingPrompt.current = null;
      submit(p);
    }
  }, [open, busy, submit]);

  const pickContact = (p: Property) => {
    const c = contactFor(p);
    logActivity("call", p.id, c);
    const m: Msg = {
      id: `m-${++nextId.current}`,
      from: "assistant",
      text: lang === "ta" ? `${p.name} உரிமையாளர் தொடர்பு விவரங்கள்:` : `Here are the contact details for ${p.name}:`,
      contact: { property: p, name: c.contactName, role: c.contactRole, phone: c.contactPhone },
    };
    setMessages((items) => [...items, m]);
  };

  const toggleMic = () => {
    setError("");
    if (recording) {
      recRef.current?.stop();
      return;
    }
    const Ctor = getSpeechCtor();
    if (!Ctor) {
      setError(t.voiceUnsupported);
      return;
    }
    stopSpeech();
    const rec = new Ctor();
    rec.lang = lang === "ta" ? "ta-IN" : "en-IN";
    rec.interimResults = true;
    rec.continuous = false;
    let finalText = "";
    rec.onresult = (e) => {
      finalText = Array.from(e.results)
        .map((r) => r[0]?.transcript ?? "")
        .join(" ");
      setDraft(finalText.slice(0, 500));
    };
    rec.onerror = (e) => {
      if (e.error === "aborted") return;
      if (e.error === "not-allowed" || e.error === "service-not-allowed") setError(t.micDenied);
      else if (e.error === "no-speech") setError(t.voiceEmpty);
      else setError(t.voiceError);
    };
    rec.onend = () => {
      setRecording(false);
      recRef.current = null;
      if (finalText.trim()) submit(finalText.slice(0, 500));
    };
    recRef.current = rec;
    setRecording(true);
    try {
      rec.start();
    } catch {
      setRecording(false);
      setError(t.voiceError);
    }
  };

  useEffect(() => () => {
    recRef.current?.abort();
    stopSpeech();
  }, []);

  if (hidden) return null;

  const chips = QUICK_ACTIONS[lang][role];

  return (
    <>
      {/* Launcher */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={t.open}
          className="group fixed bottom-5 right-5 z-[60] flex items-center gap-2.5 rounded-full sm:bottom-6 sm:right-6"
        >
          <span className="pointer-events-none hidden rounded-full bg-white px-3.5 py-2 text-[13px] font-semibold text-slate-800 shadow-lg ring-1 ring-slate-200 transition group-hover:translate-x-0 group-hover:opacity-100 sm:block sm:translate-x-2 sm:opacity-0">
            {t.open}
          </span>
          <span className="relative block transition-transform duration-200 group-hover:scale-105 group-active:scale-95">
            <span className="reva-pulse absolute inset-0 rounded-full bg-[#2563EB]" aria-hidden />
            <span className="relative block rounded-[24px] shadow-[0_10px_28px_rgba(37,99,235,0.45)]">
              <RevaOrb size={58} />
            </span>
          </span>
        </button>
      )}

      {/* Panel */}
      {open && (
        <div className="fixed inset-0 z-[60] sm:inset-auto sm:bottom-6 sm:right-6">
          <div className="absolute inset-0 bg-slate-900/40 sm:hidden" onClick={() => setOpen(false)} aria-hidden />
          <section
            role="dialog"
            aria-label="Reva AI assistant"
            className="reva-panel-in absolute inset-x-0 bottom-0 flex h-[88dvh] flex-col overflow-hidden rounded-t-[24px] bg-[#F8FAFC] shadow-2xl sm:relative sm:inset-auto sm:h-[640px] sm:max-h-[calc(100dvh-48px)] sm:w-[400px] sm:rounded-[24px] sm:ring-1 sm:ring-slate-200"
          >
            <div className="mx-auto mt-2 h-1.5 w-10 rounded-full bg-slate-300 sm:hidden" aria-hidden />

            {/* Header */}
            <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3">
              <RevaOrb size={42} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[15px] font-bold text-slate-900">Reva AI</div>
                <div className="flex items-center gap-1.5 text-[11.5px] text-slate-500">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${recording ? "animate-pulse bg-red-500" : "bg-emerald-500"}`} />
                  <span className="truncate">{recording ? t.listening : busy ? t.thinking : t.online}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAutoSpeak((v) => !v);
                  stopSpeech();
                }}
                aria-label={autoSpeak ? t.autoSpeakOn : t.autoSpeakOff}
                title={autoSpeak ? t.autoSpeakOn : t.autoSpeakOff}
                className={`flex h-9 w-9 items-center justify-center rounded-full ${autoSpeak ? "bg-[#EFF6FF] text-[#2563EB]" : "text-slate-500 hover:bg-slate-100"}`}
              >
                {autoSpeak ? <Volume2 size={17} /> : <VolumeX size={17} />}
              </button>
              <button
                type="button"
                onClick={() => {
                  const next = lang === "en" ? "ta" : "en";
                  setLang(next);
                  reset(next, role);
                }}
                disabled={busy || recording}
                aria-label={t.languageLabel}
                className="flex h-9 items-center gap-1 rounded-full bg-[#EFF6FF] px-2.5 text-[12px] font-bold text-[#2563EB] disabled:opacity-50"
              >
                <Globe size={14} /> {lang === "ta" ? "தமிழ்" : "EN"}
              </button>
              <button type="button" onClick={() => setOpen(false)} aria-label={t.close} className="flex h-9 w-9 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100">
                <X size={18} />
              </button>
            </header>

            {/* Role switch */}
            <div className="flex items-center gap-2 border-b border-slate-200 bg-white px-4 py-2">
              <div className="flex flex-1 rounded-full bg-slate-100 p-1" role="tablist">
                {ROLES.map((r) => (
                  <button
                    key={r}
                    type="button"
                    role="tab"
                    aria-selected={role === r}
                    disabled={busy || recording}
                    onClick={() => {
                      if (r === role) return;
                      setRole(r);
                      reset(lang, r);
                    }}
                    className={`flex-1 rounded-full py-1.5 text-[12.5px] font-semibold transition ${role === r ? "bg-white text-[#2563EB] shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                  >
                    {t.roles[r]}
                  </button>
                ))}
              </div>
              <button type="button" onClick={() => reset(lang, role)} aria-label={t.newChat} title={t.newChat} className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100">
                <RotateCcw size={15} />
              </button>
            </div>

            {/* Thread */}
            <div ref={threadRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4" aria-live="polite">
              {messages.map((m) =>
                m.from === "user" ? (
                  <div key={m.id} className="reva-msg-in flex justify-end">
                    <div className="max-w-[82%] whitespace-pre-line rounded-[18px] rounded-br-md bg-[#2563EB] px-3.5 py-2.5 text-[13.5px] leading-relaxed text-white">{m.text}</div>
                  </div>
                ) : (
                  <div key={m.id} className="reva-msg-in flex gap-2">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#2563EB]">
                      <RevaLogo size={16} />
                    </span>
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="w-fit max-w-full rounded-[18px] rounded-tl-md border border-slate-200 bg-white px-3.5 py-2.5 text-[13.5px] leading-relaxed text-slate-800">
                        <p className="whitespace-pre-line">{m.text}</p>
                        {m.action && (
                          <button type="button" onClick={() => goTo(m.action!)} className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-[#2563EB] px-3.5 py-1.5 text-[12.5px] font-semibold text-white hover:bg-[#1D4ED8]">
                            {m.action.label} <ArrowRight size={14} />
                          </button>
                        )}
                        <button type="button" onClick={() => speak(m.text)} className="mt-2 flex items-center gap-1 text-[11.5px] font-semibold text-slate-400 hover:text-[#2563EB]">
                          <Volume2 size={13} /> {t.speak}
                        </button>
                      </div>

                      {m.listings && (
                        <div className="-mr-4 flex gap-2.5 overflow-x-auto pb-1 pr-4">
                          {m.listings.map((p) =>
                            m.pickContact ? (
                              <button key={p.id} type="button" onClick={() => pickContact(p)} className="w-[170px] shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-white text-left transition hover:border-[#2563EB]">
                                <ListingBody p={p} />
                              </button>
                            ) : (
                              <Link key={p.id} href={`/properties/${p.id}`} onClick={() => setOpen(false)} className="w-[170px] shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:border-[#2563EB]">
                                <ListingBody p={p} />
                              </Link>
                            ),
                          )}
                        </div>
                      )}

                      {m.visits && (
                        <div className="space-y-2">
                          {m.visits.map((v) => (
                            <Link key={v.id} href={ROUTE_PATHS.Activity} onClick={() => setOpen(false)} className="block rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 hover:border-[#2563EB]">
                              <div className="truncate text-[13px] font-semibold text-slate-900">{v.title}</div>
                              <div className="truncate text-[11.5px] text-slate-500">
                                {[v.locality, new Date(v.at).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })].filter(Boolean).join(" · ")}
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}

                      {m.contact && (
                        <div className="rounded-2xl border border-slate-200 bg-white p-3.5">
                          <div className="text-[13.5px] font-bold text-slate-900">{m.contact.name}</div>
                          <div className="text-[11.5px] text-slate-500">{m.contact.role}</div>
                          <div className="mt-3 flex gap-2">
                            <a href={`tel:${m.contact.phone.replace(/\s/g, "")}`} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-[#2563EB] py-2 text-[12.5px] font-semibold text-white hover:bg-[#1D4ED8]">
                              <Phone size={14} /> {m.contact.phone}
                            </a>
                            <Link href={`/properties/${m.contact.property.id}`} onClick={() => setOpen(false)} className="inline-flex items-center rounded-full bg-slate-100 px-3 text-[12.5px] font-semibold text-slate-700 hover:bg-slate-200">
                              View
                            </Link>
                          </div>
                        </div>
                      )}

                      {m.chips && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {chips.map((c) => (
                            <button
                              key={c.label}
                              type="button"
                              disabled={busy}
                              onClick={() => submit(c.question, { dataKind: c.dataKind })}
                              className="rounded-full border border-[#DBEAFE] bg-white px-3 py-1.5 text-[12.5px] font-semibold text-[#1D4ED8] transition hover:bg-[#EFF6FF] disabled:opacity-50"
                            >
                              {c.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ),
              )}

              {busy && (
                <div className="reva-msg-in flex gap-2">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#2563EB]">
                    <RevaLogo size={16} />
                  </span>
                  <div className="flex items-center gap-1 rounded-[18px] rounded-tl-md border border-slate-200 bg-white px-4 py-3.5" aria-label={t.thinking}>
                    {[0, 1, 2].map((i) => (
                      <span key={i} className="reva-dot h-1.5 w-1.5 rounded-full bg-[#2563EB]" style={{ animationDelay: `${i * 140}ms` }} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Composer */}
            <div className="border-t border-slate-200 bg-white px-3 pb-3 pt-2.5">
              {error && <p className="mb-2 rounded-xl bg-red-50 px-3 py-2 text-[12px] font-medium text-red-600">{error}</p>}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  submit(draft);
                }}
                className="flex items-center gap-2"
              >
                <input
                  ref={inputRef}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value.slice(0, 500))}
                  placeholder={recording ? t.listening : t.placeholder}
                  disabled={recording}
                  className="h-11 min-w-0 flex-1 rounded-full border border-slate-200 bg-slate-50 px-4 text-[14px] text-slate-900 outline-none placeholder:text-slate-400 focus:border-[#2563EB] focus:bg-white"
                />
                <button
                  type="button"
                  onClick={toggleMic}
                  disabled={busy}
                  aria-label={recording ? t.stopRecording : t.startRecording}
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition disabled:opacity-50 ${recording ? "bg-red-500 text-white" : "bg-[#EFF6FF] text-[#2563EB] hover:bg-[#DBEAFE]"}`}
                >
                  {recording ? <Square size={16} fill="currentColor" /> : <Mic size={18} />}
                </button>
                <button
                  type="submit"
                  disabled={!draft.trim() || busy || recording}
                  aria-label={t.send}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#2563EB] text-white transition hover:bg-[#1D4ED8] disabled:bg-slate-300"
                >
                  <Send size={17} />
                </button>
              </form>
              <p className="mt-2 text-center text-[10.5px] text-slate-400">{t.disclaimer}</p>
            </div>
          </section>
        </div>
      )}
    </>
  );
}

function ListingBody({ p }: { p: Property }) {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={p.image} alt="" className="h-[96px] w-full bg-slate-200 object-cover" loading="lazy" />
      <div className="p-2.5">
        <div className="truncate text-[13px] font-bold text-[#2563EB]">{p.price}</div>
        <div className="truncate text-[12.5px] font-semibold text-slate-900">{p.name}</div>
        <div className="truncate text-[11.5px] text-slate-500">{[p.locality, p.city].filter(Boolean).join(", ")}</div>
      </div>
    </>
  );
}
