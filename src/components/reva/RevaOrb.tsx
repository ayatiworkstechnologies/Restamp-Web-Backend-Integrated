"use client";

import { useEffect, useState } from "react";

/**
 * Reva AI avatar: gradient squircle with drifting colour blobs, gentle
 * breathing, and two glowing eyes that blink and glance now and then.
 * Pure CSS; honours prefers-reduced-motion.
 */
export function RevaOrb({ size = 58, animated = true }: { size?: number; animated?: boolean }) {
  const [blink, setBlink] = useState(false);
  const [look, setLook] = useState(0);

  useEffect(() => {
    if (!animated) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    let alive = true;
    let t: ReturnType<typeof setTimeout>;
    const schedule = () => {
      t = setTimeout(() => {
        if (!alive) return;
        setBlink(true);
        setTimeout(() => alive && setBlink(false), 140);
        if (Math.random() < 0.4) {
          const dir = Math.random() < 0.5 ? -1 : 1;
          setTimeout(() => alive && setLook(dir), 260);
          setTimeout(() => alive && setLook(0), 1100);
        }
        schedule();
      }, 2500 + Math.random() * 2500);
    };
    schedule();
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [animated]);

  const eyeW = size * 0.11;
  const eyeH = size * 0.2;

  return (
    <span
      className={`reva-orb relative block shrink-0 overflow-hidden ${animated ? "reva-breathe" : ""}`}
      style={{ width: size, height: size, borderRadius: size * 0.42 }}
      aria-hidden
    >
      <span className="absolute inset-0" style={{ background: "linear-gradient(135deg,#5AA8F5 0%,#4D63EA 55%,#5B8FE0 100%)" }} />
      <span
        className={`absolute ${animated ? "reva-spin" : ""}`}
        style={{
          width: size * 1.8,
          height: size * 1.8,
          left: -size * 0.4,
          top: -size * 0.4,
          background:
            "radial-gradient(circle at 32% 38%, rgba(94,235,242,.95), transparent 22%), radial-gradient(circle at 70% 30%, rgba(179,140,240,.85), transparent 18%), radial-gradient(circle at 66% 70%, rgba(95,198,201,.8), transparent 22%)",
        }}
      />
      <span
        className="absolute inset-0 flex items-center justify-center transition-transform duration-300 ease-out"
        style={{ gap: size * 0.14, paddingBottom: size * 0.06, transform: `translateX(${look * size * 0.06}px) scaleY(${blink ? 0.1 : 1})` }}
      >
        {[0, 1].map((i) => (
          <span key={i} className="relative flex items-center justify-center" style={{ width: eyeW * 2, height: eyeH * 1.6 }}>
            <span className="absolute rounded-full bg-white/30" style={{ width: eyeW * 2, height: eyeH * 1.5 }} />
            <span className="relative rounded-full bg-white" style={{ width: eyeW, height: eyeH }} />
          </span>
        ))}
      </span>
    </span>
  );
}

/** Small Reva mark: speech bubble with two eyes. */
export function RevaLogo({ size = 16, color = "#FFFFFF", eyeColor = "#2563EB" }: { size?: number; color?: string; eyeColor?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <path d="M7 3H17A5 5 0 0 1 22 8V13A5 5 0 0 1 17 18H9.6L5.3 21.3C4.6 21.8 3.8 21.4 3.8 20.6V17.1A5 5 0 0 1 2 13V8A5 5 0 0 1 7 3Z" fill={color} />
      <rect x={8.1} y={8.3} width={2.3} height={4.4} rx={1.15} fill={eyeColor} />
      <rect x={13.6} y={8.3} width={2.3} height={4.4} rx={1.15} fill={eyeColor} />
    </svg>
  );
}
