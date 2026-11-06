import type { Metadata } from 'next';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ContactUs from '@/components/dashboard-shared/ContactUs';

export const metadata: Metadata = {
  title: 'Contact Us | Restamp',
  description: 'Get in touch with the Restamp team for help buying, renting or listing property.',
};

export default function ContactPage() {
  return (
    <>
      <Header />
      <main className="bg-slate-50">
        <div className="container-site py-10 sm:py-14">
          <ContactUs
            role="visitor"
            topics={['Buying a property', 'Renting a property', 'Listing my property', 'Becoming an agent', 'Other']}
          />
        </div>
      </main>
      <Footer />
    </>
  );
}
