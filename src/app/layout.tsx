import type { Metadata } from 'next';
import { Manrope } from 'next/font/google';
import './globals.css';
import { AppToaster } from '@/components/common/app-toaster';
import { ConfirmDialogHost } from '@/components/common/confirm-dialog';
import { RevaAssistant } from '@/components/reva/RevaAssistant';

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-manrope',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Restamp | Find your next home',
  description: 'Discover homes, projects and places with Restamp.',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/restamplogo.svg', type: 'image/svg+xml' },
    ],
    apple: '/restamplogo.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={manrope.variable}>
      <body className={manrope.className}>
        {children}
        {/* Site-wide toasts/snackbars and the confirmation dialog host (mounted once). */}
        <AppToaster />
        <ConfirmDialogHost />
        {/* Site-wide Reva AI assistant (floating chat widget, mounted once). */}
        <RevaAssistant />
      </body>
    </html>
  );
}