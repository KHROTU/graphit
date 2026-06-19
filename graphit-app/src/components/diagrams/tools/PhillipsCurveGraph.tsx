'use client';
import React, { useReducer, useMemo, useRef } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Save } from 'lucide-react';
import { useExportModal } from '@/lib/context/ExportModalContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import SaveGraphButton from '@/components/shared/SaveGraphButton';
import { SliderControl } from '../controls/SliderControl';
interface PhillipsCurveProps {
  initialNairu?: number;
  initialExpectedInflation?: number;
  initialSensitivity?: number;
}
type State = {
  nairu: number;
  expectedInflation: number;
  sensitivity: number;
};
type Action =
  | { type: 'SET_NAIRU'; payload: number }
  | { type: 'SET_EXPECTED_INFLATION'; payload: number }
  | { type: 'SET_SENSITIVITY'; payload: number };
function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_NAIRU': return { ...state, nairu: action.payload };
    case 'SET_EXPECTED_INFLATION': return { ...state, expectedInflation: action.payload };
    case 'SET_SENSITIVITY': return { ...state, sensitivity: action.payload };
    default: return state;
  }
}
const formatValue = (value: unknown): React.ReactNode => {
  if (typeof value === 'number') return Number(value.toFixed(2));
  return String(value);
};
export default function PhillipsCurveGraph(props: PhillipsCurveProps) {
  const initialState: State = {
    nairu: props.initialNairu || 5,
    expectedInflation: props.initialExpectedInflation || 2,
    sensitivity: props.initialSensitivity || 1,
  };
  const [state, dispatch] = useReducer(reducer, initialState);
  const { nairu, expectedInflation, sensitivity } = state;
  const diagramContainerRef = useRef<HTMLDivElement>(null);
  const { openExportModal } = useExportModal();
  const { srpcData, lrpcData } = useMemo(() => {
    const srpc = [];
    for (let u = 0.5; u <= 14; u += 0.2) {
      const inflation = expectedInflation + sensitivity * (nairu - u);
      srpc.push({
        unemployment: Number(u.toFixed(1)),
        'Short-Run PC': Number(inflation.toFixed(2)),
      });
    }
    const lrpc = [];
    for (let pi = -4; pi <= 14; pi += 0.5) {
      lrpc.push({
        unemployment: nairu,
        'Long-Run PC': Number(pi.toFixed(1)),
      });
    }
    return { srpcData: srpc, lrpcData: lrpc };
  }, [nairu, expectedInflation, sensitivity]);
  const getDiagramState = () => ({
    initialNairu: nairu,
    initialExpectedInflation: expectedInflation,
    initialSensitivity: sensitivity,
  });
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-1">
        <Card>
          <CardHeader><CardTitle>Phillips Curve</CardTitle></CardHeader>
          <div className="p-6 space-y-6">
            <SliderControl
              label="NAIRU (%)"
              value={nairu}
              min={3}
              max={8}
              step={0.5}
              unit="%"
              onChange={(val) => dispatch({ type: 'SET_NAIRU', payload: val })}
            />
            <SliderControl
              label="Expected Inflation (%)"
              value={expectedInflation}
              min={0}
              max={8}
              step={0.5}
              unit="%"
              onChange={(val) => dispatch({ type: 'SET_EXPECTED_INFLATION', payload: val })}
            />
            <SliderControl
              label="SRPC Sensitivity"
              value={sensitivity}
              min={0.2}
              max={3}
              step={0.2}
              unit=""
              onChange={(val) => dispatch({ type: 'SET_SENSITIVITY', payload: val })}
            />
            <div className="text-sm border-t border-neutral-dark/50 pt-4">
              <h4 className="font-semibold mb-2">Key Insight</h4>
              <p>The Short-Run Phillips Curve (SRPC) shows an inverse relationship between inflation and unemployment.</p>
              <p className="mt-2">The Long-Run Phillips Curve (LRPC) is vertical at NAIRU ({nairu.toFixed(1)}%). In the long run, there is no trade-off between inflation and unemployment.</p>
              <p className="mt-2 text-xs text-neutral-400">Higher expected inflation shifts the SRPC upward. Sensitivity controls the steepness of the trade-off.</p>
            </div>
            <div className="flex flex-col gap-2 pt-4 border-t border-neutral-dark/30">
              <Button onClick={() => openExportModal(diagramContainerRef, 'phillips-curve-graph')}>
                <Save className="mr-2 h-4 w-4" /> Save & Export Image
              </Button>
              <SaveGraphButton diagramName="Phillips Curve" getDiagramState={getDiagramState} />
            </div>
          </div>
        </Card>
      </div>
      <div className="md:col-span-2 min-h-[500px]">
        <Card className="h-full !p-4" ref={diagramContainerRef} data-testid="diagram-container">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart margin={{ top: 5, right: 20, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
              <XAxis
                type="number"
                dataKey="unemployment"
                domain={[0, 12]}
                label={{ value: 'Unemployment Rate (%)', position: 'insideBottom', offset: -10 }}
                tickCount={7}
              />
              <YAxis
                type="number"
                domain={[-4, 14]}
                label={{ value: 'Inflation Rate (%)', angle: -90, position: 'insideLeft' }}
                tickCount={10}
              />
              <Tooltip formatter={formatValue} />
              <Legend verticalAlign="top" height={36} />
              <Line
                data={srpcData}
                type="monotone"
                dataKey="Short-Run PC"
                stroke="var(--color-accent)"
                strokeWidth={3}
                dot={false}
                name="Short-Run Phillips Curve"
                connectNulls
              />
              <Line
                data={lrpcData}
                type="monotone"
                dataKey="Long-Run PC"
                stroke="var(--color-secondary)"
                strokeWidth={3}
                dot={false}
                name="Long-Run Phillips Curve"
                connectNulls
              />
              <ReferenceLine
                x={nairu}
                stroke="var(--color-text)"
                strokeWidth={2}
                strokeDasharray="4 4"
                label={{
                  value: `NAIRU = ${nairu}%`,
                  position: 'insideTop',
                  fill: 'var(--color-text)',
                  fontSize: 12,
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}