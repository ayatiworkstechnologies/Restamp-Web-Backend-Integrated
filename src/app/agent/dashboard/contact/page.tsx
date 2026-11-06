import ContactUs from '@/components/dashboard-shared/ContactUs';

export default function AgentContactPage() {
  return <ContactUs role="agent" topics={['Plan & payments', 'Leads & enquiries', 'Owner properties', 'Account & login', 'Other']} />;
}
