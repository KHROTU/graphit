'use client';
import React, { useReducer, useMemo, useRef } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Save } from 'lucide-react';
import { useExportModal } from '@/lib/context/ExportModalContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import SaveGraphButton from '@/components/shared/SaveGraphButton';
import { SegmentControl } from '../controls/SegmentControl';
import { SliderControl } from '../controls/SliderControl';
type GraphMode = 'time' | 'distance';
interface WaveGraphProps {
  initialMode?: GraphMode;
  initialAmplitude?: number;
  initialWavelength?: number;
  initialFrequency?: number;
  initialPhase?: number;
}
type State = {
  mode: GraphMode;
  amplitude: number;
  wavelength: number;
  frequency: number;
  phase: number;
};
type Action =
  | { type: 'SET_MODE'; payload: GraphMode }
  | { type: 'SET_AMPLITUDE'; payload: number }
  | { type: 'SET_WAVELENGTH'; payload: number }
  | { type: 'SET_FREQUENCY'; payload: number }
  | { type: 'SET_PHASE'; payload: number };
function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_MODE': return { ...state, mode: action.payload };
    case 'SET_AMPLITUDE': return { ...state, amplitude: action.payload };
    case 'SET_WAVELENGTH': return { ...state, wavelength: action.payload };
    case 'SET_FREQUENCY': return { ...state, frequency: action.payload };
    case 'SET_PHASE': return { ...state, phase: action.payload };
    default: return state;
  }
}
const formatValue = (value: unknown): React.ReactNode => {
  if (typeof value === 'number') return Number(value.toFixed(3));
  return String(value);
};
const modeOptions = [
  { value: 'time' as const, label: 'Displacement-Time' },
  { value: 'distance' as const, label: 'Displacement-Distance' },
];
export default function WaveGraph(props: WaveGraphProps) {
  const initialState: State = {
    mode: props.initialMode || 'time',
    amplitude: props.initialAmplitude || 2,
    wavelength: props.initialWavelength || 4,
    frequency: props.initialFrequency || 2,
    phase: props.initialPhase || 0,
  };
  const [state, dispatch] = useReducer(reducer, initialState);
  const { mode, amplitude, wavelength, frequency, phase } = state;
  const diagramContainerRef = useRef<HTMLDivElement>(null);
  const { openExportModal } = useExportModal();
  const data = useMemo(() => {
    const chartData: { x: number; displacement: number }[] = [];
    const points = 400;
    if (mode === 'time') {
      const period = 1 / frequency;
      for (let i = 0; i <= points; i++) {
        const t = (i / points) * period * 3;
        chartData.push({
          x: Number(t.toFixed(3)),
          displacement: Number((amplitude * Math.sin(2 * Math.PI * frequency * t + phase)).toFixed(4)),
        });
      }
    } else {
      for (let i = 0; i <= points; i++) {
        const d = (i / points) * wavelength * 3;
        chartData.push({
          x: Number(d.toFixed(3)),
          displacement: Number((amplitude * Math.sin((2 * Math.PI * d) / wavelength + phase)).toFixed(4)),
        });
      }
    }
    return chartData;
  }, [mode, amplitude, wavelength, frequency, phase]);
  const period = mode === 'time' ? 1 / frequency : wavelength / (frequency > 0 ? frequency : 1);
  const waveSpeed = wavelength * frequency;
  const getDiagramState = () => ({
    initialMode: mode,
    initialAmplitude: amplitude,
    initialWavelength: wavelength,
    initialFrequency: frequency,
    initialPhase: phase,
  });
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-1">
        <Card>
          <CardHeader><CardTitle>Wave Parameters</CardTitle></CardHeader>
          <div className="p-6 space-y-6">
            <SegmentControl
              value={mode}
              onValueChange={(val) => dispatch({ type: 'SET_MODE', payload: val })}
              options={modeOptions}
            />
            <SliderControl
              label="Amplitude"
              value={amplitude}
              unit=" m"
              min={0.1}
              max={10}
              step={0.1}
              onChange={(val) => dispatch({ type: 'SET_AMPLITUDE', payload: val })}
            />
            <SliderControl
              label="Wavelength"
              value={wavelength}
              unit=" m"
              min={0.5}
              max={20}
              step={0.5}
              onChange={(val) => dispatch({ type: 'SET_WAVELENGTH', payload: val })}
            />
            <SliderControl
              label="Frequency"
              value={frequency}
              unit=" Hz"
              min={0.1}
              max={10}
              step={0.1}
              onChange={(val) => dispatch({ type: 'SET_FREQUENCY', payload: val })}
            />
            <SliderControl
              label="Phase Shift"
              value={phase}
              unit=" rad"
              min={0}
              max={2 * Math.PI}
              step={0.1}
              onChange={(val) => dispatch({ type: 'SET_PHASE', payload: val })}
            />
            <div className="text-sm border-t border-neutral-dark/50 pt-4">
              <h4 className="font-semibold mb-2">Wave Properties</h4>
              <p>Period: {mode === 'time' ? `${period.toFixed(3)} s` : `${wavelength.toFixed(1)} m`}</p>
              <p>Wave Speed: v = fλ = {waveSpeed.toFixed(1)} m/s</p>
            </div>
            <div className="flex flex-col gap-2 pt-4 border-t border-neutral-dark/30">
              <Button onClick={() => openExportModal(diagramContainerRef, 'wave-graph')}>
                <Save className="mr-2 h-4 w-4" /> Save & Export Image
              </Button>
              <SaveGraphButton diagramName="Wave Graphs" getDiagramState={getDiagramState} />
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
                dataKey="x"
                domain={[0, 'dataMax']}
                stroke="var(--color-text)"
                label={{
                  value: mode === 'time' ? 'Time (s)' : 'Distance (m)',
                  position: 'insideBottom',
                  offset: -10,
                  fill: 'var(--color-text)',
                }}
              />
              <YAxis
                type="number"
                domain={[-amplitude * 1.3, amplitude * 1.3]}
                stroke="var(--color-text)"
                label={{ value: 'Displacement (m)', angle: -90, position: 'insideLeft', fill: 'var(--color-text)' }}
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
                dataKey="displacement"
                stroke="var(--color-accent)"
                strokeWidth={2}
                dot={false}
                name="Wave"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}