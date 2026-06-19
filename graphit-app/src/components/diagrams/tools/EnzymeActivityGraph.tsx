'use client';
import React, { useReducer, useMemo, useRef } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { useExportModal } from '@/lib/context/ExportModalContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { SegmentControl } from '../controls/SegmentControl';
import { SliderControl } from '../controls/SliderControl';
import { DiagramToolbar } from '../DiagramToolbar';
import { DiagramErrorBoundary } from '../DiagramErrorBoundary';
interface EnzymeActivityProps {
  initialType?: 'temperature' | 'ph';
  initialOptimum?: number;
}
type State = { type: 'temperature' | 'ph'; optimum: number; };
type Action = 
    | { type: 'SET_TYPE', payload: 'temperature' | 'ph' }
    | { type: 'SET_OPTIMUM', payload: number };
const DEFAULT_STATE: State = { type: 'temperature', optimum: 37 };
function reducer(state: State, action: Action): State {
    switch(action.type) {
        case 'SET_TYPE': 
            const defaultOptimum = action.payload === 'temperature' ? 37 : 7;
            return { ...state, type: action.payload, optimum: defaultOptimum };
        case 'SET_OPTIMUM': return { ...state, optimum: action.payload };
        default: return state;
    }
}
export default function EnzymeActivityGraph(props: EnzymeActivityProps) {
  const initialState: State = {
      type: props.initialType || DEFAULT_STATE.type,
      optimum: props.initialOptimum || DEFAULT_STATE.optimum,
  };
  const [state, dispatch] = useReducer(reducer, initialState);
  const { type, optimum } = state;
  const diagramContainerRef = useRef<HTMLDivElement>(null);
  const { openExportModal } = useExportModal();
  const data = useMemo(() => {
    const chartData: { x: number; rate: number }[] = [];
    if (type === 'temperature') {
        for (let t = 0; t <= 70; t+=1) {
            let rate = 0;
            if (t <= optimum) {
                rate = 100 * Math.pow(2, (t - optimum) / 10);
            } else {
                const dropOff = 100 - ((t - optimum) * 15); 
                rate = Math.max(0, dropOff);
            }
            chartData.push({ x: t, rate: Math.max(0, rate) });
        }
    } else {
        for (let ph = 0; ph <= 14; ph+=0.2) {
            const sigma = 1.5;
            const rate = 100 * Math.exp(-Math.pow(ph - optimum, 2) / (2 * Math.pow(sigma, 2)));
            chartData.push({ x: ph, rate: rate > 1 ? rate : 0 });
        }
    }
    return chartData;
  }, [type, optimum]);
  const getDiagramState = () => ({
    initialType: type,
    initialOptimum: optimum,
  });
  const handleReset = () => {
    dispatch({ type: 'SET_TYPE', payload: DEFAULT_STATE.type });
    dispatch({ type: 'SET_OPTIMUM', payload: DEFAULT_STATE.optimum });
  };
  return (
    <DiagramErrorBoundary diagramName="Enzyme Activity Graph">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <Card>
            <CardHeader><CardTitle>Enzyme Activity Factors</CardTitle></CardHeader>
            <div className="p-6 space-y-6">
                <SegmentControl 
                  value={type}
                  onValueChange={(val) => dispatch({ type: 'SET_TYPE', payload: val })}
                  options={[
                      { value: 'temperature', label: 'Temperature' },
                      { value: 'ph', label: 'pH Level' }
                  ]}
                />
                <SliderControl
                  label={type === 'temperature' ? 'Optimum Temperature' : 'Optimum pH'}
                  unit={type === 'temperature' ? '°C' : ''}
                  value={optimum}
                  min={type === 'temperature' ? 20 : 1}
                  max={type === 'temperature' ? 60 : 13}
                  step={type === 'temperature' ? 1 : 0.5}
                  onChange={(val) => dispatch({type: 'SET_OPTIMUM', payload: val})}
                />
                <DiagramToolbar
                  diagramName="Enzyme Activity Graph"
                  getDiagramState={getDiagramState}
                  onExport={() => openExportModal(diagramContainerRef, 'enzyme-activity-graph')}
                  onReset={handleReset}
                />
            </div>
          </Card>
        </div>
        <div className="md:col-span-2 min-h-[400px] md:min-h-0">
          <Card className="h-full !p-4" ref={diagramContainerRef} data-testid="diagram-container">
              <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} stroke="var(--color-text)" />
                      <XAxis 
                          dataKey="x" 
                          type="number" 
                          domain={type === 'temperature' ? [0, 70] : [0, 14]} 
                          stroke="var(--color-text)" 
                          label={{ 
                              value: type === 'temperature' ? 'Temperature (°C)' : 'pH', 
                              position: 'insideBottom', 
                              offset: -10, 
                              fill: 'var(--color-text)' 
                          }} 
                      />
                      <YAxis 
                          stroke="var(--color-text)" 
                          domain={[0, 110]} 
                          label={{ value: 'Rate of Reaction', angle: -90, position: 'insideLeft', fill: 'var(--color-text)' }} 
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'var(--color-surface)', 
                          border: '1px solid var(--color-border)',
                          borderRadius: 'var(--border-radius-apple)',
                          color: 'var(--color-text)'
                        }} 
                      />
                      <Legend verticalAlign="top" height={36} wrapperStyle={{ color: 'var(--color-text)' }} />
                      <Line type="monotone" dataKey="rate" stroke="var(--color-accent)" strokeWidth={3} dot={false} name="Enzyme Activity" />
                  </LineChart>
              </ResponsiveContainer>
          </Card>
        </div>
      </div>
    </DiagramErrorBoundary>
  );
}