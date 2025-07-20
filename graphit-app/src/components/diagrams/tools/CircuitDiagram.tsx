'use client';

import React, { useState, useMemo, useRef } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Label } from '@/components/ui/Label';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Save, Plus, Trash2 } from 'lucide-react';
import { useExportModal } from '@/lib/context/ExportModalContext';

interface Resistor {
  id: number;
  value: number;
}

const formatValue = (value: number) => Number(value.toFixed(2));

const Battery = ({ x, y, label }: { x: number; y: number; label: string }) => (
  <g transform={`translate(${x}, ${y})`}>
    <path d="M 0 -20 v 40" stroke="currentColor" strokeWidth="2" />
    <path d="M -15 -12 h 30" stroke="currentColor" strokeWidth="2" />
    <path d="M -8 12 h 16" stroke="currentColor" strokeWidth="4" />
    <text x="25" y="5" fontSize="12" className="fill-current">{label}</text>
  </g>
);

const ResistorShape = ({ x, y, label }: { x: number; y: number; label: string }) => (
  <g transform={`translate(${x}, ${y})`}>
    <path d="M -25 0 h 10 l 5 -10 l 10 20 l 10 -20 l 10 20 l 5 -10 h 10" stroke="currentColor" strokeWidth="2" fill="none" />
    <text x="0" y="25" textAnchor="middle" fontSize="12" className="fill-current">{label}</text>
  </g>
);

export default function CircuitDiagram() {
    const [voltage, setVoltage] = useState(12);
    const [seriesResistors, setSeriesResistors] = useState<Resistor[]>([{ id: 1, value: 100 }]);
    const [parallelResistors, setParallelResistors] = useState<Resistor[]>([{ id: 2, value: 200 }]);
    const diagramContainerRef = useRef<HTMLDivElement>(null);
    const { openExportModal } = useExportModal();

    const addResistor = (type: 'series' | 'parallel') => {
        const newResistor = { id: Date.now(), value: 100 };
        if (type === 'series') setSeriesResistors([...seriesResistors, newResistor]);
        else setParallelResistors([...parallelResistors, newResistor]);
    };

    const updateResistor = (id: number, newValue: number, type: 'series' | 'parallel') => {
        const list = type === 'series' ? seriesResistors : parallelResistors;
        const setter = type === 'series' ? setSeriesResistors : setParallelResistors;
        setter(list.map(r => r.id === id ? { ...r, value: newValue } : r));
    };
    
    const removeResistor = (id: number, type: 'series' | 'parallel') => {
        const list = type === 'series' ? seriesResistors : parallelResistors;
        const setter = type === 'series' ? setSeriesResistors : setParallelResistors;
        setter(list.filter(r => r.id !== id));
    };

    const { totalResistance, current } = useMemo(() => {
        const rSeries = seriesResistors.reduce((sum, r) => sum + r.value, 0);
        const rParallel = 1 / parallelResistors.reduce((sum, r) => sum + (1 / r.value), 0);
        const total = rSeries + (isFinite(rParallel) ? rParallel : 0);
        const i = voltage / total;
        return { totalResistance: total, current: i };
    }, [voltage, seriesResistors, parallelResistors]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-1 space-y-4">
        <Card>
          <CardHeader><CardTitle>Circuit Parameters</CardTitle></CardHeader>
          <div className="p-4 space-y-4">
            <div><Label>Voltage (V)</Label><Input type="number" value={voltage} onChange={e => setVoltage(Number(e.target.value))} /></div>
            <div className="text-sm border-t border-neutral-dark/50 pt-4"><h4 className="font-semibold mb-2">Calculated Totals</h4><p>Total Resistance: <span className="font-mono text-accent">{formatValue(totalResistance)} Ω</span></p><p>Total Current: <span className="font-mono text-secondary">{formatValue(current)} A</span></p></div>
          </div>
        </Card>
        <Card>
          <CardHeader><CardTitle>Resistors</CardTitle></CardHeader>
          <div className="p-4 space-y-4 max-h-[400px] overflow-y-auto">
              <Label>Series</Label>
              {seriesResistors.map(r => (<div key={r.id} className="flex gap-2 items-center"><Input type="number" value={r.value} onChange={e => updateResistor(r.id, Number(e.target.value), 'series')} /><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeResistor(r.id, 'series')}><Trash2 className="w-4 h-4 text-red-500"/></Button></div>))}
              <Button variant="outline" size="sm" onClick={() => addResistor('series')} className="w-full"><Plus className="w-4 h-4 mr-2"/>Add Series</Button>
              <Label className="!mt-6">Parallel</Label>
              {parallelResistors.map(r => (<div key={r.id} className="flex gap-2 items-center"><Input type="number" value={r.value} onChange={e => updateResistor(r.id, Number(e.target.value), 'parallel')} /><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeResistor(r.id, 'parallel')}><Trash2 className="w-4 h-4 text-red-500"/></Button></div>))}
              <Button variant="outline" size="sm" onClick={() => addResistor('parallel')} className="w-full"><Plus className="w-4 h-4 mr-2"/>Add Parallel</Button>
          </div>
           <div className="p-4 border-t border-neutral-dark/30"><Button onClick={() => openExportModal(diagramContainerRef, 'circuit-diagram')} className="w-full"><Save className="mr-2 h-4 w-4" /> Save & Export</Button></div>
        </Card>
      </div>
      <div className="md:col-span-2 min-h-[500px]">
        <Card className="h-full !p-2">
            <div ref={diagramContainerRef} data-testid="diagram-container" className="w-full h-full bg-neutral-dark/30 rounded-apple">
                <svg viewBox="0 0 400 300" className="w-full h-full text-text">
                    <Battery x={50} y={150} label={`${voltage}V`} />
                    <path d="M 50 130 V 50 H 350 V 130" stroke="currentColor" strokeWidth="2" fill="none" />
                    <path d="M 50 170 V 250 H 350 V 170" stroke="currentColor" strokeWidth="2" fill="none" />
                    {seriesResistors.map((r, i) => <ResistorShape key={r.id} x={120 + i * 80} y={50} label={`${r.value}Ω`} />)}
                    {parallelResistors.map((r, i) => {
                        const yPos = 150 + (i - (parallelResistors.length - 1) / 2) * 60;
                        return (<g key={r.id}><path d={`M 200 130 V ${yPos-15} H 250 M 300 ${yPos-15} H 350 V 130`} stroke="currentColor" strokeWidth="2" fill="none" /><path d={`M 200 170 V ${yPos+15} H 250 M 300 ${yPos+15} H 350 V 170`} stroke="currentColor" strokeWidth="2" fill="none" /><ResistorShape x={275} y={yPos-15} label={`${r.value}Ω`} /></g>);
                    })}
                </svg>
            </div>
        </Card>
      </div>
    </div>
  );
}