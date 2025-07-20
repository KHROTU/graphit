'use client';

import React, { useState, useMemo, useRef } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Label } from '@/components/ui/Label';
import { Button } from '@/components/ui/Button';
import { Save } from 'lucide-react';
import { useExportModal } from '@/lib/context/ExportModalContext';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Label as RechartsLabel } from 'recharts';
import { useSession } from '@/lib/hooks/useSession';
import SaveGraphButton from '@/components/shared/SaveGraphButton';

interface EnergyProfileProps {
  initialActivationEnergy?: number;
  initialDeltaH?: number;
}

const formatValue = (value: unknown): React.ReactNode => {
  if (typeof value === 'number') return Number(value.toFixed(1));
  return String(value);
};

export default function EnergyProfileDiagram({ initialActivationEnergy = 50, initialDeltaH = -30 }: EnergyProfileProps) {
  const [activationEnergy, setActivationEnergy] = useState(initialActivationEnergy);
  const [deltaH, setDeltaH] = useState(initialDeltaH);
  const diagramContainerRef = useRef<HTMLDivElement>(null);
  const { openExportModal } = useExportModal();
  const { session } = useSession();

  const { data, reactantsLevel, productsLevel, peakLevel } = useMemo(() => {
    const startLevel = 50;
    const endLevel = startLevel + deltaH;
    const transitionLevel = startLevel + activationEnergy;
    
    const chartData = [
      { progress: 0,   energy: startLevel }, { progress: 20,  energy: startLevel },
      { progress: 50,  energy: transitionLevel }, { progress: 80,  energy: endLevel },
      { progress: 100, energy: endLevel },
    ];

    return { data: chartData, reactantsLevel: startLevel, productsLevel: endLevel, peakLevel: transitionLevel };
  }, [activationEnergy, deltaH]);

  const yMin = Math.min(0, reactantsLevel, productsLevel) - 20;
  const yMax = peakLevel + 20;

  const getDiagramState = () => ({
    initialActivationEnergy: activationEnergy,
    initialDeltaH: deltaH,
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md-col-span-1">
        <Card>
          <CardHeader><CardTitle>Reaction Parameters</CardTitle></CardHeader>
          <div className="p-6 space-y-6">
              <div><Label>Activation Energy (Ea): {activationEnergy} kJ/mol</Label><input type="range" min="10" max="100" value={activationEnergy} onChange={(e) => setActivationEnergy(Number(e.target.value))} className="w-full mt-2" /></div>
              <div><Label>Enthalpy Change (ΔH): {deltaH} kJ/mol</Label><input type="range" min="-50" max="50" value={deltaH} onChange={(e) => setDeltaH(Number(e.target.value))} className="w-full mt-2" /></div>
              <div className="text-sm border-t border-neutral-dark/50 pt-4"><h4 className="font-semibold mb-2">Reaction Type</h4><p className={deltaH < 0 ? 'text-accent font-bold' : 'text-secondary font-bold'}>{deltaH < 0 ? 'Exothermic' : 'Endothermic'}</p></div>
              <div className="flex flex-col gap-2 pt-4 border-t border-neutral-dark/30">
                <Button onClick={() => openExportModal(diagramContainerRef, 'energy-profile-diagram')}>
                    <Save className="mr-2 h-4 w-4" /> Save & Export Image
                </Button>
                {session?.isLoggedIn && (
                  <SaveGraphButton diagramName="Energy Profile Diagrams" getDiagramState={getDiagramState} />
                )}
              </div>
          </div>
        </Card>
      </div>
      <div className="md:col-span-2 min-h-[400px]">
        <Card className="h-full !p-4">
          <div ref={diagramContainerRef} data-testid="diagram-container" className="w-full h-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                    <XAxis type="number" dataKey="progress" domain={[0, 100]} tick={false} axisLine={false} label={{ value: 'Reaction Progress', position: 'insideBottom', offset: -10, fill: 'var(--color-text)' }} />
                    <YAxis type="number" domain={[yMin, yMax]} stroke="var(--color-text)" label={{ value: 'Potential Energy (kJ/mol)', angle: -90, position: 'insideLeft', fill: 'var(--color-text)' }} />
                    <Tooltip formatter={formatValue} contentStyle={{ backgroundColor: 'var(--color-neutral)', border: '1px solid var(--color-neutral-dark)', borderRadius: 'var(--border-radius-apple)' }} />
                    <Area type="monotone" dataKey="energy" stroke="var(--color-accent)" strokeWidth={3} fill="var(--color-accent)" fillOpacity={0.1} name="Energy Profile" />
                    <ReferenceLine y={reactantsLevel} stroke="var(--color-text)" strokeDasharray="4 4" strokeWidth={1}><RechartsLabel value="Reactants" position="left" fill="var(--color-text)" fontSize={12} offset={10} /></ReferenceLine>
                    <ReferenceLine y={productsLevel} stroke="var(--color-text)" strokeDasharray="4 4" strokeWidth={1}><RechartsLabel value="Products" position="right" fill="var(--color-text)" fontSize={12} offset={10} /></ReferenceLine>
                    <ReferenceLine segment={[{ x: 50, y: reactantsLevel }, { x: 50, y: peakLevel }]} stroke="var(--color-secondary)" strokeDasharray="3 3"><RechartsLabel value="Ea" position="right" fill="var(--color-secondary)" fontSize={14} /></ReferenceLine>
                    <ReferenceLine segment={[{ x: 90, y: reactantsLevel }, { x: 90, y: productsLevel }]} stroke="var(--color-secondary)" strokeDasharray="3 3"><RechartsLabel value="ΔH" position="right" fill="var(--color-secondary)" fontSize={14} /></ReferenceLine>
                </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}