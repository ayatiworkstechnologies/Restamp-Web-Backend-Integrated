import { redirect } from 'next/navigation';
import { safeInternalPath } from '@/lib/safeRedirect';

// The separate agent login page was removed; agents sign in on the main login page.
// ?next= is forwarded only when it is a same-site path (rejects //host, "\" and
// tab tricks, full URLs); /login checks it again before navigating.
export default async function AgentLoginRedirect({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const target = safeInternalPath(next);
  redirect(target ? `/login?role=agent&next=${encodeURIComponent(target)}` : '/login?role=agent');
}
