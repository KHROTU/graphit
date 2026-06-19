'use client';
import React, { useReducer, useMemo, useRef } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { useExportModal } from '@/lib/context/ExportModalContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { SliderControl } from '../controls/SliderControl';
import { DiagramToolbar } from '../DiagramToolbar';
import { DiagramErrorBoundary } from '../DiagramErrorBoundary';
interface EnzymeKineticsProps {
  initialVmax?: number;
  initialKm?: number;
  initialInhibitor?: number;
}
type State = { vmax: number; km: number; inhibitor: number; };
type Action = 
    | { type: 'SET_VMAX', payload: number }
    | { type: 'SET_KM', payload: number }
    | { type: 'SET_INHIBITOR', payload: number };
const DEFAULT_STATE: State = { vmax: 100, km: 20, inhibitor: 0 };
function reducer(state: State, action: Action): State {
    switch(action.type) {
        case 'SET_VMAX': return { ...state, vmax: action.payload };
        case 'SET_KM': return { ...state, km: action.payload };
        case 'SET_INHIBITOR': return { ...state, inhibitor: action.payload };
        default: return state;
    }
}
export default function EnzymeKineticsGraph(props: EnzymeKineticsProps) {
  const initialState: State = {
      vmax: props.initialVmax || DEFAULT_STATE.vmax,
      km: props.initialKm || DEFAULT_STATE.km,
      inhibitor: props.initialInhibitor || DEFAULT_STATE.inhibitor,
  };
  const [state, dispatch] = useReducer(reducer, initialState);
  const { vmax, km, inhibitor } = state;
  const diagramContainerRef = useRef<HTMLDivElement>(null);
  const { openExportModal } = useExportModal();
  const data = useMemo(() => {
    const chartData: Record<string, number | null>[] = [];
    const apparentKm = km * (1 + inhibitor / 20);
    for (let s = 0; s <= 100; s += 2) {
      const rate = (vmax * s) / (km + s);
      const inhibitedRate = (vmax * s) / (apparentKm + s);
      chartData.push({
        'Substrate [S]': s,
        'Reaction Rate': rate,
        'Inhibited Rate': inhibitor > 0 ? inhibitedRate : null,
      });
    }
    return chartData;
  }, [vmax, km, inhibitor]);
  const getDiagramState = () => ({
    initialVmax: vmax,
    initialKm: km,
    initialInhibitor: inhibitor,
  });
  const handleReset = () => {
    dispatch({ type: 'SET_VMAX', payload: DEFAULT_STATE.vmax });
    dispatch({ type: 'SET_KM', payload: DEFAULT_STATE.km });
    dispatch({ type: 'SET_INHIBITOR', payload: DEFAULT_STATE.inhibitor });
  };
  return (
    <DiagramErrorBoundary diagramName="Enzyme Kinetics Graph">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <Card>
            <CardHeader><CardTitle>Enzyme Kinetics (Michaelis-Menten)</CardTitle></CardHeader>
            <div className="p-6 space-y-6">
              <SliderControl label="Max Rate (Vmax)" value={vmax} min={20} max={200} onChange={(val) => dispatch({ type: 'SET_VMAX', payload: val })} />
              <SliderControl label="Michaelis Constant (Km)" value={km} min={5} max={80} onChange={(val) => dispatch({ type: 'SET_KM', payload: val })} />
              <SliderControl label="Competitive Inhibitor [I]" value={inhibitor} min={0} max={100} onChange={(val) => dispatch({ type: 'SET_INHIBITOR', payload: val })} />
              <DiagramToolbar
                diagramName="Enzyme Kinetics Graph"
                getDiagramState={getDiagramState}
                onExport={() => openExportModal(diagramContainerRef, 'enzyme-kinetics-graph')}
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
                  <XAxis type="number" dataKey="Substrate [S]" stroke="var(--color-text)" label={{ value: 'Substrate Concentration [S]', position: 'insideBottom', offset: -10, fill: 'var(--color-text)' }} />
                  <YAxis type="number" domain={[0, 'dataMax + 10']} stroke="var(--color-text)" label={{ value: 'Reaction Rate (v)', angle: -90, position: 'insideLeft', fill: 'var(--color-text)' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'var(--color-surface)', 
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--border-radius-apple)',
                      color: 'var(--color-text)'
                    }} 
                  />
                  <Legend verticalAlign="top" wrapperStyle={{ color: 'var(--color-text)' }} />
                  <Line type="monotone" dataKey="Reaction Rate" stroke="var(--color-accent)" strokeWidth={2} dot={false} />
                  {inhibitor > 0 && <Line type="monotone" dataKey="Inhibited Rate" name="With Inhibitor" stroke="var(--color-secondary)" strokeWidth={2} dot={false} strokeDasharray="5 5" />}
                </LineChart>
              </ResponsiveContainer>
          </Card>
        </div>
      </div>
    </DiagramErrorBoundary>
  );
}