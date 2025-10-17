'use client';

import React, { useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useExportModal } from '@/lib/context/ExportModalContext';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import { Download, X as CloseIcon } from 'lucide-react';
import SteamSupportUnit from './SteamSupportUnit';

export default function ExportModal() {
  const { isOpen, closeExportModal, diagramName } = useExportModal();
  const [padding, setPadding] = useState(32);
  const [isExporting, setIsExporting] = useState(false);

  const handleDownload = useCallback(async () => {
    setIsExporting(true);
    
    const safeDiagramName = diagramName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const fileName = `${safeDiagramName || 'diagram'}.png`;

    try {
      const response = await fetch('/api/screenshot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          urlPath: window.location.pathname + window.location.search,
          padding: padding,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Export failed:', error);
      alert('Sorry, there was an error exporting your diagram. Please check the console for details.');
    } finally {
      setIsExporting(false);
      closeExportModal();
    }
  }, [padding, diagramName, closeExportModal]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4" onClick={closeExportModal}>
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }} className="bg-neutral/95 backdrop-blur-sm rounded-[var(--border-radius-apple)] w-full max-w-sm flex flex-col gap-4 p-6 shadow-xl" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            <div className="flex justify-between items-center"><h3 className="text-lg font-semibold">Export Diagram</h3><Button variant="ghost" size="icon" className="h-8 w-8" onClick={closeExportModal}><CloseIcon className="h-4 w-4"/></Button></div>
            
            <div className="space-y-4">
              <div><Label>Padding ({padding}px)</Label><input type="range" min="0" max="100" value={padding} onChange={e => setPadding(Number(e.target.value))} className="w-full mt-2" /></div>
            </div>
            <SteamSupportUnit />
            <Button onClick={handleDownload} className="w-full" disabled={isExporting}>
              {isExporting ? 'Generating your image...' : <><Download className="mr-2 h-4 w-4" /> Download as PNG</>}
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}