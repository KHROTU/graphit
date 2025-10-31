'use client';

import React, { useState, useMemo, useRef } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Label } from '@/components/ui/Label';
import { Button } from '@/components/ui/Button';
import { Save } from 'lucide-react';
import { useExportModal } from '@/lib/context/ExportModalContext';
import { ComposedChart, Scatter, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useSession } from '@/lib/hooks/useSession';
import SaveGraphButton from '@/components/shared/SaveGraphButton';

interface LinearRegressionProps {
  initialCsvData?: string;
}

const defaultData = `Height,Weight\n150,55\n155,60\n160,62\n165,68\n170,72\n175,75\n180,80\n185,85`;

export default function LinearRegressionGraph({ initialCsvData = defaultData }: LinearRegressionProps) {
  const [csvData, setCsvData] = useState(initialCsvData);
  const diagramContainerRef = useRef<HTMLDivElement>(null);
  const { openExportModal } = useExportModal();
  const { session } = useSession();

  const { data, headers, regressionLine, equation } = useMemo(() => {
    const lines = csvData.split('\n').filter(line => line.trim() !== '');
    const headerRow = lines[0]?.split(',').map(h => h.trim()) || ['x', 'y'];
    if (lines.length < 2) return { data: [], headers: headerRow, regressionLine: null, equation: '' };
    
    const points = lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim());
      const x = parseFloat(values[0]);
      const y = parseFloat(values[1]);
      return (isNaN(x) || isNaN(y)) ? null : { x, y };
    }).filter(p => p !== null) as { x: number; y: number }[];

    if (points.length < 2) return { data: points, headers: headerRow, regressionLine: null, equation: '' };
    
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    const n = points.length;
    for (const p of points) { sumX += p.x; sumY += p.y; sumXY += p.x * p.y; sumXX += p.x * p.x; }
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    const xMin = Math.min(...points.map(p => p.x));
    const xMax = Math.max(...points.map(p => p.x));
    const line = isNaN(slope) || isNaN(intercept) ? null : [ { x: xMin, y: slope * xMin + intercept }, { x: xMax, y: slope * xMax + intercept } ];
    const eq = `y = ${slope.toFixed(2)}x + ${intercept.toFixed(2)}`;

    return { data: points, headers: headerRow, regressionLine: line, equation: eq };
  }, [csvData]);

  const getDiagramState = () => ({ initialCsvData: csvData });

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-1">
        <Card>
          <CardHeader><CardTitle>Scatter Plot & Regression</CardTitle></CardHeader>
          <div className="p-6 space-y-4">
            <Label>Data (CSV Format)</Label>
            <textarea value={csvData} onChange={e => setCsvData(e.target.value)} rows={8} className="w-full mt-1 p-2 bg-transparent border border-neutral-dark rounded-apple text-sm font-mono"/>
            {equation && <div className="text-sm border-t border-neutral-dark/50 pt-4"><h4 className="font-semibold mb-2">Regression Line</h4><p className="font-mono text-accent">{equation}</p></div>}
            <div className="flex flex-col gap-2 pt-4 border-t border-neutral-dark/30">
              <Button onClick={() => openExportModal(diagramContainerRef, 'linear-regression-graph')}><Save className="mr-2 h-4 w-4" /> Save & Export Image</Button>
              {session?.isLoggedIn && (<SaveGraphButton diagramName="Scatter Diagrams & Regression" getDiagramState={getDiagramState} />)}
            </div>
          </div>
        </Card>
      </div>
      <div className="md:col-span-2 min-h-[500px]">
        <Card className="h-full !p-4" ref={diagramContainerRef} data-testid="diagram-container">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2}/>
                <XAxis type="number" dataKey="x" name={headers[0]} domain={['dataMin', 'dataMax']} label={{ value: headers[0], position: 'insideBottom', offset: -10 }} />
                <YAxis type="number" dataKey="y" name={headers[1]} domain={['dataMin', 'dataMax']} label={{ value: headers[1], angle: -90, position: 'insideLeft' }}/>
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <Legend />
                <Scatter name="Data Set" data={data} fill="var(--color-accent)" />
                {regressionLine && (<Line data={regressionLine} dataKey="y" stroke="var(--color-secondary)" strokeWidth={2} dot={false} name="Line of Best Fit" legendType="line" />)}
              </ComposedChart>
            </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}