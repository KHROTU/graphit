'use client';
import React, { useReducer, useMemo, useRef } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Label } from '@/components/ui/Label';
import { Button } from '@/components/ui/Button';
import { Save } from 'lucide-react';
import { useExportModal } from '@/lib/context/ExportModalContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import SaveGraphButton from '@/components/shared/SaveGraphButton';
interface CumulativeFrequencyProps {
  initialRawData?: string;
  initialClassBoundaries?: string;
}
type State = {
  rawData: string;
  classBoundaries: string;
};
type Action =
  | { type: 'SET_RAW_DATA'; payload: string }
  | { type: 'SET_CLASS_BOUNDARIES'; payload: string };
function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_RAW_DATA': return { ...state, rawData: action.payload };
    case 'SET_CLASS_BOUNDARIES': return { ...state, classBoundaries: action.payload };
    default: return state;
  }
}
interface CFPoint {
  upperBound: number;
  cf: number;
  label: string;
}
export default function CumulativeFrequencyTool(props: CumulativeFrequencyProps) {
  const initialState: State = {
    rawData: props.initialRawData || '8, 12, 15, 17, 18, 22, 23, 23, 25, 28, 30, 31, 33, 35, 35, 38, 40, 42, 45, 50',
    classBoundaries: props.initialClassBoundaries || '0, 10, 20, 30, 40, 50',
  };
  const [state, dispatch] = useReducer(reducer, initialState);
  const { rawData, classBoundaries } = state;
  const diagramContainerRef = useRef<HTMLDivElement>(null);
  const { openExportModal } = useExportModal();
  const { cfData, median, q1, q3, totalFreq } = useMemo(() => {
    const numbers = rawData.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n));
    const boundaries = classBoundaries.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n));
    if (numbers.length === 0 || boundaries.length < 2) {
      return { cfData: [] as CFPoint[], median: 0, q1: 0, q3: 0, totalFreq: 0 };
    }
    const sortedBounds = [...boundaries].sort((a, b) => a - b);
    const classes: { lower: number; upper: number; freq: number }[] = [];
    for (let i = 0; i < sortedBounds.length - 1; i++) {
      const lower = sortedBounds[i];
      const upper = sortedBounds[i + 1];
      const freq = numbers.filter(n => n >= lower && n < upper).length;
      classes.push({ lower, upper, freq });
    }
    const totalFreq = numbers.length;
    let cumFreq = 0;
    const cfPoints: CFPoint[] = [];
    classes.forEach(cls => {
      cumFreq += cls.freq;
      cfPoints.push({
        upperBound: cls.upper,
        cf: cumFreq,
        label: `${cls.lower}-${cls.upper}`,
      });
    });
    const estimateQuantile = (target: number) => {
      if (cfPoints.length === 0) return 0;
      if (target <= 0) return cfPoints[0].upperBound;
      if (target >= totalFreq) return cfPoints[cfPoints.length - 1].upperBound;
      for (let i = 0; i < cfPoints.length; i++) {
        if (cfPoints[i].cf >= target) {
          const prevCF = i > 0 ? cfPoints[i - 1].cf : 0;
          const prevUB = i > 0 ? cfPoints[i - 1].upperBound : boundaries[0];
          const ub = cfPoints[i].upperBound;
          const cfInClass = cfPoints[i].cf - prevCF;
          if (cfInClass === 0) return ub;
          return prevUB + ((target - prevCF) / cfInClass) * (ub - prevUB);
        }
      }
      return cfPoints[cfPoints.length - 1].upperBound;
    };
    const median = estimateQuantile(totalFreq / 2);
    const q1 = estimateQuantile(totalFreq / 4);
    const q3 = estimateQuantile(3 * totalFreq / 4);
    return { cfData: cfPoints, median, q1, q3, totalFreq };
  }, [rawData, classBoundaries]);
  const getDiagramState = () => ({
    initialRawData: rawData,
    initialClassBoundaries: classBoundaries,
  });
  const formatValue = (v: unknown): React.ReactNode => {
    if (typeof v === 'number') return v.toFixed(2);
    return String(v);
  };
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-1">
        <Card>
          <CardHeader><CardTitle>Cumulative Frequency</CardTitle></CardHeader>
          <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
            <div>
              <Label>Raw Data (comma-separated)</Label>
              <textarea
                value={rawData}
                onChange={e => dispatch({ type: 'SET_RAW_DATA', payload: e.target.value })}
                rows={5}
                className="w-full mt-1 p-2 bg-transparent border border-neutral-dark rounded-apple text-sm"
              />
            </div>
            <div>
              <Label>Class Boundaries (comma-separated)</Label>
              <textarea
                value={classBoundaries}
                onChange={e => dispatch({ type: 'SET_CLASS_BOUNDARIES', payload: e.target.value })}
                rows={2}
                className="w-full mt-1 p-2 bg-transparent border border-neutral-dark rounded-apple text-sm"
              />
            </div>
            {totalFreq > 0 && (
              <div className="border-t border-neutral-dark/50 pt-4 space-y-1 text-xs">
                <p className="font-semibold text-text mb-2">Statistics</p>
                <p>Total Frequency (n): {totalFreq}</p>
                <p>Median: {median.toFixed(2)} <span className="text-text/50">(at n/2 = {(totalFreq / 2).toFixed(1)})</span></p>
                <p>Q1 (Lower Quartile): {q1.toFixed(2)} <span className="text-text/50">(at n/4 = {(totalFreq / 4).toFixed(1)})</span></p>
                <p>Q3 (Upper Quartile): {q3.toFixed(2)} <span className="text-text/50">(at 3n/4 = {(3 * totalFreq / 4).toFixed(1)})</span></p>
                <p>IQR: {(q3 - q1).toFixed(2)}</p>
              </div>
            )}
          </div>
          <div className="p-4 border-t border-neutral-dark/30 flex flex-col gap-2">
            <Button onClick={() => openExportModal(diagramContainerRef, 'cumulative-frequency')} className="w-full">
              <Save className="mr-2 h-4 w-4" /> Save & Export Image
            </Button>
            <SaveGraphButton diagramName="Cumulative Frequency Tool" getDiagramState={getDiagramState} />
          </div>
        </Card>
      </div>
      <div className="md:col-span-2 min-h-[500px]">
        <Card className="h-full !p-4" ref={diagramContainerRef} data-testid="diagram-container">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={cfData} margin={{ top: 5, right: 20, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
              <XAxis type="number" dataKey="upperBound" label={{ value: 'Upper Class Boundary', position: 'insideBottom', offset: -10 }} />
              <YAxis domain={[0, 'dataMax + 5']} allowDecimals={false} label={{ value: 'Cumulative Frequency', angle: -90, position: 'insideLeft' }} />
              <Tooltip formatter={formatValue} labelFormatter={v => `Upper Bound: ${formatValue(v)}`} />
              <Line
                type="monotone"
                dataKey="cf"
                name="Cumulative Frequency"
                stroke="var(--color-accent)"
                strokeWidth={3}
                dot={{ r: 4, fill: 'var(--color-accent)' }}
                activeDot={{ r: 6 }}
              />
              {median > 0 && (
                <>
                  <ReferenceLine x={median} stroke="var(--color-secondary)" strokeWidth={2} strokeDasharray="5 5" label={{ value: `Median: ${median.toFixed(1)}`, position: 'top', fill: 'var(--color-secondary)', fontSize: 12 }} />
                  <ReferenceLine y={totalFreq / 2} stroke="var(--color-secondary)" strokeWidth={1} strokeDasharray="3 3" />
                </>
              )}
              {q1 > 0 && (
                <ReferenceLine x={q1} stroke="#34d399" strokeWidth={1.5} strokeDasharray="4 4" label={{ value: `Q1: ${q1.toFixed(1)}`, position: 'top', fill: '#34d399', fontSize: 11 }} />
              )}
              {q3 > 0 && (
                <ReferenceLine x={q3} stroke="#a78bfa" strokeWidth={1.5} strokeDasharray="4 4" label={{ value: `Q3: ${q3.toFixed(1)}`, position: 'top', fill: '#a78bfa', fontSize: 11 }} />
              )}
              <ReferenceLine y={totalFreq / 4} stroke="#34d399" strokeWidth={0.5} strokeDasharray="2 2" />
              <ReferenceLine y={3 * totalFreq / 4} stroke="#a78bfa" strokeWidth={0.5} strokeDasharray="2 2" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}