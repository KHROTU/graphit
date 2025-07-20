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

interface SupplyDemandProps {
  initialDemandShift?: number;
  initialSupplyShift?: number;
}

const formatValue = (value: number | string) => {
  if (typeof value === 'number') return Number(value.toFixed(2));
  return value;
};

export default function SupplyDemandGraph({ initialDemandShift = 0, initialSupplyShift = 0 }: SupplyDemandProps) {
  const [demandShift, setDemandShift] = useState(initialDemandShift);
  const [supplyShift, setSupplyShift] = useState(initialSupplyShift);
  
  const diagramContainerRef = useRef<HTMLDivElement>(null);
  const { openExportModal } = useExportModal();
  const { session } = useSession();

  const { data, equilibrium } = useMemo(() => {
    const demandSlope = 0.8, supplySlope = 0.8, baseDemandIntercept = 160, baseSupplyIntercept = 20;
    const demandIntercept = baseDemandIntercept + demandShift;
    const supplyIntercept = baseSupplyIntercept + supplyShift;
    const eqQty = (demandIntercept - supplyIntercept) / (demandSlope + supplySlope);
    const eqPrice = supplyIntercept + supplySlope * eqQty;
    const chartData = Array.from({ length: 151 }, (_, i) => ({
        quantity: i,
        demand: Math.max(0, demandIntercept - demandSlope * i),
        supply: supplyIntercept + supplySlope * i < 180 ? Math.max(0, supplyIntercept + supplySlope * i) : null,
    }));
    return { data: chartData, equilibrium: { P: eqPrice, Q: eqQty } };
  }, [demandShift, supplyShift]);

  const getDiagramState = () => ({
    initialDemandShift: demandShift,
    initialSupplyShift: supplyShift,
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-1">
        <Card>
          <CardHeader><CardTitle>Configuration</CardTitle></CardHeader>
          <div className="p-6 space-y-6">
              <div><Label>Demand Shift ({demandShift})</Label><input type="range" min="-60" max="30" value={demandShift} onChange={(e) => setDemandShift(parseInt(e.target.value))} className="w-full mt-2" /></div>
              <div><Label>Supply Shift ({supplyShift})</Label><input type="range" min="-30" max="60" value={supplyShift} onChange={(e) => setSupplyShift(parseInt(e.target.value))} className="w-full mt-2" /></div>
              <div className="text-sm border-t border-neutral-dark/50 pt-4">
                  <h4 className="font-semibold mb-2">Equilibrium</h4>
                  <p>Price (P*): <span className="font-mono text-accent">{formatValue(equilibrium.P)}</span></p>
                  <p>Quantity (Q*): <span className="font-mono text-secondary">{formatValue(equilibrium.Q)}</span></p>
              </div>
              <div className="flex flex-col gap-2 pt-4 border-t border-neutral-dark/30">
                <Button onClick={() => openExportModal(diagramContainerRef, 'supply-demand-graph')}>
                    <Save className="mr-2 h-4 w-4" /> Save & Export Image
                </Button>
                {session?.isLoggedIn && (
                  <SaveGraphButton diagramName="Demand and Supply Curves" getDiagramState={getDiagramState} />
                )}
              </div>
          </div>
        </Card>
      </div>
      <div className="md:col-span-2 min-h-[400px] md:min-h-0">
        <Card className="h-full !p-4">
          <div ref={diagramContainerRef} data-testid="diagram-container" className="w-full h-full">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                    <XAxis dataKey="quantity" stroke="var(--color-text)" label={{ value: 'Quantity (Q)', position: 'insideBottom', offset: -10, fill: 'var(--color-text)' }} />
                    <YAxis stroke="var(--color-text)" label={{ value: 'Price (P)', angle: -90, position: 'insideLeft', fill: 'var(--color-text)' }} />
                    <Tooltip 
                      formatter={formatValue}
                      contentStyle={{ backgroundColor: 'var(--color-neutral)', border: '1px solid var(--color-neutral-dark)', borderRadius: 'var(--border-radius-apple)' }} 
                    />
                    <Legend verticalAlign="top" height={36} wrapperStyle={{ color: 'var(--color-text)' }} />
                    <Line type="monotone" dataKey="demand" stroke="var(--color-accent)" strokeWidth={2} dot={false} name="Demand" />
                    <Line type="monotone" dataKey="supply" stroke="var(--color-secondary)" strokeWidth={2} dot={false} name="Supply" />
                </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}