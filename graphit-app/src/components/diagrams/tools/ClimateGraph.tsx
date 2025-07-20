'use client';

import React, { useState, useMemo, useRef } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Label } from '@/components/ui/Label';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Save } from 'lucide-react';
import { useExportModal } from '@/lib/context/ExportModalContext';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useSession } from '@/lib/hooks/useSession';
import SaveGraphButton from '@/components/shared/SaveGraphButton';

type ClimatePreset = 'rainforest' | 'desert' | 'tundra';

interface ClimateGraphProps {
  initialPreset?: ClimatePreset;
}

const climatePresets: { [key in ClimatePreset]: { temp: number[], precip: number[] } } = {
  rainforest: { temp: [27,27,28,28,27,26,26,26,27,27,27,27], precip: [250,230,280,300,290,180,160,150,180,220,240,260] },
  desert:     { temp: [12,15,20,25,30,35,38,37,32,26,18,13], precip: [5,5,5,2,1,0,0,1,2,5,5,5] },
  tundra:     { temp: [-25,-26,-22,-15,-5,2,5,4,-1,-10,-18,-22], precip: [10,8,10,10,10,15,25,30,20,15,12,10] },
};
const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function ClimateGraph({ initialPreset = 'rainforest' }: ClimateGraphProps) {
  const [preset, setPreset] = useState<ClimatePreset>(initialPreset);
  const diagramContainerRef = useRef<HTMLDivElement>(null);
  const { openExportModal } = useExportModal();
  const { session } = useSession();

  const data = useMemo(() => {
    const climateData = climatePresets[preset];
    return months.map((month, i) => ({ month, Temperature: climateData.temp[i], Precipitation: climateData.precip[i] }));
  }, [preset]);

  const tooltipFormatter = (value: number | string, name: string) => {
    const formattedValue = typeof value === 'number' ? Number(value.toFixed(1)) : value;
    if (name === 'Temperature') return `${formattedValue}°C`;
    if (name === 'Precipitation') return `${formattedValue}mm`;
    return formattedValue;
  };

  const getDiagramState = () => ({
    initialPreset: preset,
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-1">
        <Card>
          <CardHeader><CardTitle>Configuration</CardTitle></CardHeader>
          <div className="p-6 space-y-6">
              <div>
                <Label>Climate Type</Label>
                <Select value={preset} onChange={e => setPreset(e.target.value as ClimatePreset)} className="mt-2">
                  <option value="rainforest">Tropical Rainforest</option>
                  <option value="desert">Hot Desert</option>
                  <option value="tundra">Arctic Tundra</option>
                </Select>
              </div>
              <div className="flex flex-col gap-2 pt-4 border-t border-neutral-dark/30">
                <Button onClick={() => openExportModal(diagramContainerRef, 'climate-graph')}>
                    <Save className="mr-2 h-4 w-4" /> Save & Export Image
                </Button>
                {session?.isLoggedIn && (
                  <SaveGraphButton diagramName="Climate Graphs" getDiagramState={getDiagramState} />
                )}
              </div>
          </div>
        </Card>
      </div>
      <div className="md:col-span-2 min-h-[400px] md:min-h-0">
        <Card className="h-full !p-4">
          <div ref={diagramContainerRef} data-testid="diagram-container" className="w-full h-full">
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                    <XAxis dataKey="month" stroke="var(--color-text)" label={{ value: 'Month', position: 'insideBottom', offset: -10, fill: 'var(--color-text)' }} />
                    <YAxis yAxisId="left" orientation="left" stroke="var(--color-accent)" label={{ value: 'Precipitation (mm)', angle: -90, position: 'insideLeft', fill: 'var(--color-accent)' }}/>
                    <YAxis yAxisId="right" orientation="right" stroke="var(--color-secondary)" label={{ value: 'Temperature (°C)', angle: 90, position: 'insideRight', fill: 'var(--color-secondary)' }}/>
                    <Tooltip formatter={tooltipFormatter} contentStyle={{ backgroundColor: 'var(--color-neutral)', border: '1px solid var(--color-neutral-dark)', borderRadius: 'var(--border-radius-apple)', color: 'var(--color-text)' }} />
                    <Legend wrapperStyle={{ color: 'var(--color-text)' }} verticalAlign="top" height={36}/>
                    <Bar yAxisId="left" dataKey="Precipitation" fill="var(--color-accent)" fillOpacity={0.8} />
                    <Line yAxisId="right" type="monotone" dataKey="Temperature" stroke="var(--color-secondary)" strokeWidth={2} />
                </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}