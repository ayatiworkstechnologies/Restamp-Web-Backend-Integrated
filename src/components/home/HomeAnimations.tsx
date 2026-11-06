'use client';

import { useEffect } from 'react';

/**
 * Scroll-reveal for the homepage: every top-level block after the hero/search
 * fades up as it enters the viewport, and the items of grids / lists inside it
 * stagger in one after another.
 */
export default function HomeAnimations() {
  useEffect(() => {
        const main = document.querySelector('main');
    if (!main) return;

    const blocks = Array.from(main.children).slice(2) as HTMLElement[]; // skip hero + search
    const targets: HTMLElement[] = [];

    blocks.forEach((block) => {
      block.classList.add('reveal');
      targets.push(block);
      block.querySelectorAll<HTMLElement>('.grid, ul').forEach((group) => {
        Array.from(group.children).slice(0, 12).forEach((child, i) => {
          const el = child as HTMLElement;
          el.classList.add('reveal-item');
          el.style.setProperty('--reveal-delay', `${100 + i * 50}ms`);
        });
      });
    });

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const block = e.target as HTMLElement;
            block.classList.add('is-visible');
            io.unobserve(block);
            // Hand control back to each card's own hover transforms once the reveal is done.
            window.setTimeout(() => {
              block.querySelectorAll<HTMLElement>('.reveal-item').forEach((el) => {
                el.classList.remove('reveal-item');
                el.style.removeProperty('--reveal-delay');
              });
              block.classList.remove('reveal', 'is-visible');
            }, 1600);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
    );
    targets.forEach((t) => io.observe(t));
    return () => io.disconnect();
  }, []);

  return null;
}
