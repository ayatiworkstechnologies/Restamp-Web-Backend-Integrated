"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AgentEarningsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/agent/dashboard');
  }, [router]);

  return null;
}
