'use client';
import React, { useReducer, useMemo, useRef } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Save } from 'lucide-react';
import { useExportModal } from '@/lib/context/ExportModalContext';
import { ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import SaveGraphButton from '@/components/shared/SaveGraphButton';
import { SliderControl } from '../controls/SliderControl';
import { SegmentControl } from '../controls/SegmentControl';
interface PriceControlsProps {
  initialControlPrice?: number;
  initialControlType?: 'ceiling' | 'floor';
}
type ControlType = 'ceiling' | 'floor';
type State = {
  controlPrice: number;
  controlType: ControlType;
};
type Action =
  | { type: 'SET_CONTROL_PRICE'; payload: number }
  | { type: 'SET_CONTROL_TYPE'; payload: ControlType };
function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_CONTROL_PRICE': return { ...state, controlPrice: action.payload };
    case 'SET_CONTROL_TYPE': return { ...state, controlType: action.payload };
    default: return state;
  }
}
const formatValue = (value: unknown): React.ReactNode => {
  if (typeof value === 'number') return Number(value.toFixed(2));
  return String(value);
};
export default function PriceControlsGraph(props: PriceControlsProps) {
  const initialState: State = {
    controlPrice: props.initialControlPrice || 45,
    controlType: props.initialControlType || 'ceiling',
  };
  const [state, dispatch] = useReducer(reducer, initialState);
  const { controlPrice, controlType } = state;
  const diagramContainerRef = useRef<HTMLDivElement>(null);
  const { openExportModal } = useExportModal();
  const data = useMemo(() => {
    const demandSlope = 1;
    const supplySlope = 1;
    const demandIntercept = 120;
    const supplyIntercept = 10;
    const eqQty = (demandIntercept - supplyIntercept) / (demandSlope + supplySlope);
    const eqPrice = supplyIntercept + supplySlope * eqQty;
    const chartData = [];
    for (let q = 0; q <= 120; q++) {
      const demandPrice = demandIntercept - demandSlope * q;
      const supplyPrice = supplyIntercept + supplySlope * q;
      const isControl = controlType === 'ceiling'
        ? controlPrice < eqPrice
        : controlPrice > eqPrice;
      const effectiveDemand = (controlType === 'ceiling' && demandPrice > controlPrice && isControl)
        ? controlPrice : (demandPrice >= 0 ? demandPrice : null);
      const effectiveSupply = (controlType === 'floor' && supplyPrice < controlPrice && isControl)
        ? controlPrice : (supplyPrice <= 130 ? supplyPrice : null);
      chartData.push({
        quantity: q,
        Demand: demandPrice >= 0 ? demandPrice : null,
        Supply: supplyPrice <= 130 ? supplyPrice : null,
        EffectiveDemand: effectiveDemand,
        EffectiveSupply: effectiveSupply,
      });
    }
    return { data: chartData, eqPrice, eqQty };
  }, [controlPrice, controlType]);
  const { data: chartData, eqPrice, eqQty } = data;
  const isBinding = controlType === 'ceiling'
    ? controlPrice < eqPrice
    : controlPrice > eqPrice;
  const qtyDemanded = useMemo(() => {
    const demandIntercept = 120;
    const demandSlope = 1;
    const qd = (demandIntercept - controlPrice) / demandSlope;
    return Math.max(0, qd);
  }, [controlPrice]);
  const qtySupplied = useMemo(() => {
    const supplyIntercept = 10;
    const supplySlope = 1;
    const qs = (controlPrice - supplyIntercept) / supplySlope;
    return Math.max(0, qs);
  }, [controlPrice]);
  const shortage = controlType === 'ceiling' ? qtyDemanded - qtySupplied : 0;
  const surplus = controlType === 'floor' ? qtySupplied - qtyDemanded : 0;
  const getDiagramState = () => ({
    initialControlPrice: controlPrice,
    initialControlType: controlType,
  });
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-1">
        <Card>
          <CardHeader><CardTitle>Price Controls</CardTitle></CardHeader>
          <div className="p-6 space-y-6">
            <SegmentControl
              options={[
                { value: 'ceiling', label: 'Price Ceiling' },
                { value: 'floor', label: 'Price Floor' },
              ]}
              value={controlType}
              onValueChange={(val) => dispatch({ type: 'SET_CONTROL_TYPE', payload: val as ControlType })}
            />
            <SliderControl
              label={`${controlType === 'ceiling' ? 'Ceiling' : 'Floor'} Price`}
              value={controlPrice}
              min={10}
              max={110}
              step={5}
              unit=""
              onChange={(val) => dispatch({ type: 'SET_CONTROL_PRICE', payload: val })}
            />
            <div className="text-sm border-t border-neutral-dark/50 pt-4">
              <h4 className="font-semibold mb-2">Market Analysis</h4>
              <p>Equilibrium Price: <span className="font-mono text-accent">{eqPrice.toFixed(1)}</span></p>
              <p>Equilibrium Qty: <span className="font-mono text-secondary">{eqQty.toFixed(1)}</span></p>
              {isBinding ? (
                <>
                  {controlType === 'ceiling' && shortage > 0 && (
                    <p className="mt-2 text-red-400">Shortage: <span className="font-mono">{shortage.toFixed(1)} units</span></p>
                  )}
                  {controlType === 'floor' && surplus > 0 && (
                    <p className="mt-2 text-red-400">Surplus: <span className="font-mono">{surplus.toFixed(1)} units</span></p>
                  )}
                </>
              ) : (
                <p className="mt-2 text-amber-400">Non-binding control (no market distortion)</p>
              )}
            </div>
            <div className="flex flex-col gap-2 pt-4 border-t border-neutral-dark/30">
              <Button onClick={() => openExportModal(diagramContainerRef, 'price-controls-graph')}>
                <Save className="mr-2 h-4 w-4" /> Save & Export Image
              </Button>
              <SaveGraphButton diagramName="Price Controls" getDiagramState={getDiagramState} />
            </div>
          </div>
        </Card>
      </div>
      <div className="md:col-span-2 min-h-[500px]">
        <Card className="h-full !p-4" ref={diagramContainerRef} data-testid="diagram-container">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
              <XAxis type="number" dataKey="quantity" domain={[0, 110]} label={{ value: 'Quantity', position: 'insideBottom', offset: -10 }} />
              <YAxis type="number" domain={[0, 130]} label={{ value: 'Price', angle: -90, position: 'insideLeft' }} />
              <Tooltip formatter={formatValue} />
              <Legend verticalAlign="top" height={36} />
              <Line type="monotone" dataKey="Demand" stroke="var(--color-accent)" strokeWidth={2} dot={false} name="Demand" connectNulls />
              <Line type="monotone" dataKey="Supply" stroke="var(--color-secondary)" strokeWidth={2} dot={false} name="Supply" connectNulls />
              <ReferenceLine
                y={controlPrice}
                stroke="#f59e0b"
                strokeWidth={2}
                strokeDasharray="6 4"
                label={{
                  value: controlType === 'ceiling' ? 'Price Ceiling' : 'Price Floor',
                  position: 'insideTopRight',
                  fill: '#f59e0b',
                  fontSize: 12,
                }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}