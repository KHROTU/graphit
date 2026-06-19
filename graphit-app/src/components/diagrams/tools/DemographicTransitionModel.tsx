'use client';
import React, { useReducer, useMemo, useRef } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Label } from '@/components/ui/Label';
import { Button } from '@/components/ui/Button';
import { Save } from 'lucide-react';
import { useExportModal } from '@/lib/context/ExportModalContext';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import SaveGraphButton from '@/components/shared/SaveGraphButton';
interface DemographicTransitionModelProps {
  initialStage?: number;
}
type State = {
  stage: number;
};
type Action = { type: 'SET_STAGE'; payload: number };
function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_STAGE': return { ...state, stage: action.payload };
    default: return state;
  }
}
const STAGE_LABELS: Record<number, { name: string; desc: string }> = {
  1: { name: 'High Stationary', desc: 'High birth & death rates, low population growth (pre-industrial)' },
  2: { name: 'Early Expanding', desc: 'Death rate falls, birth rate stays high, rapid population increase' },
  3: { name: 'Late Expanding', desc: 'Birth rate declines, death rate low, growth slows' },
  4: { name: 'Low Stationary', desc: 'Low birth & death rates, stable or slow population growth' },
  5: { name: 'Declining', desc: 'Birth rate falls below death rate, population may decrease' },
};
const DTM_MODEL: Record<number, { CBR: number; CDR: number; pop: number }> = {
  1: { CBR: 38, CDR: 36, pop: 100 },
  2: { CBR: 38, CDR: 22, pop: 350 },
  3: { CBR: 22, CDR: 9, pop: 750 },
  4: { CBR: 11, CDR: 10, pop: 950 },
  5: { CBR: 9, CDR: 11, pop: 900 },
};
export default function DemographicTransitionModel(props: DemographicTransitionModelProps) {
  const initialState: State = {
    stage: props.initialStage ?? 1,
  };
  const [state, dispatch] = useReducer(reducer, initialState);
  const { stage } = state;
  const diagramContainerRef = useRef<HTMLDivElement>(null);
  const { openExportModal } = useExportModal();
  const data = useMemo(() => {
    const stages = ['Stage 1', 'Stage 2', 'Stage 3', 'Stage 4', 'Stage 5'];
    return stages.map((s, i) => {
      const stageNum = i + 1;
      const m = DTM_MODEL[stageNum];
      const highlight = stageNum === stage;
      return {
        stage: s,
        stageNum,
        'Birth Rate': m.CBR,
        'Death Rate': m.CDR,
        'Total Population': m.pop,
        highlight,
      };
    });
  }, [stage]);
  const current = DTM_MODEL[stage];
  const getDiagramState = () => ({ initialStage: stage });
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-1">
        <Card>
          <CardHeader><CardTitle>Demographic Transition</CardTitle></CardHeader>
          <div className="p-6 space-y-6">
            <div>
              <Label>Stage ({stage}) — {STAGE_LABELS[stage].name}</Label>
              <input
                type="range"
                min={1}
                max={5}
                step={1}
                value={stage}
                onChange={(e) => dispatch({ type: 'SET_STAGE', payload: Number(e.target.value) })}
                className="w-full mt-2"
              />
              <div className="flex justify-between text-xs text-text/50 mt-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <span key={s}>{s}</span>
                ))}
              </div>
            </div>
            <div className="p-3 rounded-[var(--border-radius-apple)] bg-neutral/30">
              <p className="text-xs text-text/70 mb-2">{STAGE_LABELS[stage].desc}</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-text/50">CBR:</span>{' '}
                  <span className="font-mono font-semibold text-accent">{current.CBR}/1000</span>
                </div>
                <div>
                  <span className="text-text/50">CDR:</span>{' '}
                  <span className="font-mono font-semibold" style={{ color: 'var(--color-secondary)' }}>{current.CDR}/1000</span>
                </div>
                <div className="col-span-2">
                  <span className="text-text/50">Natural Increase:</span>{' '}
                  <span className="font-mono font-semibold text-text">{(current.CBR - current.CDR)}/1000</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2 pt-4 border-t border-neutral-dark/30">
              <Button onClick={() => openExportModal(diagramContainerRef, 'demographic-transition-model')}>
                <Save className="mr-2 h-4 w-4" /> Save & Export Image
              </Button>
              <SaveGraphButton diagramName="Demographic Transition Model" getDiagramState={getDiagramState} />
            </div>
          </div>
        </Card>
      </div>
      <div className="md:col-span-2 min-h-[400px] md:min-h-0">
        <Card className="h-full !p-4" ref={diagramContainerRef} data-testid="diagram-container">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
              <XAxis
                dataKey="stage"
                stroke="var(--color-text)"
                label={{ value: 'DTM Stage', position: 'insideBottom', offset: -10, fill: 'var(--color-text)' }}
              />
              <YAxis
                yAxisId="left"
                stroke="var(--color-accent)"
                domain={[0, 50]}
                label={{ value: 'Rate per 1000', angle: -90, position: 'insideLeft', fill: 'var(--color-accent)' }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="var(--color-secondary)"
                domain={[0, 1200]}
                label={{ value: 'Total Population (million)', angle: 90, position: 'insideRight', fill: 'var(--color-secondary)' }}
              />
              <Tooltip
                formatter={(value: number | string, name: string) => {
                  const v = typeof value === 'number' ? value : parseFloat(value as string);
                  if (name === 'Total Population') return `${v}M`;
                  return `${v.toFixed(1)}/1000`;
                }}
              />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ color: 'var(--color-text)' }} />
              <Line yAxisId="left" type="monotone" dataKey="Birth Rate" stroke="var(--color-accent)" strokeWidth={2} dot={{ r: 5, fill: 'var(--color-accent)' }} />
              <Line yAxisId="left" type="monotone" dataKey="Death Rate" stroke="var(--color-secondary)" strokeWidth={2} dot={{ r: 5, fill: 'var(--color-secondary)' }} />
              <Bar yAxisId="right" dataKey="Total Population" fill="var(--color-accent)" fillOpacity={0.3} />
            </ComposedChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}