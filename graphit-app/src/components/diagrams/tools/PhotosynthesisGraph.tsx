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
type FactorMode = 'light' | 'co2' | 'temperature';
interface PhotosynthesisGraphProps {
  initialMode?: FactorMode;
  initialLight?: number;
  initialCO2?: number;
  initialTemperature?: number;
}
type State = {
  mode: FactorMode;
  light: number;
  co2: number;
  temperature: number;
};
type Action =
  | { type: 'SET_MODE'; payload: FactorMode }
  | { type: 'SET_LIGHT'; payload: number }
  | { type: 'SET_CO2'; payload: number }
  | { type: 'SET_TEMPERATURE'; payload: number };
function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_MODE': return { ...state, mode: action.payload };
    case 'SET_LIGHT': return { ...state, light: action.payload };
    case 'SET_CO2': return { ...state, co2: action.payload };
    case 'SET_TEMPERATURE': return { ...state, temperature: action.payload };
    default: return state;
  }
}
const getRate = (light: number, co2: number, temp: number): number => {
  const lightEffect = (light / 100) * 100;
  const co2Effect = (co2 / 0.1) * 100;
  const tempOptimum = 25;
  const tempSigma = 12;
  const tempEffect = 100 * Math.exp(-Math.pow(temp - tempOptimum, 2) / (2 * Math.pow(tempSigma, 2)));
  return Math.round(Math.min(lightEffect, Math.min(co2Effect, tempEffect)));
};
const limitingFactorLabel = (rate: number, light: number, co2: number, temp: number): string => {
  const lightEffect = (light / 100) * 100;
  const co2Effect = (co2 / 0.1) * 100;
  const tempOptimum = 25;
  const tempSigma = 12;
  const tempEffect = 100 * Math.exp(-Math.pow(temp - tempOptimum, 2) / (2 * Math.pow(tempSigma, 2)));
  const effects: [string, number][] = [['Light Intensity', lightEffect], ['CO₂ Concentration', co2Effect], ['Temperature', tempEffect]];
  effects.sort((a, b) => a[1] - b[1]);
  return effects[0][0];
};
export default function PhotosynthesisGraph(props: PhotosynthesisGraphProps) {
  const initialState: State = {
    mode: props.initialMode || 'light',
    light: props.initialLight ?? 80,
    co2: props.initialCO2 ?? 0.04,
    temperature: props.initialTemperature ?? 25,
  };
  const [state, dispatch] = useReducer(reducer, initialState);
  const { mode, light, co2, temperature } = state;
  const diagramContainerRef = useRef<HTMLDivElement>(null);
  const { openExportModal } = useExportModal();
  const currentRate = useMemo(() => getRate(light, co2, temperature), [light, co2, temperature]);
  const limitingFactor = useMemo(() => limitingFactorLabel(currentRate, light, co2, temperature), [currentRate, light, co2, temperature]);
  const data = useMemo(() => {
    const chartData: Array<{ x: number; rate: number }> = [];
    if (mode === 'light') {
      for (let i = 0; i <= 100; i += 2) {
        chartData.push({ x: i, rate: getRate(i, co2, temperature) });
      }
    } else if (mode === 'co2') {
      for (let c = 0; c <= 0.1; c += 0.002) {
        chartData.push({ x: Number(c.toFixed(3)), rate: getRate(light, c, temperature) });
      }
    } else {
      for (let t = 0; t <= 45; t += 0.5) {
        chartData.push({ x: t, rate: getRate(light, co2, t) });
      }
    }
    return chartData;
  }, [mode, light, co2, temperature]);
  const xAxisLabel = mode === 'light' ? 'Light Intensity (arbitrary units)' : mode === 'co2' ? 'CO₂ Concentration (%)' : 'Temperature (°C)';
  const getDiagramState = () => ({
    initialMode: mode,
    initialLight: light,
    initialCO2: co2,
    initialTemperature: temperature,
  });
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-1">
        <Card>
          <CardHeader><CardTitle>Photosynthesis Rate</CardTitle></CardHeader>
          <div className="p-6 space-y-6">
            <SegmentControl
              value={mode}
              onValueChange={(val) => dispatch({ type: 'SET_MODE', payload: val as FactorMode })}
              options={[
                { value: 'light', label: 'Light' },
                { value: 'co2', label: 'CO₂' },
                { value: 'temperature', label: 'Temp' },
              ]}
            />
            <SliderControl
              label="Light Intensity"
              value={light}
              unit="%"
              min={0}
              max={100}
              step={1}
              onChange={(v) => dispatch({ type: 'SET_LIGHT', payload: v })}
            />
            <SliderControl
              label="CO₂ Concentration"
              value={co2}
              unit="%"
              min={0}
              max={0.1}
              step={0.001}
              onChange={(v) => dispatch({ type: 'SET_CO2', payload: v })}
            />
            <SliderControl
              label="Temperature"
              value={temperature}
              unit="°C"
              min={0}
              max={45}
              step={0.5}
              onChange={(v) => dispatch({ type: 'SET_TEMPERATURE', payload: v })}
            />
            <div className="p-3 rounded-[var(--border-radius-apple)] bg-accent/10 border border-accent/20">
              <p className="text-sm font-semibold text-accent">Rate: {currentRate} au</p>
              <p className="text-xs text-text/60">Limiting Factor: <span className="font-medium text-text">{limitingFactor}</span></p>
            </div>
            <div className="flex flex-col gap-2 pt-4 border-t border-neutral-dark/30">
              <Button onClick={() => openExportModal(diagramContainerRef, 'photosynthesis-graph')}>
                <Save className="mr-2 h-4 w-4" /> Save & Export Image
              </Button>
              <SaveGraphButton diagramName="Photosynthesis Graph" getDiagramState={getDiagramState} />
            </div>
          </div>
        </Card>
      </div>
      <div className="md:col-span-2 min-h-[400px] md:min-h-0">
        <Card className="h-full !p-4" ref={diagramContainerRef} data-testid="diagram-container">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
              <XAxis
                dataKey="x"
                type="number"
                domain={mode === 'light' ? [0, 100] : mode === 'co2' ? [0, 0.1] : [0, 45]}
                stroke="var(--color-text)"
                label={{ value: xAxisLabel, position: 'insideBottom', offset: -10, fill: 'var(--color-text)' }}
              />
              <YAxis
                stroke="var(--color-text)"
                domain={[0, 110]}
                label={{ value: 'Rate of Photosynthesis (au)', angle: -90, position: 'insideLeft', fill: 'var(--color-text)' }}
              />
              <Tooltip
                formatter={(value: number) => `${value.toFixed(1)} au`}
                labelFormatter={(label: number) => `${mode === 'light' ? 'Light' : mode === 'co2' ? 'CO₂' : 'Temp'}: ${label}${mode === 'temperature' ? '°C' : mode === 'co2' ? '%' : '%'}`}
              />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ color: 'var(--color-text)' }} />
              <Line type="monotone" dataKey="rate" stroke="var(--color-accent)" strokeWidth={3} dot={false} name="Photosynthesis Rate" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}