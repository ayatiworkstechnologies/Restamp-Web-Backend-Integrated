"use client";

import { Toaster } from "sonner";
import { SNACKBAR_ID } from "@/lib/notify";

/** Mount once (root layout). Renders both toasts and snackbars for the whole site. */
export function AppToaster() {
  return (
    <>
      {/* Toasts: white cards with a coloured icon */}
      <Toaster
        position="top-right"
        richColors
        closeButton
        visibleToasts={4}
        offset={{ top: 88, right: 24 }}
        mobileOffset={{ top: 76, left: 16, right: 16 }}
        toastOptions={{
          duration: 4000,
          style: { fontFamily: "var(--font-manrope), system-ui, sans-serif", borderRadius: 14 },
        }}
      />

      {/* Snackbars: dark bar at the bottom with an optional action */}
      <Toaster
        id={SNACKBAR_ID}
        position="bottom-center"
        visibleToasts={1}
        offset={{ bottom: 24 }}
        mobileOffset={{ bottom: 16, left: 16, right: 16 }}
        toastOptions={{
          unstyled: true,
          classNames: {
            toast:
              "flex w-full sm:w-[420px] items-center gap-3 rounded-xl bg-[#16233d] px-4 py-3 text-[13px] font-medium text-white shadow-[0_12px_32px_rgba(15,23,42,0.28)]",
            title: "flex-1 leading-snug",
            description: "text-[12px] text-slate-300",
            actionButton:
              "shrink-0 rounded-lg px-2.5 py-1 text-[12px] font-bold uppercase tracking-wide text-[#8fb4ff] hover:bg-white/10",
          },
        }}
      />
    </>
  );
}
