'use client';

import React, { useState, useMemo, useRef } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Label } from '@/components/ui/Label';
import { Button } from '@/components/ui/Button';
import { Save } from 'lucide-react';
import { useExportModal } from '@/lib/context/ExportModalContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useSession } from '@/lib/hooks/useSession';
import SaveGraphButton from '@/components/shared/SaveGraphButton';

interface TitrationProps {
  initialAnalyteVolume?: number;
  initialAnalyteConc?: number;
  initialTitrantConc?: number;
}

const formatValue = (value: number | string) => {
  if (typeof value === 'number') return Number(value.toFixed(2));
  return value;
};

export default function TitrationCurve({ initialAnalyteVolume = 25, initialAnalyteConc = 0.1, initialTitrantConc = 0.1 }: TitrationProps) {
  const [analyteVolume, setAnalyteVolume] = useState(initialAnalyteVolume);
  const [analyteConc, setAnalyteConc] = useState(initialAnalyteConc);
  const [titrantConc, setTitrantConc] = useState(initialTitrantConc);
  const diagramContainerRef = useRef<HTMLDivElement>(null);
  const { openExportModal } = useExportModal();
  const { session } = useSession();

  const { data, equivalencePoint } = useMemo(() => {
    const equivalenceVolume = (analyteConc * analyteVolume) / titrantConc;
    const chartData = [];
    for (let vol = 0; vol <= equivalenceVolume * 2; vol += Math.max(0.1, (equivalenceVolume * 2) / 200)) {
      let pH = 0;
      const totalVolume = (analyteVolume + vol) / 1000;
      const initialMolesAnalyte = (analyteConc * analyteVolume) / 1000;
      const molesTitrantAdded = (titrantConc * vol) / 1000;

      if (vol < equivalenceVolume) { pH = -Math.log10((initialMolesAnalyte - molesTitrantAdded) / totalVolume); } 
      else if (vol === equivalenceVolume) { pH = 7; } 
      else { pH = 14 - (-Math.log10((molesTitrantAdded - initialMolesAnalyte) / totalVolume)); }
      chartData.push({ volume: vol, pH: pH > 0 ? pH : 0 });
    }
    return { data: chartData, equivalencePoint: equivalenceVolume };
  }, [analyteVolume, analyteConc, titrantConc]);

  const getDiagramState = () => ({
    initialAnalyteVolume: analyteVolume,
    initialAnalyteConc: analyteConc,
    initialTitrantConc: titrantConc,
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-1">
        <Card>
          <CardHeader><CardTitle>Titration Parameters</CardTitle></CardHeader>
          <div className="p-6 space-y-6">
              <div><Label>Analyte (Acid) Volume (mL): {analyteVolume}</Label><input type="range" min="10" max="50" step="1" value={analyteVolume} onChange={(e) => setAnalyteVolume(Number(e.target.value))} className="w-full mt-2" /></div>
              <div><Label>Analyte (Acid) Conc. (M): {analyteConc.toFixed(2)}</Label><input type="range" min="0.05" max="0.5" step="0.01" value={analyteConc} onChange={(e) => setAnalyteConc(Number(e.target.value))} className="w-full mt-2" /></div>
              <div><Label>Titrant (Base) Conc. (M): {titrantConc.toFixed(2)}</Label><input type="range" min="0.05" max="0.5" step="0.01" value={titrantConc} onChange={(e) => setTitrantConc(Number(e.target.value))} className="w-full mt-2" /></div>
              <div className="text-sm border-t border-neutral-dark/50 pt-4"><h4 className="font-semibold mb-2">Equivalence Point</h4><p>Volume: <span className="font-mono text-accent">{formatValue(equivalencePoint)} mL</span></p></div>
              <div className="flex flex-col gap-2 pt-4 border-t border-neutral-dark/30">
                <Button onClick={() => openExportModal(diagramContainerRef, 'titration-curve')}>
                    <Save className="mr-2 h-4 w-4" /> Save & Export Image
                </Button>
                {session?.isLoggedIn && (
                  <SaveGraphButton diagramName="Titration Curve Plotter" getDiagramState={getDiagramState} />
                )}
              </div>
          </div>
        </Card>
      </div>
      <div className="md:col-span-2 min-h-[400px]">
        <Card className="h-full !p-4">
          <div ref={diagramContainerRef} data-testid="diagram-container" className="w-full h-full">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                    <XAxis type="number" dataKey="volume" domain={[0, 'dataMax']} stroke="var(--color-text)" label={{ value: 'Volume of Titrant Added (mL)', position: 'insideBottom', offset: -10, fill: 'var(--color-text)' }} />
                    <YAxis type="number" domain={[0, 14]} stroke="var(--color-text)" label={{ value: 'pH', angle: -90, position: 'insideLeft', fill: 'var(--color-text)' }} />
                    <Tooltip formatter={formatValue} contentStyle={{ backgroundColor: 'var(--color-neutral)', border: '1px solid var(--color-neutral-dark)', borderRadius: 'var(--border-radius-apple)' }} />
                    <Legend verticalAlign="top" height={36} wrapperStyle={{ color: 'var(--color-text)' }} />
                    <Line type="monotone" dataKey="pH" stroke="var(--color-accent)" strokeWidth={2} dot={false} name="Titration Curve" />
                    <ReferenceLine x={equivalencePoint} stroke="var(--color-secondary)" strokeDasharray="3 3" label={{ value: 'Equivalence', position: 'insideTopRight', fill: 'var(--color-secondary)' }} />
                </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}