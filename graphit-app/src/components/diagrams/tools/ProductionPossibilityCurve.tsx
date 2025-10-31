'use client';

import React, { useReducer, useMemo, useRef, useCallback } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Label } from '@/components/ui/Label';
import { Button } from '@/components/ui/Button';
import { Save } from 'lucide-react';
import { useExportModal } from '@/lib/context/ExportModalContext';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceDot } from 'recharts';
import { useSession } from '@/lib/hooks/useSession';
import SaveGraphButton from '@/components/shared/SaveGraphButton';

interface PPCProps {
  initialGrowth?: number; initialBowedness?: number; initialPoint?: { x: number, y: number };
}
interface Point { x: number; y: number; }
type State = { growth: number; bowedness: number; point: Point; isDragging: boolean; };
type Action =
    | { type: 'SET_GROWTH', payload: number }
    | { type: 'SET_BOWEDNESS', payload: number }
    | { type: 'SET_POINT', payload: Point }
    | { type: 'SET_DRAGGING', payload: boolean };

function reducer(state: State, action: Action): State {
    switch(action.type) {
        case 'SET_GROWTH': return { ...state, growth: action.payload };
        case 'SET_BOWEDNESS': return { ...state, bowedness: action.payload };
        case 'SET_POINT': return { ...state, point: action.payload };
        case 'SET_DRAGGING': return { ...state, isDragging: action.payload };
        default: return state;
    }
}

const chartMargins = { top: 5, right: 30, left: 20, bottom: 20 };

