'use client';

import React, { useReducer, useMemo, useRef } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Label } from '@/components/ui/Label';
import { Button } from '@/components/ui/Button';
import { Save } from 'lucide-react';
import { useExportModal } from '@/lib/context/ExportModalContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useSession } from '@/lib/hooks/useSession';
import SaveGraphButton from '@/components/shared/SaveGraphButton';

interface MarketFailureProps {
  initialExternalCost?: number;
  initialTax?: number;
}

type State = { externalCost: number; tax: number; };
type Action = 
    | { type: 'SET_EXTERNAL_COST', payload: number }
    | { type: 'SET_TAX', payload: number };

function reducer(state: State, action: Action): State {
    switch(action.type) {
        case 'SET_EXTERNAL_COST': return { ...state, externalCost: action.payload };
        case 'SET_TAX': return { ...state, tax: action.payload };
        default: return state;
    }
}

const formatValue = (value: unknown): React.ReactNode => {
    if (typeof value === 'number') return Number(value.toFixed(2));
    return String(value);
};

export default function MarketFailureGraph(props: MarketFailureProps) {
  const initialState: State = {
      externalCost: props.initialExternalCost || 20,
      tax: props.initialTax || 20,
  };
  const [state, dispatch] = useReducer(reducer, initialState);
  const { externalCost, tax } = state;

  const diagramContainerRef = useRef<HTMLDivElement>(null);
  const { openExportModal } = useExportModal();
  const { session } = useSession();

  const data = useMemo(() => {
    const demandIntercept = 100, demandSlope = 1;
    const mpcIntercept = 10, mpcSlope = 1;
    return Array.from({ length: 101 }, (_, q) => ({
        quantity: q,
        Demand: (demandIntercept - demandSlope * q) > 0 ? (demandIntercept - demandSlope * q) : null,
        MPC: mpcIntercept + mpcSlope * q,
        MSC: mpcIntercept + mpcSlope * q + externalCost,
        MPC_Taxed: mpcIntercept + mpcSlope * q + tax
    }));
  }, [externalCost, tax]);

  const getDiagramState = () => ({
    initialExternalCost: externalCost,
    initialTax: tax,
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-1">
        <Card>
          <CardHeader><CardTitle>Market Intervention</CardTitle></CardHeader>
          <div className="p-6 space-y-6">
              <div><Label>Negative Externality Cost: {externalCost}</Label><input type="range" min="0" max="50" step="5" value={externalCost} onChange={(e) => dispatch({ type: 'SET_EXTERNAL_COST', payload: Number(e.target.value) })} className="w-full mt-2" /></div>
              <div><Label>Corrective Tax: {tax}</Label><input type="range" min="0" max="50" step="5" value={tax} onChange={(e) => dispatch({ type: 'SET_TAX', payload: Number(e.target.value) })} className="w-full mt-2" /></div>
              
              <div className="flex flex-col gap-2 pt-4 border-t border-neutral-dark/30">
                <Button onClick={() => openExportModal(diagramContainerRef, 'market-failure-graph')}>
                    <Save className="mr-2 h-4 w-4" /> Save & Export Image
                </Button>
                {session?.isLoggedIn && (
                  <SaveGraphButton diagramName="Market Failure & Interventions" getDiagramState={getDiagramState} />
                )}
              </div>
          </div>
        </Card>
      </div>
      <div className="md:col-span-2 min-h-[500px]">
        <Card className="h-full !p-4" ref={diagramContainerRef} data-testid="diagram-container">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2}/>
                    <XAxis type="number" dataKey="quantity" domain={[0, 80]} label={{ value: 'Quantity', position: 'insideBottom', offset: -10 }}/>
                    <YAxis type="number" domain={[0, 110]} label={{ value: 'Price / Cost', angle: -90, position: 'insideLeft' }}/>
                    <Tooltip formatter={formatValue}/>
                    <Legend verticalAlign="top" height={36}/>
                    <Line type="monotone" dataKey="Demand" stroke="#38bdf8" strokeWidth={2} dot={false} name="Demand (MSB = MPB)" connectNulls/>
                    <Line type="monotone" dataKey="MPC" stroke="#f87171" strokeWidth={2} dot={false} name="Supply (Marginal Private Cost)" />
                    <Line type="monotone" dataKey="MSC" stroke="#facc15" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Marginal Social Cost" />
                    {tax > 0 && <Line type="monotone" dataKey="MPC_Taxed" stroke="#34d399" strokeWidth={2} dot={false} name="Supply with Tax" />}
                </LineChart>
            </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}