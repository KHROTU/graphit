'use client';
import React, { useReducer, useMemo, useRef } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Save } from 'lucide-react';
import { useExportModal } from '@/lib/context/ExportModalContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import SaveGraphButton from '@/components/shared/SaveGraphButton';
import { SliderControl } from '../controls/SliderControl';
import { SegmentControl } from '../controls/SegmentControl';
interface TaxSubsidyProps {
  initialAmount?: number;
  initialType?: 'tax' | 'subsidy';
}
type PolicyType = 'tax' | 'subsidy';
type State = {
  amount: number;
  type: PolicyType;
};
type Action =
  | { type: 'SET_AMOUNT'; payload: number }
  | { type: 'SET_TYPE'; payload: PolicyType };
function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_AMOUNT': return { ...state, amount: action.payload };
    case 'SET_TYPE': return { ...state, type: action.payload };
    default: return state;
  }
}
const formatValue = (value: unknown): React.ReactNode => {
  if (typeof value === 'number') return Number(value.toFixed(2));
  return String(value);
};
export default function TaxSubsidyGraph(props: TaxSubsidyProps) {
  const initialState: State = {
    amount: props.initialAmount || 20,
    type: props.initialType || 'tax',
  };
  const [state, dispatch] = useReducer(reducer, initialState);
  const { amount, type } = state;
  const diagramContainerRef = useRef<HTMLDivElement>(null);
  const { openExportModal } = useExportModal();
  const { data, burden } = useMemo(() => {
    const demandIntercept = 120;
    const demandSlope = 1;
    const supplyIntercept = 10;
    const supplySlope = 1;
    const shiftedIntercept = type === 'tax'
      ? supplyIntercept + amount
      : supplyIntercept - amount;
    const eqOrigQty = (demandIntercept - supplyIntercept) / (demandSlope + supplySlope);
    const eqOrigPrice = supplyIntercept + supplySlope * eqOrigQty;
    const eqNewQty = (demandIntercept - shiftedIntercept) / (demandSlope + supplySlope);
    const eqNewPrice = shiftedIntercept + supplySlope * eqNewQty;
    const consumerBurden = type === 'tax'
      ? eqNewPrice - eqOrigPrice
      : eqOrigPrice - eqNewPrice;
    const totalTaxRevenue = type === 'tax' ? amount * eqNewQty : 0;
    const producerBurden = type === 'tax'
      ? amount - consumerBurden
      : amount - consumerBurden;
    const chartData = [];
    for (let q = 0; q <= 110; q++) {
      const demand = demandIntercept - demandSlope * q;
      const supply = supplyIntercept + supplySlope * q;
      const shiftedSupply = shiftedIntercept + supplySlope * q;
      chartData.push({
        quantity: q,
        Demand: demand > 0 ? demand : null,
        Supply: supply < 140 ? supply : null,
        [type === 'tax' ? 'Supply + Tax' : 'Supply - Subsidy']: shiftedSupply < 140 ? shiftedSupply : null,
      });
    }
    return {
      data: chartData,
      burden: { consumer: consumerBurden, producer: producerBurden, total: totalTaxRevenue },
    };
  }, [amount, type]);
  const getDiagramState = () => ({
    initialAmount: amount,
    initialType: type,
  });
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-1">
        <Card>
          <CardHeader><CardTitle>Taxation & Subsidy Incidence</CardTitle></CardHeader>
          <div className="p-6 space-y-6">
            <SegmentControl
              options={[
                { value: 'tax', label: 'Tax' },
                { value: 'subsidy', label: 'Subsidy' },
              ]}
              value={type}
              onValueChange={(val) => dispatch({ type: 'SET_TYPE', payload: val as PolicyType })}
            />
            <SliderControl
              label={`${type === 'tax' ? 'Tax' : 'Subsidy'} Amount`}
              value={amount}
              min={5}
              max={50}
              step={5}
              unit=""
              onChange={(val) => dispatch({ type: 'SET_AMOUNT', payload: val })}
            />
            <div className="text-sm border-t border-neutral-dark/50 pt-4">
              <h4 className="font-semibold mb-2">Incidence Analysis</h4>
              <p>Consumer burden: <span className="font-mono text-accent">{burden.consumer.toFixed(1)}</span></p>
              <p>Producer burden: <span className="font-mono text-secondary">{burden.producer.toFixed(1)}</span></p>
              {type === 'tax' && burden.total > 0 && (
                <p className="mt-2">Tax Revenue: <span className="font-mono text-amber-400">{burden.total.toFixed(1)}</span></p>
              )}
              <p className="mt-2 text-xs text-neutral-400">Burden falls more heavily on the side of the market that is less elastic.</p>
            </div>
            <div className="flex flex-col gap-2 pt-4 border-t border-neutral-dark/30">
              <Button onClick={() => openExportModal(diagramContainerRef, 'tax-subsidy-graph')}>
                <Save className="mr-2 h-4 w-4" /> Save & Export Image
              </Button>
              <SaveGraphButton diagramName="Tax/Subsidy Incidence" getDiagramState={getDiagramState} />
            </div>
          </div>
        </Card>
      </div>
      <div className="md:col-span-2 min-h-[500px]">
        <Card className="h-full !p-4" ref={diagramContainerRef} data-testid="diagram-container">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
              <XAxis type="number" dataKey="quantity" domain={[0, 100]} label={{ value: 'Quantity', position: 'insideBottom', offset: -10 }} />
              <YAxis type="number" domain={[0, 140]} label={{ value: 'Price', angle: -90, position: 'insideLeft' }} />
              <Tooltip formatter={formatValue} />
              <Legend verticalAlign="top" height={36} />
              <Line type="monotone" dataKey="Demand" stroke="var(--color-accent)" strokeWidth={2} dot={false} name="Demand" connectNulls />
              <Line type="monotone" dataKey="Supply" stroke="var(--color-secondary)" strokeWidth={2} dot={false} name="Original Supply" connectNulls />
              <Line
                type="monotone"
                dataKey={type === 'tax' ? 'Supply + Tax' : 'Supply - Subsidy'}
                stroke="#22c55e"
                strokeWidth={2}
                strokeDasharray="6 4"
                dot={false}
                name={type === 'tax' ? 'Supply with Tax' : 'Supply with Subsidy'}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}