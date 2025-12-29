'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { syncAnalytics } from '@/lib/analytics';

export default function AnalyticsSync() {
  const pathname = usePathname();

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        syncAnalytics();
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', syncAnalytics);

    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', syncAnalytics);
    };
  }, [pathname]);

  return null;
}