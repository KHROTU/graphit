'use client';

import React, { useReducer, useMemo, useRef } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Label } from '@/components/ui/Label';
import { Button } from '@/components/ui/Button';
import { Save } from 'lucide-react';
import { useExportModal } from '@/lib/context/ExportModalContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

type State = { initialConc: number; rateConstant: number; };
type Action = 
    | { type: 'SET_CONC', payload: number }
    | { type: 'SET_RATE_CONSTANT', payload: number };

function reducer(state: State, action: Action): State {
    switch(action.type) {
        case 'SET_CONC': return { ...state, initialConc: action.payload };
        case 'SET_RATE_CONSTANT': return { ...state, rateConstant: action.payload };
        default: return state;
    }
}

const formatValue = (value: number | string) => {
  if (typeof value === 'number') return Number(value.toFixed(3));
  return value;
};

export default function ReactionRateGraph() {
  const initialState: State = { initialConc: 1.0, rateConstant: 0.1 };
  const [state, dispatch] = useReducer(reducer, initialState);
  const { initialConc, rateConstant } = state;

  const diagramContainerRef = useRef<HTMLDivElement>(null);
  const { openExportModal } = useExportModal();

  const data = useMemo(() => {
    return Array.from({ length: 51 }, (_, t) => ({
      time: t,
      concentration: initialConc * Math.exp(-rateConstant * t),
    }));
  }, [initialConc, rateConstant]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-1">
        <Card>
          <CardHeader><CardTitle>Reaction Parameters</CardTitle></CardHeader>
          <div className="p-6 space-y-6">
              <div><Label>Initial Concentration (M): {initialConc.toFixed(2)}</Label><input type="range" min="0.1" max="2.0" step="0.1" value={initialConc} onChange={(e) => dispatch({type: 'SET_CONC', payload: Number(e.target.value)})} className="w-full mt-2" /></div>
              <div><Label>Rate Constant (k): {rateConstant.toFixed(2)}</Label><input type="range" min="0.01" max="0.5" step="0.01" value={rateConstant} onChange={(e) => dispatch({type: 'SET_RATE_CONSTANT', payload: Number(e.target.value)})} className="w-full mt-2" /></div>
              <Button onClick={() => openExportModal(diagramContainerRef, 'reaction-rate-graph')} className="w-full !mt-8"><Save className="mr-2 h-4 w-4" /> Save & Export</Button>
          </div>
        </Card>
      </div>
      <div className="md:col-span-2 min-h-[400px]">
        <Card className="h-full !p-4" ref={diagramContainerRef} data-testid="diagram-container">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                    <XAxis type="number" dataKey="time" domain={[0, 'dataMax']} stroke="var(--color-text)" label={{ value: 'Time (s)', position: 'insideBottom', offset: -10, fill: 'var(--color-text)' }} />
                    <YAxis type="number" domain={[0, 'dataMax']} stroke="var(--color-text)" label={{ value: 'Concentration (M)', angle: -90, position: 'insideLeft', fill: 'var(--color-text)' }} />
                    <Tooltip formatter={formatValue} contentStyle={{ backgroundColor: 'var(--color-neutral)', border: '1px solid var(--color-neutral-dark)', borderRadius: 'var(--border-radius-apple)' }} />
                    <Legend verticalAlign="top" height={36} wrapperStyle={{ color: 'var(--color-text)' }} />
                    <Line type="monotone" dataKey="concentration" stroke="var(--color-accent)" strokeWidth={2} dot={false} name="Reactant Concentration" />
                </LineChart>
            </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}