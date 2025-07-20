'use client';

import React, { useState, useMemo, useRef } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Label } from '@/components/ui/Label';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Save } from 'lucide-react';
import { useExportModal } from '@/lib/context/ExportModalContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useSession } from '@/lib/hooks/useSession';
import SaveGraphButton from '@/components/shared/SaveGraphButton';

type PopulationPreset = 'expanding' | 'stable' | 'contracting';

interface PopulationPyramidProps {
  initialPreset?: PopulationPreset;
}

const pyramidPresets: { [key in PopulationPreset]: { male: number[], female: number[] } } = {
  expanding: { male: [10,9,8,7,6,5,4,3,2,1], female: [9.5,8.5,7.5,6.5,5.5,4.5,3.5,2.5,1.5,0.5] },
  stable:    { male: [6,6.5,7,7.5,7,6.5,6,5,4,3], female: [5.8,6.3,6.8,7.3,6.8,6.3,5.8,4.8,3.8,2.8] },
  contracting: { male: [4,4.5,5,6,7,8,8,7,6,5], female: [3.9,4.4,4.9,5.9,6.9,7.9,7.9,6.9,5.9,4.9] },
};
const ageBrackets = ['0-9', '10-19', '20-29', '30-39', '40-49', '50-59', '60-69', '70-79', '80-89', '90+'];

export default function PopulationPyramid({ initialPreset = 'expanding' }: PopulationPyramidProps) {
  const [preset, setPreset] = useState<PopulationPreset>(initialPreset);
  const diagramContainerRef = useRef<HTMLDivElement>(null);
  const { openExportModal } = useExportModal();
  const { session } = useSession();

  const data = useMemo(() => {
    const presetData = pyramidPresets[preset];
    return ageBrackets.map((age, i) => ({ age, Male: -presetData.male[i], Female: presetData.female[i] }));
  }, [preset]);
  
  const maxAbsValue = useMemo(() => {
    const allValues = data.flatMap(d => [Math.abs(d.Male), d.Female]);
    return Math.ceil(Math.max(...allValues));
  }, [data]);

  const tooltipFormatter = (value: number | string) => {
    if (typeof value === 'number') return `${Number(Math.abs(value).toFixed(1))}%`;
    return value;
  };

  const getDiagramState = () => ({
    initialPreset: preset
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-1">
        <Card>
          <CardHeader><CardTitle>Configuration</CardTitle></CardHeader>
          <div className="p-6 space-y-6">
            <div>
              <Label>Population Structure</Label>
              <Select value={preset} onChange={e => setPreset(e.target.value as PopulationPreset)} className="mt-2">
                <option value="expanding">Expanding</option>
                <option value="stable">Stable</option>
                <option value="contracting">Contracting</option>
              </Select>
            </div>
             <div className="flex flex-col gap-2 pt-4 border-t border-neutral-dark/30">
                <Button onClick={() => openExportModal(diagramContainerRef, 'population-pyramid')}>
                    <Save className="mr-2 h-4 w-4" /> Save & Export Image
                </Button>
                {session?.isLoggedIn && (
                  <SaveGraphButton diagramName="Population Pyramids" getDiagramState={getDiagramState} />
                )}
              </div>
          </div>
        </Card>
      </div>
      <div className="md:col-span-2 min-h-[500px]">
        <Card className="h-full !p-4">
          <div ref={diagramContainerRef} data-testid="diagram-container" className="w-full h-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical" margin={{ top: 20, right: 30, left: 20, bottom: 20 }} barCategoryGap="10%">
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                  <XAxis type="number" tickFormatter={(value) => `${Math.abs(value)}%`} domain={[-maxAbsValue, maxAbsValue]} allowDataOverflow={true} stroke="var(--color-text)" />
                  <YAxis type="category" dataKey="age" width={50} tick={{ fontSize: 12, fill: 'var(--color-text)' }} stroke="var(--color-text)" />
                  <Tooltip formatter={tooltipFormatter} contentStyle={{ backgroundColor: 'var(--color-neutral)', border: '1px solid var(--color-neutral-dark)', borderRadius: 'var(--border-radius-apple)' }} />
                  <Legend wrapperStyle={{ color: 'var(--color-text)', top: 0 }} verticalAlign="top" />
                  <Bar dataKey="Male" fill="var(--color-accent)" radius={[0, 5, 5, 0]} />
                  <Bar dataKey="Female" fill="var(--color-secondary)" radius={[0, 5, 5, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}