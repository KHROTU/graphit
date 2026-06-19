'use client';
import React, { useReducer, useMemo, useRef } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Save } from 'lucide-react';
import { useExportModal } from '@/lib/context/ExportModalContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import SaveGraphButton from '@/components/shared/SaveGraphButton';
import { SliderControl } from '../controls/SliderControl';
interface PopulationGrowthGraphProps {
  initialCarryingCapacity?: number;
  initialGrowthRate?: number;
  initialPopulation?: number;
}
type State = {
  carryingCapacity: number;
  growthRate: number;
  initialPop: number;
};
type Action =
  | { type: 'SET_CARRYING_CAPACITY'; payload: number }
  | { type: 'SET_GROWTH_RATE'; payload: number }
  | { type: 'SET_INITIAL_POP'; payload: number };
function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_CARRYING_CAPACITY': return { ...state, carryingCapacity: action.payload };
    case 'SET_GROWTH_RATE': return { ...state, growthRate: action.payload };
    case 'SET_INITIAL_POP': return { ...state, initialPop: action.payload };
    default: return state;
  }
}
const PHASES: { label: string; start: number; end: number; color: string }[] = [
  { label: 'Lag Phase', start: 0, end: 0.25, color: 'var(--color-secondary)' },
  { label: 'Log Phase', start: 0.25, end: 0.65, color: 'var(--color-accent)' },
  { label: 'Stationary Phase', start: 0.65, end: 1, color: 'var(--color-warning, #f59e0b)' },
];
export default function PopulationGrowthGraph(props: PopulationGrowthGraphProps) {
  const initialState: State = {
    carryingCapacity: props.initialCarryingCapacity ?? 1000,
    growthRate: props.initialGrowthRate ?? 0.3,
    initialPop: props.initialPopulation ?? 10,
  };
  const [state, dispatch] = useReducer(reducer, initialState);
  const { carryingCapacity, growthRate, initialPop } = state;
  const diagramContainerRef = useRef<HTMLDivElement>(null);
  const { openExportModal } = useExportModal();
  const data = useMemo(() => {
    const tMax = 40;
    const dt = 0.2;
    const N: number[] = [initialPop];
    for (let i = 0; i < tMax / dt; i++) {
      const prev = N[N.length - 1];
      const dN = growthRate * prev * (1 - prev / carryingCapacity);
      N.push(prev + dN * dt);
    }
    return N.map((n, i) => ({
      time: Number((i * dt).toFixed(1)),
      population: Math.round(n),
    }));
  }, [carryingCapacity, growthRate, initialPop]);
  const totalDuration = data.length > 0 ? data[data.length - 1].time : 40;
  const phaseBoundaries = [
    totalDuration * 0.25,
    totalDuration * 0.65,
  ];
  const getDiagramState = () => ({
    initialCarryingCapacity: carryingCapacity,
    initialGrowthRate: growthRate,
    initialPopulation: initialPop,
  });
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-1">
        <Card>
          <CardHeader><CardTitle>Sigmoid Growth Curve</CardTitle></CardHeader>
          <div className="p-6 space-y-6">
            <SliderControl
              label="Carrying Capacity (K)"
              value={carryingCapacity}
              unit=""
              min={100}
              max={5000}
              step={10}
              onChange={(v) => dispatch({ type: 'SET_CARRYING_CAPACITY', payload: v })}
            />
            <SliderControl
              label="Growth Rate (r)"
              value={growthRate}
              unit=""
              min={0.05}
              max={1.5}
              step={0.05}
              onChange={(v) => dispatch({ type: 'SET_GROWTH_RATE', payload: v })}
            />
            <SliderControl
              label="Initial Population (N₀)"
              value={initialPop}
              unit=""
              min={1}
              max={carryingCapacity * 0.5}
              step={1}
              onChange={(v) => dispatch({ type: 'SET_INITIAL_POP', payload: v })}
            />
            <div className="space-y-2 p-3 rounded-[var(--border-radius-apple)] bg-neutral/30">
              <p className="text-xs font-semibold text-text">Growth Phases</p>
              {PHASES.map((phase) => (
                <div key={phase.label} className="flex items-center gap-2 text-xs">
                  <span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: phase.color }} />
                  <span className="text-text/70">{phase.label}</span>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-2 pt-4 border-t border-neutral-dark/30">
              <Button onClick={() => openExportModal(diagramContainerRef, 'population-growth-graph')}>
                <Save className="mr-2 h-4 w-4" /> Save & Export Image
              </Button>
              <SaveGraphButton diagramName="Population Growth Graph" getDiagramState={getDiagramState} />
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
                dataKey="time"
                type="number"
                domain={[0, totalDuration]}
                stroke="var(--color-text)"
                label={{ value: 'Time (generations)', position: 'insideBottom', offset: -10, fill: 'var(--color-text)' }}
              />
              <YAxis
                stroke="var(--color-text)"
                domain={[0, Math.ceil(carryingCapacity * 1.15)]}
                label={{ value: 'Population Size', angle: -90, position: 'insideLeft', fill: 'var(--color-text)' }}
              />
              <Tooltip
                formatter={(value: number) => value.toLocaleString()}
                labelFormatter={(label: number) => `Time: ${label}`}
              />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ color: 'var(--color-text)' }} />
              <ReferenceLine y={carryingCapacity} stroke="var(--color-text)" strokeOpacity={0.4} strokeDasharray="6 6" label={{ value: `K = ${carryingCapacity}`, position: 'right', fill: 'var(--color-text)', fontSize: 12 }} />
              {phaseBoundaries.map((x, i) => (
                <ReferenceLine key={i} x={x} stroke={PHASES[i + 1].color} strokeOpacity={0.3} strokeDasharray="4 4" />
              ))}
              <Line type="monotone" dataKey="population" stroke="var(--color-accent)" strokeWidth={3} dot={false} name="Population Size" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}