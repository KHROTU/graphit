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
type FactorMode = 'humidity' | 'temperature' | 'wind' | 'light';
interface TranspirationGraphProps {
  initialMode?: FactorMode;
  initialHumidity?: number;
  initialTemperature?: number;
  initialWind?: number;
  initialLight?: number;
}
type State = {
  mode: FactorMode;
  humidity: number;
  temperature: number;
  wind: number;
  light: number;
};
type Action =
  | { type: 'SET_MODE'; payload: FactorMode }
  | { type: 'SET_HUMIDITY'; payload: number }
  | { type: 'SET_TEMPERATURE'; payload: number }
  | { type: 'SET_WIND'; payload: number }
  | { type: 'SET_LIGHT'; payload: number };
function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_MODE': return { ...state, mode: action.payload };
    case 'SET_HUMIDITY': return { ...state, humidity: action.payload };
    case 'SET_TEMPERATURE': return { ...state, temperature: action.payload };
    case 'SET_WIND': return { ...state, wind: action.payload };
    case 'SET_LIGHT': return { ...state, light: action.payload };
    default: return state;
  }
}
const calculateTranspirationRate = (humidity: number, temperature: number, wind: number, light: number): number => {
  const humidityFactor = Math.max(0, 1 - humidity / 100);
  const tempFactor = Math.max(0, (temperature - 5) / 35);
  const windFactor = Math.min(1, wind / 10) * 0.5 + 0.5;
  const lightFactor = Math.min(1, light / 100) * 0.7 + 0.3;
  return Math.round(humidityFactor * tempFactor * windFactor * lightFactor * 100);
};
export default function TranspirationGraph(props: TranspirationGraphProps) {
  const initialState: State = {
    mode: props.initialMode || 'humidity',
    humidity: props.initialHumidity ?? 60,
    temperature: props.initialTemperature ?? 25,
    wind: props.initialWind ?? 5,
    light: props.initialLight ?? 60,
  };
  const [state, dispatch] = useReducer(reducer, initialState);
  const { mode, humidity, temperature, wind, light } = state;
  const diagramContainerRef = useRef<HTMLDivElement>(null);
  const { openExportModal } = useExportModal();
  const currentRate = useMemo(
    () => calculateTranspirationRate(humidity, temperature, wind, light),
    [humidity, temperature, wind, light]
  );
  const data = useMemo(() => {
    const chartData: Array<{ x: number; rate: number }> = [];
    if (mode === 'humidity') {
      for (let h = 10; h <= 100; h += 2) {
        chartData.push({ x: h, rate: calculateTranspirationRate(h, temperature, wind, light) });
      }
    } else if (mode === 'temperature') {
      for (let t = 5; t <= 40; t += 0.5) {
        chartData.push({ x: t, rate: calculateTranspirationRate(humidity, t, wind, light) });
      }
    } else if (mode === 'wind') {
      for (let w = 0; w <= 15; w += 0.3) {
        chartData.push({ x: Number(w.toFixed(1)), rate: calculateTranspirationRate(humidity, temperature, w, light) });
      }
    } else {
      for (let l = 0; l <= 100; l += 2) {
        chartData.push({ x: l, rate: calculateTranspirationRate(humidity, temperature, wind, l) });
      }
    }
    return chartData;
  }, [mode, humidity, temperature, wind, light]);
  const xAxisLabel =
    mode === 'humidity' ? 'Relative Humidity (%)' :
    mode === 'temperature' ? 'Temperature (°C)' :
    mode === 'wind' ? 'Wind Speed (m/s)' :
    'Light Intensity (%)';
  const getDiagramState = () => ({
    initialMode: mode,
    initialHumidity: humidity,
    initialTemperature: temperature,
    initialWind: wind,
    initialLight: light,
  });
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-1">
        <Card>
          <CardHeader><CardTitle>Transpiration Rate</CardTitle></CardHeader>
          <div className="p-6 space-y-6">
            <SegmentControl
              value={mode}
              onValueChange={(val) => dispatch({ type: 'SET_MODE', payload: val as FactorMode })}
              options={[
                { value: 'humidity', label: 'Humidity' },
                { value: 'temperature', label: 'Temp' },
                { value: 'wind', label: 'Wind' },
                { value: 'light', label: 'Light' },
              ]}
            />
            <SliderControl
              label="Relative Humidity"
              value={humidity}
              unit="%"
              min={10}
              max={100}
              step={1}
              onChange={(v) => dispatch({ type: 'SET_HUMIDITY', payload: v })}
            />
            <SliderControl
              label="Temperature"
              value={temperature}
              unit="°C"
              min={5}
              max={40}
              step={0.5}
              onChange={(v) => dispatch({ type: 'SET_TEMPERATURE', payload: v })}
            />
            <SliderControl
              label="Wind Speed"
              value={wind}
              unit=" m/s"
              min={0}
              max={15}
              step={0.1}
              onChange={(v) => dispatch({ type: 'SET_WIND', payload: v })}
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
            <div className="p-3 rounded-[var(--border-radius-apple)] bg-accent/10 border border-accent/20">
              <p className="text-sm font-semibold text-accent">Transpiration Rate: {currentRate} au</p>
            </div>
            <div className="flex flex-col gap-2 pt-4 border-t border-neutral-dark/30">
              <Button onClick={() => openExportModal(diagramContainerRef, 'transpiration-graph')}>
                <Save className="mr-2 h-4 w-4" /> Save & Export Image
              </Button>
              <SaveGraphButton diagramName="Transpiration Graph" getDiagramState={getDiagramState} />
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
                stroke="var(--color-text)"
                label={{ value: xAxisLabel, position: 'insideBottom', offset: -10, fill: 'var(--color-text)' }}
              />
              <YAxis
                stroke="var(--color-text)"
                domain={[0, 110]}
                label={{ value: 'Transpiration Rate (au)', angle: -90, position: 'insideLeft', fill: 'var(--color-text)' }}
              />
              <Tooltip
                formatter={(value: number) => `${value.toFixed(1)} au`}
                labelFormatter={(label: number) => `${mode}: ${label}`}
              />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ color: 'var(--color-text)' }} />
              <Line type="monotone" dataKey="rate" stroke="var(--color-accent)" strokeWidth={3} dot={false} name="Transpiration Rate" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}