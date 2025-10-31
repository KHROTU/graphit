'use client';

import React, { useReducer, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Play, Pause, Save, RotateCcw } from 'lucide-react';
import { useExportModal } from '@/lib/context/ExportModalContext';
import { useSession } from '@/lib/hooks/useSession';
import SaveGraphButton from '@/components/shared/SaveGraphButton';
import { SliderControl } from '../controls/SliderControl';
import { SelectControl } from '../controls/SelectControl';
import { InputControl } from '../controls/InputControl';

type SourceShape = 'ambulance' | 'rectangle';
interface DopplerProps {
  initialWaveCount?: number; initialWaveSpacing?: number; initialSourceVelocity?: number;
  initialSourceShape?: SourceShape; initialPosition?: number;
}

type State = {
    waveCount: number; waveSpacing: number; sourceVelocity: number; sourceShape: SourceShape;
    position: number; isPlaying: boolean;
};
type Action = 
    | { type: 'SET_PARAM', payload: { key: keyof State, value: string | number | boolean } }
    | { type: 'SET_POSITION', payload: number }
    | { type: 'TOGGLE_PLAY' }
    | { type: 'RESET' };

function reducer(state: State, action: Action): State {
    switch (action.type) {
        case 'SET_PARAM': return { ...state, [action.payload.key]: action.payload.value };
        case 'SET_POSITION': return { ...state, position: action.payload };
        case 'TOGGLE_PLAY': return { ...state, isPlaying: !state.isPlaying };
        case 'RESET': return { ...state, position: 50, isPlaying: false };
        default: return state;
    }
}

const AmbulanceShape = () => (
  <g transform="scale(1.5) translate(-12, -12)">
    <path fillRule="evenodd" clipRule="evenodd" d="M11.79 5.25H8.46L7.71 7.5H3V18h3.027a2.626 2.626 0 0 0 5.196 0h2.304a2.626 2.626 0 0 0 5.196 0H21v-4.901l-2.444-1.63L16.175 7.5H12.54zm-.83 2.25-.25-.75H9.54l-.25.75zm7.537 9H19.5v-2.599l-1.727-1.151H12V9H4.5v7.5h1.753a2.625 2.625 0 0 1 4.744 0h2.756a2.625 2.625 0 0 1 4.744 0M15.325 9l1.35 2.25H13.5V9zM9.75 17.625a1.125 1.125 0 1 1-2.25 0 1.125 1.125 0 0 1 2.25 0m7.5 0a1.125 1.125 0 1 1-2.25 0 1.125 1.125 0 0 1 2.25 0M7.5 9.75v1.5H6v1.5h1.5v1.5H9v-1.5h1.5v-1.5H9v-1.5z" fill="var(--color-text)" stroke="var(--color-text)" strokeWidth="0.5" />
  </g>
);
const RectangleShape = () => <rect x="-30" y="-15" width="60" height="30" fill="var(--color-text)" />;
const sourceShapes: { [key in SourceShape]: React.FC } = { ambulance: AmbulanceShape, rectangle: RectangleShape };

const DopplerDiagram = (props: State) => {
  const SourceComponent = sourceShapes[props.sourceShape] || RectangleShape;
  const soundVelocity = 50;
  return (
    <svg viewBox="0 0 500 300" className="w-full h-full bg-neutral-dark/30 rounded-[var(--border-radius-apple)] text-text">
      <g transform={`translate(${props.position}, 150)`}><SourceComponent /></g>
      {Array.from({ length: props.waveCount }).map((_, i) => {
        const timeSinceEmission = (i + 1) * (props.waveSpacing / soundVelocity);
        const emissionPositionX = props.position - (props.sourceVelocity * timeSinceEmission);
        const currentRadius = timeSinceEmission * soundVelocity;
        if (currentRadius <= 0) return null;
        return <circle key={i} cx={emissionPositionX} cy={150} r={currentRadius} stroke="var(--color-accent)" fill="none" strokeWidth="1.5" opacity={1 - (i / props.waveCount) * 0.7} />;
      })}
      <g transform="translate(480, 150)" className="text-xs fill-current text-text"><circle r="5" /><text y="-10" textAnchor="middle" fontWeight="bold">Higher ƒ</text></g>
      <g transform="translate(20, 150)" className="text-xs fill-current text-text"><circle r="5" /><text y="-10" textAnchor="middle" fontWeight="bold">Lower ƒ</text></g>
    </svg>
  );
};

