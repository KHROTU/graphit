'use client';
import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
export interface LocalUserData {
  username: string;
}
interface SessionContextType {
  user: LocalUserData | null;
  isLoading: boolean;
  setUsername: (name: string) => void;
  clearUser: () => void;
}
export const SessionContext = createContext<SessionContextType | undefined>(undefined);
const USER_KEY = 'graphit-user';
export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<LocalUserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    try {
      const stored = localStorage.getItem(USER_KEY);
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch {
      // ignore parse errors
    }
    setIsLoading(false);
  }, []);
  const setUsername = useCallback((name: string) => {
    const data: LocalUserData = { username: name };
    localStorage.setItem(USER_KEY, JSON.stringify(data));
    setUser(data);
  }, []);
  const clearUser = useCallback(() => {
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }, []);
  return (
    <SessionContext.Provider value={{ user, isLoading, setUsername, clearUser }}>
      {children}
    </SessionContext.Provider>
  );
}