'use client';
import React, { useReducer, useMemo, useRef } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { useExportModal } from '@/lib/context/ExportModalContext';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { SliderControl } from '../controls/SliderControl';
import { SegmentControl } from '../controls/SegmentControl';
import { DiagramToolbar } from '../DiagramToolbar';
import { DiagramErrorBoundary } from '../DiagramErrorBoundary';
type Tab = 'rate' | 'boltzmann';
interface KineticsGraphProps {
  initialTab?: Tab; initialConc?: number; initialRateConstant?: number;
  initialTemp?: number; initialEa?: number;
}
type State = {
    activeTab: Tab; conc: number; rateConstant: number; temp: number; ea: number;
};
type Action = 
    | { type: 'SET_TAB', payload: Tab }
    | { type: 'SET_CONC', payload: number }
    | { type: 'SET_RATE_CONSTANT', payload: number }
    | { type: 'SET_TEMP', payload: number }
    | { type: 'SET_EA', payload: number };
function reducer(state: State, action: Action): State {
    switch(action.type) {
        case 'SET_TAB': return { ...state, activeTab: action.payload };
        case 'SET_CONC': return { ...state, conc: action.payload };
        case 'SET_RATE_CONSTANT': return { ...state, rateConstant: action.payload };
        case 'SET_TEMP': return { ...state, temp: action.payload };
        case 'SET_EA': return { ...state, ea: action.payload };
        default: return state;
    }
}
const formatValue = (value: number | string) => {
  if (typeof value === 'number') return Number(value.toFixed(3));
  return value;
};
const tabOptions: { value: Tab; label: string }[] = [
  { value: 'rate', label: 'Reaction Rate' },
  { value: 'boltzmann', label: 'Boltzmann Curve' },
];
export default function KineticsGraph(props: KineticsGraphProps) {
  const initialState: State = {
      activeTab: props.initialTab || 'rate',
      conc: props.initialConc || 1.0,
      rateConstant: props.initialRateConstant || 0.1,
      temp: props.initialTemp || 300,
      ea: props.initialEa || 40,
  };
  const [state, dispatch] = useReducer(reducer, initialState);
  const { activeTab, conc, rateConstant, temp, ea } = state;
  const diagramContainerRef = useRef<HTMLDivElement>(null);
  const { openExportModal } = useExportModal();
  const rateData = useMemo(() => (
    Array.from({ length: 101 }, (_, i) => ({
      time: i * 0.5,
      concentration: conc * Math.exp(-rateConstant * (i * 0.5)),
    }))
  ), [conc, rateConstant]);
  const boltzmannData = useMemo(() => {
    const T = temp / 50;
    return Array.from({ length: 101 }, (_, i) => {
      const energy = i;
      const val = (energy / (T * T)) * Math.exp(-energy / T);
      return { energy, molecules: val > 0 ? val : 0 };
    });
  }, [temp]);
  const getDiagramState = () => ({
    initialTab: activeTab, initialConc: conc, initialRateConstant: rateConstant,
    initialTemp: temp, initialEa: ea,
  });
  const handleReset = () => {
    dispatch({ type: 'SET_TAB', payload: initialState.activeTab });
    dispatch({ type: 'SET_CONC', payload: initialState.conc });
    dispatch({ type: 'SET_RATE_CONSTANT', payload: initialState.rateConstant });
    dispatch({ type: 'SET_TEMP', payload: initialState.temp });
    dispatch({ type: 'SET_EA', payload: initialState.ea });
  };
  return (
    <DiagramErrorBoundary diagramName="Reaction Kinetics Simulator">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <Card>
            <CardHeader><CardTitle>Kinetics Simulator</CardTitle></CardHeader>
            <div className="p-4 border-b border-neutral-dark/30">
              <SegmentControl
                value={activeTab}
                onValueChange={(val) => dispatch({type: 'SET_TAB', payload: val})}
                options={tabOptions}
              />
            </div>
            {activeTab === 'rate' ? (
              <div className="p-6 space-y-6">
                <SliderControl label="Initial Concentration (M)" value={conc} min={0.1} max={2.0} step={0.1} onChange={(val) => dispatch({type: 'SET_CONC', payload: val})} />
                <SliderControl label="Rate Constant (k)" value={rateConstant} min={0.01} max={0.5} step={0.01} onChange={(val) => dispatch({type: 'SET_RATE_CONSTANT', payload: val})} />
              </div>
            ) : (
              <div className="p-6 space-y-6">
                <SliderControl label="Temperature" value={temp} min={100} max={1000} step={25} unit="K" onChange={(val) => dispatch({type: 'SET_TEMP', payload: val})} />
                <SliderControl label="Activation Energy (Ea)" value={ea} min={10} max={90} step={5} onChange={(val) => dispatch({type: 'SET_EA', payload: val})} />
              </div>
            )}
            <div className="p-4 border-t border-neutral-dark/30">
              <DiagramToolbar
                diagramName="Reaction Kinetics Simulator"
                getDiagramState={getDiagramState}
                onExport={() => openExportModal(diagramContainerRef, 'kinetics-graph')}
                onReset={handleReset}
              />
            </div>
          </Card>
        </div>
        <div className="md:col-span-2 min-h-[500px]">
          <Card className="h-full !p-4" ref={diagramContainerRef} data-testid="diagram-container">
            {activeTab === 'rate' ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={rateData} margin={{ top: 5, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                  <XAxis type="number" dataKey="time" domain={[0, 50]} stroke="var(--color-text)" label={{ value: 'Time (s)', position: 'insideBottom', offset: -10, fill: 'var(--color-text)' }} />
                  <YAxis type="number" domain={[0, 'dataMax']} stroke="var(--color-text)" label={{ value: 'Concentration (M)', angle: -90, position: 'insideLeft', fill: 'var(--color-text)' }} />
                  <Tooltip formatter={formatValue} contentStyle={{ backgroundColor: 'var(--color-neutral)', border: '1px solid var(--color-neutral-dark)', borderRadius: 'var(--border-radius-apple)' }} />
                  <Legend verticalAlign="top" height={36} wrapperStyle={{ color: 'var(--color-text)' }} />
                  <Line type="monotone" dataKey="concentration" stroke="var(--color-accent)" strokeWidth={2} dot={false} name="Reactant Concentration" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={boltzmannData} margin={{ top: 5, right: 20, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                  <XAxis type="number" dataKey="energy" domain={[0, 100]} stroke="var(--color-text)" label={{ value: 'Kinetic Energy', position: 'insideBottom', offset: -10, fill: 'var(--color-text)' }} />
                  <YAxis stroke="var(--color-text)" label={{ value: 'Number of Molecules', angle: -90, position: 'insideLeft', fill: 'var(--color-text)' }} tick={false} />
                  <Tooltip formatter={formatValue} contentStyle={{ backgroundColor: 'var(--color-neutral)', border: '1px solid var(--color-neutral-dark)', borderRadius: 'var(--border-radius-apple)' }} />
                  <Legend verticalAlign="top" height={36} wrapperStyle={{ color: 'var(--color-text)' }} />
                  <defs>
                    <linearGradient id="splitColor" x1="0" y1="0" x2="1" y2="0">
                        <stop offset={`${ea}%`} stopColor="var(--color-accent)" stopOpacity={0.4}/>
                        <stop offset={`${ea}%`} stopColor="var(--color-secondary)" stopOpacity={0.5}/>
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="molecules" stroke="var(--color-accent)" fill="url(#splitColor)" name="Distribution" />
                  <ReferenceLine x={ea} stroke="var(--color-secondary)" strokeWidth={2} strokeDasharray="3 3" label={{ value: 'Ea', position: 'insideTopRight', fill: 'var(--color-secondary)' }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </Card>
        </div>
      </div>
    </DiagramErrorBoundary>
  );
}