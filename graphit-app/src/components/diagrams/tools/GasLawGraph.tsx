'use client';
import React, { useReducer, useMemo, useRef } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { useExportModal } from '@/lib/context/ExportModalContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { SliderControl } from '../controls/SliderControl';
import { DiagramToolbar } from '../DiagramToolbar';
import { DiagramErrorBoundary } from '../DiagramErrorBoundary';
type State = { moles: number; volume: number; };
type Action = 
    | { type: 'SET_MOLES', payload: number }
    | { type: 'SET_VOLUME', payload: number };
function reducer(state: State, action: Action): State {
    switch(action.type) {
        case 'SET_MOLES': return { ...state, moles: action.payload };
        case 'SET_VOLUME': return { ...state, volume: action.payload };
        default: return state;
    }
}
const formatValue = (value: number | string) => {
  if (typeof value === 'number') return Number(value.toFixed(3));
  return value;
};
const R = 0.0821;
export default function GasLawGraph() {
  const initialState: State = { moles: 1, volume: 22.4 };
  const [state, dispatch] = useReducer(reducer, initialState);
  const { moles, volume } = state;
  const diagramContainerRef = useRef<HTMLDivElement>(null);
  const { openExportModal } = useExportModal();
  const data = useMemo(() => {
    const chartData: { temperature: number; pressure: number }[] = [];
    const slope = (moles * R) / volume;
    for (let tempK = 0; tempK <= 500; tempK += 25) {
      const pressure = slope * tempK;
      chartData.push({ temperature: tempK, pressure: pressure });
    }
    return chartData;
  }, [moles, volume]);
  const getDiagramState = () => ({
    moles,
    volume,
  });
  const handleReset = () => {
    dispatch({ type: 'SET_MOLES', payload: initialState.moles });
    dispatch({ type: 'SET_VOLUME', payload: initialState.volume });
  };
  return (
    <DiagramErrorBoundary diagramName="Gas Law Properties">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <Card>
            <CardHeader><CardTitle>Gas Parameters</CardTitle></CardHeader>
            <div className="p-6 space-y-6">
                <SliderControl label="Moles of Gas (n)" value={moles} min={0.1} max={5.0} step={0.1} onChange={(val) => dispatch({ type: 'SET_MOLES', payload: val })} />
                <SliderControl label="Volume (L)" value={volume} min={5} max={50} step={0.5} onChange={(val) => dispatch({ type: 'SET_VOLUME', payload: val })} />
                <DiagramToolbar 
                  diagramName="Gas Law Properties" 
                  getDiagramState={getDiagramState} 
                  onExport={() => openExportModal(diagramContainerRef, 'gas-law-graph')}
                  onReset={handleReset}
                />
            </div>
          </Card>
        </div>
        <div className="md:col-span-2 min-h-[400px]">
          <Card className="h-full !p-4" ref={diagramContainerRef} data-testid="diagram-container">
              <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                      <XAxis type="number" dataKey="temperature" domain={[0, 'dataMax']} stroke="var(--color-text)" label={{ value: 'Temperature (K)', position: 'insideBottom', offset: -10, fill: 'var(--color-text)' }} />
                      <YAxis type="number" domain={[0, 'dataMax']} stroke="var(--color-text)" label={{ value: 'Pressure (atm)', angle: -90, position: 'insideLeft', fill: 'var(--color-text)' }} />
                      <Tooltip formatter={formatValue} contentStyle={{ backgroundColor: 'var(--color-neutral)', border: '1px solid var(--color-neutral-dark)', borderRadius: 'var(--border-radius-apple)' }} />
                      <Legend verticalAlign="top" height={36} wrapperStyle={{ color: 'var(--color-text)' }} />
                      <Line type="monotone" dataKey="pressure" stroke="var(--color-accent)" strokeWidth={2} dot={false} name="Pressure vs. Temperature" />
                  </LineChart>
              </ResponsiveContainer>
          </Card>
        </div>
      </div>
    </DiagramErrorBoundary>
  );
}