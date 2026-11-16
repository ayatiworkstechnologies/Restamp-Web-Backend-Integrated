/**
 * RESTAMP Reva AI assistant API (POST /chat, GET /chat/health).
 *
 * The backend is the source of truth for everything Reva says: it grounds the
 * answer in real public listings and the signed-in caller's OWN account data,
 * resolves the role from the database (never from this request), and answers
 * from its verified knowledge base when no AI provider is configured
 * (`demo: true`). This module relays the question and never invents content.
 *
 * - Guests are answered with public data only; the bearer token is attached
 *   when a session exists, and a rejected token (fail-closed 401) falls back
 *   to one anonymous attempt so a stale sign-in never blocks chatting.
 * - Rate limiting and body caps live on the backend; 429 surfaces here as an
 *   ApiError(kind 'retry') with the backend's plain-language detail.
 */
import { ApiError, apiGet, apiRequest } from './client';
import { getSessionToken } from './session';

export type RevaListing = {
  listing_id: number;
  title: string;
  price_display: string;
  locality: string;
  city: string;
  property_type: string;
  bedrooms: number | null;
};

export type ChatTurn = { role: 'user' | 'assistant'; content: string };

export type ChatResponse = {
  reply: string;
  language: 'en' | 'ta';
  model: string;
  /** True when the backend answered from its verified knowledge base (no AI provider configured). */
  demo: boolean;
  listings: RevaListing[] | null;
};

export type ChatHealth = {
  ok: boolean;
  mode: 'ai' | 'demo';
  model: string;
  provider: string;
  languages: ('en' | 'ta')[];
  voice: boolean;
  agaram_ready: boolean;
};

/** The backend hard-caps these; the widget trims before calling. */
export const CHAT_MESSAGE_MAX_CHARS = 500;
export const CHAT_HISTORY_MAX_ITEMS = 12;
export const CHAT_HISTORY_ITEM_MAX_CHARS = 1000;

/** One chat turn. Sends the session token when the visitor is signed in;
 * if the backend rejects that token (fail-closed optional auth), the session
 * is cleared by the API client and the question is retried anonymously so
 * guests still get their public answer. */
export async function sendChatMessage(input: {
  message: string;
  language: 'en' | 'ta';
  history?: ChatTurn[];
}): Promise<ChatResponse> {
  const body = {
    message: input.message,
    language: input.language,
    // The backend validates history at 12 items × 1000 chars; cap here so an
    // over-long conversation is truncated (oldest turns dropped) instead of
    // being refused.
    history: (input.history ?? [])
      .slice(-CHAT_HISTORY_MAX_ITEMS)
      .map((turn) => ({
        role: turn.role,
        content: turn.content.slice(0, CHAT_HISTORY_ITEM_MAX_CHARS),
      })),
  };
  // Read BEFORE the request: the client clears the session on a rejected
  // token, so the catch cannot know whether one was presented.
  const hadToken = Boolean(getSessionToken());
  try {
    return await apiRequest<ChatResponse>('/chat', { method: 'POST', body, auth: true });
  } catch (e) {
    if (hadToken && e instanceof ApiError && e.kind === 'login') {
      // The presented token was rejected; answer as the guest the backend
      // can still serve (public data only).
      return await apiRequest<ChatResponse>('/chat', { method: 'POST', body, auth: false });
    }
    throw e;
  }
}

/** Service mode banner data for the widget header (demo answers vs live AI). */
export const getChatHealth = () => apiGet<ChatHealth>('/chat/health');