export default function ProductionPossibilityCurve(props: PPCProps) {
  const initialState: State = {
      growth: props.initialGrowth || 0,
      bowedness: props.initialBowedness || 2,
      point: props.initialPoint || { x: 75, y: 75 },
      isDragging: false,
  };
  const [state, dispatch] = useReducer(reducer, initialState);
  const { growth, bowedness, point, isDragging } = state;
  
  const diagramContainerRef = useRef<HTMLDivElement>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const { openExportModal } = useExportModal();
  const { session } = useSession();

  const { data, xMax, yMax } = useMemo(() => {
    const baseMax = 150;
    const currentXMax = baseMax + growth;
    const currentYMax = baseMax + growth;
    const chartData = Array.from({ length: 101 }, (_, i) => {
      const x = (i / 100) * currentXMax;
      const y = currentYMax * Math.pow(1 - Math.pow(x / currentXMax, bowedness), 1 / bowedness);
      return { goodB: x, goodA: y >= 0 ? y : null };
    });
    return { data: chartData, xMax: currentXMax, yMax: currentYMax };
  }, [growth, bowedness]);

  const getPointStatus = () => {
    if (point.x < 0 || point.y < 0 || xMax <= 0 || yMax <= 0) return { text: 'Unattainable', color: 'bg-red-500' };
    const val = Math.pow(point.x / xMax, bowedness) + Math.pow(point.y / yMax, bowedness);
    if (val > 1.02) return { text: 'Unattainable', color: 'bg-red-500' };
    if (val < 0.98) return { text: 'Inefficient', color: 'bg-amber-500' };
    return { text: 'Efficient', color: 'bg-green-500' };
  };
  const status = getPointStatus();
  
  const pixelToData = useCallback((pixelX: number, pixelY: number, chartArea: DOMRect) => {
    const chartWidth = chartArea.width - chartMargins.left - chartMargins.right;
    const chartHeight = chartArea.height - chartMargins.top - chartMargins.bottom;
    const relativeX = (pixelX - chartArea.left - chartMargins.left) / chartWidth;
    const relativeY = 1 - (pixelY - chartArea.top - chartMargins.top) / chartHeight;
    return { x: Math.max(0, relativeX * xMax), y: Math.max(0, relativeY * yMax) };
  }, [xMax, yMax]);

  const handleInteraction = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!chartContainerRef.current) return;
    const chartRect = chartContainerRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    dispatch({ type: 'SET_POINT', payload: pixelToData(clientX, clientY, chartRect) });
  }, [pixelToData]);
  
  const handleMouseDown = (e: React.MouseEvent) => { dispatch({type: 'SET_DRAGGING', payload: true}); handleInteraction(e); };
  const handleMouseMove = (e: React.MouseEvent) => { if (isDragging) handleInteraction(e); };
  const getDiagramState = () => ({ initialGrowth: growth, initialBowedness: bowedness, initialPoint: point });

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-1">
        <Card>
          <CardHeader><CardTitle>Configuration</CardTitle></CardHeader>
          <div className="p-6 space-y-6">
            <div><Label>Economic Growth (Shift): {growth}</Label><input type="range" min="-100" max="50" value={growth} onChange={(e) => dispatch({type: 'SET_GROWTH', payload: parseInt(e.target.value)})} className="w-full mt-2" /></div>
            <div><Label>Opportunity Cost (Bowedness): {bowedness.toFixed(1)}</Label><input type="range" min="1.0" max="5" step="0.1" value={bowedness} onChange={(e) => dispatch({type: 'SET_BOWEDNESS', payload: parseFloat(e.target.value)})} className="w-full mt-2" /></div>
            <div className="text-sm border-t border-neutral-dark/50 pt-4"><h4 className="font-semibold mb-2">Interactive Point</h4><p>Click and drag the red dot to test production scenarios.</p></div>
             <div className="flex flex-col gap-2 pt-4 border-t border-neutral-dark/30">
                <Button onClick={() => openExportModal(diagramContainerRef, 'production-possibility-curve')}>
                    <Save className="mr-2 h-4 w-4" /> Save & Export Image
                </Button>
                {session?.isLoggedIn && (
                  <SaveGraphButton diagramName="Production Possibility Curves" getDiagramState={getDiagramState} />
                )}
              </div>
          </div>
        </Card>
      </div>
      <div className="md:col-span-2 min-h-[400px] md:min-h-0">
          <Card className="h-full !p-4 select-none relative" ref={diagramContainerRef} data-testid="diagram-container">
            <div 
              ref={chartContainerRef} 
              className="w-full h-full relative" 
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={() => dispatch({type: 'SET_DRAGGING', payload: false})}
              onMouseLeave={() => dispatch({type: 'SET_DRAGGING', payload: false})}
              style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
            >
              <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data} margin={chartMargins}>
                      <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                      <XAxis type="number" dataKey="goodB" domain={[0, 'dataMax']} name="Good B" stroke="var(--color-text)" tickFormatter={(v) => String(Number(v).toFixed(0))} label={{ value: 'Good B', position: 'insideBottom', offset: -10, fill: 'var(--color-text)' }}/>
                      <YAxis type="number" dataKey="goodA" domain={[0, 'dataMax']} name="Good A" stroke="var(--color-text)" tickFormatter={(v) => String(Number(v).toFixed(0))} label={{ value: 'Good A', angle: -90, position: 'insideLeft', fill: 'var(--color-text)' }}/>
                      <Tooltip formatter={(v) => Number(v).toFixed(1)} contentStyle={{ backgroundColor: 'var(--color-neutral)', border: '1px solid var(--color-neutral-dark)', borderRadius: 'var(--border-radius-apple)' }} />
                      <Area type="monotone" dataKey="goodA" stroke="var(--color-accent)" fill="var(--color-accent)" fillOpacity={0.2} strokeWidth={2} name="PPC" connectNulls />
                      <ReferenceDot x={point.x} y={point.y} r={8} fill="var(--color-secondary)" stroke="var(--color-background)" strokeWidth={2} ifOverflow="visible" />
                  </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className={`absolute bottom-10 right-8 text-sm font-bold px-3 py-1.5 rounded-lg text-white shadow-md pointer-events-none ${status.color}`}>{status.text}</div>
          </Card>
      </div>
    </div>
  );
}