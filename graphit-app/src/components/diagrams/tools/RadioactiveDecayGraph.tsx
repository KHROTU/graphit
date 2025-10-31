'use client';

import React, { useReducer, useMemo, useRef } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Label } from '@/components/ui/Label';
import { Button } from '@/components/ui/Button';
import { Save } from 'lucide-react';
import { useExportModal } from '@/lib/context/ExportModalContext';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceDot } from 'recharts';
import { useSession } from '@/lib/hooks/useSession';
import SaveGraphButton from '@/components/shared/SaveGraphButton';

interface DecayProps {
  initialInitialNuclei?: number;
  initialHalfLife?: number;
}

type State = { initialNuclei: number; halfLife: number; };
type Action = 
    | { type: 'SET_NUCLEI', payload: number }
    | { type: 'SET_HALF_LIFE', payload: number };

function reducer(state: State, action: Action): State {
    switch(action.type) {
        case 'SET_NUCLEI': return { ...state, initialNuclei: action.payload };
        case 'SET_HALF_LIFE': return { ...state, halfLife: action.payload };
        default: return state;
    }
}

const formatValue = (value: unknown): React.ReactNode => {
  if (typeof value === 'number') return Number(value.toFixed(2));
  return String(value);
};

export default function RadioactiveDecayGraph(props: DecayProps) {
  const initialState: State = {
      initialNuclei: props.initialInitialNuclei || 1000,
      halfLife: props.initialHalfLife || 10,
  };
  const [state, dispatch] = useReducer(reducer, initialState);
  const { initialNuclei, halfLife } = state;

  const diagramContainerRef = useRef<HTMLDivElement>(null);
  const { openExportModal } = useExportModal();
  const { session } = useSession();

  const { data, halfLifePoints } = useMemo(() => {
    const decayConstant = Math.log(2) / halfLife;
    const chartData = []; const points = []; const maxTime = halfLife * 5;
    for (let t = 0; t <= maxTime; t += 0.5) {
      chartData.push({ time: t, nuclei: initialNuclei * Math.exp(-decayConstant * t) });
    }
    for (let i = 0; i <= 5; i++) {
        points.push({ time: i * halfLife, nuclei: initialNuclei / Math.pow(2, i), label: `HL ${i}` });
    }
    return { data: chartData, halfLifePoints: points };
  }, [initialNuclei, halfLife]);

  const getDiagramState = () => ({
    initialInitialNuclei: initialNuclei,
    initialHalfLife: halfLife,
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-1">
        <Card>
          <CardHeader><CardTitle>Decay Parameters</CardTitle></CardHeader>
          <div className="p-6 space-y-6">
              <div><Label>Initial Nuclei (N₀): {initialNuclei}</Label><input type="range" min="100" max="10000" step="100" value={initialNuclei} onChange={(e) => dispatch({ type: 'SET_NUCLEI', payload: Number(e.target.value)})} className="w-full mt-2" /></div>
              <div><Label>Half-Life (s): {halfLife}</Label><input type="range" min="1" max="50" step="1" value={halfLife} onChange={(e) => dispatch({ type: 'SET_HALF_LIFE', payload: Number(e.target.value) })} className="w-full mt-2" /></div>
              <div className="flex flex-col gap-2 pt-4 border-t border-neutral-dark/30">
                <Button onClick={() => openExportModal(diagramContainerRef, 'radioactive-decay')}>
                    <Save className="mr-2 h-4 w-4" /> Save & Export Image
                </Button>
                {session?.isLoggedIn && (
                  <SaveGraphButton diagramName="Radioactive Decay Simulator" getDiagramState={getDiagramState} />
                )}
              </div>
          </div>
        </Card>
      </div>
      <div className="md:col-span-2 min-h-[400px]">
        <Card className="h-full !p-4" ref={diagramContainerRef} data-testid="diagram-container">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                    <XAxis type="number" dataKey="time" domain={[0, 'dataMax']} stroke="var(--color-text)" label={{ value: 'Time (s)', position: 'insideBottom', offset: -10, fill: 'var(--color-text)' }} />
                    <YAxis type="number" domain={[0, 'dataMax']} stroke="var(--color-text)" label={{ value: 'Number of Nuclei (N)', angle: -90, position: 'insideLeft', fill: 'var(--color-text)' }} />
                    <Tooltip formatter={formatValue} contentStyle={{ backgroundColor: 'var(--color-neutral)', border: '1px solid var(--color-neutral-dark)', borderRadius: 'var(--border-radius-apple)' }} />
                    <Legend verticalAlign="top" height={36} wrapperStyle={{ color: 'var(--color-text)' }} />
                    <Area type="monotone" dataKey="nuclei" stroke="var(--color-accent)" fill="var(--color-accent)" fillOpacity={0.2} strokeWidth={2} name="Remaining Nuclei" />
                    {halfLifePoints.map(p => <ReferenceDot key={p.time} x={p.time} y={p.nuclei} r={5} fill="var(--color-secondary)" stroke="white" ifOverflow="extendDomain" />)}
                </AreaChart>
            </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}