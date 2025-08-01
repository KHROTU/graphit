'use client';
import React, { useState, useRef, forwardRef } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Label } from '@/components/ui/Label';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Save } from 'lucide-react';
import { useExportModal } from '@/lib/context/ExportModalContext';
import { useSession } from '@/lib/hooks/useSession';
import SaveGraphButton from '@/components/shared/SaveGraphButton';

interface PunnettSquareProps {
  initialParent1?: string;
  initialParent2?: string;
}

const PunnettSquareDiagram = forwardRef<HTMLDivElement, { parent1: string, parent2: string }>(
  ({ parent1, parent2 }, ref) => {
    const p1_alleles = parent1.split('');
    const p2_alleles = parent2.split('');
    
    const results = p2_alleles.map(a2 => 
        p1_alleles.map(a1 => (a1 + a2).split('').sort().join(''))
    );

    return (
      <div ref={ref} data-testid="diagram-container" className="grid grid-cols-3 grid-rows-3 gap-2 w-80 h-80 p-2 font-mono text-4xl">
        <div />
        <div className="flex items-center justify-center bg-neutral-dark/30 rounded-lg font-bold">{p1_alleles[0] || '?'}</div>
        <div className="flex items-center justify-center bg-neutral-dark/30 rounded-lg font-bold">{p1_alleles[1] || '?'}</div>
        <div className="flex items-center justify-center bg-neutral-dark/30 rounded-lg font-bold">{p2_alleles[0] || '?'}</div>
        <div className="flex items-center justify-center bg-neutral/80 rounded-lg">{results[0]?.[0] || ''}</div>
        <div className="flex items-center justify-center bg-neutral/80 rounded-lg">{results[0]?.[1] || ''}</div>
        <div className="flex items-center justify-center bg-neutral-dark/30 rounded-lg font-bold">{p2_alleles[1] || '?'}</div>
        <div className="flex items-center justify-center bg-neutral/80 rounded-lg">{results[1]?.[0] || ''}</div>
        <div className="flex items-center justify-center bg-neutral/80 rounded-lg">{results[1]?.[1] || ''}</div>
      </div>
    );
});
PunnettSquareDiagram.displayName = 'PunnettSquareDiagram';


export default function PunnettSquare({ initialParent1 = 'Aa', initialParent2 = 'Aa' }: PunnettSquareProps) {
  const [parent1, setParent1] = useState(initialParent1);
  const [parent2, setParent2] = useState(initialParent2);
  const diagramContainerRef = useRef<HTMLDivElement>(null);
  const { openExportModal } = useExportModal();
  const { session } = useSession();

  const handleChange = (setter: React.Dispatch<React.SetStateAction<string>>, value: string) => {
    setter(value.replace(/[^A-Za-z]/g, '').slice(0, 2));
  };

  const getDiagramState = () => ({
    initialParent1: parent1,
    initialParent2: parent2,
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-1">
        <Card>
          <CardHeader><CardTitle>Configuration</CardTitle></CardHeader>
          <div className="p-6 space-y-6">
            <div><Label htmlFor="p1">Parent 1 Genotype</Label><Input id="p1" value={parent1} onChange={e => handleChange(setParent1, e.target.value)} className="mt-2" /></div>
            <div><Label htmlFor="p2">Parent 2 Genotype</Label><Input id="p2" value={parent2} onChange={e => handleChange(setParent2, e.target.value)} className="mt-2" /></div>
            
            <div className="flex flex-col gap-2 pt-4 border-t border-neutral-dark/30">
                <Button onClick={() => openExportModal(diagramContainerRef, 'punnett-square')}>
                  <Save className="mr-2 h-4 w-4" /> Save & Export Image
                </Button>
                {session?.isLoggedIn && (
                  <SaveGraphButton diagramName="Punnett Square Calculator" getDiagramState={getDiagramState} />
                )}
            </div>
          </div>
        </Card>
      </div>
      <div className="md:col-span-2 min-h-[400px] md:min-h-0">
        <Card className="h-full !p-2 flex items-center justify-center">
            <PunnettSquareDiagram ref={diagramContainerRef} parent1={parent1} parent2={parent2} />
        </Card>
      </div>
    </div>
  );
}