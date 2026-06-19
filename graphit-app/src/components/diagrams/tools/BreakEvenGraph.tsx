'use client';
import React, { useReducer, useMemo, useRef } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Save } from 'lucide-react';
import { useExportModal } from '@/lib/context/ExportModalContext';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import SaveGraphButton from '@/components/shared/SaveGraphButton';
import { SliderControl } from '../controls/SliderControl';
interface BreakEvenProps {
  initialFixedCost?: number;
  initialVariableCost?: number;
  initialSellingPrice?: number;
  initialOutputCapacity?: number;
}
type State = {
  fixedCost: number;
  variableCost: number;
  sellingPrice: number;
  outputCapacity: number;
};
type Action =
  | { type: 'SET_FIXED_COST'; payload: number }
  | { type: 'SET_VARIABLE_COST'; payload: number }
  | { type: 'SET_SELLING_PRICE'; payload: number }
  | { type: 'SET_OUTPUT_CAPACITY'; payload: number };
function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_FIXED_COST': return { ...state, fixedCost: action.payload };
    case 'SET_VARIABLE_COST': return { ...state, variableCost: action.payload };
    case 'SET_SELLING_PRICE': return { ...state, sellingPrice: action.payload };
    case 'SET_OUTPUT_CAPACITY': return { ...state, outputCapacity: action.payload };
    default: return state;
  }
}
const formatValue = (value: unknown): React.ReactNode => {
  if (typeof value === 'number') return Number(value.toFixed(2));
  return String(value);
};
export default function BreakEvenGraph(props: BreakEvenProps) {
  const initialState: State = {
    fixedCost: props.initialFixedCost || 1000,
    variableCost: props.initialVariableCost || 30,
    sellingPrice: props.initialSellingPrice || 80,
    outputCapacity: props.initialOutputCapacity || 80,
  };
  const [state, dispatch] = useReducer(reducer, initialState);
  const { fixedCost, variableCost, sellingPrice, outputCapacity } = state;
  const diagramContainerRef = useRef<HTMLDivElement>(null);
  const { openExportModal } = useExportModal();
  const { data, breakEvenPoint, marginOfSafety } = useMemo(() => {
    const chartData = [];
    let beQty = 0;
    const contribution = sellingPrice - variableCost;
    beQty = contribution > 0 ? fixedCost / contribution : outputCapacity;
    for (let q = 0; q <= outputCapacity; q++) {
      const totalRevenue = sellingPrice * q;
      const totalVariableCost = variableCost * q;
      const totalCost = fixedCost + totalVariableCost;
      const profit = totalRevenue - totalCost;
      chartData.push({
        quantity: q,
        'Total Revenue': totalRevenue,
        'Total Cost': totalCost,
        'Fixed Cost': fixedCost,
        'Profit/Loss': profit,
      });
    }
    const mos = beQty < outputCapacity ? ((outputCapacity - beQty) / outputCapacity) * 100 : 0;
    return {
      data: chartData,
      breakEvenPoint: { q: Math.min(beQty, outputCapacity), val: sellingPrice * Math.min(beQty, outputCapacity) },
      marginOfSafety: { units: outputCapacity - Math.min(beQty, outputCapacity), pct: mos },
    };
  }, [fixedCost, variableCost, sellingPrice, outputCapacity]);
  const getDiagramState = () => ({
    initialFixedCost: fixedCost,
    initialVariableCost: variableCost,
    initialSellingPrice: sellingPrice,
    initialOutputCapacity: outputCapacity,
  });
  const contributionPerUnit = sellingPrice - variableCost;
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-1">
        <Card>
          <CardHeader><CardTitle>Break-Even Analysis</CardTitle></CardHeader>
          <div className="p-6 space-y-6">
            <SliderControl
              label="Selling Price (per unit)"
              value={sellingPrice}
              min={30}
              max={150}
              step={5}
              unit=""
              onChange={(val) => dispatch({ type: 'SET_SELLING_PRICE', payload: val })}
            />
            <SliderControl
              label="Variable Cost (per unit)"
              value={variableCost}
              min={10}
              max={80}
              step={2}
              unit=""
              onChange={(val) => dispatch({ type: 'SET_VARIABLE_COST', payload: val })}
            />
            <SliderControl
              label="Fixed Cost"
              value={fixedCost}
              min={200}
              max={3000}
              step={100}
              unit=""
              onChange={(val) => dispatch({ type: 'SET_FIXED_COST', payload: val })}
            />
            <SliderControl
              label="Output Capacity"
              value={outputCapacity}
              min={30}
              max={100}
              step={5}
              unit="units"
              onChange={(val) => dispatch({ type: 'SET_OUTPUT_CAPACITY', payload: val })}
            />
            <div className="text-sm border-t border-neutral-dark/50 pt-4 space-y-1">
              <h4 className="font-semibold mb-2">Key Metrics</h4>
              <p>Contribution/unit: <span className="font-mono text-accent">{contributionPerUnit.toFixed(1)}</span></p>
              <p>B/E Quantity: <span className="font-mono text-secondary">{breakEvenPoint.q.toFixed(1)} units</span></p>
              <p>Margin of Safety: <span className="font-mono text-amber-400">{marginOfSafety.pct.toFixed(1)}%</span> ({marginOfSafety.units.toFixed(1)} units)</p>
              {contributionPerUnit <= 0 && (
                <p className="text-red-400 mt-1">Price must exceed variable cost to break even.</p>
              )}
            </div>
            <div className="flex flex-col gap-2 pt-4 border-t border-neutral-dark/30">
              <Button onClick={() => openExportModal(diagramContainerRef, 'break-even-graph')}>
                <Save className="mr-2 h-4 w-4" /> Save & Export Image
              </Button>
              <SaveGraphButton diagramName="Break-Even Chart" getDiagramState={getDiagramState} />
            </div>
          </div>
        </Card>
      </div>
      <div className="md:col-span-2 min-h-[500px]">
        <Card className="h-full !p-4" ref={diagramContainerRef} data-testid="diagram-container">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
              <XAxis type="number" dataKey="quantity" domain={[0, outputCapacity]} label={{ value: 'Output / Quantity', position: 'insideBottom', offset: -10 }} />
              <YAxis type="number" domain={[0, 'dataMax + 500']} label={{ value: 'Cost / Revenue / Profit', angle: -90, position: 'insideLeft' }} />
              <Tooltip formatter={formatValue} />
              <Legend verticalAlign="top" height={36} />
              <Area type="monotone" dataKey="Total Revenue" stroke="var(--color-accent)" fill="var(--color-accent)" fillOpacity={0.15} strokeWidth={2} />
              <Area type="monotone" dataKey="Total Cost" stroke="var(--color-secondary)" fill="var(--color-secondary)" fillOpacity={0.15} strokeWidth={2} />
              <Area type="monotone" dataKey="Profit/Loss" stroke="#22c55e" fill="#22c55e" fillOpacity={0.1} strokeWidth={2} />
              {breakEvenPoint.q > 0 && breakEvenPoint.q < outputCapacity && (
                <ReferenceLine
                  x={breakEvenPoint.q}
                  stroke="#f59e0b"
                  strokeWidth={2}
                  strokeDasharray="6 4"
                  label={{ value: `B/E: ${breakEvenPoint.q.toFixed(0)}`, position: 'insideTopRight', fill: '#f59e0b', fontSize: 12 }}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}