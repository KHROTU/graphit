'use client';

import React, { useReducer, useMemo, useRef } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Label } from '@/components/ui/Label';
import { Button } from '@/components/ui/Button';
import { Save, Plus } from 'lucide-react';
import { useExportModal } from '@/lib/context/ExportModalContext';
import { InputControl } from '../controls/InputControl';
import { ResistorInput } from '../controls/ResistorInput';

interface Resistor { id: number; value: number; }
type ResistorType = 'series' | 'parallel';
type State = {
  voltage: number;
  seriesResistors: Resistor[];
  parallelResistors: Resistor[];
};
type Action = 
  | { type: 'SET_VOLTAGE'; payload: number }
  | { type: 'ADD_RESISTOR'; payload: ResistorType }
  | { type: 'UPDATE_RESISTOR'; payload: { id: number; value: number; type: ResistorType } }
  | { type: 'REMOVE_RESISTOR'; payload: { id: number; type: ResistorType } };

function circuitReducer(state: State, action: Action): State {
    switch (action.type) {
        case 'SET_VOLTAGE': return { ...state, voltage: action.payload };
        case 'ADD_RESISTOR': {
            const newResistor = { id: Date.now(), value: 100 };
            const key = action.payload === 'series' ? 'seriesResistors' : 'parallelResistors';
            return { ...state, [key]: [...state[key], newResistor] };
        }
        case 'UPDATE_RESISTOR': {
            const { id, value, type } = action.payload;
            const key = type === 'series' ? 'seriesResistors' : 'parallelResistors';
            return { ...state, [key]: state[key].map(r => r.id === id ? { ...r, value } : r) };
        }
        case 'REMOVE_RESISTOR': {
            const { id, type } = action.payload;
            const key = type === 'series' ? 'seriesResistors' : 'parallelResistors';
            return { ...state, [key]: state[key].filter(r => r.id !== id) };
        }
        default: return state;
    }
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
    const initialState: State = {
        voltage: 12,
        seriesResistors: [{ id: 1, value: 100 }],
        parallelResistors: [{ id: 2, value: 200 }],
    };
    const [state, dispatch] = useReducer(circuitReducer, initialState);
    const { voltage, seriesResistors, parallelResistors } = state;

    const diagramContainerRef = useRef<HTMLDivElement>(null);
    const { openExportModal } = useExportModal();

    const { totalResistance, current } = useMemo(() => {
        const rSeries = seriesResistors.reduce((sum, r) => sum + r.value, 0);
        const rParallelInverse = parallelResistors.reduce((sum, r) => sum + (1 / r.value), 0);
        const rParallel = rParallelInverse > 0 ? 1 / rParallelInverse : 0;
        const total = rSeries + rParallel;
        const i = total > 0 ? voltage / total : 0;
        return { totalResistance: total, current: i };
    }, [voltage, seriesResistors, parallelResistors]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-1 space-y-4">
        <Card>
          <CardHeader><CardTitle>Circuit Parameters</CardTitle></CardHeader>
          <div className="p-4 space-y-4">
            <InputControl label="Voltage (V)" type="number" value={voltage} onChange={e => dispatch({ type: 'SET_VOLTAGE', payload: Number(e.target.value) })} />
            <div className="text-sm border-t border-neutral-dark/50 pt-4"><h4 className="font-semibold mb-2">Calculated Totals</h4><p>Total Resistance: <span className="font-mono text-accent">{formatValue(totalResistance)} Ω</span></p><p>Total Current: <span className="font-mono text-secondary">{formatValue(current)} A</span></p></div>
          </div>
        </Card>
        <Card>
          <CardHeader><CardTitle>Resistors</CardTitle></CardHeader>
          <div className="p-4 space-y-4 max-h-[400px] overflow-y-auto">
              <Label>Series</Label>
              {seriesResistors.map(r => (<ResistorInput key={r.id} value={r.value} onChange={(val) => dispatch({type: 'UPDATE_RESISTOR', payload: {id: r.id, value: val, type: 'series'}})} onRemove={() => dispatch({type: 'REMOVE_RESISTOR', payload: {id: r.id, type: 'series'}})} />))}
              <Button variant="outline" size="sm" onClick={() => dispatch({type: 'ADD_RESISTOR', payload: 'series'})} className="w-full"><Plus className="w-4 h-4 mr-2"/>Add Series</Button>
              <Label className="!mt-6">Parallel</Label>
              {parallelResistors.map(r => (<ResistorInput key={r.id} value={r.value} onChange={(val) => dispatch({type: 'UPDATE_RESISTOR', payload: {id: r.id, value: val, type: 'parallel'}})} onRemove={() => dispatch({type: 'REMOVE_RESISTOR', payload: {id: r.id, type: 'parallel'}})} />))}
              <Button variant="outline" size="sm" onClick={() => dispatch({type: 'ADD_RESISTOR', payload: 'parallel'})} className="w-full"><Plus className="w-4 h-4 mr-2"/>Add Parallel</Button>
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
                    {parallelResistors.length > 0 && (
                        <>
                            <path d="M 200 130 v -20" stroke="currentColor" strokeWidth="2" fill="none" />
                            <path d="M 200 170 v 20" stroke="currentColor" strokeWidth="2" fill="none" />
                            <path d="M 350 130 v -20" stroke="currentColor" strokeWidth="2" fill="none" />
                            <path d="M 350 170 v 20" stroke="currentColor" strokeWidth="2" fill="none" />
                        </>
                    )}
                    {parallelResistors.map((r, i) => {
                        const yPos = 150 + (i - (parallelResistors.length - 1) / 2) * 60;
                        return (<g key={r.id}><path d={`M 200 110 V ${yPos} H 250 M 300 ${yPos} H 350 V 110`} stroke="currentColor" strokeWidth="2" fill="none" /><path d={`M 200 190 V ${yPos} H 250 M 300 ${yPos} H 350 V 190`} stroke="currentColor" strokeWidth="2" fill="none" /><ResistorShape x={275} y={yPos} label={`${r.value}Ω`} /></g>);
                    })}
                </svg>
            </div>
        </Card>
      </div>
    </div>
  );
}