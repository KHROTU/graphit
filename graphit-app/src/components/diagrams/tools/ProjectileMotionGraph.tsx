'use client';

import React, { useReducer, useMemo, useRef, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Label } from '@/components/ui/Label';
import { Button } from '@/components/ui/Button';
import { Save, Play, Pause, RotateCcw } from 'lucide-react';
import { useExportModal } from '@/lib/context/ExportModalContext';
import { ComposedChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceDot, Bar, BarChart, Customized } from 'recharts';
import { useSession } from '@/lib/hooks/useSession';
import SaveGraphButton from '@/components/shared/SaveGraphButton';

const G = 9.81;

interface ProjectileProps {
  initialVelocity?: number;
  initialAngle?: number;
  initialMass?: number;
  initialHeight?: number;
}

type State = {
  velocity: number;
  angle: number;
  mass: number;
  height: number;
  time: number;
  isPlaying: boolean;
};

type Action =
  | { type: 'SET_VELOCITY'; payload: number }
  | { type: 'SET_ANGLE'; payload: number }
  | { type: 'SET_MASS'; payload: number }
  | { type: 'SET_HEIGHT'; payload: number }
  | { type: 'SET_TIME'; payload: number }
  | { type: 'TOGGLE_PLAY' }
  | { type: 'RESET_ANIMATION' };

function projectileReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_VELOCITY': return { ...state, velocity: action.payload };
    case 'SET_ANGLE': return { ...state, angle: action.payload };
    case 'SET_MASS': return { ...state, mass: action.payload };
    case 'SET_HEIGHT': return { ...state, height: action.payload };
    case 'SET_TIME': return { ...state, time: action.payload };
    case 'TOGGLE_PLAY': return { ...state, isPlaying: !state.isPlaying };
    case 'RESET_ANIMATION': return { ...state, time: 0, isPlaying: false };
    default: return state;
  }
}

interface AxisMap { scale: (value: number) => number; }
interface LaunchVectorProps {
    height: number; angle: number; xAxisMap?: AxisMap[]; yAxisMap?: AxisMap[];
}
const LaunchVector = ({ height, angle, xAxisMap, yAxisMap }: LaunchVectorProps) => {
    if (!xAxisMap || !yAxisMap || !xAxisMap[0]?.scale || !yAxisMap[0]?.scale) return null;
    
    const startX = xAxisMap[0].scale(0);
    const startY = yAxisMap[0].scale(height);
    const vectorLength = 50;
    const angleRad = angle * Math.PI / 180;
    const endX = startX + vectorLength * Math.cos(angleRad);
    const endY = startY - vectorLength * Math.sin(angleRad);

    return (
        <g className="pointer-events-none">
            <defs>
                <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--color-secondary)" />
                </marker>
            </defs>
            <line x1={startX} y1={startY} x2={endX} y2={endY} stroke="var(--color-secondary)" strokeWidth="2.5" markerEnd="url(#arrow)" />
        </g>
    );
};

const formatTick = (tick: string | number) => {
    if (typeof tick === 'number') return tick.toFixed(0);
    return tick;
};

