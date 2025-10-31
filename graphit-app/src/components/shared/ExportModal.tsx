'use client';

import React, { useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useExportModal } from '@/lib/context/ExportModalContext';
import { Button } from '@/components/ui/Button';
import { Download, X as CloseIcon, Loader2 } from 'lucide-react';
import SteamSupportUnit from './SteamSupportUnit';
import { toPng } from 'html-to-image';

export default function ExportModal() {
  const { isOpen, closeExportModal, diagramName, sourceRef } = useExportModal();
  const [isExporting, setIsExporting] = useState(false);

  const handleDownload = useCallback(async () => {
    if (!sourceRef?.current) {
        alert('Error: Diagram element not found for export.');
        return;
    }
    setIsExporting(true);
    
    const element = sourceRef.current;
    const { width, height } = element.getBoundingClientRect();
    
    const safeDiagramName = diagramName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const fileName = `${safeDiagramName || 'diagram'}.png`;

    try {
        const dataUrl = await toPng(element, {
            width: Math.round(width),
            height: Math.round(height),
            cacheBust: true,
            pixelRatio: 2,
            skipFonts: true,
        });

        const link = document.createElement('a');
        link.download = fileName;
        link.href = dataUrl;
        link.click();
        link.remove();

    } catch (error) {
      console.error('Client-side export failed:', error);
      alert('Sorry, there was an error exporting your diagram. Please check the console for details and try again.');
    } finally {
      setIsExporting(false);
      closeExportModal();
    }
  }, [diagramName, sourceRef, closeExportModal]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4" onClick={closeExportModal}>
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }} className="bg-neutral/95 backdrop-blur-sm rounded-[var(--border-radius-apple)] w-full max-w-sm flex flex-col gap-4 p-6 shadow-xl" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            <div className="flex justify-between items-center"><h3 className="text-lg font-semibold">Export Diagram</h3><Button variant="ghost" size="icon" className="h-8 w-8" onClick={closeExportModal}><CloseIcon className="h-4 w-4"/></Button></div>
            
            <SteamSupportUnit />
            
            <Button onClick={handleDownload} className="w-full" disabled={isExporting}>
              {isExporting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</> : <><Download className="mr-2 h-4 w-4" /> Download as PNG</>}
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}