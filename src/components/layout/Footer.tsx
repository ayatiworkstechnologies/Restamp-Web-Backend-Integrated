import Link from 'next/link';
import Image from 'next/image';

// TODO: replace '#' with Restamp's real social profile URLs.
const socials = [
  { name: 'Facebook', href: '#', path: 'M24 12.07C24 5.41 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.04V9.41c0-3.02 1.8-4.7 4.54-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.5c-1.5 0-1.96.93-1.96 1.89v2.26h3.32l-.53 3.5h-2.8V24C19.62 23.1 24 18.1 24 12.07' },
  { name: 'WhatsApp', href: '#', path: 'M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.39-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.5h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.07c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.7.62.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2-1.41.25-.7.25-1.29.18-1.41-.07-.13-.27-.2-.57-.35M12.05 21.8h-.01a9.9 9.9 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.9-9.88 2.64 0 5.12 1.03 6.99 2.9a9.82 9.82 0 0 1 2.89 6.99c0 5.45-4.44 9.88-9.89 9.88m8.41-18.3A11.81 11.81 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.68 1.45h.01c6.55 0 11.89-5.34 11.89-11.9 0-3.18-1.24-6.16-3.48-8.41' },
  { name: 'Instagram', href: '#', path: 'M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.72 3.72 0 0 1-1.38-.9 3.72 3.72 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16M12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63c-.79.3-1.46.72-2.12 1.38A5.86 5.86 0 0 0 .63 4.14C.33 4.9.13 5.78.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91.3.79.72 1.46 1.38 2.12.66.66 1.33 1.08 2.12 1.38.76.3 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56a5.86 5.86 0 0 0 2.12-1.38 5.86 5.86 0 0 0 1.38-2.12c.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91a5.86 5.86 0 0 0-1.38-2.12A5.86 5.86 0 0 0 19.86.63C19.1.33 18.22.13 16.95.07 15.67.01 15.26 0 12 0m0 5.84a6.16 6.16 0 1 0 0 12.32 6.16 6.16 0 0 0 0-12.32M12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8m6.4-11.85a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88' },
  { name: 'X', href: '#', path: 'M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.41l-5.8-7.58-6.64 7.58H.47l8.6-9.83L0 1.15h7.59l5.24 6.93 6.07-6.93Zm-1.29 19.5h2.04L6.48 3.24H4.3l13.31 17.41Z' },
  { name: 'YouTube', href: '#', path: 'M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.5A3.02 3.02 0 0 0 .5 6.19C0 8.07 0 12 0 12s0 3.93.5 5.81a3.02 3.02 0 0 0 2.12 2.14c1.88.5 9.38.5 9.38.5s7.5 0 9.38-.5a3.02 3.02 0 0 0 2.12-2.14C24 15.93 24 12 24 12s0-3.93-.5-5.81M9.55 15.57V8.43L15.82 12l-6.27 3.57' },
];

export default function Footer() {
  return (
    <footer className="bg-[#0b1622] text-slate-400 pt-12 sm:pt-16 md:pt-20 pb-8 sm:pb-10 md:pb-12 border-t border-slate-800">
      <div className="container-site grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 sm:gap-10 text-sm pb-12 sm:pb-16 md:pb-18">
        {/* Brand Column */}
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2.5 text-white font-bold tracking-tight text-2xl group"
          >
            <Image src="/restamp-logo-full-white.svg" alt="Restamp" width={149} height={40} className="h-10 w-auto" />
          </Link>
          <p className="mt-3.5 text-xs text-slate-400 leading-relaxed max-w-xs">
            A new chapter starts with the right address.
          </p>
          <Link
            href="/#download-app"
            className="inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-white mt-5 transition font-medium"
          >
            <span>Explore the Restamp app</span>
            <span>↗</span>
          </Link>
          <div className="mt-6 flex items-center gap-2.5">
            {socials.map((s) => (
              <a
                key={s.name}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Restamp on ${s.name}`}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-slate-300 ring-1 ring-white/10 hover:bg-[#087ed9] hover:text-white hover:ring-[#087ed9] active:scale-[0.97]"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
                  <path d={s.path} />
                </svg>
              </a>
            ))}
          </div>
        </div>

        {/* Find your property */}
        <div>
          <strong className="text-white text-sm font-semibold block mb-4">
            Find your property
          </strong>
          <div className="flex flex-col gap-2.5 text-xs">
            <Link href="/buy" className="hover:text-white transition">
              Property for sale
            </Link>
            <Link href="/rent" className="hover:text-white transition">
              Property for rent
            </Link>
            <Link href="/projects" className="hover:text-white transition">
              New residential projects
            </Link>
            <Link href="/saved" className="hover:text-white transition">
              Your saved properties
            </Link>
          </div>
        </div>

        {/* For owners & agents */}
        <div>
          <strong className="text-white text-sm font-semibold block mb-4">
            Owners &amp; Agents
          </strong>
          <div className="flex flex-col gap-2.5 text-xs">
            <Link href="/sell" className="hover:text-white transition">
              Post property (Property Studio)
            </Link>
            <Link href="/owner" className="hover:text-white transition">
              Owner portal
            </Link>
            <Link href="/agent" className="hover:text-white transition">
              Agent hub
            </Link>
            <Link href="/agent/dashboard" className="hover:text-white transition">
              Agent deal console
            </Link>
          </div>
        </div>

        {/* Support */}
        <div>
          <strong className="text-white text-sm font-semibold block mb-4">
            Support
          </strong>
          <div className="flex flex-col gap-2.5 text-xs">
            <Link href="/help" className="hover:text-white transition">
              Help Center
            </Link>
            <Link href="/contact" className="hover:text-white transition">
              Contact Us
            </Link>
            <Link href="/privacy-policy" className="hover:text-white transition">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-white transition">
              Terms and Conditions
            </Link>
          </div>
        </div>
      </div>

      {/* Horizontal Divider Line */}
      <div className="container-site">
        <div className="border-t border-slate-800/80 w-full" />
      </div>

      {/* Bottom Copyright Strip */}
      <div className="container-site pt-8 pb-2 text-center text-xs text-slate-400">
        <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
          <span>Copyright @ 2026 by Restamp - All Right Reserved</span>
          <span className="hidden sm:inline text-slate-600">|</span>
          <span>
            Design &amp; Developed by{' '}
            <a
              href="https://ayatiworks.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-300 hover:text-white transition font-medium underline underline-offset-2 decoration-slate-600 hover:decoration-white"
            >
              Ayatiworks
            </a>
          </span>
        </p>
      </div>
    </footer>
  );
}