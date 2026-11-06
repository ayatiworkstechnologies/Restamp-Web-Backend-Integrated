import type { Metadata } from 'next';
import { AdminAuthProvider } from '@/context/admin-auth-context';

export const metadata: Metadata = {
  title: 'Restamp Admin Login | Secure Access Portal',
  description: 'Official Restamp administrator sign in',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/restamplogo.svg', type: 'image/svg+xml' },
    ],
    apple: '/restamplogo.svg',
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminAuthProvider>{children}</AdminAuthProvider>;
}
