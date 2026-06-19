'use client';
import React, { useReducer, useMemo, useRef } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Label } from '@/components/ui/Label';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Save } from 'lucide-react';
import { useExportModal } from '@/lib/context/ExportModalContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import SaveGraphButton from '@/components/shared/SaveGraphButton';
import { SegmentControl } from '@/components/diagrams/controls/SegmentControl';
import { SliderControl } from '@/components/diagrams/controls/SliderControl';
interface TrigGraphProps {
  initialFunction?: string;
  initialAmplitude?: number;
  initialPeriod?: number;
  initialPhaseShift?: number;
  initialVerticalShift?: number;
  initialXMin?: number;
  initialXMax?: number;
}
type TrigFunction = 'sin' | 'cos' | 'tan';
type State = {
  trigFunction: TrigFunction;
  amplitude: number;
  period: number;
  phaseShift: number;
  verticalShift: number;
  xMin: number;
  xMax: number;
};
type Action =
  | { type: 'SET_FUNCTION'; payload: TrigFunction }
  | { type: 'SET_AMPLITUDE'; payload: number }
  | { type: 'SET_PERIOD'; payload: number }
  | { type: 'SET_PHASE_SHIFT'; payload: number }
  | { type: 'SET_VERTICAL_SHIFT'; payload: number }
  | { type: 'SET_X_MIN'; payload: number }
  | { type: 'SET_X_MAX'; payload: number };
