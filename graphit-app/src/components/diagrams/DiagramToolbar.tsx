'use client';
import React from 'react';
import { Button } from '@/components/ui/Button';
import { Save, Undo2 } from 'lucide-react';
import SaveGraphButton from '@/components/shared/SaveGraphButton';
interface DiagramToolbarProps {
  diagramName: string;
  getDiagramState: () => Record<string, unknown>;
  onExport: () => void;
  onReset: () => void;
}
export function DiagramToolbar({ diagramName, getDiagramState, onExport, onReset }: DiagramToolbarProps) {
  return (
    <div className="flex flex-col gap-2 pt-4 border-t border-neutral-dark/30">
      <Button onClick={onExport}>
        <Save className="mr-2 h-4 w-4" /> Save & Export Image
      </Button>
      <SaveGraphButton diagramName={diagramName} getDiagramState={getDiagramState} />
      <Button variant="ghost" size="sm" onClick={onReset} className="text-text/60">
        <Undo2 className="mr-2 h-3.5 w-3.5" /> Reset to Default
      </Button>
    </div>
  );
}