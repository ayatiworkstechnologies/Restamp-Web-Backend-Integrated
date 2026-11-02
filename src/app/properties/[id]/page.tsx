import PropertyDetailsLoader from '@/components/property/PropertyDetailsLoader';

export const metadata = {
  title: 'Property Details | Restamp',
  description: 'Verified property details, photos and owner contact on Restamp.',
};

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PropertyDetailsLoader id={id} />;
}
