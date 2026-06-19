'use client';
import React, { useReducer, useMemo, useRef } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { useExportModal } from '@/lib/context/ExportModalContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { SliderControl } from '../controls/SliderControl';
import { DiagramToolbar } from '../DiagramToolbar';
import { DiagramErrorBoundary } from '../DiagramErrorBoundary';
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
const formatValue = (value: number | string) => {
    if (typeof value === 'number') return Number(value.toFixed(2));
    return value;
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
  const handleReset = () => {
    dispatch({ type: 'SET_EXTERNAL_COST', payload: 20 });
    dispatch({ type: 'SET_TAX', payload: 20 });
  };
  return (
    <DiagramErrorBoundary diagramName="Market Failure & Interventions">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <Card>
            <CardHeader><CardTitle>Market Intervention</CardTitle></CardHeader>
            <div className="p-6 space-y-6">
                <SliderControl label="Negative Externality Cost" value={externalCost} min={0} max={50} step={5} onChange={(val) => dispatch({ type: 'SET_EXTERNAL_COST', payload: val })} />
                <SliderControl label="Corrective Tax" value={tax} min={0} max={50} step={5} onChange={(val) => dispatch({ type: 'SET_TAX', payload: val })} />
                <DiagramToolbar 
                  diagramName="Market Failure & Interventions" 
                  getDiagramState={getDiagramState} 
                  onExport={() => openExportModal(diagramContainerRef, 'market-failure-graph')}
                  onReset={handleReset}
                />
            </div>
          </Card>
        </div>
        <div className="md:col-span-2 min-h-[500px]">
          <Card className="h-full !p-4" ref={diagramContainerRef} data-testid="diagram-container">
              <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2}/>
                      <XAxis type="number" dataKey="quantity" domain={[0, 80]} stroke="var(--color-text)" label={{ value: 'Quantity', position: 'insideBottom', offset: -10, fill: 'var(--color-text)' }}/>
                      <YAxis type="number" domain={[0, 110]} stroke="var(--color-text)" label={{ value: 'Price / Cost', angle: -90, position: 'insideLeft', fill: 'var(--color-text)' }}/>
                      <Tooltip 
                        formatter={formatValue}
                        contentStyle={{ backgroundColor: 'var(--color-neutral)', border: '1px solid var(--color-neutral-dark)', borderRadius: 'var(--border-radius-apple)' }}
                      />
                      <Legend verticalAlign="top" height={36} wrapperStyle={{ color: 'var(--color-text)' }}/>
                      <Line type="monotone" dataKey="Demand" stroke="var(--color-accent)" strokeWidth={2} dot={false} name="Demand (MSB = MPB)" connectNulls/>
                      <Line type="monotone" dataKey="MPC" stroke="var(--color-secondary)" strokeWidth={2} dot={false} name="Supply (Marginal Private Cost)" />
                      <Line type="monotone" dataKey="MSC" stroke="var(--color-accent)" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Marginal Social Cost" />
                      {tax > 0 && <Line type="monotone" dataKey="MPC_Taxed" stroke="var(--color-secondary)" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Supply with Tax" />}
                  </LineChart>
              </ResponsiveContainer>
          </Card>
        </div>
      </div>
    </DiagramErrorBoundary>
  );
}