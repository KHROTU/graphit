'use client';

import React, { useState, useMemo, useRef } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Label } from '@/components/ui/Label';
import { Button } from '@/components/ui/Button';
import { Save } from 'lucide-react';
import { useExportModal } from '@/lib/context/ExportModalContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const formatValue = (value: number | string) => {
  if (typeof value === 'number') { return Number(value.toFixed(3)); }
  return value;
};

export default function ReactionRateGraph() {
  const [initialConc, setInitialConc] = useState(1.0);
  const [rateConstant, setRateConstant] = useState(0.1);
  const diagramContainerRef = useRef<HTMLDivElement>(null);
  const { openExportModal } = useExportModal();

  const data = useMemo(() => {
    const chartData = [];
    for (let t = 0; t <= 50; t++) {
      const concentration = initialConc * Math.exp(-rateConstant * t);
      chartData.push({ time: t, concentration: concentration });
    }
    return chartData;
  }, [initialConc, rateConstant]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-1">
        <Card>
          <CardHeader><CardTitle>Reaction Parameters</CardTitle></CardHeader>
          <div className="p-6 space-y-6">
              <div><Label>Initial Concentration (M): {initialConc.toFixed(2)}</Label><input type="range" min="0.1" max="2.0" step="0.1" value={initialConc} onChange={(e) => setInitialConc(Number(e.target.value))} className="w-full mt-2" /></div>
              <div><Label>Rate Constant (k): {rateConstant.toFixed(2)}</Label><input type="range" min="0.01" max="0.5" step="0.01" value={rateConstant} onChange={(e) => setRateConstant(Number(e.target.value))} className="w-full mt-2" /></div>
              <Button onClick={() => openExportModal(diagramContainerRef, 'reaction-rate-graph')} className="w-full !mt-8"><Save className="mr-2 h-4 w-4" /> Save & Export</Button>
          </div>
        </Card>
      </div>
      <div className="md:col-span-2 min-h-[400px]">
        <Card className="h-full !p-4">
          <div ref={diagramContainerRef} data-testid="diagram-container" className="w-full h-full">
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
          </div>
        </Card>
      </div>
    </div>
  );
}