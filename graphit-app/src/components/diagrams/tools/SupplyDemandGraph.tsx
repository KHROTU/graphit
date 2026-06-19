'use client';
import React, { useReducer, useMemo, useRef } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { useExportModal } from '@/lib/context/ExportModalContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { SliderControl } from '../controls/SliderControl';
import { DiagramToolbar } from '../DiagramToolbar';
import { DiagramErrorBoundary } from '../DiagramErrorBoundary';
interface SupplyDemandProps {
  initialDemandShift?: number;
  initialSupplyShift?: number;
}
type State = { demandShift: number; supplyShift: number; };
type Action = 
    | { type: 'SET_DEMAND_SHIFT', payload: number }
    | { type: 'SET_SUPPLY_SHIFT', payload: number };
function reducer(state: State, action: Action): State {
    switch(action.type) {
        case 'SET_DEMAND_SHIFT': return { ...state, demandShift: action.payload };
        case 'SET_SUPPLY_SHIFT': return { ...state, supplyShift: action.payload };
        default: return state;
    }
}
const formatValue = (value: number | string) => {
  if (typeof value === 'number') return Number(value.toFixed(2));
  return value;
};
export default function SupplyDemandGraph(props: SupplyDemandProps) {
  const initialState: State = {
      demandShift: props.initialDemandShift || 0,
      supplyShift: props.initialSupplyShift || 0,
  };
  const [state, dispatch] = useReducer(reducer, initialState);
  const { demandShift, supplyShift } = state;
  const diagramContainerRef = useRef<HTMLDivElement>(null);
  const { openExportModal } = useExportModal();
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
  const handleReset = () => {
    dispatch({ type: 'SET_DEMAND_SHIFT', payload: 0 });
    dispatch({ type: 'SET_SUPPLY_SHIFT', payload: 0 });
  };
  return (
    <DiagramErrorBoundary diagramName="Demand and Supply Curves">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <Card>
            <CardHeader><CardTitle>Configuration</CardTitle></CardHeader>
            <div className="p-6 space-y-6">
                <SliderControl label="Demand Shift" value={demandShift} min={-60} max={30} step={1} onChange={(val) => dispatch({type: 'SET_DEMAND_SHIFT', payload: val})} />
                <SliderControl label="Supply Shift" value={supplyShift} min={-30} max={60} step={1} onChange={(val) => dispatch({type: 'SET_SUPPLY_SHIFT', payload: val})} />
                <div className="text-sm border-t border-neutral-dark/50 pt-4">
                    <h4 className="font-semibold mb-2">Equilibrium</h4>
                    <p>Price (P*): <span className="font-mono text-accent">{formatValue(equilibrium.P)}</span></p>
                    <p>Quantity (Q*): <span className="font-mono text-secondary">{formatValue(equilibrium.Q)}</span></p>
                </div>
                <DiagramToolbar 
                  diagramName="Demand and Supply Curves" 
                  getDiagramState={getDiagramState} 
                  onExport={() => openExportModal(diagramContainerRef, 'supply-demand-graph')}
                  onReset={handleReset}
                />
            </div>
          </Card>
        </div>
        <div className="md:col-span-2 min-h-[400px] md:min-h-0">
          <Card className="h-full !p-4" ref={diagramContainerRef} data-testid="diagram-container">
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
                      <Line type="monotone" dataKey="demand" stroke="var(--color-accent)" strokeWidth={2} dot={false} name="Demand" connectNulls/>
                      <Line type="monotone" dataKey="supply" stroke="var(--color-secondary)" strokeWidth={2} dot={false} name="Supply" connectNulls/>
                  </LineChart>
              </ResponsiveContainer>
          </Card>
        </div>
      </div>
    </DiagramErrorBoundary>
  );
}