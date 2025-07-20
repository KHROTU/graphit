'use client';

import React, { createContext, useContext, useState, ReactNode, RefObject } from 'react';

interface ExportModalContextType {
  openExportModal: (sourceRef: RefObject<HTMLDivElement | null>, diagramName: string) => void;
  closeExportModal: () => void;
  isOpen: boolean;
  sourceRef: RefObject<HTMLDivElement | null> | null;
  diagramName: string;
}

const ExportModalContext = createContext<ExportModalContextType | undefined>(undefined);

export const ExportModalProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [sourceRef, setSourceRef] = useState<RefObject<HTMLDivElement | null> | null>(null);
  const [diagramName, setDiagramName] = useState('');

  const openExportModal = (ref: RefObject<HTMLDivElement | null>, name: string) => {
    setSourceRef(ref);
    setDiagramName(name);
    setIsOpen(true);
  };

  const closeExportModal = () => {
    setIsOpen(false);
    setTimeout(() => {
        setSourceRef(null);
        setDiagramName('');
    }, 300);
  };

  const value = { isOpen, openExportModal, closeExportModal, sourceRef, diagramName };

  return (
    <ExportModalContext.Provider value={value}>
      {children}
    </ExportModalContext.Provider>
  );
};

export const useExportModal = () => {
  const context = useContext(ExportModalContext);
  if (context === undefined) {
    throw new Error('useExportModal must be used within an ExportModalProvider');
  }
  return context;
};