'use client';

import React, { useState, useMemo, useRef } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Label } from '@/components/ui/Label';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Save } from 'lucide-react';
import { useExportModal } from '@/lib/context/ExportModalContext';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useSession } from '@/lib/hooks/useSession';
import SaveGraphButton from '@/components/shared/SaveGraphButton';
import { parse } from 'mathjs';

interface IntegrationProps {
  initialEquation?: string;
  initialStrips?: number;
  initialLowerBound?: number;
  initialUpperBound?: number;
}

export default function NumericalIntegrationGraph({ initialEquation = 'x^2 + 2', initialStrips = 4, initialLowerBound = 0, initialUpperBound = 8 }: IntegrationProps) {
  const [equation, setEquation] = useState(initialEquation);
  const [strips, setStrips] = useState(initialStrips);
  const [lowerBound, setLowerBound] = useState(initialLowerBound);
  const [upperBound, setUpperBound] = useState(initialUpperBound);
  const diagramContainerRef = useRef<HTMLDivElement>(null);
  const { openExportModal } = useExportModal();
  const { session } = useSession();

  const { curveData, trapezoids, area, exactArea } = useMemo(() => {
    let fn;
    try {
      fn = parse(equation).compile();
    } catch {
      return { curveData: [], trapezoids: [], area: 0, exactArea: NaN };
    }
    
    const data = [];
    const step = (upperBound - lowerBound) / 100;
    for (let x = lowerBound; x <= upperBound; x += step) {
      data.push({ x, y: fn.evaluate({ x }) });
    }
    
    const stripWidth = (upperBound - lowerBound) / strips;
    let currentArea = 0;
    const trapz = [];
    for (let i = 0; i < strips; i++) {
      const x1 = lowerBound + i * stripWidth;
      const x2 = lowerBound + (i + 1) * stripWidth;
      const y1 = fn.evaluate({ x: x1 });
      const y2 = fn.evaluate({ x: x2 });
      currentArea += ((y1 + y2) / 2) * stripWidth;
      trapz.push({ x: x1, y: y1, x2: x2, y2: y2 });
    }
    
    // Rudimentary exact area for polynomials like x^n
    let exArea = NaN;
    if (equation.match(/^x\^(\d+)/)) {
        const n = Number(equation.match(/^x\^(\d+)/)?.[1]);
        const integral = (x:number) => Math.pow(x, n + 1) / (n + 1);
        exArea = integral(upperBound) - integral(lowerBound);
    } else if (equation.match(/^\d+$/)) {
        exArea = Number(equation) * (upperBound - lowerBound);
    }
    
    return { curveData: data, trapezoids: trapz, area: currentArea, exactArea: exArea };
  }, [equation, strips, lowerBound, upperBound]);

  const getDiagramState = () => ({ initialEquation: equation, initialStrips: strips, initialLowerBound: lowerBound, initialUpperBound: upperBound });

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-1">
        <Card>
          <CardHeader><CardTitle>Trapezium Rule Integration</CardTitle></CardHeader>
          <div className="p-6 space-y-4">
            <div><Label>Function y =</Label><Input value={equation} onChange={e => setEquation(e.target.value)} /></div>
            <div><Label>Number of Strips: {strips}</Label><input type="range" min="1" max="20" value={strips} onChange={e => setStrips(Number(e.target.value))} className="w-full" /></div>
            <div className="flex gap-2"><div className="flex-1"><Label>Lower Bound</Label><Input type="number" value={lowerBound} onChange={e => setLowerBound(Number(e.target.value))} /></div><div className="flex-1"><Label>Upper Bound</Label><Input type="number" value={upperBound} onChange={e => setUpperBound(Number(e.target.value))} /></div></div>
            <div className="text-sm border-t border-neutral-dark/50 pt-4"><h4 className="font-semibold mb-2">Area Approximation</h4><p>Estimated Area: <span className="font-mono text-accent">{area.toFixed(4)}</span></p>{!isNaN(exactArea) && <p>Exact Area: <span className="font-mono text-secondary">{exactArea.toFixed(4)}</span></p>}</div>
            <div className="flex flex-col gap-2 pt-4 border-t border-neutral-dark/30"><Button onClick={() => openExportModal(diagramContainerRef, 'numerical-integration-graph')}><Save className="mr-2 h-4 w-4"/> Save & Export Image</Button>{session?.isLoggedIn && (<SaveGraphButton diagramName="Numerical Integration" getDiagramState={getDiagramState} />)}</div>
          </div>
        </Card>
      </div>
      <div className="md:col-span-2 min-h-[500px]">
        <Card className="h-full !p-4">
          <div ref={diagramContainerRef} data-testid="diagram-container" className="w-full h-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={curveData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2}/>
                <XAxis type="number" dataKey="x" domain={[lowerBound, upperBound]} />
                <YAxis domain={[0, 'dataMax + 10']} />
                <Tooltip />
                <Area type="monotone" dataKey="y" stroke="var(--color-accent)" fill="var(--color-accent)" fillOpacity={0.3} strokeWidth={2} name={equation} dot={false} />
                {trapezoids.map((trap, i) => (<ReferenceLine key={i} segment={[{ x: trap.x, y: 0 }, { x: trap.x, y: trap.y }]} stroke="var(--color-secondary)" strokeDasharray="2 2" />))}
                {trapezoids.map((trap, i) => (<ReferenceLine key={i} segment={[{ x: trap.x, y: trap.y }, { x: trap.x2, y: trap.y2 }]} stroke="var(--color-secondary)" />))}
                <ReferenceLine x={upperBound} stroke="var(--color-secondary)" strokeDasharray="2 2" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}