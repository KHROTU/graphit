'use client';
import React, { useReducer, useMemo, useRef } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Save } from 'lucide-react';
import { useExportModal } from '@/lib/context/ExportModalContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import SaveGraphButton from '@/components/shared/SaveGraphButton';
import { SegmentControl } from '../controls/SegmentControl';
import { SliderControl } from '../controls/SliderControl';
type Mode = 'heating' | 'cooling';
type Substance = 'water' | 'ethanol' | 'stearic-acid';
interface HeatingCoolingCurveProps {
  initialMode?: Mode;
  initialSubstance?: Substance;
  initialMeltingPoint?: number;
  initialBoilingPoint?: number;
}
type State = {
  mode: Mode;
  substance: Substance;
  meltingPoint: number;
  boilingPoint: number;
};
type Action =
  | { type: 'SET_MODE'; payload: Mode }
  | { type: 'SET_SUBSTANCE'; payload: Substance }
  | { type: 'SET_MELTING_POINT'; payload: number }
  | { type: 'SET_BOILING_POINT'; payload: number };
function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_MODE':
      return { ...state, mode: action.payload };
    case 'SET_SUBSTANCE':
      if (action.payload === 'water') return { ...state, substance: action.payload, meltingPoint: 0, boilingPoint: 100 };
      if (action.payload === 'ethanol') return { ...state, substance: action.payload, meltingPoint: -114, boilingPoint: 78 };
      return { ...state, substance: action.payload, meltingPoint: 69, boilingPoint: 361 };
    case 'SET_MELTING_POINT':
      return { ...state, meltingPoint: action.payload };
    case 'SET_BOILING_POINT':
      return { ...state, boilingPoint: action.payload };
    default:
      return state;
  }
}
const formatValue = (value: unknown): React.ReactNode => {
  if (typeof value === 'number') return Number(value.toFixed(1));
  return String(value);
};
const substances = [
  { value: 'water' as const, label: 'Water' },
  { value: 'ethanol' as const, label: 'Ethanol' },
  { value: 'stearic-acid' as const, label: 'Stearic Acid' },
];
const modeOptions = [
  { value: 'heating' as const, label: 'Heating' },
  { value: 'cooling' as const, label: 'Cooling' },
];
export default function HeatingCoolingCurve(props: HeatingCoolingCurveProps) {
  const initialState: State = {
    mode: props.initialMode || 'heating',
    substance: props.initialSubstance || 'water',
    meltingPoint: props.initialMeltingPoint ?? 0,
    boilingPoint: props.initialBoilingPoint ?? 100,
  };
  const [state, dispatch] = useReducer(reducer, initialState);
  const { mode, substance, meltingPoint, boilingPoint } = state;
  const diagramContainerRef = useRef<HTMLDivElement>(null);
  const { openExportModal } = useExportModal();
  const data = useMemo(() => {
    const chartData: { time: number; temperature: number }[] = [];
    const startTemp = mode === 'heating' ? -30 : 140;
    const endTemp = mode === 'heating' ? 140 : -30;
    const dir = mode === 'heating' ? 1 : -1;
    const mp = meltingPoint;
    const bp = boilingPoint;
    const points = mp < bp ? [mp, bp] : [bp, mp];
    const p1 = points[0];
    const p2 = points[1];
    const numPoints = 300;
    for (let i = 0; i <= numPoints; i++) {
      const fraction = i / numPoints;
      let temp = startTemp + dir * fraction * Math.abs(endTemp - startTemp);
      if (dir > 0) {
        if (temp >= p1 && temp < p1 + 1) temp = p1;
        if (temp >= p2 && temp < p2 + 1) temp = p2;
      } else {
        if (temp <= p2 && temp > p2 - 1) temp = p2;
        if (temp <= p1 && temp > p1 - 1) temp = p1;
      }
      chartData.push({
        time: Number((fraction * 20).toFixed(2)),
        temperature: Number(temp.toFixed(1)),
      });
    }
    const unique = chartData.filter((p, idx, arr) => {
      if (idx === 0) return true;
      const prev = arr[idx - 1];
      return p.temperature !== prev.temperature || (idx + 1 < arr.length && arr[idx + 1].temperature !== p.temperature);
    });
    return unique;
  }, [mode, meltingPoint, boilingPoint]);
  const getDiagramState = () => ({
    initialMode: mode,
    initialSubstance: substance,
    initialMeltingPoint: meltingPoint,
    initialBoilingPoint: boilingPoint,
  });
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-1">
        <Card>
          <CardHeader><CardTitle>Heating & Cooling Curves</CardTitle></CardHeader>
          <div className="p-6 space-y-6">
            <SegmentControl
              value={mode}
              onValueChange={(val) => dispatch({ type: 'SET_MODE', payload: val })}
              options={modeOptions}
            />
            <SegmentControl
              value={substance}
              onValueChange={(val) => dispatch({ type: 'SET_SUBSTANCE', payload: val })}
              options={substances}
            />
            <SliderControl
              label="Melting Point"
              value={meltingPoint}
              unit=" °C"
              min={-150}
              max={300}
              step={1}
              onChange={(val) => dispatch({ type: 'SET_MELTING_POINT', payload: val })}
            />
            <SliderControl
              label="Boiling Point"
              value={boilingPoint}
              unit=" °C"
              min={-100}
              max={400}
              step={1}
              onChange={(val) => dispatch({ type: 'SET_BOILING_POINT', payload: val })}
            />
            <div className="text-sm border-t border-neutral-dark/50 pt-4">
              <h4 className="font-semibold mb-2">Phase Changes</h4>
              <p className="text-text/70">Solid → Liquid: {meltingPoint}°C<br />Liquid → Gas: {boilingPoint}°C</p>
              <p className="text-text/60 text-xs mt-2">
                Flat regions indicate phase changes where latent heat is absorbed/released without temperature change.
              </p>
            </div>
            <div className="flex flex-col gap-2 pt-4 border-t border-neutral-dark/30">
              <Button onClick={() => openExportModal(diagramContainerRef, 'heating-cooling-curve')}>
                <Save className="mr-2 h-4 w-4" /> Save & Export Image
              </Button>
              <SaveGraphButton diagramName="Heating & Cooling Curves" getDiagramState={getDiagramState} />
            </div>
          </div>
        </Card>
      </div>
      <div className="md:col-span-2 min-h-[400px]">
        <Card className="h-full !p-4" ref={diagramContainerRef} data-testid="diagram-container">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
              <XAxis
                type="number"
                dataKey="time"
                domain={[0, 'dataMax']}
                stroke="var(--color-text)"
                label={{ value: 'Time (min)', position: 'insideBottom', offset: -10, fill: 'var(--color-text)' }}
              />
              <YAxis
                type="number"
                stroke="var(--color-text)"
                label={{ value: 'Temperature (°C)', angle: -90, position: 'insideLeft', fill: 'var(--color-text)' }}
              />
              <Tooltip
                formatter={formatValue}
                contentStyle={{
                  backgroundColor: 'var(--color-neutral)',
                  border: '1px solid var(--color-neutral-dark)',
                  borderRadius: 'var(--border-radius-apple)',
                }}
              />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ color: 'var(--color-text)' }} />
              <Line
                type="monotone"
                dataKey="temperature"
                stroke="var(--color-accent)"
                strokeWidth={2}
                dot={false}
                name={`${substance.charAt(0).toUpperCase() + substance.slice(1)} ${mode === 'heating' ? 'Heating' : 'Cooling'} Curve`}
              />
              <ReferenceLine
                y={meltingPoint}
                stroke="var(--color-secondary)"
                strokeDasharray="6 4"
                label={{ value: `M.P. ${meltingPoint}°C`, position: 'right', fill: 'var(--color-secondary)', fontSize: 11 }}
              />
              <ReferenceLine
                y={boilingPoint}
                stroke="var(--color-secondary)"
                strokeDasharray="6 4"
                label={{ value: `B.P. ${boilingPoint}°C`, position: 'right', fill: 'var(--color-secondary)', fontSize: 11 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}