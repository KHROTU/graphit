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
interface ElasticityProps {
  initialElasticityType?: 'PED' | 'PES' | 'YED' | 'XED';
  initialCurveASlope?: number;
  initialCurveBSlope?: number;
  initialShift?: number;
}
type ElasticityType = 'PED' | 'PES' | 'YED' | 'XED';
type State = {
  type: ElasticityType;
  slopeA: number;
  slopeB: number;
  shift: number;
};
type Action =
  | { type: 'SET_TYPE'; payload: ElasticityType }
  | { type: 'SET_SLOPE_A'; payload: number }
  | { type: 'SET_SLOPE_B'; payload: number }
  | { type: 'SET_SHIFT'; payload: number };
function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_TYPE': return { ...state, type: action.payload };
    case 'SET_SLOPE_A': return { ...state, slopeA: action.payload };
    case 'SET_SLOPE_B': return { ...state, slopeB: action.payload };
    case 'SET_SHIFT': return { ...state, shift: action.payload };
    default: return state;
  }
}
const formatValue = (value: unknown): React.ReactNode => {
  if (typeof value === 'number') return Number(value.toFixed(2));
  return String(value);
};
export default function ElasticityGraph(props: ElasticityProps) {
  const initialState: State = {
    type: props.initialElasticityType || 'PED',
    slopeA: props.initialCurveASlope || 1,
    slopeB: props.initialCurveBSlope || 0.3,
    shift: props.initialShift || 0,
  };
  const [state, dispatch] = useReducer(reducer, initialState);
  const { type, slopeA, slopeB, shift } = state;
  const diagramContainerRef = useRef<HTMLDivElement>(null);
  const { openExportModal } = useExportModal();
  const data = useMemo(() => {
    const intercept = 120;
    const chartData = [];
    const typeConfig = {
      PED: {
        xKey: 'quantity',
        curveALabel: 'Elastic Demand',
        curveBLabel: 'Inelastic Demand',
        slopeA: 1,
      },
      PES: {
        xKey: 'quantity',
        curveALabel: 'Elastic Supply',
        curveBLabel: 'Inelastic Supply',
        slopeA: 1,
      },
      YED: {
        xKey: 'income',
        curveALabel: 'Normal Good (YED > 0)',
        curveBLabel: 'Inferior Good (YED < 0)',
        slopeA: 1,
      },
      XED: {
        xKey: 'price',
        curveALabel: 'Substitute Good',
        curveBLabel: 'Complement Good',
        slopeA: 1,
      },
    };
    const config = typeConfig[type];
    for (let x = 0; x <= 100; x++) {
      const a = intercept - config.slopeA * x;
      let b: number | null = null;
      if (type === 'YED') {
        b = 20 + slopeB * x;
      } else if (type === 'XED') {
        b = intercept - slopeB * x;
      } else {
        b = 10 + slopeB * x;
      }
      const shiftedA = intercept - slopeA * x + shift;
      chartData.push({
        [config.xKey]: x,
        [config.curveALabel]: a > 0 ? a : null,
        [config.curveBLabel]: b != null && b > 0 && b < 140 ? b : null,
        ...(shift !== 0 ? { [`${config.curveALabel} (Shifted)`]: shiftedA > 0 ? shiftedA : null } : {}),
      });
    }
    return chartData;
  }, [type, slopeA, slopeB, shift]);
  const xKey = type === 'PED' || type === 'PES' ? 'quantity' : type === 'YED' ? 'income' : 'price';
  const xLabel = type === 'PED' || type === 'PES' ? 'Quantity' : type === 'YED' ? 'Income' : 'Price of Good B';
  const yLabel = type === 'PED' || type === 'PES' ? 'Price' : type === 'YED' ? 'Quantity Demanded' : 'Quantity of Good A';
  const curveALabel = type === 'PED' ? 'Elastic Demand' : type === 'PES' ? 'Elastic Supply'
    : type === 'YED' ? 'Normal Good (YED > 0)' : 'Substitute Good';
  const curveBLabel = type === 'PED' ? 'Inelastic Demand' : type === 'PES' ? 'Inelastic Supply'
    : type === 'YED' ? 'Inferior Good (YED < 0)' : 'Complement Good';
  const getDiagramState = () => ({
    initialElasticityType: type,
    initialCurveASlope: slopeA,
    initialCurveBSlope: slopeB,
    initialShift: shift,
  });
  const typeDescriptions: Record<ElasticityType, string> = {
    PED: 'Price Elasticity of Demand measures responsiveness of quantity demanded to price changes. Steeper slope = more inelastic.',
    PES: 'Price Elasticity of Supply measures responsiveness of quantity supplied to price changes.',
    YED: 'Income Elasticity of Demand. Normal goods have positive YED; inferior goods have negative YED.',
    XED: 'Cross Elasticity of Demand. Substitutes have positive XED; complements have negative XED.',
  };
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-1">
        <Card>
          <CardHeader><CardTitle>Elasticity Curves</CardTitle></CardHeader>
          <div className="p-6 space-y-6">
            <SegmentControl
              options={[
                { value: 'PED', label: 'PED' },
                { value: 'PES', label: 'PES' },
                { value: 'YED', label: 'YED' },
                { value: 'XED', label: 'XED' },
              ]}
              value={type}
              onValueChange={(val) => dispatch({ type: 'SET_TYPE', payload: val as ElasticityType })}
            />
            <SliderControl
              label={`Curve A Slope (${slopeA.toFixed(1)})`}
              value={slopeA}
              min={0.1}
              max={3}
              step={0.1}
              unit=""
              onChange={(val) => dispatch({ type: 'SET_SLOPE_A', payload: val })}
            />
            <SliderControl
              label={`Curve B Slope (${slopeB.toFixed(1)})`}
              value={slopeB}
              min={0.1}
              max={3}
              step={0.1}
              unit=""
              onChange={(val) => dispatch({ type: 'SET_SLOPE_B', payload: val })}
            />
            {type === 'PED' && (
              <SliderControl
                label={`Shift Curve A (${shift})`}
                value={shift}
                min={-30}
                max={30}
                step={5}
                unit=""
                onChange={(val) => dispatch({ type: 'SET_SHIFT', payload: val })}
              />
            )}
            <div className="text-sm border-t border-neutral-dark/50 pt-4">
              <h4 className="font-semibold mb-2">Elasticity Insight</h4>
              <p>{typeDescriptions[type]}</p>
            </div>
            <div className="flex flex-col gap-2 pt-4 border-t border-neutral-dark/30">
              <Button onClick={() => openExportModal(diagramContainerRef, 'elasticity-graph')}>
                <Save className="mr-2 h-4 w-4" /> Save & Export Image
              </Button>
              <SaveGraphButton diagramName="Elasticity Curves" getDiagramState={getDiagramState} />
            </div>
          </div>
        </Card>
      </div>
      <div className="md:col-span-2 min-h-[500px]">
        <Card className="h-full !p-4" ref={diagramContainerRef} data-testid="diagram-container">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
              <XAxis type="number" dataKey={xKey} domain={[0, 90]} label={{ value: xLabel, position: 'insideBottom', offset: -10 }} />
              <YAxis type="number" domain={[0, 140]} label={{ value: yLabel, angle: -90, position: 'insideLeft' }} />
              <Tooltip formatter={formatValue} />
              <Legend verticalAlign="top" height={36} />
              <Line type="monotone" dataKey={curveALabel} stroke="var(--color-accent)" strokeWidth={2} dot={false} name={curveALabel} connectNulls />
              <Line type="monotone" dataKey={curveBLabel} stroke="var(--color-secondary)" strokeWidth={2} dot={false} name={curveBLabel} connectNulls />
              {shift !== 0 && (
                <Line type="monotone" dataKey={`${curveALabel} (Shifted)`} stroke="var(--color-accent)" strokeWidth={2} strokeDasharray="6 4" dot={false} name={`${curveALabel} (Shifted)`} connectNulls />
              )}
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}