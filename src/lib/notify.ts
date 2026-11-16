"use client";

import { toast as sonner, type ExternalToast } from "sonner";

/**
 * Site-wide feedback helpers.
 *
 * - `toast.*`  : short status messages (top-right on desktop, top-center on phones).
 * - `snackbar` : one-line confirmation at the bottom-center, optionally with an action
 *                such as "Undo" or "View".
 *
 * Both render through <AppToaster />, mounted once in the root layout, so they work on
 * the public website, the owner/agent dashboards and the admin dashboard.
 */
type Opts = Pick<ExternalToast, "description" | "duration" | "id">;

export const toast = {
  success: (message: string, opts?: Opts) => sonner.success(message, opts),
  error: (message: string, opts?: Opts) => sonner.error(message, { duration: 6000, ...opts }),
  info: (message: string, opts?: Opts) => sonner.info(message, opts),
  warning: (message: string, opts?: Opts) => sonner.warning(message, opts),
  loading: (message: string, opts?: Opts) => sonner.loading(message, opts),
  promise: sonner.promise,
  dismiss: sonner.dismiss,
};

export const SNACKBAR_ID = "snackbar";

export function snackbar(
  message: string,
  opts?: { actionLabel?: string; onAction?: () => void; duration?: number; description?: string },
) {
  return sonner(message, {
    toasterId: SNACKBAR_ID,
    description: opts?.description,
    duration: opts?.duration ?? 5000,
    action: opts?.actionLabel && opts.onAction ? { label: opts.actionLabel, onClick: opts.onAction } : undefined,
  });
}
