'use client';
import React, { useReducer, useMemo, useRef } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { useExportModal } from '@/lib/context/ExportModalContext';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { SliderControl } from '../controls/SliderControl';
import { DiagramToolbar } from '../DiagramToolbar';
import { DiagramErrorBoundary } from '../DiagramErrorBoundary';
interface CostRevenueProps {
  initialFixedCost?: number;
  initialVariableCost?: number;
  initialDemandPrice?: number;
}
type State = {
    fixedCost: number;
    variableCost: number;
    demandPrice: number;
};
type Action = 
    | { type: 'SET_FIXED_COST', payload: number }
    | { type: 'SET_VARIABLE_COST', payload: number }
    | { type: 'SET_DEMAND_PRICE', payload: number };
function reducer(state: State, action: Action): State {
    switch(action.type) {
        case 'SET_FIXED_COST': return { ...state, fixedCost: action.payload };
        case 'SET_VARIABLE_COST': return { ...state, variableCost: action.payload };
        case 'SET_DEMAND_PRICE': return { ...state, demandPrice: action.payload };
        default: return state;
    }
}
const formatValue = (value: number | string) => {
    if (typeof value === 'number') return Number(value.toFixed(2));
    return value;
};
export default function CostRevenueGraph(props: CostRevenueProps) {
  const initialState: State = {
      fixedCost: props.initialFixedCost || 1000,
      variableCost: props.initialVariableCost || 20,
      demandPrice: props.initialDemandPrice || 100,
  };
  const [state, dispatch] = useReducer(reducer, initialState);
  const { fixedCost, variableCost, demandPrice } = state;
  const diagramContainerRef = useRef<HTMLDivElement>(null);
  const { openExportModal } = useExportModal();
  const { data, breakEven, profitMax } = useMemo(() => {
    const chartData = [];
    let breakEvenPoint = { q: 0, val: 0 };
    let profitMaxPoint = { q: 0, profit: -Infinity };
    for (let q = 0; q <= 100; q++) {
      const price = demandPrice - 0.8 * q;
      const totalRevenue = price * q;
      const totalCost = fixedCost + variableCost * q;
      const profit = totalRevenue - totalCost;
      chartData.push({ quantity: q, 'Total Revenue': totalRevenue, 'Total Cost': totalCost, Profit: profit });
      if (profit >= 0 && breakEvenPoint.q === 0) breakEvenPoint = { q, val: totalRevenue };
      if (profit > profitMaxPoint.profit) profitMaxPoint = { q, profit };
    }
    return { data: chartData, breakEven: breakEvenPoint, profitMax: profitMaxPoint };
  }, [fixedCost, variableCost, demandPrice]);
  const getDiagramState = () => ({
    initialFixedCost: fixedCost,
    initialVariableCost: variableCost,
    initialDemandPrice: demandPrice,
  });
  const handleReset = () => {
    dispatch({ type: 'SET_FIXED_COST', payload: 1000 });
    dispatch({ type: 'SET_VARIABLE_COST', payload: 20 });
    dispatch({ type: 'SET_DEMAND_PRICE', payload: 100 });
  };
  return (
    <DiagramErrorBoundary diagramName="Firm's Cost & Revenue Curves">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <Card>
            <CardHeader><CardTitle>{`Firm's Costs & Revenue`}</CardTitle></CardHeader>
            <div className="p-6 space-y-6">
                <SliderControl label="Fixed Cost" value={fixedCost} min={500} max={2000} step={100} onChange={(val) => dispatch({ type: 'SET_FIXED_COST', payload: val})} />
                <SliderControl label="Variable Cost (per unit)" value={variableCost} min={10} max={50} step={2} onChange={(val) => dispatch({ type: 'SET_VARIABLE_COST', payload: val})} />
                <SliderControl label="Max Price (Demand)" value={demandPrice} min={80} max={150} step={5} onChange={(val) => dispatch({ type: 'SET_DEMAND_PRICE', payload: val})} />
                <div className="text-sm border-t border-neutral-dark/50 pt-4"><h4 className="font-semibold mb-2">Key Points</h4><p>Break-even at Q ≈ {breakEven.q}</p><p>Profit Maximized at Q = {profitMax.q}</p></div>
                <DiagramToolbar 
                  diagramName="Firm's Cost & Revenue Curves" 
                  getDiagramState={getDiagramState} 
                  onExport={() => openExportModal(diagramContainerRef, 'cost-revenue-graph')}
                  onReset={handleReset}
                />
            </div>
          </Card>
        </div>
        <div className="md:col-span-2 min-h-[500px]">
          <Card className="h-full !p-4" ref={diagramContainerRef} data-testid="diagram-container">
              <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2}/>
                      <XAxis type="number" dataKey="quantity" domain={[0, 100]} stroke="var(--color-text)" label={{ value: 'Quantity', position: 'insideBottom', offset: -10, fill: 'var(--color-text)' }}/>
                      <YAxis type="number" yAxisId="left" domain={[0, 'dataMax + 1000']} stroke="var(--color-text)" label={{ value: 'Cost/Revenue', angle: -90, position: 'insideLeft', fill: 'var(--color-text)' }}/>
                      <YAxis type="number" yAxisId="right" orientation="right" domain={['dataMin - 500', 'dataMax + 500']} stroke="var(--color-text)" label={{ value: 'Profit', angle: 90, position: 'insideRight', fill: 'var(--color-text)' }}/>
                      <Tooltip 
                        formatter={formatValue}
                        contentStyle={{ backgroundColor: 'var(--color-neutral)', border: '1px solid var(--color-neutral-dark)', borderRadius: 'var(--border-radius-apple)' }}
                      />
                      <Legend verticalAlign="top" height={36} wrapperStyle={{ color: 'var(--color-text)' }}/>
                      <Area yAxisId="left" type="monotone" dataKey="Total Revenue" stroke="var(--color-accent)" fill="var(--color-accent)" fillOpacity={0.2} />
                      <Area yAxisId="left" type="monotone" dataKey="Total Cost" stroke="var(--color-secondary)" fill="var(--color-secondary)" fillOpacity={0.2} />
                      <Area yAxisId="right" type="monotone" dataKey="Profit" stroke="var(--color-accent)" fill="var(--color-accent)" fillOpacity={0.3} />
                  </AreaChart>
              </ResponsiveContainer>
          </Card>
        </div>
      </div>
    </DiagramErrorBoundary>
  );
}