const functionOptions: { value: TrigFunction; label: string }[] = [
  { value: 'sin', label: 'sin(x)' },
  { value: 'cos', label: 'cos(x)' },
  { value: 'tan', label: 'tan(x)' },
];
function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_FUNCTION': return { ...state, trigFunction: action.payload };
    case 'SET_AMPLITUDE': return { ...state, amplitude: action.payload };
    case 'SET_PERIOD': return { ...state, period: action.payload };
    case 'SET_PHASE_SHIFT': return { ...state, phaseShift: action.payload };
    case 'SET_VERTICAL_SHIFT': return { ...state, verticalShift: action.payload };
    case 'SET_X_MIN': return { ...state, xMin: action.payload };
    case 'SET_X_MAX': return { ...state, xMax: action.payload };
    default: return state;
  }
}
function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}
const TRIG_COLORS = ['#38bdf8', '#f87171', '#34d399'];
export default function TrigonometricGraph(props: TrigGraphProps) {
  const initialState: State = {
    trigFunction: (props.initialFunction as TrigFunction) || 'sin',
    amplitude: props.initialAmplitude || 1,
    period: props.initialPeriod || 360,
    phaseShift: props.initialPhaseShift || 0,
    verticalShift: props.initialVerticalShift || 0,
    xMin: props.initialXMin || -360,
    xMax: props.initialXMax || 360,
  };
  const [state, dispatch] = useReducer(reducer, initialState);
  const { trigFunction, amplitude, period, phaseShift, verticalShift, xMin, xMax } = state;
  const diagramContainerRef = useRef<HTMLDivElement>(null);
  const { openExportModal } = useExportModal();
  const functionName = useMemo(() => {
    const ampStr = amplitude !== 1 ? `${amplitude}` : '';
    const fn = trigFunction;
    const b = period !== 0 ? (360 / period).toFixed(2) : '1';
    const ps = phaseShift !== 0 ? ` ${phaseShift >= 0 ? '+' : '-'} ${Math.abs(phaseShift)}°` : '';
    const vs = verticalShift !== 0 ? ` ${verticalShift >= 0 ? '+' : '-'} ${Math.abs(verticalShift)}` : '';
    return `${ampStr}${fn}(${b}x${ps})${vs}`.replace(/^1(?=\w)/, '');
  }, [trigFunction, amplitude, period, phaseShift, verticalShift]);
  const data = useMemo(() => {
    const points: { x: number; y: number; xLabel: string }[] = [];
    const step = (xMax - xMin) / 400;
    const b = period !== 0 ? (2 * Math.PI) / period : 2 * Math.PI / 360;
    for (let xDeg = xMin; xDeg <= xMax; xDeg += step) {
      const xRad = toRadians(xDeg);
      let y: number;
      const argument = b * xRad - toRadians(phaseShift);
      switch (trigFunction) {
        case 'sin': y = amplitude * Math.sin(argument); break;
        case 'cos': y = amplitude * Math.cos(argument); break;
        case 'tan': y = amplitude * Math.tan(argument); break;
        default: y = 0;
      }
      y += verticalShift;
      if (Math.abs(y) > 100) y = trigFunction === 'tan' ? (y > 0 ? 100 : -100) : y;
      points.push({
        x: xDeg,
        y,
        xLabel: `${xDeg.toFixed(0)}°`,
      });
    }
    return points;
  }, [trigFunction, amplitude, period, phaseShift, verticalShift, xMin, xMax]);
  const yDomain: [number, number] = useMemo(() => {
    if (trigFunction === 'tan') return [-10, 10];
    const amp = Math.abs(amplitude) + Math.abs(verticalShift) + 1;
    return [-amp, amp];
  }, [trigFunction, amplitude, verticalShift]);
  const getDiagramState = () => ({
    initialFunction: trigFunction,
    initialAmplitude: amplitude,
    initialPeriod: period,
    initialPhaseShift: phaseShift,
    initialVerticalShift: verticalShift,
    initialXMin: xMin,
    initialXMax: xMax,
  });
  const formatValue = (v: unknown): React.ReactNode => {
    if (typeof v === 'number') return v.toFixed(3);
    return String(v);
  };
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-1">
        <Card>
          <CardHeader><CardTitle>Trigonometric Graphs</CardTitle></CardHeader>
          <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
            <div>
              <Label>Function</Label>
              <SegmentControl
                options={functionOptions}
                value={trigFunction}
                onValueChange={val => dispatch({ type: 'SET_FUNCTION', payload: val })}
              />
            </div>
            <SliderControl
              label="Amplitude"
              value={amplitude}
              min={-5}
              max={5}
              step={0.5}
              onChange={v => dispatch({ type: 'SET_AMPLITUDE', payload: v })}
            />
            <SliderControl
              label="Period (°)"
              value={period}
              min={30}
              max={1080}
              step={30}
              onChange={v => dispatch({ type: 'SET_PERIOD', payload: v })}
            />
            <SliderControl
              label="Phase Shift (°)"
              value={phaseShift}
              min={-360}
              max={360}
              step={15}
              onChange={v => dispatch({ type: 'SET_PHASE_SHIFT', payload: v })}
            />
            <SliderControl
              label="Vertical Shift"
              value={verticalShift}
              min={-5}
              max={5}
              step={0.5}
              onChange={v => dispatch({ type: 'SET_VERTICAL_SHIFT', payload: v })}
            />
            <div className="border-t border-neutral-dark/50 pt-4 space-y-2">
              <Label className="font-semibold">X-Axis Range (°)</Label>
              <div className="flex gap-2">
                <Input type="number" value={xMin} onChange={e => dispatch({ type: 'SET_X_MIN', payload: Number(e.target.value) })} placeholder="Min" />
                <Input type="number" value={xMax} onChange={e => dispatch({ type: 'SET_X_MAX', payload: Number(e.target.value) })} placeholder="Max" />
              </div>
            </div>
            <div className="border-t border-neutral-dark/50 pt-4">
              <p className="text-sm font-semibold">y = {functionName}</p>
            </div>
          </div>
          <div className="p-4 border-t border-neutral-dark/30 flex flex-col gap-2">
            <Button onClick={() => openExportModal(diagramContainerRef, 'trigonometric-graph')} className="w-full">
              <Save className="mr-2 h-4 w-4" /> Save & Export Image
            </Button>
            <SaveGraphButton diagramName="Trigonometric Graph" getDiagramState={getDiagramState} />
          </div>
        </Card>
      </div>
      <div className="md:col-span-2 min-h-[500px]">
        <Card className="h-full !p-4" ref={diagramContainerRef} data-testid="diagram-container">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
              <XAxis
                type="number"
                dataKey="x"
                domain={[xMin, xMax]}
                tickFormatter={v => `${v}°`}
                allowDataOverflow
              />
              <YAxis domain={yDomain} allowDataOverflow />
              <Tooltip formatter={formatValue} labelFormatter={v => `x = ${v}°`} />
              <Legend />
              <ReferenceLine y={0} stroke="var(--color-text)" strokeWidth={1} strokeOpacity={0.5} />
              <ReferenceLine x={0} stroke="var(--color-text)" strokeWidth={1} strokeOpacity={0.5} />
              <Line
                type="monotone"
                dataKey="y"
                stroke={TRIG_COLORS[0]}
                strokeWidth={2}
                dot={false}
                name={functionName}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}