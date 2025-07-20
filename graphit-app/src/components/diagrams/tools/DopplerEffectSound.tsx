// TBD: fix ts warnings and overhaul to recharts
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Play, Pause, Save } from 'lucide-react';
import { useExportModal } from '@/lib/context/ExportModalContext';

const AmbulanceShape = () => (
  <g transform="scale(1.5) translate(-12, -12)">
    <path fillRule="evenodd" clipRule="evenodd" d="M11.79 5.25H8.46L7.71 7.5H3V18h3.027a2.626 2.626 0 0 0 5.196 0h2.304a2.626 2.626 0 0 0 5.196 0H21v-4.901l-2.444-1.63L16.175 7.5H12.54zm-.83 2.25-.25-.75H9.54l-.25.75zm7.537 9H19.5v-2.599l-1.727-1.151H12V9H4.5v7.5h1.753a2.625 2.625 0 0 1 4.744 0h2.756a2.625 2.625 0 0 1 4.744 0M15.325 9l1.35 2.25H13.5V9zM9.75 17.625a1.125 1.125 0 1 1-2.25 0 1.125 1.125 0 0 1 2.25 0m7.5 0a1.125 1.125 0 1 1-2.25 0 1.125 1.125 0 0 1 2.25 0M7.5 9.75v1.5H6v1.5h1.5v1.5H9v-1.5h1.5v-1.5H9v-1.5z" fill="var(--color-text)" stroke="var(--color-text)" strokeWidth="0.5" />
  </g>
);
const RectangleShape = () => <rect x="-30" y="-15" width="60" height="30" fill="var(--color-text)" />;
const sourceShapes: { [key: string]: React.FC } = { ambulance: AmbulanceShape, rectangle: RectangleShape };

const DopplerDiagram = ({ waveCount, waveSpacing, sourceVelocity, sourceShape, position }: any) => {
  const SourceComponent = sourceShapes[sourceShape] || RectangleShape;
  const soundVelocity = 50;
  return (
    <svg viewBox="0 0 500 300" className="w-full h-full bg-neutral-dark/30 rounded-[var(--border-radius-apple)] text-text">
      <g transform={`translate(${position}, 150)`}><SourceComponent /></g>
      {Array.from({ length: waveCount }).map((_, i) => {
        const timeSinceEmission = (i + 1) * (waveSpacing / soundVelocity);
        const emissionPositionX = position - (sourceVelocity * timeSinceEmission);
        const currentRadius = timeSinceEmission * soundVelocity;
        if (currentRadius <= 0) return null;
        return <circle key={i} cx={emissionPositionX} cy={150} r={currentRadius} stroke="var(--color-accent)" fill="none" strokeWidth="1.5" opacity={1 - (i / waveCount) * 0.7} />;
      })}
      <g transform="translate(480, 150)" className="text-xs fill-current text-text"><circle r="5" /><text y="-10" textAnchor="middle" fontWeight="bold">Higher ƒ</text></g>
      <g transform="translate(20, 150)" className="text-xs fill-current text-text"><circle r="5" /><text y="-10" textAnchor="middle" fontWeight="bold">Lower ƒ</text></g>
    </svg>
  );
};

export default function DopplerEffectSound() {
  const [waveCount, setWaveCount] = useState(10);
  const [waveSpacing, setWaveSpacing] = useState(20);
  const [sourceVelocity, setSourceVelocity] = useState(25);
  const [sourceShape, setSourceShape] = useState('ambulance');
  const [position, setPosition] = useState(50);
  const [isPlaying, setIsPlaying] = useState(false);
  const animationFrameId = useRef<number | undefined>();
  const diagramContainerRef = useRef<HTMLDivElement>(null);
  const { openExportModal } = useExportModal();

  useEffect(() => {
    if (isPlaying) {
      const animate = () => {
        setPosition(prev => (prev > 550 ? -50 : prev + sourceVelocity / 15));
        animationFrameId.current = requestAnimationFrame(animate);
      };
      animationFrameId.current = requestAnimationFrame(animate);
    }
    return () => { if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current); };
  }, [isPlaying, sourceVelocity]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-1">
        <Card>
          <CardHeader><CardTitle>Configuration</CardTitle></CardHeader>
          <div className="p-6 space-y-6">
            <Button onClick={() => setIsPlaying(!isPlaying)} variant="outline" className="w-full">{isPlaying ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}{isPlaying ? 'Pause' : 'Play'}</Button>
            <div><Label>Source Position ({position.toFixed(0)})</Label><input type="range" min="0" max="500" value={position} onChange={(e) => setPosition(parseInt(e.target.value))} className="w-full mt-2" disabled={isPlaying} /></div>
            <div><Label>Source Velocity ({sourceVelocity})</Label><input type="range" min="-45" max="45" value={sourceVelocity} onChange={(e) => setSourceVelocity(parseInt(e.target.value))} className="w-full mt-2" /></div>
            <div><Label>Number of Waves</Label><Input type="number" min="5" max="50" value={waveCount} onChange={(e) => setWaveCount(Math.max(5, parseInt(e.target.value) || 5))} className="mt-2" /></div>
            <div><Label>Wave Spacing ({waveSpacing}px)</Label><input type="range" min="10" max="50" value={waveSpacing} onChange={(e) => setWaveSpacing(parseInt(e.target.value))} className="w-full mt-2" /></div>
            <div><Label>Source Shape</Label><Select value={sourceShape} onChange={(e) => setSourceShape(e.target.value)} className="mt-2"><option value="ambulance">Ambulance</option><option value="rectangle">Rectangle</option></Select></div>
            <Button onClick={() => openExportModal(diagramContainerRef, 'doppler-effect')} className="w-full !mt-8">
              <Save className="mr-2 h-4 w-4" /> Save & Export
            </Button>
          </div>
        </Card>
      </div>
      <div className="md:col-span-2 min-h-[400px] md:min-h-0">
        <Card className="h-full !p-2">
          <div ref={diagramContainerRef} data-testid="diagram-container">
            <DopplerDiagram 
              waveCount={waveCount} 
              waveSpacing={waveSpacing} 
              sourceVelocity={sourceVelocity} 
              sourceShape={sourceShape} 
              position={position} 
            />
          </div>
        </Card>
      </div>
    </div>
  );
}