'use client';
import React, { useReducer, useMemo, useRef } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Label } from '@/components/ui/Label';
import { Input } from '@/components/ui/Input';
import { useExportModal } from '@/lib/context/ExportModalContext';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { SliderControl } from '../controls/SliderControl';
import { DiagramErrorBoundary } from '../DiagramErrorBoundary';
import { DiagramToolbar } from '../DiagramToolbar';
import { parse } from 'mathjs';
interface IntegrationProps {
  initialEquation?: string;
  initialStrips?: number;
  initialLowerBound?: number;
  initialUpperBound?: number;
}
type State = { equation: string; strips: number; lowerBound: number; upperBound: number; };
type Action = 
    | { type: 'SET_EQUATION', payload: string }
    | { type: 'SET_STRIPS', payload: number }
    | { type: 'SET_LOWER_BOUND', payload: number }
    | { type: 'SET_UPPER_BOUND', payload: number }
    | { type: 'RESET', payload: State };
function reducer(state: State, action: Action): State {
    switch(action.type) {
        case 'SET_EQUATION': return { ...state, equation: action.payload };
        case 'SET_STRIPS': return { ...state, strips: action.payload };
        case 'SET_LOWER_BOUND': return { ...state, lowerBound: action.payload };
        case 'SET_UPPER_BOUND': return { ...state, upperBound: action.payload };
        case 'RESET': return { ...action.payload };
        default: return state;
    }
}
const defaultState: State = {
    equation: 'x^2 + 2',
    strips: 4,
    lowerBound: 0,
    upperBound: 8,
};
export default function NumericalIntegrationGraph(props: IntegrationProps) {
  const initialState: State = {
      equation: props.initialEquation || defaultState.equation,
      strips: props.initialStrips ?? defaultState.strips,
      lowerBound: props.initialLowerBound ?? defaultState.lowerBound,
      upperBound: props.initialUpperBound ?? defaultState.upperBound,
  };
  const [state, dispatch] = useReducer(reducer, initialState);
  const { equation, strips, lowerBound, upperBound } = state;
  const diagramContainerRef = useRef<HTMLDivElement>(null);
  const { openExportModal } = useExportModal();
  const { curveData, trapezoids, area, exactArea } = useMemo(() => {
    let fn: { evaluate: (scope: Record<string, number>) => number } | undefined;
    try { fn = parse(equation).compile(); } 
    catch { return { curveData: [] as { x: number; y: number }[], trapezoids: [] as { x: number; y: number; x2: number; y2: number }[], area: 0, exactArea: NaN }; }
    const data: { x: number; y: number }[] = [];
    const step = (upperBound - lowerBound) / 100;
    for (let x = lowerBound; x <= upperBound; x += step) {
      data.push({ x: Number(x.toFixed(4)), y: fn.evaluate({ x }) as number });
    }
    const stripWidth = (upperBound - lowerBound) / strips;
    let currentArea = 0;
    const trapz: { x: number; y: number; x2: number; y2: number }[] = [];
    for (let i = 0; i < strips; i++) {
      const x1 = lowerBound + i * stripWidth;
      const x2 = lowerBound + (i + 1) * stripWidth;
      const y1 = fn.evaluate({ x: x1 }) as number;
      const y2 = fn.evaluate({ x: x2 }) as number;
      currentArea += ((y1 + y2) / 2) * stripWidth;
      trapz.push({ x: x1, y: y1, x2: x2, y2: y2 });
    }
    let exArea: number = NaN;
    try {
        if (equation.match(/^x\^(\d+)/)) {
            const n = Number(equation.match(/^x\^(\d+)/)?.[1]);
            const integral = (x:number) => Math.pow(x, n + 1) / (n + 1);
            exArea = integral(upperBound) - integral(lowerBound);
        } else if (equation.match(/^\d+$/)) {
            exArea = Number(equation) * (upperBound - lowerBound);
        }
    } catch {}
    return { curveData: data, trapezoids: trapz, area: currentArea, exactArea: exArea };
  }, [equation, strips, lowerBound, upperBound]);
  const getDiagramState = () => ({ 
    initialEquation: equation, 
    initialStrips: strips, 
    initialLowerBound: lowerBound, 
    initialUpperBound: upperBound 
  });
  const handleReset = () => {
    dispatch({ type: 'RESET', payload: { 
      equation: defaultState.equation, 
      strips: defaultState.strips, 
      lowerBound: defaultState.lowerBound, 
      upperBound: defaultState.upperBound 
    }});
  };
  const tooltipStyle = {
    backgroundColor: 'var(--color-surface)',
    borderColor: 'var(--color-border)',
    color: 'var(--color-text)',
    borderRadius: 'var(--border-radius-apple)',
  };
  return (
    <DiagramErrorBoundary diagramName="Trapezium Rule Integration">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <Card>
            <CardHeader><CardTitle>Trapezium Rule Integration</CardTitle></CardHeader>
            <div className="p-6 space-y-4">
              <div><Label>Function y =</Label><Input value={equation} onChange={e => dispatch({type: 'SET_EQUATION', payload: e.target.value})} /></div>
              <SliderControl label="Number of Strips" value={strips} min={1} max={20} step={1} onChange={v => dispatch({type: 'SET_STRIPS', payload: v})} />
              <div className="flex gap-2"><div className="flex-1"><Label>Lower Bound</Label><Input type="number" value={lowerBound} onChange={e => dispatch({type: 'SET_LOWER_BOUND', payload: Number(e.target.value)})} /></div><div className="flex-1"><Label>Upper Bound</Label><Input type="number" value={upperBound} onChange={e => dispatch({type: 'SET_UPPER_BOUND', payload: Number(e.target.value)})} /></div></div>
              <div className="text-sm border-t border-neutral-dark/50 pt-4"><h4 className="font-semibold mb-2">Area Approximation</h4><p>Estimated Area: <span className="font-mono text-accent">{area.toFixed(4)}</span></p>{!isNaN(exactArea) && <p>Exact Area: <span className="font-mono text-secondary">{exactArea.toFixed(4)}</span></p>}</div>
              <DiagramToolbar
                diagramName="Trapezium Rule Integration"
                getDiagramState={getDiagramState}
                onExport={() => openExportModal(diagramContainerRef, 'numerical-integration-graph')}
                onReset={handleReset}
              />
            </div>
          </Card>
        </div>
        <div className="md:col-span-2 min-h-[500px]">
          <Card className="h-full !p-4" ref={diagramContainerRef} data-testid="diagram-container">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={curveData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2}/>
                  <XAxis type="number" dataKey="x" domain={[lowerBound, upperBound]} stroke="var(--color-text)" tick={{ fill: 'var(--color-text)' }} />
                  <YAxis domain={[0, 'dataMax + 10']} stroke="var(--color-text)" tick={{ fill: 'var(--color-text)' }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area type="monotone" dataKey="y" stroke="var(--color-accent)" fill="var(--color-accent)" fillOpacity={0.3} strokeWidth={2} name={equation} dot={false} connectNulls />
                  {trapezoids.map((trap, i) => (<ReferenceLine key={`v-${i}`} segment={[{ x: trap.x, y: 0 }, { x: trap.x, y: trap.y }]} stroke="var(--color-secondary)" strokeDasharray="2 2" />))}
                  {trapezoids.map((trap, i) => (<ReferenceLine key={`t-${i}`} segment={[{ x: trap.x, y: trap.y }, { x: trap.x2, y: trap.y2 }]} stroke="var(--color-secondary)" />))}
                  <ReferenceLine x={upperBound} stroke="var(--color-secondary)" strokeDasharray="2 2" />
                </AreaChart>
              </ResponsiveContainer>
          </Card>
        </div>
      </div>
    </DiagramErrorBoundary>
  );
}