export default function ProjectileMotionGraph(props: ProjectileProps) {
  const initialState: State = {
    velocity: props.initialVelocity || 50,
    angle: props.initialAngle || 45,
    mass: props.initialMass || 10,
    height: props.initialHeight || 0,
    time: 0,
    isPlaying: false,
  };

  const [state, dispatch] = useReducer(projectileReducer, initialState);
  const { velocity, angle, mass, height, time, isPlaying } = state;
  
  const animationFrameRef = useRef<number | undefined>(undefined);
  const lastUpdateTimeRef = useRef<number | undefined>(undefined);
  const diagramContainerRef = useRef<HTMLDivElement>(null);
  const { openExportModal } = useExportModal();
  const { session } = useSession();

  const { trajectoryData, totalTime, maxHeight, range } = useMemo(() => {
    const h0 = height;
    const angleRad = (angle * Math.PI) / 180;
    const v0x = velocity * Math.cos(angleRad);
    const v0y = velocity * Math.sin(angleRad);
    const t_flight = (v0y + Math.sqrt(v0y * v0y + 2 * G * h0)) / G;
    const h_max = h0 + (v0y * v0y) / (2 * G);
    const R = v0x * t_flight;
    
    const data = Array.from({ length: 101 }, (_, i) => {
      const t = (i / 100) * t_flight;
      const x = v0x * t;
      const y = h0 + v0y * t - 0.5 * G * t * t;
      return { x, y: y >= 0 ? y : 0, t };
    });
    return { trajectoryData: data, totalTime: t_flight, maxHeight: h_max, range: R };
  }, [velocity, angle, height]);

  const animate = useCallback((timestamp: number) => {
    if (lastUpdateTimeRef.current === undefined) lastUpdateTimeRef.current = timestamp;
    const deltaTime = (timestamp - lastUpdateTimeRef.current) / 1000;
    const newTime = Math.min(totalTime, time + deltaTime);
    dispatch({ type: 'SET_TIME', payload: newTime });

    if (newTime >= totalTime) {
      dispatch({ type: 'RESET_ANIMATION' });
    } else {
      animationFrameRef.current = requestAnimationFrame(animate);
    }
    lastUpdateTimeRef.current = timestamp;
  }, [totalTime, time]);

  useEffect(() => {
    if (isPlaying) {
      lastUpdateTimeRef.current = performance.now();
      if (time >= totalTime) dispatch({ type: 'SET_TIME', payload: 0 });
      animationFrameRef.current = requestAnimationFrame(animate);
    }
    return () => { if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current); };
  }, [isPlaying, animate, time, totalTime]);
  
  const currentPosition = useMemo(() => {
    const index = Math.min(100, Math.floor((time / totalTime) * 100));
    return trajectoryData[index] || trajectoryData[0];
  }, [time, totalTime, trajectoryData]);

  const energyData = useMemo(() => {
    const totalEnergy = (0.5 * mass * velocity * velocity) + (mass * G * height);
    const gpe = mass * G * (currentPosition.y);
    const ke = totalEnergy - gpe;
    return [{ name: 'Energy', KE: ke >= 0 ? ke : 0, GPE: gpe >= 0 ? gpe : 0 }];
  }, [mass, velocity, height, currentPosition]);

  const getDiagramState = () => ({
    initialVelocity: velocity, initialAngle: angle, initialMass: mass, initialHeight: height
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-1">
        <Card>
          <CardHeader><CardTitle>Projectile Simulator</CardTitle></CardHeader>
          <div className="p-6 space-y-6">
            <div><Label>Initial Height (m): {height}</Label><input type="range" min="0" max="200" value={height} onChange={e => dispatch({ type: 'SET_HEIGHT', payload: Number(e.target.value) })} className="w-full mt-2" disabled={isPlaying}/></div>
            <div><Label>Initial Velocity (m/s): {velocity}</Label><input type="range" min="10" max="100" value={velocity} onChange={e => dispatch({ type: 'SET_VELOCITY', payload: Number(e.target.value) })} className="w-full mt-2" disabled={isPlaying}/></div>
            <div><Label>Launch Angle (°): {angle}</Label><input type="range" min="0" max="90" value={angle} onChange={e => dispatch({ type: 'SET_ANGLE', payload: Number(e.target.value) })} className="w-full mt-2" disabled={isPlaying}/></div>
            <div><Label>Mass (kg): {mass}</Label><input type="range" min="1" max="100" value={mass} onChange={e => dispatch({ type: 'SET_MASS', payload: Number(e.target.value) })} className="w-full mt-2" /></div>
            <div className="text-sm border-t border-neutral-dark/50 pt-4"><h4 className="font-semibold mb-2">Calculated Values</h4><p>Time of Flight: {totalTime.toFixed(2)}s</p><p>Max Height: {maxHeight.toFixed(2)}m</p><p>Range: {range.toFixed(2)}m</p></div>
            <div className="flex gap-2"><Button onClick={() => dispatch({ type: 'TOGGLE_PLAY' })} className="flex-grow">{isPlaying ? <Pause className="mr-2 h-4 w-4"/> : <Play className="mr-2 h-4 w-4"/>}{isPlaying ? 'Pause' : 'Play'}</Button><Button onClick={() => dispatch({ type: 'RESET_ANIMATION' })} variant="outline"><RotateCcw className="h-4 w-4"/></Button></div>
            <div className="flex flex-col gap-2 pt-4 border-t border-neutral-dark/30"><Button onClick={() => openExportModal(diagramContainerRef, 'projectile-motion-graph')}><Save className="mr-2 h-4 w-4" /> Save & Export Image</Button>{session?.isLoggedIn && (<SaveGraphButton diagramName="Projectile Motion & Energy" getDiagramState={getDiagramState} />)}</div>
          </div>
        </Card>
      </div>
      <div ref={diagramContainerRef} data-testid="diagram-container" className="md:col-span-2 space-y-4 bg-background p-2 rounded-[var(--border-radius-apple)]">
        <Card className="h-[60%] !p-4">
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={trajectoryData} margin={{ top: 5, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2}/>
                    <XAxis type="number" dataKey="x" domain={[0, 'dataMax']} allowDataOverflow label={{ value: 'Range (m)', position: 'insideBottom', offset: -10 }} tickFormatter={formatTick} />
                    <YAxis type="number" dataKey="y" domain={[0, 'dataMax']} allowDataOverflow label={{ value: 'Height (m)', angle: -90, position: 'insideLeft' }} tickFormatter={formatTick} />
                    <Tooltip />
                    <Area type="monotone" dataKey="y" name="Trajectory" stroke="var(--color-accent)" fill="var(--color-accent)" fillOpacity={0.2} strokeWidth={2} dot={false} />
                    {currentPosition && <ReferenceDot x={currentPosition.x} y={currentPosition.y} r={8} fill="var(--color-secondary)" stroke="var(--color-background)" strokeWidth={2} ifOverflow="visible" />}
                    <Customized component={<LaunchVector height={height} angle={angle} />} />
                </ComposedChart>
            </ResponsiveContainer>
        </Card>
        <Card className="h-[calc(40%-1rem)] !p-4">
             <h3 className="text-sm font-semibold text-center mb-2">Energy Conservation at Time = {time.toFixed(2)}s</h3>
             <ResponsiveContainer width="100%" height="80%">
                <BarChart data={energyData} layout="vertical" margin={{left: 30}}>
                    <XAxis type="number" hide domain={[0, (0.5 * mass * velocity * velocity) + (mass * G * height)]} />
                    <YAxis type="category" dataKey="name" hide />
                    <Tooltip />
                    <Bar dataKey="KE" name="Kinetic Energy" fill="var(--color-accent)" stackId="energy" />
                    <Bar dataKey="GPE" name="Potential Energy" fill="var(--color-secondary)" stackId="energy" />
                </BarChart>
             </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}