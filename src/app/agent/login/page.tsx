import { redirect } from 'next/navigation';

// The separate agent login page was removed; agents sign in on the main login page.
export default async function AgentLoginRedirect({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  redirect(next ? `/login?role=agent&next=${encodeURIComponent(next)}` : '/login?role=agent');
}
