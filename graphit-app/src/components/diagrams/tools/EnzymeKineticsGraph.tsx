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

interface EnzymeKineticsProps {
  initialVmax?: number;
  initialKm?: number;
  initialInhibitor?: number;
}

const formatValue = (val: unknown): React.ReactNode => {
    if (typeof val === 'number') return val.toFixed(2);
    return String(val);
};

export default function EnzymeKineticsGraph({ initialVmax = 100, initialKm = 20, initialInhibitor = 0 }: EnzymeKineticsProps) {
  const [vmax, setVmax] = useState(initialVmax);
  const [km, setKm] = useState(initialKm);
  const [inhibitor, setInhibitor] = useState(initialInhibitor); // 0 = no inhibitor, >0 = competitive inhibitor
  const diagramContainerRef = useRef<HTMLDivElement>(null);
  const { openExportModal } = useExportModal();
  const { session } = useSession();

  const data = useMemo(() => {
    const chartData = [];
    const apparentKm = km * (1 + inhibitor / 20); // Scaled for effect

    for (let s = 0; s <= 100; s += 2) {
      const rate = (vmax * s) / (km + s);
      const inhibitedRate = (vmax * s) / (apparentKm + s);
      chartData.push({
        'Substrate [S]': s,
        'Reaction Rate': rate,
        'Inhibited Rate': inhibitor > 0 ? inhibitedRate : null,
      });
    }
    return chartData;
  }, [vmax, km, inhibitor]);

  const getDiagramState = () => ({
    initialVmax: vmax,
    initialKm: km,
    initialInhibitor: inhibitor,
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-1">
        <Card>
          <CardHeader><CardTitle>Enzyme Kinetics (Michaelis-Menten)</CardTitle></CardHeader>
          <div className="p-6 space-y-6">
            <div><Label>Max Rate (Vmax): {vmax}</Label><input type="range" min="20" max="200" value={vmax} onChange={(e) => setVmax(Number(e.target.value))} className="w-full mt-2" /></div>
            <div><Label>Michaelis Constant (Km): {km}</Label><input type="range" min="5" max="80" value={km} onChange={(e) => setKm(Number(e.target.value))} className="w-full mt-2" /></div>
            <div><Label>Competitive Inhibitor [I]: {inhibitor}</Label><input type="range" min="0" max="100" value={inhibitor} onChange={(e) => setInhibitor(Number(e.target.value))} className="w-full mt-2" /></div>

            <div className="flex flex-col gap-2 pt-4 border-t border-neutral-dark/30">
              <Button onClick={() => openExportModal(diagramContainerRef, 'enzyme-kinetics-graph')}>
                  <Save className="mr-2 h-4 w-4" /> Save & Export Image
              </Button>
              {session?.isLoggedIn && (
                <SaveGraphButton diagramName="Enzyme Kinetics Graph" getDiagramState={getDiagramState} />
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
                <XAxis type="number" dataKey="Substrate [S]" label={{ value: 'Substrate Concentration [S]', position: 'insideBottom', offset: -10 }}/>
                <YAxis type="number" domain={[0, 'dataMax + 10']} label={{ value: 'Reaction Rate (v)', angle: -90, position: 'insideLeft' }}/>
                <Tooltip formatter={formatValue}/>
                <Legend verticalAlign="top"/>
                <Line type="monotone" dataKey="Reaction Rate" stroke="var(--color-accent)" strokeWidth={2} dot={false} />
                {inhibitor > 0 && <Line type="monotone" dataKey="Inhibited Rate" name="With Inhibitor" stroke="var(--color-secondary)" strokeWidth={2} dot={false} strokeDasharray="5 5" />}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}