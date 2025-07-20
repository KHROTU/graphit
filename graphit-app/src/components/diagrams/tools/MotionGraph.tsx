'use client';

import React, { useState, useMemo, useRef } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Label } from '@/components/ui/Label';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Save, Plus, Trash2 } from 'lucide-react';
import { useExportModal } from '@/lib/context/ExportModalContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useSession } from '@/lib/hooks/useSession';
import SaveGraphButton from '@/components/shared/SaveGraphButton';

interface MotionSegment {
  id: number;
  type: 'accelerate' | 'constant' | 'decelerate';
  duration: number;
  value: number;
}

interface MotionGraphProps {
  initialSegments?: MotionSegment[];
}

const defaultSegments: MotionSegment[] = [
  { id: 1, type: 'accelerate', duration: 5, value: 2 },
  { id: 2, type: 'constant', duration: 10, value: 10 },
  { id: 3, type: 'decelerate', duration: 10, value: -1 },
];

const formatValue = (value: unknown): React.ReactNode => {
  if (typeof value === 'number') return Number(value.toFixed(2));
  return String(value);
};

export default function MotionGraph({ initialSegments = defaultSegments }: MotionGraphProps) {
  const [segments, setSegments] = useState<MotionSegment[]>(initialSegments);
  const diagramContainerRef = useRef<HTMLDivElement>(null);
  const { openExportModal } = useExportModal();
  const { session } = useSession();

  const data = useMemo(() => {
    const chartData: { time: number; distance: number; velocity: number }[] = [];
    let currentTime = 0; let currentVelocity = 0; let currentDistance = 0;
    chartData.push({ time: 0, distance: 0, velocity: 0 });

    segments.forEach(seg => {
      const startVelocity = currentVelocity;
      for (let t = 1; t <= seg.duration; t++) {
        currentTime++;
        let segmentDistance = 0;
        if (seg.type === 'constant') { currentVelocity = seg.value; segmentDistance = seg.value * 1; } 
        else {
          const acceleration = seg.type === 'accelerate' ? seg.value : -Math.abs(seg.value);
          currentVelocity = startVelocity + acceleration * t;
          if (seg.type === 'decelerate' && currentVelocity < 0) currentVelocity = 0;
          segmentDistance = startVelocity + 0.5 * acceleration; // distance in one time step
        }
        currentDistance += segmentDistance;
        chartData.push({ time: currentTime, distance: currentDistance, velocity: currentVelocity });
      }
    });
    return chartData;
  }, [segments]);
  
  const addSegment = () => setSegments([...segments, { id: Date.now(), type: 'constant', duration: 5, value: 0 }]);
  const updateSegment = (id: number, field: keyof MotionSegment, value: string | number) => {
    setSegments(segments.map(s => s.id === id ? { ...s, [field]: typeof value === 'string' ? value : Number(value) } : s));
  };
  const removeSegment = (id: number) => setSegments(segments.filter(s => s.id !== id));

  const getDiagramState = () => ({ initialSegments: segments });

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-1">
        <Card>
          <CardHeader><CardTitle>Motion Segments</CardTitle></CardHeader>
          <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
            {segments.map((seg, index) => (
              <div key={seg.id} className="p-3 border border-neutral-dark/50 rounded-apple space-y-2">
                <div className="flex justify-between items-center"><Label className="font-semibold">Segment {index + 1}</Label><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeSegment(seg.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button></div>
                <Select value={seg.type} onChange={e => updateSegment(seg.id, 'type', e.target.value)}><option value="accelerate">Accelerate</option><option value="constant">Constant Velocity</option><option value="decelerate">Decelerate</option></Select>
                <div className="flex gap-2"><Input type="number" value={seg.duration} onChange={e => updateSegment(seg.id, 'duration', e.target.value)} placeholder="Duration (s)" /><Input type="number" value={seg.value} onChange={e => updateSegment(seg.id, 'value', e.target.value)} placeholder={seg.type === 'constant' ? 'Velocity (m/s)' : 'Accel (m/s²)'} /></div>
              </div>
            ))}
            <Button variant="outline" onClick={addSegment} className="w-full"><Plus className="mr-2 h-4 w-4" /> Add Segment</Button>
          </div>
           <div className="p-4 border-t border-neutral-dark/30 flex flex-col gap-2">
               <Button onClick={() => openExportModal(diagramContainerRef, 'motion-graphs')}><Save className="mr-2 h-4 w-4" /> Save & Export Image</Button>
               {session?.isLoggedIn && (<SaveGraphButton diagramName="Motion Graph Generator" getDiagramState={getDiagramState} />)}
           </div>
        </Card>
      </div>
      <div className="md:col-span-2 space-y-8">
        <div ref={diagramContainerRef} data-testid="diagram-container" className="bg-background rounded-apple p-1">
            <Card className="h-[300px] !p-4"><h3 className="font-semibold text-center mb-2">Velocity-Time Graph</h3><ResponsiveContainer width="100%" height="90%"><LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2}/><XAxis dataKey="time" type="number" domain={[0, 'dataMax']} label={{ value: 'Time (s)', position: 'insideBottom', offset: -5 }} /><YAxis type="number" domain={['dataMin', 'dataMax']} label={{ value: 'Velocity (m/s)', angle: -90, position: 'insideLeft' }}/><Tooltip formatter={formatValue}/><Line type="monotone" dataKey="velocity" stroke="var(--color-accent)" strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer></Card>
            <Card className="h-[300px] !p-4 mt-8"><h3 className="font-semibold text-center mb-2">Distance-Time Graph</h3><ResponsiveContainer width="100%" height="90%"><LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2}/><XAxis dataKey="time" type="number" domain={[0, 'dataMax']} label={{ value: 'Time (s)', position: 'insideBottom', offset: -5 }} /><YAxis type="number" domain={[0, 'dataMax']} label={{ value: 'Distance (m)', angle: -90, position: 'insideLeft' }}/><Tooltip formatter={formatValue}/><Line type="monotone" dataKey="distance" stroke="var(--color-secondary)" strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer></Card>
        </div>
      </div>
    </div>
  );
}