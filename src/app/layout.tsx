import type { Metadata } from 'next';
import { Manrope } from 'next/font/google';
import './globals.css';
import { WishlistLimitNotice } from '@/components/common/wishlist-limit-notice';
import { AppToaster } from '@/components/common/app-toaster';
import { ConfirmDialogHost } from '@/components/common/confirm-dialog';
import { RevaChatbot } from '@/components/reva/RevaChatbot';

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
        <WishlistLimitNotice />
        <AppToaster />
        <ConfirmDialogHost />
        <RevaChatbot />
      </body>
    </html>
  );
}