'use client';
import React, { useReducer, useMemo, useRef } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Label } from '@/components/ui/Label';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Save, Plus, Trash2 } from 'lucide-react';
import { useExportModal } from '@/lib/context/ExportModalContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { parse } from 'mathjs';
import SaveGraphButton from '@/components/shared/SaveGraphButton';
import { SegmentControl } from '@/components/diagrams/controls/SegmentControl';
interface TransformItem {
  id: number;
  type: string;
  value: number;
  label: string;
}
interface TransformationProps {
  initialEquation?: string;
  initialTransforms?: TransformItem[];
  initialXMin?: number;
  initialXMax?: number;
}
type State = {
  equation: string;
  transforms: TransformItem[];
  xMin: number;
  xMax: number;
};
type Action =
  | { type: 'SET_EQUATION'; payload: string }
  | { type: 'ADD_TRANSFORM' }
  | { type: 'REMOVE_TRANSFORM'; payload: { id: number } }
  | { type: 'UPDATE_TRANSFORM'; payload: { id: number; field: string; value: number | string } }
  | { type: 'SET_X_MIN'; payload: number }
  | { type: 'SET_X_MAX'; payload: number };
const transformOptions = [
  { value: 'translate-x', label: 'f(x + a)' },
  { value: 'translate-y', label: 'f(x) + a' },
  { value: 'stretch-x', label: 'f(ax)' },
  { value: 'stretch-y', label: 'af(x)' },
  { value: 'reflect-x', label: 'f(-x)' },
  { value: 'reflect-y', label: '-f(x)' },
];
function getTransformLabel(type: string, value: number): string {
  switch (type) {
    case 'translate-x': return `f(x ${value >= 0 ? '+' : '-'} ${Math.abs(value)})`;
    case 'translate-y': return `f(x) ${value >= 0 ? '+' : '-'} ${Math.abs(value)}`;
    case 'stretch-x': return `f(${value}x)`;
    case 'stretch-y': return `${value}f(x)`;
    case 'reflect-x': return 'f(-x)';
    case 'reflect-y': return '-f(x)';
    default: return '';
  }
}
function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_EQUATION': return { ...state, equation: action.payload };
    case 'ADD_TRANSFORM': {
      const newId = Date.now();
      return {
        ...state,
        transforms: [...state.transforms, { id: newId, type: 'translate-x', value: 0, label: 'f(x + 0)' }],
      };
    }
    case 'REMOVE_TRANSFORM':
      return { ...state, transforms: state.transforms.filter(t => t.id !== action.payload.id) };
    case 'UPDATE_TRANSFORM': {
      const { id, field, value } = action.payload;
      return {
        ...state,
        transforms: state.transforms.map(t => {
          if (t.id !== id) return t;
          const updated = { ...t, [field]: value } as TransformItem;
          if (field === 'type') {
            updated.value = 0;
          }
          updated.label = getTransformLabel(updated.type, updated.value);
          return updated;
        }),
      };
    }
    case 'SET_X_MIN': return { ...state, xMin: action.payload };
    case 'SET_X_MAX': return { ...state, xMax: action.payload };
    default: return state;
  }
}
const DEFAULT_COLORS = ['#38bdf8', '#f87171', '#34d399', '#a78bfa', '#facc15', '#fb923c', '#f472b6'];
export default function TransformationGraph(props: TransformationProps) {
  const initialState: State = {
    equation: props.initialEquation || 'x^2',
    transforms: props.initialTransforms || [
      { id: 1, type: 'translate-x', value: 2, label: 'f(x + 2)' },
      { id: 2, type: 'stretch-y', value: 2, label: '2f(x)' },
    ],
    xMin: props.initialXMin || -5,
    xMax: props.initialXMax || 5,
  };
  const [state, dispatch] = useReducer(reducer, initialState);
  const { equation, transforms, xMin, xMax } = state;
  const diagramContainerRef = useRef<HTMLDivElement>(null);
  const { openExportModal } = useExportModal();
  const allData = useMemo(() => {
    const step = (xMax - xMin) / 300;
    const points: { x: number; [key: string]: number }[] = [];
    for (let x = xMin; x <= xMax; x += step) {
      const point: { x: number; [key: string]: number } = { x };
      const xRounded = Math.round(x * 1000) / 1000;
      try {
        const baseY = parse(equation).compile().evaluate({ x: xRounded });
        point['original'] = isFinite(baseY) ? baseY : NaN;
      } catch {
        point['original'] = NaN;
      }
      transforms.forEach(t => {
        try {
          let transX = xRounded;
          switch (t.type) {
            case 'translate-x': transX = xRounded - t.value; break;
            case 'stretch-x': transX = t.value !== 0 ? xRounded / t.value : xRounded; break;
            case 'reflect-x': transX = -xRounded; break;
            default: transX = xRounded;
          }
          let transY = parse(equation).compile().evaluate({ x: transX });
          switch (t.type) {
            case 'translate-y': transY += t.value; break;
            case 'stretch-y': transY *= t.value; break;
            case 'reflect-y': transY = -transY; break;
          }
          point[String(t.id)] = isFinite(transY) ? transY : NaN;
        } catch {
          point[String(t.id)] = NaN;
        }
      });
      points.push(point);
    }
    return points;
  }, [equation, transforms, xMin, xMax]);
  const lines: { dataKey: string; color: string; name: string }[] = [
    { dataKey: 'original', color: DEFAULT_COLORS[0], name: `f(x) = ${equation}` },
    ...transforms.map((t, i) => ({
      dataKey: String(t.id),
      color: DEFAULT_COLORS[(i + 1) % DEFAULT_COLORS.length],
      name: t.label,
    })),
  ];
  const getDiagramState = () => ({
    initialEquation: equation,
    initialTransforms: transforms,
    initialXMin: xMin,
    initialXMax: xMax,
  });
  const formatValue = (v: unknown): React.ReactNode => {
    if (typeof v === 'number') return v.toFixed(2);
    return String(v);
  };
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-1">
        <Card>
          <CardHeader><CardTitle>Graph Transformations</CardTitle></CardHeader>
          <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
            <div>
              <Label>Base Function f(x)</Label>
              <Input
                value={equation}
                onChange={e => dispatch({ type: 'SET_EQUATION', payload: e.target.value })}
                placeholder="e.g. x^2, sin(x), 1/x"
              />
            </div>
            <div className="border-t border-neutral-dark/50 pt-4">
              <Label className="font-semibold">Transformations</Label>
            </div>
            {transforms.map((t) => (
              <div key={t.id} className="p-3 border border-neutral-dark/50 rounded-apple space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="text-xs font-semibold">Transform</Label>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => dispatch({ type: 'REMOVE_TRANSFORM', payload: { id: t.id } })}>
                    <Trash2 className="w-3 h-3 text-red-500" />
                  </Button>
                </div>
                <SegmentControl
                  options={transformOptions}
                  value={t.type}
                  onValueChange={val => dispatch({ type: 'UPDATE_TRANSFORM', payload: { id: t.id, field: 'type', value: val } })}
                />
                {(t.type !== 'reflect-x' && t.type !== 'reflect-y') && (
                  <div>
                    <Label>Value (a): {t.value}</Label>
                    <input
                      type="range"
                      min={-10}
                      max={10}
                      step={0.5}
                      value={t.value}
                      onChange={e => dispatch({ type: 'UPDATE_TRANSFORM', payload: { id: t.id, field: 'value', value: Number(e.target.value) } })}
                      className="w-full mt-2"
                    />
                  </div>
                )}
                <p className="text-xs text-text/60">{t.label}</p>
              </div>
            ))}
            <Button variant="outline" onClick={() => dispatch({ type: 'ADD_TRANSFORM' })} className="w-full">
              <Plus className="mr-2 h-4 w-4" /> Add Transformation
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
            <Button onClick={() => openExportModal(diagramContainerRef, 'transformation-graph')} className="w-full">
              <Save className="mr-2 h-4 w-4" /> Save & Export Image
            </Button>
            <SaveGraphButton diagramName="Transformation Graph" getDiagramState={getDiagramState} />
          </div>
        </Card>
      </div>
      <div className="md:col-span-2 min-h-[500px]">
        <Card className="h-full !p-4" ref={diagramContainerRef} data-testid="diagram-container">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={allData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
              <XAxis type="number" dataKey="x" domain={[xMin, xMax]} allowDataOverflow />
              <YAxis domain={['dataMin', 'dataMax']} allowDataOverflow />
              <Tooltip formatter={formatValue} labelFormatter={v => `x = ${formatValue(v)}`} />
              <Legend />
              <ReferenceLine y={0} stroke="var(--color-text)" strokeWidth={1} strokeOpacity={0.5} />
              <ReferenceLine x={0} stroke="var(--color-text)" strokeWidth={1} strokeOpacity={0.5} />
              {lines.map(l => (
                <Line
                  key={l.dataKey}
                  type="monotone"
                  dataKey={l.dataKey}
                  stroke={l.color}
                  strokeWidth={2}
                  dot={false}
                  name={l.name}
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