export default function DopplerEffectSound(props: DopplerProps) {
  const initialState: State = {
    waveCount: props.initialWaveCount || 10, waveSpacing: props.initialWaveSpacing || 20,
    sourceVelocity: props.initialSourceVelocity || 25, sourceShape: props.initialSourceShape || 'ambulance',
    position: props.initialPosition || 50, isPlaying: false
  };
  const [state, dispatch] = useReducer(reducer, initialState);
  const { isPlaying, sourceVelocity, position } = state;
  
  const animationFrameId = useRef<number | undefined>(undefined);
  const diagramContainerRef = useRef<HTMLDivElement>(null);
  const { openExportModal } = useExportModal();
  const { session } = useSession();

  useEffect(() => {
    if (isPlaying) {
      const animate = () => {
        dispatch({type: 'SET_POSITION', payload: position > 550 ? -50 : position + sourceVelocity / 15});
        animationFrameId.current = requestAnimationFrame(animate);
      };
      animationFrameId.current = requestAnimationFrame(animate);
    }
    return () => { if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current); };
  }, [isPlaying, sourceVelocity, position]);

  const getDiagramState = () => ({
    initialWaveCount: state.waveCount, initialWaveSpacing: state.waveSpacing,
    initialSourceVelocity: state.sourceVelocity, initialSourceShape: state.sourceShape,
    initialPosition: state.position,
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-1">
        <Card>
          <CardHeader><CardTitle>Configuration</CardTitle></CardHeader>
          <div className="p-6 space-y-6">
            <div className="flex gap-2"><Button onClick={() => dispatch({type: 'TOGGLE_PLAY'})} variant="outline" className="w-full">{isPlaying ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}{isPlaying ? 'Pause' : 'Play'}</Button><Button onClick={() => dispatch({type: 'RESET'})} variant="outline" size="icon"><RotateCcw className="h-4 w-4"/></Button></div>
            <SliderControl label="Source Position" value={Number(position.toFixed(0))} min={0} max={500} step={1} onChange={(val) => dispatch({type: 'SET_POSITION', payload: val})} disabled={isPlaying} />
            <SliderControl label="Source Velocity" value={sourceVelocity} min={-45} max={45} step={1} onChange={(val) => dispatch({type: 'SET_PARAM', payload: {key: 'sourceVelocity', value: val}})} />
            <InputControl label="Number of Waves" type="number" min={5} max={50} value={state.waveCount} onChange={(e) => dispatch({type: 'SET_PARAM', payload: {key: 'waveCount', value: Math.max(5, parseInt(e.target.value) || 5)}})} />
            <SliderControl label="Wave Spacing" unit="px" value={state.waveSpacing} min={10} max={50} step={1} onChange={(val) => dispatch({type: 'SET_PARAM', payload: {key: 'waveSpacing', value: val}})} />
            <SelectControl label="Source Shape" value={state.sourceShape} onValueChange={(val) => dispatch({type: 'SET_PARAM', payload: {key: 'sourceShape', value: val}})} options={[{value: 'ambulance', label: 'Ambulance'}, {value: 'rectangle', label: 'Rectangle'}]} />
            <div className="flex flex-col gap-2 pt-4 border-t border-neutral-dark/30">
                <Button onClick={() => openExportModal(diagramContainerRef, 'doppler-effect-sound')}>
                  <Save className="mr-2 h-4 w-4" /> Save & Export Image
                </Button>
                {session?.isLoggedIn && ( <SaveGraphButton diagramName="Doppler Effect Simulator" getDiagramState={getDiagramState} /> )}
            </div>
          </div>
        </Card>
      </div>
      <div className="md:col-span-2 min-h-[400px] md:min-h-0">
        <Card className="h-full !p-2">
          <div ref={diagramContainerRef} data-testid="diagram-container">
            <DopplerDiagram {...state} />
          </div>
        </Card>
      </div>
    </div>
  );
}