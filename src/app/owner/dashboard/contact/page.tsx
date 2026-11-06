import ContactUs from '@/components/dashboard-shared/ContactUs';

export default function OwnerContactPage() {
  return <ContactUs role="owner" topics={['Plan & payments', 'My properties', 'Leads & site visits', 'Account & login', 'Other']} />;
}
