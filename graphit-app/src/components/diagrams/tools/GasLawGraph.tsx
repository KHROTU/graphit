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

const R = 0.0821;

export default function GasLawGraph() {
  const [moles, setMoles] = useState(1);
  const [volume, setVolume] = useState(22.4);
  const diagramContainerRef = useRef<HTMLDivElement>(null);
  const { openExportModal } = useExportModal();

  const data = useMemo(() => {
    const chartData = [];
    const slope = (moles * R) / volume;
    for (let tempK = 0; tempK <= 500; tempK += 25) {
      const pressure = slope * tempK;
      chartData.push({ temperature: tempK, pressure: pressure });
    }
    return chartData;
  }, [moles, volume]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-1">
        <Card>
          <CardHeader><CardTitle>Gas Parameters</CardTitle></CardHeader>
          <div className="p-6 space-y-6">
              <div><Label>Moles of Gas (n): {moles.toFixed(2)}</Label><input type="range" min="0.1" max="5.0" step="0.1" value={moles} onChange={(e) => setMoles(Number(e.target.value))} className="w-full mt-2" /></div>
              <div><Label>Volume (L): {volume.toFixed(1)}</Label><input type="range" min="5" max="50" step="0.5" value={volume} onChange={(e) => setVolume(Number(e.target.value))} className="w-full mt-2" /></div>
              <Button onClick={() => openExportModal(diagramContainerRef, 'gas-law-graph')} className="w-full !mt-8"><Save className="mr-2 h-4 w-4" /> Save & Export</Button>
          </div>
        </Card>
      </div>
      <div className="md:col-span-2 min-h-[400px]">
        <Card className="h-full !p-4">
          <div ref={diagramContainerRef} data-testid="diagram-container" className="w-full h-full">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                    <XAxis type="number" dataKey="temperature" domain={[0, 'dataMax']} stroke="var(--color-text)" label={{ value: 'Temperature (K)', position: 'insideBottom', offset: -10, fill: 'var(--color-text)' }} />
                    <YAxis type="number" domain={[0, 'dataMax']} stroke="var(--color-text)" label={{ value: 'Pressure (atm)', angle: -90, position: 'insideLeft', fill: 'var(--color-text)' }} />
                    <Tooltip formatter={formatValue} contentStyle={{ backgroundColor: 'var(--color-neutral)', border: '1px solid var(--color-neutral-dark)', borderRadius: 'var(--border-radius-apple)' }} />
                    <Legend verticalAlign="top" height={36} wrapperStyle={{ color: 'var(--color-text)' }} />
                    <Line type="monotone" dataKey="pressure" stroke="var(--color-accent)" strokeWidth={2} dot={false} name="Pressure vs. Temperature" />
                </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}