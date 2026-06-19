'use client';
import React, { useReducer, useMemo, useRef } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Label } from '@/components/ui/Label';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Save } from 'lucide-react';
import { useExportModal } from '@/lib/context/ExportModalContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import SaveGraphButton from '@/components/shared/SaveGraphButton';
import { CustomSelect } from '@/components/ui/CustomSelect';
interface HistogramToolProps {
  initialRawData?: string;
  initialBinCount?: number;
  initialMode?: 'bins' | 'classWidths';
  initialClassWidths?: string;
}
type Mode = 'bins' | 'classWidths';
type State = {
  rawData: string;
  binCount: number;
  mode: Mode;
  classWidths: string;
};
type Action =
  | { type: 'SET_RAW_DATA'; payload: string }
  | { type: 'SET_BIN_COUNT'; payload: number }
  | { type: 'SET_MODE'; payload: Mode }
  | { type: 'SET_CLASS_WIDTHS'; payload: string };
const modeOptions = [
  { value: 'bins', label: 'Equal Bin Count' },
  { value: 'classWidths', label: 'Custom Class Widths' },
];
function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_RAW_DATA': return { ...state, rawData: action.payload };
    case 'SET_BIN_COUNT': return { ...state, binCount: action.payload };
    case 'SET_MODE': return { ...state, mode: action.payload };
    case 'SET_CLASS_WIDTHS': return { ...state, classWidths: action.payload };
    default: return state;
  }
}
interface Bin {
  range: string;
  lower: number;
  upper: number;
  frequency: number;
  frequencyDensity: number;
  classWidth: number;
}
const HISTO_COLORS = ['#38bdf8', '#34d399', '#a78bfa', '#f87171', '#facc15'];
export default function HistogramTool(props: HistogramToolProps) {
  const initialState: State = {
    rawData: props.initialRawData || '8, 12, 15, 17, 18, 22, 23, 23, 25, 28, 30, 31, 33, 35, 35, 38, 40, 42, 45, 50',
    binCount: props.initialBinCount || 6,
    mode: props.initialMode || 'bins',
    classWidths: props.initialClassWidths || '0-10, 10-20, 20-30, 30-40, 40-50',
  };
  const [state, dispatch] = useReducer(reducer, initialState);
  const { rawData, binCount, mode, classWidths } = state;
  const diagramContainerRef = useRef<HTMLDivElement>(null);
  const { openExportModal } = useExportModal();
  const bins = useMemo((): Bin[] => {
    const numbers = rawData.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n));
    if (numbers.length === 0) return [];
    if (mode === 'classWidths') {
      const boundaries = classWidths.split(',').map(b => {
        const parts = b.trim().split('-');
        return { lower: parseFloat(parts[0]), upper: parseFloat(parts[1]) };
      }).filter(b => !isNaN(b.lower) && !isNaN(b.upper));
      return boundaries.map(b => {
        const freq = numbers.filter(n => n >= b.lower && n < b.upper).length;
        const cw = b.upper - b.lower;
        return {
          range: `${b.lower}-${b.upper}`,
          lower: b.lower,
          upper: b.upper,
          frequency: freq,
          frequencyDensity: cw > 0 ? freq / cw : freq,
          classWidth: cw,
        };
      });
    }
    const min = Math.min(...numbers);
    const max = Math.max(...numbers);
    const range = max - min;
    const binWidth = range === 0 ? 1 : Math.ceil(range / binCount);
    return Array.from({ length: binCount }, (_, i) => {
      const lower = min + i * binWidth;
      const upper = i === binCount - 1 ? max + 1 : min + (i + 1) * binWidth;
      const freq = numbers.filter(n => n >= lower && n < upper).length;
      const cw = upper - lower;
      return {
        range: `${lower.toFixed(0)}-${upper.toFixed(0)}`,
        lower,
        upper,
        frequency: freq,
        frequencyDensity: cw > 0 ? freq / cw : freq,
        classWidth: cw,
      };
    });
  }, [rawData, binCount, mode, classWidths]);
  const getDiagramState = () => ({
    initialRawData: rawData,
    initialBinCount: binCount,
    initialMode: mode,
    initialClassWidths: classWidths,
  });
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-1">
        <Card>
          <CardHeader><CardTitle>Histogram Controls</CardTitle></CardHeader>
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
              <Label>Mode</Label>
              <CustomSelect
                value={mode}
                onChange={val => dispatch({ type: 'SET_MODE', payload: val as Mode })}
                options={modeOptions}
              />
            </div>
            {mode === 'bins' ? (
              <div>
                <Label>Number of Bins: {binCount}</Label>
                <Input
                  type="number"
                  value={binCount}
                  min={1}
                  max={30}
                  onChange={e => dispatch({ type: 'SET_BIN_COUNT', payload: Number(e.target.value) })}
                />
              </div>
            ) : (
              <div>
                <Label>Class Widths (comma-separated, e.g. 0-10, 10-20)</Label>
                <textarea
                  value={classWidths}
                  onChange={e => dispatch({ type: 'SET_CLASS_WIDTHS', payload: e.target.value })}
                  rows={3}
                  className="w-full mt-1 p-2 bg-transparent border border-neutral-dark rounded-apple text-sm"
                />
              </div>
            )}
            {bins.length > 0 && (
              <div className="border-t border-neutral-dark/50 pt-4 space-y-1 text-xs text-text/60">
                <p className="font-semibold text-text">Summary</p>
                <p>Total items: {bins.reduce((s, b) => s + b.frequency, 0)}</p>
                <p>Classes: {bins.length}</p>
              </div>
            )}
          </div>
          <div className="p-4 border-t border-neutral-dark/30 flex flex-col gap-2">
            <Button onClick={() => openExportModal(diagramContainerRef, 'histogram-tool')} className="w-full">
              <Save className="mr-2 h-4 w-4" /> Save & Export Image
            </Button>
            <SaveGraphButton diagramName="Histogram Tool" getDiagramState={getDiagramState} />
          </div>
        </Card>
      </div>
      <div className="md:col-span-2 space-y-8">
        <Card className="h-[500px] !p-4" ref={diagramContainerRef} data-testid="diagram-container">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={bins} margin={{ top: 5, right: 20, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
              <XAxis dataKey="range" label={{ value: 'Class Intervals', position: 'insideBottom', offset: -10 }} angle={bins.length > 8 ? -45 : 0} textAnchor={bins.length > 8 ? 'end' : 'middle'} />
              <YAxis label={{ value: 'Frequency', angle: -90, position: 'insideLeft' }} allowDecimals={false} />
              <Tooltip formatter={(v: unknown) => [typeof v === 'number' ? v.toFixed(2) : String(v), 'Frequency']} />
              <Bar dataKey="frequency" name="Frequency" fill={HISTO_COLORS[0]}>
                {bins.map((_, idx) => (
                  <rect key={idx} fill={HISTO_COLORS[idx % HISTO_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
        {bins.length > 0 && (
          <Card className="h-[350px] !p-4">
            <h3 className="font-semibold text-center mb-2">Frequency Density Histogram</h3>
            <ResponsiveContainer width="100%" height="90%">
              <BarChart data={bins} margin={{ top: 5, right: 20, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                <XAxis dataKey="range" label={{ value: 'Class Intervals', position: 'insideBottom', offset: -10 }} angle={bins.length > 8 ? -45 : 0} textAnchor={bins.length > 8 ? 'end' : 'middle'} />
                <YAxis label={{ value: 'Frequency Density', angle: -90, position: 'insideLeft' }} />
                <Tooltip formatter={(v: unknown) => [typeof v === 'number' ? v.toFixed(3) : String(v), 'Freq Density']} />
                <Bar dataKey="frequencyDensity" name="Frequency Density" fill={HISTO_COLORS[1]}>
                  {bins.map((_, idx) => (
                    <rect key={idx} fill={HISTO_COLORS[1 + (idx % (HISTO_COLORS.length - 1))]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}
      </div>
    </div>
  );
}