'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import DashboardClient from '@/components/dashboard/DashboardClient';

export default function HomePage() {
  const searchParams = useSearchParams();
  const [userId, setUserId] = useState(1);

  useEffect(() => {
    const urlUserId = searchParams.get('userId');
    const sessionUserId = sessionStorage.getItem('paynesuite_userId');
    const id = parseInt(urlUserId || sessionUserId || '1');
    setUserId(id);
    sessionStorage.setItem('paynesuite_userId', id.toString());
  }, [searchParams]);

  return <DashboardClient userId={userId} />;
}
