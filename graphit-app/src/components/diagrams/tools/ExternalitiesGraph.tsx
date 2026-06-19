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
interface ExternalitiesProps {
  initialExternalityAmount?: number;
  initialIntervention?: number;
  initialExternalityType?: 'negative' | 'positive';
}
type ExternalityType = 'negative' | 'positive';
type State = {
  externalityAmount: number;
  intervention: number;
  type: ExternalityType;
};
type Action =
  | { type: 'SET_EXTERNALITY_AMOUNT'; payload: number }
  | { type: 'SET_INTERVENTION'; payload: number }
  | { type: 'SET_TYPE'; payload: ExternalityType };
function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_EXTERNALITY_AMOUNT': return { ...state, externalityAmount: action.payload };
    case 'SET_INTERVENTION': return { ...state, intervention: action.payload };
    case 'SET_TYPE': return { ...state, type: action.payload };
    default: return state;
  }
}
const formatValue = (value: unknown): React.ReactNode => {
  if (typeof value === 'number') return Number(value.toFixed(2));
  return String(value);
};
export default function ExternalitiesGraph(props: ExternalitiesProps) {
  const initialState: State = {
    externalityAmount: props.initialExternalityAmount || 20,
    intervention: props.initialIntervention || 20,
    type: props.initialExternalityType || 'negative',
  };
  const [state, dispatch] = useReducer(reducer, initialState);
  const { externalityAmount, intervention, type } = state;
  const diagramContainerRef = useRef<HTMLDivElement>(null);
  const { openExportModal } = useExportModal();
  const data = useMemo(() => {
    const demandIntercept = 100;
    const demandSlope = 1;
    const mpcIntercept = 10;
    const mpcSlope = 1;
    if (type === 'positive') {
      const chartData = [];
      for (let q = 0; q <= 80; q++) {
        const mpb = demandIntercept - demandSlope * q;
        const mpc = mpcIntercept + mpcSlope * q;
        chartData.push({
          quantity: q,
          MPB: mpb > 0 ? mpb : null,
          MSB: mpb > 0 ? mpb + externalityAmount : null,
          MPC: mpc < 120 ? mpc : null,
          'MPC with Subsidy': mpc < 120 ? mpc - intervention : null,
        });
      }
      return chartData;
    }
    const chartData = [];
    for (let q = 0; q <= 80; q++) {
      const msb = demandIntercept - demandSlope * q;
      const mpcBase = mpcIntercept + mpcSlope * q;
      chartData.push({
        quantity: q,
        'MSB (=MPB)': msb > 0 ? msb : null,
        MPC: mpcBase < 120 ? mpcBase : null,
        MSC: mpcBase < 120 ? mpcBase + externalityAmount : null,
        'MPC with Tax': mpcBase < 120 ? mpcBase + intervention : null,
      });
    }
    return chartData;
  }, [externalityAmount, intervention, type]);
  const getDiagramState = () => ({
    initialExternalityAmount: externalityAmount,
    initialIntervention: intervention,
    initialExternalityType: type,
  });
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-1">
        <Card>
          <CardHeader><CardTitle>Externalities & Interventions</CardTitle></CardHeader>
          <div className="p-6 space-y-6">
            <SegmentControl
              options={[
                { value: 'negative', label: 'Negative' },
                { value: 'positive', label: 'Positive' },
              ]}
              value={type}
              onValueChange={(val) => dispatch({ type: 'SET_TYPE', payload: val as ExternalityType })}
            />
            <SliderControl
              label={type === 'negative' ? 'External Cost' : 'External Benefit'}
              value={externalityAmount}
              min={0}
              max={50}
              step={5}
              unit=""
              onChange={(val) => dispatch({ type: 'SET_EXTERNALITY_AMOUNT', payload: val })}
            />
            <SliderControl
              label={type === 'negative' ? 'Pigouvian Tax' : 'Subsidy'}
              value={intervention}
              min={0}
              max={50}
              step={5}
              unit=""
              onChange={(val) => dispatch({ type: 'SET_INTERVENTION', payload: val })}
            />
            <div className="text-sm border-t border-neutral-dark/50 pt-4">
              <h4 className="font-semibold mb-2">Key Insight</h4>
              {type === 'negative' ? (
                <p>Without intervention, overproduction at Qm creates deadweight loss. A Pigouvian tax equal to the external cost internalizes the externality, shifting MPC to MSC at the social optimum.</p>
              ) : (
                <p>Without subsidy, underproduction at Qm creates welfare loss. A subsidy equal to the external benefit shifts MPC down, increasing consumption to the social optimum.</p>
              )}
            </div>
            <div className="flex flex-col gap-2 pt-4 border-t border-neutral-dark/30">
              <Button onClick={() => openExportModal(diagramContainerRef, 'externalities-graph')}>
                <Save className="mr-2 h-4 w-4" /> Save & Export Image
              </Button>
              <SaveGraphButton diagramName="Externalities & Interventions" getDiagramState={getDiagramState} />
            </div>
          </div>
        </Card>
      </div>
      <div className="md:col-span-2 min-h-[500px]">
        <Card className="h-full !p-4" ref={diagramContainerRef} data-testid="diagram-container">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
              <XAxis type="number" dataKey="quantity" domain={[0, 70]} label={{ value: 'Quantity', position: 'insideBottom', offset: -10 }} />
              <YAxis type="number" domain={[0, 130]} label={{ value: 'Price / Cost / Benefit', angle: -90, position: 'insideLeft' }} />
              <Tooltip formatter={formatValue} />
              <Legend verticalAlign="top" height={36} />
              {type === 'negative' ? (
                <>
                  <Line type="monotone" dataKey="MSB (=MPB)" stroke="var(--color-accent)" strokeWidth={2} dot={false} name="Demand (MSB = MPB)" connectNulls />
                  <Line type="monotone" dataKey="MPC" stroke="var(--color-secondary)" strokeWidth={2} dot={false} name="Supply (MPC)" />
                  <Line type="monotone" dataKey="MSC" stroke="#ef4444" strokeWidth={2} strokeDasharray="6 4" dot={false} name="Marginal Social Cost" />
                  {intervention > 0 && (
                    <Line type="monotone" dataKey="MPC with Tax" stroke="#22c55e" strokeWidth={2} dot={false} name="Supply with Tax" />
                  )}
                </>
              ) : (
                <>
                  <Line type="monotone" dataKey="MPB" stroke="var(--color-accent)" strokeWidth={2} dot={false} name="Demand (MPB)" connectNulls />
                  <Line type="monotone" dataKey="MSB" stroke="#a855f7" strokeWidth={2} strokeDasharray="6 4" dot={false} name="Marginal Social Benefit" connectNulls />
                  <Line type="monotone" dataKey="MPC" stroke="var(--color-secondary)" strokeWidth={2} dot={false} name="Supply (MPC)" />
                  {intervention > 0 && (
                    <Line type="monotone" dataKey="MPC with Subsidy" stroke="#22c55e" strokeWidth={2} dot={false} name="Supply with Subsidy" />
                  )}
                </>
              )}
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}