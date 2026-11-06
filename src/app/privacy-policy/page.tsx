import type { Metadata } from 'next';
import LegalPage from '@/components/legal/LegalPage';

export const metadata: Metadata = {
  title: 'Privacy Policy | Restamp',
  description: 'How Restamp collects, uses and protects your personal information.',
};

// DRAFT: review with a legal advisor before publishing.
export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Privacy Policy"
      updated="4 November 2026"
      intro={<p>This policy explains what personal information Restamp collects when you use our website and apps, how we use it, and the choices you have. By using Restamp, you agree to the practices described here.</p>}
      sections={[
        { id: 'collect', title: 'Information we collect', body: (<><p>We collect information you give us and information created when you use Restamp:</p><ul><li>Account details such as your name, mobile number, email address and city.</li><li>Property details, photos and documents you upload when listing a property.</li><li>Enquiries, site-visit requests and messages you send through Restamp.</li><li>Payment records for plans you purchase (card and UPI details are handled by our payment partners, not stored by us).</li><li>Device and usage data such as pages visited, searches and approximate location.</li></ul></>) },
        { id: 'use', title: 'How we use your information', body: (<ul><li>To create and manage your account and verify your identity.</li><li>To show listings, connect buyers and tenants with owners and agents, and deliver enquiries.</li><li>To process payments and send receipts and plan notifications.</li><li>To improve search results, prevent fraud and keep the platform safe.</li><li>To send service messages and, with your consent, offers and updates.</li></ul>) },
        { id: 'share', title: 'How we share information', body: (<><p>We do not sell your personal information. We share it only:</p><ul><li>With owners or agents you choose to contact, so they can respond to your enquiry.</li><li>With service providers who help us run Restamp (hosting, payments, SMS and email), under confidentiality obligations.</li><li>When required by law or to protect the rights and safety of our users.</li></ul></>) },
        { id: 'security', title: 'Data security and retention', body: <p>We use reasonable technical and organisational measures to protect your data. We keep personal information only as long as needed to provide our services or to meet legal, tax and accounting requirements.</p> },
        { id: 'rights', title: 'Your choices and rights', body: <p>You can view and update your profile at any time. You may ask us to correct or delete your personal information, or withdraw consent for marketing messages, by contacting us. Some information may be retained where the law requires it.</p> },
        { id: 'cookies', title: 'Cookies', body: <p>We use cookies and similar technologies to keep you signed in, remember your preferences and understand how Restamp is used. You can control cookies through your browser settings.</p> },
        { id: 'changes', title: 'Changes to this policy', body: <p>We may update this policy from time to time. We will post the updated version on this page and change the date above. Significant changes will be notified through the website or by message.</p> },
      ]}
    />
  );
}
