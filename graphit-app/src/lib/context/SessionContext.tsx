'use client';

import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { SessionData } from '@/lib/session';

interface SessionContextType {
  session: SessionData | null;
  isLoading: boolean;
  refetchSession: () => Promise<void>;
}

export const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSession = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/session');
      if (res.ok) {
        const data = await res.json();
        setSession(data);
      } else {
        setSession({ isLoggedIn: false });
      }
    } catch (error) {
      console.error('Failed to fetch session:', error);
      setSession({ isLoggedIn: false });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  const value = {
    session,
    isLoading,
    refetchSession: fetchSession,
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}