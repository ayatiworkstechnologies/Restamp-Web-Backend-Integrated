import { Suspense } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import AgentScreen from '@/components/agent/AgentScreen';

export const metadata = {
  title: 'Restamp Agent Portal | Agent Network',
  description:
    'Dedicated Agent Portal for verified RERA agents. Access direct pre-approved buyer inquiries, analyze live market deal data, and close mandates with 0% platform commission.',
};

export default function AgentPortalPage() {
  return (
    <>
      <Header />
      <main>
        <Suspense
          fallback={
            <div className="min-h-screen bg-[#070e17] flex items-center justify-center text-slate-400">
              Loading Agent Portal...
            </div>
          }
        >
          <AgentScreen />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
