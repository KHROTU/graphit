'use client';
import React, { useReducer, useMemo, useRef } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { useExportModal } from '@/lib/context/ExportModalContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { SliderControl } from '../controls/SliderControl';
import { DiagramToolbar } from '../DiagramToolbar';
import { DiagramErrorBoundary } from '../DiagramErrorBoundary';
interface OxygenCurveProps {
  initialPh?: number;
}
type State = { ph: number };
type Action = { type: 'SET_PH', payload: number };
const DEFAULT_STATE: State = { ph: 7.4 };
function reducer(state: State, action: Action): State {
    switch(action.type) {
        case 'SET_PH': return { ph: action.payload };
        default: return state;
    }
}
export default function OxygenDissociationCurve(props: OxygenCurveProps) {
  const initialState: State = { ph: props.initialPh || DEFAULT_STATE.ph };
  const [state, dispatch] = useReducer(reducer, initialState);
  const { ph } = state;
  const diagramContainerRef = useRef<HTMLDivElement>(null);
  const { openExportModal } = useExportModal();
  const data = useMemo(() => {
    const chartData: { 'pO2': number; 'Saturation': number }[] = [];
    const n = 2.8;
    const P50_ref = 3.5;
    const P50 = P50_ref * Math.pow(10, (7.4 - ph) * 0.5);
    for (let pO2 = 0; pO2 <= 14; pO2 += 0.2) {
      const saturation = 100 * (Math.pow(pO2, n) / (Math.pow(P50, n) + Math.pow(pO2, n)));
      chartData.push({ 'pO2': pO2, 'Saturation': saturation });
    }
    return chartData;
  }, [ph]);
  const getDiagramState = () => ({
    initialPh: ph,
  });
  const handleReset = () => {
    dispatch({ type: 'SET_PH', payload: DEFAULT_STATE.ph });
  };
  return (
    <DiagramErrorBoundary diagramName="Oxygen Dissociation Curve">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <Card>
            <CardHeader><CardTitle>Oxygen-Hemoglobin Curve</CardTitle></CardHeader>
            <div className="p-6 space-y-6">
              <div>
                <SliderControl label="Blood pH (Bohr Shift)" value={ph} min={7.0} max={7.6} step={0.05} onChange={(val) => dispatch({ type: 'SET_PH', payload: val })} />
                <p className="text-xs text-text/60 mt-2">
                  Lower pH (e.g., in respiring tissues) shifts the curve right, promoting oxygen release.
                </p>
              </div>
              <DiagramToolbar
                diagramName="Oxygen Dissociation Curve"
                getDiagramState={getDiagramState}
                onExport={() => openExportModal(diagramContainerRef, 'oxygen-dissociation-curve')}
                onReset={handleReset}
              />
            </div>
          </Card>
        </div>
        <div className="md:col-span-2 min-h-[500px]">
          <Card className="h-full !p-4" ref={diagramContainerRef} data-testid="diagram-container">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} stroke="var(--color-text)" />
                  <XAxis type="number" dataKey="pO2" domain={[0, 14]} stroke="var(--color-text)" label={{ value: 'Partial Pressure of Oxygen, pO\u2082 (kPa)', position: 'insideBottom', offset: -10, fill: 'var(--color-text)' }} />
                  <YAxis type="number" domain={[0, 100]} stroke="var(--color-text)" label={{ value: 'Hemoglobin Saturation (%)', angle: -90, position: 'insideLeft', fill: 'var(--color-text)' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'var(--color-surface)', 
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--border-radius-apple)',
                      color: 'var(--color-text)'
                    }} 
                  />
                  <Legend verticalAlign="top" wrapperStyle={{ color: 'var(--color-text)' }} />
                  <Line type="monotone" dataKey="Saturation" name={`Hb Saturation at pH ${ph.toFixed(2)}`} stroke="var(--color-accent)" strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
          </Card>
        </div>
      </div>
    </DiagramErrorBoundary>
  );
}