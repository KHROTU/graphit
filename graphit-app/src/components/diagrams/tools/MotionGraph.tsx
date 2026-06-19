'use client';
import React, { useReducer, useMemo, useRef } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Label } from '@/components/ui/Label';
import { Button } from '@/components/ui/Button';
import { Plus, Trash2 } from 'lucide-react';
import { useExportModal } from '@/lib/context/ExportModalContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { SliderControl } from '../controls/SliderControl';
import { DiagramErrorBoundary } from '../DiagramErrorBoundary';
import { DiagramToolbar } from '../DiagramToolbar';
interface MotionSegment {
  id: number;
  type: 'accelerate' | 'constant' | 'decelerate';
  duration: number;
  value: number;
}
interface MotionGraphProps { initialSegments?: MotionSegment[]; }
type State = { segments: MotionSegment[]; };
type Action =
    | { type: 'ADD_SEGMENT' }
    | { type: 'UPDATE_SEGMENT', payload: { id: number; field: keyof MotionSegment; value: string | number } }
    | { type: 'REMOVE_SEGMENT', payload: { id: number } }
    | { type: 'RESET' };
const defaultSegments: MotionSegment[] = [
  { id: 1, type: 'accelerate', duration: 5, value: 2 },
  { id: 2, type: 'constant', duration: 10, value: 10 },
  { id: 3, type: 'decelerate', duration: 10, value: -1 },
];
const segmentTypeOptions = [
    { value: 'accelerate', label: 'Accelerate' },
    { value: 'constant', label: 'Constant Velocity' },
    { value: 'decelerate', label: 'Decelerate' },
];
function reducer(state: State, action: Action): State {
    switch(action.type) {
        case 'ADD_SEGMENT':
            return { ...state, segments: [...state.segments, { id: Date.now(), type: 'constant', duration: 5, value: 0 }] };
        case 'UPDATE_SEGMENT': {
            const { id, field, value } = action.payload;
            return { ...state, segments: state.segments.map(s => s.id === id ? { ...s, [field]: value } : s) };
        }
        case 'REMOVE_SEGMENT':
            return { ...state, segments: state.segments.filter(s => s.id !== action.payload.id) };
        case 'RESET':
            return { segments: [...defaultSegments] };
        default: return state;
    }
}
const formatValue = (value: unknown): React.ReactNode => {
  if (typeof value === 'number') return Number(value.toFixed(2));
  return String(value);
};
export default function MotionGraph({ initialSegments }: MotionGraphProps) {
  const initialState: State = { segments: initialSegments || defaultSegments };
  const [state, dispatch] = useReducer(reducer, initialState);
  const { segments } = state;
  const diagramContainerRef = useRef<HTMLDivElement>(null);
  const { openExportModal } = useExportModal();
  const data = useMemo(() => {
    const chartData: { time: number; distance: number; velocity: number }[] = [];
    let currentTime = 0;
    let currentVelocity = 0;
    let currentDistance = 0;
    chartData.push({ time: 0, distance: 0, velocity: 0 });
    segments.forEach(seg => {
      const startVelocity = currentVelocity;
      for (let t = 1; t <= seg.duration; t++) {
        currentTime++;
        let segmentDistance = 0;
        if (seg.type === 'constant') {
          currentVelocity = seg.value;
          segmentDistance = seg.value * 1;
        } else {
          const acceleration = seg.type === 'accelerate' ? seg.value : -Math.abs(seg.value);
          currentVelocity = startVelocity + acceleration * t;
          if (seg.type === 'decelerate' && currentVelocity < 0) currentVelocity = 0;
          segmentDistance = startVelocity * 1 + 0.5 * acceleration * (2 * t - 1);
        }
        currentDistance += segmentDistance;
        chartData.push({ time: currentTime, distance: currentDistance, velocity: currentVelocity });
      }
    });
    return chartData;
  }, [segments]);
  const getDiagramState = () => ({ initialSegments: segments });
  const handleReset = () => {
    dispatch({ type: 'RESET' });
  };
  return (
    <DiagramErrorBoundary diagramName="Motion Graph">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <Card>
            <CardHeader><CardTitle>Motion Segments</CardTitle></CardHeader>
            <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
              {segments.map((seg, index) => (
                <div key={seg.id} className="p-3 border border-neutral-dark/50 rounded-apple space-y-2">
                  <div className="flex justify-between items-center">
                    <Label className="font-semibold">Segment {index + 1}</Label>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => dispatch({type: 'REMOVE_SEGMENT', payload: {id: seg.id}})}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                  <CustomSelect
                    value={seg.type}
                    onChange={val => dispatch({type: 'UPDATE_SEGMENT', payload: {id: seg.id, field: 'type', value: val}})}
                    options={segmentTypeOptions}
                  />
                  <SliderControl
                    label="Duration"
                    value={seg.duration}
                    min={1}
                    max={30}
                    step={1}
                    unit="s"
                    onChange={val => dispatch({type: 'UPDATE_SEGMENT', payload: {id: seg.id, field: 'duration', value: val}})}
                  />
                  <SliderControl
                    label={seg.type === 'constant' ? 'Velocity' : 'Acceleration'}
                    value={seg.value}
                    min={seg.type === 'constant' ? 0 : -20}
                    max={seg.type === 'constant' ? 50 : 20}
                    step={1}
                    unit={seg.type === 'constant' ? 'm/s' : 'm/s²'}
                    onChange={val => dispatch({type: 'UPDATE_SEGMENT', payload: {id: seg.id, field: 'value', value: val}})}
                  />
                </div>
              ))}
              <Button variant="outline" onClick={() => dispatch({type: 'ADD_SEGMENT'})} className="w-full">
                <Plus className="mr-2 h-4 w-4" /> Add Segment
              </Button>
            </div>
            <DiagramToolbar
              diagramName="Motion Graph Generator"
              getDiagramState={getDiagramState}
              onExport={() => openExportModal(diagramContainerRef, 'motion-graphs')}
              onReset={handleReset}
            />
          </Card>
        </div>
        <div className="md:col-span-2 space-y-8">
          <div ref={diagramContainerRef} data-testid="diagram-container" className="bg-background rounded-apple p-1">
            <Card className="h-[300px] !p-4">
              <h3 className="font-semibold text-center mb-2">Velocity-Time Graph</h3>
              <ResponsiveContainer width="100%" height="90%">
                <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                  <XAxis dataKey="time" type="number" domain={[0, 'dataMax']} stroke="var(--color-text)" label={{ value: 'Time (s)', position: 'insideBottom', offset: -5 }} />
                  <YAxis type="number" domain={['dataMin', 'dataMax']} stroke="var(--color-text)" label={{ value: 'Velocity (m/s)', angle: -90, position: 'insideLeft' }} />
                  <Tooltip
                    formatter={formatValue}
                    contentStyle={{
                      backgroundColor: 'var(--color-neutral)',
                      border: '1px solid var(--color-neutral-dark)',
                      borderRadius: 'var(--border-radius-apple)',
                    }}
                  />
                  <Line type="monotone" dataKey="velocity" stroke="var(--color-accent)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
            <Card className="h-[300px] !p-4 mt-8">
              <h3 className="font-semibold text-center mb-2">Distance-Time Graph</h3>
              <ResponsiveContainer width="100%" height="90%">
                <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                  <XAxis dataKey="time" type="number" domain={[0, 'dataMax']} stroke="var(--color-text)" label={{ value: 'Time (s)', position: 'insideBottom', offset: -5 }} />
                  <YAxis type="number" domain={[0, 'dataMax']} stroke="var(--color-text)" label={{ value: 'Distance (m)', angle: -90, position: 'insideLeft' }} />
                  <Tooltip
                    formatter={formatValue}
                    contentStyle={{
                      backgroundColor: 'var(--color-neutral)',
                      border: '1px solid var(--color-neutral-dark)',
                      borderRadius: 'var(--border-radius-apple)',
                    }}
                  />
                  <Line type="monotone" dataKey="distance" stroke="var(--color-secondary)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </div>
        </div>
      </div>
    </DiagramErrorBoundary>
  );
}