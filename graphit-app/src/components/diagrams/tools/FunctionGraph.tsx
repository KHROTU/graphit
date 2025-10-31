'use client';

import React, { useReducer, useMemo, useRef } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Label } from '@/components/ui/Label';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Save, Plus, Trash2 } from 'lucide-react';
import { useExportModal } from '@/lib/context/ExportModalContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { parse } from 'mathjs';

interface FunctionPlot { id: number; equation: string; color: string; }
type State = {
    plots: FunctionPlot[];
    xDomain: { min: number; max: number };
    yDomain: { min: number; max: number };
};
type Action = 
    | { type: 'ADD_PLOT' }
    | { type: 'UPDATE_PLOT', payload: { id: number, field: keyof FunctionPlot, value: string } }
    | { type: 'REMOVE_PLOT', payload: { id: number } }
    | { type: 'SET_DOMAIN', payload: { axis: 'x' | 'y', limit: 'min' | 'max', value: number } };

const defaultColors = ['#38bdf8', '#f87171', '#34d399', '#a78bfa', '#facc15'];

function reducer(state: State, action: Action): State {
    switch(action.type) {
        case 'ADD_PLOT': {
            const newId = Date.now();
            const newColor = defaultColors[state.plots.length % defaultColors.length];
            return { ...state, plots: [...state.plots, { id: newId, equation: 'sin(x)', color: newColor }] };
        }
        case 'UPDATE_PLOT': {
            const { id, field, value } = action.payload;
            return { ...state, plots: state.plots.map(p => p.id === id ? { ...p, [field]: value } : p) };
        }
        case 'REMOVE_PLOT': {
            return { ...state, plots: state.plots.filter(p => p.id !== action.payload.id) };
        }
        case 'SET_DOMAIN': {
            const { axis, limit, value } = action.payload;
            const domainKey = axis === 'x' ? 'xDomain' : 'yDomain';
            return { ...state, [domainKey]: { ...state[domainKey], [limit]: value }};
        }
        default: return state;
    }
}

const formatValue = (value: unknown): React.ReactNode => {
  if (typeof value === 'number') return Number(value.toFixed(2));
  return String(value);
};

export default function FunctionGraph() {
  const initialState: State = {
      plots: [
        { id: 1, equation: '2*x + 1', color: defaultColors[0] },
        { id: 2, equation: 'x^2 - 2*x - 3', color: defaultColors[1] },
      ],
      xDomain: { min: -10, max: 10 },
      yDomain: { min: -10, max: 10 },
  };
  const [state, dispatch] = useReducer(reducer, initialState);
  const { plots, xDomain, yDomain } = state;

  const diagramContainerRef = useRef<HTMLDivElement>(null);
  const { openExportModal } = useExportModal();

  const data = useMemo(() => {
    const chartData: { [key: string]: number }[] = [];
    const step = (xDomain.max - xDomain.min) / 200;
    for (let x = xDomain.min; x <= xDomain.max; x += step) {
      const point: { [key: string]: number } = { x: x };
      plots.forEach(plot => {
        try {
          point[plot.id] = parse(plot.equation).compile().evaluate({ x });
        } catch { point[plot.id] = NaN; }
      });
      chartData.push(point);
    }
    return chartData;
  }, [plots, xDomain]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-1">
        <Card>
          <CardHeader><CardTitle>Graph Controls</CardTitle></CardHeader>
          <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
            <Label className="font-semibold">Functions</Label>
            {plots.map(p => (
              <div key={p.id} className="flex items-center gap-2">
                <Input type="color" value={p.color} onChange={e => dispatch({type: 'UPDATE_PLOT', payload: {id: p.id, field: 'color', value: e.target.value}})} className="w-12 h-10 p-1" />
                <Input value={p.equation} onChange={e => dispatch({type: 'UPDATE_PLOT', payload: {id: p.id, field: 'equation', value: e.target.value}})} placeholder="y = ..." />
                <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => dispatch({type: 'REMOVE_PLOT', payload: {id: p.id}})}><Trash2 className="w-4 h-4 text-red-500"/></Button>
              </div>
            ))}
            <Button variant="outline" onClick={() => dispatch({type: 'ADD_PLOT'})} className="w-full"><Plus className="mr-2 h-4 w-4"/>Add Function</Button>
            <div className="border-t border-neutral-dark/50 pt-4 space-y-2">
                <Label className="font-semibold">Axis Domain</Label>
                <div className="flex gap-2">
                    <Input type="number" value={xDomain.min} onChange={e => dispatch({type: 'SET_DOMAIN', payload: {axis: 'x', limit: 'min', value: Number(e.target.value)}})} placeholder="X Min" />
                    <Input type="number" value={xDomain.max} onChange={e => dispatch({type: 'SET_DOMAIN', payload: {axis: 'x', limit: 'max', value: Number(e.target.value)}})} placeholder="X Max" />
                </div>
                <div className="flex gap-2">
                    <Input type="number" value={yDomain.min} onChange={e => dispatch({type: 'SET_DOMAIN', payload: {axis: 'y', limit: 'min', value: Number(e.target.value)}})} placeholder="Y Min" />
                    <Input type="number" value={yDomain.max} onChange={e => dispatch({type: 'SET_DOMAIN', payload: {axis: 'y', limit: 'max', value: Number(e.target.value)}})} placeholder="Y Max" />
                </div>
            </div>
          </div>
          <div className="p-4 border-t border-neutral-dark/30">
            <Button onClick={() => openExportModal(diagramContainerRef, 'function-graph')} className="w-full"><Save className="mr-2 h-4 w-4"/> Save & Export</Button>
          </div>
        </Card>
      </div>
      <div className="md:col-span-2 min-h-[500px]">
        <Card className="h-full !p-4" ref={diagramContainerRef} data-testid="diagram-container">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2}/>
                <XAxis type="number" dataKey="x" domain={[xDomain.min, xDomain.max]} allowDataOverflow />
                <YAxis type="number" domain={[yDomain.min, yDomain.max]} allowDataOverflow />
                <Tooltip formatter={formatValue} labelFormatter={v => `x = ${formatValue(v)}`}/>
                <Legend />
                <ReferenceLine y={0} stroke="var(--color-text)" strokeWidth={1} strokeOpacity={0.5}/>
                <ReferenceLine x={0} stroke="var(--color-text)" strokeWidth={1} strokeOpacity={0.5}/>
                {plots.map(p => <Line key={p.id} type="monotone" dataKey={String(p.id)} stroke={p.color} strokeWidth={2} dot={false} name={`y = ${p.equation}`} connectNulls />)}
              </LineChart>
            </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}