'use client';
import React, { useReducer, useMemo, useRef } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Save } from 'lucide-react';
import { useExportModal } from '@/lib/context/ExportModalContext';
import { ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import SaveGraphButton from '@/components/shared/SaveGraphButton';
import { SegmentControl } from '../controls/SegmentControl';
import { SliderControl } from '../controls/SliderControl';
type BasinType = 'urban' | 'rural' | 'custom';
interface StormHydrographProps {
  initialBasin?: BasinType;
  initialRainfall?: number;
  initialDuration?: number;
  initialBaseFlow?: number;
}
type State = {
  basin: BasinType;
  rainfall: number;
  duration: number;
  baseFlow: number;
};
type Action =
  | { type: 'SET_BASIN'; payload: BasinType }
  | { type: 'SET_RAINFALL'; payload: number }
  | { type: 'SET_DURATION'; payload: number }
  | { type: 'SET_BASE_FLOW'; payload: number };
function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_BASIN': return { ...state, basin: action.payload };
    case 'SET_RAINFALL': return { ...state, rainfall: action.payload };
    case 'SET_DURATION': return { ...state, duration: action.payload };
    case 'SET_BASE_FLOW': return { ...state, baseFlow: action.payload };
    default: return state;
  }
}
const generateHydrograph = (rainfall: number, duration: number, baseFlow: number, basin: BasinType) => {
  const timesteps = 48;
  const dt = 0.5;
  const peakLag = basin === 'urban' ? 3 : basin === 'rural' ? 8 : 5;
  const peakMultiplier = basin === 'urban' ? 3.5 : basin === 'rural' ? 2.0 : 2.5;
  const recessionRate = basin === 'urban' ? 0.8 : basin === 'rural' ? 0.2 : 0.5;
  const data: Array<{ time: number; discharge: number; rainfallRate: number }> = [];
  for (let i = 0; i < timesteps; i++) {
    const t = i * dt;
    const isRaining = t >= 2 && t < 2 + duration;
    let discharge = baseFlow;
    if (t >= 2 + peakLag) {
      const elapsed = t - 2 - peakLag;
      const rising = Math.min(1, elapsed / (peakLag * 0.8));
      const falling = Math.exp(-recessionRate * Math.max(0, elapsed - peakLag * 0.8));
      const peak = baseFlow + rainfall * peakMultiplier * rising * falling;
      discharge = Math.max(baseFlow, peak);
    }
    data.push({
      time: Number(t.toFixed(1)),
      discharge: Math.round(discharge),
      rainfallRate: isRaining ? rainfall : 0,
    });
  }
  return data;
};
export default function StormHydrograph(props: StormHydrographProps) {
  const initialState: State = {
    basin: props.initialBasin || 'rural',
    rainfall: props.initialRainfall ?? 30,
    duration: props.initialDuration ?? 4,
    baseFlow: props.initialBaseFlow ?? 5,
  };
  const [state, dispatch] = useReducer(reducer, initialState);
  const { basin, rainfall, duration, baseFlow } = state;
  const diagramContainerRef = useRef<HTMLDivElement>(null);
  const { openExportModal } = useExportModal();
  const data = useMemo(
    () => generateHydrograph(rainfall, duration, baseFlow, basin),
    [rainfall, duration, baseFlow, basin]
  );
  const peakDischarge = useMemo(() => {
    if (data.length === 0) return 0;
    return Math.max(...data.map((d) => d.discharge));
  }, [data]);
  const peakTime = useMemo(() => {
    const peak = peakDischarge;
    const entry = data.find((d) => d.discharge === peak);
    return entry ? entry.time : 0;
  }, [data, peakDischarge]);
  const lagTime = useMemo(() => {
    const midpoint = duration / 2;
    return Math.max(0, peakTime - (2 + midpoint));
  }, [peakTime, duration]);
  const getDiagramState = () => ({
    initialBasin: basin,
    initialRainfall: rainfall,
    initialDuration: duration,
    initialBaseFlow: baseFlow,
  });
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-1">
        <Card>
          <CardHeader><CardTitle>Storm Hydrograph</CardTitle></CardHeader>
          <div className="p-6 space-y-6">
            <SegmentControl
              value={basin}
              onValueChange={(val) => dispatch({ type: 'SET_BASIN', payload: val as BasinType })}
              options={[
                { value: 'urban', label: 'Urban' },
                { value: 'rural', label: 'Rural' },
                { value: 'custom', label: 'Custom' },
              ]}
            />
            <SliderControl
              label="Rainfall Intensity"
              value={rainfall}
              unit=" mm/hr"
              min={5}
              max={80}
              step={1}
              onChange={(v) => dispatch({ type: 'SET_RAINFALL', payload: v })}
            />
            <SliderControl
              label="Storm Duration"
              value={duration}
              unit=" hrs"
              min={1}
              max={12}
              step={0.5}
              onChange={(v) => dispatch({ type: 'SET_DURATION', payload: v })}
            />
            <SliderControl
              label="Base Flow"
              value={baseFlow}
              unit=" m³/s"
              min={1}
              max={20}
              step={0.5}
              onChange={(v) => dispatch({ type: 'SET_BASE_FLOW', payload: v })}
            />
            <div className="space-y-1 p-3 rounded-[var(--border-radius-apple)] bg-neutral/30">
              <p className="text-xs font-semibold text-text">Key Metrics</p>
              <p className="text-xs text-text/70">Peak Discharge: <span className="font-mono text-text">{peakDischarge} m³/s</span></p>
              <p className="text-xs text-text/70">Peak Time: <span className="font-mono text-text">{peakTime.toFixed(1)} hrs</span></p>
              <p className="text-xs text-text/70">Lag Time: <span className="font-mono text-text">{lagTime.toFixed(1)} hrs</span></p>
            </div>
            <div className="flex flex-col gap-2 pt-4 border-t border-neutral-dark/30">
              <Button onClick={() => openExportModal(diagramContainerRef, 'storm-hydrograph')}>
                <Save className="mr-2 h-4 w-4" /> Save & Export Image
              </Button>
              <SaveGraphButton diagramName="Storm Hydrograph" getDiagramState={getDiagramState} />
            </div>
          </div>
        </Card>
      </div>
      <div className="md:col-span-2 min-h-[400px] md:min-h-0">
        <Card className="h-full !p-4" ref={diagramContainerRef} data-testid="diagram-container">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
              <XAxis
                dataKey="time"
                type="number"
                domain={[0, 24]}
                stroke="var(--color-text)"
                label={{ value: 'Time (hours)', position: 'insideBottom', offset: -10, fill: 'var(--color-text)' }}
              />
              <YAxis
                yAxisId="left"
                stroke="var(--color-accent)"
                label={{ value: 'Discharge (m³/s)', angle: -90, position: 'insideLeft', fill: 'var(--color-accent)' }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="var(--color-secondary)"
                label={{ value: 'Rainfall (mm/hr)', angle: 90, position: 'insideRight', fill: 'var(--color-secondary)' }}
                domain={[0, Math.max(rainfall * 1.2, 10)]}
              />
              <Tooltip
                formatter={(value: number | string, name: string) => {
                  const v = typeof value === 'number' ? value : parseFloat(value as string);
                  return name === 'Discharge' ? `${v.toFixed(1)} m³/s` : `${v.toFixed(1)} mm/hr`;
                }}
                labelFormatter={(label: number) => `Time: ${label} hrs`}
              />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ color: 'var(--color-text)' }} />
              <ReferenceLine yAxisId="left" x={2} stroke="var(--color-text)" strokeOpacity={0.3} label={{ value: 'Storm Start', position: 'top', fill: 'var(--color-text)', fontSize: 11 }} />
              <ReferenceLine yAxisId="left" x={2 + duration} stroke="var(--color-text)" strokeOpacity={0.3} strokeDasharray="4 4" label={{ value: 'Storm End', position: 'top', fill: 'var(--color-text)', fontSize: 11 }} />
              <Area yAxisId="left" type="monotone" dataKey="discharge" fill="var(--color-accent)" fillOpacity={0.2} stroke="var(--color-accent)" strokeWidth={2} name="Discharge" />
              <Line yAxisId="right" type="stepAfter" dataKey="rainfallRate" stroke="var(--color-secondary)" strokeWidth={2} dot={false} name="Rainfall" />
            </ComposedChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}