/**
 * Checkout draft bridge between /agent/packages (plan + localities chosen)
 * and /agent/payment.
 *
 * Keyed to the backend's REAL plan codes (the catalogue's `code` field) —
 * never invented package ids — and stored in sessionStorage per tab, like
 * the sign-in session. No plan prices or names live here: the pages fetch
 * the live catalogue themselves.
 */
export type AgentCheckoutDraft = {
  plan_code: string;
  localities: string[];
  updatedAt: string;
};

const KEY = 'restamp_agent_checkout_draft';

export function saveAgentCheckoutDraft(draft: AgentCheckoutDraft) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(draft));
  } catch {
    // Storage refused (private mode): the agent simply re-picks after login.
  }
}

export function getAgentCheckoutDraft(): AgentCheckoutDraft | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const draft = JSON.parse(raw) as AgentCheckoutDraft;
    if (!draft.plan_code || !Array.isArray(draft.localities)) return null;
    return draft;
  } catch {
    return null;
  }
}

export function clearAgentCheckoutDraft() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {}
}
