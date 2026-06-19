'use client';
import React, { useReducer, useMemo, useRef } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Label } from '@/components/ui/Label';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Save, Plus, Trash2 } from 'lucide-react';
import { useExportModal } from '@/lib/context/ExportModalContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import SaveGraphButton from '@/components/shared/SaveGraphButton';
import { SegmentControl } from '@/components/diagrams/controls/SegmentControl';
interface ExpLogGraphProps {
  initialFunctions?: { id: number; type: string; paramA: number; paramB: number; paramC: number }[];
  initialXMin?: number;
  initialXMax?: number;
}
interface FunctionDef {
  id: number;
  type: 'exp-base' | 'exp-natural' | 'log-base' | 'log-natural';
  paramA: number;
  paramB: number;
  paramC: number;
}
type State = {
  functions: FunctionDef[];
  xMin: number;
  xMax: number;
};
type Action =
  | { type: 'ADD_FUNCTION' }
  | { type: 'REMOVE_FUNCTION'; payload: { id: number } }
  | { type: 'UPDATE_FUNCTION'; payload: { id: number; field: string; value: number | string } }
  | { type: 'SET_X_MIN'; payload: number }
  | { type: 'SET_X_MAX'; payload: number };
const fnTypeOptions: { value: FunctionDef['type']; label: string }[] = [
  { value: 'exp-natural', label: 'a·eˣ + c' },
  { value: 'exp-base', label: 'a·bˣ + c' },
  { value: 'log-natural', label: 'a·ln(x) + c' },
  { value: 'log-base', label: 'a·log_b(x) + c' },
];
function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'ADD_FUNCTION': {
      const newId = Date.now();
      return { ...state, functions: [...state.functions, { id: newId, type: 'exp-natural', paramA: 1, paramB: 2, paramC: 0 }] };
    }
    case 'REMOVE_FUNCTION':
      return { ...state, functions: state.functions.filter(f => f.id !== action.payload.id) };
    case 'UPDATE_FUNCTION': {
      const { id, field, value } = action.payload;
      return {
        ...state,
        functions: state.functions.map(f => {
          if (f.id !== id) return f;
          if (field === 'type') {
            return { ...f, type: value as FunctionDef['type'], paramA: 1, paramB: 2, paramC: 0 };
          }
          return { ...f, [field]: value };
        }),
      };
    }
    case 'SET_X_MIN': return { ...state, xMin: action.payload };
    case 'SET_X_MAX': return { ...state, xMax: action.payload };
    default: return state;
  }
}
const DEFAULT_COLORS = ['#38bdf8', '#f87171', '#34d399', '#a78bfa', '#facc15', '#fb923c'];
export default function ExponentialLogGraph(props: ExpLogGraphProps) {
  const initialState: State = {
    functions: (props.initialFunctions as FunctionDef[]) || [
      { id: 1, type: 'exp-natural' as const, paramA: 1, paramB: Math.E, paramC: 0 },
      { id: 2, type: 'log-natural' as const, paramA: 1, paramB: Math.E, paramC: 0 },
    ],
    xMin: props.initialXMin || -2,
    xMax: props.initialXMax || 5,
  };
  const [state, dispatch] = useReducer(reducer, initialState);
  const { functions, xMin, xMax } = state;
  const diagramContainerRef = useRef<HTMLDivElement>(null);
  const { openExportModal } = useExportModal();
  const data = useMemo(() => {
    const step = (xMax - xMin) / 400;
    const points: { x: number; [key: string]: number }[] = [];
    for (let x = xMin; x <= xMax; x += step) {
      const point: { x: number; [key: string]: number } = { x };
      functions.forEach(fn => {
        let y: number = NaN;
        try {
          const a = fn.paramA;
          const b = fn.paramB;
          const c = fn.paramC;
          switch (fn.type) {
            case 'exp-natural':
              y = a * Math.exp(x) + c;
              break;
            case 'exp-base':
              y = a * Math.pow(b, x) + c;
              break;
            case 'log-natural':
              y = x > 0 ? a * Math.log(x) + c : NaN;
              break;
            case 'log-base':
              y = (x > 0 && b > 0 && b !== 1) ? a * (Math.log(x) / Math.log(b)) + c : NaN;
              break;
          }
        } catch {
          y = NaN;
        }
        if (Math.abs(y) > 1e6) y = y > 0 ? 1e6 : -1e6;
        point[String(fn.id)] = isFinite(y) ? y : NaN;
      });
      points.push(point);
    }
    return points;
  }, [functions, xMin, xMax]);
  const getFnLabel = (fn: FunctionDef) => {
    const a = fn.paramA;
    const b = fn.paramB;
    const c = fn.paramC;
    switch (fn.type) {
      case 'exp-natural': return `${a}e^x${c !== 0 ? (c > 0 ? '+' : '') + c : ''}`;
      case 'exp-base': return `${a}·${b}^x${c !== 0 ? (c > 0 ? '+' : '') + c : ''}`;
      case 'log-natural': return `${a}ln(x)${c !== 0 ? (c > 0 ? '+' : '') + c : ''}`;
      case 'log-base': return `${a}log_${b}(x)${c !== 0 ? (c > 0 ? '+' : '') + c : ''}`;
    }
  };
  const hasNegativeXAsymptote = functions.some(f => f.type === 'log-natural' || f.type === 'log-base');
  const asymptoteLines: { value: number; axis: 'x' | 'y' }[] = [];
  functions.forEach(fn => {
    if (Math.abs(fn.paramC) > 0.001) {
      asymptoteLines.push({ value: fn.paramC, axis: 'y' });
    }
  });
  if (hasNegativeXAsymptote) {
    asymptoteLines.push({ value: 0, axis: 'x' });
  }
  const getDiagramState = () => ({
    initialFunctions: functions,
    initialXMin: xMin,
    initialXMax: xMax,
  });
  const formatValue = (v: unknown): React.ReactNode => {
    if (typeof v === 'number') return v.toFixed(3);
    return String(v);
  };
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-1">
        <Card>
          <CardHeader><CardTitle>Exponential & Logarithmic</CardTitle></CardHeader>
          <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
            <Label className="font-semibold">Functions</Label>
            {functions.map((fn, idx) => (
              <div key={fn.id} className="p-3 border border-neutral-dark/50 rounded-apple space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="text-xs font-semibold">Function {idx + 1}</Label>
                  {functions.length > 1 && (
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => dispatch({ type: 'REMOVE_FUNCTION', payload: { id: fn.id } })}>
                      <Trash2 className="w-3 h-3 text-red-500" />
                    </Button>
                  )}
                </div>
                <SegmentControl
                  options={fnTypeOptions}
                  value={fn.type}
                  onValueChange={val => dispatch({ type: 'UPDATE_FUNCTION', payload: { id: fn.id, field: 'type', value: val } })}
                />
                <div className="grid grid-cols-3 gap-1">
                  <div>
                    <Label className="text-[10px]">a</Label>
                    <Input
                      type="number"
                      value={fn.paramA}
                      step={0.5}
                      onChange={e => dispatch({ type: 'UPDATE_FUNCTION', payload: { id: fn.id, field: 'paramA', value: Number(e.target.value) } })}
                    />
                  </div>
                  {(fn.type === 'exp-base' || fn.type === 'log-base') && (
                    <div>
                      <Label className="text-[10px]">b (base)</Label>
                      <Input
                        type="number"
                        value={fn.paramB}
                        step={1}
                        min={0.1}
                        onChange={e => dispatch({ type: 'UPDATE_FUNCTION', payload: { id: fn.id, field: 'paramB', value: Number(e.target.value) } })}
                      />
                    </div>
                  )}
                  <div>
                    <Label className="text-[10px]">c (asymptote)</Label>
                    <Input
                      type="number"
                      value={fn.paramC}
                      step={0.5}
                      onChange={e => dispatch({ type: 'UPDATE_FUNCTION', payload: { id: fn.id, field: 'paramC', value: Number(e.target.value) } })}
                    />
                  </div>
                </div>
                <p className="text-xs text-text/60 truncate">y = {getFnLabel(fn)}</p>
              </div>
            ))}
            <Button variant="outline" onClick={() => dispatch({ type: 'ADD_FUNCTION' })} className="w-full">
              <Plus className="mr-2 h-4 w-4" /> Add Function
            </Button>
            <div className="border-t border-neutral-dark/50 pt-4 space-y-2">
              <Label className="font-semibold">X-Axis Range</Label>
              <div className="flex gap-2">
                <Input type="number" value={xMin} onChange={e => dispatch({ type: 'SET_X_MIN', payload: Number(e.target.value) })} placeholder="X Min" />
                <Input type="number" value={xMax} onChange={e => dispatch({ type: 'SET_X_MAX', payload: Number(e.target.value) })} placeholder="X Max" />
              </div>
            </div>
          </div>
          <div className="p-4 border-t border-neutral-dark/30 flex flex-col gap-2">
            <Button onClick={() => openExportModal(diagramContainerRef, 'exponential-log-graph')} className="w-full">
              <Save className="mr-2 h-4 w-4" /> Save & Export Image
            </Button>
            <SaveGraphButton diagramName="Exponential & Logarithmic Graph" getDiagramState={getDiagramState} />
          </div>
        </Card>
      </div>
      <div className="md:col-span-2 min-h-[500px]">
        <Card className="h-full !p-4" ref={diagramContainerRef} data-testid="diagram-container">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
              <XAxis type="number" dataKey="x" domain={[xMin, xMax]} allowDataOverflow />
              <YAxis domain={['dataMin', 'dataMax']} allowDataOverflow />
              <Tooltip formatter={formatValue} labelFormatter={v => `x = ${formatValue(v)}`} />
              <Legend />
              <ReferenceLine y={0} stroke="var(--color-text)" strokeWidth={1} strokeOpacity={0.5} />
              <ReferenceLine x={0} stroke="var(--color-text)" strokeWidth={1} strokeOpacity={0.5} />
              {asymptoteLines.map((asym, i) => {
                if (asym.axis === 'x') {
                  return (
                    <ReferenceLine
                      key={`asym-x-${i}`}
                      x={asym.value}
                      stroke="var(--color-accent)"
                      strokeWidth={1.5}
                      strokeDasharray="8 4"
                      label={{ value: `x = ${asym.value}`, position: 'top', fill: 'var(--color-accent)', fontSize: 11 }}
                    />
                  );
                }
                return (
                  <ReferenceLine
                    key={`asym-y-${i}`}
                    y={asym.value}
                    stroke="var(--color-secondary)"
                    strokeWidth={1.5}
                    strokeDasharray="8 4"
                    label={{ value: `y = ${asym.value}`, position: 'right', fill: 'var(--color-secondary)', fontSize: 11 }}
                  />
                );
              })}
              {functions.map((fn, idx) => (
                <Line
                  key={fn.id}
                  type="monotone"
                  dataKey={String(fn.id)}
                  stroke={DEFAULT_COLORS[idx % DEFAULT_COLORS.length]}
                  strokeWidth={2}
                  dot={false}
                  name={getFnLabel(fn)}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}