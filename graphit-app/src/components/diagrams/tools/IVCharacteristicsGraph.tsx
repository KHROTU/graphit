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
type ComponentType = 'ohmic' | 'filament' | 'diode';
interface IVCharacteristicsProps {
  initialType?: ComponentType;
  initialVoltageRange?: number;
  initialResistance?: number;
}
type State = {
  type: ComponentType;
  voltageRange: number;
  resistance: number;
};
type Action =
  | { type: 'SET_TYPE'; payload: ComponentType }
  | { type: 'SET_VOLTAGE_RANGE'; payload: number }
  | { type: 'SET_RESISTANCE'; payload: number };
function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_TYPE': return { ...state, type: action.payload };
    case 'SET_VOLTAGE_RANGE': return { ...state, voltageRange: action.payload };
    case 'SET_RESISTANCE': return { ...state, resistance: action.payload };
    default: return state;
  }
}
const formatValue = (value: unknown): React.ReactNode => {
  if (typeof value === 'number') return Number(value.toFixed(3));
  return String(value);
};
const componentTypeOptions = [
  { value: 'ohmic' as const, label: 'Ohmic Conductor' },
  { value: 'filament' as const, label: 'Filament Lamp' },
  { value: 'diode' as const, label: 'Diode' },
];
export default function IVCharacteristicsGraph(props: IVCharacteristicsProps) {
  const initialState: State = {
    type: props.initialType || 'ohmic',
    voltageRange: props.initialVoltageRange || 10,
    resistance: props.initialResistance || 100,
  };
  const [state, dispatch] = useReducer(reducer, initialState);
  const { type, voltageRange, resistance } = state;
  const diagramContainerRef = useRef<HTMLDivElement>(null);
  const { openExportModal } = useExportModal();
  const data = useMemo(() => {
    const chartData: { voltage: number; current: number }[] = [];
    const step = voltageRange / 200;
    for (let v = -voltageRange; v <= voltageRange; v += step) {
      let current = 0;
      if (type === 'ohmic') {
        current = v / resistance;
      } else if (type === 'filament') {
        const tempR = resistance * (1 + 0.005 * Math.abs(v) * 10);
        current = v / Math.max(tempR, 0.1);
        current = Math.max(Math.min(current, 0.5), -0.5);
      } else if (type === 'diode') {
        if (v > 0.7) {
          current = (v - 0.7) / 10;
        } else if (v < -0.7) {
          current = -0.001;
        } else {
          current = 0;
        }
      }
      chartData.push({ voltage: Number(v.toFixed(2)), current: Number(current.toFixed(5)) });
    }
    return chartData;
  }, [type, voltageRange, resistance]);
  const getDiagramState = () => ({
    initialType: type,
    initialVoltageRange: voltageRange,
    initialResistance: resistance,
  });
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-1">
        <Card>
          <CardHeader><CardTitle>I-V Characteristics</CardTitle></CardHeader>
          <div className="p-6 space-y-6">
            <SegmentControl
              value={type}
              onValueChange={(val) => dispatch({ type: 'SET_TYPE', payload: val })}
              options={componentTypeOptions}
            />
            <SliderControl
              label="Voltage Range"
              value={voltageRange}
              unit=" V"
              min={1}
              max={30}
              step={1}
              onChange={(val) => dispatch({ type: 'SET_VOLTAGE_RANGE', payload: val })}
            />
            {type === 'ohmic' && (
              <SliderControl
                label="Resistance"
                value={resistance}
                unit=" Ω"
                min={1}
                max={1000}
                step={1}
                onChange={(val) => dispatch({ type: 'SET_RESISTANCE', payload: val })}
              />
            )}
            {type === 'filament' && (
              <SliderControl
                label="Cold Resistance"
                value={resistance}
                unit=" Ω"
                min={1}
                max={500}
                step={1}
                onChange={(val) => dispatch({ type: 'SET_RESISTANCE', payload: val })}
              />
            )}
            <div className="text-sm border-t border-neutral-dark/50 pt-4">
              <h4 className="font-semibold mb-2">Component Behavior</h4>
              <p className="text-text/70">
                {type === 'ohmic' && 'Linear relationship: I ∝ V (Ohm\'s Law)'}
                {type === 'filament' && 'Non-linear: resistance increases with temperature as filament heats up'}
                {type === 'diode' && 'Rectifying: conducts in forward bias above ~0.7V threshold'}
              </p>
            </div>
            <div className="flex flex-col gap-2 pt-4 border-t border-neutral-dark/30">
              <Button onClick={() => openExportModal(diagramContainerRef, 'iv-characteristics-graph')}>
                <Save className="mr-2 h-4 w-4" /> Save & Export Image
              </Button>
              <SaveGraphButton diagramName="I-V Characteristics" getDiagramState={getDiagramState} />
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
                dataKey="voltage"
                domain={[-voltageRange, voltageRange]}
                stroke="var(--color-text)"
                label={{ value: 'Voltage (V)', position: 'insideBottom', offset: -10, fill: 'var(--color-text)' }}
              />
              <YAxis
                type="number"
                stroke="var(--color-text)"
                label={{ value: 'Current (A)', angle: -90, position: 'insideLeft', fill: 'var(--color-text)' }}
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
                dataKey="current"
                stroke="var(--color-accent)"
                strokeWidth={2}
                dot={false}
                name={
                  type === 'ohmic' ? 'Ohmic Conductor' :
                  type === 'filament' ? 'Filament Lamp' : 'Diode'
                }
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}