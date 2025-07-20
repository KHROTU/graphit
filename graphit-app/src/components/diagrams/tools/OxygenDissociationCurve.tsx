'use client';

import React, { useState, useMemo, useRef } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Label } from '@/components/ui/Label';
import { Button } from '@/components/ui/Button';
import { Save } from 'lucide-react';
import { useExportModal } from '@/lib/context/ExportModalContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useSession } from '@/lib/hooks/useSession';
import SaveGraphButton from '@/components/shared/SaveGraphButton';

interface OxygenCurveProps {
  initialPh?: number;
}

const formatValue = (val: unknown): React.ReactNode => {
    if (typeof val === 'number') return val.toFixed(1);
    return String(val);
};

export default function OxygenDissociationCurve({ initialPh = 7.4 }: OxygenCurveProps) {
  const [ph, setPh] = useState(initialPh);
  const diagramContainerRef = useRef<HTMLDivElement>(null);
  const { openExportModal } = useExportModal();
  const { session } = useSession();

  const data = useMemo(() => {
    const chartData = [];
    // Hill equation parameters for hemoglobin
    const n = 2.8; // Hill coefficient
    const P50_ref = 3.5; // pO2 at 50% saturation at pH 7.4 (in kPa)
    
    // Bohr effect: P50 increases as pH decreases
    const P50 = P50_ref * Math.pow(10, (7.4 - ph) * 0.5);

    for (let pO2 = 0; pO2 <= 14; pO2 += 0.2) {
      const saturation = 100 * (Math.pow(pO2, n) / (Math.pow(P50, n) + Math.pow(pO2, n)));
      chartData.push({
        'pO2': pO2,
        'Saturation': saturation,
      });
    }
    return chartData;
  }, [ph]);

  const getDiagramState = () => ({
    initialPh: ph,
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-1">
        <Card>
          <CardHeader><CardTitle>Oxygen-Hemoglobin Curve</CardTitle></CardHeader>
          <div className="p-6 space-y-6">
            <div>
              <Label>Blood pH (Bohr Shift): {ph.toFixed(2)}</Label>
              <input type="range" min="7.0" max="7.6" step="0.05" value={ph} onChange={(e) => setPh(Number(e.target.value))} className="w-full mt-2" />
              <p className="text-xs text-text/60 mt-2">
                Lower pH (e.g., in respiring tissues) shifts the curve right, promoting oxygen release.
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-4 border-t border-neutral-dark/30">
              <Button onClick={() => openExportModal(diagramContainerRef, 'oxygen-dissociation-curve')}>
                  <Save className="mr-2 h-4 w-4" /> Save & Export Image
              </Button>
              {session?.isLoggedIn && (
                <SaveGraphButton diagramName="Oxygen Dissociation Curve" getDiagramState={getDiagramState} />
              )}
            </div>
          </div>
        </Card>
      </div>
      <div className="md:col-span-2 min-h-[500px]">
        <Card className="h-full !p-4">
          <div ref={diagramContainerRef} data-testid="diagram-container" className="w-full h-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2}/>
                <XAxis type="number" dataKey="pO2" domain={[0, 14]} label={{ value: 'Partial Pressure of Oxygen, pO₂ (kPa)', position: 'insideBottom', offset: -10 }}/>
                <YAxis type="number" domain={[0, 100]} label={{ value: 'Hemoglobin Saturation (%)', angle: -90, position: 'insideLeft' }}/>
                <Tooltip formatter={formatValue}/>
                <Legend verticalAlign="top"/>
                <Line type="monotone" dataKey="Saturation" name={`Hb Saturation at pH ${ph.toFixed(2)}`} stroke="var(--color-accent)" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}