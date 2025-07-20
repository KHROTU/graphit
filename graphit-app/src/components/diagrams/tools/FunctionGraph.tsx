'use client';

import React, { useState, useMemo, useRef } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Label } from '@/components/ui/Label';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Save, Plus, Trash2 } from 'lucide-react';
import { useExportModal } from '@/lib/context/ExportModalContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { parse } from 'mathjs';

interface FunctionPlot {
  id: number;
  equation: string;
  color: string;
}

const formatValue = (value: unknown): React.ReactNode => {
  if (typeof value === 'number') return Number(value.toFixed(2));
  return String(value);
};

const defaultColors = ['#38bdf8', '#f87171', '#34d399', '#a78bfa', '#facc15'];

export default function FunctionGraph() {
  const [plots, setPlots] = useState<FunctionPlot[]>([
    { id: 1, equation: '2*x + 1', color: defaultColors[0] },
    { id: 2, equation: 'x^2 - 2*x - 3', color: defaultColors[1] },
  ]);
  const [xDomain, setXDomain] = useState({ min: -10, max: 10 });
  const [yDomain, setYDomain] = useState({ min: -10, max: 10 });
  const diagramContainerRef = useRef<HTMLDivElement>(null);
  const { openExportModal } = useExportModal();

  const data = useMemo(() => {
    const chartData: { [key: string]: number }[] = [];
    const step = (xDomain.max - xDomain.min) / 200;

    for (let x = xDomain.min; x <= xDomain.max; x += step) {
      const point: { [key: string]: number } = { x: x };
      plots.forEach(plot => {
        try {
          const node = parse(plot.equation);
          const compiled = node.compile();
          point[plot.id] = compiled.evaluate({ x: x });
        } catch {
          point[plot.id] = NaN;
        }
      });
      chartData.push(point);
    }
    return chartData;
  }, [plots, xDomain]);

  const addPlot = () => {
    const newId = Date.now();
    const newColor = defaultColors[plots.length % defaultColors.length];
    setPlots([...plots, { id: newId, equation: 'sin(x)', color: newColor }]);
  };

  const updatePlot = (id: number, field: keyof FunctionPlot, value: string) => {
    setPlots(plots.map(p => p.id === id ? { ...p, [field]: value } : p));
  };
  
  const removePlot = (id: number) => setPlots(plots.filter(p => p.id !== id));

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-1">
        <Card>
          <CardHeader><CardTitle>Graph Controls</CardTitle></CardHeader>
          <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
            <Label className="font-semibold">Functions</Label>
            {plots.map(p => (
              <div key={p.id} className="flex items-center gap-2">
                <Input type="color" value={p.color} onChange={e => updatePlot(p.id, 'color', e.target.value)} className="w-12 h-10 p-1" />
                <Input value={p.equation} onChange={e => updatePlot(p.id, 'equation', e.target.value)} placeholder="y = ..." />
                <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => removePlot(p.id)}><Trash2 className="w-4 h-4 text-red-500"/></Button>
              </div>
            ))}
            <Button variant="outline" onClick={addPlot} className="w-full"><Plus className="mr-2 h-4 w-4"/>Add Function</Button>
            <div className="border-t border-neutral-dark/50 pt-4 space-y-2">
                <Label className="font-semibold">Axis Domain</Label>
                <div className="flex gap-2"><Input type="number" value={xDomain.min} onChange={e => setXDomain({...xDomain, min: Number(e.target.value)})} placeholder="X Min" /><Input type="number" value={xDomain.max} onChange={e => setXDomain({...xDomain, max: Number(e.target.value)})} placeholder="X Max" /></div>
                <div className="flex gap-2"><Input type="number" value={yDomain.min} onChange={e => setYDomain({...yDomain, min: Number(e.target.value)})} placeholder="Y Min" /><Input type="number" value={yDomain.max} onChange={e => setYDomain({...yDomain, max: Number(e.target.value)})} placeholder="Y Max" /></div>
            </div>
          </div>
          <div className="p-4 border-t border-neutral-dark/30">
            <Button onClick={() => openExportModal(diagramContainerRef, 'function-graph')} className="w-full"><Save className="mr-2 h-4 w-4"/> Save & Export</Button>
          </div>
        </Card>
      </div>
      <div className="md:col-span-2 min-h-[500px]">
        <Card className="h-full !p-4">
          <div ref={diagramContainerRef} data-testid="diagram-container" className="w-full h-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2}/>
                <XAxis type="number" dataKey="x" domain={[xDomain.min, xDomain.max]} allowDataOverflow />
                <YAxis type="number" domain={[yDomain.min, yDomain.max]} allowDataOverflow />
                <Tooltip formatter={formatValue} labelFormatter={v => `x = ${formatValue(v)}`}/>
                <Legend />
                <ReferenceLine y={0} stroke="var(--color-text)" strokeWidth={1} strokeOpacity={0.5}/>
                <ReferenceLine x={0} stroke="var(--color-text)" strokeWidth={1} strokeOpacity={0.5}/>
                {plots.map(p => <Line key={p.id} type="monotone" dataKey={p.id} stroke={p.color} strokeWidth={2} dot={false} name={`y = ${p.equation}`} />)}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}