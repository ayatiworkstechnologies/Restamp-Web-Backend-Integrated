import type { Metadata } from 'next';
import LegalPage from '@/components/legal/LegalPage';

export const metadata: Metadata = {
  title: 'Terms and Conditions | Restamp',
  description: 'The terms that govern your use of Restamp.',
};

// DRAFT: review with a legal advisor before publishing.
export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Terms and Conditions"
      updated="4 November 2026"
      intro={<p>These terms govern your use of the Restamp website and apps. Please read them carefully. By creating an account or using Restamp, you agree to be bound by these terms.</p>}
      sections={[
        { id: 'service', title: 'About Restamp', body: <p>Restamp is an online platform that connects property buyers and tenants with property owners and verified agents. Restamp is not a party to any sale, purchase or rental agreement between users and does not act as a broker unless expressly stated.</p> },
        { id: 'accounts', title: 'Your account', body: (<ul><li>You must be at least 18 years old to create an account.</li><li>You are responsible for the accuracy of the information you provide and for keeping your login secure.</li><li>We may suspend or close accounts that break these terms or misuse the platform.</li></ul>) },
        { id: 'listings', title: 'Property listings', body: (<><p>Only property owners may post properties on Restamp. Agents may view owner properties and respond to enquiries within their subscribed locations.</p><ul><li>Listings must be accurate, lawful and relate to property you own or are authorised to list.</li><li>We may review, edit or remove listings that are misleading, duplicate or violate these terms.</li><li>Restamp does not guarantee the title, condition or legal status of any property. Please verify all details independently before any transaction.</li></ul></>) },
        { id: 'plans', title: 'Plans and payments', body: (<ul><li>Paid plans for owners and agents are billed as shown at checkout, including applicable GST.</li><li>Plan benefits, validity and limits are described on the plan pages.</li><li>Fees are non-refundable except where required by law or stated otherwise in writing.</li></ul>) },
        { id: 'conduct', title: 'Acceptable use', body: (<><p>You agree not to:</p><ul><li>Post false, fraudulent or offensive content.</li><li>Contact users for spam or purposes unrelated to their listing or enquiry.</li><li>Copy, scrape or resell data from Restamp without permission.</li><li>Interfere with the security or operation of the platform.</li></ul></>) },
        { id: 'liability', title: 'Limitation of liability', body: <p>Restamp is provided on an &quot;as is&quot; basis. To the extent permitted by law, Restamp is not liable for any loss arising from transactions between users, inaccurate listings, or interruptions to the service.</p> },
        { id: 'law', title: 'Governing law', body: <p>These terms are governed by the laws of India. Any disputes are subject to the exclusive jurisdiction of the courts in Chennai, Tamil Nadu.</p> },
        { id: 'changes', title: 'Changes to these terms', body: <p>We may update these terms from time to time. Continued use of Restamp after changes are posted means you accept the updated terms.</p> },
      ]}
    />
  );
}
