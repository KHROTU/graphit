'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface SearchContextType {
  isOpen: boolean;
  openSearch: () => void;
  closeSearch: () => Promise<void>;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export const SearchProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);

  const openSearch = () => setIsOpen(true);

  const closeSearch = async () => {
    setIsOpen(false);
    
    try {
      const rawData = localStorage.getItem('graphit-analytics');
      if (rawData) {
        const analyticsData = JSON.parse(rawData);
        
        const response = await fetch('/api/sync-analytics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(analyticsData),
        });

        if (response.ok) {
          localStorage.removeItem('graphit-analytics');
          console.log('Local analytics data synced and cleared.');
        } else {
          console.error('Failed to sync analytics with the server.');
        }
      }
    } catch (error) {
      console.error('Error during analytics sync:', error);
    }
  };

  const value = { isOpen, openSearch, closeSearch };

  return (
    <SearchContext.Provider value={value}>
      {children}
    </SearchContext.Provider>
  );
};

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
};