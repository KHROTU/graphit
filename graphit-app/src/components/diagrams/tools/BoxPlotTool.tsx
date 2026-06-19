'use client';
import React, { useReducer, useMemo, useRef } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Label } from '@/components/ui/Label';
import { Button } from '@/components/ui/Button';
import { Save, Plus, Trash2 } from 'lucide-react';
import { useExportModal } from '@/lib/context/ExportModalContext';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Bar, Line } from 'recharts';
import SaveGraphButton from '@/components/shared/SaveGraphButton';
interface BoxPlotToolProps {
  initialDatasets?: string[];
  initialShowOutliers?: boolean;
}
type State = {
  datasets: string[];
  showOutliers: boolean;
};
type Action =
  | { type: 'ADD_DATASET' }
  | { type: 'UPDATE_DATASET'; payload: { index: number; value: string } }
  | { type: 'REMOVE_DATASET'; payload: { index: number } }
  | { type: 'SET_SHOW_OUTLIERS'; payload: boolean };
function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'ADD_DATASET': return { ...state, datasets: [...state.datasets, ''] };
    case 'UPDATE_DATASET': {
      const datasets = [...state.datasets];
      datasets[action.payload.index] = action.payload.value;
      return { ...state, datasets };
    }
    case 'REMOVE_DATASET': return { ...state, datasets: state.datasets.filter((_, i) => i !== action.payload.index) };
    case 'SET_SHOW_OUTLIERS': return { ...state, showOutliers: action.payload };
    default: return state;
  }
}
interface BoxPlotStats {
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  iqr: number;
  lowerFence: number;
  upperFence: number;
  outliers: number[];
  sorted: number[];
}
function calcStats(numbers: number[]): BoxPlotStats | null {
    const sorted = [...numbers].sort((a, b) => a - b);
    if (sorted.length === 0) return null;
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const getQuartile = (arr: number[], q: number) => {
    const pos = q * (arr.length - 1);
    const lo = Math.floor(pos);
    const hi = Math.ceil(pos);
    if (lo === hi) return arr[lo];
    return arr[lo] * (hi - pos) + arr[hi] * (pos - lo);
  };
  const q1 = getQuartile(sorted, 0.25);
  const median = getQuartile(sorted, 0.5);
  const q3 = getQuartile(sorted, 0.75);
  const iqr = q3 - q1;
  const lowerFence = q1 - 1.5 * iqr;
  const upperFence = q3 + 1.5 * iqr;
  const outliers = sorted.filter(n => n < lowerFence || n > upperFence);
  return { min, q1, median, q3, max, iqr, lowerFence, upperFence, outliers, sorted };
}
const BOX_COLORS = ['#38bdf8', '#f87171', '#34d399', '#a78bfa', '#facc15', '#fb923c'];
export default function BoxPlotTool(props: BoxPlotToolProps) {
  const initialState: State = {
    datasets: props.initialDatasets || [
      '12, 15, 17, 18, 22, 23, 23, 25, 28, 30, 31, 33, 35, 35, 38, 40, 42, 45, 50',
      '8, 10, 14, 16, 19, 21, 24, 26, 29, 32, 36, 39, 44, 48, 55, 62',
    ],
    showOutliers: props.initialShowOutliers !== undefined ? props.initialShowOutliers : true,
  };
  const [state, dispatch] = useReducer(reducer, initialState);
  const { datasets, showOutliers } = state;
  const diagramContainerRef = useRef<HTMLDivElement>(null);
  const { openExportModal } = useExportModal();
  const allStats = useMemo(() => {
    return datasets.map(ds => {
      const numbers = ds.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n));
      return calcStats(numbers);
    });
  }, [datasets]);
  const boxData = useMemo(() => {
    return allStats.map((stats, i) => {
      if (!stats) return {
        label: `Set ${i + 1}`,
        lowerWhisker: 0, q1: 0, median: 0, q3: 0, upperWhisker: 0, min: 0, max: 0,
        boxHeight: 0, whiskerLow: 0, whiskerHigh: 0,
      };
      const whiskerMin = showOutliers ? Math.max(stats.min, stats.lowerFence) : stats.min;
      const whiskerMax = showOutliers ? Math.min(stats.max, stats.upperFence) : stats.max;
      return {
        label: `Set ${i + 1}`,
        lowerWhisker: whiskerMin,
        q1: stats.q1,
        median: stats.median,
        q3: stats.q3,
        upperWhisker: whiskerMax,
        min: stats.min,
        max: stats.max,
      };
    });
  }, [allStats, showOutliers]);
  const { yMin, yMax } = useMemo(() => {
    const allVals: number[] = [];
    boxData.forEach(b => {
      allVals.push(b.lowerWhisker, b.q1, b.median, b.q3, b.upperWhisker);
    });
    if (allVals.length === 0) return { yMin: 0, yMax: 10 };
    const mn = Math.min(...allVals);
    const mx = Math.max(...allVals);
    const pad = (mx - mn) * 0.1 || 1;
    return { yMin: mn - pad, yMax: mx + pad };
  }, [boxData]);
  const getDiagramState = () => ({
    initialDatasets: datasets,
    initialShowOutliers: showOutliers,
  });
  const formatValue = (v: unknown): React.ReactNode => {
    if (typeof v === 'number') return v.toFixed(2);
    return String(v);
  };
  const boxWidth = 60;
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-1">
        <Card>
          <CardHeader><CardTitle>Box Plot Controls</CardTitle></CardHeader>
          <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
            <Label className="font-semibold">Datasets (comma-separated values)</Label>
            {datasets.map((ds, i) => (
              <div key={i} className="flex items-start gap-2">
                <textarea
                  value={ds}
                  onChange={e => dispatch({ type: 'UPDATE_DATASET', payload: { index: i, value: e.target.value } })}
                  rows={2}
                  className="flex-1 p-2 bg-transparent border border-neutral-dark rounded-apple text-sm"
                  placeholder={`Dataset ${i + 1} values...`}
                />
                {datasets.length > 1 && (
                  <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => dispatch({ type: 'REMOVE_DATASET', payload: { index: i } })}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                )}
              </div>
            ))}
            <Button variant="outline" onClick={() => dispatch({ type: 'ADD_DATASET' })} className="w-full">
              <Plus className="mr-2 h-4 w-4" /> Add Dataset
            </Button>
            <div className="border-t border-neutral-dark/50 pt-4">
              <Label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={showOutliers} onChange={e => dispatch({ type: 'SET_SHOW_OUTLIERS', payload: e.target.checked })} className="rounded" />
                Show Outliers (1.5 × IQR rule)
              </Label>
            </div>
            {allStats.some(s => s) && (
              <div className="border-t border-neutral-dark/50 pt-4 space-y-2 text-xs">
                {allStats.map((stats, i) => {
                  if (!stats) return null;
                  return (
                    <div key={i} className="space-y-1">
                      <p className="font-semibold text-text">Dataset {i + 1}</p>
                      <p>n={stats.sorted.length} | Min={stats.min.toFixed(1)} | Q1={stats.q1.toFixed(1)} | Med={stats.median.toFixed(1)} | Q3={stats.q3.toFixed(1)} | Max={stats.max.toFixed(1)}</p>
                      <p>IQR={stats.iqr.toFixed(1)} | Fences: [{stats.lowerFence.toFixed(1)}, {stats.upperFence.toFixed(1)}]</p>
                      {stats.outliers.length > 0 && <p className="text-red-400">Outliers: {stats.outliers.map(o => o.toFixed(1)).join(', ')}</p>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div className="p-4 border-t border-neutral-dark/30 flex flex-col gap-2">
            <Button onClick={() => openExportModal(diagramContainerRef, 'box-plot-tool')} className="w-full">
              <Save className="mr-2 h-4 w-4" /> Save & Export Image
            </Button>
            <SaveGraphButton diagramName="Box Plot Tool" getDiagramState={getDiagramState} />
          </div>
        </Card>
      </div>
      <div className="md:col-span-2 min-h-[500px]">
        <Card className="h-full !p-4" ref={diagramContainerRef} data-testid="diagram-container">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={boxData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
              <XAxis dataKey="label" />
              <YAxis domain={[yMin, yMax]} tickFormatter={v => v.toFixed(1)} />
              <Tooltip formatter={formatValue} />
              {boxData.map((_box, idx) => {
                const color = BOX_COLORS[idx % BOX_COLORS.length];
                return (
                  <React.Fragment key={idx}>
                    {/* Q1 to Q3 box via Bar */}
                    <Bar
                      dataKey="q3"
                      stackId={`box-${idx}`}
                      fill={color}
                      fillOpacity={0.7}
                      stroke={color}
                      barSize={boxWidth}
                      name={`Set ${idx + 1} Q1-Q3`}
                    />
                    {/* Whisker lines - lower */}
                    <Line
                      type="linear"
                      dataKey="lowerWhisker"
                      stroke={color}
                      strokeWidth={2}
                      dot={false}
                      name={`Set ${idx + 1} Lower Whisker`}
                    />
                    {/* Whisker lines - upper */}
                    <Line
                      type="linear"
                      dataKey="upperWhisker"
                      stroke={color}
                      strokeWidth={2}
                      dot={false}
                    />
                    {/* Median marker */}
                    <Line
                      type="linear"
                      dataKey="median"
                      stroke={color}
                      strokeWidth={3}
                      dot={{ r: 0, fill: color, strokeWidth: 0 }}
                      name={`Set ${idx + 1} Median`}
                    />
                  </React.Fragment>
                );
              })}
            </ComposedChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}